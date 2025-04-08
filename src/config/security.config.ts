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

interface CSPConfig {
  directives: Record<string, string[]>;
  reportUri: string;
  reportOnly: boolean;
}

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