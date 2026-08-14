// sw.js - Service Worker for QMX SWR Analyzer PWA
const CACHE_NAME = 'qmx-swr-analyzer-v0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Use network first for navigation requests (i.e., page loads) to get fresh version on pull‑to‑refresh
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        // Update cache with fresh response
        if (response && response.status === 200 && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }
  // For other requests, try cache first then network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Update cache with fresh response
        if (request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Allow the page to trigger an update (e.g., pull‑to‑refresh)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
