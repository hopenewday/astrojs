/**
 * Image Format Integration Utility
 * 
 * This utility integrates the AVIF format detection with the CDN failover system
 * to ensure that images are served in the most optimal format based on browser support.
 */

import { detectAvifSupport } from './imageOptimizer';

// Cache for format support to avoid repeated checks
let formatSupportCache: {
  avif?: boolean;
  webp?: boolean;
  initialized: boolean;
} = {
  initialized: false
};

/**
 * Initialize format detection and cache the results
 * This should be called early in the page lifecycle
 */
export async function initFormatDetection(): Promise<void> {
  if (formatSupportCache.initialized) return;
  
  try {
    // Check for stored results in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedAvifSupport = localStorage.getItem('avif-support');
      if (storedAvifSupport !== null) {
        formatSupportCache.avif = storedAvifSupport === 'true';
        formatSupportCache.initialized = true;
        return;
      }
    }
    
    // Detect AVIF support if not cached
    formatSupportCache.avif = await detectAvifSupport();
    
    // Store results in localStorage for future page loads
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('avif-support', formatSupportCache.avif.toString());
    }
    
    formatSupportCache.initialized = true;
  } catch (error) {
    console.error('Error initializing format detection:', error);
    // Default to false for safety
    formatSupportCache.avif = false;
    formatSupportCache.initialized = true;
  }
}

/**
 * Get the best image format based on browser support
 * @returns The best supported format ('avif', 'webp', or 'jpg')
 */
export async function getBestImageFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  // Initialize detection if not already done
  if (!formatSupportCache.initialized) {
    await initFormatDetection();
  }
  
  // Return the best format based on support
  if (formatSupportCache.avif) {
    return 'avif';
  } else if (formatSupportCache.webp) {
    return 'webp';
  } else {
    return 'jpg';
  }
}

/**
 * Transform image URL to use the best supported format
 * @param url The original image URL
 * @returns The transformed URL with the best format
 */
export async function getOptimalImageUrl(url: string): Promise<string> {
  const bestFormat = await getBestImageFormat();
  
  // Check if URL already has format parameters
  if (url.includes('format=') || url.includes('f-')) {
    // Replace existing format parameter
    return url
      .replace(/format=\w+/g, `format=${bestFormat}`)
      .replace(/f-\w+/g, `f-${bestFormat}`);
  } else if (url.includes('?')) {
    // Add format parameter to existing query string
    return `${url}&format=${bestFormat}`;
  } else {
    // Add format parameter as new query string
    return `${url}?format=${bestFormat}`;
  }
}

/**
 * Add data attributes to an image element for client-side format optimization
 * @param imgElement The image element to enhance
 */
export function enhanceImageElement(imgElement: HTMLImageElement): void {
  if (!imgElement) return;
  
  // Mark the image for client-side format optimization
  imgElement.setAttribute('data-smart-image', 'true');
  
  // Store the original source for reference
  if (!imgElement.hasAttribute('data-src-base')) {
    imgElement.setAttribute('data-src-base', imgElement.src);
  }
}