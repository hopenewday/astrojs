/**
 * AMP Detection Utilities
 * 
 * This module provides utilities for detecting AMP support in browsers
 * and implementing fallback mechanisms for devices that don't support AMP.
 */

/**
 * Detects if the current browser/device supports AMP
 * This is a client-side function that should be used in scripts
 */
export function detectAmpSupport(): boolean {
  // AMP is supported by most modern browsers
  // This function is primarily for edge cases and older browsers
  
  // Check if running in browser environment
  if (typeof window === 'undefined') return true;
  
  // Check for known problematic user agents
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Some very old browsers might have issues with AMP
  if (userAgent.includes('msie') && !userAgent.includes('msie 11')) {
    return false; // IE 10 and below
  }
  
  // Check for extremely old mobile browsers
  if (userAgent.includes('android 2.') || userAgent.includes('android 3.')) {
    return false; // Very old Android browsers
  }
  
  // Check for basic HTML5 support which AMP requires
  if (!('querySelector' in document && 'addEventListener' in window)) {
    return false;
  }
  
  return true;
}

/**
 * Server-side function to determine if a user agent supports AMP
 * @param userAgent The user agent string from the request
 */
export function isAmpSupportedUserAgent(userAgent: string): boolean {
  if (!userAgent) return true; // Default to true if no user agent
  
  userAgent = userAgent.toLowerCase();
  
  // Check for known problematic user agents
  if (userAgent.includes('msie') && !userAgent.includes('msie 11')) {
    return false; // IE 10 and below
  }
  
  // Check for extremely old mobile browsers
  if (userAgent.includes('android 2.') || userAgent.includes('android 3.')) {
    return false; // Very old Android browsers
  }
  
  return true;
}

/**
 * Generates a script to redirect from AMP to canonical version if AMP is not supported
 * This should be included in AMP pages
 */
export function generateAmpFallbackScript(): string {
  return `<script>
    (function() {
      // Simple detection of problematic browsers
      var userAgent = navigator.userAgent.toLowerCase();
      var isOldIE = userAgent.indexOf('msie') > -1 && userAgent.indexOf('msie 11') === -1;
      var isOldAndroid = userAgent.indexOf('android 2.') > -1 || userAgent.indexOf('android 3.') > -1;
      var noBasicSupport = !('querySelector' in document && 'addEventListener' in window);
      
      // If browser likely doesn't support AMP well
      if (isOldIE || isOldAndroid || noBasicSupport) {
        // Get the canonical URL from the link tag
        var canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink && canonicalLink.href) {
          // Redirect to the canonical version
          window.location.href = canonicalLink.href;
        }
      }
    })();
  </script>`;
}

/**
 * Middleware function to check if a request should be served AMP content
 * @param request The incoming request
 * @param ampUrl The AMP version URL
 * @param canonicalUrl The canonical (non-AMP) URL
 */
export function shouldServeAmp(request: Request, ampUrl: string, canonicalUrl: string): boolean {
  // Get user agent
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if user agent supports AMP
  if (!isAmpSupportedUserAgent(userAgent)) {
    return false;
  }
  
  // Check for AMP cache requests (these should always get AMP content)
  const url = new URL(request.url);
  if (url.hostname.includes('cdn.ampproject.org')) {
    return true;
  }
  
  // Check for explicit AMP parameter (for testing)
  if (url.searchParams.has('amp') && url.searchParams.get('amp') === '1') {
    return true;
  }
  
  // Default behavior: serve AMP for mobile devices
  return userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone');
}