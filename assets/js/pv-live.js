/* PATTAYA VILLA STREAM · pv-live.js — v7 (2026-05-18 mobile-deep)
 * Mobile-first usability layer + 2026 platform features:
 *  - Live pill (focal mobile header element)
 *  - Smart sticky CTA (hide on scroll-down, show on scroll-up)
 *  - Reading progress bar on Article pages
 *  - PWA install prompt (beforeinstallprompt capture)
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
      '@starting-style{.live-status{opacity:0;transform:translateY(-4px)}.hero-eyebrow{opacity:0;transform:translateY(6px)}.pv-install{opacity:0;transform:translateY(8px)}}',
      '.live-status,.hero-eyebrow,.pv-install{transition:opacity .35s ease, transform .35s cubic-bezier(.2,.7,.3,1)}',
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
      '@keyframes pvlive{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(230,0,48,.55)}70%{opacity:.5;box-shadow:0 0 0 8px rgba(230,0,48,0)}}',
      '@media(prefers-reduced-motion:reduce){.live-status .dot,.live-banner,.live-banner-dot{animation:none!important}.live-status,.hero-eyebrow,.pv-install{transition:none!important}}',
      '.live-status{display:inline-flex;align-items:center;gap:.4rem;font-family:"JetBrains Mono",monospace;font-size:.62rem;letter-spacing:1.6px;text-transform:uppercase;font-weight:800;color:#fff;padding:.3rem .7rem;background:rgba(230,0,48,.15);border:1px solid rgba(230,0,48,.4);border-radius:9999px}',
      '.live-status.is-offline{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.7)}',
      '.live-status .dot{width:8px;height:8px;border-radius:50%;background:#e60030;animation:pvlive 1.8s ease-out infinite}',
      '.live-status.is-offline .dot{background:rgba(255,255,255,.4);animation:none}',
      '.live-status a{color:inherit;text-decoration:none}',
      '.live-status a:hover{color:#ffe156}',
      '.utility-bar a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px;text-decoration-thickness:2px}',
      '.footer-network a[aria-current="page"]{color:#ffe156;text-decoration:underline;text-decoration-color:#ff2f8e;text-underline-offset:3px}',
      /* === Marquee mask + paused state === */
      '.marquee{mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}',
      '.marquee.is-paused .marquee-track{animation-play-state:paused}',
      /* === Share button + dialog === */
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
      /* === /support/ live banner === */
      '@keyframes pv-live-banner-pulse{0%,100%{box-shadow:0 0 0 0 rgba(230,0,48,.45)}70%{box-shadow:0 0 0 12px rgba(230,0,48,0)}}',
      '.live-banner{margin:0 0 1rem;border:2px solid #e60030;background:rgba(230,0,48,.1);border-radius:10px;animation:pv-live-banner-pulse 2.2s ease-out infinite}',
      '.live-banner a{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.8rem 1rem;text-decoration:none;color:#fff;font-family:"JetBrains Mono",monospace;font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:800}',
      '.live-banner-dot{width:9px;height:9px;border-radius:50%;background:#e60030;flex-shrink:0;animation:pvlive 1.8s ease-out infinite}',
      /* === PWA install banner === */
      '.pv-install{position:fixed;left:1rem;right:1rem;bottom:80px;z-index:150;display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;background:rgba(8,8,12,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:2px solid #00e5ff;border-radius:12px;font-family:"JetBrains Mono",monospace;font-size:.66rem;letter-spacing:1.4px;text-transform:uppercase;font-weight:800;color:#fff;box-shadow:0 8px 30px rgba(0,229,255,.25)}',
      '.pv-install-icon{color:#00e5ff;font-size:1.2rem;flex-shrink:0}',
      '.pv-install-text{flex:1;line-height:1.4}',
      '.pv-install-btn{padding:.5rem .8rem;background:#00e5ff;color:#08080c;border:none;border-radius:6px;font:inherit;cursor:pointer;font-weight:800;letter-spacing:1.2px}',
      '.pv-install-close{background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:1.2rem;padding:.3rem .5rem;line-height:1}',
      '.pv-install-close:hover{color:#fff}',
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
      '  dialog.pv-share-dialog .pv-share-inner,.utility-bar,.pv-install{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.98)}',
      '  dialog.pv-share-dialog::backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(8,8,12,.95)}',
      '}',
      /* === FAQ exclusive accordion polish === */
      'details[name="faq"] summary{position:relative;cursor:pointer;list-style:none}',
      'details[name="faq"] summary::-webkit-details-marker{display:none}',
      'details[name="faq"] summary::after{content:"+";position:absolute;right:1rem;top:50%;transform:translateY(-50%);font-family:"JetBrains Mono",monospace;font-size:1.2rem;color:#ff2f8e;transition:transform .25s ease}',
      'details[name="faq"][open] summary::after{content:"−"}',
      'details[name="faq"][open] summary{color:#ff2f8e}',
      '@media (prefers-reduced-data:reduce){.marquee-track,.live-status .dot,.live-banner{animation:none!important}.hero-eyebrow,.btn-mega::after,.pv-install{animation:none!important}}',
      /* ============================================================
       * MOBILE SYSTEM v7 — DEEP MOBILE UX
       * ============================================================ */
      'html,body{overflow-x:clip;max-width:100vw}',
      'img,video,iframe,svg{max-width:100%;height:auto}',
      '@media(max-width:760px){',
      /* Option C: kill utility-bar + marquee entirely on mobile — opens straight on hero */
      '  .utility-bar,.marquee{display:none!important}',
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
      '  .footer-network a{display:inline-block;padding:.2rem 0;min-height:28px;white-space:nowrap}',
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
      '  .pv-install{left:.8rem;right:.8rem;bottom:76px;padding:.75rem .9rem;font-size:.6rem;letter-spacing:1.2px}',
      '  .pv-install-btn{padding:.45rem .7rem;font-size:.6rem}',
      '}',
      '@media(max-width:440px){',
      '  .utility-bar{padding:.5rem .75rem;min-height:40px}',
      '  .utility-bar .live-status{font-size:.6rem;letter-spacing:1.5px;padding:.4rem .85rem;min-height:34px}',
      '  .marquee-track{font-size:.62rem;letter-spacing:1.4px;animation-duration:36s}',
      '  .hero h1{font-size:clamp(2.7rem,13.5vw,4.8rem)!important;line-height:.92}',
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
      '  .pv-install{bottom:72px;padding:.7rem .8rem;font-size:.56rem}',
      '}',
      '@media(max-width:360px){',
      '  .utility-bar .live-status{font-size:.55rem;letter-spacing:1.3px;padding:.35rem .7rem}',
      '  .hero h1{font-size:clamp(2.4rem,14vw,4.2rem)!important}',
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

  /* ---------- live indicator ---------- */
  function buildLive(bar){
    if(!bar || bar.querySelector('.live-status')) return;
    var wrap = document.createElement('a');
    wrap.className = 'live-status';
    wrap.href = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&utm_medium=live_pill&utm_campaign=watch';
    wrap.target = '_blank'; wrap.rel = 'noopener';
    wrap.setAttribute('data-gtm','live_pill_click');
    var dot = document.createElement('span'); dot.className = 'dot';
    var txt = document.createElement('span'); txt.className = 'txt';
    wrap.appendChild(dot); wrap.appendChild(txt);
    bar.insertBefore(wrap, bar.firstChild);
    var sep = document.createElement('span'); sep.className = 'separator'; sep.textContent = '·';
    bar.insertBefore(sep, wrap.nextSibling);
    tickLive(wrap);
    setInterval(function(){ tickLive(wrap); }, 60000);
  }
  function tickLive(el){
    var txt = el.querySelector('.txt'); if(!txt) return;
    if (isLiveICT()){ el.classList.remove('is-offline'); txt.textContent = 'LIVE NOW · WATCH'; }
    else {
      el.classList.add('is-offline');
      var t = hoursUntilLive();
      txt.textContent = (t && (t.h || t.m)) ? 'NEXT LIVE IN ' + t.h + 'H ' + t.m + 'M' : 'LIVE NIGHTLY 9 PM ICT';
    }
  }

  function toggleLiveBanner(){var el = document.querySelector('[data-live-banner]');if(el) el.hidden = !isLiveICT();}

  /* ---------- share dialog ---------- */
  function buildShare(bar){
    if(!bar || bar.querySelector('.pv-share')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'pv-share';
    btn.setAttribute('aria-haspopup','dialog');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Open share menu');
    btn.textContent = '★ SHARE';
    var sep = document.createElement('span'); sep.className = 'separator'; sep.textContent = '·';
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
    btn.addEventListener('click', function(){ btn.setAttribute('aria-expanded','true'); try { dlg.showModal(); } catch(_) { dlg.setAttribute('open',''); } });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function(){ btn.setAttribute('aria-expanded','false'); });
    dlg.querySelector('.pv-share-close').addEventListener('click', function(){ dlg.close(); });
    dlg.querySelector('.pv-share-copy').addEventListener('click', function(e){
      var b = e.currentTarget;
      try {
        navigator.clipboard.writeText(url).then(function(){
          b.classList.add('copy-state-done');
          var prev = b.textContent; b.textContent = 'Copied!';
          setTimeout(function(){ b.classList.remove('copy-state-done'); b.textContent = prev; }, 1800);
        });
      } catch(_) {}
    });
    dlg.querySelector('.pv-share-native').addEventListener('click', function(){
      if (navigator.share) navigator.share({ title:document.title, text:shareText, url:url }).catch(function(){});
    });
  }

  /* ---------- aria-current on nav ---------- */
  function markActiveNav(){
    var p = location.pathname;
    if (p !== '/' && p.length > 1 && p[p.length-1] !== '/') p = p + '/';
    ['.utility-bar a', '.footer-network a'].forEach(function(sel){
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

  /* ---------- PWA install prompt capture ---------- */
  function wireInstallPrompt(){
    var deferred = null;
    var dismissedKey = 'pv-install-dismissed';
    // Check sessionStorage — but only as best-effort; treat any error as "not dismissed"
    try { if (sessionStorage.getItem(dismissedKey)) return; } catch(_) {}
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      deferred = e;
      // Wait 8s before showing — don't interrupt early reading
      setTimeout(function(){
        if (!deferred) return;
        var banner = document.createElement('div');
        banner.className = 'pv-install';
        banner.setAttribute('role','region');
        banner.setAttribute('aria-label','Install PATTAYA VILLA STREAM app');
        banner.innerHTML =
          '<span class="pv-install-icon" aria-hidden="true">▼</span>' +
          '<span class="pv-install-text">Add Villa Stream to your home screen</span>' +
          '<button type="button" class="pv-install-btn" data-gtm="pwa_install_accept">Install</button>' +
          '<button type="button" class="pv-install-close" aria-label="Dismiss install prompt" data-gtm="pwa_install_dismiss">&times;</button>';
        document.body.appendChild(banner);
        banner.querySelector('.pv-install-btn').addEventListener('click', function(){
          deferred.prompt();
          deferred.userChoice.then(function(){ deferred = null; banner.remove(); });
        });
        banner.querySelector('.pv-install-close').addEventListener('click', function(){
          try { sessionStorage.setItem(dismissedKey, '1'); } catch(_) {}
          banner.remove();
        });
      }, 8000);
    });
  }

  /* ---------- init ---------- */
  function init(){
    injectStyles();
    buildSkipLink();
    markActiveNav();
    var bar = document.querySelector('.utility-bar');
    if (bar){ buildLive(bar); buildShare(bar); }
    toggleLiveBanner();
    setInterval(toggleLiveBanner, 60000);
    buildCounters();
    buildProgressBar();
    buildSmartSticky();
    pauseMarqueeWhenHidden();
    wireVibration();
    wireInstallPrompt();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
