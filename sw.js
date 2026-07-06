// Service worker voor de Golf Scorekaart PWA.
// Plaats dit bestand naast index.html (golf-scorecard.html) in de GitHub Pages-repo.
// Verhoog CACHE_VERSION bij elke nieuwe release zodat de cache ververst.
const CACHE_VERSION = 'golf-score-v7';

// Bestandsnaam van de app. Pas aan als je HTML anders heet (bijv. 'index.html').
const APP_FILES = [
  './',
  './index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll faalt als één bestand ontbreekt; per bestand toevoegen is robuuster.
      .then(c => Promise.all(APP_FILES.map(url => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        // Vernieuw de cache op de achtergrond (alleen geldige, same-origin responses).
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        // Offline: val voor paginanavigatie terug op de gecachte app.
        if (req.mode === 'navigate') {
          return caches.match('./index.html').then(m => m || caches.match('./'));
        }
        return cached;
      });
      return cached || network;
    })
  );
});
