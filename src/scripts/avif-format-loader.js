/**
 * AVIF Format Loader
 * 
 * This script automatically detects browser support for AVIF format
 * and applies it to images when supported. It runs on page load and
 * transforms image URLs to use AVIF for browsers that support it.
 */

import { detectAvifSupport } from '../utils/imageOptimizer';

/**
 * Apply AVIF format to image URLs when supported
 * @param {string} url - The original image URL
 * @returns {string} - The transformed URL with AVIF format if supported
 */
async function applyAvifFormat(url) {
  // Check if AVIF is supported
  const avifSupported = await isAvifSupported();
  if (!avifSupported) return url;
  
  // Transform URL to use AVIF format
  if (url.includes('format=') || url.includes('f-')) {
    // Replace existing format parameter
    return url
      .replace(/format=\w+/g, 'format=avif')
      .replace(/f-\w+/g, 'f-avif');
  } else if (url.includes('?')) {
    // Add format parameter to existing query string
    return `${url}&format=avif`;
  } else {
    // Add format parameter as new query string
    return `${url}?format=avif`;
  }
}

/**
 * Check if AVIF is supported, using cached result if available
 * @returns {Promise<boolean>} - Whether AVIF is supported
 */
async function isAvifSupported() {
  // Check if we already have the result in localStorage
  const cachedResult = localStorage.getItem('avif-support');
  if (cachedResult !== null) {
    return cachedResult === 'true';
  }
  
  // Check if we already have the result in a data attribute
  if (document.documentElement.dataset.avifSupport) {
    return document.documentElement.dataset.avifSupport === 'true';
  }
  
  // Detect AVIF support
  try {
    const supported = await detectAvifSupport();
    // Cache the result
    localStorage.setItem('avif-support', supported.toString());
    document.documentElement.dataset.avifSupport = supported.toString();
    return supported;
  } catch (error) {
    console.error('Error detecting AVIF support:', error);
    return false;
  }
}

/**
 * Apply AVIF format to all images with data-smart-image attribute
 */
async function applyAvifToImages() {
  // Only proceed if AVIF is supported
  const avifSupported = await isAvifSupported();
  if (!avifSupported) return;
  
  // Find all images with data-smart-image attribute
  const images = document.querySelectorAll('img[data-smart-image]');
  images.forEach(async (img) => {
    // Transform src attribute
    const originalSrc = img.src;
    img.src = await applyAvifFormat(originalSrc);
    
    // Transform srcset attribute if it exists
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const newSrcset = await Promise.all(
        srcset.split(',').map(async (src) => {
          const [url, descriptor] = src.trim().split(' ');
          const newUrl = await applyAvifFormat(url);
          return `${newUrl} ${descriptor}`;
        })
      );
      img.setAttribute('srcset', newSrcset.join(', '));
    }
  });
  
  // Also handle picture elements with source elements
  const sources = document.querySelectorAll('source[type="image/webp"]');
  sources.forEach(async (source) => {
    // Only transform sources that don't already specify AVIF
    if (source.getAttribute('type') === 'image/avif') return;
    
    // Transform srcset attribute
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      const newSrcset = await Promise.all(
        srcset.split(',').map(async (src) => {
          const [url, descriptor] = src.trim().split(' ');
          const newUrl = await applyAvifFormat(url);
          return `${newUrl} ${descriptor}`;
        })
      );
      source.setAttribute('srcset', newSrcset.join(', '));
      source.setAttribute('type', 'image/avif');
    }
  });
}

// Run the AVIF detection and application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyAvifToImages);
} else {
  applyAvifToImages();
}

// Export functions for use in other scripts
export { applyAvifFormat, isAvifSupported, applyAvifToImages };