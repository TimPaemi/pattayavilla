/* PATTAYA VILLA · pv-live.js — v2
 * Injects: live-now indicator, share tray, ::selection polish, scrollbar styling.
 * Live window: 21:00–03:00 Asia/Bangkok (ICT, UTC+7). Pure JS, zero deps. */
(function(){
  'use strict';

  /* ---------- runtime style injection (selection + scrollbar + live keyframes) ---------- */
  function injectStyles(){
    if(document.getElementById('pv-runtime-css')) return;
    var s = document.createElement('style');
    s.id = 'pv-runtime-css';
    s.textContent = [
      '::selection{background:#ff2f8e;color:#fff}',
      '::-moz-selection{background:#ff2f8e;color:#fff}',
      'html{scrollbar-color:#ff2f8e #08080c;scrollbar-width:thin}',
      '::-webkit-scrollbar{width:10px;height:10px}',
      '::-webkit-scrollbar-track{background:#08080c}',
      '::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2f8e,#c4002a);border-radius:9999px;border:2px solid #08080c}',
      '::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#ff4d9f,#ff1f4d)}',
      '@keyframes pvlive{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(230,0,48,.55)}70%{opacity:.5;box-shadow:0 0 0 8px rgba(230,0,48,0)}}',
      '@media(prefers-reduced-motion:reduce){.live-status .dot{animation:none!important}}',
      /* share menu */
      '.pv-share{position:relative;display:inline-flex;align-items:center;gap:.4rem;color:#00e5ff;font-weight:800;letter-spacing:1.6px;cursor:pointer;background:none;border:none;font-family:inherit;font-size:inherit;text-transform:inherit;padding:0;line-height:inherit}',
      '.pv-share:hover{color:#fff}',
      '.pv-share-menu{display:none;position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:300;background:rgba(8,8,12,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:2px solid #ff2f8e;border-radius:16px;padding:1rem;box-shadow:0 12px 50px rgba(255,47,142,.3);min-width:260px;max-width:90vw}',
      '.pv-share-menu.open{display:block}',
      '.pv-share-menu h4{font-family:"Bebas Neue",sans-serif;font-size:1.4rem;color:#fff;margin:0 0 .8rem;letter-spacing:.01em}',
      '.pv-share-row{display:flex;flex-wrap:wrap;gap:.5rem}',
      '.pv-share-btn{flex:1;min-width:90px;display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.7rem .8rem;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;text-decoration:none;font-family:"JetBrains Mono",monospace;font-size:.62rem;letter-spacing:1.4px;text-transform:uppercase;font-weight:800;border:1px solid rgba(255,255,255,.1);transition:all .15s;cursor:pointer}',
      '.pv-share-btn:hover{background:rgba(255,47,142,.18);border-color:#ff2f8e;color:#fff;transform:translateY(-1px)}',
      '.pv-share-btn.copy-state-done{background:rgba(106,255,159,.18);border-color:#6aff9f;color:#6aff9f}',
      '.pv-share-close{position:absolute;top:.5rem;right:.6rem;background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:1.4rem;line-height:1;padding:.2rem .5rem}',
      '.pv-share-close:hover{color:#fff}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- ICT (UTC+7) date helper ---------- */
  function ictNow(){
    var d = new Date();
    var utcMs = d.getTime() + d.getTimezoneOffset()*60000;
    return new Date(utcMs + 7*3600000);
  }

  /* ---------- live indicator ---------- */
  function buildLive(bar){
    var a = document.createElement('a');
    a.href = 'https://www.youtube.com/@timpaemi/live?utm_source=pattayavilla&utm_medium=live-indicator&utm_campaign=watch_live';
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'live-status';
    a.setAttribute('data-gtm','live_indicator');
    a.style.cssText = 'display:inline-flex;align-items:center;gap:.5rem;color:#ffe156;font-weight:800;letter-spacing:1.6px';
    a.innerHTML = '<span class="dot" style="width:9px;height:9px;border-radius:50%;background:#ffe156;flex-shrink:0;display:inline-block"></span><span class="lbl">CHECKING…</span>';
    bar.insertBefore(document.createElement('span'), bar.firstChild).className = 'separator';
    bar.firstChild.textContent = '·';
    bar.insertBefore(a, bar.firstChild);
    return a;
  }
  function tickLive(el){
    if(!el) return;
    var ict = ictNow();
    var h = ict.getUTCHours(), m = ict.getUTCMinutes();
    var dot = el.querySelector('.dot');
    var lbl = el.querySelector('.lbl');
    var isLive = (h >= 21) || (h < 3);
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

  /* ---------- share tray ---------- */
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
    btn.textContent = '★ SHARE';
    bar.insertBefore(document.createElement('span'), bar.firstChild).className = 'separator';
    bar.firstChild.textContent = '·';
    bar.insertBefore(btn, bar.firstChild);

    var menu = document.createElement('div');
    menu.className = 'pv-share-menu';
    menu.setAttribute('role','dialog');
    menu.setAttribute('aria-label','Share this page');
    var url = location.origin + location.pathname;
    var shareText = '🔴 PATTAYA VILLA — live every night 9 PM ICT';
    var enc = encodeURIComponent;
    menu.innerHTML =
      '<button type="button" class="pv-share-close" aria-label="Close share menu">×</button>' +
      '<h4>Spread the show</h4>' +
      '<div class="pv-share-row">' +
        '<a class="pv-share-btn" data-pf="x" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text='+enc(shareText)+'&url='+enc(url)+'">X</a>' +
        '<a class="pv-share-btn" data-pf="whatsapp" target="_blank" rel="noopener" href="https://api.whatsapp.com/send/?text='+enc(shareText+' → '+url)+'">WhatsApp</a>' +
        '<a class="pv-share-btn" data-pf="telegram" target="_blank" rel="noopener" href="https://t.me/share/url?url='+enc(url)+'&text='+enc(shareText)+'">Telegram</a>' +
        '<a class="pv-share-btn" data-pf="facebook" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u='+enc(url)+'">Facebook</a>' +
        '<button type="button" class="pv-share-btn" data-pf="copy" data-url="'+url+'">★ COPY LINK</button>' +
        (navigator.share ? '<button type="button" class="pv-share-btn" data-pf="native">📱 NATIVE</button>' : '') +
      '</div>';
    document.body.appendChild(menu);

    function open(){ menu.classList.add('open'); btn.setAttribute('aria-expanded','true'); ga('share_open','menu'); }
    function close(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    btn.addEventListener('click', function(e){ e.stopPropagation(); menu.classList.contains('open') ? close() : open(); });
    menu.querySelector('.pv-share-close').addEventListener('click', close);
    document.addEventListener('click', function(e){
      if(menu.classList.contains('open') && !menu.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });

    menu.addEventListener('click', function(e){
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
          navigator.share({title:'PATTAYA VILLA', text:shareText, url:url}).catch(function(){});
          ga('share_click','native');
        }
      }else{
        ga('share_click', pf);
        close();
      }
    });
  }

  /* ---------- init ---------- */
  function init(){
    injectStyles();
    var bar = document.querySelector('.utility-bar');
    if(!bar) return;
    buildShare(bar);
    var liveEl = buildLive(bar);
    if(liveEl){ tickLive(liveEl); setInterval(function(){ tickLive(liveEl); }, 60000); }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
})();
