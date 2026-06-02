/* PATTAYA VILLA STREAM · pv-live.js — v13 (2026-05-27 share + howto)
 * Mobile-first usability layer + 2026 platform features:
 *  - Live pill (focal mobile header element)
 *  - Smart sticky CTA (hide on scroll-down, show on scroll-up)
 *  - Reading progress bar on Article pages
 *  - Marquee mask + IntersectionObserver pause-when-hidden
 *  - Skip-to-main a11y link
 *  - Vibration API on critical CTA taps
 *  - Active tap feedback states
 *  - scroll-margin-top on anchor targets
 *  - @property typed color tokens · view-transition-name · text-box-trim
 *  - hanging-punctuation · @starting-style · prefers-reduced-data
 *  - Share dialog (desktop) · stat counters · aria-current nav
 *  - Compressed mobile hero rhythm
 * Live window: 21:00-03:00 ICT (UTC+7). Pure JS, zero deps. */
(function(){
  'use strict';

  function injectStyles(){
    if(document.getElementById('pv-runtime-css')) return;
    var s = document.createElement('style');
    s.id = 'pv-runtime-css';
    s.textContent = [
      /* === 2026 @property typed color tokens === */
      '@property --pv-pink{syntax:"<color>";inherits:true;initial-value:#ff2f8e}',
      '@property --pv-cyan{syntax:"<color>";inherits:true;initial-value:#00e5ff}',
      '@property --pv-yellow{syntax:"<color>";inherits:true;initial-value:#ffe156}',
      '@property --pv-green{syntax:"<color>";inherits:true;initial-value:#6aff9f}',
      '@property --pv-red{syntax:"<color>";inherits:true;initial-value:#e60030}',
      /* === View Transitions === */
      '@view-transition{navigation:auto}',
      '::view-transition-old(root),::view-transition-new(root){animation-duration:.18s;animation-timing-function:cubic-bezier(.4,0,.2,1)}',
      '.hero h1{view-transition-name:hero-stack}',
      '.footer-brand{view-transition-name:footer-brand}',
      '.sticky-cta{view-transition-name:sticky-cta}',
      /* === Anchor scroll-margin so headings don't hide under sticky bars === */
      'html{scroll-padding-top:80px}',
      'h1,h2,h3,h4,section,article,.body-section,details,[id]{scroll-margin-top:80px}',
      /* === 2026 typography polish === */
      'html{hanging-punctuation:first allow-end last}',
      'h1,h2,h3,.section-title,.tier-name,.equal-paths-q{text-wrap:balance}',
      '.lead,.hero-sub,.body-section p,.tier-body,.manifesto p{text-wrap:pretty}',
      '.hero h1,.footer-brand,.section-title{text-box:trim-both cap alphabetic}',
      /* === @starting-style entrance animations === */
      '@starting-style{.live-status{opacity:0;transform:translateY(-4px)}.hero-eyebrow{opacity:0;transform:translateY(6px)}}',
      '.live-status,.hero-eyebrow{transition:opacity .35s ease, transform .35s cubic-bezier(.2,.7,.3,1)}',
      /* === Tap feedback: active states === */
      '.btn:active,.cta-watch:active,.cta-support:active,.cta-tip:active,.support-card:active,.quick-link:active,.tier:active,.pv-share-btn:active{transform:scale(.97);transition:transform .08s ease}',
      '.btn,.cta-watch,.cta-support,.cta-tip,.support-card,.quick-link,.tier,.pv-share-btn{-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
      /* === Skip link === */
      '.pv-skip{position:absolute;top:-100px;left:0;padding:.8rem 1.2rem;background:#ff2f8e;color:#fff;font-family:"JetBrains Mono",monospace;font-size:.7rem;letter-spacing:1.6px;text-transform:uppercase;font-weight:800;text-decoration:none;z-index:9999;border-radius:0 0 8px 0}',
      '.pv-skip:focus{top:0;outline:3px solid #00e5ff;outline-offset:-3px}',
      /* === Reading progress bar (Article pages only — .has-progress on <body>) === */
      '.pv-progress{position:fixed;top:0;left:0;right:0;height:3px;background:rgba(255,255,255,.06);z-index:200;pointer-events:none}',
      '.pv-progress-bar{height:100%;background:linear-gradient(90deg,#ff2f8e,#ffe156);width:0;transform-origin:left center;transition:width .12s linear}',
      /* === Selection / scrollbar === */
      '::selection{background:#ff2f8e;color:#fff}',
      '::-moz-selection{background:#ff2f8e;color:#fff}',
      'html{scrollbar-color:#ff2f8e #08080c;scrollbar-width:thin}',
      '::-webkit-scrollbar{width:10px;height:10px}',
      '::-webkit-scrollbar-track{background:#08080c}',
      '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2f8e,#c4002a);border-radius:9999px;border:2px solid #08080c}',
      '::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#ff4d9f,#ff1f4d)}',
      /* === Live pill === */
      '@media(prefers-reduced-motion:reduce){.live-status .dot,.live-banner,.live-banner-dot{animation:none!important}.live-status,.hero-eyebrow{transition:none!important}}',
      '.live-status a{color:inherit;text-decoration:none}',
      '.live-status a:hover{color:#ffe156}',
      '.utility-scroll a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px;text-decoration-thickness:2px}',
      '.site-footer .footer-grid a[aria-current="page"] strong{color:#ffe156}',
      '.site-footer .footer-grid a[aria-current="page"]{border-color:#ff2f8e}',
      /* === Marquee mask + paused state === */
      '.marquee{mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}',
      '.marquee.is-paused .marquee-track{animation-play-state:paused}',
      /* === Share button + dialog === */
      '.pv-share{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
      '.pv-share:hover{color:#fff}',
      '.pv-share:focus-visible{outline:2px solid #00e5ff;outline-offset:3px;border-radius:3px}',
      'dialog.pv-share-dialog{padding:0;border:none;background:transparent;color:inherit;max-width:none;max-height:none}',
      'dialog.pv-share-dialog::backdrop{background:rgba(8,8,12,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      'dialog.pv-share-dialog .pv-share-inner{position:fixed;left:50%;transform:translateX(-50%);bottom:84px;background:rgba(8,8,12,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:2px solid #ff2f8e;border-radius:16px;padding:1.2rem 1.2rem 1rem;box-shadow:0 12px 50px rgba(255,47,142,.35);min-width:280px;max-width:90vw;color:rgba(255,255,255,.92);font-family:Inter,system-ui,sans-serif}',
      'dialog.pv-share-dialog h4{font-family:"Bebas Neue",sans-serif;font-size:1.5rem;color:#fff;margin:0 0 .8rem;letter-spacing:.01em;text-transform:uppercase}',
      'dialog.pv-share-dialog h4 .accent{color:#ff2f8e}',
      '.pv-share-row{display:flex;flex-wrap:wrap;gap:.5rem}',
      '.pv-share-hint{flex:0 0 100%;margin:.35rem 0 0;font-family:"JetBrains Mono",monospace;font-size:.52rem;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.55);font-weight:800}',
      '.pv-share-hint:first-of-type{margin-top:0}',
      '.pv-share-btn{flex:1;min-width:90px;display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.75rem .8rem;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;text-decoration:none;font-family:"JetBrains Mono",monospace;font-size:.62rem;letter-spacing:1.4px;text-transform:uppercase;font-weight:800;border:1px solid rgba(255,255,255,.1);transition:all .15s;cursor:pointer;min-height:44px}',
      '.pv-share-btn:hover,.pv-share-btn:focus-visible{background:rgba(255,47,142,.18);border-color:#ff2f8e;color:#fff;transform:translateY(-1px);outline:none}',
      '.pv-share-btn:focus-visible{box-shadow:0 0 0 3px rgba(255,47,142,.35)}',
      '.pv-share-btn.copy-state-done{background:rgba(106,255,159,.18);border-color:#6aff9f;color:#6aff9f}',
      '.pv-share-close{position:absolute;top:.5rem;right:.6rem;background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:1.5rem;line-height:1;padding:.3rem .55rem;border-radius:6px;min-height:36px;min-width:36px}',
      '.pv-share-close:hover,.pv-share-close:focus-visible{color:#fff;background:rgba(255,255,255,.08);outline:none}',
      /* === /support/ live banner === */
      '@keyframes pv-live-banner-pulse{0%,100%{box-shadow:0 0 0 0 rgba(230,0,48,.45)}70%{box-shadow:0 0 0 12px rgba(230,0,48,0)}}',
      '.live-banner{margin:0 0 1rem;border:2px solid #e60030;background:rgba(230,0,48,.1);border-radius:10px;animation:pv-live-banner-pulse 2.2s ease-out infinite}',
      '.live-banner a{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.8rem 1rem;text-decoration:none;color:#fff;font-family:"JetBrains Mono",monospace;font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:800}',
      '.live-banner-dot{width:9px;height:9px;border-radius:50%;background:#e60030;flex-shrink:0;animation:pvlive 1.8s ease-out infinite}',

      /* === Smart sticky CTA — hide on scroll-down === */
      '.sticky-cta{transition:transform .25s cubic-bezier(.4,0,.2,1)}',
      '.sticky-cta.is-hidden{transform:translateY(100%)}',
      '@media(prefers-reduced-motion:reduce){.sticky-cta{transition:none!important}}',
      /* === Forced-colors / contrast / transparency === */
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
      '  dialog.pv-share-dialog .pv-share-inner,.utility-bar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.98)}',
      '  dialog.pv-share-dialog::backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.95)}',
      '}',
      /* === Marquee mask + paused state === */
      '.marquee{mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}',
      'details[name="faq"] summary{position:relative;cursor:pointer;list-style:none}',
      'details[name="faq"] summary::-webkit-details-marker{display:none}',
      'details[name="faq"] summary::after{content:"+";position:absolute;right:1rem;top:50%;transform:translateY(-50%);font-family:"JetBrains Mono",monospace;font-size:1.2rem;color:#ff2f8e;transition:transform .25s ease}',
      'details[name="faq"][open] summary::after{content:"−"}',
      'details[name="faq"][open] summary{color:#ff2f8e}',
      '@media (prefers-reduced-data:reduce){.marquee-track,.live-status .dot,.live-banner{animation:none!important}.hero-eyebrow,.btn-mega::after{animation:none!important}}',
      /* ============================================================
       * MOBILE SYSTEM v7 — DEEP MOBILE UX
       * ============================================================ */
      'html,body{overflow-x:clip;max-width:100vw}',
      'img,video,iframe,svg{max-width:100%;height:auto}',
      '@media(max-width:760px){',
      /* Compressed mobile rhythm — keep network bar + marquee visible */
      '  main{padding-left:0;padding-right:0}',
      '  section{padding:2.2rem 1rem!important}',
      '  .hero{padding:1.6rem 1rem 2.2rem!important}',
      /* COMPRESSED hero — fits live pill + eyebrow + h1 + meta + 1 CTA above the fold on iPhone 14 */
      '  .hero h1{font-size:clamp(3rem,12.5vw,5.4rem)!important;line-height:.9;letter-spacing:-.012em;margin:0 0 .8rem}',
      '  .hero p,.hero-sub,.lead{font-size:.98rem;line-height:1.55;margin:0 0 1rem}',
      '  .hero-eyebrow{font-size:.58rem;letter-spacing:1.6px;padding:.32rem .75rem;margin-bottom:.9rem}',
      '  .hero-meta{font-size:.58rem;letter-spacing:1.5px;margin-bottom:1.2rem;line-height:1.6}',
      '  .section-title{font-size:clamp(2rem,8.5vw,3.6rem)!important;line-height:.96;margin-bottom:1.2rem}',
      '  .hero-cta,.end-cta,.equal-paths-cta,.watch-bar,.cta-row{display:flex;flex-direction:column;align-items:stretch;gap:.6rem;width:100%}',
      '  .hero-cta .btn,.end-cta .btn,.equal-paths-cta a,.watch-bar .btn{width:100%;justify-content:center;text-align:center}',
      '  .btn{padding:.95rem 1.4rem;font-size:.75rem;letter-spacing:1.6px;min-height:48px}',
      '  .btn-mega{font-size:.95rem;padding:1.05rem 1.5rem;letter-spacing:1.9px}',
      '  .quick-links{grid-template-columns:1fr;gap:.7rem;margin-top:1.4rem}',
      '  .quick-link{padding:1.3rem 1.1rem;border-radius:12px}',
      '  .support-grid,.tier-grid{grid-template-columns:1fr;gap:.8rem}',
      '  .support-card,.tier{padding:1.4rem 1.2rem}',
      '  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin:1.2rem 0 0}',
      '  .stat{padding:1rem .75rem}',
      '  .stat-num{font-size:clamp(2rem,8vw,3rem)}',
      '  .stat-label{font-size:.55rem;letter-spacing:1.3px}',
      '  footer{padding:2.2rem 1rem 1rem;font-size:.58rem;letter-spacing:1.1px;line-height:1.7}',
      '  .footer-brand{font-size:1.7rem;margin-bottom:.35rem}',
      '  .footer-network{margin:.9rem auto;gap:.4rem .8rem;font-size:.58rem;letter-spacing:1.1px;line-height:1.6;max-width:100%;padding:0 .5rem}',
      '  .footer-network a{display:inline-flex;align-items:center;padding:.6rem .4rem;min-height:44px;white-space:nowrap}',
      '  .footer-legal{margin-top:1.1rem;font-size:.5rem;line-height:1.7;letter-spacing:1px}',
      '  .sticky-cta a{font-size:.7rem;letter-spacing:1.3px;padding:.85rem .6rem;min-height:54px;gap:.35rem}',
      '  body{padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))}',
      '  body.has-progress{padding-top:3px}',
      '  .body-section h2,.body-section-title{font-size:clamp(1.8rem,7vw,2.6rem);line-height:1}',
      '  .body-section p{font-size:1rem;line-height:1.65}',
      '  .pullquote{font-size:1.05rem;padding:1.1rem 1.1rem;margin:1.3rem 0}',
      '  details summary{padding:1rem 2.4rem 1rem 1.1rem;font-size:.95rem;line-height:1.35;min-height:48px;display:flex;align-items:center}',
      '  details > div,details > p{padding:0 1.1rem 1.1rem;font-size:.96rem}',
      '  .toc,.toc-nav{flex-direction:column;align-items:stretch;gap:.4rem;padding:1rem}',
      '  .toc a{padding:.7rem .9rem;font-size:.72rem;letter-spacing:1.4px;display:block;width:100%;min-height:44px;display:flex;align-items:center}',
      '  .manifesto,.recipe-steps{padding:1.4rem 1.1rem}',
      '  .recipe-step{padding:1rem .9rem}',
      '  .live-banner a{padding:.7rem 1rem;font-size:.65rem;letter-spacing:1.2px;text-align:center;line-height:1.45}',
      '  .back-link{padding:.5rem 0;font-size:.62rem;letter-spacing:1.4px;margin-bottom:.8rem;min-height:36px;display:inline-flex;align-items:center}',
      /* Sub-page mobile brand bar — sticky top "← PATTAYA VILLA STREAM" replaces tiny back-link */
      '  .back-bar{position:sticky;top:0;z-index:100;background:rgba(8,8,12,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:2px solid #ff2f8e;margin:0 0 1.2rem 0!important;padding:0;width:100%;view-transition-name:brand-bar}',
      '  .back-bar a{display:flex;align-items:center;justify-content:center;padding:.85rem 1rem;font-family:"Bebas Neue",sans-serif;font-size:1.35rem;letter-spacing:.04em;text-transform:uppercase;color:#fff;text-decoration:none;min-height:52px;line-height:1;font-weight:400}',
      '  .back-bar a:active{transform:scale(.98);transition:transform .08s ease}',
      '  .back-bar a:hover{color:#ffe156}',
      '}',
      '@media(max-width:440px){',
      '  .utility-bar{padding:.5rem .75rem;min-height:40px}',
      '  .utility-bar .live-status{font-size:.6rem;letter-spacing:1.5px;padding:.4rem .85rem;min-height:44px}',
      '  .marquee-track{font-size:.62rem;letter-spacing:1.4px;animation-duration:36s}',
      '  .hero h1{font-size:clamp(2.5rem,12vw,4.4rem)!important;line-height:.92;letter-spacing:-.018em;word-break:break-word;overflow-wrap:anywhere}',
      '  .hero-eyebrow{font-size:.54rem;letter-spacing:1.4px;padding:.28rem .65rem;margin-bottom:.75rem}',
      '  .hero p,.hero-sub{font-size:.95rem}',
      '  section,.hero{padding-left:.85rem!important;padding-right:.85rem!important}',
      '  .btn{font-size:.72rem;letter-spacing:1.4px;padding:.85rem 1.2rem}',
      '  .btn-mega{font-size:.86rem;padding:.95rem 1.3rem;letter-spacing:1.7px}',
      '  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}',
      '  .stat{padding:.85rem .55rem}',
      '  .footer-brand{font-size:1.5rem}',
      '  .footer-network{font-size:.54rem;letter-spacing:1px;gap:.35rem .65rem}',
      '  .sticky-cta a{font-size:.64rem;letter-spacing:1.2px;padding:.8rem .45rem;min-height:50px}',
      '  body{padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))}',
      '}',
      '@media(max-width:360px){',
      '  .utility-bar .live-status{font-size:.55rem;letter-spacing:1.3px;padding:.35rem .7rem}',
      '  .hero h1{font-size:clamp(2.2rem,12.5vw,4rem)!important;letter-spacing:-.02em}',
      '  .marquee-track{font-size:.58rem;animation-duration:30s}',
      '  .stats{grid-template-columns:1fr;gap:.5rem}',
      '  .sticky-cta a{font-size:.58rem;letter-spacing:1px;padding:.75rem .35rem}',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- ICT (UTC+7) helper ---------- */
  function ictNow(){var d = new Date();return new Date(d.getTime() + d.getTimezoneOffset()*60000 + 7*3600000);}
  function isLiveICT(){var h = ictNow().getHours();return (h >= 21) || (h < 3);}
  function hoursUntilLive(){
    var now = ictNow();
    if (now.getHours() >= 21 || now.getHours() < 3) return 0;
    var target = new Date(now); target.setHours(21,0,0,0);
    var ms = target - now;
    return {h: Math.floor(ms / 3600000), m: Math.floor((ms % 3600000) / 60000)};
  }

  var LIVE_WATCH_URL = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&utm_medium=share&utm_campaign=live';

  function wireShareCopy(btn, text){
    btn.addEventListener('click', function(){
      var b = btn;
      try {
        navigator.clipboard.writeText(text).then(function(){
          b.classList.add('copy-state-done');
          var prev = b.textContent;
          b.textContent = 'Copied!';
          setTimeout(function(){ b.classList.remove('copy-state-done'); b.textContent = prev; }, 1800);
        });
      } catch (_) {}
    });
  }

  /* ---------- utility bar action slot (live + share) ---------- */
  function utilityActions(bar){
    var el = bar.querySelector('.utility-bar-actions');
    if (!el) {
      el = document.createElement('div');
      el.className = 'utility-bar-actions';
      bar.insertBefore(el, bar.firstChild);
    }
    return el;
  }

  function isCompactBar(){ try { return window.matchMedia('(max-width:760px)').matches; } catch (_) { return false; } }

  /* ---------- live indicator ---------- */
  function buildLive(bar){
    if(!bar) return;
    var actions = utilityActions(bar);
    var placeholder = bar.querySelector('.live-status.is-placeholder');
    if (placeholder) {
      var wrap = document.createElement('a');
      wrap.className = 'live-status';
      wrap.href = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&utm_medium=live_pill&utm_campaign=watch';
      wrap.target = '_blank'; wrap.rel = 'noopener';
      wrap.setAttribute('data-gtm','live_pill_click');
      wrap.setAttribute('aria-hidden','false');
      var dot = document.createElement('span'); dot.className = 'dot';
      var txt = document.createElement('span'); txt.className = 'txt';
      wrap.appendChild(dot); wrap.appendChild(txt);
      placeholder.replaceWith(wrap);
      tickLive(wrap);
      setInterval(function(){ tickLive(wrap); }, 60000);
      try { window.matchMedia('(max-width:760px)').addEventListener('change', function(){ tickLive(wrap); }); } catch (_) {}
      return;
    }
    if(bar.querySelector('.live-status')) return;
    var wrap = document.createElement('a');
    wrap.className = 'live-status';
    wrap.href = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&utm_medium=live_pill&utm_campaign=watch';
    wrap.target = '_blank'; wrap.rel = 'noopener';
    wrap.setAttribute('data-gtm','live_pill_click');
    var dot = document.createElement('span'); dot.className = 'dot';
    var txt = document.createElement('span'); txt.className = 'txt';
    wrap.appendChild(dot); wrap.appendChild(txt);
    actions.appendChild(wrap);
    tickLive(wrap);
    setInterval(function(){ tickLive(wrap); }, 60000);
    try { window.matchMedia('(max-width:760px)').addEventListener('change', function(){ tickLive(wrap); }); } catch (_) {}
  }
  function tickLive(el){
    var txt = el.querySelector('.txt'); if(!txt) return;
    var compact = isCompactBar();
    if (isLiveICT()){ el.classList.remove('is-offline'); txt.textContent = compact ? 'LIVE' : 'LIVE NOW · WATCH'; }
    else {
      el.classList.add('is-offline');
      var t = hoursUntilLive();
      if (t && (t.h || t.m)) txt.textContent = compact ? (t.h + 'H ' + t.m + 'M') : ('NEXT LIVE IN ' + t.h + 'H ' + t.m + 'M');
      else txt.textContent = compact ? '9 PM ICT' : 'LIVE NIGHTLY 9 PM ICT';
    }
  }

  function toggleLiveBanner(){var el = document.querySelector('[data-live-banner]');if(el) el.hidden = !isLiveICT();}

  /* ---------- hero showtime + countdown (homepage) ---------- */
  function buildHeroShowtime(){
    var block = document.getElementById('hero-showtime');
    if (!block) return;
    var card = block.querySelector('.hero-showtime-card');
    var val = block.querySelector('[data-hero-countdown]');
    if (!card || !val) return;
    function tick(){
      if (isLiveICT()){
        card.classList.remove('is-offline');
        card.classList.add('is-live');
        val.textContent = '● LIVE NOW';
      } else {
        card.classList.add('is-offline');
        card.classList.remove('is-live');
        var t = hoursUntilLive();
        if (t && (t.h || t.m)) val.textContent = t.h + 'h ' + t.m + 'm until 9 PM ICT';
        else val.textContent = '9 PM ICT tonight';
      }
    }
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- homepage share tonight (native share or copy live link) ---------- */
  function buildHeroShare(){
    var btn = document.getElementById('hero-share-tonight');
    if (!btn) return;
    var shareText = 'PATTAYA VILLA STREAM — live every night 9 PM ICT';
    btn.addEventListener('click', function(){
      var live = isLiveICT();
      var url = live ? LIVE_WATCH_URL : (location.origin + '/');
      var clip = live ? (shareText + ' → ' + LIVE_WATCH_URL) : (shareText + ' ' + location.origin + '/');
      if (navigator.share){
        navigator.share({ title: document.title, text: shareText, url: url }).catch(function(){});
        return;
      }
      try {
        navigator.clipboard.writeText(clip).then(function(){
          btn.classList.add('copied');
          var prev = btn.textContent;
          btn.textContent = '✓ LINK COPIED';
          setTimeout(function(){ btn.classList.remove('copied'); btn.textContent = prev; }, 2000);
        });
      } catch (_) {}
    });
  }

  /* ---------- sticky CTA live pulse ---------- */
  function buildStickyLive(){
    var watch = document.querySelector('.sticky-cta .cta-watch');
    if (!watch) return;
    if (!watch.dataset.offLabel) watch.dataset.offLabel = watch.textContent.trim();
    function tick(){
      if (isLiveICT()){
        watch.classList.add('is-live-now');
        watch.textContent = '● LIVE NOW';
      } else {
        watch.classList.remove('is-live-now');
        watch.textContent = watch.dataset.offLabel;
      }
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ---------- share dialog ---------- */
  function buildShare(bar){
    if(!bar || bar.querySelector('.pv-share:not(.is-placeholder)')) return;
    var actions = utilityActions(bar);
    var placeholder = bar.querySelector('.pv-share.is-placeholder');
    var btn = placeholder || document.createElement('button');
    btn.type = 'button';
    btn.className = 'pv-share';
    btn.setAttribute('aria-haspopup','dialog');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Open share menu');
    btn.textContent = 'SHARE';
    btn.removeAttribute('aria-hidden');
    btn.removeAttribute('tabindex');
    if (!placeholder) actions.appendChild(btn);
    var dlg = document.createElement('dialog');
    dlg.className = 'pv-share-dialog';
    dlg.setAttribute('aria-label','Share this page');
    var url = location.origin + location.pathname;
    var shareText = 'PATTAYA VILLA STREAM — live every night 9 PM ICT';
    var liveShareText = shareText + ' → ' + LIVE_WATCH_URL;
    var enc = encodeURIComponent;
    dlg.innerHTML =
      '<div class="pv-share-inner">' +
      '  <button type="button" class="pv-share-close" aria-label="Close share menu" autofocus>&times;</button>' +
      '  <h4>Share <span class="accent">the show.</span></h4>' +
      '  <div class="pv-share-row">' +
      '    <span class="pv-share-hint">This page</span>' +
      '    <a class="pv-share-btn" href="https://twitter.com/intent/tweet?text=' + enc(shareText + ' ' + url) + '" target="_blank" rel="noopener" data-gtm="share_x">X</a>' +
      '    <a class="pv-share-btn" href="https://api.whatsapp.com/send/?text=' + enc(shareText + ' ' + url) + '" target="_blank" rel="noopener" data-gtm="share_whatsapp">WhatsApp</a>' +
      '    <a class="pv-share-btn" href="https://t.me/share/url?url=' + enc(url) + '&text=' + enc(shareText) + '" target="_blank" rel="noopener" data-gtm="share_telegram">Telegram</a>' +
      '    <a class="pv-share-btn" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(url) + '" target="_blank" rel="noopener" data-gtm="share_facebook">Facebook</a>' +
      '    <button type="button" class="pv-share-btn pv-share-copy" data-gtm="share_copy">Copy link</button>' +
      '    <button type="button" class="pv-share-btn pv-share-native" data-gtm="share_native">Native</button>' +
      '    <span class="pv-share-hint">YouTube live</span>' +
      '    <a class="pv-share-btn" href="' + LIVE_WATCH_URL + '" target="_blank" rel="noopener" data-gtm="share_open_live">Open live</a>' +
      '    <button type="button" class="pv-share-btn pv-share-copy-live" data-gtm="share_copy_live">Copy live link</button>' +
      '    <a class="pv-share-btn" href="https://api.whatsapp.com/send/?text=' + enc(liveShareText) + '" target="_blank" rel="noopener" data-gtm="share_whatsapp_live">WhatsApp live</a>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(dlg);
    btn.addEventListener('click', function(){ btn.setAttribute('aria-expanded','true'); try { dlg.showModal(); } catch(_) { dlg.setAttribute('open',''); } });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function(){ btn.setAttribute('aria-expanded','false'); });
    dlg.querySelector('.pv-share-close').addEventListener('click', function(){ dlg.close(); });
    wireShareCopy(dlg.querySelector('.pv-share-copy'), url);
    wireShareCopy(dlg.querySelector('.pv-share-copy-live'), LIVE_WATCH_URL);
    dlg.querySelector('.pv-share-native').addEventListener('click', function(){
      var payload = isLiveICT()
        ? { title: 'PATTAYA VILLA STREAM — LIVE NOW', text: shareText, url: LIVE_WATCH_URL }
        : { title: document.title, text: shareText, url: url };
      if (navigator.share) navigator.share(payload).catch(function(){});
    });
  }

  /* ---------- aria-current on nav ---------- */
  function markActiveNav(){
    var p = location.pathname;
    if (p !== '/' && p.length > 1 && p[p.length-1] !== '/') p = p + '/';
    ['.utility-scroll a', '.site-footer .footer-grid a'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(a){
        try { var u = new URL(a.href, location.origin); if (u.origin === location.origin && u.pathname === p) a.setAttribute('aria-current','page'); } catch(_) {}
      });
    });
  }

  /* ---------- stat counters ---------- */
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
        var suffix = el.dataset.suffix || ''; var prefix = el.dataset.prefix || '';
        if (reduce){ el.textContent = prefix + formatStat(target) + suffix; return; }
        var dur = 1400, start = performance.now();
        function step(t){
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + formatStat(target * eased) + suffix;
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

  /* ---------- skip-to-main link ---------- */
  function buildSkipLink(){
    if (document.getElementById('pv-skip')) return;
    // Don't inject if page already has a skip-link
    if (document.querySelector('a.skip-link[href^="#"]')) return;
    var main = document.querySelector('main') || document.querySelector('#main');
    if (!main) return;
    if (!main.id) main.id = 'main';
    var skip = document.createElement('a');
    skip.id = 'pv-skip'; skip.className = 'pv-skip';
    skip.href = '#' + main.id;
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /* ---------- reading progress bar (Article pages: /format/, /code/) ---------- */
  function buildProgressBar(){
    var path = location.pathname;
    var isArticle = path.indexOf('/format/') === 0 || path.indexOf('/code/') === 0;
    if (!isArticle) return;
    document.body.classList.add('has-progress');
    var wrap = document.createElement('div');
    wrap.className = 'pv-progress'; wrap.setAttribute('aria-hidden','true');
    var bar = document.createElement('div'); bar.className = 'pv-progress-bar';
    wrap.appendChild(bar);
    document.body.insertBefore(wrap, document.body.firstChild);
    var ticking = false;
    function update(){
      var doc = document.documentElement;
      var max = Math.max(doc.scrollHeight, document.body.scrollHeight) - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function(){ if (!ticking){ requestAnimationFrame(update); ticking = true; } }, {passive:true});
    update();
  }

  /* ---------- smart sticky CTA — hide on scroll-down, show on scroll-up ---------- */
  function buildSmartSticky(){
    var cta = document.querySelector('.sticky-cta'); if (!cta) return;
    var lastY = window.scrollY; var ticking = false;
    var threshold = 8; // px
    function update(){
      var y = window.scrollY;
      var dy = y - lastY;
      if (Math.abs(dy) > threshold){
        if (dy > 0 && y > 200) cta.classList.add('is-hidden');
        else cta.classList.remove('is-hidden');
        lastY = y;
      }
      ticking = false;
    }
    window.addEventListener('scroll', function(){ if (!ticking){ requestAnimationFrame(update); ticking = true; } }, {passive:true});
  }

  /* ---------- vibration on critical CTA tap ---------- */
  function wireVibration(){
    if (!navigator.vibrate) return;
    document.addEventListener('click', function(e){
      var t = e.target.closest('[data-gtm]'); if (!t) return;
      var k = t.getAttribute('data-gtm') || '';
      // Only critical CTAs get haptic feedback
      if (/watch_live|sticky_|hero_|tip|superchat|subscribe|live_pill/i.test(k)){
        try { navigator.vibrate(8); } catch(_) {}
      }
    }, {passive:true, capture:true});
  }

  /* ---------- marquee pause-when-hidden ---------- */
  function pauseMarqueeWhenHidden(){
    if (!('IntersectionObserver' in window)) return;
    var m = document.querySelector('.marquee'); if (!m) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) m.classList.remove('is-paused');
        else m.classList.add('is-paused');
      });
    }, {threshold:0});
    io.observe(m);
  }


  /* ---------- FAQ accordion aria-expanded ---------- */
  function bindFaqA11y(){
    document.querySelectorAll('details[name="faq"]').forEach(function(d){
      var s = d.querySelector('summary');
      if (!s) return;
      s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
      d.addEventListener('toggle', function(){
        s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
      });
    });
  }

  /* ---------- share_target landing (?shared=1) ---------- */
  function handleSharedLanding(){
    try {
      var p = new URLSearchParams(location.search);
      if (!p.has('shared') && !p.has('title') && !p.has('text') && !p.has('url')) return;
      var main = document.querySelector('main') || document.body;
      var box = document.createElement('div');
      box.className = 'pv-shared-banner';
      box.setAttribute('role', 'status');
      box.textContent = 'Shared with you — watch live tonight 9 PM ICT';
      if (main.firstChild) main.insertBefore(box, main.firstChild);
      else main.appendChild(box);
      if (typeof gtag === 'function') gtag('event', 'share_target_open', { event_category: 'engagement' });
    } catch (_) {}
  }

  /* ---------- SW update toast — once per version, only when a new worker is waiting ---------- */
  function bindSwUpdate(){
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', function(e){
      if (e.data && e.data.type === 'SW_WAITING') showSwToast(e.data.version);
    });
    navigator.serviceWorker.getRegistration().then(function(reg){
      if (!reg) return;
      if (reg.waiting && navigator.serviceWorker.controller) {
        showSwToast(reg.waiting.scriptURL);
      }
      reg.addEventListener('updatefound', function(){
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function(){
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showSwToast(nw.scriptURL);
          }
        });
      });
    }).catch(function(){});
  }
  function showSwToast(versionKey){
    var key = 'pv_sw_seen_' + (versionKey || 'default');
    try { if (sessionStorage.getItem(key)) return; } catch (_) {}
    if (document.getElementById('pv-sw-toast')) return;
    var t = document.createElement('div');
    t.id = 'pv-sw-toast';
    t.className = 'pv-sw-toast';
    t.innerHTML = '<span>Site updated</span><button type="button">Refresh</button><button type="button" class="pv-sw-dismiss" aria-label="Dismiss">×</button>';
    t.querySelector('button:not(.pv-sw-dismiss)').addEventListener('click', function(){ location.reload(); });
    t.querySelector('.pv-sw-dismiss').addEventListener('click', function(){
      try { sessionStorage.setItem(key, '1'); } catch (_) {}
      t.remove();
    });
    document.body.appendChild(t);
    setTimeout(function(){
      if (t.parentNode) {
        try { sessionStorage.setItem(key, '1'); } catch (_) {}
        t.remove();
      }
    }, 12000);
  }

  /* ---------- PWA install nudge (2nd visit+, dismissible) ---------- */
  function buildInstallPrompt(){
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    try { if (localStorage.getItem('pv_install_dismiss')) return; } catch (_) {}
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      deferred = e;
      maybeShowInstall();
    });
    function maybeShowInstall(){
      if (!deferred || document.getElementById('pv-install-toast')) return;
      try {
        var v = parseInt(localStorage.getItem('pv_visits') || '0', 10) + 1;
        localStorage.setItem('pv_visits', String(v));
        if (v < 2) return;
      } catch (_) {}
      var t = document.createElement('div');
      t.id = 'pv-install-toast';
      t.className = 'pv-install-toast';
      t.setAttribute('role', 'status');
      t.innerHTML = '<span>Add Villa Stream to your home screen — one tap back every night</span><button type="button">Install</button><button type="button" class="pv-install-dismiss" aria-label="Dismiss">×</button>';
      t.querySelector('button:not(.pv-install-dismiss)').addEventListener('click', function(){
        deferred.prompt();
        deferred.userChoice.finally(function(){
          t.remove();
          try { localStorage.setItem('pv_install_dismiss', '1'); } catch (_) {}
        });
      });
      t.querySelector('.pv-install-dismiss').addEventListener('click', function(){
        t.remove();
        try { localStorage.setItem('pv_install_dismiss', '1'); } catch (_) {}
      });
      document.body.appendChild(t);
      setTimeout(function(){ if (t.parentNode) t.remove(); }, 15000);
    }
    setTimeout(maybeShowInstall, 5000);
  }

  /* ---------- live JSON-LD signal (homepage VideoObject broadcast) ---------- */
  function updateLiveSchema(){
    var path = location.pathname;
    if (path !== '/' && path !== '') return;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){
      try {
        var data = JSON.parse(s.textContent);
        var graph = data['@graph'] || (data['@type'] ? [data] : []);
        var live = isLiveICT();
        var changed = false;
        graph.forEach(function(node){
          if (node['@type'] === 'VideoObject' && node.publication){
            if (node.publication.isLiveBroadcast !== live){ node.publication.isLiveBroadcast = live; changed = true; }
          }
          if (node['@type'] === 'BroadcastService'){
            node.isBroadcasting = live;
            changed = true;
          }
        });
        if (changed) s.textContent = JSON.stringify(data);
      } catch (_) {}
    });
  }

  /* ---------- init ---------- */
  function init(){
    injectStyles();
    buildSkipLink();
    markActiveNav();
    bindFaqA11y();
    handleSharedLanding();
    bindSwUpdate();
    var bar = document.querySelector('.utility-bar');
    if (bar){ buildLive(bar); buildShare(bar); }
    toggleLiveBanner();
    buildHeroShowtime();
    buildHeroShare();
    buildStickyLive();
    buildInstallPrompt();
    setInterval(toggleLiveBanner, 60000);
    updateLiveSchema();
    setInterval(updateLiveSchema, 60000);
    buildCounters();
    buildProgressBar();
    buildSmartSticky();
    pauseMarqueeWhenHidden();
    wireVibration();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
