const CACHE_NAME = 'zedo-cache-v1';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('zedo-v1').then((cache) => cache.addAll([
      '/', '/index.html', '/style.css', '/app.js', '/icon-512.png'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
