#!/usr/bin/env python3
"""One-shot live production audit: pattayastream.com + 14-site network."""
from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = Path(__file__).resolve().parent / 'network_manifest.json'
UA = 'PattayaStream-FullAudit/1.0'
CTX = ssl.create_default_context()

BASE = 'https://pattayastream.com'
PAGES = [
    '/',
    '/support/',
    '/format/',
    '/about/',
    '/faq/',
    '/code/',
    '/community/',
    '/offline',
]
ASSETS = [
    '/assets/css/pv-core.css',
    '/assets/css/pv-sub.css',
    '/assets/js/pv-live.js',
    '/assets/js/pv-analytics.js',
    '/assets/js/web-vitals.iife.js',
    '/manifest.json',
    '/sw.js',
    '/favicon.svg',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-network.xml',
    '/.well-known/llms.txt',
    '/psindex2026pattayastreamkey.txt',
    '/assets/og/og-home.jpg',
    '/assets/og/og-support.jpg',
]

issues: list[str] = []
warnings: list[str] = []
oks: list[str] = []


def issue(msg: str) -> None:
    issues.append(msg)
    print(f'FAIL: {msg}')


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f'WARN: {msg}')


def ok(msg: str) -> None:
    oks.append(msg)
    print(f'OK: {msg}')


def fetch(url: str, method: str = 'GET', max_bytes: int = 900_000) -> tuple[int | None, dict, str, str]:
    req = urllib.request.Request(url, method=method, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=25, context=CTX) as resp:
            body = resp.read(max_bytes) if method == 'GET' else b''
            final = resp.geturl()
            return resp.status, dict(resp.headers), body.decode('utf-8', errors='replace'), final
    except urllib.error.HTTPError as e:
        body = e.read(200_000).decode('utf-8', errors='replace') if method == 'GET' else ''
        return e.code, dict(e.headers), body, url
    except Exception as e:
        return None, {}, str(e), url


def audit_pattayastream_pages() -> None:
    print('=== LIVE: pattayastream.com pages ===\n')
    for path in PAGES:
        url = BASE + path
        status, headers, html, final = fetch(url)
        if status != 200:
            issue(f'{url} HTTP {status}')
            continue
        ok(f'{url} HTTP 200' + (f' (via {final})' if final != url else ''))

        checks = [
            ('canonical', r'<link rel="canonical"'),
            ('GA4 G-WSGWG7999E', r'G-WSGWG7999E'),
            ('pv-core.css', r'pv-core\.css'),
            ('sticky-cta', r'class="sticky-cta"'),
            ('utility-bar', r'utility-bar'),
            ('14 PROPERTIES strap', r'14 PROPERTIES'),
            ('valid html close', r'</html>'),
        ]
        if path == '/community/':
            checks.append(('noindex', r'noindex'))
        if path != '/offline':
            checks.append(('sticky support #tip-tonight', r'/support/#tip-tonight'))
        if path == '/support/':
            checks.append(('DonateAction', r'DonateAction'))
            checks.append(('#payment-methods DOM', r'id="payment-methods"'))
            checks.append(('#payment-methods schema', r'support/#payment-methods'))
        if path == '/offline':
            checks.append(('watch live CTA', r'youtube\.com/@timpaemi/live'))

        for name, pat in checks:
            if re.search(pat, html, re.I):
                ok(f'  {path} · {name}')
            else:
                issue(f'  {path} · MISSING {name}')

        if re.search(r'<iframe', html, re.I):
            issue(f'  {path} · iframe embed found (LOCKED violation)')
        if re.search(r'\b(bitcoin|crypto wallet)\b', html, re.I):
            warn(f'  {path} · crypto keyword detected (review)')

        csp = headers.get('Content-Security-Policy') or headers.get('content-security-policy')
        if csp:
            ok(f'  {path} · CSP header')
        else:
            warn(f'  {path} · no CSP header in response')

    status, _, html, _ = fetch(BASE + '/nonexistent-audit-path-xyz')
    if status == 404:
        ok('/404 returns HTTP 404 for bad path')
    elif status == 200:
        warn(f'404 probe returned HTTP 200 (soft 404?)')
    else:
        warn(f'404 probe returned HTTP {status}')


def audit_assets() -> None:
    print('\n=== LIVE: pattayastream.com assets ===\n')
    for path in ASSETS:
        url = BASE + path
        status, _, body, _ = fetch(url)
        if status == 200 and not body.startswith('<'):
            ok(f'{path} HTTP 200 ({len(body)} bytes)')
        elif status == 200:
            ok(f'{path} HTTP 200 ({len(body)} chars)')
        else:
            issue(f'{path} HTTP {status}')


def audit_sister_sites() -> dict:
    print('\n=== LIVE: 13 sister site homepages ===\n')
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    results: dict[str, dict] = {}
    for site in manifest['live']:
        domain = site['domain']
        if domain == 'pattayastream.com':
            continue
        url = f'https://{domain}/'
        status, _, html, _ = fetch(url)
        entry: dict = {'domain': domain, 'repo': site['repo'], 'http': status}

        if status != 200:
            issue(f'{domain} homepage HTTP {status}')
            entry['status'] = 'down'
            results[domain] = entry
            continue

        title_m = re.search(r'<title[^>]*>([^<]+)</title>', html, re.I)
        title = title_m.group(1).strip() if title_m else ''
        entry['title'] = title[:80]
        inbound = bool(re.search(r'pattayastream\.com|pattayavilla', html, re.I))
        entry['inbound'] = inbound

        skip_hosts = ('api.whatsapp.com', 'social-plugins.line.me', 'twitter.com', 'www.facebook.com')
        bad_urls = [
            u for u in re.findall(r'href="(https?://[^"]+)"', html)
            if not any(h in u for h in skip_hosts)
            and re.search(r'\.com[a-z]', u)
        ]
        if bad_urls:
            issue(f'{domain} malformed URLs (missing slash after TLD): {bad_urls[:5]}')
            entry['bad_urls'] = bad_urls[:5]

        ok(f'{domain} HTTP 200 · "{title[:55]}" · inbound={"yes" if inbound else "NO"}')
        if not inbound:
            warn(f'{domain} ({site["repo"]}) — no pattayastream.com link on homepage')

        results[domain] = entry
    return results


def main() -> int:
    audit_pattayastream_pages()
    audit_assets()
    sister = audit_sister_sites()

    report = {
        'oks': len(oks),
        'warnings': warnings,
        'failures': issues,
        'sister_sites': sister,
    }
    out = ROOT / '.full-live-audit.json'
    out.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'\n=== SUMMARY ===')
    print(f'Checks OK: {len(oks)} | Warnings: {len(warnings)} | Failures: {len(issues)}')
    print(f'Report: {out.name}')
    if issues:
        print('\n--- FAILURES ---')
        for i in issues:
            print(f'  • {i}')
    if warnings:
        print('\n--- WARNINGS ---')
        for w in warnings:
            print(f'  • {w}')
    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())
