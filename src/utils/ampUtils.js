/**
 * AMP Utilities
 * 
 * This utility provides functions for working with AMP pages, including
 * transforming regular HTML to AMP-compatible HTML, detecting AMP URLs,
 * and generating canonical/AMP URL pairs.
 */

/**
 * Checks if a URL is an AMP URL
 * 
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is an AMP URL
 */
function isAmpUrl(url) {
  if (!url) return false;
  
  // Check for /amp/ path segment
  if (url.includes('/amp/')) return true;
  
  // Check for ?amp=1 query parameter
  if (url.includes('?amp=1') || url.includes('&amp=1')) return true;
  
  return false;
}

/**
 * Gets the canonical (non-AMP) URL for an AMP URL
 * 
 * @param {string} ampUrl - The AMP URL
 * @returns {string} The canonical URL
 */
function getCanonicalUrl(ampUrl) {
  if (!ampUrl) return '';
  
  // Remove /amp/ path segment
  let canonicalUrl = ampUrl.replace(/\/amp\//, '/');
  
  // Remove amp query parameter
  canonicalUrl = canonicalUrl.replace(/([?&])amp=1(&|$)/, (match, prefix, suffix) => {
    return suffix === '&' ? prefix : '';
  });
  
  return canonicalUrl;
}

/**
 * Gets the AMP URL for a canonical URL
 * 
 * @param {string} canonicalUrl - The canonical URL
 * @returns {string} The AMP URL
 */
function getAmpUrl(canonicalUrl) {
  if (!canonicalUrl) return '';
  
  // Check if it's already an AMP URL
  if (isAmpUrl(canonicalUrl)) return canonicalUrl;
  
  // Insert /amp/ before the last path segment
  const urlObj = new URL(canonicalUrl, 'https://example.com');
  const pathParts = urlObj.pathname.split('/');
  
  // If the URL ends with a slash or has no path, append amp
  if (pathParts[pathParts.length - 1] === '') {
    pathParts.splice(pathParts.length - 1, 0, 'amp');
  } else {
    // Otherwise, insert amp before the last segment
    pathParts.splice(pathParts.length - 1, 0, 'amp');
  }
  
  urlObj.pathname = pathParts.join('/');
  return urlObj.pathname + urlObj.search + urlObj.hash;
}

/**
 * Transforms regular HTML content to AMP-compatible HTML
 * 
 * @param {string} html - The HTML content to transform
 * @returns {string} AMP-compatible HTML
 */
function transformToAmpHtml(html) {
  if (!html) return '';
  
  let ampHtml = html;
  
  // Replace img tags with amp-img
  ampHtml = ampHtml.replace(/<img([^>]*)>/gi, (match, attributes) => {
    // Extract src, width, and height attributes
    const srcMatch = attributes.match(/src=["']([^"']*)["']/i);
    const widthMatch = attributes.match(/width=["']([^"']*)["']/i);
    const heightMatch = attributes.match(/height=["']([^"']*)["']/i);
    
    const src = srcMatch ? srcMatch[1] : '';
    let width = widthMatch ? widthMatch[1] : '640';
    let height = heightMatch ? heightMatch[1] : '360';
    
    // If width or height are percentages, convert to pixels
    if (width.includes('%')) width = '640';
    if (height.includes('%')) height = '360';
    
    // Create amp-img tag
    return `<amp-img src="${src}" width="${width}" height="${height}" layout="responsive"></amp-img>`;
  });
  
  // Replace video tags with amp-video
  ampHtml = ampHtml.replace(/<video([^>]*)>(.*?)<\/video>/gis, (match, attributes, content) => {
    // Extract src, width, and height attributes
    const srcMatch = attributes.match(/src=["']([^"']*)["']/i);
    const widthMatch = attributes.match(/width=["']([^"']*)["']/i);
    const heightMatch = attributes.match(/height=["']([^"']*)["']/i);
    
    const src = srcMatch ? srcMatch[1] : '';
    const width = widthMatch ? widthMatch[1] : '640';
    const height = heightMatch ? heightMatch[1] : '360';
    
    // Extract poster if available
    const posterMatch = attributes.match(/poster=["']([^"']*)["']/i);
    const poster = posterMatch ? ` poster="${posterMatch[1]}"` : '';
    
    // Check for source tags in content
    const sources = [];
    const sourceRegex = /<source([^>]*)>/gi;
    let sourceMatch;
    
    while ((sourceMatch = sourceRegex.exec(content)) !== null) {
      sources.push(sourceMatch[0]);
    }
    
    // Create amp-video tag
    return `<amp-video width="${width}" height="${height}" layout="responsive"${poster} controls>
      ${src ? `<source src="${src}">` : ''}
      ${sources.join('\n      ')}
    </amp-video>`;
  });
  
  // Replace iframe tags with amp-iframe
  ampHtml = ampHtml.replace(/<iframe([^>]*)>/gi, (match, attributes) => {
    // Extract src, width, and height attributes
    const srcMatch = attributes.match(/src=["']([^"']*)["']/i);
    const widthMatch = attributes.match(/width=["']([^"']*)["']/i);
    const heightMatch = attributes.match(/height=["']([^"']*)["']/i);
    
    const src = srcMatch ? srcMatch[1] : '';
    const width = widthMatch ? widthMatch[1] : '640';
    const height = heightMatch ? heightMatch[1] : '360';
    
    // Create amp-iframe tag
    return `<amp-iframe src="${src}" width="${width}" height="${height}" layout="responsive" sandbox="allow-scripts allow-same-origin" frameborder="0">
      <amp-img layout="fill" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" placeholder></amp-img>
    </amp-iframe>`;
  });
  
  // Remove JavaScript
  ampHtml = ampHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove inline styles
  ampHtml = ampHtml.replace(/style=["']([^"']*)["']/gi, '');
  
  // Remove disallowed tags
  const disallowedTags = ['frame', 'frameset', 'object', 'param', 'applet', 'embed'];
  disallowedTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
    ampHtml = ampHtml.replace(regex, '');
    
    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\/>`, 'gi');
    ampHtml = ampHtml.replace(selfClosingRegex, '');
  });
  
  return ampHtml;
}

/**
 * Extracts HTML content from an Astro file
 * 
 * @param {string} astroContent - The content of the Astro file
 * @returns {string} The HTML content
 */
function extractHtmlFromAstro(astroContent) {
  // Remove frontmatter
  let content = astroContent.replace(/^---[\s\S]*?---/m, '');
  
  // Remove Astro-specific directives and components
  content = content.replace(/{[^}]*}/g, '');
  
  return content;
}

module.exports = {
  isAmpUrl,
  getCanonicalUrl,
  getAmpUrl,
  transformToAmpHtml,
  extractHtmlFromAstro
};