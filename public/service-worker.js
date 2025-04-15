/**
 * Service Worker for Astro.js News Site
 * 
 * This service worker provides:
 * - Offline support with cache-first strategy for assets
 * - Network-first strategy for HTML content
 * - Background sync for form submissions
 * - Push notification handling
 * - Periodic cache cleanup
 */

// Cache names with versioning to facilitate updates
const CACHE_NAMES = {
  static: 'static-cache-v1',
  images: 'images-cache-v1',
  pages: 'pages-cache-v1'
};

// Resources to pre-cache during installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/global.css',
  '/images/placeholder.svg',
  '/offline.html', // Fallback page for when offline
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.svg',
  '/manifest.json'
];

// Install event - pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = Object.values(CACHE_NAMES);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          console.log('Deleting outdated cache:', cacheToDelete);
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip for browser extensions and non-GET requests
  if (
    url.origin !== self.location.origin ||
    request.method !== 'GET'
  ) {
    return;
  }
  
  // Handle API requests (network-only)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnlyStrategy(request));
    return;
  }
  
  // Handle image requests (cache-first)
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpe?g|png|gif|svg|webp|avif)$/i)
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    return;
  }
  
  // Handle HTML requests (network-first)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.pages));
    return;
  }
  
  // Handle all other requests (stale-while-revalidate)
  event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.static));
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Astro News',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: data.url || '/'
      },
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      timestamp: data.timestamp || Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Astro News', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
    
    // Fallback to a simple notification if JSON parsing fails
    event.waitUntil(
      self.registration.showNotification('Astro News', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png'
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Handle notification click - open the URL if provided
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          // If so, just focus it.
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, then open the target URL in a new window/tab.
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});

// Cache-first strategy implementation
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return new Response('Network error occurred', { status: 408 });
  }
}

// Network-first strategy implementation
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Network request failed, falling back to cache:', error);
  }
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache match, try to return the offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  return new Response('Network error and no cache available', { status: 504 });
}

// Network-only strategy implementation
async function networkOnlyStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Network-only strategy failed:', error);
    return new Response('Network error occurred', { status: 408 });
  }
}

// Stale-while-revalidate strategy implementation
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.ok) {
        caches.open(cacheName)
          .then(cache => cache.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('Stale-while-revalidate fetch failed:', error);
      return new Response('Network error occurred', { status: 408 });
    });
  
  return cachedResponse || fetchPromise;
}

// Sync forms that were submitted while offline
async function syncForms() {
  const db = await openDatabase();
  const tx = db.transaction('offline-forms', 'readwrite');
  const store = tx.objectStore('offline-forms');
  
  const forms = await store.getAll();
  
  const syncPromises = forms.map(async form => {
    try {
      const response = await fetch(form.url, {
        method: form.method,
        headers: form.headers,
        body: form.body
      });
      
      if (response.ok) {
        await store.delete(form.id);
        console.log('Successfully synced form:', form.id);
      }
    } catch (error) {
      console.error('Failed to sync form:', form.id, error);
    }
  });
  
  return Promise.all(syncPromises);
}

// Open IndexedDB database for offline form storage
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('service-worker-db', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore('offline-forms', { keyPath: 'id', autoIncrement: true });
    };
    
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

// Periodic cache cleanup (once per day)
setInterval(async () => {
  const cacheEntries = {};
  
  // Get all cache entries
  for (const cacheName of Object.values(CACHE_NAMES)) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    cacheEntries[cacheName] = requests.map(request => ({
      url: request.url,
      timestamp: request.headers.get('sw-fetched-on') || Date.now()
    }));
  }
  
  // Clean up old entries (older than 30 days)
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const now = Date.now();
  
  for (const [cacheName, entries] of Object.entries(cacheEntries)) {
    const cache = await caches.open(cacheName);
    
    for (const entry of entries) {
      if (now - entry.timestamp > MAX_AGE) {
        await cache.delete(new Request(entry.url));
        console.log('Removed old cache entry:', entry.url);
      }
    }
  }
}, 24 * 60 * 60 * 1000); // Run once per day