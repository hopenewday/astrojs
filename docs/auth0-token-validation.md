# Auth0 Token Validation Guide

This document provides a comprehensive guide to the Auth0 token validation implementation in this project. It covers the core functionality, usage patterns, and security best practices.

## Overview

The token validation system implements Auth0's best practices for JWT validation, including:

- Signature verification using JSON Web Key Sets (JWKS)
- Token expiration and validity checks
- Audience and issuer validation
- Permission and scope verification
- Token refresh handling

## Core Components

### 1. Token Validator

The `tokenValidator.js` utility provides the foundation for all token-related operations:

```javascript
import { validateToken, isTokenExpiringSoon, validatePermissions } from '../utils/tokenValidator.js';
```

Key functions:

- `validateToken(token)`: Performs comprehensive validation including signature verification
- `extractPermissions(payload)`: Gets permissions from a token payload
- `hasPermission(payload, permission)`: Checks for a specific permission
- `validatePermissions(payload, permissions)`: Validates multiple required permissions
- `extractScopes(payload)`: Gets scopes from a token payload
- `validateScopes(payload, scopes)`: Validates multiple required scopes
- `isTokenExpiringSoon(payload, window)`: Checks if a token is about to expire
- `refreshAccessToken(refreshToken)`: Handles token refresh

### 2. Auth Middleware

The `authMiddleware.js` utility provides ready-to-use middleware for protecting API routes:

```javascript
import { withAuth } from '../utils/authMiddleware.js';
```

Key functions:

- `extractBearerToken(request)`: Gets the token from the Authorization header
- `withAuth(handler, options)`: Middleware to protect routes with token validation

## Implementation Details

### JWKS Client Configuration

The system uses a JWKS client to fetch and cache Auth0's public keys:

```javascript
const jwksClient = {
  jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,                 // Cache the signing keys
  rateLimit: true,             // Enable rate limiting
  jwksRequestsPerMinute: 5,    // Limit requests to prevent abuse
  cacheMaxAge: 24 * 60 * 60 * 1000, // Cache for 24 hours
  cacheMaxEntries: 5           // Cache at most 5 keys
};
```

### Token Validation Process

1. Basic structure validation (ensure token has three parts)
2. Decode the token to extract the Key ID (kid) from the header
3. Fetch the corresponding public key from Auth0's JWKS endpoint
4. Verify the token signature, expiration, issuer, and audience
5. Return the validated payload or detailed error information

## Usage Examples

### Basic Token Validation

```javascript
async function checkToken(token) {
  const validation = await validateToken(token);
  
  if (validation.valid) {
    // Token is valid, use validation.payload
    console.log('Valid token for user:', validation.payload.sub);
  } else {
    // Token is invalid, handle the error
    console.error('Token validation failed:', validation.error);
  }
}
```

### Protecting an API Route

```javascript
// In src/pages/api/protected-data.js
import { withAuth } from '../../utils/authMiddleware.js';

export const get = withAuth(
  async ({ request, user }) => {
    // The user object contains the validated token payload
    return new Response(JSON.stringify({ 
      message: 'Protected data', 
      userId: user.sub 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }, 
  {
    requiredPermissions: ['read:data'],
    requiredScopes: ['api:access']
  }
);
```

### Checking Token Expiration

```javascript
import { validateToken, isTokenExpiringSoon, refreshAccessToken } from '../utils/tokenValidator.js';

async function handleRequest(token, refreshToken) {
  const validation = await validateToken(token);
  
  if (!validation.valid) {
    return { error: validation.error };
  }
  
  // Check if token is about to expire (within 5 minutes by default)
  if (isTokenExpiringSoon(validation.payload)) {
    try {
      // Proactively refresh the token
      const newTokens = await refreshAccessToken(refreshToken);
      
      // Return the new tokens along with the response
      return { 
        data: { /* your response data */ },
        newTokens
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Continue with the current token if refresh fails
    }
  }
  
  return { data: { /* your response data */ } };
}
```

## Security Best Practices

1. **Always Verify Signatures**: Never trust a token without verifying its signature.

2. **Check All Claims**: Validate issuer, audience, expiration, and not-before claims.

3. **Use HTTPS**: Always use HTTPS for token transmission to prevent interception.

4. **Implement Proper Error Handling**: Return generic errors to clients to avoid leaking implementation details.

5. **Cache JWKS Keys**: Use the built-in caching to reduce load on Auth0 servers and improve performance.

6. **Refresh Tokens Securely**: Store refresh tokens securely and never expose them to the client.

7. **Validate Permissions**: Always check that users have the required permissions for the requested action.

## Environment Configuration

Ensure these environment variables are set for proper token validation:

```
AUTH0_DOMAIN=https://your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

## Troubleshooting

### Common Issues

1. **Invalid Token Format**: Ensure the token is a valid JWT with three parts separated by periods.

2. **Signature Verification Failed**: Check that the token was issued by Auth0 and hasn't been tampered with.

3. **Token Expired**: The token's expiration time has passed. Refresh the token or request a new one.

4. **Invalid Issuer/Audience**: Ensure the AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables match the values in your Auth0 configuration.

5. **Missing Permissions**: The user doesn't have the required permissions for the requested action.

### Debugging

For debugging token issues, you can decode (but not verify) a token to inspect its contents:

```javascript
import jwt from 'jsonwebtoken';

function debugToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('Header:', decoded.header);
    console.log('Payload:', decoded.payload);
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}
```

## Auth0 Management API Token Caching

The system implements efficient token caching for Auth0 Management API tokens to reduce API calls and improve performance:

```javascript
import { clearTokenCache } from '../utils/auth0Auth.js';

// The token cache is managed automatically
// You can clear it if needed (rarely necessary)
clearTokenCache();
```

Key features of the token caching system:

1. **Automatic Caching**: Management API tokens are cached automatically
2. **Expiration Handling**: Tokens are refreshed before they expire
3. **Buffer Time**: A 10-minute buffer ensures tokens are refreshed before expiration
4. **Cache Invalidation**: The cache can be manually cleared if needed

## Environment Variable Validation

The system includes validation for Auth0 environment variables:

```javascript
import { validateAuth0Config } from '../utils/auth0Auth.js';

const configValidation = validateAuth0Config();
if (!configValidation.valid) {
  console.error('Missing Auth0 environment variables:', configValidation.missing);
  // Handle the error appropriately
}
```

This helps identify missing or misconfigured environment variables early in the application lifecycle.

## References

- [Auth0 JWT Validation](https://auth0.com/docs/secure/tokens/json-web-tokens/validate-json-web-tokens)
- [JWKS Validation Best Practices](https://auth0.com/blog/navigating-rs256-and-jwks/)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)
- [JWT.io Debugger](https://jwt.io/) - Useful tool for inspecting tokens