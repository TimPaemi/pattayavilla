/* PATTAYA VILLA STREAM · pv-analytics.js — GA4 + engagement beacons */
(function(){
  'use strict';
  var GA = 'G-WSGWG7999E';

  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });

  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-gtm]');
    if (!t) return;
    var k = t.getAttribute('data-gtm');
    var p = t.getAttribute('data-gtm-platform') || '';
    gtag('event', k, { platform: p, event_category: 'cta' });
  }, { passive: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }

  var sd = { 25: false, 50: false, 75: false, 100: false }, t = null;
  function sdTick(){
    var doc = document.documentElement;
    var h = Math.max(doc.scrollHeight, document.body.scrollHeight) - window.innerHeight;
    if (h <= 0) return;
    var pct = Math.round((window.scrollY || window.pageYOffset) / h * 100);
    [25, 50, 75, 100].forEach(function(m){
      if (pct >= m && !sd[m]) {
        sd[m] = true;
        gtag('event', 'scroll_depth', { percent: m, event_category: 'engagement', non_interaction: true, transport_type: 'beacon' });
      }
    });
  }
  window.addEventListener('scroll', function(){ clearTimeout(t); t = setTimeout(sdTick, 80); }, { passive: true });

  var wv = false;
  function loadWV(){
    if (wv) return;
    wv = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = '/assets/js/web-vitals.iife.js';
    s.onload = function(){
      if (!window.webVitals) return;
      var send = function(m){
        gtag('event', m.name, {
          value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value),
          metric_id: m.id,
          metric_rating: m.rating,
          event_category: 'web_vitals',
          non_interaction: true,
          transport_type: 'beacon'
        });
      };
      webVitals.onLCP(send);
      webVitals.onCLS(send);
      webVitals.onINP(send);
      webVitals.onFCP(send);
      webVitals.onTTFB(send);
    };
    document.head.appendChild(s);
  }
  ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'].forEach(function(e){
    window.addEventListener(e, loadWV, { once: true, passive: true });
  });
  setTimeout(loadWV, 500);
}());
