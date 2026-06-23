// Take control of any open clients as soon as we're activated, so a freshly
// loaded page becomes controlled without needing a reload.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Let every request go to the network as normal. The cross-origin video
// request passes through here too.
self.addEventListener('fetch', (event) => {
  console.log('[sw] request:', event.request.url);
  event.respondWith(fetch(event.request));
});
