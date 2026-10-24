const CACHE_NAME = 'ripples-shell-v2';
const APP_SHELL = [
  '/', '/index.html', '/styles.css', '/app.js', '/data-core.js',
  '/cloud.js', '/features.js', '/config.js', '/county-map.json', '/showcase-county-stats.json',
  '/environment-snapshot.json', '/flow-lines.svg', '/app.webmanifest',
  '/icons/icon-180.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(APP_SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('ripples-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/__version') return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request.mode === 'navigate' ? '/index.html' : request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request.mode === 'navigate' ? '/index.html' : request);
      if (cached) return cached;
      return Response.error();
    }
  })());
});
