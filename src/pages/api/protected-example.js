/**
 * Example protected API endpoint using Auth0 token validation
 * This demonstrates how to use the authMiddleware to secure API routes
 */

import { withAuth } from '../../utils/authMiddleware.js';

/**
 * Protected GET endpoint that requires specific permissions and scopes
 * The withAuth middleware handles all token validation and authorization
 */
export const get = withAuth(
  async ({ request, user }) => {
    // At this point, the token has been validated and the user has the required permissions
    // The 'user' object contains the decoded token payload
    
    // Return protected data
    return new Response(
      JSON.stringify({
        message: 'You have successfully accessed the protected endpoint',
        user: {
          sub: user.sub,
          email: user.email,
          permissions: user.permissions || [],
          // Don't include sensitive information
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  },
  {
    // Configure required permissions and scopes
    requiredPermissions: ['read:data'],
    requiredScopes: ['api:access']
  }
);

/**
 * Protected POST endpoint with different permission requirements
 */
export const post = withAuth(
  async ({ request, user }) => {
    try {
      // Parse the request body
      const data = await request.json();
      
      // Process the data (in a real app, this might update a database)
      const processedData = {
        ...data,
        processedAt: new Date().toISOString(),
        processedBy: user.sub
      };
      
      return new Response(
        JSON.stringify({
          message: 'Data processed successfully',
          result: processedData
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error processing request:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Failed to process request',
          details: error.message
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  },
  {
    // Different permissions for POST requests
    requiredPermissions: ['write:data'],
    requiredScopes: ['api:access']
  }
);