/**
 * Utility functions for Auth0 authentication and authorization for Sveltia CMS
 * Provides secure user verification, role-based access control, and token management
 * for integration with the Sveltia CMS platform.
 */

import { validateToken, isTokenExpiringSoon } from './tokenValidator.js';

// Cache for Management API tokens to reduce API calls
const tokenCache = {
  managementToken: null,
  expiresAt: 0,
  // Default cache duration of 10 minutes (in milliseconds)
  cacheDuration: 10 * 60 * 1000
};

/**
 * Get user information from Auth0 API
 * 
 * @param {string} accessToken - Auth0 access token
 * @returns {Promise<Object|null>} - User data or null if error
 * @throws {Error} - If the token is invalid or the request fails
 */
export async function getAuth0User(accessToken) {
  try {
    // Validate the token before using it
    const tokenValidation = await validateToken(accessToken);
    if (!tokenValidation.valid) {
      throw new Error(`Invalid access token: ${tokenValidation.error}`);
    }
    
    // Auth0 userinfo endpoint to get the user profile
    const userResponse = await fetch(`${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      const statusCode = userResponse.status;
      let errorMessage = `Failed to fetch user data from Auth0 (${statusCode})`;
      
      try {
        // Try to get more detailed error information
        const errorData = await userResponse.json();
        if (errorData && errorData.error_description) {
          errorMessage += `: ${errorData.error_description}`;
        } else if (errorData && errorData.message) {
          errorMessage += `: ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse the error response, just use the status text
        errorMessage += `: ${userResponse.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    return await userResponse.json();
  } catch (error) {
    console.error('Error fetching Auth0 user:', error);
    return null;
  }
}

/**
 * Verify if a user has access to the CMS based on Auth0 roles or permissions
 * 
 * @param {string} accessToken - Auth0 access token
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<boolean>} - Whether the user has access
 */
export async function verifyUserAccess(accessToken, userId) {
  try {
    // Validate the access token first
    const tokenValidation = await validateToken(accessToken);
    if (!tokenValidation.valid) {
      console.error('Invalid access token:', tokenValidation.error);
      return false;
    }
    
    // Get user permissions from Auth0 Management API
    // Note: This requires a Management API token with read:users and read:roles permissions
    const managementToken = await getManagementApiToken();
    
    if (!managementToken) {
      throw new Error('Failed to get Auth0 Management API token');
    }
    
    // Get user roles
    const rolesResponse = await fetch(`${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!rolesResponse.ok) {
      const statusCode = rolesResponse.status;
      let errorMessage = `Failed to fetch user roles (${statusCode})`;
      
      try {
        const errorData = await rolesResponse.json();
        if (errorData && errorData.message) {
          errorMessage += `: ${errorData.message}`;
        }
      } catch (parseError) {
        errorMessage += `: ${rolesResponse.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const roles = await rolesResponse.json();
    
    // Check if user has the required role (e.g., 'cms-admin', 'content-editor')
    const requiredRole = process.env.AUTH0_REQUIRED_ROLE || 'cms-admin';
    const hasRequiredRole = roles.some(role => role.name === requiredRole);
    
    return hasRequiredRole;
  } catch (error) {
    console.error('Error verifying user access:', error);
    return false;
  }
}

/**
 * Get a token for the Auth0 Management API with caching
 * 
 * @returns {Promise<string|null>} - Management API token or null if error
 */
async function getManagementApiToken() {
  try {
    const currentTime = Date.now();
    
    // Check if we have a cached token that's still valid
    if (tokenCache.managementToken && tokenCache.expiresAt > currentTime) {
      return tokenCache.managementToken;
    }
    
    // If no valid cached token, request a new one
    const tokenResponse = await fetch(`${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });
    
    if (!tokenResponse.ok) {
      const statusCode = tokenResponse.status;
      let errorMessage = `Failed to get Management API token (${statusCode})`;
      
      try {
        const errorData = await tokenResponse.json();
        if (errorData && errorData.error_description) {
          errorMessage += `: ${errorData.error_description}`;
        }
      } catch (parseError) {
        errorMessage += `: ${tokenResponse.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Cache the token with expiration
    // Default expiration is set to 10 minutes before the actual expiration
    // to ensure we don't use a token that's about to expire
    const expiresInMs = (tokenData.expires_in || 86400) * 1000; // Convert seconds to milliseconds
    const bufferTime = 10 * 60 * 1000; // 10 minutes buffer
    
    tokenCache.managementToken = tokenData.access_token;
    tokenCache.expiresAt = currentTime + expiresInMs - bufferTime;
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Management API token:', error);
    return null;
  }
}

/**
 * Clear the token cache
 * Useful for testing or when you need to force a new token request
 */
export function clearTokenCache() {
  tokenCache.managementToken = null;
  tokenCache.expiresAt = 0;
}

/**
 * Validate Auth0 environment variables
 * 
 * @returns {{valid: boolean, missing: string[]}} - Validation result with missing variables
 */
export function validateAuth0Config() {
  const requiredVars = [
    'AUTH0_DOMAIN',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_AUDIENCE'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    valid: missingVars.length === 0,
    missing: missingVars
  };
}