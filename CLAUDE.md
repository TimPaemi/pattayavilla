# PATTAYA VILLA STREAM — Brand Site

## Project
The dedicated home for the **PATTAYA VILLA STREAM livestream** — the nightly show by Tim & Paemi.
Operated by **Pattaya-Authority.com** (TIMPAEMI Co., Ltd.).
Audience-driven: support page + community recognition + show explainer.

## Domain
- Production: **https://pattayastream.com**
- Repo: https://github.com/TimPaemi/pattayavilla
- Hosting: **Cloudflare Pages**, project name: `pattayavilla`
- Production branch: `master`

## Working surface
**Repo root = deployable surface.** 6 indexed pages:
- `/` (homepage — louder hero, network bar, quick-links to all sub-pages)
- `/support/` (YouTube-only for now: Subscribe + Watch + Share + Super Chat + Super Thanks. **NO crypto. NO Patreon/PayPal/Ko-fi/BMC/Thai QR.** Tim adds more paths step by step.)
- `/community/` (mods + heroes + regulars — **anonymous on site, shoutouts on stream**. Only Tim & Paemi publicly named. noindex.)
- `/format/` (how the show works — unscripted, **chat is the room**. Music is copyright-free and pre-queued. Never leave villa. No random calls.)
- `/code/` (chat code of conduct)
- `/faq/` (common questions, FAQPage schema)

Plus error pages: `/offline.html` (Service Worker fallback) and `/404.html` (Cloudflare Pages default).

## Deploy
- `.\deploy.ps1` — clean staging deploy with allowlist gate (no dirty deploys).
- Pushes only allowlisted files; aborts if `AUDIT*.md`, `__pycache__`, `.deploy-stage` slip in.

## Design system (locked — same palette as timpaemi.com)
- **Palette:** pink `#ff2f8e`, cyan `#00e5ff`, yellow `#ffe156`, green `#6aff9f`, red `#e60030`/text `#ff3b5c`, bg `#08080c`
- **3rd-party brand exceptions:** WhatsApp green `#25d366`, LINE green `#06c755`
- **Fonts:** self-hosted Bebas Neue (display), JetBrains Mono (mono), Inter (body)
- **Voice:** LOUDER than timpaemi.com — bigger headings (12-15rem), more glow, marquee tickers, "in your face"
- **Layout philosophy:** dense, aggressive, button-first. Every section ends with a CTA.

## What is LOCKED (do not change)
- ❌ NO embeds (YouTube, Twitch, anything). External-link only.
- ❌ NO chat / comments / forums.
- ❌ NO villa photos. **NO names of crew, mods, supporters, or regulars beyond Tim & Paemi — ever.**
- ❌ NO individual donation amounts published. NO rankings. NO leaderboards.
- ❌ NO crypto support paths (operator does not use crypto).
- ❌ NO new pages added without operator sign-off.
- ❌ NO Google Fonts (everything self-hosted).
- ❌ NO Facebook Pixel on this site (CSP doesn't allow it).
- ❌ NO cookie banner (GA4 anonymize_ip + cookieless CF Web Analytics).

## Network sister sites (link out, never merge in)
- timpaemi.com (brand)
- pattaya-authority.com (parent agency — operator of this site)
- pattaya-restaurant-guide.com
- pattaya-gym.com
- pattayavisahelp.com
- pattaya-coffee.com
- pattaya-school-guide.com

## Analytics
- GA4 measurement ID: **G-WSGWG7999E** (live — canonical gtag.js snippet on all 7 HTML pages)
- Cloudflare Web Analytics: optional (decide post-launch)
- Web Vitals beacon: live — `/assets/js/web-vitals.iife.js` reports LCP/CLS/INP/FCP/TTFB to GA4

## Dead context — IGNORE
This is a sibling site to timpaemi.com, NOT a continuation of the old 1057-page Pattaya SEO site (archived on `archive-2026-05-17-pre-cleanup` branch over there). Different repo, different domain, different purpose.

Reference: study `https://github.com/TimPaemi/timpaemi` (the brand site) for established standards — performance, accessibility, security headers, schema patterns. Carry them over here.
