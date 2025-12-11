const CACHE_NAME = 'smart-security-v1';
const urlsToCache = [
  '/static/officer-device.html',
  '/static/operations-center.html',
  '/static/dashboard-absher.html',
  '/static/analytics.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch with Network First strategy for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Network-first for API
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static resources
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Activate and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push Notification support
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'تنبيه أمني';
  const options = {
    body: data.body || 'رسالة جديدة من مركز العمليات',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'security-alert',
    requireInteraction: true,
    data: data,
    dir: 'rtl',
    lang: 'ar'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/static/officer-device.html')
  );
});
