/**
 * CORS Middleware for API Endpoints
 * 
 * This middleware implements Cross-Origin Resource Sharing (CORS) policies
 * to control which domains can access the API resources.
 */

import type { APIContext } from 'astro';
import { getSecurityConfig } from '../config/security.config';

/**
 * Apply CORS headers to API responses
 * 
 * @param context The API context
 * @param next The next middleware function
 * @returns Response with CORS headers
 */
export async function corsMiddleware(context: APIContext, next: () => Promise<Response>): Promise<Response> {
  const { request } = context;
  const { corsOptions } = getSecurityConfig();
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request, corsOptions)
    });
  }
  
  // Process the request
  const response = await next();
  
  // Add CORS headers to the response
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request, corsOptions);
  
  // Apply CORS headers
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  
  // Return the response with CORS headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Generate CORS headers based on the request and configuration
 * 
 * @param request The incoming request
 * @param corsOptions CORS configuration options
 * @returns Object with CORS headers
 */
function getCorsHeaders(request: Request, corsOptions: any): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = corsOptions.allowOrigins || [];
  
  // Determine if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  const allowOrigin = isAllowedOrigin ? origin : allowedOrigins[0] || '';
  
  // Build CORS headers
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': corsOptions.allowMethods.join(', '),
    'Access-Control-Allow-Headers': corsOptions.allowHeaders.join(', '),
    'Access-Control-Max-Age': corsOptions.maxAge.toString()
  };
  
  // Add exposed headers if configured
  if (corsOptions.exposeHeaders && corsOptions.exposeHeaders.length > 0) {
    headers['Access-Control-Expose-Headers'] = corsOptions.exposeHeaders.join(', ');
  }
  
  // Add credentials header if allowed
  if (corsOptions.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}