const CACHE = 'engmetclima-v5';
const FILES = ['./','./index.html','./styles.css','./app.js','./supabase-config.js','./supabase-auth.js','./supabase-sync.js','./manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('fetch', event => { if (event.request.method === 'GET') event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });
