#!/usr/bin/env python3
"""PATTAYA VILLA STREAM — SEO audit (CI + local). Exit 1 on critical failures."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NS = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

INDEXED = {'/', '/about/', '/support/', '/format/', '/faq/', '/code/'}
NOINDEX_OK = {'/community/'}
HTML_PAGES = [
    'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
    'code/index.html', 'faq/index.html', 'community/index.html', '404.html', 'offline.html',
]

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


def audit_sitemap() -> None:
    path = ROOT / 'sitemap.xml'
    if not path.exists():
        fail('sitemap.xml missing')
        return
    tree = ET.parse(path)
    urls = [loc.text.strip() for loc in tree.findall('.//sm:loc', NS)]
    if not urls:
        urls = [loc.text.strip() for loc in tree.findall('.//{*}loc')]
    expected = {f'https://pattayastream.com{p}' if p != '/' else 'https://pattayastream.com/' for p in INDEXED}
    found = set(urls)
    missing = expected - found
    extra = found - expected
    if missing:
        fail(f'sitemap missing URLs: {sorted(missing)}')
    if extra:
        fail(f'sitemap has unexpected URLs: {sorted(extra)}')
    if '/community/' in ' '.join(urls):
        fail('sitemap must not include /community/ (noindex)')
    if not missing and not extra:
        ok(f'sitemap has {len(urls)} indexed URLs')


def audit_robots() -> None:
    text = (ROOT / 'robots.txt').read_text(encoding='utf-8')
    if 'Sitemap: https://pattayastream.com/sitemap.xml' not in text:
        fail('robots.txt missing main sitemap directive')
    else:
        ok('robots.txt sitemap directive')


def audit_indexnow() -> None:
    key_file = ROOT / 'psindex2026pattayastreamkey.txt'
    if not key_file.exists():
        fail('IndexNow key file missing')
        return
    key = key_file.read_text(encoding='utf-8').strip()
    if key != 'psindex2026pattayastreamkey':
        fail('IndexNow key file content mismatch')
    else:
        ok('IndexNow key file present')


def audit_canonicals() -> None:
    for rel in HTML_PAGES:
        if rel in ('404.html', 'offline.html'):
            continue
        html = (ROOT / rel).read_text(encoding='utf-8')
        if 'rel="canonical"' not in html:
            fail(f'{rel}: missing canonical')
            continue
        m = re.search(r'<link rel="canonical" href="(https://pattayastream.com[^"]+)"', html)
        if not m:
            fail(f'{rel}: canonical not parseable')


def audit_internal_links() -> None:
    inbound: dict[str, set[str]] = {p: set() for p in INDEXED}
    for rel in HTML_PAGES:
        if rel in ('404.html', 'offline.html'):
            continue
        html = (ROOT / rel).read_text(encoding='utf-8')
        for m in re.finditer(r'href="(/[^"#?][^"]*)"', html):
            base = m.group(1)
            if not base.endswith('/') and base.count('/') == 1:
                base += '/'
            if base in INDEXED:
                inbound[base].add(rel)
    if len(inbound['/about/']) < 3:
        warn(f'/about/ weak inbound ({len(inbound["/about/"])} pages) — target 4+')
    else:
        ok(f'/about/ inbound from {len(inbound["/about/"])} pages')
    for p in INDEXED:
        if p == '/':
            continue
        if not inbound[p]:
            fail(f'{p} has zero inbound internal links')


def audit_faq_schema() -> None:
    html = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    details_count = len(re.findall(r'<details name="faq"', html))
    for block in re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.DOTALL):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        graph = data.get('@graph', [data])
        for node in graph:
            if node.get('@type') == 'FAQPage':
                q_count = len(node.get('mainEntity', []))
                if q_count != details_count:
                    fail(f'FAQ mismatch: HTML={details_count} JSON-LD={q_count}')
                else:
                    ok(f'FAQ parity: {q_count} questions')
                return
    fail('FAQPage schema not found')


def audit_date_modified() -> None:
    stale = '2026-05-27'
    for rel in HTML_PAGES:
        if rel in ('404.html', 'offline.html'):
            continue
        text = (ROOT / rel).read_text(encoding='utf-8')
        if stale in text:
            warn(f'{rel} still references {stale}')


def main() -> int:
    print('=== PATTAYA VILLA STREAM SEO AUDIT ===\n')
    audit_sitemap()
    audit_robots()
    audit_indexnow()
    audit_canonicals()
    audit_internal_links()
    audit_faq_schema()
    audit_date_modified()
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
    print('\nSEO AUDIT: PASSED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
