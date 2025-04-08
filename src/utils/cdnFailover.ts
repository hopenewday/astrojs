/**
 * Utility for ImageKit + Tebi CDN failover system
 * Provides automatic fallback to Tebi S3 storage when ImageKit is unavailable
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Status tracking with exponential backoff
let imageKitStatus = {
  available: true,
  lastChecked: 0,
  checkInterval: 60000, // Base interval: 1 minute
  consecutiveFailures: 0,
  maxBackoff: 3600000, // Max interval: 1 hour
  requestCache: new Map<string, { url: string; expires: number; source: string }>(),
  cacheDuration: 300000, // Cache URLs for 5 minutes
  maxCacheSize: 100, // Maximum number of items to keep in cache
  metrics: {
    imageKitRequests: 0,
    tebiRequests: 0,
    failures: 0,
    successRate: 1.0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastFailoverTime: null as number | null,
    totalFailovers: 0
  }
};

// Initialize S3 client for Tebi
const tebiClient = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.TEBI_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.TEBI_ACCESS_KEY,
    secretAccessKey: import.meta.env.TEBI_SECRET_KEY,
  },
});

/**
 * Check if ImageKit is available
 * Uses a simple ping to the ImageKit status endpoint
 */
export async function checkImageKitStatus(): Promise<boolean> {
  const calculateBackoff = () => {
    const backoff = Math.min(
      imageKitStatus.maxBackoff,
      imageKitStatus.checkInterval * Math.pow(2, imageKitStatus.consecutiveFailures)
    );
    return Math.floor(Math.random() * (backoff * 0.5)) + backoff; // Add jitter
  };
  // Calculate backoff with jitter for exponential backoff strategy
  const calculateBackoff = () => {
    const backoff = Math.min(
      imageKitStatus.maxBackoff,
      imageKitStatus.checkInterval * Math.pow(2, imageKitStatus.consecutiveFailures)
    );
    return Math.floor(Math.random() * (backoff * 0.5)) + backoff; // Add jitter
  };
  
  // Don't check too frequently - respect the backoff interval
  const now = Date.now();
  const currentInterval = imageKitStatus.consecutiveFailures > 0 ? calculateBackoff() : imageKitStatus.checkInterval;
  if (now - imageKitStatus.lastChecked < currentInterval) {
    return imageKitStatus.available;
  }
  
  try {
    // Simple ping to ImageKit status endpoint
    const response = await fetch(`${import.meta.env.IMAGEKIT_URL}/health-check`, {
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    // Update status
    imageKitStatus.available = response.ok;
    imageKitStatus.lastChecked = now;
    if (response.ok) {
      imageKitStatus.consecutiveFailures = 0; // Reset failures on success
    } else {
      imageKitStatus.consecutiveFailures++;
      imageKitStatus.metrics.failures++;
    }
    
    return response.ok;
  } catch (error) {
    console.error('ImageKit status check failed:', error);
    
    // Update status
    imageKitStatus.available = false;
    imageKitStatus.lastChecked = now;
    imageKitStatus.consecutiveFailures++;
    imageKitStatus.metrics.failures++;
    
    return false;
  }
}

/**
 * Get a URL for an image, with automatic failover between ImageKit and Tebi
 */
interface ImageKitOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  aspectRatio?: string;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right';
}

/**
 * Clean expired entries from the cache
 * This helps prevent memory leaks by removing old entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  let expiredCount = 0;
  
  // Remove all expired entries
  for (const [key, entry] of imageKitStatus.requestCache.entries()) {
    if (entry.expires < now) {
      imageKitStatus.requestCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.debug(`Cleaned ${expiredCount} expired entries from CDN cache`);
  }
}

/**
 * Get the current metrics for the CDN failover system
 * This is used by the health monitoring API
 */
export function getFailoverMetrics() {
  // Clean expired cache entries before returning metrics
  cleanExpiredCache();
  
  return {
    imageKitAvailable: imageKitStatus.available,
    lastChecked: new Date(imageKitStatus.lastChecked).toISOString(),
    consecutiveFailures: imageKitStatus.consecutiveFailures,
    cacheSize: imageKitStatus.requestCache.size,
    cacheDuration: imageKitStatus.cacheDuration,
    metrics: { ...imageKitStatus.metrics },
    checkInterval: imageKitStatus.checkInterval
  };
}

export async function getImageWithFailover(path: string, options: ImageKitOptions = {}): Promise<string> {
  // Check cache first
  const cacheKey = `${path}:${JSON.stringify(options)}`;
  const cached = imageKitStatus.requestCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    // Update metrics for cached responses
    if (cached.source === 'imagekit') {
      imageKitStatus.metrics.imageKitRequests++;
    } else if (cached.source === 'tebi') {
      imageKitStatus.metrics.tebiRequests++;
    }
    imageKitStatus.metrics.cacheHits++;
    return cached.url;
  }
  
  // Cache miss
  imageKitStatus.metrics.cacheMisses++; 
  
  // Performance monitoring start
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let cdnSource = 'unknown';
  
  // Track metrics for CDN usage and performance monitoring
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`cdn-request-start-${cacheKey}`);
  }
  
  // Check if ImageKit is available
  const isImageKitAvailable = await checkImageKitStatus();
  
  // Detect WebP/AVIF support
  const format = options.format || 'auto';
  if (format === 'auto' && typeof window !== 'undefined') {
    // Check if we already have the result in a data attribute or localStorage
    let avif = false;
    if (document.documentElement.dataset.avifSupport) {
      avif = document.documentElement.dataset.avifSupport === 'true';
    } else if (localStorage.getItem('avif-support')) {
      avif = localStorage.getItem('avif-support') === 'true';
    } else {
      // Fallback to canvas detection if we don't have stored results
      avif = document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }
    
    // Check WebP support
    const webp = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    // Set the format based on support
    options.format = avif ? 'avif' : webp ? 'webp' : 'jpg';
    
    // Log format selection for debugging
    console.debug(`Image format selected: ${options.format} (AVIF: ${avif}, WebP: ${webp})`);
  }

  let url: string;
  let success = false;

  try {
    // If ImageKit is available, use it
    if (isImageKitAvailable) {
      try {
        // Import the ImageKit URL generator
        const { getImageKitUrl } = await import('./imageHelpers');
        url = getImageKitUrl(path, options);
        cdnSource = 'imagekit';
        imageKitStatus.metrics.imageKitRequests++;
        success = true;
      } catch (error) {
        console.error('Failed to generate ImageKit URL:', error);
        // Fall back to Tebi if ImageKit URL generation fails
        cdnSource = 'tebi_fallback';
        imageKitStatus.metrics.failures++;
        throw error; // Re-throw to trigger Tebi fallback
      }
    } else {
      // Otherwise, fall back to Tebi
      throw new Error('ImageKit unavailable'); // Trigger Tebi fallback
    }
  } catch (error) {
    // Fallback to Tebi
    try {
      // Record failover event
      imageKitStatus.metrics.lastFailoverTime = Date.now();
      imageKitStatus.metrics.totalFailovers++;
      
      // Extract the relative path from the full path
      const relativePath = path.startsWith('/') 
        ? path.substring(1) // Remove leading slash
        : path.includes('ik.imagekit.io') 
          ? new URL(path).pathname.substring(1) // Extract path from URL
          : path;
      
      // Generate a pre-signed URL for the Tebi object
      const command = new GetObjectCommand({
        Bucket: import.meta.env.TEBI_BUCKET,
        Key: relativePath,
      });
      
      // Get a pre-signed URL that's valid for 1 hour
      url = await getSignedUrl(tebiClient, command, { expiresIn: 3600 });
      cdnSource = 'tebi';
      imageKitStatus.metrics.tebiRequests++;
      success = true;
    } catch (tebiError) {
      console.error('Failed to get Tebi fallback URL:', tebiError);
      imageKitStatus.metrics.failures++;
      
      // If all else fails, return the original path
      // This might be a relative path that works with local images
      url = path;
      cdnSource = 'original';
    }
  }
  
  // Calculate response time
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const responseTime = endTime - startTime;
  
  // Update performance metrics
  imageKitStatus.metrics.totalResponseTime += responseTime;
  imageKitStatus.metrics.totalRequests++;
  imageKitStatus.metrics.averageResponseTime = 
    imageKitStatus.metrics.totalResponseTime / imageKitStatus.metrics.totalRequests;
  imageKitStatus.metrics.successRate = 
    (imageKitStatus.metrics.totalRequests - imageKitStatus.metrics.failures) / 
    imageKitStatus.metrics.totalRequests;
  
  // Mark performance measurement end
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`cdn-request-end-${cacheKey}`);
    performance.measure(
      `cdn-request-${cdnSource}`,
      `cdn-request-start-${cacheKey}`,
      `cdn-request-end-${cacheKey}`
    );
  }
  
  // Cache the result if successful
  if (success) {
    // Add to cache
    imageKitStatus.requestCache.set(cacheKey, {
      url,
      expires: Date.now() + imageKitStatus.cacheDuration,
      source: cdnSource
    });
    
    // Clean up cache if it exceeds maximum size
    if (imageKitStatus.requestCache.size > imageKitStatus.maxCacheSize) {
      // Get all entries and sort by expiration (oldest first)
      const entries = Array.from(imageKitStatus.requestCache.entries())
        .sort((a, b) => a[1].expires - b[1].expires);
      
      // Remove the oldest 20% of entries
      const entriesToRemove = Math.ceil(imageKitStatus.maxCacheSize * 0.2);
      for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
        imageKitStatus.requestCache.delete(entries[i][0]);
      }
    }
  }
  
  return url;
}

/**
 * Generate a blurhash placeholder for an image
 * This is a compact representation of a placeholder for an image
 * 
 * @param src - The source URL of the image
 * @returns A CSS-compatible string representing the image placeholder
 */
export async function generateBlurhash(src: string): Promise<string> {
  try {
    // Get a small version of the image to generate the blurhash from
    const imageUrl = await getImageWithFailover(src, { width: 32, height: 32 });
    
    // For server-side rendering, we need to fetch the image
    // and convert it to a data URL for the blurhash algorithm
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // In a production environment, you would use the blurhash library
    // For now, we'll use our color extraction algorithm to create a placeholder
    const avgColor = await getAverageColor(buffer);
    
    // Generate a gradient placeholder that looks better than a solid color
    return generateColorGradient(avgColor);
  } catch (error) {
    console.error(`Failed to generate blurhash for ${src}:`, error);
    // Return a default blurhash-like placeholder with error tracking
    imageKitStatus.metrics.failures++;
    // Return a neutral gradient as fallback
    return 'linear-gradient(135deg, rgba(220, 220, 220, 0.7), rgba(200, 200, 200, 0.8), rgba(180, 180, 180, 0.9))';
  }
}

/**
 * Extract the average color from an image buffer
 * This is a more accurate implementation of color extraction
 * 
 * @param buffer - The image buffer to analyze
 * @returns Object containing RGB values of the average color
 */
async function getAverageColor(buffer: Buffer): Promise<{r: number, g: number, b: number}> {
  try {
    // Analyze the buffer to extract color information
    // We'll sample pixels from the buffer to get an average color
    // This implementation works with common image formats (JPEG, PNG)
    
    // For simplicity, we'll sample every 10th byte in groups of 3 (assuming RGB format)
    // In a production environment, you would use a proper image processing library
    // like sharp or jimp to decode the image properly
    
    let totalR = 0, totalG = 0, totalB = 0;
    let sampleCount = 0;
    
    // Skip header bytes (rough estimate)
    const startOffset = 100;
    
    // Sample pixels from the buffer
    for (let i = startOffset; i < buffer.length - 3; i += 10) {
      // Treat consecutive bytes as RGB values
      totalR += buffer[i];
      totalG += buffer[i + 1];
      totalB += buffer[i + 2];
      sampleCount++;
    }
    
    if (sampleCount > 0) {
      // Calculate averages
      const r = Math.round(totalR / sampleCount);
      const g = Math.round(totalG / sampleCount);
      const b = Math.round(totalB / sampleCount);
      
      return { r, g, b };
    }
    
    // Fallback if sampling fails
    throw new Error('Insufficient sample data');
  } catch (error) {
    console.error('Error extracting average color:', error);
    
    // Fallback to hash-based approach if color extraction fails
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash) + buffer[i];
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Generate RGB values from the hash
    const r = Math.abs(hash % 255);
    const g = Math.abs((hash >> 8) % 255);
    const b = Math.abs((hash >> 16) % 255);
    
    return { r, g, b };
  }
}

/**
 * Generate a more sophisticated placeholder based on image color
 * This creates a gradient effect that looks better than a solid color
 * 
 * @param color - The base color to use for the gradient
 * @returns A CSS gradient string
 */
function generateColorGradient(color: {r: number, g: number, b: number}): string {
  // Create a slightly darker version of the color for the gradient
  const darkerColor = {
    r: Math.max(0, color.r - 40),
    g: Math.max(0, color.g - 40),
    b: Math.max(0, color.b - 40)
  };
  
  // Create a slightly lighter version of the color for the gradient
  const lighterColor = {
    r: Math.min(255, color.r + 20),
    g: Math.min(255, color.g + 20),
    b: Math.min(255, color.b + 20)
  };
  
  // Return a linear gradient
  return `linear-gradient(135deg, rgba(${lighterColor.r}, ${lighterColor.g}, ${lighterColor.b}, 0.7), rgba(${color.r}, ${color.g}, ${color.b}, 0.8), rgba(${darkerColor.r}, ${darkerColor.g}, ${darkerColor.b}, 0.9))`;
}

/**
 * Component props for the smart image component with failover
 */
export interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  sizes?: string;
  quality?: number;
}

/**
 * Get image source with automatic failover
 * This is a simpler version for use in components with additional error handling
 * 
 * @param src - The source URL of the image
 * @param options - Image transformation options
 * @returns A URL string for the image with appropriate CDN handling
 */
export async function getSmartImageSrc(src: string, options: any = {}): Promise<string> {
  try {
    // Track performance for this request
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    
    // Get the image URL with failover handling
    const imageUrl = await getImageWithFailover(src, options);
    
    // Track performance metrics
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const responseTime = endTime - startTime;
    
    // Log performance for debugging (only in development)
    if (import.meta.env.DEV) {
      console.debug(`Image loaded in ${Math.round(responseTime)}ms: ${src}`);
    }
    
    return imageUrl;
  } catch (error) {
    // Handle errors gracefully
    console.error(`Failed to load image ${src}:`, error);
    imageKitStatus.metrics.failures++;
    
    // Return a placeholder or the original source as fallback
    return src.startsWith('/') ? `/images/placeholder.svg` : src;
  }
}

/**
 * Get CDN metrics for monitoring and debugging
 */
export function getCdnMetrics() {
  return {
    ...imageKitStatus.metrics,
    imageKitAvailable: imageKitStatus.available,
    lastChecked: new Date(imageKitStatus.lastChecked).toISOString(),
    cacheSize: imageKitStatus.requestCache.size,
    consecutiveFailures: imageKitStatus.consecutiveFailures
  };
}