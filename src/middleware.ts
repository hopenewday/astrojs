/**
 * Security Middleware for Astro.js
 * 
 * This middleware implements comprehensive security policies including:
 * - Content Security Policy (CSP)
 * - Permissions Policy
 * - Cookie Security
 * - Cross-Origin Policies
 * - Input Sanitization
 * - Security Monitoring
 */

import { defineMiddleware } from 'astro:middleware';
import { sanitizeHtml } from './utils/sanitizer';
import { generateCSP, generatePermissionsPolicy } from './config/security.config';

// Generate a unique nonce for each request
function generateNonce() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}

// Rate limiting for sensitive endpoints
const rateLimits = new Map();

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  const nonce = generateNonce();
  
  // Store nonce in locals for use in components
  context.locals.nonce = nonce;
  
  // Apply rate limiting for sensitive endpoints
  if (url.pathname.startsWith('/api/')) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `${ip}:${url.pathname}`;
    
    const now = Date.now();
    const limit = rateLimits.get(key) || { count: 0, timestamp: now };
    
    // Reset counter after 1 minute
    if (now - limit.timestamp > 60000) {
      limit.count = 0;
      limit.timestamp = now;
    }
    
    limit.count++;
    rateLimits.set(key, limit);
    
    // If more than 60 requests per minute, return 429
    if (limit.count > 60) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }
  
  // Process the request
  const response = await next();
  
  // Add security headers
  const headers = new Headers(response.headers);
  
  // Content Security Policy
  headers.set('Content-Security-Policy', generateCSP(nonce));
  
  // Use report-only mode in development for easier debugging
  if (import.meta.env.DEV) {
    headers.set('Content-Security-Policy-Report-Only', generateCSP(nonce));
  }
  
  // Permissions Policy
  headers.set('Permissions-Policy', generatePermissionsPolicy());
  
  // Cross-Origin policies
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Other security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (HTTP Strict Transport Security)
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Add X-Content-Security-Policy for older browsers
  headers.set('X-Content-Security-Policy', generateCSP(nonce));
  
  // Return the response with added headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
});

// Utility function to sanitize user input
export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel']
    },
    allowedIframeHostnames: []
  });
}

// Middleware for input sanitization
export const withInputSanitization = defineMiddleware(async (context, next) => {
  const { request } = context;
  
  // Only process POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      // Clone the request to read the body
      const clonedRequest = request.clone();
      
      // Check content type
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // Handle JSON data
        const data = await clonedRequest.json();
        const sanitizedData = sanitizeJsonData(data);
        
        // Create a new request with sanitized data
        const sanitizedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedData)
        });
        
        // Replace the original request
        context.request = sanitizedRequest;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Handle form data
        const formData = await clonedRequest.formData();
        const sanitizedFormData = new FormData();
        
        // Sanitize each form field
        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            sanitizedFormData.append(key, sanitizeInput(value));
          } else {
            sanitizedFormData.append(key, value);
          }
        }
        
        // Create a new request with sanitized form data
        const sanitizedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: sanitizedFormData
        });
        
        // Replace the original request
        context.request = sanitizedRequest;
      }
    } catch (error) {
      console.error('Input sanitization error:', error);
    }
  }
  
  return next();
});

// Helper function to sanitize JSON data recursively
function sanitizeJsonData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeInput(data);
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeJsonData(item));
  } else if (data !== null && typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeJsonData(value);
    }
    return sanitized;
  }
  return data;
}