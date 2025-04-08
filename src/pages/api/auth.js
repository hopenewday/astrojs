// OAuth authentication endpoint for Sveltia CMS
// This endpoint handles Auth0 OAuth authentication for the admin interface
import { getAuth0User, verifyUserAccess } from '../../utils/auth0Auth.js';

export async function post({ request }) {
  try {
    // Get the request body
    const data = await request.json();
    
    // Validate the incoming request
    if (!data.code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Exchange the code for an access token using Auth0's OAuth API
    const tokenResponse = await fetch(`${import.meta.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: import.meta.env.AUTH0_CLIENT_ID,
        client_secret: import.meta.env.AUTH0_CLIENT_SECRET,
        code: data.code,
        redirect_uri: new URL('/admin/', import.meta.env.SITE).toString()
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Auth0 token exchange error:', errorData);
      
      return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Parse the token response
    const tokenData = await tokenResponse.json();
    
    // Get user information from Auth0
    const userData = await getAuth0User(tokenData.access_token);
    
    if (!userData) {
      console.error('Auth0 user verification failed');
      
      return new Response(JSON.stringify({ error: 'User verification failed' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Verify user access based on Auth0 roles/permissions
    const hasAccess = await verifyUserAccess(
      tokenData.access_token,
      userData.sub // Auth0 user ID
    );
    
    if (!hasAccess) {
      console.error('User does not have access to the CMS');
      
      return new Response(JSON.stringify({ error: 'Access denied. User does not have required permissions.' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Return the successful response with the token
    return new Response(JSON.stringify({
      token: tokenData.access_token,
      provider: 'auth0',
      userData: {
        name: userData.name,
        email: userData.email,
        avatar: userData.picture
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}