/**
 * AMP Utilities
 * 
 * This module provides utilities for working with AMP (Accelerated Mobile Pages)
 * including content transformation, validation, and optimization functions.
 */

/**
 * Transforms regular HTML content to AMP-compatible content
 * - Replaces <img> with <amp-img>
 * - Replaces <iframe> with <amp-iframe>
 * - Replaces <video> with <amp-video>
 * - Removes disallowed elements and attributes
 */
export function transformToAmpHtml(htmlContent: string): string {
  if (!htmlContent) return '';
  
  let ampContent = htmlContent;
  
  // Replace <img> tags with <amp-img>
  ampContent = ampContent.replace(
    /<img([^>]*)src="([^"]+)"([^>]*)>/gi,
    (match, before, src, after) => {
      // Extract width and height if present
      const widthMatch = match.match(/width="([^"]+)"/i);
      const heightMatch = match.match(/height="([^"]+)"/i);
      const altMatch = match.match(/alt="([^"]+)"/i);
      
      const width = widthMatch ? widthMatch[1] : '640';
      const height = heightMatch ? heightMatch[1] : '360';
      const alt = altMatch ? altMatch[1] : '';
      
      return `<amp-img src="${src}" width="${width}" height="${height}" alt="${alt}" layout="responsive"></amp-img>`;
    }
  );
  
  // Replace <iframe> with <amp-iframe>
  ampContent = ampContent.replace(
    /<iframe([^>]*)src="([^"]+)"([^>]*)><\/iframe>/gi,
    (match, before, src, after) => {
      // Extract width and height if present
      const widthMatch = match.match(/width="([^"]+)"/i);
      const heightMatch = match.match(/height="([^"]+)"/i);
      
      const width = widthMatch ? widthMatch[1] : '600';
      const height = heightMatch ? heightMatch[1] : '400';
      
      return `<amp-iframe src="${src}" width="${width}" height="${height}" layout="responsive" sandbox="allow-scripts allow-same-origin" frameborder="0"></amp-iframe>`;
    }
  );
  
  // Replace <video> with <amp-video>
  ampContent = ampContent.replace(
    /<video([^>]*)>(.*?)<\/video>/gis,
    (match, attrs, content) => {
      const srcMatch = attrs.match(/src="([^"]+)"/i);
      const posterMatch = attrs.match(/poster="([^"]+)"/i);
      const widthMatch = attrs.match(/width="([^"]+)"/i);
      const heightMatch = attrs.match(/height="([^"]+)"/i);
      
      const src = srcMatch ? srcMatch[1] : '';
      const poster = posterMatch ? `poster="${posterMatch[1]}"` : '';
      const width = widthMatch ? widthMatch[1] : '640';
      const height = heightMatch ? heightMatch[1] : '360';
      
      // Check for source tags inside video
      const sourceRegex = /<source([^>]*)>/gi;
      let sourceMatch;
      let sources = '';
      
      while ((sourceMatch = sourceRegex.exec(content)) !== null) {
        sources += sourceMatch[0];
      }
      
      return `<amp-video ${src ? `src="${src}"` : ''} ${poster} width="${width}" height="${height}" layout="responsive" controls>
        ${sources}
        <div fallback>
          <p>Your browser doesn't support HTML5 video</p>
        </div>
      </amp-video>`;
    }
  );
  
  // Replace <script> tags (not allowed in AMP)
  ampContent = ampContent.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Replace inline styles (not allowed in AMP)
  ampContent = ampContent.replace(/style="[^"]*"/gi, '');
  
  // Replace disallowed attributes
  ampContent = ampContent.replace(/onclick="[^"]*"/gi, '');
  ampContent = ampContent.replace(/onload="[^"]*"/gi, '');
  
  return ampContent;
}

/**
 * Generates the required AMP boilerplate code
 */
export function getAmpBoilerplate(): string {
  return `<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>`;
}

/**
 * Returns a list of required AMP component scripts based on content
 * @param content HTML content to analyze
 */
export function getRequiredAmpScripts(content: string): string[] {
  const scripts = [
    '<script async src="https://cdn.ampproject.org/v0.js"></script>'
  ];
  
  // Check for components that require specific scripts
  if (content.includes('<amp-img')) {
    scripts.push('<script async custom-element="amp-img" src="https://cdn.ampproject.org/v0/amp-img-0.1.js"></script>');
  }
  
  if (content.includes('<amp-iframe')) {
    scripts.push('<script async custom-element="amp-iframe" src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>');
  }
  
  if (content.includes('<amp-video')) {
    scripts.push('<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>');
  }
  
  if (content.includes('<amp-carousel')) {
    scripts.push('<script async custom-element="amp-carousel" src="https://cdn.ampproject.org/v0/amp-carousel-0.1.js"></script>');
  }
  
  if (content.includes('<amp-sidebar')) {
    scripts.push('<script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>');
  }
  
  if (content.includes('<amp-social-share')) {
    scripts.push('<script async custom-element="amp-social-share" src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>');
  }
  
  if (content.includes('<amp-lightbox')) {
    scripts.push('<script async custom-element="amp-lightbox" src="https://cdn.ampproject.org/v0/amp-lightbox-0.1.js"></script>');
  }
  
  if (content.includes('<amp-youtube')) {
    scripts.push('<script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>');
  }
  
  if (content.includes('<amp-analytics')) {
    scripts.push('<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>');
  }
  
  if (content.includes('<amp-form')) {
    scripts.push('<script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>');
  }
  
  return scripts;
}

/**
 * Generates canonical and amphtml link tags for proper linking between AMP and non-AMP versions
 * @param isAmp Whether the current page is an AMP page
 * @param currentUrl The current page URL
 * @param ampUrl The corresponding AMP URL (if isAmp is false)
 * @param canonicalUrl The corresponding canonical URL (if isAmp is true)
 */
export function generateAmpLinks(isAmp: boolean, currentUrl: string, ampUrl?: string, canonicalUrl?: string): string {
  if (isAmp) {
    // For AMP pages, include canonical link to non-AMP version
    return `<link rel="canonical" href="${canonicalUrl || currentUrl.replace('/amp/', '/')}">`;
  } else {
    // For non-AMP pages, include amphtml link to AMP version
    return `<link rel="amphtml" href="${ampUrl || currentUrl.replace('/article/', '/article/amp/')}">`;
  }
}

/**
 * Validates if the given URL is an AMP URL
 */
export function isAmpUrl(url: string): boolean {
  return url.includes('/amp/') || url.endsWith('.amp');
}

/**
 * Converts a regular URL to its AMP equivalent
 */
export function getAmpUrl(url: string): string {
  if (isAmpUrl(url)) return url;
  
  // Handle different URL patterns
  if (url.includes('/article/')) {
    return url.replace('/article/', '/article/amp/');
  }
  
  // Add more patterns as needed
  
  // Default: append /amp/ before the last path segment
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const lastPart = pathParts.pop() || '';
  pathParts.push('amp');
  pathParts.push(lastPart);
  urlObj.pathname = pathParts.join('/');
  
  return urlObj.toString();
}

/**
 * Converts an AMP URL to its regular (canonical) equivalent
 */
export function getCanonicalUrl(ampUrl: string): string {
  if (!isAmpUrl(ampUrl)) return ampUrl;
  
  // Handle different URL patterns
  if (ampUrl.includes('/article/amp/')) {
    return ampUrl.replace('/article/amp/', '/article/');
  }
  
  // Add more patterns as needed
  
  // Default: remove /amp/ from the path
  const urlObj = new URL(ampUrl);
  urlObj.pathname = urlObj.pathname.replace('/amp/', '/');
  
  return urlObj.toString();
}