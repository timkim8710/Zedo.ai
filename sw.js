const CACHE_NAME = 'zedo-core-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap'
];

// Install Event - Caching the "shell" of the app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Zedo Core: Caching System Files');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Zedo Core: Clearing Legacy Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event - Serving files from cache for speed
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached file, or fetch from network if not cached
      return response || fetch(event.request);
    })
  );
});
