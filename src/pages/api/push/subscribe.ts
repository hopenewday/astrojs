/**
 * API endpoint to handle push notification subscriptions
 * 
 * This endpoint receives and stores push notification subscriptions from clients.
 * It uses the web-push library to send notifications to subscribed clients.
 */

import type { APIRoute } from 'astro';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = import.meta.env.VAPID_PRIVATE_KEY;
const vapidSubject = import.meta.env.VAPID_SUBJECT || 'mailto:contact@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

// In-memory storage for subscriptions (in production, use a database)
let subscriptions: PushSubscription[] = [];

export const post: APIRoute = async ({ request }) => {
  try {
    // Validate VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get the subscription object from the request
    const subscription = await request.json();
    
    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ error: 'Invalid subscription' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Store the subscription (in a real app, save to database)
    // Check if subscription already exists
    const existingSubscription = subscriptions.find(
      sub => (sub as any).endpoint === subscription.endpoint
    );

    if (!existingSubscription) {
      subscriptions.push(subscription as PushSubscription);
      console.log('New push subscription added');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error handling subscription:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Helper endpoint to send a test notification (for development purposes)
export const get: APIRoute = async () => {
  try {
    // Check if there are any subscriptions
    if (subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions available' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Send a test notification to all subscriptions
    const notificationPayload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test notification from Astro News',
      icon: '/icons/icon-192x192.png',
      url: '/'
    });

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        return { success: true, endpoint: (subscription as any).endpoint };
      } catch (error) {
        console.error('Error sending notification:', error);
        // Remove failed subscriptions
        if ((error as any).statusCode === 410) {
          subscriptions = subscriptions.filter(
            sub => (sub as any).endpoint !== (subscription as any).endpoint
          );
        }
        return { success: false, endpoint: (subscription as any).endpoint, error };
      }
    });

    const results = await Promise.all(sendPromises);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};