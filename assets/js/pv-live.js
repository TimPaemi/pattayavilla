/* PATTAYA VILLA STREAM · pv-live.js — v3 (2026)
 * Injects: live-now indicator, share tray (native <dialog>), ::selection polish,
 * scrollbar styling, text-wrap balance, forced-colors a11y, aria-current navigation.
 * Live window: 21:00–03:00 Asia/Bangkok (ICT, UTC+7). Pure JS, zero deps. */
(function(){
  'use strict';

  /* ---------- runtime style injection ---------- */
  function injectStyles(){
    if(document.getElementById('pv-runtime-css')) return;
    var s = document.createElement('style');
    s.id = 'pv-runtime-css';
    s.textContent = [
      /* View Transitions + cross-page polish */
      '@view-transition{navigation:auto}',
      '::view-transition-old(root),::view-transition-new(root){animation-duration:.18s;animation-timing-function:cubic-bezier(.4,0,.2,1)}',
      /* Typography 2026 — automatic balanced wrapping for headings + pretty for prose */
      'h1,h2,h3,.section-title,.tier-name,.equal-paths-q{text-wrap:balance}',
      '.lead,.hero-sub,.body-section p,.tier-body,.manifesto p{text-wrap:pretty}',
      /* Selection */
      '::selection{background:#ff2f8e;color:#fff}',
      '::-moz-selection{background:#ff2f8e;color:#fff}',
      /* Pink scrollbar */
      'html{scrollbar-color:#ff2f8e #08080c;scrollbar-width:thin}',
      '::-webkit-scrollbar{width:10px;height:10px}',
      '::-webkit-scrollbar-track{background:#08080c}',
      '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2f8e,#c4002a);border-radius:9999px;border:2px solid #08080c}',
      '::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#ff4d9f,#ff1f4d)}',
      /* Live pulse animation */
      '@keyframes pvlive{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(230,0,48,.55)}70%{opacity:.5;box-shadow:0 0 0 8px rgba(230,0,48,0)}}',
      '@media(prefers-reduced-motion:reduce){.live-status .dot{animation:none!important}}',
      /* Active page nav state */
      '.utility-bar a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px;text-decoration-thickness:2px}',
      '.footer-network a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px}',
      /* Share button */
      '.pv-share{position:relative;display:inline-flex;align-items:center;gap:.4rem;color:#00e5ff;font-weight:800;letter-spacing:1.6px;cursor:pointer;background:none;border:none;font-family:inherit;font-size:inherit;text-transform:inherit;padding:0;line-height:inherit}',
      '.pv-share:hover{color:#fff}',
      '.pv-share:focus-visible{outline:2px solid #00e5ff;outline-offset:3px;border-radius:3px}',
      /* Native dialog share menu */
      'dialog.pv-share-dialog{padding:0;border:none;background:transparent;color:inherit;max-width:none;max-height:none}',
      'dialog.pv-share-dialog::backdrop{background:rgba(8,8,12,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      'dialog.pv-share-dialog .pv-share-inner{position:fixed;left:50%;transform:translateX(-50%);bottom:84px;background:rgba(8,8,12,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:2px solid #ff2f8e;border-radius:16px;padding:1.2rem 1.2rem 1rem;box-shadow:0 12px 50px rgba(255,47,142,.35);min-width:280px;max-width:90vw;color:rgba(255,255,255,.92);font-family:Inter,system-ui,sans-serif}',
      'dialog.pv-share-dialog h4{font-family:"Bebas Neue",sans-serif;font-size:1.5rem;color:#fff;margin:0 0 .8rem;letter-spacing:.01em;text-transform:uppercase}',
      'dialog.pv-share-dialog h4 .accent{color:#ff2f8e}',
      '.pv-share-row{display:flex;flex-wrap:wrap;gap:.5rem}',
      '.pv-share-btn{flex:1;min-width:90px;display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.75rem .8rem;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;text-decoration:none;font-family:"JetBrains Mono",monospace;font-size:.62rem;letter-spacing:1.4px;text-transform:uppercase;font-weight:800;border:1px solid rgba(255,255,255,.1);transition:all .15s;cursor:pointer;min-height:44px}',
      '.pv-share-btn:hover,.pv-share-btn:focus-visible{background:rgba(255,47,142,.18);border-color:#ff2f8e;color:#fff;transform:translateY(-1px);outline:none}',
      '.pv-share-btn:focus-visible{box-shadow:0 0 0 3px rgba(255,47,142,.35)}',
      '.pv-share-btn.copy-state-done{background:rgba(106,255,159,.18);border-color:#6aff9f;color:#6aff9f}',
      '.pv-share-close{position:absolute;top:.5rem;right:.6rem;background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:1.5rem;line-height:1;padding:.3rem .55rem;border-radius:6px;min-height:36px;min-width:36px}',
      '.pv-share-close:hover,.pv-share-close:focus-visible{color:#fff;background:rgba(255,255,255,.08);outline:none}',
      /* Windows High Contrast Mode (forced-colors) — keep functional, drop decorative */
      '@media(forced-colors:active){',
      '  .btn,.sticky-cta a,.quick-link,.support-card,.tier,.pv-share-btn{forced-color-adjust:none;border:1px solid CanvasText;background:Canvas;color:CanvasText}',
      '  .btn-red,.btn-pink,.btn-yellow,.cta-watch,.cta-support,.cta-tip{background:Highlight;color:HighlightText}',
      '  a[aria-current="page"]{color:LinkText;outline:2px solid LinkText}',
      '  .live-status .dot{forced-color-adjust:none;background:Mark}',
      '  .slash-bg,.eyebrow,.marquee{display:none!important}',
      '}',
      /* iOS safe-area inset for sticky CTA — prevents home-indicator overlap */
      '@supports(padding:env(safe-area-inset-bottom)){.sticky-cta{padding-bottom:env(safe-area-inset-bottom)}body{padding-bottom:calc(62px + env(safe-area-inset-bottom))}}',
      /* prefers-contrast: more — tighten contrast for users who request it */
      '@media (prefers-contrast: more){',
      '  :root{--text:#fff;--muted:rgba(255,255,255,.85);--dim:rgba(255,255,255,.75);--border:rgba(255,255,255,.35);--border-strong:rgba(255,255,255,.55)}',
      '  .btn,.support-card,.quick-link,.tier,.pv-share-btn{border-width:3px}',
      '  a:not(.btn):not(.pv-share-btn):not(.cta-watch):not(.cta-support):not(.cta-tip){text-decoration:underline;text-underline-offset:2px}',
      '}',
      /* prefers-reduced-transparency — disable blur backdrops */
      '@media (prefers-reduced-transparency: reduce){',
      '  .sticky-cta{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:#08080c}',
      '  dialog.pv-share-dialog .pv-share-inner,.utility-bar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:#08080c}',
      '  dialog.pv-share-dialog::backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.95)}',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- ICT (UTC+7) helper ---------- */
  function ictNow(){
    var d = new Date();
    var utcMs = d.getTime() + d.getTimezoneOffset()*60000;
    return new Date(utcMs + 7*3600000);
  }

  /* ---------- live indicator ---------- */
  function buildLive(bar){
    var a = document.createElement('a');
    a.href = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&utm_medium=live-indicator&utm_campaign=watch_live';
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'live-status';
    a.setAttribute('data-gtm','live_indicator');
    a.setAttribute('aria-live','polite');
    a.style.cssText = 'display:inline-flex;align-items:center;gap:.5rem;color:#ffe156;font-weight:800;letter-spacing:1.6px';
    a.innerHTML = '<span class="dot" style="width:9px;height:9px;border-radius:50%;background:#ffe156;flex-shrink:0;display:inline-block"></span><span class="lbl">CHECKING…</span>';
    var sep = document.createElement('span');
    sep.className = 'separator';
    sep.textContent = '·';
    bar.insertBefore(sep, bar.firstChild);
    bar.insertBefore(a, bar.firstChild);
    return a;
  }
  function toggleLiveBanner(isLive){
    var b = document.querySelector('[data-live-banner]');
    if(!b) return;
    if(isLive){ b.removeAttribute('hidden'); }
    else { b.setAttribute('hidden',''); }
  }
  function tickLive(el){
    if(!el) return;
    var ict = ictNow();
    var h = ict.getUTCHours(), m = ict.getUTCMinutes();
    var dot = el.querySelector('.dot');
    var lbl = el.querySelector('.lbl');
    var isLive = (h >= 21) || (h < 3);
    toggleLiveBanner(isLive);
    if(isLive){
      el.style.color = '#ff3b5c';
      if(dot){ dot.style.background = '#ff3b5c'; dot.style.animation = 'pvlive 1.6s infinite'; }
      lbl.textContent = '● LIVE NOW · WATCH ↗';
    }else{
      el.style.color = '#ffe156';
      if(dot){ dot.style.background = '#ffe156'; dot.style.animation = 'none'; }
      var minsUntil = ((21*60) - (h*60 + m));
      if(minsUntil < 0) minsUntil += 24*60;
      var hh = Math.floor(minsUntil/60), mm = minsUntil % 60;
      lbl.textContent = 'NEXT LIVE IN ' + hh + 'H ' + (mm<10?'0':'') + mm + 'M · 9 PM ICT';
    }
  }

  /* ---------- share tray with native <dialog> ---------- */
  function ga(name, platform){
    if(typeof window.gtag === 'function'){
      window.gtag('event', name, {platform: platform, event_category: 'share', transport_type: 'beacon'});
    }
  }
  function buildShare(bar){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pv-share';
    btn.setAttribute('aria-haspopup','dialog');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Open share menu');
    btn.textContent = '★ SHARE';
    var sep = document.createElement('span');
    sep.className = 'separator';
    sep.textContent = '·';
    bar.insertBefore(sep, bar.firstChild);
    bar.insertBefore(btn, bar.firstChild);

    var dlg = document.createElement('dialog');
    dlg.className = 'pv-share-dialog';
    dlg.setAttribute('aria-label','Share this page');
    var url = location.origin + location.pathname;
    var shareText = '🔴 PATTAYA VILLA STREAM — live every night 9 PM ICT';
    var enc = encodeURIComponent;
    dlg.innerHTML =
      '<div class="pv-share-inner">' +
      '  <button type="button" class="pv-share-close" aria-label="Close share menu" autofocus>×</button>' +
      '  <h4>Spread the <span class="accent">show.</span></h4>' +
      '  <div class="pv-share-row">' +
      '    <a class="pv-share-btn" data-pf="x" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text='+enc(shareText)+'&url='+enc(url)+'">X / TWITTER</a>' +
      '    <a class="pv-share-btn" data-pf="whatsapp" target="_blank" rel="noopener" href="https://api.whatsapp.com/send/?text='+enc(shareText+' → '+url)+'">WHATSAPP</a>' +
      '    <a class="pv-share-btn" data-pf="telegram" target="_blank" rel="noopener" href="https://t.me/share/url?url='+enc(url)+'&text='+enc(shareText)+'">TELEGRAM</a>' +
      '    <a class="pv-share-btn" data-pf="facebook" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u='+enc(url)+'">FACEBOOK</a>' +
      '    <button type="button" class="pv-share-btn" data-pf="copy" data-url="'+url+'">★ COPY LINK</button>' +
      (navigator.share ? '    <button type="button" class="pv-share-btn" data-pf="native">📱 NATIVE SHARE</button>' : '') +
      '  </div>' +
      '</div>';
    document.body.appendChild(dlg);

    function open(){
      if(typeof dlg.showModal === 'function'){
        dlg.showModal();
      }else{
        dlg.setAttribute('open',''); // fallback for browsers without native dialog
      }
      btn.setAttribute('aria-expanded','true');
      ga('share_open','menu');
    }
    function close(){
      if(typeof dlg.close === 'function' && dlg.open){
        dlg.close();
      }else{
        dlg.removeAttribute('open');
      }
      btn.setAttribute('aria-expanded','false');
      btn.focus();
    }
    btn.addEventListener('click', function(e){ e.stopPropagation(); dlg.open ? close() : open(); });
    dlg.querySelector('.pv-share-close').addEventListener('click', close);

    /* Backdrop click closes (native dialog feature — click on the dialog element itself, not the inner panel) */
    dlg.addEventListener('click', function(e){
      var inner = dlg.querySelector('.pv-share-inner');
      if(!inner) return;
      var r = inner.getBoundingClientRect();
      if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
        close();
      }
    });
    dlg.addEventListener('close', function(){ btn.setAttribute('aria-expanded','false'); });

    /* Action delegate */
    dlg.addEventListener('click', function(e){
      var t = e.target.closest('.pv-share-btn'); if(!t) return;
      var pf = t.getAttribute('data-pf');
      if(pf === 'copy'){
        e.preventDefault();
        var u = t.getAttribute('data-url');
        var done = function(){ t.classList.add('copy-state-done'); t.textContent = '✓ COPIED'; setTimeout(function(){ t.classList.remove('copy-state-done'); t.textContent = '★ COPY LINK'; }, 1800); };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(u).then(done).catch(function(){});
        }else{
          var ta = document.createElement('textarea'); ta.value = u; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(_){} ta.remove();
        }
        ga('share_click','copy');
      }else if(pf === 'native'){
        e.preventDefault();
        if(navigator.share){
          navigator.share({title:'PATTAYA VILLA STREAM', text:shareText, url:url}).catch(function(){});
          ga('share_click','native');
        }
      }else{
        ga('share_click', pf);
        setTimeout(close, 100);
      }
    });
  }

  /* ---------- aria-current="page" for active nav links ---------- */
  function markActiveNav(){
    var path = location.pathname.replace(/\/$/, '') || '/';
    var nav = document.querySelectorAll('.utility-bar a, .footer-network a');
    nav.forEach(function(a){
      try{
        var u = new URL(a.href, location.origin);
        if(u.hostname === location.hostname){
          var ap = u.pathname.replace(/\/$/, '') || '/';
          if(ap === path) a.setAttribute('aria-current','page');
        }
      }catch(_){}
    });
  }

  /* ---------- init ---------- */
  /* ---------- animated stat counters ---------- */
  function buildCounters(){
    if(!('IntersectionObserver' in window)) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nums = document.querySelectorAll('.stat-num');
    if(!nums.length) return;
    // Stash original text + parse the target number
    var entries = [];
    nums.forEach(function(el){
      var txt = el.textContent.trim();
      var m = txt.match(/^([\d,]+)([^\d]*)$/);
      if(!m) return; // skip non-numeric like "9 PM" or "6-8 h"
      var target = parseInt(m[1].replace(/,/g,''), 10);
      var suffix = m[2];
      if(isNaN(target)) return;
      entries.push({el:el, target:target, suffix:suffix, animated:false});
      if(!reduced) el.textContent = '0' + suffix;
    });
    if(!entries.length || reduced) return;
    function animate(entry){
      var start = performance.now();
      var dur = Math.max(800, Math.min(2200, Math.log10(Math.max(10,entry.target)) * 600));
      function tick(now){
        var t = Math.min(1, (now - start) / dur);
        // Ease-out cubic
        var e = 1 - Math.pow(1 - t, 3);
        var val = Math.floor(entry.target * e);
        // Format: 5,000,000 → "5M+" or large with commas
        var display;
        if(entry.target >= 1000000) display = (val/1000000).toFixed(val>=entry.target ? 0 : 1).replace(/\.0$/, '') + 'M';
        else if(entry.target >= 1000) display = (val/1000).toFixed(0) + 'K';
        else display = val.toString();
        entry.el.textContent = display + entry.suffix;
        if(t < 1) requestAnimationFrame(tick);
        else entry.el.textContent = entry.suffix && entry.suffix.startsWith('+') ? (entry.target >= 1000000 ? (entry.target/1000000)+'M' : entry.target) + entry.suffix : entry.suffix;
      }
      requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function(observed){
      observed.forEach(function(o){
        if(!o.isIntersecting) return;
        entries.forEach(function(e){
          if(e.animated || !o.target.contains(e.el)) return;
          e.animated = true;
          animate(e);
        });
        io.unobserve(o.target);
      });
    }, {threshold: 0.3});
    var statsBlock = document.querySelector('.stats');
    if(statsBlock) io.observe(statsBlock);
  }

  function init(){
    injectStyles();
    markActiveNav();
    var bar = document.querySelector('.utility-bar');
    if(!bar) return;
    buildShare(bar);
    var liveEl = buildLive(bar);
    if(liveEl){ tickLive(liveEl); setInterval(function(){ tickLive(liveEl); }, 60000); }
    buildCounters();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
})();
