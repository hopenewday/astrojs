/**
 * Image Optimizer Utility
 * 
 * This utility provides enhanced image optimization capabilities,
 * including AVIF format support, responsive image generation,
 * and performance optimizations.
 */

import { getImageWithFailover } from './cdnFailover';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { startHealthMonitor, getHealthMetrics } from './cdnHealthMonitor';

// Types for image optimization options
export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  aspectRatio?: string;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  cloudflare?: boolean; // Flag to use Cloudflare's image optimization service
}

// Cache directory for optimized images
const CACHE_DIR = path.join(process.cwd(), '.image-cache');

// Initialize CDN health monitor on module load
startHealthMonitor({
  checkInterval: 120000, // Check every 2 minutes
  logLevel: 'info'
});

/**
 * Ensure the cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create image cache directory:', error);
  }
}

/**
 * Generate a cache key for an image with specific options
 * @param src Image source URL
 * @param options Optimization options
 * @returns Cache key string
 */
function generateCacheKey(src: string, options: OptimizationOptions): string {
  const optionsStr = JSON.stringify(options);
  const hash = Buffer.from(`${src}:${optionsStr}`).toString('base64')
    .replace(/[/+=]/g, '_');
  return hash;
}

/**
 * Check if an image exists in the cache
 * @param cacheKey Cache key for the image
 * @param format Image format
 * @returns Path to the cached image or null if not found
 */
async function checkCache(cacheKey: string, format: string): Promise<string | null> {
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.${format}`);
  try {
    await fs.access(cachePath);
    return cachePath;
  } catch {
    return null;
  }
}

/**
 * Optimize an image with the specified options
 * @param src Image source URL
 * @param options Optimization options
 * @returns URL to the optimized image
 */
export async function optimizeImage(src: string, options: OptimizationOptions = {}): Promise<string> {
  // Ensure format is specified
  const format = options.format || 'auto';
  
  // For 'auto' format, we'll determine the best format based on browser support
  // This is handled client-side in the image component
  if (format === 'auto') {
    // Default to the CDN failover system which handles format negotiation
    return getImageWithFailover(src, options);
  }
  
  // Check if we should use Cloudflare's image optimization service
  if (options.cloudflare) {
    return getCloudflareOptimizedImage(src, options);
  }
  
  // For server-side optimization with specific formats
  // Generate a cache key for this image and options
  const cacheKey = generateCacheKey(src, options);
  
  // Check if the image is already in the cache
  await ensureCacheDir();
  const cachedPath = await checkCache(cacheKey, format);
  if (cachedPath) {
    // Return the cached image as a data URL or local path
    // In a real implementation, you'd serve this from a local URL
    return cachedPath;
  }
  
  // Try to use the web worker for image optimization
  try {
    // Dynamically import the worker integration to avoid circular dependencies
    const { processImageWithWorker } = await import('./imageWorkerIntegration');
    
    // Determine the operation based on options
    const operation = options.crop ? 'crop' : 'resize';
    
    // Process the image in the worker
    const result = await processImageWithWorker(src, operation, options);
    
    // Save the result to the cache
    if (result.processed) {
      const cachePath = path.join(CACHE_DIR, `${cacheKey}.${format}`);
      await fs.writeFile(cachePath, Buffer.from(result.data));
      return cachePath;
    }
  } catch (workerError) {
    console.warn('Failed to use worker for image optimization, falling back to main thread:', workerError);
    // Continue with main thread implementation
  }
  
  try {
    // Fetch the image using the failover system
    const imageUrl = await getImageWithFailover(src, { ...options, format: 'jpg' });
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Process the image with sharp
    let sharpInstance = sharp(buffer);
    
    // Apply resizing if width or height is specified
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize({
        width: options.width,
        height: options.height,
        fit: options.crop === 'force' ? 'fill' : 'cover',
        position: options.focus || 'center',
      });
    }
    
    // Apply format-specific optimizations
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.${format}`);
    
    switch (format) {
      case 'avif':
        await sharpInstance
          .avif({
            quality: options.quality || 80,
            effort: 4, // Medium effort for good balance of speed/quality
          })
          .toFile(cachePath);
        break;
        
      case 'webp':
        await sharpInstance
          .webp({
            quality: options.quality || 80,
            effort: 4,
          })
          .toFile(cachePath);
        break;
        
      case 'png':
        await sharpInstance
          .png({
            quality: options.quality || 80,
            compressionLevel: 8,
          })
          .toFile(cachePath);
        break;
        
      case 'jpg':
      default:
        await sharpInstance
          .jpeg({
            quality: options.quality || 80,
            mozjpeg: true, // Use mozjpeg for better compression
          })
          .toFile(cachePath);
        break;
    }
    
    return cachePath;
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Fall back to the CDN failover system
    return getImageWithFailover(src, options);
  }
}

/**
 * Generate a set of responsive images for different viewport sizes
 * @param src Image source URL
 * @param widths Array of widths to generate
 * @param options Base optimization options
 * @returns Array of URLs to the responsive images
 */
export async function generateResponsiveImages(
  src: string,
  widths: number[],
  options: OptimizationOptions = {}
): Promise<string[]> {
  const urls: string[] = [];
  
  // Process each width in parallel
  const promises = widths.map(async (width) => {
    const url = await optimizeImage(src, {
      ...options,
      width,
    });
    return { width, url };
  });
  
  // Wait for all optimizations to complete
  const results = await Promise.all(promises);
  
  // Sort by width and return the URLs
  return results
    .sort((a, b) => a.width - b.width)
    .map((result) => result.url);
}

/**
 * Detect if the browser supports AVIF format
 * This function is meant to be used client-side
 * @returns Promise that resolves to true if AVIF is supported
 */
export async function detectAvifSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check if we've already tested and cached the result
  try {
    const cachedResult = localStorage.getItem('avif-support');
    if (cachedResult !== null) {
      return cachedResult === 'true';
    }
  } catch (e) {
    // localStorage might not be available in some contexts
    console.warn('Failed to access localStorage for AVIF support check:', e);
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Cache the positive result for future checks
      try {
        localStorage.setItem('avif-support', 'true');
      } catch (e) {
        // Ignore localStorage errors
      }
      resolve(true);
    };
    img.onerror = () => {
      // Cache the negative result for future checks
      try {
        localStorage.setItem('avif-support', 'false');
      } catch (e) {
        // Ignore localStorage errors
      }
      resolve(false);
    };
    
    // Use a small, valid AVIF test image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Get an optimized image URL from Cloudflare's image optimization service
 * @param src Original image URL
 * @param options Optimization options
 * @returns Optimized image URL
 */
export function getCloudflareOptimizedImage(src: string, options: OptimizationOptions = {}): string {
  // Check if we're using Cloudflare Pages or Workers
  const cfImageBaseUrl = import.meta.env.CLOUDFLARE_IMAGE_URL || '/cdn-image';
  
  // Build the query parameters for Cloudflare's image optimization service
  const params = new URLSearchParams();
  
  // Add width and height if specified
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  
  // Add quality if specified
  if (options.quality) params.append('quality', options.quality.toString());
  
  // Add format if specified
  if (options.format && options.format !== 'auto') {
    params.append('format', options.format);
  }
  
  // Add fit parameter based on crop option
  if (options.crop) {
    switch (options.crop) {
      case 'force':
        params.append('fit', 'fill');
        break;
      case 'at_least':
        params.append('fit', 'contain');
        break;
      case 'at_max':
        params.append('fit', 'scale-down');
        break;
      default:
        params.append('fit', 'cover');
    }
  }
  
  // Add position parameter based on focus option
  if (options.focus) {
    params.append('position', options.focus.replace('_', '-'));
  }
  
  // Encode the source URL
  const encodedSrc = encodeURIComponent(src);
  
  // Construct the final URL
  return `${cfImageBaseUrl}?url=${encodedSrc}&${params.toString()}`;
}

/**
 * Get the current CDN health status
 * @returns Health metrics object
 */
export function getCdnHealthStatus() {
  return getHealthMetrics();
}';
  });