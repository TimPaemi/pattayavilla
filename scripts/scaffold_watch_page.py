#!/usr/bin/env python3
"""One-shot scaffold: watch/index.html from format/index.html chrome."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FMT = ROOT / 'format/index.html'
OUT = ROOT / 'watch/index.html'

TITLE = 'Watch Live — Pattaya Villa Stream · Tim &amp; Paemi on YouTube · 9 PM ICT'
DESC = (
    'Watch PATTAYA VILLA STREAM live on YouTube every night. Tim &amp; Paemi broadcast '
    'from their Pattaya villa at 9 PM Bangkok time (ICT). Free HD stream on @timpaemi — '
    '6 to 8 hours nightly.'
)

MAIN = r'''
<main id="main" class="watch-main">

  <div class="live-banner-slot">
  <div class="live-countdown" data-live-countdown aria-live="polite">
    <span class="live-countdown-label">Next show · Pattaya time</span>
    <span class="live-countdown-value" data-live-countdown-val>9 PM ICT tonight</span>
    <a href="/assets/calendar/pattaya-villa-stream.ics" class="live-countdown-cal" download="pattaya-villa-stream.ics" data-gtm="watch_countdown_calendar">+ CALENDAR</a>
  </div>
  <a class="live-banner" data-live-banner href="https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&amp;utm_medium=watch&amp;utm_campaign=watch_live" target="_blank" rel="noopener noreferrer" hidden data-gtm="watch_live_banner">
    <span class="dot" aria-hidden="true"></span>
    <span class="txt">LIVE NOW — TAP TO WATCH ON YOUTUBE</span>
  </a>
  </div>

  <nav class="toc toc--scroll" aria-label="Sections on this page">
    <span class="toc-label">JUMP TO:</span>
    <a href="#watch-youtube" data-gtm="watch_toc" data-gtm-platform="youtube">YouTube link</a>
    <a href="#watch-schedule" data-gtm="watch_toc" data-gtm-platform="schedule">Schedule</a>
    <a href="#watch-timezones" data-gtm="watch_toc" data-gtm-platform="timezones">Timezones</a>
    <a href="#watch-first-time" data-gtm="watch_toc" data-gtm-platform="first-time">First time</a>
    <a href="#watch-subscribe" data-gtm="watch_toc" data-gtm-platform="subscribe">Subscribe</a>
  </nav>

  <article class="body-section" id="watch-youtube">
    <span class="section-tag red">// 01 — WATCH ON YOUTUBE</span>
    <h2>Watch the <span class="red">Pattaya villa livestream</span> on YouTube.</h2>
    <p><strong>PATTAYA VILLA STREAM is a free nightly YouTube livestream</strong> hosted by Tim and Paemi from their villa in Pattaya, Thailand. The broadcast runs on the official <a href="https://www.youtube.com/@timpaemi/live" target="_blank" rel="noopener noreferrer" data-gtm="watch_youtube_live">@timpaemi YouTube live channel</a> — tap below when the show is on air, or bookmark this page and come back at 9 PM Bangkok time (ICT).</p>
    <p>The short link <a href="https://timpaemi.com/live" target="_blank" rel="noopener noreferrer" data-gtm="watch_shortlink">timpaemi.com/live</a> always points to the current live broadcast. This site does not embed the stream — YouTube is the player. That keeps the stream fast, free, and in HD on every device with the YouTube app or browser.</p>
    <div class="btn-row">
      <a href="https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&amp;utm_medium=watch-youtube&amp;utm_campaign=watch_live" target="_blank" rel="noopener noreferrer" class="btn btn-red btn-mega has-thai" data-gtm="watch_youtube_cta"><span class="watch-cta-label">▶ OPEN @TIMPAEMI LIVE</span><span class="btn-thai" aria-hidden="true">ดูสดบน YouTube · 21:00 น.</span></a>
      <a href="https://www.youtube.com/@timpaemi/videos" target="_blank" rel="noopener noreferrer" class="btn btn-cyan" data-gtm="watch_youtube_vods">PAST STREAMS →</a>
    </div>
  </article>

  <article class="body-section" id="watch-schedule">
    <span class="section-tag cyan">// 02 — SCHEDULE</span>
    <h2>Every night at <span class="cyan">9 PM ICT.</span></h2>
    <p><strong>The Pattaya livestream starts at 9:00 PM Bangkok time every single night</strong> — ICT, UTC+7 — and runs six to eight hours from the villa. No nights off since 2024: weekends, holidays, sick nights, birthdays. Thailand does not observe daylight saving, so the Pattaya start time never shifts year-round.</p>
    <p>Typical sign-off is around 2 to 3 AM Bangkok time. You can join at 9 PM or drop in hours later — every segment stands on its own. See how each night is structured on the <a href="/format/#typical-night" data-gtm="watch_to_format_night">format page</a>, or read the full <a href="/faq/#faq-when" data-gtm="watch_to_faq_when">FAQ schedule answer</a>.</p>
    <p><a href="/assets/calendar/pattaya-villa-stream.ics" download="pattaya-villa-stream.ics" data-gtm="watch_add_calendar">Download the nightly calendar file</a> (.ics) for a recurring 9 PM ICT reminder in Apple Calendar, Google Calendar, or Outlook.</p>
  </article>

  <article class="body-section" id="watch-timezones">
    <span class="section-tag yellow">// 03 — TIMEZONES</span>
    <h2>9 PM Pattaya — <span class="yellow">what time for you?</span></h2>
    <p>Searching <strong>&quot;what time is Tim and Paemi live&quot;</strong> or <strong>&quot;Pattaya livestream time in my country&quot;</strong>? The show always starts at 9 PM ICT. Examples when clocks are on standard time: <strong>London 2 PM</strong>, <strong>New York 9 AM</strong>, <strong>Los Angeles 6 AM</strong>, <strong>Sydney midnight</strong>, <strong>Tokyo 11 PM</strong>, <strong>Dubai 4 PM</strong>, <strong>Berlin 3 PM</strong>.</p>
    <p>The <a href="/#when-heading" data-gtm="watch_to_timezones">homepage timezone guide</a> lists major cities worldwide. Watching from Thailand long-term? Our <a href="https://pattayavisahelp.com/" target="_blank" rel="noopener noreferrer" data-gtm="watch_to_visa">visa help site</a> covers the basics for expats in Pattaya and Chon Buri.</p>
  </article>

  <article class="body-section" id="watch-first-time">
    <span class="section-tag pink">// 04 — FIRST TIME WATCHING</span>
    <h2>New to the <span class="pink">villa show?</span></h2>
    <p><strong>Never watched a Pattaya villa livestream before?</strong> There is no episode one and no lore you missed. Open YouTube at 9 PM ICT — or whenever you can; the stream runs six to eight hours so there is no such thing as late. Say hi in chat when you arrive. New viewers asking obvious questions are genuinely welcome.</p>
    <p>Two minutes on the <a href="/code/#first-night" data-gtm="watch_to_code">chat code of conduct</a> tells you how the room works. The <a href="/format/#first-night" data-gtm="watch_to_format_first">first-night guide</a> on the format page walks through what to expect. Who are Tim and Paemi? The <a href="/about/#new-here" data-gtm="watch_to_new_here">new-here section</a> on the about page has the short version.</p>
    <p>Want your message read on air during the livestream? A <a href="/support/#tip-tonight" data-gtm="watch_to_superchat">Super Chat</a> pins it to the top and earns a live shoutout. Just want to watch? That is the whole point — <strong>watch time is the best free support there is.</strong></p>
  </article>

  <article class="body-section" id="watch-subscribe">
    <span class="section-tag green">// 05 — SUBSCRIBE + BELL</span>
    <h2>Never miss a <span class="green">Pattaya night.</span></h2>
    <p><strong>Subscribe with the bell on YouTube</strong> and you get pinged the second Tim and Paemi go live from the villa. It is free, takes ten seconds, and it is the single biggest algorithm signal for a nightly livestream channel. Every subscribed viewer helps the Pattaya show reach more people who have never heard of it.</p>
    <p>More free ways to back the stream — watch live, share the link, tell a friend — are on the <a href="/support/#free" data-gtm="watch_to_support_free">free support paths</a>. Paid support via Super Chat and Super Thanks runs through YouTube only; see the <a href="/support/#tip-tonight" data-gtm="watch_to_support_paid">paid support section</a>.</p>
    <div class="btn-row">
      <a href="https://www.youtube.com/@timpaemi?sub_confirmation=1&amp;utm_source=pattayastream&amp;utm_medium=watch&amp;utm_campaign=sub" target="_blank" rel="noopener noreferrer" class="btn btn-yellow btn-mega" data-gtm="watch_subscribe">★ SUBSCRIBE + BELL</a>
      <a href="/support/#free" class="btn btn-cyan" data-gtm="watch_to_support">ALL SUPPORT PATHS →</a>
    </div>
  </article>

  <section class="intro" id="watch-about-show">
    <span class="section-tag">★ ABOUT THE SHOW</span>
    <h2 class="hl">Pattaya villa livestream · <span class="hl">Tim &amp; Paemi</span></h2>
    <p>PATTAYA VILLA STREAM is the nightly Pattaya YouTube livestream by a German-Thai married couple broadcasting from their villa in Pattaya, Chon Buri, Thailand. Six to eight hours of unscripted villa life — challenges, games, food, conversation — with <a href="/format/#chat-is-the-room" data-gtm="watch_to_chat_room">chat driving every night</a>. No sponsors. No paywall. Operated by <a href="https://pattaya-authority.com/work/pattaya-stream/" target="_blank" rel="noopener noreferrer" data-gtm="watch_to_authority">Pattaya-Authority.com</a> (TIMPAEMI Co., Ltd.) as part of a <a href="/about/#network" data-gtm="watch_to_network">14-site Pattaya network</a>.</p>
    <p>Still have questions? The <a href="/faq/" data-gtm="watch_to_faq">FAQ</a> covers schedule, language, support, mods, and contact. The <a href="/format/" data-gtm="watch_to_format">format page</a> explains how the villa show works from first camera-on to sign-off.</p>
  </section>

  <div class="end-cta">
    <h2>Live tonight at <span class="pink">9 PM ICT.</span></h2>
    <p>The Pattaya villa livestream is free on YouTube. Subscribe with the bell and you never miss a night.</p>
    <div class="btn-row">
      <a href="https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&amp;utm_medium=watch-end&amp;utm_campaign=watch_live" target="_blank" rel="noopener noreferrer" class="btn btn-red has-thai" data-gtm="watch_end_live"><span class="watch-cta-label">▶ WATCH LIVE</span><span class="btn-thai" aria-hidden="true">ดูสด 21:00 น.</span></a>
      <a href="/support/#free" class="btn btn-yellow" data-gtm="watch_end_support">★ SUPPORT THE SHOW</a>
      <a href="/assets/calendar/pattaya-villa-stream.ics" class="btn btn-cyan" download="pattaya-villa-stream.ics" data-gtm="watch_end_calendar">+ ADD TO CALENDAR</a>
      <button type="button" class="btn btn-cyan" data-share-tonight data-gtm="watch_share_tonight">↗ SHARE TONIGHT</button>
      <a href="/format/" class="btn btn-cyan" data-gtm="watch_end_format">HOW IT WORKS →</a>
    </div>
  </div>

</main>
'''

HERO = r'''
<section class="hero">
  <span class="hero-eyebrow">// WATCH LIVE · PATTAYA VILLA STREAM · YOUTUBE @TIMPAEMI</span>
  <h1>WATCH<br><span class="pink">LIVE.</span></h1>
  <p class="hero-sub">
    <strong>Free Pattaya villa livestream every night on YouTube.</strong>
    Tim &amp; Paemi go live at 9 PM Bangkok time (ICT) from their Pattaya villa — six to eight hours, no paywall, no signup required to watch.
  </p>
  <div class="hero-meta">YOUTUBE @TIMPAEMI · 9 PM ICT NIGHTLY · PATTAYA THAILAND · FREE HD STREAM</div>
  <div class="btn-row hero-actions-inline">
    <a href="https://www.youtube.com/@timpaemi/live?utm_source=pattayastream&amp;utm_medium=watch-hero&amp;utm_campaign=watch_live" target="_blank" rel="noopener noreferrer" class="btn btn-red btn-mega has-thai" data-gtm="watch_hero_live"><span class="watch-cta-label">▶ WATCH ON YOUTUBE NOW</span><span class="btn-thai" aria-hidden="true">ดูสดคืนนี้ · 21:00 น. ไทย</span></a>
    <a href="https://www.youtube.com/@timpaemi?sub_confirmation=1&amp;utm_source=pattayastream&amp;utm_medium=watch-hero&amp;utm_campaign=sub" target="_blank" rel="noopener noreferrer" class="btn btn-yellow" data-gtm="watch_hero_sub">★ SUBSCRIBE + BELL</a>
  </div>
</section>
'''

SCHEMA = r'''{"@context":"https://schema.org","@graph":[
  {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"PATTAYA VILLA STREAM","item":"https://pattayastream.com/"},{"@type":"ListItem","position":2,"name":"Watch Live","item":"https://pattayastream.com/watch/"}]},
  {"@type":"WebPage","@id":"https://pattayastream.com/watch/#webpage","url":"https://pattayastream.com/watch/","name":"Watch Live — Pattaya Villa Stream · Tim & Paemi on YouTube","description":"Watch the Pattaya villa livestream free on YouTube every night at 9 PM ICT. Tim & Paemi broadcast from Pattaya Thailand on @timpaemi.","inLanguage":"en","isPartOf":{"@id":"https://pattayastream.com/#website"},"datePublished":"2024-01-01T00:00:00+07:00","dateModified":"2026-06-01T00:00:00+07:00","breadcrumb":{"@id":"https://pattayastream.com/watch/#breadcrumbs"},"speakable":{"@type":"SpeakableSpecification","cssSelector":["h1",".hero-sub","#watch-youtube p","#watch-schedule p","#watch-timezones p","#watch-first-time p"]},"primaryImageOfPage":{"@type":"ImageObject","url":"https://pattayastream.com/assets/og/og-home.jpg"}},
  {"@type":"HowTo","@id":"https://pattayastream.com/watch/#howto","name":"How to watch PATTAYA VILLA STREAM live","description":"Watch the nightly Pattaya villa livestream by Tim and Paemi on YouTube — free, every night at 9 PM ICT.","totalTime":"PT2M","step":[
    {"@type":"HowToStep","position":1,"name":"Open YouTube","text":"Go to youtube.com/@timpaemi/live or timpaemi.com/live — both point to the current live broadcast."},
    {"@type":"HowToStep","position":2,"name":"Check the time","text":"The stream starts at 9 PM Bangkok time (ICT, UTC+7) every night and runs six to eight hours."},
    {"@type":"HowToStep","position":3,"name":"Subscribe with the bell","text":"Subscribe to @timpaemi on YouTube with notifications on so YouTube alerts you when the villa show goes live."},
    {"@type":"HowToStep","position":4,"name":"Say hi in chat","text":"Chat is the room — read the chat code of conduct on pattayastream.com/code/ before your first message."}
  ]},
  {"@type":"VideoObject","name":"PATTAYA VILLA STREAM Nightly Livestream","description":"Nightly Pattaya villa livestream by Tim and Paemi on YouTube.","thumbnailUrl":"https://pattayastream.com/assets/og/og-home.jpg","contentUrl":"https://www.youtube.com/@timpaemi/live","embedUrl":"https://www.youtube.com/@timpaemi/live","uploadDate":"2024-01-01","duration":"PT8H","inLanguage":"en","isAccessibleForFree":true,"publication":{"@type":"BroadcastEvent","isLiveBroadcast":true,"startDate":"2024-01-01T21:00:00+07:00"},"potentialAction":{"@type":"WatchAction","target":"https://www.youtube.com/@timpaemi/live"}}
]}'''


def main() -> None:
    html = FMT.read_text(encoding='utf-8')
    html = re.sub(r'<title>.*?</title>', f'<title>{TITLE}</title>', html, count=1)
    html = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{DESC}">',
        html,
        count=1,
    )
    html = html.replace('https://pattayastream.com/format/', 'https://pattayastream.com/watch/')
    html = html.replace('The Format — How PATTAYA VILLA STREAM Works', 'Watch Live — Pattaya Villa Stream · Tim &amp; Paemi')
    html = html.replace('og-format.jpg', 'og-home.jpg')
    html = html.replace('class="format-main"', 'class="watch-main"')
    html = re.sub(
        r'<script type="application/ld\+json">\s*\{.*?\}\s*</script>',
        f'<script type="application/ld+json">\n{SCHEMA}\n</script>',
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r'<section class="hero">.*?</section>',
        HERO.strip(),
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r'<main id="main" class="watch-main">.*?</main>',
        MAIN.strip(),
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace('utm_medium=format', 'utm_medium=watch')
    html = html.replace('data-gtm="format_', 'data-gtm="watch_')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding='utf-8')
    print(f'Wrote {OUT.relative_to(ROOT)} ({len(html):,} bytes)')


if __name__ == '__main__':
    main()
