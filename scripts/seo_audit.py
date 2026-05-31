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
    sitemap = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    m = re.search(r'<lastmod>(\d{4}-\d{2}-\d{2})</lastmod>', sitemap)
    if not m:
        warn('sitemap.xml lastmod not found')
        return
    expected = m.group(1)
    expected_iso = f'{expected}T00:00:00+07:00'
    indexed = [
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html',
    ]
    stale = []
    for rel in indexed:
        text = (ROOT / rel).read_text(encoding='utf-8')
        if expected_iso in text or f'"dateModified":"{expected}"' in text:
            continue
        stale.append(rel)
    if stale:
        fail(f'dateModified not synced to sitemap lastmod ({expected}): {stale}')
    else:
        ok(f'dateModified synced to {expected} on indexed pages')


def audit_faq_mesh_links() -> None:
    faq = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    if faq.count('href="/format/"') < 3:
        warn('FAQ has fewer than 3 links to /format/')
    if faq.count('href="/code/"') < 3:
        warn('FAQ has fewer than 3 links to /code/')
    else:
        ok('FAQ format + code mesh links wired')


DEDICATED_OG = {
    'about/index.html': 'og-about.jpg',
    'faq/index.html': 'og-faq.jpg',
    'code/index.html': 'og-code.jpg',
}


def audit_dedicated_og() -> None:
    for rel, og in DEDICATED_OG.items():
        html = (ROOT / rel).read_text(encoding='utf-8')
        m = re.search(r'property="og:image" content="https://pattayastream.com/assets/og/([^"]+)"', html)
        if not m or m.group(1) != og:
            fail(f'{rel}: og:image must be {og}')
        if not (ROOT / 'assets' / 'og' / og).is_file():
            fail(f'missing asset assets/og/{og}')
    ok('dedicated OG images on about, faq, code')


def audit_sitemap_og_images() -> None:
    text = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    pairs = {
        '/about/': 'og-about.jpg',
        '/faq/': 'og-faq.jpg',
        '/code/': 'og-code.jpg',
    }
    for path, og in pairs.items():
        block = re.search(rf'<loc>https://pattayastream.com{re.escape(path)}</loc>.*?</url>', text, re.DOTALL)
        if not block or og not in block.group(0):
            fail(f'sitemap {path} missing image {og}')
    ok('sitemap OG images match dedicated assets')


def audit_og_file_sizes() -> None:
    max_bytes = 80_000
    og_dir = ROOT / 'assets' / 'og'
    for f in og_dir.glob('*.jpg'):
        size = f.stat().st_size
        if size > max_bytes:
            warn(f'{f.name} is {size:,} bytes — target under {max_bytes:,}')
    ok('OG image size check complete')


def audit_llms_txt() -> None:
    path = ROOT / '.well-known' / 'llms.txt'
    if not path.exists():
        fail('llms.txt missing')
        return
    text = path.read_text(encoding='utf-8')
    html = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    faq_count = len(re.findall(r'<details name="faq"', html))
    if f'{faq_count} common questions' not in text and f'twenty common questions' not in text.lower():
        # accept spelled-out twenty for 20
        num_words = {17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty'}
        expected = num_words.get(faq_count, str(faq_count))
        if expected not in text.lower():
            fail(f'llms.txt FAQ count stale — expected ~{faq_count} ({expected})')
    if 'pattayastream.com/support/#free' not in text:
        fail('llms.txt missing support/#free deep link')
    ok('llms.txt current')


def audit_support_deep_links() -> None:
    faq = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    if faq.count('/support/#free') < 2:
        warn('FAQ has fewer than 2 links to /support/#free')
    if faq.count('/support/#tip-tonight') < 4:
        warn('FAQ has fewer than 4 links to /support/#tip-tonight')
    else:
        ok('FAQ support deep links wired')


def main() -> int:
    print('=== PATTAYA VILLA STREAM SEO AUDIT ===\n')
    audit_sitemap()
    audit_robots()
    audit_indexnow()
    audit_canonicals()
    audit_internal_links()
    audit_faq_schema()
    audit_dedicated_og()
    audit_sitemap_og_images()
    audit_og_file_sizes()
    audit_llms_txt()
    audit_support_deep_links()
    audit_faq_mesh_links()
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
