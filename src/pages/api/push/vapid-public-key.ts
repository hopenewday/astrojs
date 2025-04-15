/**
 * API endpoint to provide the VAPID public key for push notifications
 * 
 * This endpoint returns the public VAPID key that clients need to subscribe
 * to push notifications. The key is generated using the web-push library
 * and stored in environment variables.
 */

import type { APIRoute } from 'astro';

export const get: APIRoute = async () => {
  // Get the VAPID public key from environment variables
  const vapidPublicKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
  
  if (!vapidPublicKey) {
    return new Response('VAPID public key not configured', {
      status: 500
    });
  }
  
  return new Response(vapidPublicKey, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};