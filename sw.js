const CACHE_NAME = 'qmx-swr-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png',
  'https://CiSC87.github.io/web-serial-polyfill/serial.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.error('SW install failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

const NETWORK_FIRST_URLS = [
  '/',
  './index.html',
  './manifest.json',
  './sw.js',
];

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const requestPath = requestUrl.pathname + requestUrl.search;
  const isNetworkFirst = NETWORK_FIRST_URLS.some((path) => requestPath === path || requestUrl.pathname === path);

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return caches.match(event.request);
          }
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((fallbackResponse) => fallbackResponse || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((fallbackResponse) => fallbackResponse || caches.match('/')));
    })
  );
});
