// PATTAYA VILLA Service Worker — v1 (scaffold)
const CACHE_VERSION = 'pattayavilla-v1-2026-05-18';
const OFFLINE_URL = '/offline';
const PRECACHE = ['/','/support/','/community/','/format/','/code/','/faq/','/offline','/manifest.json','/favicon.svg','/apple-touch-icon.png','/assets/fonts/bebas-neue-400.woff2','/assets/fonts/inter-var.woff2','/assets/fonts/jetbrains-mono-var.woff2'];
self.addEventListener('install',(e)=>{e.waitUntil(caches.open(CACHE_VERSION).then((c)=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',(e)=>{e.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE_VERSION).map((k)=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',(e)=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;if(u.pathname.startsWith('/cdn-cgi/')||u.pathname==='/robots.txt'||u.pathname.endsWith('sitemap.xml')||u.pathname.includes('/.well-known/'))return;if(r.headers.get('accept')&&r.headers.get('accept').includes('text/html')){e.respondWith(caches.open(CACHE_VERSION).then((c)=>c.match(r).then((cd)=>{const n=fetch(r).then((rs)=>{if(rs.ok)c.put(r,rs.clone());return rs;}).catch(()=>cd||c.match(OFFLINE_URL));return cd||n;})));return;}if(u.pathname.startsWith('/assets/')){e.respondWith(caches.open(CACHE_VERSION).then((c)=>c.match(r).then((cd)=>cd||fetch(r).then((rs)=>{if(rs.ok)c.put(r,rs.clone());return rs;}))));return;}});
self.addEventListener('message',(e)=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
