/**
 * Utility functions for handling responsive images and fallbacks
 */

interface ImageKitOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  aspectRatio?: string;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  artDirectionBreakpoints?: {
    [breakpoint: string]: {
      width?: number;
      height?: number;
      aspectRatio?: string;
      crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
      focus?: 'center' | 'top' | 'left' | 'bottom' | 'right';
    };
  };
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  widths: number[];
  sizes: string;
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  aspectRatio?: string;
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  lqip?: boolean;
  artDirectionBreakpoints?: {
    [breakpoint: string]: {
      width?: number;
      height?: number;
      aspectRatio?: string;
      crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
      focus?: 'center' | 'top' | 'left' | 'bottom' | 'right';
    };
  };
  preload?: boolean;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Generate an ImageKit URL with transformations
 */
export function getImageKitUrl(src: string, options: ImageKitOptions = {}): string {
  // Check if the URL is already an ImageKit URL
  if (!src.includes('ik.imagekit.io') && !src.startsWith('/')) {
    return src; // Return original URL if not an ImageKit URL or relative path
  }

  // For relative paths, prepend the ImageKit URL
  const baseUrl = src.startsWith('/') 
    ? `${import.meta.env.IMAGEKIT_URL}${src}` 
    : src;

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
 * Generate a low-quality image placeholder URL
 */
export function getLqipUrl(src: string, width = 20): string {
  return getImageKitUrl(src, {
    width,
    quality: 20,
    blur: 10
  });
}

/**
 * Generate a responsive image with srcset and sizes
 */
export function getResponsiveImageAttributes(props: ResponsiveImageProps) {
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
    lqip = true,
    artDirectionBreakpoints,
    preload = false,
    priority = false,
    fetchPriority = 'auto'
  } = props;

  // Generate srcset with different widths and formats
  const generateSrcSet = (options: ImageKitOptions = {}) => {
    return widths
      .map(width => {
        const url = getImageKitUrl(src, {
          ...options,
          width,
          quality,
          format
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  };

  // Generate base image URL
  const defaultWidth = baseWidth || widths[Math.floor(widths.length / 2)];
  const defaultUrl = getImageKitUrl(src, {
    width: defaultWidth,
    height: baseHeight,
    quality,
    format,
    aspectRatio,
    focus
  });

  // Generate LQIP for blur-up effect
  const lqipUrl = lqip ? getLqipUrl(src) : undefined;

  // Generate art direction sources if breakpoints are provided
  const sources = artDirectionBreakpoints
    ? Object.entries(artDirectionBreakpoints).map(([breakpoint, options]) => ({
        media: `(min-width: ${breakpoint})`,
        srcset: generateSrcSet(options),
        sizes
      }))
    : [];

  // Default srcset
  const defaultSrcset = generateSrcSet({
    aspectRatio,
    focus
  });

  return {
    src: defaultUrl,
    srcset: defaultSrcset,
    sources,
    sizes,
    alt,
    lqip: lqipUrl,
    width: baseWidth,
    height: baseHeight,
    loading: priority ? 'eager' : 'lazy',
    decoding: 'async',
    fetchpriority: fetchPriority,
    // Add preload hint for priority images
    preload: preload || priority
  };
}

/**
 * Check if an image exists and return a fallback if it doesn't
 */
export async function checkImageExists(url: string, fallbackUrl: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok ? url : fallbackUrl;
  } catch (error) {
    console.error(`Error checking image at ${url}:`, error);
    return fallbackUrl;
  }
}

/**
 * Get image dimensions from an image URL
 */
export async function getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}