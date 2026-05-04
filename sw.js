// Este archivo permite que el logo se guarde en la memoria del teléfono
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('leonix-v1').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './assets/logo_studio.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
