const CACHE_NAME = 'sugarcare-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  (event as any).waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  (event as any).respondWith(
    caches.match((event as any).request).then((response) => {
      return response || fetch((event as any).request);
    })
  );
});
