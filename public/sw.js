// IronTrack Offline Service Worker
const CACHE_NAME = 'irontrack-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/demo_avatar.png',
  '/src/style.css',
  '/src/main.js',
  '/src/state.js',
  '/src/components/dashboard.js',
  '/src/components/routines.js',
  '/src/components/session.js',
  '/src/components/history.js',
  '/src/components/analytics.js',
  '/src/components/settings.js',
  '/src/components/exercisePicker.js'
];

// Install event: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve cached items first, then fetch and dynamically cache if online
self.addEventListener('fetch', (e) => {
  // Ignore chrome-extension or other non-http schemes
  if (!e.request.url.startsWith(self.location.origin) && !e.request.url.startsWith('https://fonts.')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached resource
        return cachedResponse;
      }

      // Fetch from network
      return fetch(e.request).then((networkResponse) => {
        // If valid response, cache it dynamically (e.g. for external fonts)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for html requests
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
