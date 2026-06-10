/* PATTAYA VILLA STREAM · pv-live.js — v42 (2026-05-27 FAQ a11y + deduped chevrons)
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

  function tickLiveBannerSlot(){
    var banner = document.querySelector('[data-live-banner]');
    var countdown = document.querySelector('[data-live-countdown]');
    if (!banner && !countdown) return;
    var live = isLiveICT();
    if (banner) banner.hidden = !live;
    if (countdown){
      countdown.hidden = live;
      var val = countdown.querySelector('[data-live-countdown-val]');
      if (val && !live){
        var t = hoursUntilLive();
        var compact = isCompactBar();
        if (compact){
          if (t && (t.h || t.m)) val.textContent = t.h + 'h ' + t.m + 'm';
          else val.textContent = '9 PM ICT';
        } else if (t && (t.h || t.m)) val.textContent = t.h + 'h ' + t.m + 'm until 9 PM ICT';
        else val.textContent = '9 PM ICT tonight';
      }
    }
  }

  /* ---------- mobile: hide in-page live banner after scroll (utility pill stays) ---------- */
  function buildLiveBannerScrollCollapse(){
    var slot = document.querySelector('.live-banner-slot');
    if (!slot) return;
    var collapsed = false;
    var threshold = 80;
    function onScroll(){
      if (!isCompactBar() || !isLiveICT()){
        if (collapsed){ slot.classList.remove('is-banner-scrolled'); collapsed = false; }
        return;
      }
      var should = window.scrollY > threshold;
      if (should !== collapsed){
        collapsed = should;
        slot.classList.toggle('is-banner-scrolled', should);
      }
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    try { window.matchMedia('(max-width:760px)').addEventListener('change', onScroll); } catch (_) {}
    onScroll();
  }

  function isLitePage(){
    var p = location.pathname;
    if (p !== '/' && p.length > 1 && p.charAt(p.length - 1) !== '/') p += '/';
    return p === '/404/';
  }

  /* ---------- 404 watch bar — live pulse + countdown ---------- */
  function build404WatchBar(){
    var block = document.getElementById('404-watch-bar');
    if (!block) return;
    var sub = block.querySelector('[data-404-countdown-sub]');
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
    }
    tick();
    setInterval(tick, 60000);
  }

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

  /* ---------- utility bar countdown chip (homepage off-air) ---------- */
  function buildUtilityCountdown(){
    var chip = document.querySelector('[data-utility-countdown]');
    if (!chip) return;
    var val = chip.querySelector('[data-utility-countdown-val]');
    function tick(){
      var live = isLiveICT();
      chip.classList.toggle('is-live', live);
      chip.hidden = live;
      if (!val) return;
      if (live) val.textContent = '● LIVE';
      else {
        var t = hoursUntilLive();
        if (t && (t.h || t.m)) val.textContent = t.h + 'h ' + t.m + 'm';
        else val.textContent = '9 PM ICT';
      }
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ---------- all watch CTAs + homepage eyebrow live pulse ---------- */
  function watchLabelEl(btn){
    return btn.querySelector('.hero-cta-label, .watch-cta-label, .cta-label');
  }
  function watchThaiEl(btn){
    return btn.querySelector('.btn-thai, .cta-thai');
  }
  function buildWatchLivePulse(){
    var eyebrow = document.querySelector('.hero .hero-eyebrow');
    if (eyebrow && !eyebrow.dataset.offText) eyebrow.dataset.offText = eyebrow.textContent.trim();
    var watches = document.querySelectorAll('[data-gtm*="watch_live"], [data-gtm="first_night_watch"], [data-gtm="support_end_watch"]');
    watches.forEach(function(btn){
      var labelEl = watchLabelEl(btn);
      var thaiEl = watchThaiEl(btn);
      if (!btn.dataset.offLabel){
        btn.dataset.offLabel = labelEl ? labelEl.textContent.trim() : btn.textContent.trim();
      }
      if (thaiEl && !btn.dataset.offThai) btn.dataset.offThai = thaiEl.textContent.trim();
    });
    function tick(){
      var live = isLiveICT();
      document.documentElement.classList.toggle('is-live-air', live);
      document.body.classList.toggle('is-live-air', live);
      if (eyebrow){
        if (live){
          eyebrow.classList.add('is-live-now');
          eyebrow.textContent = '● LIVE NOW · VILLA SHOW ON AIR';
        } else {
          eyebrow.classList.remove('is-live-now');
          eyebrow.textContent = eyebrow.dataset.offText;
        }
      }
      watches.forEach(function(btn){
        var labelEl = watchLabelEl(btn);
        var thaiEl = watchThaiEl(btn);
        var mega = btn.classList.contains('btn-mega');
        if (live){
          btn.classList.add('is-live-now');
          if (labelEl) labelEl.textContent = mega ? '● LIVE NOW ON YOUTUBE' : '● LIVE NOW';
          if (thaiEl) thaiEl.textContent = 'กำลัง LIVE';
        } else {
          btn.classList.remove('is-live-now');
          if (labelEl) labelEl.textContent = btn.dataset.offLabel;
          if (thaiEl) thaiEl.textContent = btn.dataset.offThai || 'ดูสด 21:00 น.';
        }
      });
      document.querySelectorAll('.sticky-cta .cta-watch').forEach(function(btn){
        var labelEl = btn.querySelector('.cta-label');
        if (!btn.dataset.offLabel){
          btn.dataset.offLabel = labelEl ? labelEl.textContent.trim() : btn.textContent.trim();
        }
        if (live){
          btn.classList.add('is-live-now');
          if (labelEl) labelEl.textContent = '● LIVE NOW';
          var thaiEl = btn.querySelector('.cta-thai');
          if (thaiEl) thaiEl.textContent = 'กำลัง LIVE';
        } else {
          btn.classList.remove('is-live-now');
          if (labelEl) labelEl.textContent = btn.dataset.offLabel;
          var thaiEl = btn.querySelector('.cta-thai');
          if (thaiEl) thaiEl.textContent = btn.dataset.offThai || 'ดูสด 21:00 น.';
        }
      });
      syncShareTonightLabels(live);
      syncStickyShareCTA(live);
      syncSupportLiveUX(live);
    }
    tick();
    markLiveDuplicateWatches();
    syncShareTonightLabels(isLiveICT());
    syncStickyShareCTA(isLiveICT());
    syncSupportLiveUX(isLiveICT());
    setInterval(tick, 60000);
  }

  /* ---------- share tonight (native share or copy live link) ---------- */
  function shareTonightLabel(btn, live){
    if (!btn.dataset.offShareLabel){
      var cta = btn.querySelector('.support-card-cta');
      btn.dataset.offShareLabel = cta ? cta.textContent.trim() : btn.textContent.trim();
    }
    if (live){
      return btn.querySelector('.support-card-cta') ? 'SHARE LIVE LINK →' : '↗ SHARE LIVE LINK';
    }
    return btn.dataset.offShareLabel;
  }

  function syncShareTonightLabels(live){
    document.querySelectorAll('[data-share-tonight]').forEach(function(btn){
      if (btn.classList.contains('copied')) return;
      var text = shareTonightLabel(btn, live);
      var cta = btn.querySelector('.support-card-cta');
      if (cta) cta.textContent = text;
      else btn.textContent = text;
    });
  }

  function markLiveDuplicateWatches(){
    document.querySelectorAll('[data-gtm="about_watch_live"], [data-gtm="first_night_watch"], [data-gtm="when_watch_live"], [data-gtm="community_watch_live"], [data-gtm="format_watch_live"], [data-gtm="support_end_watch"], [data-gtm="faq_watch_live"], [data-gtm="code_watch_live"], [data-gtm="404_watch_live"]').forEach(function(btn){
      btn.setAttribute('data-hide-when-live', '');
    });
    document.querySelectorAll('[data-gtm-platform="youtube_watch"], [data-gtm-platform="watch_live"]').forEach(function(btn){
      btn.setAttribute('data-hide-when-live', '');
    });
  }

  function syncSupportLiveUX(live){
    var freeHint = document.querySelector('[data-support-path-hint="free"]');
    if (freeHint){
      if (!freeHint.dataset.offHint) freeHint.dataset.offHint = freeHint.textContent.trim();
      freeHint.textContent = live ? 'Subscribe · share live link' : freeHint.dataset.offHint;
    }
    var paidHint = document.querySelector('[data-support-path-hint="paid"]');
    if (paidHint){
      if (!paidHint.dataset.offHint) paidHint.dataset.offHint = paidHint.textContent.trim();
      paidHint.textContent = live ? 'Super Chat live · Thanks on VOD' : paidHint.dataset.offHint;
    }
    document.querySelectorAll('[data-gtm-platform="youtube_watch"] .support-card-cta').forEach(function(cta){
      var card = cta.closest('.support-card');
      if (!card) return;
      if (!card.dataset.offWatchCta) card.dataset.offWatchCta = cta.textContent.trim();
      cta.textContent = live ? '● LIVE NOW →' : card.dataset.offWatchCta;
      card.classList.toggle('is-live-now', live);
    });
    document.querySelectorAll('[data-support-superchat]').forEach(function(card){
      card.classList.toggle('is-live-priority', live);
      var cta = card.querySelector('.support-card-cta');
      if (!cta) return;
      if (!card.dataset.offScCta) card.dataset.offScCta = cta.textContent.trim();
      cta.textContent = live ? '● SUPER CHAT LIVE →' : card.dataset.offScCta;
    });
  }

  function syncStickyShareCTA(live){
    document.querySelectorAll('.sticky-cta .cta-support, .sticky-cta .cta-tip').forEach(function(el){
      if (!el.dataset.stickyOrigHref){
        el.dataset.stickyOrigHref = el.getAttribute('href') || '';
        el.dataset.stickyOrigGtm = el.getAttribute('data-gtm') || '';
        var labelEl = el.querySelector('.cta-label');
        el.dataset.stickyOrigLabel = labelEl ? labelEl.textContent.trim() : el.textContent.trim();
        var thaiEl = el.querySelector('.cta-thai');
        if (thaiEl) el.dataset.stickyOrigThai = thaiEl.textContent.trim();
      }
      if (!el.dataset.stickyShareWired){
        el.dataset.stickyShareWired = '1';
        el.addEventListener('click', function(e){
          if (!isLiveICT()) return;
          e.preventDefault();
          shareTonight(el);
        });
      }
      var label = el.querySelector('.cta-label');
      var thai = el.querySelector('.cta-thai');
      if (live){
        el.setAttribute('href', '#');
        el.classList.add('cta-share-live');
        el.setAttribute('data-gtm', 'sticky_share_live');
        if (label) label.textContent = '↗ SHARE LIVE';
        if (thai) thai.textContent = 'แชร์ LIVE';
      } else {
        el.setAttribute('href', el.dataset.stickyOrigHref);
        el.classList.remove('cta-share-live');
        el.setAttribute('data-gtm', el.dataset.stickyOrigGtm);
        if (label) label.textContent = el.dataset.stickyOrigLabel;
        if (thai && el.dataset.stickyOrigThai) thai.textContent = el.dataset.stickyOrigThai;
      }
    });
  }

  var SHARE_TONIGHT_TEXT = 'PATTAYA VILLA STREAM — live every night 9 PM ICT';
  function shareTonight(btn){
    var live = isLiveICT();
    var url = live ? LIVE_WATCH_URL : (location.origin + '/');
    var clip = live ? (SHARE_TONIGHT_TEXT + ' → ' + LIVE_WATCH_URL) : (SHARE_TONIGHT_TEXT + ' ' + location.origin + '/');
    function showCopied(){
      btn.classList.add('copied');
      var cta = btn.querySelector('.support-card-cta');
      var prev = shareTonightLabel(btn, live);
      if (cta) cta.textContent = '✓ LINK COPIED';
      else btn.textContent = '✓ LINK COPIED';
      setTimeout(function(){
        btn.classList.remove('copied');
        if (cta) cta.textContent = prev;
        else btn.textContent = prev;
      }, 2000);
    }
    if (navigator.share){
      navigator.share({
        title: live ? 'PATTAYA VILLA STREAM — LIVE NOW' : document.title,
        text: SHARE_TONIGHT_TEXT,
        url: url
      }).catch(function(){});
      return;
    }
    try {
      navigator.clipboard.writeText(clip).then(showCopied);
    } catch (_) {}
  }
  function buildShareTonightButtons(){
    document.querySelectorAll('[data-share-tonight]').forEach(function(btn){
      if (btn.dataset.shareWired) return;
      btn.dataset.shareWired = '1';
      btn.addEventListener('click', function(){ shareTonight(btn); });
    });
  }

  /* ---------- Thai micro-copy on CTAs not yet SSR'd ---------- */
  function buildThaiCtaHints(){
    var heroWatch = document.querySelector('[data-gtm="hero_watch_live"]');
    if (heroWatch && !heroWatch.querySelector('.btn-thai')){
      heroWatch.classList.add('has-thai');
      var heroText = heroWatch.textContent.trim();
      heroWatch.textContent = '';
      var heroMain = document.createElement('span');
      heroMain.className = 'hero-cta-label';
      heroMain.textContent = heroText;
      var heroThai = document.createElement('span');
      heroThai.className = 'btn-thai';
      heroThai.setAttribute('aria-hidden', 'true');
      heroThai.textContent = 'ดูสดคืนนี้ · 21:00 น. ไทย';
      heroWatch.appendChild(heroMain);
      heroWatch.appendChild(heroThai);
    }
    var thaiByClass = { 'cta-watch': 'ดูสด 21:00 น.', 'cta-support': 'สนับสนุน', 'cta-tip': 'ทิปคืนนี้' };
    document.querySelectorAll('.sticky-cta a').forEach(function(a){
      if (a.querySelector('.cta-label') || a.querySelector('.watch-cta-label')) return;
      var key = a.classList.contains('cta-watch') ? 'cta-watch' : (a.classList.contains('cta-tip') ? 'cta-tip' : 'cta-support');
      var label = a.textContent.trim();
      a.textContent = '';
      a.classList.add('has-thai');
      var main = document.createElement('span');
      main.className = 'cta-label';
      main.textContent = label;
      var thai = document.createElement('span');
      thai.className = 'cta-thai';
      thai.setAttribute('aria-hidden', 'true');
      thai.textContent = thaiByClass[key] || '';
      a.appendChild(main);
      if (thai.textContent) a.appendChild(thai);
      if (key === 'cta-watch') a.dataset.offLabel = label;
    });
  }

  function mergeSubpageBackBar(){
    var back = document.querySelector('.page-breadcrumb a[href="/"], .back-bar a[href="/"]');
    var bar = document.querySelector('.utility-bar');
    if (!back || !bar || isLitePage()) return;
    var actions = utilityActions(bar);
    if (actions.querySelector('.utility-home-link')) {
      document.documentElement.classList.add('has-utility-home');
      return;
    }
    var link = document.createElement('a');
    link.href = '/';
    link.className = 'utility-home-link';
    link.textContent = '\u2190 HOME';
    link.setAttribute('data-gtm', 'utility_home');
    actions.insertBefore(link, actions.firstChild);
    document.documentElement.classList.add('has-utility-home');
  }

  /* ---------- dynamic scroll offset for sticky utility bar ---------- */
  function buildScrollOffset(){
    function update(){
      var bar = document.querySelector('.utility-bar');
      var h = bar ? Math.ceil(bar.getBoundingClientRect().height) : 72;
      document.documentElement.style.setProperty('--pv-scroll-offset', (h + 16) + 'px');
      document.documentElement.style.setProperty('--pv-sticky-top', h + 'px');
    }
    update();
    window.addEventListener('resize', update, {passive: true});
    try { window.matchMedia('(max-width:760px)').addEventListener('change', update); } catch (_) {}
    if ('ResizeObserver' in window){
      var bar = document.querySelector('.utility-bar');
      if (bar) new ResizeObserver(update).observe(bar);
    }
  }

  function getScrollOffset(){
    var v = getComputedStyle(document.documentElement).getPropertyValue('--pv-scroll-offset').trim();
    return v ? (parseInt(v, 10) || 88) : 88;
  }

  function scrollToElement(el){
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  }

  function openFirstFaqInCategory(catEl){
    if (!catEl || !catEl.classList.contains('faq-category')) return null;
    var sib = catEl.nextElementSibling;
    while (sib){
      if (sib.tagName === 'H2') break;
      if (sib.tagName === 'DETAILS' && sib.classList.contains('faq-q')){
        sib.open = true;
        return sib;
      }
      sib = sib.nextElementSibling;
    }
    return null;
  }

  function resolveHashTarget(el){
    if (!el) return null;
    if (el.tagName === 'DETAILS'){
      if (!el.open) el.open = true;
      return el;
    }
    if (el.classList.contains('faq-category')) return openFirstFaqInCategory(el) || el;
    return el;
  }

  function expandCollapseSection(section){
    if (!section || section.classList.contains('is-expanded')) return;
    section.classList.add('is-expanded');
    var btn = section.querySelector('.home-collapsible-toggle');
    if (btn){
      btn.setAttribute('aria-expanded', 'true');
      btn.textContent = 'Show less ↑';
    }
  }

  function expandCollapsesForTarget(el){
    if (!el) return;
    var more = el.closest('.home-collapsible-more');
    if (more) expandCollapseSection(more.closest('[data-home-collapse], [data-subpage-collapse]'));
    if (el.id){
      document.querySelectorAll('[data-home-collapse][aria-labelledby="' + el.id + '"], [data-subpage-collapse][aria-labelledby="' + el.id + '"]').forEach(expandCollapseSection);
      el.querySelectorAll('[data-home-collapse]:not(.is-expanded), [data-subpage-collapse]:not(.is-expanded)').forEach(expandCollapseSection);
    }
  }

  function flashLandingTarget(el){
    if (!el) return;
    el.classList.add('is-landing-target');
    window.setTimeout(function(){ el.classList.remove('is-landing-target'); }, 2800);
  }

  function buildInPageAnchorScroll(){
    var sel = '.toc a[href^="#"], .faq-jumps a[href^="#"], .faq-cat-jump a[href^="#"], .support-path-pick a[href^="#"], .hero-explore-jump a[href^="#"], .tier-jump a[href^="#"]';
    document.querySelectorAll(sel).forEach(function(a){
      a.addEventListener('click', function(e){
        var id = (a.getAttribute('href') || '').slice(1);
        var raw = id && document.getElementById(id);
        if (!raw) return;
        e.preventDefault();
        var target = resolveHashTarget(raw);
        expandCollapsesForTarget(raw);
        expandCollapsesForTarget(target);
        scrollToElement(target || raw);
        flashLandingTarget(target || raw);
        if (history.replaceState) history.replaceState(null, '', '#' + id);
        else location.hash = id;
      });
    });
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

  /* ---------- long-form subpages (progress bar, scroll-top, TOC spy) ---------- */
  function isLongformPage(){
    var p = location.pathname;
    if (p !== '/' && p.length > 1 && p.charAt(p.length - 1) !== '/') p += '/';
    return ['/about/', '/format/', '/code/', '/faq/', '/support/', '/community/'].indexOf(p) >= 0;
  }

  /* ---------- reading progress bar (long-form subpages) ---------- */
  function buildProgressBar(){
    if (!isLongformPage()) return;
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

  /* ---------- scroll to top — appears after deep scroll on long pages ---------- */
  function buildScrollTop(){
    if (!document.querySelector('.sticky-cta')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pv-scroll-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑ TOP';
    btn.hidden = true;
    document.body.appendChild(btn);
    btn.addEventListener('click', function(){
      var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    var showAt = 480;
    var ticking = false;
    function update(){
      btn.hidden = window.scrollY < showAt;
      ticking = false;
    }
    window.addEventListener('scroll', function(){ if (!ticking){ requestAnimationFrame(update); ticking = true; } }, {passive:true});
    update();
  }

  /* ---------- TOC scroll-spy — highlight active section in jump nav ---------- */
  function buildTocSpy(){
    if (!('IntersectionObserver' in window)) return;
    document.querySelectorAll('.toc, .faq-jumps').forEach(function(toc){
      var links = toc.querySelectorAll('a[href^="#"]');
      if (!links.length) return;
      var map = {};
      var sections = [];
      links.forEach(function(a){
        var id = (a.getAttribute('href') || '').slice(1);
        var el = id && document.getElementById(id);
        if (el){ map[id] = a; sections.push(el); }
      });
      if (!sections.length) return;
      function setActive(id){
        if (!map[id]) return;
        links.forEach(function(a){ a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        map[id].classList.add('is-active');
        map[id].setAttribute('aria-current', 'true');
      }
      var io = new IntersectionObserver(function(entries){
        var visible = entries.filter(function(e){ return e.isIntersecting; });
        if (!visible.length) return;
        visible.sort(function(a, b){ return a.boundingClientRect.top - b.boundingClientRect.top; });
        setActive(visible[0].target.id);
      }, { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.1, 0.25] });
      sections.forEach(function(s){ io.observe(s); });
    });
  }

  /* ---------- hash landing flash — howto + TOC deep links ---------- */
  function buildHashLanding(){
    var hash = location.hash;
    if (!hash || hash.length < 2) return;
    var raw = document.querySelector(hash);
    if (!raw) return;
    var target = resolveHashTarget(raw);
    expandCollapsesForTarget(raw);
    expandCollapsesForTarget(target);
    flashLandingTarget(target || raw);
    requestAnimationFrame(function(){
      scrollToElement(target || raw);
    });
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


  /* ---------- FAQ expand / collapse all ---------- */
  function buildFaqExpandControls(){
    var nav = document.querySelector('.faq-jumps');
    if (!nav) return;
    nav.querySelectorAll('[data-faq-expand]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var open = btn.getAttribute('data-faq-expand') === 'all';
        document.querySelectorAll('details.faq-q').forEach(function(d){
          /* name="faq" makes the accordion exclusive — drop it while all are
             open or the browser closes every item except the last one. */
          if (open) d.removeAttribute('name');
          d.open = open;
          if (!open) d.setAttribute('name', 'faq');
          var s = d.querySelector('summary');
          if (s) s.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
    });
  }

  /* ---------- FAQ accordion aria-expanded ---------- */
  function bindFaqA11y(){
    document.querySelectorAll('details.faq-q').forEach(function(d){
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

  function buildSupportNavStack(){
    var pick = document.querySelector('.support-path-pick');
    if (!pick) return;
    function update(){
      document.documentElement.style.setProperty('--pv-path-pick-h', Math.ceil(pick.getBoundingClientRect().height) + 'px');
    }
    update();
    window.addEventListener('resize', update, {passive: true});
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(pick);
  }

  function buildMobileSectionCollapses(){
    var sections = document.querySelectorAll('[data-home-collapse], [data-subpage-collapse]');
    if (!sections.length) return;
    function labelFor(section, open){
      var base = section.getAttribute('data-collapse-label') || 'Read more';
      return open ? 'Show less ↑' : (base + ' ↓');
    }
    function syncWide(isWide){
      sections.forEach(function(section){
        var btn = section.querySelector('.home-collapsible-toggle');
        if (!btn) return;
        if (isWide){
          section.classList.add('is-expanded');
          btn.setAttribute('aria-expanded', 'true');
          btn.hidden = true;
        } else {
          btn.hidden = false;
          btn.textContent = labelFor(section, section.classList.contains('is-expanded'));
        }
      });
    }
    var mq = window.matchMedia('(max-width:760px)');
    syncWide(!mq.matches);
    try { mq.addEventListener('change', function(e){ syncWide(!e.matches); }); } catch (_) {}
    sections.forEach(function(section){
      var btn = section.querySelector('.home-collapsible-toggle');
      if (!btn) return;
      btn.addEventListener('click', function(){
        var open = !section.classList.contains('is-expanded');
        section.classList.toggle('is-expanded', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.textContent = labelFor(section, open);
      });
    });
  }

  function runIdle(fn){
    if ('requestIdleCallback' in window) requestIdleCallback(fn, {timeout: 1200});
    else setTimeout(fn, 1);
  }

  /* ---------- init ---------- */
  function init(){
    var lite = isLitePage();
    buildScrollOffset();
    buildSkipLink();
    markActiveNav();
    if (!lite) bindFaqA11y();
    buildInPageAnchorScroll();
    buildFaqExpandControls();
    handleSharedLanding();
    bindSwUpdate();
    var bar = document.querySelector('.utility-bar');
    if (bar){ buildLive(bar); buildShare(bar); mergeSubpageBackBar(); }
    tickLiveBannerSlot();
    buildThaiCtaHints();
    build404WatchBar();
    buildWatchLivePulse();
    buildMobileSectionCollapses();
    buildSupportNavStack();
    if (!lite){
      buildHeroShowtime();
      buildUtilityCountdown();
      buildShareTonightButtons();
      buildInstallPrompt();
      updateLiveSchema();
      setInterval(updateLiveSchema, 60000);
      buildCounters();
      runIdle(function(){
        buildProgressBar();
        buildScrollTop();
        buildTocSpy();
      });
      buildHashLanding();
      window.addEventListener('hashchange', buildHashLanding);
      pauseMarqueeWhenHidden();
    }
    setInterval(tickLiveBannerSlot, 60000);
    buildLiveBannerScrollCollapse();
    buildSmartSticky();
    wireVibration();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
