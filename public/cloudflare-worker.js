/**
 * Cloudflare Worker for ChakrirChain
 * 
 * This worker script provides:
 * - Advanced security headers management
 * - Edge caching optimization
 * - A/B testing framework
 * - Mobile detection and optimization
 * - Bot protection
 * - Analytics integration
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
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
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
      name: 'homepage-layout',
      variants: ['grid', 'magazine'],
      paths: ['/'],
      cookieName: 'ab-homepage-layout',
      cookieExpiry: 7, // days
      weights: [0.5, 0.5], // 50/50 split
    },
    {
      name: 'article-cta',
      variants: ['subscribe', 'related'],
      paths: ['/article/*'],
      cookieName: 'ab-article-cta',
      cookieExpiry: 14, // days
      weights: [0.7, 0.3], // 70/30 split
    }
  ],
  
  // Bot protection settings
  botProtection: {
    enabled: true,
    protectedPaths: ['/admin/*', '/api/*'],
    challengeThreshold: 0.8, // Confidence threshold for bot detection
    allowedBots: ['googlebot', 'bingbot', 'yandexbot']
  },
  
  // CDN failover settings
  cdnFailover: {
    enabled: true,
    primaryCdn: 'imagekit',
    backupCdn: 'tebi',
    healthCheckInterval: 60, // seconds
    healthCheckPath: '/health-check.txt',
  },
};

// Event listener for incoming requests
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

/**
 * Main request handler
 */
async function handleRequest(event) {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip processing for certain paths
  if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/csp-report')) {
    return fetch(request);
  }
  
  // Generate a unique request ID for tracking
  const requestId = crypto.randomUUID();
  
  // Add request ID to headers for tracking
  const modifiedRequest = new Request(request, {
    headers: new Headers(request.headers)
  });
  modifiedRequest.headers.set('X-Request-ID', requestId);
  
  // Apply bot protection if enabled
  if (config.botProtection.enabled && isProtectedPath(url.pathname)) {
    const botScore = await detectBot(request);
    if (botScore > config.botProtection.challengeThreshold) {
      const userAgent = request.headers.get('User-Agent') || '';
      const isAllowedBot = config.botProtection.allowedBots.some(bot => 
        userAgent.toLowerCase().includes(bot)
      );
      
      if (!isAllowedBot) {
        return createBotChallengeResponse();
      }
    }
  }
  
  // Apply A/B testing if configured for this path
  const abTest = findAbTest(url.pathname);
  if (abTest) {
    modifiedRequest.headers.set('X-AB-Test', abTest.name);
    modifiedRequest.headers.set('X-AB-Variant', getAbTestVariant(request, abTest));
  }
  
  // Detect mobile devices for optimization
  const isMobile = isMobileDevice(request);
  modifiedRequest.headers.set('X-Device-Type', isMobile ? 'mobile' : 'desktop');
  
  // Use Cloudflare cache API if available
  const cacheKey = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers
  });
  
  // Try to get from cache first
  const cache = caches.default;
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // If not in cache, fetch from origin
    response = await fetch(modifiedRequest);
    
    // Clone the response so we can modify headers
    response = new Response(response.body, response);
    
    // Apply security headers
    applySecurityHeaders(response.headers, url);
    
    // Apply cache settings based on content type
    applyCacheHeaders(response.headers, url.pathname);
    
    // Apply mobile optimizations if needed
    if (isMobile) {
      response = applyMobileOptimizations(response, url);
    }
    
    // Add the request ID to the response for tracking
    response.headers.set('X-Request-ID', requestId);
    
    // Store in cache if cacheable
    if (isCacheable(request, response)) {
      event.waitUntil(cache.put(cacheKey, response.clone()));
    }
  }
  
  // Add A/B test cookies if needed
  if (abTest) {
    const variant = response.headers.get('X-AB-Variant');
    if (variant) {
      response = addAbTestCookie(response, abTest, variant);
    }
  }
  
  return response;
}

/**
 * Apply security headers to the response
 */
function applySecurityHeaders(headers, url) {
  for (const [name, value] of Object.entries(config.securityHeaders)) {
    headers.set(name, value);
  }
  
  // Generate a dynamic CSP nonce for each request
  const nonce = generateNonce();
  
  // Set Content-Security-Policy with nonce
  const csp = generateCSP(nonce, url);
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
function generateCSP(nonce, url) {
  // Base CSP directives
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", 
      `'nonce-${nonce}'`,
      'https://unpkg.com',
      'https://analytics.yourdomain.com',
      'https://cusdis.com'
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
    'img-src': [
      "'self'", 
      'data:', 
      'https://ik.imagekit.io', 
      '*.tebi.io',
      'https://cusdis.com'
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://ik.imagekit.io',
      '*.tebi.io',
      'https://analytics.yourdomain.com',
      'https://cusdis.com'
    ],
    'frame-src': ["'self'", 'https://cusdis.com'],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'report-uri': ['/api/csp-report']
  };
  
  // Add special rules for admin section
  if (url.pathname.startsWith('/admin')) {
    directives['script-src'].push("'unsafe-eval'"); // Needed for CMS
  }
  
  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Apply cache headers based on content type
 */
function applyCacheHeaders(headers, pathname) {
  // Don't cache admin or API routes
  if (pathname.startsWith('/admin/') || pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    return headers;
  }
  
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
 * Find A/B test configuration for a given path
 */
function findAbTest(pathname) {
  return config.abTests.find(test => {
    return test.paths.some(pattern => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return pathname.startsWith(prefix);
      }
      return pathname === pattern;
    });
  });
}

/**
 * Get A/B test variant for a request
 */
function getAbTestVariant(request, test) {
  // Check for existing test cookie
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  let variant = cookies[test.cookieName];
  
  // If no variant is assigned, randomly assign one based on weights
  if (!variant) {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < test.variants.length; i++) {
      cumulativeWeight += test.weights ? test.weights[i] : (1 / test.variants.length);
      if (random <= cumulativeWeight) {
        variant = test.variants[i];
        break;
      }
    }
  }
  
  return variant || test.variants[0]; // Fallback to first variant
}

/**
 * Add A/B test cookie to response
 */
function addAbTestCookie(response, test, variant) {
  const newResponse = new Response(response.body, response);
  
  // Set cookie with variant
  const expires = new Date();
  expires.setDate(expires.getDate() + test.cookieExpiry);
  
  newResponse.headers.append('Set-Cookie', 
    `${test.cookieName}=${variant}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax; Secure`
  );
  
  return newResponse;
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
function applyMobileOptimizations(response, url) {
  // Clone the response
  const newResponse = new Response(response.body, response);
  
  // Add a header to indicate mobile optimization
  newResponse.headers.set('X-Mobile-Optimized', 'true');
  
  // Set Vary header to ensure proper caching
  newResponse.headers.append('Vary', 'User-Agent');
  
  return newResponse;
}

/**
 * Check if a response is cacheable
 */
function isCacheable(request, response) {
  // Only cache GET requests
  if (request.method !== 'GET') return false;
  
  // Don't cache if Cache-Control: no-store
  const cacheControl = response.headers.get('Cache-Control') || '';
  if (cacheControl.includes('no-store')) return false;
  
  // Don't cache admin or API routes
  const url = new URL(request.url);
  if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/')) {
    return false;
  }
  
  // Don't cache error responses
  if (response.status >= 400) return false;
  
  return true;
}

/**
 * Check if a path is protected by bot protection
 */
function isProtectedPath(pathname) {
  return config.botProtection.protectedPaths.some(pattern => {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return pathname.startsWith(prefix);
    }
    return pathname === pattern;
  });
}

/**
 * Detect if a request is from a bot
 * Returns a score between 0 and 1, where higher means more likely to be a bot
 */
async function detectBot(request) {
  // Simple bot detection based on headers and behavior
  const userAgent = request.headers.get('User-Agent') || '';
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const acceptEncoding = request.headers.get('Accept-Encoding') || '';
  
  let score = 0;
  
  // Check for missing or suspicious headers
  if (!userAgent) score += 0.5;
  if (!acceptLanguage) score += 0.3;
  if (!acceptEncoding) score += 0.2;
  
  // Check for bot signatures in user agent
  if (/bot|crawl|spider|scrape|phantom|headless/i.test(userAgent)) {
    score += 0.7;
  }
  
  // In a real implementation, you would use more sophisticated techniques
  // such as TLS fingerprinting, behavior analysis, etc.
  
  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Create a response for bot challenges
 */
function createBotChallengeResponse() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Required</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 2rem; }
        h1 { color: #2563eb; }
        .challenge { background: #f3f4f6; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0; }
        button { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.25rem; cursor: pointer; font-weight: 500; }
        button:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <h1>Verification Required</h1>
      <p>We need to verify that you're a human before proceeding. This helps us prevent spam and maintain a high-quality experience for all users.</p>
      
      <div class="challenge">
        <p>Please click the button below to continue to the site:</p>
        <button id="verify">I'm a Human</button>
      </div>
      
      <script>
        // Simple challenge that sets a cookie and reloads the page
        document.getElementById('verify').addEventListener('click', function() {
          document.cookie = "bot_verified=true; path=/; max-age=3600; secure; samesite=lax";
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: 403,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store'
    }
  });
}