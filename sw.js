// Service worker Mon Lycée : cache tout -> 100% hors-ligne après 1ère visite.
const CACHE = 'mon-lycee-v2';
const PRECACHE = [
  '/index.html', '/devoirs.html', '/edt.html', '/notes.html', '/manifest.json',
  '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const c = await caches.open(CACHE);
        c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const alt = await caches.match(url.pathname + '.html', { ignoreSearch: true });
        if (alt) return alt;
        const racine = await caches.match('/index.html');
        if (racine) return racine;
      }
      throw err;
    }
  })());
});
