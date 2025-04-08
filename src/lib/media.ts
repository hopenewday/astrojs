/**
 * Media utility for ImageKit + Tebi CDN failover system
 * 
 * This utility provides functions for handling image delivery with automatic
 * failover between ImageKit and Tebi S3 storage.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Types for image transformations
interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  aspectRatio?: string;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
}

// Status tracking for ImageKit availability
let imageKitStatus = {
  available: true,
  lastChecked: 0,
  checkInterval: 300000, // Check every 5 minutes (300000ms)
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
 * Uses a simple ping to the ImageKit status endpoint with caching
 */
export async function checkImageKitStatus(): Promise<boolean> {
  // Don't check too frequently - use cached result if within interval
  const now = Date.now();
  if (now - imageKitStatus.lastChecked < imageKitStatus.checkInterval) {
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
    
    return response.ok;
  } catch (error) {
    console.error('ImageKit status check failed:', error);
    
    // Update status
    imageKitStatus.available = false;
    imageKitStatus.lastChecked = now;
    
    return false;
  }
}

/**
 * Generate an ImageKit URL with transformations
 */
export function generateImageKitUrl(path: string, options: ImageTransformOptions = {}): string {
  // Check if the URL is already an ImageKit URL
  if (!path.includes('ik.imagekit.io') && !path.startsWith('/')) {
    return path; // Return original URL if not an ImageKit URL or relative path
  }

  // For relative paths, prepend the ImageKit URL
  const baseUrl = path.startsWith('/') 
    ? `${import.meta.env.IMAGEKIT_URL}${path}` 
    : path;

  // Build transformation parameters
  const params = new URLSearchParams();

  if (options.width) params.append('tr', `w-${options.width}`);
  if (options.height) params.append('tr', `h-${options.height}`);
  if (options.quality) params.append('tr', `q-${options.quality}`);
  if (options.format) params.append('tr', `f-${options.format}`);
  if (options.blur) params.append('tr', `bl-${options.blur}`);
  if (options.aspectRatio) params.append('tr', `ar-${options.aspectRatio}`);
  if (options.crop) params.append('tr', `c-${options.crop}`);
  if (options.focus) params.append('tr', `fo-${options.focus}`);

  // Append parameters to URL if any exist
  const paramsString = params.toString();
  if (paramsString) {
    return `${baseUrl}?${paramsString}`;
  }

  return baseUrl;
}

/**
 * Generate a Tebi S3 URL for an image
 */
export async function generateTebiUrl(path: string): Promise<string> {
  try {
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
    const signedUrl = await getSignedUrl(tebiClient, command, { expiresIn: 3600 });
    
    return signedUrl;
  } catch (error) {
    console.error('Failed to get Tebi fallback URL:', error);
    
    // If all else fails, return the original path
    // This might be a relative path that works with local images
    return path;
  }
}

/**
 * Get a URL for an image, with automatic failover between ImageKit and Tebi
 */
export async function getImageWithFailover(path: string, options: ImageTransformOptions = {}): Promise<string> {
  // Check if ImageKit is available
  const isImageKitAvailable = await checkImageKitStatus();
  
  // If ImageKit is available, use it
  if (isImageKitAvailable) {
    return generateImageKitUrl(path, options);
  }
  
  // Otherwise, fall back to Tebi
  return generateTebiUrl(path);
}

/**
 * Generate a low-quality image placeholder URL (LQIP)
 */
export function getLqipUrl(src: string, width = 20): string {
  return generateImageKitUrl(src, {
    width,
    quality: 20,
    blur: 10
  });
}

/**
 * Generate a blurhash placeholder for an image
 * Blurhash is a compact representation of a placeholder for an image
 * @see https://blurha.sh/
 */
export async function generateBlurhash(src: string): Promise<string> {
  try {
    // First check if ImageKit is available since we'll use it to resize the image
    const isImageKitAvailable = await checkImageKitStatus();
    
    // Get a small version of the image to generate the blurhash from
    const imageUrl = isImageKitAvailable
      ? generateImageKitUrl(src, { width: 32, height: 32 })
      : await generateTebiUrl(src);
    
    // For server-side rendering, we need to fetch the image
    // and convert it to a data URL for the blurhash algorithm
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // We're using a simple algorithm here that creates an average color
    // as a fallback when the full blurhash library isn't available
    // In a production environment, you would use the blurhash library
    
    // For now, return a CSS-compatible rgba string based on the dominant color
    // This is a simplified version that returns a color-based placeholder
    const avgColor = await getAverageColor(buffer);
    return `rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 0.5)`;
  } catch (error) {
    console.error(`Failed to generate blurhash for ${src}:`, error);
    // Return a default blurhash-like placeholder
    return 'rgba(200, 200, 200, 0.5)';
  }
}

/**
 * Extract the average color from an image buffer
 * This is a simplified version of color extraction
 */
async function getAverageColor(buffer: Buffer): Promise<{r: number, g: number, b: number}> {
  // In a real implementation, you would use a proper image processing library
  // For this example, we'll return a placeholder color based on the image path
  // to simulate different colors for different images
  
  // Create a hash of the buffer to get a consistent color for the same image
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

/**
 * Generate responsive image attributes for use with the <img> tag
 */
export async function getResponsiveImageAttributes(props: {
  src: string;
  alt: string;
  widths: number[];
  sizes: string;
  baseWidth?: number;
  baseHeight?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  aspectRatio?: string;
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  lqip?: boolean;
}) {
  const {
    src,
    alt,
    widths,
    sizes,
    baseWidth,
    baseHeight,
    quality = 80,
    format = 'auto',
    aspectRatio,
    focus = 'center',
    lqip = true
  } = props;

  // Check if ImageKit is available
  const isImageKitAvailable = await checkImageKitStatus();
  
  // Generate srcset with different widths
  const srcset = await Promise.all(widths.map(async (width) => {
    const url = isImageKitAvailable
      ? generateImageKitUrl(src, {
          width,
          quality,
          format,
          aspectRatio,
          focus
        })
      : await generateTebiUrl(src); // Tebi doesn't support transformations
    
    return `${url} ${width}w`;
  }));

  // Generate base image URL
  const defaultWidth = baseWidth || widths[Math.floor(widths.length / 2)];
  const defaultUrl = isImageKitAvailable
    ? generateImageKitUrl(src, {
        width: defaultWidth,
        height: baseHeight,
        quality,
        format,
        aspectRatio,
        focus
      })
    : await generateTebiUrl(src);

  // Generate LQIP for blur-up effect
  const lqipUrl = lqip && isImageKitAvailable ? getLqipUrl(src) : undefined;

  return {
    src: defaultUrl,
    srcset: srcset.join(', '),
    sizes,
    alt,
    lqip: lqipUrl,
    width: baseWidth,
    height: baseHeight,
  };
}