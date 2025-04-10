/**
 * Authentication middleware utilities for API endpoints
 * Provides functions to protect routes with Auth0 token validation
 */

import { validateToken, validatePermissions, validateScopes, isTokenExpiringSoon } from './tokenValidator.js';

/**
 * Extracts the bearer token from the Authorization header
 * 
 * @param {Request} request - The incoming request object
 * @returns {string|null} - The bearer token or null if not found
 */
export function extractBearerToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Middleware to protect routes with Auth0 token validation
 * 
 * @param {Function} handler - The route handler function
 * @param {Object} options - Configuration options
 * @param {string[]} [options.requiredPermissions] - Required permissions for access
 * @param {string[]} [options.requiredScopes] - Required scopes for access
 * @returns {Function} - The protected route handler
 */
export function withAuth(handler, options = {}) {
  const { requiredPermissions = [], requiredScopes = [] } = options;
  
  return async (context) => {
    try {
      const { request } = context;
      
      // Extract token from Authorization header
      const token = extractBearerToken(request);
      if (!token) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Configure JWKS client
      const jwksClient = new JwksClient({
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
      });

      // Get signing key from JWKS endpoint
      const getKey = (header, callback) => {
        jwksClient.getSigningKey(header.kid, (err, key) => {
          if(err) return callback(err);
          callback(null, key.getPublicKey());
        });
      };

      // Validate token with JWKS
      const validation = await validateToken(token, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
        secret: getKey
      });
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error || 'Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Check for required permissions
      if (requiredPermissions.length > 0) {
        const permissionCheck = validatePermissions(validation.payload, requiredPermissions);
        if (!permissionCheck.valid) {
          return new Response(JSON.stringify({
            error: 'Insufficient permissions',
            missing: permissionCheck.missing
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Check for required scopes
      if (requiredScopes.length > 0) {
        const scopeCheck = validateScopes(validation.payload, requiredScopes);
        if (!scopeCheck.valid) {
          return new Response(JSON.stringify({
            error: 'Insufficient scopes',
            missing: scopeCheck.missing
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Check if token is about to expire
      if (isTokenExpiringSoon(validation.payload)) {
        // You could add a header to indicate the token should be refreshed
        // This is just informational and doesn't block the request
        context.tokenNeedsRefresh = true;
      }
      
      // Add the validated token payload to the context for use in the handler
      context.user = validation.payload;
      
      // Call the original handler with the enhanced context
      return handler(context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

/**
 * Example of using the withAuth middleware to protect a route
 * 
 * @example
 * // Protect a route with specific permissions
 * export const get = withAuth(async ({ request, user }) => {
 *   // The user object contains the validated token payload
 *   return new Response(JSON.stringify({ message: 'Protected data', user }), {
 *     headers: { 'Content-Type': 'application/json' }
 *   });
 * }, {
 *   requiredPermissions: ['read:data'],
 *   requiredScopes: ['api:access']
 * });
 */