// Service worker voor de Golf Score PWA.
// Plaats dit bestand naast golf-score.html in de GitHub Pages-repo.
// CACHE_VERSION wordt automatisch afgeleid uit een hash van de app-bestanden
// door update_cache_version.py. Niet handmatig aanpassen — draai na elke
// wijziging aan index.html/golf-score.html/manifest.json/icon.svg gewoon:
//   python3 update_cache_version.py
const CACHE_VERSION = 'golf-score-11e6c066bcfb';

// Bestanden die offline beschikbaar moeten zijn.
const APP_FILES = [
  './',
  './index.html',
  './golf-score.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      // Per bestand toevoegen is robuuster dan addAll (dat faalt als één bestand ontbreekt).
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
        if (req.mode === 'navigate') return caches.match('./golf-score.html');
        return cached;
      });
      return cached || network;
    })
  );
});
