/**
 * ==========================================================================
 * SERVICE WORKER - OFFLINE SUPPORT & CACHE ENGINE (V2)
 * ==========================================================================
 */

const CACHE_NAME = 'smart-schedule-modular-v27';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './src/1.Frontend/styles/1.variables.css',
  './src/1.Frontend/styles/2.navbar.css',
  './src/1.Frontend/styles/3.timetable-grid.css',
  './src/1.Frontend/styles/4.grade-solver.css',
  './src/1.Frontend/styles/5.backpack-drive.css',
  './src/1.Frontend/styles/6.modals.css',
  './src/1.Frontend/styles/7.markdown-editor.css',
  './src/1.Frontend/styles/8.responsive.css',
  './manifest.json',
  './src/1.Frontend/main.js',
  './src/1.Frontend/components/CircularNode.js',
  './src/1.Frontend/components/EditModal.js',
  './src/1.Frontend/components/modals/EditSubjectModal.js',
  './src/1.Frontend/components/modals/AddSubjectModal.js',
  './src/1.Frontend/components/modals/AddWeekModal.js',
  './src/1.Frontend/components/modals/AddClassModal.js',
  './src/1.Frontend/components/modals/SubjectDetailModal.js',
  './src/1.Frontend/components/layout/LoginScreen.js',
  './src/1.Frontend/components/layout/GitGuide.js',
  './src/1.Frontend/components/Toast.js',
  './src/1.Frontend/views/BackpackView.js',
  './src/1.Frontend/views/GradesView.js',
  './src/1.Frontend/views/TimetableGrid.js',
  './src/2.Backend/services/GradeSolverService.js',
  './src/2.Backend/services/TimetableParser.js',
  './src/2.Backend/utils/dateHelpers.js',
  './src/3.Database/state.js',
  './src/3.Database/auth/FirebaseAuthService.js',
  './src/3.Database/storage/LocalStorageEngine.js',
  './src/3.Database/storage/SeedData.js',
  './src/4.Security/sanitizer.js',
  './src/4.Security/urlValidator.js',
  './src/5.Performance/pwaManager.js',
  './src/5.Performance/visibilityOptimizer.js',
  './schedules/index.json',
  './schedules/tuan-35.md',
  './schedules/tuan-36.md',
  './schedules/tuan-37.md',
  './schedules/tuan-38.md',
  './schedules/tuan-39.md',
  './schedules/tuan-40.md'
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
