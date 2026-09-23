const CACHE_NAME = 'astroking-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

// Kurulumda dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Önbellek açıldı');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Bazı dosyalar önbelleğe alınamadı:', err);
        });
      })
  );
  self.skipWaiting();
});

// Eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Ağ isteği geldiğinde önbellekten veya ağdan sun
self.addEventListener('fetch', event => {
  // Sadece GET istekleri için önbellek
  if (event.request.method !== 'GET') return;
  // Discord webhook ve harici linkler önbelleğe alınmasın
  if (event.request.url.includes('discord.com') || 
      event.request.url.includes('instagram.com') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Geçerli cevapları önbelleğe ekle
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          // İnternet yoksa ve önbellekte yoksa, index.html göster
          return caches.match('./index.html');
        });
      })
  );
});