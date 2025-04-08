/**
 * Image Format Loader
 * 
 * This script automatically detects browser support for modern image formats
 * and applies the appropriate format to images with the 'data-smart-image' attribute.
 */

// Import the format detection utilities
import { detectAvifSupport, detectWebPSupport, getBestSupportedFormat } from '../utils/imageFormatDetection';

/**
 * Apply the best supported format to all images with data-smart-image attribute
 */
async function applyBestImageFormat() {
  // Get the best supported format
  const bestFormat = await getBestSupportedFormat();
  
  // Find all images with the data-smart-image attribute
  const images = document.querySelectorAll('img[data-smart-image]');
  
  // Apply the best format to each image
  images.forEach(img => {
    const baseSrc = img.getAttribute('data-src-base');
    if (!baseSrc) return;
    
    // Check if there's a specific source for the detected format
    const formatSrc = img.getAttribute(`data-src-${bestFormat}`);
    if (formatSrc) {
      img.src = formatSrc;
    } else {
      // If no specific source exists, try to modify the URL to use the best format
      // This assumes the CDN or image server supports format conversion via URL parameters
      const currentSrc = img.src;
      if (currentSrc.includes('format=') || currentSrc.includes('f-')) {
        // Replace existing format parameter
        const newSrc = currentSrc
          .replace(/format=\w+/g, `format=${bestFormat}`)
          .replace(/f-\w+/g, `f-${bestFormat}`);
        img.src = newSrc;
      } else if (currentSrc.includes('?')) {
        // Add format parameter to existing query string
        img.src = `${currentSrc}&format=${bestFormat}`;
      } else {
        // Add format parameter as new query string
        img.src = `${currentSrc}?format=${bestFormat}`;
      }
    }
    
    // Update srcset if it exists
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const newSrcset = srcset.split(',').map(src => {
        const [url, size] = src.trim().split(' ');
        if (url.includes('format=') || url.includes('f-')) {
          // Replace existing format parameter
          const newUrl = url
            .replace(/format=\w+/g, `format=${bestFormat}`)
            .replace(/f-\w+/g, `f-${bestFormat}`);
          return `${newUrl} ${size}`;
        } else if (url.includes('?')) {
          // Add format parameter to existing query string
          return `${url}&format=${bestFormat} ${size}`;
        } else {
          // Add format parameter as new query string
          return `${url}?format=${bestFormat} ${size}`;
        }
      }).join(', ');
      img.setAttribute('srcset', newSrcset);
    }
  });
  
  // Also handle picture elements with source elements
  const sources = document.querySelectorAll('source[data-smart-source]');
  sources.forEach(source => {
    // Only modify sources that don't already have a type attribute specifying a different format
    const type = source.getAttribute('type');
    if (type && !type.includes(`image/${bestFormat}`)) return;
    
    const srcset = source.getAttribute('srcset');
    if (!srcset) return;
    
    const newSrcset = srcset.split(',').map(src => {
      const [url, size] = src.trim().split(' ');
      if (url.includes('format=') || url.includes('f-')) {
        // Replace existing format parameter
        const newUrl = url
          .replace(/format=\w+/g, `format=${bestFormat}`)
          .replace(/f-\w+/g, `f-${bestFormat}`);
        return `${newUrl} ${size}`;
      } else if (url.includes('?')) {
        // Add format parameter to existing query string
        return `${url}&format=${bestFormat} ${size}`;
      } else {
        // Add format parameter as new query string
        return `${url}?format=${bestFormat} ${size}`;
      }
    }).join(', ');
    source.setAttribute('srcset', newSrcset);
    
    // Update the type attribute to match the format
    source.setAttribute('type', `image/${bestFormat}`);
  });
}

// Run the format detection and apply the best format when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyBestImageFormat);
} else {
  applyBestImageFormat();
}

// Export the function for use in other scripts
export { applyBestImageFormat };