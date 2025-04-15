/**
 * Security Configuration
 * 
 * This file centralizes all security-related configurations for the application.
 * It includes Content Security Policy (CSP), Permissions Policy, and other security headers.
 */

// Types for security configuration
export interface SecurityConfig {
  contentSecurityPolicy: CSPConfig;
  permissionsPolicy: PermissionsPolicyConfig;
  cookieOptions: CookieOptions;
  corsOptions: CorsOptions;
  rateLimiting: RateLimitingConfig;
}

/**
 * Generate Content Security Policy header value
 * 
 * @param nonce Optional nonce for inline scripts
 * @returns CSP header value
 */
export function generateCSP(nonce?: string): string {
  const config = getSecurityConfig();
  const { directives } = config.contentSecurityPolicy;
  
  // Clone directives to avoid modifying the original
  const cspDirectives = JSON.parse(JSON.stringify(directives));
  
  // Add nonce to script-src and style-src if provided
  if (nonce) {
    if (cspDirectives['script-src']) {
      cspDirectives['script-src'].push(`'nonce-${nonce}'`);
    }
    if (cspDirectives['style-src']) {
      cspDirectives['style-src'].push(`'nonce-${nonce}'`);
    }
  }
  
  // Build CSP string
  return Object.entries(cspDirectives)
    .map(([directive, values]) => {
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Generate Permissions Policy header value
 * 
 * @returns Permissions Policy header value
 */
export function generatePermissionsPolicy(): string {
  const config = getSecurityConfig();
  const { features } = config.permissionsPolicy;
  
  return Object.entries(features)
    .map(([feature, value]) => `${feature}=${value}`)
    .join(', ');
}

interface CSPConfig {
  directives: Record<string, string[]>;
  reportUri: string;
  reportOnly: boolean;
}

const cspDirectives: Record<string, string[]> = {
  'default-src': ["'none'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Astro/Svelte hydration
    `https://${process.env.AUTH0_DOMAIN}/`,
    'https://cdn.sveltia.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://images.unsplash.com',
    'https://cdn.sveltia.com'
  ],
  'connect-src': [
    "'self'",
    `https://${process.env.AUTH0_DOMAIN}/`,
    'https://sveltia-cms.api/'
  ],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'report-uri': [process.env.CSP_REPORT_ENDPOINT]
};

export const securityConfig: SecurityConfig = {
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportUri: '/csp-violation-report',
    reportOnly: process.env.NODE_ENV === 'development'
  },

interface PermissionsPolicyConfig {
  features: Record<string, string>;
}

interface CookieOptions {
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
  maxAge: number;
  domain?: string;
  path: string;
  prefixes: Array<'__Host-' | '__Secure-'>;
}

interface CorsOptions {
  allowOrigins: string[];
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders: string[];
  maxAge: number;
  allowCredentials: boolean;
}

interface RateLimitingConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  message: string;
  headers: boolean;
  skipSuccessfulRequests: boolean;
  keyGenerator: (req: Request) => string;
}

// Default security configuration
const defaultSecurityConfig: SecurityConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'strict-dynamic'", 
        // Allow specific CDNs
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
      'object-src': ["'none'"]
    },
    reportUri: import.meta.env.CSP_REPORT_URI || '/api/csp-report',
    reportOnly: false
  },
  permissionsPolicy: {
    features: {
      'accelerometer': '()',
      'camera': '()',
      'geolocation': '()',
      'gyroscope': '()',
      'magnetometer': '()',
      'microphone': '()',
      'payment': '()',
      'usb': '()',
      'interest-cohort': '()',
      'fullscreen': '(self)',
      'display-capture': '(self)'
    }
  },
  cookieOptions: {
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    prefixes: ['__Host-'] // Most secure option, requires HTTPS, no domain, path=/
  },
  corsOptions: {
    allowOrigins: [import.meta.env.PUBLIC_SITE_URL || 'https://chakrirchain.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-ID'],
    maxAge: 86400, // 24 hours
    allowCredentials: true
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 60, // 60 requests
    windowMs: 60 * 1000, // per minute
    message: 'Too many requests, please try again later.',
    headers: true,
    skipSuccessfulRequests: false,
    keyGenerator: (request: Request) => {
      // Use CF-Connecting-IP header if available (Cloudflare)
      return request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
    }
  }
};

/**
 * Get the security configuration
 * Merges default config with environment-specific overrides
 */
export function getSecurityConfig(): SecurityConfig {
  // Environment-specific overrides
  const overrides: Partial<SecurityConfig> = {};
  
  // In development, allow unsafe-eval for better debugging
  if (import.meta.env.DEV) {
    overrides.contentSecurityPolicy = {
      ...defaultSecurityConfig.contentSecurityPolicy,
      directives: {
        ...defaultSecurityConfig.contentSecurityPolicy.directives,
        'script-src': [
          ...defaultSecurityConfig.contentSecurityPolicy.directives['script-src'],
          "'unsafe-eval'"
        ]
      }
    };
    
    // Less strict rate limiting in development
    overrides.rateLimiting = {
      ...defaultSecurityConfig.rateLimiting,
      maxRequests: 300,
      windowMs: 60 * 1000
    };
  }
  
  // Merge default config with overrides
  return {
    ...defaultSecurityConfig,
    ...overrides
  };
}

/**
 * Generate a Content Security Policy string from the configuration
 * @param nonce Optional nonce to include in the CSP
 */
export function generateCSP(nonce?: string): string {
  const config = getSecurityConfig().contentSecurityPolicy;
  const directives = { ...config.directives };
  
  // Add nonce to script-src if provided
  if (nonce) {
    directives['script-src'] = [
      ...directives['script-src'],
      `'nonce-${nonce}'`
    ];
  }
  
  // Add report-uri directive
  directives['report-uri'] = [config.reportUri];
  
  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Generate a Permissions Policy string from the configuration
 */
export function generatePermissionsPolicy(): string {
  const config = getSecurityConfig().permissionsPolicy;
  
  return Object.entries(config.features)
    .map(([feature, value]) => `${feature}=${value}`)
    .join(', ');
}

/**
 * Generate secure cookie options based on the configuration
 * @param name Cookie name
 * @param options Additional cookie options
 */
export function getSecureCookieOptions(name: string, options: Partial<CookieOptions> = {}): {
  name: string;
  options: CookieOptions;
} {
  const config = getSecurityConfig().cookieOptions;
  const mergedOptions = { ...config, ...options };
  
  // Apply cookie prefix if configured
  const prefix = mergedOptions.prefixes.length > 0 ? mergedOptions.prefixes[0] : '';
  const securedName = prefix + name;
  
  return {
    name: securedName,
    options: mergedOptions
  };
}