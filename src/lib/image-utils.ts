/**
 * Image Utilities for Responsive Images
 * 
 * This utility provides functions for generating responsive image attributes
 * including srcset, sizes, and LQIP (Low Quality Image Placeholder).
 */

// Base64 encoded AVIF detection image
export const avifDetectionImage = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';

// Forward declarations to avoid circular dependency
type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  aspectRatio?: string;
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
};

// These will be imported from media.ts in the actual implementation
declare function getImageWithFailover(path: string, options?: ImageTransformOptions): Promise<string>;
declare function getLqipUrl(path: string, width?: number): string;

// Types for responsive image attributes
export interface ResponsiveImageOptions {
  src: string;
  alt: string;
  widths: number[];
  sizes?: string;
  baseWidth?: number;
  baseHeight?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  aspectRatio?: string;
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  lqip?: boolean;
}

export interface ResponsiveImageAttributes {
  src: string;
  srcset: string;
  sizes: string;
  lqip?: string;
  width?: number;
  height?: number;
}

/**
 * Generate responsive image attributes including srcset, sizes, and LQIP
 * @param options Options for generating responsive image attributes
 * @returns Object containing src, srcset, sizes, lqip, width, and height
 */
export async function getResponsiveImageAttributes(options: ResponsiveImageOptions): Promise<ResponsiveImageAttributes> {
  const {
    src,
    widths,
    sizes = '100vw',
    baseWidth,
    baseHeight,
    quality = 80,
    format = 'webp',
    aspectRatio,
    focus = 'center',
    lqip = true,
  } = options;

  // Generate the main image URL with automatic CDN failover
  const mainSrc = await getImageWithFailover(src, {
    width: baseWidth,
    height: baseHeight,
    quality,
    format,
    aspectRatio,
    focus,
  });

  // Generate srcset with multiple widths
  const srcsetPromises = widths.map(async (width) => {
    const url = await getImageWithFailover(src, {
      width,
      quality,
      format,
      aspectRatio,
      focus,
    });
    return `${url} ${width}w`;
  });

  const srcsetValues = await Promise.all(srcsetPromises);
  const srcset = srcsetValues.join(', ');

  // Generate LQIP (Low Quality Image Placeholder) if requested
  let lqipUrl;
  if (lqip) {
    lqipUrl = getLqipUrl(src, Math.min(widths[0], 40)); // Use smallest width, max 40px
  }

  // Calculate aspect ratio for width/height if both dimensions are provided
  let calculatedWidth = baseWidth;
  let calculatedHeight = baseHeight;

  // If we have an aspect ratio string (e.g., "16:9"), parse it
  if (aspectRatio && !baseHeight && baseWidth) {
    const [width, height] = aspectRatio.split(':').map(Number);
    if (!isNaN(width) && !isNaN(height) && height > 0) {
      calculatedHeight = Math.round(baseWidth * (height / width));
    }
  }

  return {
    src: mainSrc,
    srcset,
    sizes,
    lqip: lqipUrl,
    width: calculatedWidth,
    height: calculatedHeight,
  };
}

/**
 * Calculate the aspect ratio from width and height
 * @param width Image width
 * @param height Image height
 * @returns Aspect ratio string (e.g., "16:9")
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return '';
  
  // Find the greatest common divisor (GCD)
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Generate a complete AVIF detection data URI
 * This is a tiny AVIF image for browser support detection
 */
export const avifDetectionImage = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';