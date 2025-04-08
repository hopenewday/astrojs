/**
 * Utility functions for validating and handling Auth0 tokens
 * Provides robust token validation, expiration checking, and security verification
 * 
 * This module implements Auth0's best practices for token validation including:
 * - JWT signature verification using JWKS
 * - Token expiration and validity checks
 * - Audience and issuer validation
 * - Permission and scope verification
 * - Token refresh handling
 */

/**
 * Validates an Auth0 access token
 * Checks token structure, signature, expiration, and issuer
 * 
 * @param {string} token - The Auth0 access token to validate
 * @returns {Promise<{valid: boolean, error?: string, payload?: Object}>} - Validation result
 */
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Initialize JWKS client for Auth0
let jwksClientInstance = null;

/**
 * Gets the JWKS client instance, creating it if it doesn't exist
 * @returns {Object} - JWKS client instance
 */
function getJwksClient() {
  if (!jwksClientInstance) {
    jwksClientInstance = jwksClient({
      jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,                 // Cache the signing keys
      rateLimit: true,             // Enable rate limiting
      jwksRequestsPerMinute: 5,    // Limit requests to prevent abuse
      cacheMaxAge: 24 * 60 * 60 * 1000, // Cache for 24 hours
      cacheMaxEntries: 5           // Cache at most 5 keys
    });
  }
  return jwksClientInstance;
}

/**
 * Gets the signing key from Auth0's JWKS endpoint
 * @param {string} kid - Key ID from the JWT header
 * @returns {Promise<Object>} - The signing key
 */
async function getSigningKey(kid) {
  const client = getJwksClient();
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        return reject(err);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      resolve(signingKey);
    });
  });
}

/**
 * Validates an Auth0 access token
 * Performs comprehensive validation including signature verification
 * 
 * @param {string} token - The Auth0 access token to validate
 * @returns {Promise<{valid: boolean, error?: string, payload?: Object}>} - Validation result
 */
export async function validateToken(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // Basic structure validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the payload without verification to get basic info
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      return { valid: false, error: 'Invalid token: Could not decode' };
    }

    // Get the key ID from the JWT header
    const kid = decodedToken.header.kid;
    if (!kid) {
      return { valid: false, error: 'Invalid token: No key ID (kid) in header' };
    }

    try {
      // Get the signing key from Auth0's JWKS endpoint
      const signingKey = await getSigningKey(kid);

      // Verify the token with the correct signing key
      const expectedIssuer = process.env.AUTH0_DOMAIN;
      const expectedAudience = process.env.AUTH0_AUDIENCE || process.env.AUTH0_CLIENT_ID;
      
      const verifyOptions = {
        issuer: expectedIssuer,
        audience: expectedAudience,
        algorithms: ['RS256'] // Auth0 uses RS256 by default
      };

      // Verify the token
      const payload = jwt.verify(token, signingKey, verifyOptions);
      
      return { valid: true, payload };
    } catch (verifyError) {
      // Handle specific verification errors
      if (verifyError.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token has expired' };
      } else if (verifyError.name === 'JsonWebTokenError') {
        return { valid: false, error: `Token validation failed: ${verifyError.message}` };
      } else if (verifyError.name === 'NotBeforeError') {
        return { valid: false, error: 'Token not yet valid' };
      }
      
      // Generic error for other cases
      return { valid: false, error: 'Token signature verification failed' };
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Checks if a token is about to expire within the specified time window
 * Useful for proactive token refresh before expiration
 * 
 * @param {Object} payload - The decoded token payload
 * @param {number} expirationWindow - Time window in seconds before actual expiration (default: 300 seconds/5 minutes)
 * @returns {boolean} - Whether the token is about to expire
 */
export function isTokenExpiringSoon(payload, expirationWindow = 300) {
  if (!payload || !payload.exp) {
    return true; // If no expiration or payload, assume it needs refresh
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiration = payload.exp - currentTime;
  
  return timeUntilExpiration <= expirationWindow;
}

/**
 * Extracts user permissions from an Auth0 token
 * 
 * @param {Object} payload - The decoded token payload
 * @returns {string[]} - Array of permission strings
 */
export function extractPermissions(payload) {
  if (!payload || !payload.permissions) {
    return [];
  }
  
  return payload.permissions;
}

/**
 * Checks if a token has a specific permission
 * 
 * @param {Object} payload - The decoded token payload
 * @param {string} requiredPermission - The permission to check for
 * @returns {boolean} - Whether the token has the permission
 */
export function hasPermission(payload, requiredPermission) {
  const permissions = extractPermissions(payload);
  return permissions.includes(requiredPermission);
}

/**
 * Validates that a token has all required permissions
 * 
 * @param {Object} payload - The decoded token payload
 * @param {string[]} requiredPermissions - Array of permissions to check for
 * @returns {{valid: boolean, missing?: string[]}} - Validation result with missing permissions if invalid
 */
export function validatePermissions(payload, requiredPermissions) {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
    return { valid: true };
  }
  
  const userPermissions = extractPermissions(payload);
  const missingPermissions = requiredPermissions.filter(perm => !userPermissions.includes(perm));
  
  return {
    valid: missingPermissions.length === 0,
    missing: missingPermissions.length > 0 ? missingPermissions : undefined
  };
}

/**
 * Extracts scopes from an Auth0 token
 * 
 * @param {Object} payload - The decoded token payload
 * @returns {string[]} - Array of scope strings
 */
export function extractScopes(payload) {
  if (!payload || !payload.scope) {
    return [];
  }
  
  // Auth0 typically provides scope as a space-delimited string
  return payload.scope.split(' ').filter(Boolean);
}

/**
 * Validates that a token has all required scopes
 * 
 * @param {Object} payload - The decoded token payload
 * @param {string[]} requiredScopes - Array of scopes to check for
 * @returns {{valid: boolean, missing?: string[]}} - Validation result with missing scopes if invalid
 */
export function validateScopes(payload, requiredScopes) {
  if (!Array.isArray(requiredScopes) || requiredScopes.length === 0) {
    return { valid: true };
  }
  
  const tokenScopes = extractScopes(payload);
  const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
  
  return {
    valid: missingScopes.length === 0,
    missing: missingScopes.length > 0 ? missingScopes : undefined
  };
}

/**
 * Handles token refresh when a token is about to expire
 * 
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{accessToken: string, refreshToken: string}>} - New tokens
 */
export async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }
    
    const tokenResponse = await fetch(`${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        refresh_token: refreshToken
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(`Failed to refresh token: ${errorData.error || tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}