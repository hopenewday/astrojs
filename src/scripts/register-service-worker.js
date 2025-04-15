/**
 * Service Worker Registration Script
 * 
 * This script handles the registration of the service worker
 * and provides utilities for managing PWA functionality including:
 * - Service worker registration and updates
 * - Offline support
 * - Push notifications
 */

// Check if service workers are supported
const isServiceWorkerSupported = 'serviceWorker' in navigator;

// Register the service worker
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported) {
    console.log('Service workers are not supported in this browser.');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    console.log('Service worker registered successfully:', registration.scope);
    
    // Set up update handling
    setupUpdateHandling(registration);
    
    // Set up message handling for service worker communication
    setupMessageHandling();
    
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return false;
  }
}

// Handle service worker updates
function setupUpdateHandling(registration) {
  // Check for updates when the page loads
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is installed but waiting to activate
        showUpdateNotification();
      }
    });
  });
  
  // Listen for controller change to reload the page
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Only reload if the user has accepted the update
    if (window.isUpdateAccepted) {
      window.location.reload();
    }
  });
}

// Show a notification when an update is available
function showUpdateNotification() {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-notification-content">
      <p>A new version of this site is available.</p>
      <button class="update-button">Update Now</button>
    </div>
  `;
  
  // Add styles
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = 'var(--color-primary, #4f46e5)';
  notification.style.color = 'white';
  notification.style.padding = '16px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.zIndex = '9999';
  notification.style.transition = 'transform 0.3s ease-in-out';
  notification.style.transform = 'translateY(150%)';
  
  // Add to the DOM
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
  }, 100);
  
  // Add event listener to the update button
  const updateButton = notification.querySelector('.update-button');
  updateButton.addEventListener('click', () => {
    window.isUpdateAccepted = true;
    
    // Tell the service worker to skipWaiting
    navigator.serviceWorker.ready.then(registration => {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    });
    
    // Remove the notification
    notification.style.transform = 'translateY(150%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  });
}

// Check if the app can be installed (PWA)
export function checkPwaInstallable() {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the default browser install prompt
    event.preventDefault();
    
    // Store the event for later use
    window.deferredInstallPrompt = event;
    
    // Show your custom install button
    showInstallButton();
  });
  
  // Listen for successful installs
  window.addEventListener('appinstalled', () => {
    // Hide the install button
    hideInstallButton();
    
    // Clear the saved prompt
    window.deferredInstallPrompt = null;
    
    console.log('PWA was installed successfully');
  });
}

// Show the custom install button
function showInstallButton() {
  const installButtons = document.querySelectorAll('.pwa-install-button');
  
  installButtons.forEach(button => {
    button.style.display = 'block';
    
    button.addEventListener('click', async () => {
      if (!window.deferredInstallPrompt) return;
      
      // Show the install prompt
      window.deferredInstallPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await window.deferredInstallPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      
      // Clear the saved prompt
      window.deferredInstallPrompt = null;
      
      // Hide the button if installed
      if (outcome === 'accepted') {
        hideInstallButton();
      }
    });
  });
}

// Hide the install button
function hideInstallButton() {
  const installButtons = document.querySelectorAll('.pwa-install-button');
  
  installButtons.forEach(button => {
    button.style.display = 'none';
  });
}

// Initialize service worker and PWA features
export function initializePwa() {
  registerServiceWorker();
  checkPwaInstallable();
}

// Auto-initialize when imported as a module
if (typeof window !== 'undefined') {
  // Wait for the DOM to be fully loaded
  if (document.readyState === 'complete') {
    initializePwa();
  } else {
    window.addEventListener('load', initializePwa);
  }
}