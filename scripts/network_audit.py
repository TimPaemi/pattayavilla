#!/usr/bin/env python3
"""Read-only network audit: manifest parity, outbound links, live sitemap probes."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = Path(__file__).resolve().parent / 'network_manifest.json'

failures: list[str] = []
warnings: list[str] = []


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


def audit_sitemap_network_index() -> None:
    manifest = load_manifest()
    expected = {f'https://{s["domain"]}/sitemap.xml' for s in manifest['live']}
    text = (ROOT / 'sitemap-network.xml').read_text(encoding='utf-8')
    found = set(re.findall(r'<loc>(https://[^<]+/sitemap\.xml)</loc>', text))
    missing = expected - found
    extra = found - expected
    if missing:
        fail(f'sitemap-network.xml missing: {sorted(missing)}')
    if extra:
        fail(f'sitemap-network.xml unexpected: {sorted(extra)}')
    if not missing and not extra:
        ok(f'sitemap-network.xml lists {len(found)} live network sitemaps')
    pending = manifest.get('pending', [])
    if pending:
        warn(f'{len(pending)} pending network repos not in index yet: {[p["repo"] for p in pending]}')


def audit_utility_bar_links() -> None:
    manifest = load_manifest()
    required_domains = {s['domain'] for s in manifest['live'] if s['domain'] != 'pattayastream.com'}
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    bar = re.search(r'utility-scroll">(.*?)</div>', html, re.DOTALL)
    if not bar:
        fail('utility-scroll block not found on homepage')
        return
    linked_domains = set()
    for href in re.findall(r'href="(https://[^"]+)"', bar.group(1)):
        m = re.match(r'https://([^/"\'>]+)', href)
        if m:
            linked_domains.add(m.group(1).lower())
    missing = {d for d in required_domains if d.lower() not in linked_domains}
    if missing:
        fail(f'utility bar missing network domains: {sorted(missing)}')
    else:
        ok(f'utility bar links all {len(required_domains)} sister sites')


def audit_youtube_links() -> None:
    bad = []
    for f in ROOT.glob('**/*.html'):
        if '.git' in f.parts or '_pattayavilla-scaffold' in str(f):
            continue
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
    print('=== PATTAYA VILLA STREAM NETWORK AUDIT ===\n')
    audit_sitemap_network_index()
    audit_utility_bar_links()
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
