/**
 * Push Notification Utilities
 * 
 * This module provides utility functions for managing push notifications
 * in the browser, including subscription management and permission handling.
 */

/**
 * Check if push notifications are supported in the current browser
 */
export function isPushNotificationSupported(): boolean {
  return 'PushManager' in window && 'serviceWorker' in navigator;
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  return Notification.permission;
}

/**
 * Request permission to show notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications');
    return 'denied';
  }
  
  return await Notification.requestPermission();
}

/**
 * Convert a base64 string to a Uint8Array
 * (needed for the applicationServerKey)
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    if (!isPushNotificationSupported()) {
      console.error('Push notifications are not supported');
      return null;
    }
    
    const registration = await navigator.serviceWorker.ready;
    
    // Get the server's public key
    const response = await fetch('/api/push/vapid-public-key');
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    
    const vapidPublicKey = await response.text();
    
    // Convert the public key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Get the current subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }
    
    // Create a new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    
    // Send the subscription to the server
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true; // Already unsubscribed
    }
    
    // Unsubscribe from push manager
    const success = await subscription.unsubscribe();
    
    if (success) {
      // Notify the server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    }
    
    return success;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Send the subscription to the server
 */
export async function sendSubscriptionToServer(subscription: PushSubscription): Promise<any> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending subscription to server:', error);
    throw error;
  }
}

/**
 * Get the current push subscription if it exists
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!isPushNotificationSupported()) {
      return null;
    }
    
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting current push subscription:', error);
    return null;
  }
}

/**
 * Send a test notification (for development purposes)
 */
export async function sendTestNotification(): Promise<any> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'GET'
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}