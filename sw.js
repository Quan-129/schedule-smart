/**
 * ==========================================================================
 * SERVICE WORKER - OFFLINE SUPPORT & CACHE ENGINE (V2)
 * ==========================================================================
 */

const CACHE_NAME = 'smart-schedule-backpack-v6';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './schedules/index.json',
  './schedules/tuan-35.md',
  './schedules/tuan-36.md',
  './schedules/tuan-37.md',
  './schedules/tuan-38.md',
  './schedules/tuan-39.md',
  './schedules/tuan-40.md',
  './schedules/tuan-41.md',
  './schedules/tuan-42.md',
  './schedules/tuan-43.md',
  './schedules/tuan-44.md',
  './schedules/tuan-45.md',
  './schedules/tuan-46.md',
  './schedules/tuan-47.md',
  './schedules/tuan-48.md',
  './schedules/tuan-49.md',
  './schedules/tuan-50.md'
];

// Install Event: Cache Core Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First Strategy for live updates
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Do not intercept Firebase or external Auth requests
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('google.com') || event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
