#!/usr/bin/env python3
"""Live audit: pattayastream.com ONLY — pages, assets, internal links."""
from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = 'PattayaStream-SelfAudit/1.0'
BASE = 'https://pattayastream.com'
CTX = ssl.create_default_context()

PAGES = [
    ('/', 'Homepage'),
    ('/support/', 'Support'),
    ('/format/', 'Format'),
    ('/about/', 'About'),
    ('/faq/', 'FAQ'),
    ('/code/', 'Code of Conduct'),
    ('/community/', 'Community (noindex)'),
    ('/offline/', 'Offline fallback'),
    ('/404/', '404 not found'),
    ('/404-test-path-audit', '404 probe'),
]

LIVE_MIN_WORDS = {
    '/': 850,
    '/support/': 850,
    '/format/': 850,
    '/about/': 850,
    '/faq/': 850,
    '/code/': 850,
    '/community/': 850,
}

ASSETS = [
    '/assets/css/pv-core.css?v=13',
    '/assets/css/pv-sub.css?v=9',
    '/assets/css/pv-home.css?v=8',
    '/assets/js/pv-live.js?v=32',
    '/assets/calendar/pattaya-villa-stream.ics',
    '/assets/js/pv-analytics.js?v=1',
    '/assets/js/web-vitals.iife.js',
    '/manifest.json',
    '/sw.js',
    '/favicon.svg',
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known/llms.txt',
    '/psindex2026pattayastreamkey.txt',
    '/404/',
    '/LICENSE',
    '/assets/og/og-home.jpg',
    '/assets/og/og-support.jpg',
    '/assets/og/og-about.jpg',
    '/assets/og/og-format.jpg',
    '/assets/og/og-faq.jpg',
    '/assets/og/og-code.jpg',
]

issues: list[str] = []
warnings: list[str] = []
oks: list[str] = []


def fail(msg: str) -> None:
    issues.append(msg)
    print(f'FAIL: {msg}')


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f'WARN: {msg}')


def ok(msg: str) -> None:
    oks.append(msg)
    print(f'OK: {msg}')


def fetch(url: str, max_bytes: int = 900_000) -> tuple[int | None, str, str]:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
            body = r.read(max_bytes).decode('utf-8', errors='replace')
            return r.status, body, r.geturl()
    except urllib.error.HTTPError as e:
        body = e.read(200_000).decode('utf-8', errors='replace')
        return e.code, body, url
    except Exception as e:
        return None, str(e), url


def fetch_redirect(url: str) -> tuple[int | None, str | None]:
    """Return status + Location without following redirects."""
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': UA})
    opener = urllib.request.build_opener(NoRedirect, urllib.request.HTTPSHandler(context=CTX))
    try:
        with opener.open(req, timeout=25) as r:
            return r.status, r.headers.get('Location')
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get('Location')
    except Exception:
        return None, None


def word_count(html: str) -> int:
    m = re.search(r'<main[^>]*>(.*)</main>', html, re.S | re.I)
    chunk = m.group(1) if m else html
    text = re.sub(r'<script[^>]*>.*?</script>', ' ', chunk, flags=re.S | re.I)
    text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.S | re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    return len(text.split())


def audit_live_pages() -> None:
    print('=== LIVE PAGES (pattayastream.com) ===\n')
    internal_hrefs: set[str] = set()
    broken_internal: list[str] = []

    for path, label in PAGES:
        url = BASE + path if path.startswith('/') else BASE + '/' + path
        status, html, final = fetch(url)
        if path == '/404-test-path-audit':
            if status == 404:
                ok(f'404 handling returns HTTP 404')
            else:
                warn(f'404 probe returned HTTP {status} (expected 404)')
            continue
        if path == '/offline/':
            if status == 200 and 'NO' in html and 'SIGNAL' in html:
                ok(f'Offline (/offline/) HTTP 200')
                if 'id="pv-critical-offline"' in html:
                    ok('  /offline/ · offline critical CSS')
                else:
                    fail('  /offline/ · missing offline critical CSS')
            else:
                fail(f'Offline (/offline/) HTTP {status}')
            continue
        if path == '/404/':
            if status == 200 and 'NOT FOUND' in html.upper() and 'WRONG' in html.upper():
                ok(f'404 (/404/) HTTP 200')
            else:
                fail(f'404 (/404/) HTTP {status}')
            for name, pat in [
                ('canonical /404/', r'canonical" href="https://pattayastream\.com/404/"'),
                ('GA4', r'G-WSGWG7999E'),
                ('sticky-cta', r'class="sticky-cta"'),
                ('noindex', r'noindex'),
            ]:
                if re.search(pat, html, re.I):
                    ok(f'  /404/ · {name}')
                else:
                    fail(f'  /404/ · MISSING {name}')
            continue
        if status != 200:
            fail(f'{label} ({path}) HTTP {status}')
            continue
        ok(f'{label} ({path}) HTTP 200')

        checks = [
            ('canonical', r'<link rel="canonical"'),
            ('GA4', r'G-WSGWG7999E'),
            ('pv-core.css v13', r'pv-core\.css\?v=13'),
            ('utility-bar-actions', r'utility-bar-actions'),
            ('live pill SSR placeholder', r'live-status is-placeholder'),
            ('sticky-cta', r'class="sticky-cta"'),
            ('support #tip-tonight', r'/support/#tip-tonight'),
            ('footer collapsible', r'footer-network-details'),
            ('</html>', r'</html>'),
        ]
        if path == '/':
            checks.append(('marquee ticker', r'class="marquee"'))
            checks.extend([
                ('homepage critical CSS', r'id="pv-critical-home"'),
                ('homepage async pv-core', r'pv-core\.css\?v=13" media="print" onload'),
                ('homepage async pv-home', r'pv-home\.css\?v=8" media="print" onload'),
            ])
        if path == '/community/':
            checks.append(('noindex', r'noindex'))
        if path == '/support/':
            checks.extend([
                ('#payment-methods DOM', r'id="payment-methods"'),
                ('DonateAction', r'DonateAction'),
                ('live-banner slot', r'live-banner-slot'),
                ('subpage critical CSS', r'id="pv-critical-chrome"'),
                ('async pv-sub.css', r'pv-sub\.css\?v=7" media="print" onload'),
            ])
        elif path in ('/about/', '/format/', '/code/', '/faq/', '/community/'):
            checks.extend([
                ('subpage critical CSS', r'id="pv-critical-chrome"'),
                ('async pv-sub.css', r'pv-sub\.css\?v=7" media="print" onload'),
            ])
        if path in ('/', '/about/', '/support/', '/format/', '/code/', '/faq/', '/community/', '/404/'):
            checks.append(('footer privacy link', r'timpaemi\.com/privacy/'))

        for name, pat in checks:
            if re.search(pat, html, re.I):
                ok(f'  {path} · {name}')
            else:
                fail(f'  {path} · MISSING {name}')

        wc = word_count(html)
        min_wc = LIVE_MIN_WORDS.get(path)
        if min_wc and wc < min_wc:
            fail(f'  {path} · thin live content ({wc} words — target {min_wc}+)')
        elif wc < 300 and path not in ('/offline/',):
            warn(f'  {path} · thin content ({wc} words in main)')
        else:
            ok(f'  {path} · {wc} words in main')

        if re.search(r'<iframe', html, re.I):
            fail(f'  {path} · iframe embed (LOCKED violation)')

        for href in re.findall(r'href="(/[^"#?]*/?)"', html):
            if href.startswith('/') and not href.startswith('//'):
                if href.startswith('/assets/') or href.endswith(('.png', '.svg', '.ico', '.woff2', '.json')):
                    continue
                if href in ('/manifest.json',):
                    continue
                internal_hrefs.add(href.rstrip('/') or '/')

    NO_TRAILING_SLASH = {'/LICENSE'}
    print('\n=== INTERNAL LINK CHECK ===\n')
    for href in sorted(internal_hrefs):
        if href in ('/offline', '/offline/'):
            test = BASE + '/offline/'
        elif href in ('/404', '/404/'):
            test = BASE + '/404/'
        elif href in NO_TRAILING_SLASH:
            test = BASE + href
        else:
            test = BASE + (href if href.endswith('/') else href + '/')
        st, _, _ = fetch(test)
        if st == 200:
            ok(f'internal {href} -> 200')
        elif st == 404 and href == '/404-test':
            pass
        else:
            broken_internal.append(f'{href} -> HTTP {st}')
    for b in broken_internal:
        fail(f'broken internal link: {b}')
    if not broken_internal:
        ok('all crawled internal paths return 200')

    st404, body404, _ = fetch(BASE + '/404/')
    if st404 == 200 and 'NOT FOUND' in body404.upper():
        ok('/404/ HTTP 200')
    else:
        fail(f'/404/ HTTP {st404}')

    print('\n=== 404 REDIRECT CHECK ===\n')
    for src in ('/404', '/404.html'):
        code, loc = fetch_redirect(BASE + src)
        if code in (301, 308) and loc and loc.rstrip('/').endswith('/404'):
            ok(f'{src} -> {code} Location {loc}')
        else:
            fail(f'{src} redirect broken (HTTP {code}, Location {loc})')

    print('\n=== OFFLINE REDIRECT CHECK ===\n')
    for src in ('/offline', '/offline.html'):
        code, loc = fetch_redirect(BASE + src)
        if code in (301, 308) and loc and loc.rstrip('/').endswith('/offline'):
            ok(f'{src} -> {code} Location {loc}')
        else:
            fail(f'{src} redirect broken (HTTP {code}, Location {loc})')

    print('\n=== LICENSE REDIRECT CHECK ===\n')
    code, loc = fetch_redirect(BASE + '/LICENSE/')
    if code in (301, 308) and loc and loc.rstrip('/').endswith('/LICENSE'):
        ok('/LICENSE/ -> 301 Location /LICENSE')
    else:
        fail(f'/LICENSE/ redirect broken (HTTP {code}, Location {loc})')

    print('\n=== SHORTCUT REDIRECT CHECK ===\n')
    shortcut_checks = (
        ('/donate', (301, 308), '/support'),
        ('/tip', (301, 308), 'tip-tonight'),
        ('/free', (301, 308), '/support/#free'),
        ('/live', (302,), 'youtube.com/@timpaemi/live'),
        ('/subscribe', (302,), 'sub_confirmation=1'),
        ('/rules', (301, 308), '/code'),
    )
    for src, codes, needle in shortcut_checks:
        code, loc = fetch_redirect(BASE + src)
        loc_ok = loc and needle.lower() in loc.lower()
        if code in codes and loc_ok:
            ok(f'{src} -> {code} Location {loc}')
        else:
            fail(f'{src} shortcut broken (HTTP {code}, Location {loc})')


def audit_assets() -> None:
    print('\n=== LIVE ASSETS ===\n')
    for path in ASSETS:
        st, body, _ = fetch(BASE + path)
        if st == 200:
            ok(f'{path} -> 200 ({len(body)} bytes)')
        else:
            fail(f'{path} -> HTTP {st}')


def audit_local_repo() -> None:
    print('\n=== LOCAL REPO PARITY ===\n')
    html_files = list(ROOT.glob('**/*.html'))
    html_files = [f for f in html_files if '.git' not in f.parts]
    missing_marquee = []
    missing_actions = []
    missing_placeholder = []
    missing_share = []
    missing_footer = []
    chrome_with_bar = (
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html', 'community/index.html', '404.html', '404/index.html',
    )
    for f in html_files:
        t = f.read_text(encoding='utf-8')
        rel = str(f.relative_to(ROOT)).replace('\\', '/')
        if 'utility-bar' in t and 'utility-bar-actions' not in t:
            missing_actions.append(rel)
        if rel in chrome_with_bar and 'live-status is-placeholder' not in t:
            missing_placeholder.append(rel)
        if rel in chrome_with_bar and 'pv-share is-placeholder' not in t:
            missing_share.append(rel)
        if 'footer-network-heading' in t and 'footer-network-details' not in t:
            missing_footer.append(rel)
        if rel == 'index.html' and 'class="marquee"' not in t:
            missing_marquee.append(rel)
        if rel == 'index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local homepage main content: {wc} words')
            else:
                warn(f'local homepage thin: {wc} words (target 850+)')
        if rel == 'community/index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local /community/ main content: {wc} words')
            else:
                warn(f'local /community/ thin: {wc} words (target 850+)')
        if rel == 'code/index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local /code/ main content: {wc} words')
            else:
                warn(f'local /code/ thin: {wc} words (target 850+)')
        if rel == 'about/index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local /about/ main content: {wc} words')
            else:
                warn(f'local /about/ thin: {wc} words (target 850+)')
        if rel == 'support/index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local /support/ main content: {wc} words')
            else:
                warn(f'local /support/ thin: {wc} words (target 850+)')
        if rel == 'format/index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local /format/ main content: {wc} words')
            else:
                warn(f'local /format/ thin: {wc} words (target 850+)')
        if rel == 'faq/index.html':
            wc = word_count(t)
            if wc >= 850:
                ok(f'local /faq/ main content: {wc} words')
            else:
                warn(f'local /faq/ thin: {wc} words (target 850+)')
        if rel == 'offline/index.html' and 'pattayavisahelp.com' in t:
            fail('offline/index.html contains stray external visa link')
        if rel == '404/index.html':
            root404 = (ROOT / '404.html').read_text(encoding='utf-8')

            def norm404(s: str) -> str:
                return re.sub(r'https://pattayastream.com/404/?(?:html)?', 'CANON', s)

            if norm404(t) != norm404(root404):
                fail('404.html and 404/index.html content drift')
            else:
                ok('local 404.html and 404/index.html in sync')
    if missing_marquee:
        fail(f'local index missing marquee: {missing_marquee}')
    else:
        ok('local index.html has marquee')
    if missing_actions:
        fail(f'pages missing utility-bar-actions: {missing_actions}')
    else:
        ok('all utility-bar pages have actions slot')
    if missing_placeholder:
        fail(f'pages missing SSR live pill placeholder: {missing_placeholder}')
    else:
        ok('SSR live pill placeholder on all chrome pages')
    if missing_share:
        fail(f'pages missing SSR share placeholder: {missing_share}')
    else:
        ok('SSR share button placeholder on all chrome pages')
    if missing_footer:
        fail(f'pages missing collapsible footer: {missing_footer}')
    else:
        ok('all footers use collapsible network block')

    sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    locs = re.findall(r'<loc>(https://pattayastream\.com[^<]+)</loc>', sm)
    ok(f'sitemap.xml lists {len(locs)} indexed URLs')
    if len(locs) != 6:
        fail(f'sitemap expected 6 URLs, found {len(locs)}')


def main() -> int:
    print('=== PATTAYASTREAM.COM ONLY AUDIT ===\n')
    audit_local_repo()
    audit_live_pages()
    audit_assets()
    print(f'\n=== SUMMARY ===')
    print(f'OK: {len(oks)} | WARN: {len(warnings)} | FAIL: {len(issues)}')
    out = ROOT / '.pattayastream-audit.json'
    out.write_text(json.dumps({'oks': len(oks), 'warnings': warnings, 'failures': issues}, indent=2), encoding='utf-8')
    print(f'Report: {out.name}')
    if issues:
        print('\nFAILURES:')
        for i in issues:
            print(f'  • {i}')
    if warnings:
        print('\nWARNINGS:')
        for w in warnings:
            print(f'  • {w}')
    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())
