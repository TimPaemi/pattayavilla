/* PATTAYA VILLA STREAM · pv-live-lite.js — 404 / error pages only
 * Live pill + share + sticky CTA + 404 watch bar. Zero deps. */
(function(){
  'use strict';

  function injectStyles(){
    if(document.getElementById('pv-runtime-css')) return;
    var s = document.createElement('style');
    s.id = 'pv-runtime-css';
    s.textContent = [
      '.live-status a{color:inherit;text-decoration:none}',
      '.utility-bar.is-live-air{border-bottom-color:rgba(230,0,48,.55)!important;box-shadow:0 4px 28px rgba(230,0,48,.18)}',
      '.sticky-cta{transition:transform .25s cubic-bezier(.4,0,.2,1)}',
      '.sticky-cta.is-hidden{transform:translateY(100%)}',
      '.sticky-cta a.has-thai{flex-direction:column;gap:.1rem;line-height:1.05;padding:.75rem .5rem}',
      '.sticky-cta .cta-thai{display:block;font-size:.48rem;letter-spacing:.3px;font-weight:600;text-transform:none;opacity:.82;line-height:1.2}',
      '.sticky-cta .cta-watch.is-live-now .cta-thai{color:#ffe156;opacity:1}',
      '.pv-share{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
      'dialog.pv-share-dialog{padding:0;border:none;background:transparent;color:inherit;max-width:none;max-height:none}',
      'dialog.pv-share-dialog::backdrop{background:rgba(8,8,12,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      'dialog.pv-share-dialog .pv-share-inner{position:fixed;left:50%;transform:translateX(-50%);bottom:84px;background:rgba(8,8,12,.96);backdrop-filter:blur(14px);border:2px solid #ff2f8e;border-radius:16px;padding:1.2rem;min-width:280px;max-width:90vw;color:rgba(255,255,255,.92)}',
      'dialog.pv-share-dialog h4{font-family:"Bebas Neue",sans-serif;font-size:1.5rem;color:#fff;margin:0 0 .8rem;text-transform:uppercase}',
      '.pv-share-row{display:flex;flex-wrap:wrap;gap:.5rem}',
      '.pv-share-btn{flex:1;min-width:90px;display:inline-flex;align-items:center;justify-content:center;padding:.75rem;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;text-decoration:none;font-family:"JetBrains Mono",monospace;font-size:.62rem;font-weight:800;border:1px solid rgba(255,255,255,.1);min-height:44px;cursor:pointer}',
      '.pv-share-close{position:absolute;top:.5rem;right:.6rem;background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:1.5rem}',
      '@media(prefers-reduced-motion:reduce){.sticky-cta{transition:none!important}.live-status .dot{animation:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

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

  function utilityActions(bar){
    var el = bar.querySelector('.utility-bar-actions');
    if (!el){ el = document.createElement('div'); el.className = 'utility-bar-actions'; bar.insertBefore(el, bar.firstChild); }
    return el;
  }
  function isCompactBar(){ try { return window.matchMedia('(max-width:760px)').matches; } catch (_) { return false; } }

  function buildLive(bar){
    if(!bar) return;
    var actions = utilityActions(bar);
    var placeholder = bar.querySelector('.live-status.is-placeholder');
    if (placeholder) {
      var wrap = document.createElement('a');
      wrap.className = 'live-status';
      wrap.href = LIVE_WATCH_URL; wrap.target = '_blank'; wrap.rel = 'noopener';
      wrap.setAttribute('data-gtm','live_pill_click');
      wrap.setAttribute('aria-hidden','false');
      var dot = document.createElement('span'); dot.className = 'dot';
      var txt = document.createElement('span'); txt.className = 'txt';
      wrap.appendChild(dot); wrap.appendChild(txt);
      placeholder.replaceWith(wrap);
      tickLive(wrap);
      setInterval(function(){ tickLive(wrap); }, 60000);
      return;
    }
    if(bar.querySelector('.live-status')) return;
    var wrap = document.createElement('a');
    wrap.className = 'live-status';
    wrap.href = LIVE_WATCH_URL; wrap.target = '_blank'; wrap.rel = 'noopener';
    wrap.setAttribute('data-gtm','live_pill_click');
    var dot = document.createElement('span'); dot.className = 'dot';
    var txt = document.createElement('span'); txt.className = 'txt';
    wrap.appendChild(dot); wrap.appendChild(txt);
    actions.appendChild(wrap);
    tickLive(wrap);
    setInterval(function(){ tickLive(wrap); }, 60000);
  }

  function tickLive(el){
    var txt = el.querySelector('.txt'); if(!txt) return;
    var compact = isCompactBar();
    var live = isLiveICT();
    var bar = el.closest('.utility-bar');
    if (bar) bar.classList.toggle('is-live-air', live);
    if (live){ el.classList.remove('is-offline'); txt.textContent = compact ? 'LIVE' : 'LIVE NOW · WATCH'; }
    else {
      el.classList.add('is-offline');
      var t = hoursUntilLive();
      if (t && (t.h || t.m)) txt.textContent = compact ? (t.h + 'H ' + t.m + 'M') : ('NEXT LIVE IN ' + t.h + 'H ' + t.m + 'M');
      else txt.textContent = compact ? '9 PM ICT' : 'LIVE NIGHTLY 9 PM ICT';
    }
  }

  function wireShareCopy(btn, text){
    btn.addEventListener('click', function(){
      try {
        navigator.clipboard.writeText(text).then(function(){
          btn.textContent = 'Copied!';
          setTimeout(function(){ btn.textContent = 'Copy link'; }, 1800);
        });
      } catch (_) {}
    });
  }

  function buildShare(bar){
    if(!bar || bar.querySelector('.pv-share:not(.is-placeholder)')) return;
    var actions = utilityActions(bar);
    var placeholder = bar.querySelector('.pv-share.is-placeholder');
    var btn = placeholder || document.createElement('button');
    btn.type = 'button'; btn.className = 'pv-share';
    btn.setAttribute('aria-label','Open share menu');
    btn.textContent = 'SHARE';
    btn.removeAttribute('aria-hidden'); btn.removeAttribute('tabindex');
    if (!placeholder) actions.appendChild(btn);
    var dlg = document.createElement('dialog');
    dlg.className = 'pv-share-dialog';
    var url = location.origin + location.pathname;
    var shareText = 'PATTAYA VILLA STREAM — live every night 9 PM ICT';
    var enc = encodeURIComponent;
    dlg.innerHTML = '<div class="pv-share-inner"><button type="button" class="pv-share-close" aria-label="Close">&times;</button><h4>Share <span class="accent">the show.</span></h4><div class="pv-share-row"><a class="pv-share-btn" href="https://twitter.com/intent/tweet?text=' + enc(shareText + ' ' + url) + '" target="_blank" rel="noopener">X</a><a class="pv-share-btn" href="https://api.whatsapp.com/send/?text=' + enc(shareText + ' ' + url) + '" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="pv-share-btn pv-share-copy">Copy link</button></div></div>';
    document.body.appendChild(dlg);
    btn.addEventListener('click', function(){ try { dlg.showModal(); } catch(_) { dlg.setAttribute('open',''); } });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    dlg.querySelector('.pv-share-close').addEventListener('click', function(){ dlg.close(); });
    wireShareCopy(dlg.querySelector('.pv-share-copy'), url);
  }

  function build404WatchBar(){
    var block = document.getElementById('404-watch-bar');
    if (!block) return;
    var sub = block.querySelector('[data-404-countdown-sub]');
    var btn = block.querySelector('[data-gtm="404_watch_live"]');
    if (btn && !btn.dataset.offLabel){
      var lbl = btn.querySelector('.cta-label');
      btn.dataset.offLabel = lbl ? lbl.textContent.trim() : btn.textContent.trim();
    }
    function tick(){
      var live = isLiveICT();
      block.classList.toggle('is-live-now', live);
      if (sub){
        if (live) sub.textContent = '● LIVE NOW — the villa show is on air. Jump in.';
        else {
          var t = hoursUntilLive();
          sub.textContent = (t && (t.h || t.m)) ? ('Next show in ' + t.h + 'h ' + t.m + 'm · 9 PM ICT nightly.') : 'Tonight 9 PM ICT. Subscribe with the bell on.';
        }
      }
      if (btn){
        var labelEl = btn.querySelector('.cta-label');
        btn.classList.toggle('is-live-now', live);
        if (labelEl) labelEl.textContent = live ? '● LIVE NOW ON YOUTUBE' : btn.dataset.offLabel;
        else btn.textContent = live ? '● LIVE NOW ON YOUTUBE' : btn.dataset.offLabel;
      }
    }
    tick();
    setInterval(tick, 60000);
  }

  function buildStickyLive(){
    var watch = document.querySelector('.sticky-cta .cta-watch');
    if (!watch) return;
    var labelEl = watch.querySelector('.cta-label');
    var thaiEl = watch.querySelector('.cta-thai');
    if (!watch.dataset.offLabel){
      watch.dataset.offLabel = labelEl ? labelEl.textContent.trim() : watch.textContent.trim();
    }
    function tick(){
      if (isLiveICT()){
        watch.classList.add('is-live-now');
        if (labelEl) labelEl.textContent = '● LIVE NOW';
        if (thaiEl) thaiEl.textContent = 'กำลัง LIVE';
      } else {
        watch.classList.remove('is-live-now');
        if (labelEl) labelEl.textContent = watch.dataset.offLabel;
        if (thaiEl) thaiEl.textContent = 'ดูสด 21:00 น.';
      }
    }
    tick();
    setInterval(tick, 60000);
  }

  function buildSmartSticky(){
    var cta = document.querySelector('.sticky-cta'); if (!cta) return;
    var lastY = window.scrollY; var ticking = false;
    function update(){
      var y = window.scrollY; var dy = y - lastY;
      if (Math.abs(dy) > 8){
        if (dy > 0 && y > 200) cta.classList.add('is-hidden');
        else cta.classList.remove('is-hidden');
        lastY = y;
      }
      ticking = false;
    }
    window.addEventListener('scroll', function(){ if (!ticking){ requestAnimationFrame(update); ticking = true; } }, {passive:true});
  }

  function markActiveNav(){
    var p = location.pathname;
    if (p !== '/' && p.length > 1 && p[p.length-1] !== '/') p = p + '/';
    document.querySelectorAll('.utility-scroll a').forEach(function(a){
      try { var u = new URL(a.href, location.origin); if (u.origin === location.origin && u.pathname === p) a.setAttribute('aria-current','page'); } catch(_) {}
    });
  }

  function init(){
    injectStyles();
    markActiveNav();
    var bar = document.querySelector('.utility-bar');
    if (bar){ buildLive(bar); buildShare(bar); }
    build404WatchBar();
    buildStickyLive();
    buildSmartSticky();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
