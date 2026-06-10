/* PATTAYA VILLA STREAM Service Worker — v4
 * - Network-first for HTML (always fresh, falls back to cache, then /offline)
 * - Cache-first for assets (fonts, images, JS, CSS)
 * - Navigation preload for faster nav
 * - Aggressive precache of money + content pages
 * - Strict same-origin only; never intercepts cross-origin */
const VERSION = 'pattayastream-v76-2026-06-09-full-critical-mobile-blocks';
const OFFLINE_URL = '/offline/';

const PRECACHE = [
  '/', '/about/', '/support/', '/community/', '/format/', '/code/', '/faq/',
  '/offline/', '/404/',
  '/manifest.json',
  '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png',
  '/assets/css/pv-core.css?v=33',
  '/assets/css/pv-home.css?v=15',
  '/assets/css/pv-sub.css?v=30',
  '/assets/fonts/bebas-neue-400.woff2',
  '/assets/fonts/inter-var.woff2',
  '/assets/fonts/jetbrains-mono-var.woff2',
  '/assets/js/pv-analytics.js?v=1',
  '/assets/js/web-vitals.iife.js',
  '/assets/js/pv-live.js?v=58',
  '/assets/js/pv-live-lite.js?v=3',
  '/assets/calendar/pattaya-villa-stream.ics',
  '/assets/og/og-home.jpg',
  '/assets/og/og-support.jpg',
  '/assets/og/og-about.jpg',
  '/assets/og/og-faq.jpg',
  '/assets/og/og-code.jpg',
  '/assets/og/og-community.jpg',
  '/assets/og/og-format.jpg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/splash/iphone-se.png',
  '/assets/splash/iphone-8.png',
  '/assets/splash/iphone-x.png',
  '/assets/splash/iphone-11pro-max.png',
  '/assets/splash/iphone-12-13.png',
  '/assets/splash/iphone-12-13-pro-max.png',
  '/assets/splash/iphone-14-pro-max.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, {cache:'reload'}))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch(_) {}
    }
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
    /* Do not broadcast SW_UPDATED — pv-live.js shows toast only when a waiting worker exists */
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/cdn-cgi/')) return;
  if (url.pathname === '/robots.txt' || url.pathname.endsWith('sitemap.xml')) return;
  if (url.pathname.includes('/.well-known/')) return;

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
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
