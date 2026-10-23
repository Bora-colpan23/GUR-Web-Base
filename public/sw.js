// GUR — basit çevrimdışı önbellek: sayfa kabuğu önce ağdan, olmazsa önbellekten; API istekleri her zaman ağdan.
const CACHE = 'gur-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/icons/icon-192.png']))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api')) return;
  e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return res; })
    .catch(() => caches.match(r).then((m) => m || caches.match('/'))));
});
