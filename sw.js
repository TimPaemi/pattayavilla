/* PATTAYA VILLA STREAM Service Worker — v2
 * - Network-first for HTML (always fresh, falls back to cache, then /offline)
 * - Cache-first for assets (fonts, images, JS)
 * - Navigation preload for faster nav
 * - Aggressive precache of money + content pages
 * - Strict same-origin only; never intercepts cross-origin */
const VERSION = 'pattayastream-v11-2026-05-18-authority';
const OFFLINE_URL = '/offline';

const PRECACHE = [
  '/', '/support/', '/community/', '/format/', '/code/', '/faq/',
  '/offline', '/404',
  '/manifest.json',
  '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png',
  '/assets/fonts/bebas-neue-400.woff2',
  '/assets/fonts/inter-var.woff2',
  '/assets/fonts/jetbrains-mono-var.woff2',
  '/assets/js/web-vitals.iife.js',
  '/assets/js/pv-live.js',
  '/assets/og/og-home.jpg',
  '/assets/og/og-support.jpg',
  '/assets/og/og-community.jpg',
  '/assets/og/og-format.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Use Promise.allSettled so one missing asset doesn't kill the install
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, {cache:'reload'}))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Enable navigation preload for faster HTML responses
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch(_) {}
    }
    // Drop old cache versions
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Strict same-origin only
  if (url.origin !== self.location.origin) return;
  // Skip Cloudflare internals + robots + sitemap + .well-known + GA
  if (url.pathname.startsWith('/cdn-cgi/')) return;
  if (url.pathname === '/robots.txt' || url.pathname.endsWith('sitemap.xml')) return;
  if (url.pathname.includes('/.well-known/')) return;

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    // Network-first with navigation preload, fall back to cache, then /offline
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const preload = await e.preloadResponse;
        if (preload) {
          cache.put(req, preload.clone());
          return preload;
        }
        const net = await fetch(req);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch (_) {
        const cached = await cache.match(req);
        return cached || await cache.match(OFFLINE_URL) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.woff2')) {
    // Cache-first for static assets
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch (_) { return Response.error(); }
    })());
  }
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
