/**
 * HTML Sanitizer Utility
 * 
 * This utility provides functions to sanitize HTML content to prevent XSS attacks.
 * It uses a whitelist approach to only allow specific HTML tags and attributes.
 */

// Define the sanitization options interface
export interface SanitizeOptions {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  allowedIframeHostnames: string[];
}

// Default sanitization options with safe defaults
const defaultOptions: SanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height']
  },
  allowedIframeHostnames: ['youtube.com', 'vimeo.com']
};

/**
 * Sanitize HTML string to prevent XSS attacks
 * 
 * @param html The HTML string to sanitize
 * @param options Sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, options: Partial<SanitizeOptions> = {}): string {
  // Merge provided options with defaults
  const mergedOptions: SanitizeOptions = {
    allowedTags: options.allowedTags || defaultOptions.allowedTags,
    allowedAttributes: options.allowedAttributes || defaultOptions.allowedAttributes,
    allowedIframeHostnames: options.allowedIframeHostnames || defaultOptions.allowedIframeHostnames
  };

  // Create a DOM parser to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Sanitize the document
  sanitizeNode(doc.body, mergedOptions);
  
  // Return the sanitized HTML
  return doc.body.innerHTML;
}

/**
 * Recursively sanitize a DOM node
 * 
 * @param node The DOM node to sanitize
 * @param options Sanitization options
 */
function sanitizeNode(node: Node, options: SanitizeOptions): void {
  // Create a list of nodes to remove
  const nodesToRemove: Node[] = [];
  
  // Process child nodes
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Check if tag is allowed
      if (!options.allowedTags.includes(tagName)) {
        nodesToRemove.push(child);
        continue;
      }
      
      // Handle iframes specially
      if (tagName === 'iframe') {
        const src = element.getAttribute('src') || '';
        const hostname = extractHostname(src);
        
        if (!options.allowedIframeHostnames.includes(hostname)) {
          nodesToRemove.push(child);
          continue;
        }
      }
      
      // Filter attributes
      const allowedAttrs = options.allowedAttributes[tagName] || [];
      const attributes = Array.from(element.attributes);
      
      for (const attr of attributes) {
        if (!allowedAttrs.includes(attr.name)) {
          element.removeAttribute(attr.name);
        } else if (attr.name === 'href' || attr.name === 'src') {
          // Sanitize URLs to prevent javascript: protocol
          const value = attr.value.trim().toLowerCase();
          if (value.startsWith('javascript:') || value.startsWith('data:')) {
            element.removeAttribute(attr.name);
          }
        }
      }
      
      // Recursively sanitize child nodes
      sanitizeNode(child, options);
    }
  }
  
  // Remove disallowed nodes
  for (const nodeToRemove of nodesToRemove) {
    node.removeChild(nodeToRemove);
  }
}

/**
 * Extract hostname from URL
 * 
 * @param url The URL to extract hostname from
 * @returns The hostname
 */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Sanitize a URL to ensure it's safe
 * 
 * @param url The URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    
    return parsed.toString();
  } catch (e) {
    // If URL is invalid, check if it's a relative URL
    if (url.startsWith('/')) {
      return url; // Allow relative URLs
    }
    return '';
  }
}

/**
 * Sanitize plain text (remove HTML)
 * 
 * @param text The text to sanitize
 * @returns Plain text with HTML removed
 */
export function sanitizeText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}