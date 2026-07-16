#!/usr/bin/env python3
"""Read-only network audit for the DISMANTLED network chrome.

The sitewide sister-domain bar/footer and sitemap-network.xml were removed
for SEO on 2026-07-16. The audit now asserts the new end state: a single
timpaemi.com brand link in the utility bar, no network sitemap index, no
legacy footer grid — plus the unchanged YouTube-handle and live sitemap
probes. Never re-add checks that REQUIRE sister-domain link lists.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = Path(__file__).resolve().parent / 'network_manifest.json'

failures: list[str] = []
warnings: list[str] = []

# Old sitewide sister-domain list — kept ONLY to detect regressions.
LEGACY_SISTER_DOMAINS = frozenset({
    'pattaya-restaurant-guide.com',
    'pattayavisahelp.com',
    'pattaya-gym.com',
    'pattaya-school-guide.com',
    'pattaya-coffee.com',
    'pattaya-medical.com',
    'pattayapets.com',
    'pattaya-vehicle-rentals.com',
    'pattayapersonaltrainer.com',
    'pattayaolympian.com',
    'mrweoutside.com',
})


def fail(msg: str) -> None:
    failures.append(msg)
    print(f'FAIL: {msg}')


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f'WARN: {msg}')


def ok(msg: str) -> None:
    print(f'OK: {msg}')


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding='utf-8'))


def site_html_files() -> list[Path]:
    out = []
    for f in sorted(ROOT.glob('**/*.html')):
        if any(p in f.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        out.append(f)
    return out


def audit_sitemap_network_index() -> None:
    """The network sitemap index was dismantled — it must stay deleted."""
    if (ROOT / 'sitemap-network.xml').exists():
        fail('sitemap-network.xml exists — legacy network sitemap index must stay deleted')
    else:
        ok('sitemap-network.xml absent (network sitemap index dismantled)')
    robots = ROOT / 'robots.txt'
    if robots.exists() and 'sitemap-network' in robots.read_text(encoding='utf-8'):
        fail('robots.txt still references sitemap-network.xml')


def audit_utility_bar_links() -> None:
    """The utility bar carries exactly ONE brand link (timpaemi.com) — no sister lists."""
    bad = []
    checked = 0
    for f in site_html_files():
        html = f.read_text(encoding='utf-8')
        if 'utility-scroll' not in html:
            continue
        checked += 1
        bar = re.search(r'utility-scroll">(.*?)</div>', html, re.DOTALL)
        if not bar:
            bad.append(f'{f.relative_to(ROOT)}: utility-scroll block malformed')
            continue
        linked = [
            m.group(1).lower()
            for m in re.finditer(r'href="https://([^/"\'>]+)', bar.group(1))
        ]
        if linked != ['timpaemi.com']:
            bad.append(f'{f.relative_to(ROOT)}: bar links {linked} (expected exactly [timpaemi.com])')
    if bad:
        for b in bad[:10]:
            fail(f'utility bar drift: {b}')
    elif checked:
        ok(f'utility bar = single timpaemi.com brand link on all {checked} chrome pages')
    else:
        fail('no pages with utility-scroll found')


def audit_legacy_network_chrome_absent() -> None:
    """No page may carry the old footer network grid or sister dns-prefetch block."""
    markers = (
        'footer-network-heading',
        'footer-network-details',
        '<ul class="footer-grid">',
        '-SITE PATTAYA NETWORK',
    )
    bad = []
    for f in site_html_files():
        html = f.read_text(encoding='utf-8')
        hit = [m for m in markers if m in html]
        if hit:
            bad.append(f'{f.relative_to(ROOT)}: {hit}')
            continue
        stale = sorted({
            d.lower()
            for d in re.findall(r'<link rel="dns-prefetch" href="https://([^/"]+)">', html)
            if d.lower() in LEGACY_SISTER_DOMAINS
        })
        if stale:
            bad.append(f'{f.relative_to(ROOT)}: sister dns-prefetch {stale}')
    if bad:
        for b in bad[:10]:
            fail(f'legacy network chrome: {b}')
    else:
        ok('no legacy network footer grid or sister dns-prefetch on any page')


def audit_youtube_links() -> None:
    bad = []
    for f in site_html_files():
        for m in re.finditer(r'https://(?:www\.)?youtube\.com/[^"\s<]+', f.read_text(encoding='utf-8')):
            url = m.group(0)
            if '@timpaemi' not in url and 'youtube.com/@' in url:
                bad.append((str(f.relative_to(ROOT)), url))
    if bad:
        for f, u in bad[:10]:
            fail(f'non-@timpaemi YouTube URL in {f}: {u}')
    else:
        ok('YouTube links point to @timpaemi')


def probe_sitemaps() -> None:
    if os.environ.get('SKIP_NETWORK_PROBE') == '1':
        warn('network sitemap probe skipped (SKIP_NETWORK_PROBE=1)')
        return
    manifest = load_manifest()
    for site in manifest['live']:
        url = f'https://{site["domain"]}/sitemap.xml'
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'PattayaStream-NetworkAudit/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status >= 400:
                    warn(f'{url} returned HTTP {resp.status}')
                else:
                    ok(f'{url} reachable')
        except urllib.error.HTTPError as e:
            warn(f'{url} HTTP {e.code}')
        except Exception as e:
            warn(f'{url} unreachable: {e}')


def main() -> int:
    print('=== PATTAYA VILLA STREAM NETWORK AUDIT (dismantled-chrome guard) ===\n')
    audit_sitemap_network_index()
    audit_utility_bar_links()
    audit_legacy_network_chrome_absent()
    audit_youtube_links()
    probe_sitemaps()
    print()
    if warnings:
        print(f'Warnings: {len(warnings)}')
        for w in warnings:
            print(f'  - {w}')
    if failures:
        print(f'\nCritical failures: {len(failures)}')
        for f in failures:
            print(f'  - {f}')
        return 1
    print('\nNETWORK AUDIT: PASSED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
