<div align="center">

# PATTAYA VILLA STREAM

**The nightly Pattaya villa livestream by Tim & Paemi**
🔴 Live every night · 9 PM ICT · 6 to 8 hours · no script

[![Site](https://img.shields.io/badge/site-pattayastream.com-ff2f8e?style=for-the-badge)](https://pattayastream.com)
[![Brand](https://img.shields.io/badge/brand-timpaemi.com-00e5ff?style=for-the-badge)](https://timpaemi.com)
[![Network](https://img.shields.io/badge/network-Pattaya--Authority-ffe156?style=for-the-badge&labelColor=08080c)](https://pattaya-authority.com)
[![License](https://img.shields.io/badge/license-Proprietary-e60030?style=for-the-badge)](LICENSE)

[![YouTube](https://img.shields.io/badge/YouTube-@timpaemi-FF0000?logo=youtube&logoColor=white)](https://www.youtube.com/@timpaemi)
[![TikTok](https://img.shields.io/badge/TikTok-@timpaemi.com-000000?logo=tiktok&logoColor=white)](https://www.tiktok.com/@timpaemi.com)
[![Instagram](https://img.shields.io/badge/Instagram-@timpaemi-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/timpaemi/)
[![Facebook](https://img.shields.io/badge/Facebook-Tim%20%26%20Paemi-1877F2?logo=facebook&logoColor=white)](https://www.facebook.com/profile.php?id=61583166493467)

</div>

---

## About

PATTAYA VILLA STREAM is the dedicated home for the nightly livestream by **Tim** (Germany) and **Paemi** (Thailand) — a married couple broadcasting from their Pattaya villa every single night at 9 PM ICT. No script. Six to eight hours. Chat is the room.

Part of the **TIMPAEMI Co., Ltd.** network — **5M+ followers across 60+ social accounts**.

## The site

Static HTML / CSS / JS — no framework, no build step.
Deployed on **Cloudflare Pages**. Production: **<https://pattayastream.com>**

### Six indexed pages
- `/` — Homepage · scale signals + hero + quick-links
- `/support/` — YouTube-only support · 3 free paths + 2 live-stream paths (Super Chat / Super Thanks)
- `/community/` — Mods, heroes, regulars · anonymous by design
- `/format/` — How the show works · 4-section breakdown
- `/code/` — Chat code of conduct
- `/faq/` — Common questions · FAQPage schema

Plus error pages: `/offline.html` (Service Worker fallback) and `/404.html` (Cloudflare default).

## What's wired

| Layer | What |
|---|---|
| **Schema** | Organization · Brand · 2 Persons · WebSite · BroadcastService · recurring Event · BreadcrumbList · WebPage · DonateAction · ItemList · Article · FAQPage |
| **Analytics** | GA4 via canonical `gtag.js` · Web Vitals → GA4 · scroll-depth events · universal `data-gtm` click delegation |
| **Conversion** | Sticky bottom CTA on every page (`WATCH LIVE` + `SUPPORT`) · live-now indicator (pulses red 9PM–3AM ICT) · share tray (X / WhatsApp / Telegram / Facebook / copy / native) |
| **PWA** | Manifest with `share_target` + shortcuts · Service Worker v2 (network-first nav + nav preload + smart precache) · iOS splash for 7 device sizes · installable on every platform |
| **Performance** | Self-hosted fonts (Bebas Neue / Inter / JetBrains Mono) · `<link rel="preload">` chain · Speculation Rules prerender · View Transitions API · `content-visibility: auto` on long sections |
| **Security** | HSTS preload-eligible · strict CSP · `frame-ancestors: 'none'` · Permissions-Policy locked · COOP + CORP · CSRF-safe (no forms) |
| **SEO** | Canonical + hreflang on every page · sitemap with `<lastmod>` + `<image>` · robots.txt blocks all known AI training scrapers · IndieWeb `rel=me` social verification |
| **Routing** | 40+ `_redirects` rules covering `/tip`, `/donate`, `/superchat`, `/live`, `/watch`, `/sub`, `/coffee`, `/school`, etc. |
| **Quality gate** | `deploy.ps1` pre-flight (HTML close-tag + JSON parse + sitemap lastmod auto-update) · GitHub Actions: preflight on every push + Lighthouse CI on every deploy |

## What is LOCKED (by operator policy)

- No embeds (YouTube, Twitch, anything). External-link only.
- No chat / comments / forums on the site.
- No villa photos. **No names of crew, mods, supporters, or regulars beyond Tim & Paemi — ever.**
- No individual donation amounts, no supporter rankings, no leaderboards.
- No crypto support paths (operator does not use crypto).
- No new pages added without operator approval.
- No Google Fonts. No Facebook Pixel. No cookie banner.

## Network

Part of the TIMPAEMI Co., Ltd. site network:

- [**timpaemi.com**](https://timpaemi.com/) — the brand site
- [**pattaya-authority.com**](https://pattaya-authority.com/) — parent agency
- [**pattaya-restaurant-guide.com**](https://pattaya-restaurant-guide.com/)
- [**pattaya-gym.com**](https://pattaya-gym.com/)
- [**pattayavisahelp.com**](https://pattayavisahelp.com/)
- [**pattaya-coffee.com**](https://pattaya-coffee.com/)
- [**pattaya-school-guide.com**](https://pattaya-school-guide.com/)

## Deploy

```powershell
.\deploy.ps1
```

Runs the 4-stage pre-flight gate (HTML integrity · JSON parse · TODO leak · sitemap lastmod auto-update), then `wrangler pages deploy` to Cloudflare.

Or — push to `master` and Cloudflare Pages auto-deploys via the GitHub integration.

## Support the show

If you found this site and got curious — the easiest way to back the operation is via the [Sponsor button](https://github.com/sponsors/TimPaemi) at the top of the repo, or visit [pattayastream.com/support](https://pattayastream.com/support/) for every path.

## Press inquiries

**info@pattayastream.com** · LINE (@timpaemi) · WhatsApp (+66 96 728 6999)

## License

[Proprietary](LICENSE) · © 2024–present TIMPAEMI Co., Ltd. · Pattaya · Thailand
