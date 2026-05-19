/* PATTAYA VILLA STREAM · pv-live.js — v4 (2026-05-18 mobile overhaul)
 * Injects: live-now indicator, share tray (native <dialog>), ::selection polish,
 * scrollbar styling, text-wrap balance, forced-colors a11y, aria-current navigation,
 * scroll-triggered stat counters, /support/ live banner toggle, AND a unified
 * mobile responsive system (<=760 / <=440 / <=360 breakpoints) that kills horizontal
 * scroll, aligns utility-bar + footer-network, scales hero typography, and
 * safe-area-proofs the sticky CTA across all 8 pages.
 * Live window: 21:00-03:00 Asia/Bangkok (ICT, UTC+7). Pure JS, zero deps. */
(function(){
  'use strict';

  /* ---------- runtime style injection ---------- */
  function injectStyles(){
    if(document.getElementById('pv-runtime-css')) return;
    var s = document.createElement('style');
    s.id = 'pv-runtime-css';
    s.textContent = [
      '@view-transition{navigation:auto}',
      '::view-transition-old(root),::view-transition-new(root){animation-duration:.18s;animation-timing-function:cubic-bezier(.4,0,.2,1)}',
      'h1,h2,h3,.section-title,.tier-name,.equal-paths-q{text-wrap:balance}',
      '.lead,.hero-sub,.body-section p,.tier-body,.manifesto p{text-wrap:pretty}',
      '::selection{background:#ff2f8e;color:#fff}',
      '::-moz-selection{background:#ff2f8e;color:#fff}',
      'html{scrollbar-color:#ff2f8e #08080c;scrollbar-width:thin}',
      '::-webkit-scrollbar{width:10px;height:10px}',
      '::-webkit-scrollbar-track{background:#08080c}',
      '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2f8e,#c4002a);border-radius:9999px;border:2px solid #08080c}',
      '::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#ff4d9f,#ff1f4d)}',
      '@keyframes pvlive{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(230,0,48,.55)}70%{opacity:.5;box-shadow:0 0 0 8px rgba(230,0,48,0)}}',
      '@media(prefers-reduced-motion:reduce){.live-status .dot,.live-banner,.live-banner-dot{animation:none!important}}',
      '.live-status{display:inline-flex;align-items:center;gap:.4rem;font-family:"JetBrains Mono",monospace;font-size:.62rem;letter-spacing:1.6px;text-transform:uppercase;font-weight:800;color:#fff;padding:.3rem .7rem;background:rgba(230,0,48,.15);border:1px solid rgba(230,0,48,.4);border-radius:9999px}',
      '.live-status.is-offline{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.7)}',
      '.live-status .dot{width:8px;height:8px;border-radius:50%;background:#e60030;animation:pvlive 1.8s ease-out infinite}',
      '.live-status.is-offline .dot{background:rgba(255,255,255,.4);animation:none}',
      '.live-status a{color:inherit;text-decoration:none}',
      '.live-status a:hover{color:#ffe156}',
      '.utility-bar a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px;text-decoration-thickness:2px}',
      '.footer-network a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px}',
      '.pv-share{position:relative;display:inline-flex;align-items:center;gap:.4rem;color:#00e5ff;font-weight:800;letter-spacing:1.6px;cursor:pointer;background:none;border:none;font-family:inherit;font-size:inherit;text-transform:inherit;padding:0;line-height:inherit}',
      '.pv-share:hover{color:#fff}',
      '.pv-share:focus-visible{outline:2px solid #00e5ff;outline-offset:3px;border-radius:3px}',
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
      '@keyframes pv-live-banner-pulse{0%,100%{box-shadow:0 0 0 0 rgba(230,0,48,.45)}70%{box-shadow:0 0 0 12px rgba(230,0,48,0)}}',
      '.live-banner{margin:0 0 1rem;border:2px solid #e60030;background:rgba(230,0,48,.1);border-radius:10px;animation:pv-live-banner-pulse 2.2s ease-out infinite}',
      '.live-banner a{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.8rem 1rem;text-decoration:none;color:#fff;font-family:"JetBrains Mono",monospace;font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:800}',
      '.live-banner-dot{width:9px;height:9px;border-radius:50%;background:#e60030;flex-shrink:0;animation:pvlive 1.8s ease-out infinite}',
      '@media(forced-colors:active){',
      '  .btn,.sticky-cta a,.quick-link,.support-card,.tier,.pv-share-btn{forced-color-adjust:none;border:1px solid CanvasText;background:Canvas;color:CanvasText}',
      '  .btn-red,.btn-pink,.btn-yellow,.cta-watch,.cta-support,.cta-tip{background:Highlight;color:HighlightText}',
      '  a[aria-current="page"]{color:LinkText;outline:2px solid LinkText}',
      '  .live-status .dot{forced-color-adjust:none;background:Mark}',
      '  .slash-bg,.eyebrow,.marquee{display:none!important}',
      '}',
      '@supports(padding:env(safe-area-inset-bottom)){.sticky-cta{padding-bottom:env(safe-area-inset-bottom)}body{padding-bottom:calc(62px + env(safe-area-inset-bottom))}}',
      '@media (prefers-contrast: more){',
      '  :root{--text:#fff;--muted:rgba(255,255,255,.85);--dim:rgba(255,255,255,.75);--border:rgba(255,255,255,.35);--border-strong:rgba(255,255,255,.55)}',
      '  .btn,.support-card,.quick-link,.tier,.pv-share-btn{border-width:3px}',
      '  a:not(.btn):not(.pv-share-btn):not(.cta-watch):not(.cta-support):not(.cta-tip){text-decoration:underline;text-underline-offset:2px}',
      '}',
      '@media (prefers-reduced-transparency: reduce){',
      '  .sticky-cta{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:#08080c}',
      '  dialog.pv-share-dialog .pv-share-inner,.utility-bar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.96)}',
      '  dialog.pv-share-dialog::backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.95)}',
      '}',
      /* ============================================================
       * MOBILE SYSTEM v4 — kills hscroll, fixes header/footer/sticky,
       * scales hero, aligns network row, hits 44px tap targets.
       * ============================================================ */
      'html,body{overflow-x:clip;max-width:100vw}',
      'img,video,iframe,svg{max-width:100%;height:auto}',
      '@media(max-width:760px){',
      '  .utility-bar{gap:.55rem .9rem;padding:.55rem .8rem;font-size:.58rem;letter-spacing:1.2px;line-height:1.45;justify-content:center;flex-wrap:wrap}',
      '  .utility-bar .separator{display:none!important}',
      '  .utility-bar a{padding:.25rem 0;display:inline-block;min-height:32px;line-height:1.6;white-space:nowrap}',
      '  .marquee{padding:.55rem 0}',
      '  .marquee-track{font-size:.7rem;letter-spacing:1.8px;animation-duration:45s}',
      '  .marquee-group{gap:1.1rem;padding-right:1.1rem}',
      '  main{padding-left:0;padding-right:0}',
      '  section{padding:2.4rem 1rem!important}',
      '  .hero{padding:2rem 1rem 2.6rem!important}',
      '  .hero h1{font-size:clamp(3.2rem,13.5vw,6rem)!important;line-height:.88;letter-spacing:-.01em;margin-bottom:1rem}',
      '  .hero p,.hero-sub,.lead{font-size:1rem;line-height:1.55}',
      '  .hero-eyebrow{font-size:.6rem;letter-spacing:1.6px;padding:.35rem .8rem;margin-bottom:1.1rem}',
      '  .hero-meta{font-size:.62rem;letter-spacing:1.8px;margin-bottom:1.6rem}',
      '  .section-title{font-size:clamp(2.2rem,9vw,4rem)!important;line-height:.95}',
      '  .hero-cta,.end-cta,.equal-paths-cta,.watch-bar,.cta-row{display:flex;flex-direction:column;align-items:stretch;gap:.7rem;width:100%}',
      '  .hero-cta .btn,.end-cta .btn,.equal-paths-cta a,.watch-bar .btn{width:100%;justify-content:center;text-align:center}',
      '  .btn{padding:.95rem 1.4rem;font-size:.75rem;letter-spacing:1.6px;min-height:48px}',
      '  .btn-mega{font-size:.95rem;padding:1.1rem 1.6rem;letter-spacing:1.9px}',
      '  .quick-links{grid-template-columns:1fr;gap:.75rem;margin-top:1.5rem}',
      '  .quick-link{padding:1.4rem 1.2rem;border-radius:12px}',
      '  .support-grid,.tier-grid{grid-template-columns:1fr;gap:.9rem}',
      '  .support-card,.tier{padding:1.5rem 1.25rem}',
      '  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}',
      '  .stat{padding:1.1rem .8rem}',
      '  .stat-num{font-size:clamp(2rem,8vw,3rem)}',
      '  .stat-label{font-size:.55rem;letter-spacing:1.3px}',
      '  footer{padding:2.4rem 1rem 1.2rem;font-size:.6rem;letter-spacing:1.1px;line-height:1.7}',
      '  .footer-brand{font-size:1.8rem;margin-bottom:.4rem}',
      '  .footer-network{margin:1rem auto;gap:.4rem .8rem;font-size:.6rem;letter-spacing:1.1px;line-height:1.6;max-width:100%;padding:0 .5rem}',
      '  .footer-network a{display:inline-block;padding:.2rem 0;min-height:28px;white-space:nowrap}',
      '  .footer-legal{margin-top:1.2rem;font-size:.52rem;line-height:1.7;letter-spacing:1px}',
      '  .sticky-cta a{font-size:.68rem;letter-spacing:1.3px;padding:.85rem .6rem;min-height:52px;gap:.35rem}',
      '  body{padding-bottom:calc(58px + env(safe-area-inset-bottom,0px))}',
      '  .body-section h2,.body-section-title{font-size:clamp(1.8rem,7vw,2.6rem);line-height:1}',
      '  .body-section p{font-size:1rem;line-height:1.65}',
      '  .pullquote{font-size:1.05rem;padding:1.1rem 1.1rem;margin:1.3rem 0}',
      '  details summary{padding:1rem 1.1rem;font-size:.95rem;line-height:1.35}',
      '  details > div,details > p{padding:0 1.1rem 1.1rem;font-size:.96rem}',
      '  .toc,.toc-nav{flex-direction:column;align-items:stretch;gap:.4rem;padding:1rem}',
      '  .toc a{padding:.6rem .8rem;font-size:.72rem;letter-spacing:1.4px;display:block;width:100%}',
      '  .manifesto,.recipe-steps{padding:1.4rem 1.1rem}',
      '  .recipe-step{padding:1rem .9rem}',
      '  .live-banner a{padding:.7rem 1rem;font-size:.65rem;letter-spacing:1.2px;text-align:center;line-height:1.45}',
      '}',
      '@media(max-width:440px){',
      '  .utility-bar{font-size:.55rem;gap:.4rem .7rem;padding:.5rem .6rem}',
      '  .utility-bar a{min-height:28px;line-height:1.7}',
      '  .marquee-track{font-size:.62rem;letter-spacing:1.4px;animation-duration:36s}',
      '  .hero h1{font-size:clamp(2.9rem,14.5vw,5.2rem)!important;line-height:.9}',
      '  .hero-eyebrow{font-size:.55rem;letter-spacing:1.4px;padding:.3rem .7rem}',
      '  .hero p,.hero-sub{font-size:.95rem}',
      '  section,.hero{padding-left:.85rem!important;padding-right:.85rem!important}',
      '  .btn{font-size:.72rem;letter-spacing:1.4px;padding:.85rem 1.2rem}',
      '  .btn-mega{font-size:.88rem;padding:1rem 1.4rem;letter-spacing:1.7px}',
      '  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}',
      '  .stat{padding:.9rem .65rem}',
      '  .footer-brand{font-size:1.55rem}',
      '  .footer-network{font-size:.56rem;letter-spacing:1px;gap:.35rem .65rem}',
      '  .sticky-cta a{font-size:.62rem;letter-spacing:1.2px;padding:.8rem .45rem;min-height:50px}',
      '  body{padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))}',
      '}',
      '@media(max-width:360px){',
      '  .hero h1{font-size:clamp(2.6rem,15vw,4.6rem)!important}',
      '  .marquee-track{font-size:.58rem;animation-duration:30s}',
      '  .stats{grid-template-columns:1fr;gap:.5rem}',
      '  .sticky-cta a{font-size:.58rem;letter-spacing:1px;padding:.75rem .35rem}',
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
  function isLiveICT(){
    var h = ictNow().getHours();
    return (h >= 21) || (h < 3);
  }
  function hoursUntilLive(){
    var now = ictNow();
    var target = new Date(now);
    target.setHours(21,0,0,0);
    if (now.getHours() >= 21 || now.getHours() < 3) return 0;
    if (now.getHours() >= 3 && now.getHours() < 21) {
      var ms = target - now;
      var h = Math.floor(ms / 3600000);
      var m = Math.floor((ms % 3600000) / 60000);
      return {h:h, m:m};
    }
    return {h:0, m:0};
  }

  /* ---------- live indicator ---------- */
  function buildLive(bar){
    if(!bar || bar.querySelector('.live-status')) return;
    var wrap = document.createElement('a');
    wrap.className = 'live-status';
    wrap.href = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&utm_medium=live_pill&utm_campaign=watch';
    wrap.target = '_blank';
    wrap.rel = 'noopener';
    wrap.setAttribute('data-gtm','live_pill_click');
    var dot = document.createElement('span');
    dot.className = 'dot';
    var txt = document.createElement('span');
    txt.className = 'txt';
    wrap.appendChild(dot);
    wrap.appendChild(txt);
    bar.insertBefore(wrap, bar.firstChild);
    var sep = document.createElement('span');
    sep.className = 'separator';
    sep.textContent = '·';
    bar.insertBefore(sep, wrap.nextSibling);
    tickLive(wrap);
    setInterval(function(){ tickLive(wrap); }, 60000);
  }
  function tickLive(el){
    var txt = el.querySelector('.txt');
    if(!txt) return;
    if (isLiveICT()){
      el.classList.remove('is-offline');
      txt.textContent = 'LIVE NOW · WATCH';
    } else {
      el.classList.add('is-offline');
      var t = hoursUntilLive();
      if (t && (t.h || t.m)){
        txt.textContent = 'NEXT LIVE IN ' + t.h + 'H ' + t.m + 'M · 9 PM ICT';
      } else {
        txt.textContent = 'LIVE EVERY NIGHT 9 PM ICT';
      }
    }
  }

  /* ---------- /support/ live banner toggle ---------- */
  function toggleLiveBanner(){
    var el = document.querySelector('[data-live-banner]');
    if(!el) return;
    if (isLiveICT()){
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  /* ---------- share dialog ---------- */
  function buildShare(bar){
    if(!bar || bar.querySelector('.pv-share')) return;
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
    var shareText = 'PATTAYA VILLA STREAM — live every night 9 PM ICT';
    var enc = encodeURIComponent;
    dlg.innerHTML =
      '<div class="pv-share-inner">' +
      '  <button type="button" class="pv-share-close" aria-label="Close share menu" autofocus>&times;</button>' +
      '  <h4>Share <span class="accent">the show.</span></h4>' +
      '  <div class="pv-share-row">' +
      '    <a class="pv-share-btn" href="https://twitter.com/intent/tweet?text=' + enc(shareText + ' ' + url) + '" target="_blank" rel="noopener" data-gtm="share_x">X</a>' +
      '    <a class="pv-share-btn" href="https://api.whatsapp.com/send/?text=' + enc(shareText + ' ' + url) + '" target="_blank" rel="noopener" data-gtm="share_whatsapp">WhatsApp</a>' +
      '    <a class="pv-share-btn" href="https://t.me/share/url?url=' + enc(url) + '&text=' + enc(shareText) + '" target="_blank" rel="noopener" data-gtm="share_telegram">Telegram</a>' +
      '    <a class="pv-share-btn" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(url) + '" target="_blank" rel="noopener" data-gtm="share_facebook">Facebook</a>' +
      '    <button type="button" class="pv-share-btn pv-share-copy" data-gtm="share_copy">Copy link</button>' +
      '    <button type="button" class="pv-share-btn pv-share-native" data-gtm="share_native">Native</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(dlg);

    btn.addEventListener('click', function(){
      btn.setAttribute('aria-expanded','true');
      try { dlg.showModal(); } catch(_) { dlg.setAttribute('open',''); }
    });
    dlg.addEventListener('click', function(e){
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('close', function(){
      btn.setAttribute('aria-expanded','false');
    });
    dlg.querySelector('.pv-share-close').addEventListener('click', function(){ dlg.close(); });
    dlg.querySelector('.pv-share-copy').addEventListener('click', function(e){
      var b = e.currentTarget;
      try {
        navigator.clipboard.writeText(url).then(function(){
          b.classList.add('copy-state-done');
          var prev = b.textContent;
          b.textContent = 'Copied!';
          setTimeout(function(){ b.classList.remove('copy-state-done'); b.textContent = prev; }, 1800);
        });
      } catch(_) {}
    });
    dlg.querySelector('.pv-share-native').addEventListener('click', function(){
      if (navigator.share){
        navigator.share({ title:document.title, text:shareText, url:url }).catch(function(){});
      } else {
        alert('Native share not available — use one of the buttons above.');
      }
    });
  }

  /* ---------- aria-current on nav ---------- */
  function markActiveNav(){
    var p = location.pathname;
    if (p !== '/' && p.length > 1 && p[p.length-1] !== '/') p = p + '/';
    var sels = ['.utility-bar a', '.footer-network a'];
    sels.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(a){
        try {
          var u = new URL(a.href, location.origin);
          if (u.origin === location.origin && u.pathname === p){
            a.setAttribute('aria-current','page');
          }
        } catch(_) {}
      });
    });
  }

  /* ---------- scroll-triggered stat counters ---------- */
  function buildCounters(){
    if (!('IntersectionObserver' in window)) return;
    var nodes = document.querySelectorAll('.stat-num[data-count]');
    if (!nodes.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        var target = parseFloat(el.dataset.count) || 0;
        var suffix = el.dataset.suffix || '';
        var prefix = el.dataset.prefix || '';
        if (reduce){
          el.textContent = prefix + formatStat(target) + suffix;
          return;
        }
        var dur = 1400, start = performance.now();
        function step(t){
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target * eased;
          el.textContent = prefix + formatStat(val) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = prefix + formatStat(target) + suffix;
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, {threshold:.3});
    nodes.forEach(function(n){ io.observe(n); });
  }
  function formatStat(n){
    if (n >= 1000000) return (n/1000000).toFixed(n >= 10000000 ? 0 : 1).replace(/\.0$/,'') + 'M';
    if (n >= 1000) return (n/1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/,'') + 'K';
    return Math.round(n).toString();
  }

  /* ---------- init wiring ---------- */
  function init(){
    injectStyles();
    markActiveNav();
    var bar = document.querySelector('.utility-bar');
    if (bar){
      buildLive(bar);
      buildShare(bar);
    }
    toggleLiveBanner();
    setInterval(toggleLiveBanner, 60000);
    buildCounters();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
