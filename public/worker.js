/**
 * Cloudflare Worker for ChakrirChain
 * 
 * This worker provides:
 * - Dynamic security headers
 * - Edge caching customization
 * - A/B testing capabilities
 * - Mobile detection and optimization
 */

// Configuration
const config = {
  // Security headers to apply to all responses
  securityHeaders: {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  },
  
  // Cache TTL settings by content type
  cacheTtl: {
    html: 3600, // 1 hour for HTML
    css: 86400, // 24 hours for CSS
    js: 86400, // 24 hours for JS
    images: 604800, // 1 week for images
    fonts: 31536000, // 1 year for fonts
  },
  
  // A/B testing configuration
  abTests: [
    {
      name: 'homepage-hero',
      variants: ['A', 'B'],
      paths: ['/'],
      cookieName: 'ab-homepage-hero',
      cookieExpiry: 7, // days
    },
  ],
};

// Event listener for incoming requests
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Skip processing for admin and API routes
  if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/')) {
    return fetch(request);
  }
  
  // Apply A/B testing if configured for this path
  const abTest = config.abTests.find(test => test.paths.includes(url.pathname));
  if (abTest) {
    request = await handleAbTesting(request, abTest);
  }
  
  // Detect mobile devices for optimization
  const isMobile = isMobileDevice(request);
  
  // Fetch the response from the origin
  let response = await fetch(request);
  
  // Clone the response so we can modify headers
  response = new Response(response.body, response);
  
  // Apply security headers
  applySecurityHeaders(response.headers);
  
  // Apply cache settings based on content type
  applyCacheHeaders(response.headers, url.pathname);
  
  // Apply mobile optimizations if needed
  if (isMobile) {
    response = applyMobileOptimizations(response);
  }
  
  return response;
}

/**
 * Apply security headers to the response
 */
function applySecurityHeaders(headers) {
  for (const [name, value] of Object.entries(config.securityHeaders)) {
    headers.set(name, value);
  }
  
  // Generate a dynamic CSP nonce for each request
  const nonce = generateNonce();
  
  // Set Content-Security-Policy with nonce
  const csp = generateCSP(nonce);
  headers.set('Content-Security-Policy', csp);
  
  return headers;
}

/**
 * Generate a random nonce for CSP
 */
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate Content Security Policy with nonce
 */
function generateCSP(nonce) {
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://unpkg.com https://analytics.yourdomain.com https://cusdis.com;
    style-src 'self' 'unsafe-inline' https://unpkg.com;
    img-src 'self' data: https://ik.imagekit.io *.tebi.io https://cusdis.com;
    font-src 'self' data:;
    connect-src 'self' https://ik.imagekit.io *.tebi.io https://analytics.yourdomain.com https://cusdis.com;
    frame-src 'self' https://cusdis.com;
    frame-ancestors 'self';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Apply cache headers based on content type
 */
function applyCacheHeaders(headers, pathname) {
  // Determine content type from pathname
  let ttl = config.cacheTtl.html; // Default to HTML TTL
  
  if (pathname.match(/\.(css|scss)$/)) {
    ttl = config.cacheTtl.css;
  } else if (pathname.match(/\.(js|mjs)$/)) {
    ttl = config.cacheTtl.js;
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) {
    ttl = config.cacheTtl.images;
  } else if (pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    ttl = config.cacheTtl.fonts;
  }
  
  // Set Cache-Control header
  headers.set('Cache-Control', `public, max-age=${ttl}`);
  
  return headers;
}

/**
 * Handle A/B testing for the request
 */
async function handleAbTesting(request, test) {
  const url = new URL(request.url);
  
  // Check for existing test cookie
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  let variant = cookies[test.cookieName];
  
  // If no variant is assigned, randomly assign one
  if (!variant) {
    variant = test.variants[Math.floor(Math.random() * test.variants.length)];
    
    // Clone the request and add the variant as a header
    const newRequest = new Request(request);
    newRequest.headers.set('X-AB-Variant', `${test.name}:${variant}`);
    
    // Return the modified request
    return newRequest;
  }
  
  // Add the variant as a header to the existing request
  const newRequest = new Request(request);
  newRequest.headers.set('X-AB-Variant', `${test.name}:${variant}`);
  
  return newRequest;
}

/**
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = parts[1];
      }
    });
  }
  
  return cookies;
}

/**
 * Detect if the request is from a mobile device
 */
function isMobileDevice(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  return /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
}

/**
 * Apply optimizations for mobile devices
 */
function applyMobileOptimizations(response) {
  // Clone the response
  const newResponse = new Response(response.body, response);
  
  // Add a header to indicate mobile optimization
  newResponse.headers.set('X-Mobile-Optimized', 'true');
  
  // Additional mobile optimizations could be applied here
  // such as image compression, CSS/JS minification, etc.
  
  return newResponse;
}