/**
 * Token validation utilities for authentication middleware
 * Provides functions to validate JWT tokens, permissions, and scopes
 */

import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

/**
 * Validates a JWT token
 * 
 * @param {string} token - The JWT token to validate
 * @param {Object} options - Validation options
 * @param {string} options.audience - The expected audience
 * @param {string} options.issuer - The expected issuer
 * @param {string[]} options.algorithms - The allowed algorithms
 * @param {Function} options.secret - Function to get the signing key
 * @returns {Object} - Validation result with valid flag and payload or error
 */
export async function validateToken(token, options) {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(token, options.secret, {
        audience: options.audience,
        issuer: options.issuer,
        algorithms: options.algorithms
      }, (err, decoded) => {
        if (err) {
          resolve({ valid: false, error: err.message });
        } else {
          resolve({ valid: true, payload: decoded });
        }
      });
    });
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validates if the token has the required permissions
 * 
 * @param {Object} payload - The decoded JWT payload
 * @param {string[]} requiredPermissions - The required permissions
 * @returns {Object} - Validation result with valid flag and missing permissions
 */
export function validatePermissions(payload, requiredPermissions) {
  if (!payload || !payload.permissions) {
    return { valid: false, missing: requiredPermissions };
  }
  
  const userPermissions = payload.permissions;
  const missing = requiredPermissions.filter(permission => 
    !userPermissions.includes(permission)
  );
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validates if the token has the required scopes
 * 
 * @param {Object} payload - The decoded JWT payload
 * @param {string[]} requiredScopes - The required scopes
 * @returns {Object} - Validation result with valid flag and missing scopes
 */
export function validateScopes(payload, requiredScopes) {
  if (!payload || !payload.scope) {
    return { valid: false, missing: requiredScopes };
  }
  
  const userScopes = payload.scope.split(' ');
  const missing = requiredScopes.filter(scope => 
    !userScopes.includes(scope)
  );
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Checks if the token is expiring soon
 * 
 * @param {Object} payload - The decoded JWT payload
 * @param {number} thresholdMinutes - Minutes threshold to consider token as expiring soon
 * @returns {boolean} - True if token is expiring soon, false otherwise
 */
export function isTokenExpiringSoon(payload, thresholdMinutes = 5) {
  if (!payload || !payload.exp) {
    return true; // If no expiration, consider it as expiring
  }
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeUntilExpiration = expirationTime - currentTime;
  
  // Check if token expires within the threshold
  return timeUntilExpiration < thresholdMinutes * 60 * 1000;
}

/**
 * Creates a JWKS client for token validation
 * 
 * @param {string} domain - The Auth0 domain
 * @returns {Object} - The JWKS client
 */
export function createJwksClient(domain) {
  return new JwksClient({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5
  });
}