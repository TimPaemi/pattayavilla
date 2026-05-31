#!/usr/bin/env python3
"""Single source of truth: network_manifest.json -> bars, footers, sitemap-network."""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = Path(__file__).resolve().parent / 'network_manifest.json'

# Utility bar order (pattayastream.com excluded — this site)
BAR_ORDER = [
    'pattaya-authority.com',
    'timpaemi.com',
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
]

SITE = {
    'pattaya-authority.com': {
        'bar_label': 'Authority',
        'footer_title': 'Pattaya Authority',
        'footer_span': 'Parent agency · the empire HQ',
        'href': 'https://pattaya-authority.com/work/pattaya-stream/',
        'bar_rel': 'noopener noreferrer publisher',
        'footer_rel': 'noopener noreferrer publisher',
        'bar_class': 'is-brand',
    },
    'timpaemi.com': {
        'bar_label': 'TIMPAEMI',
        'footer_title': 'TIMPAEMI',
        'footer_span': 'The Tim &amp; Paemi brand site',
        'href': 'https://timpaemi.com/',
        'bar_rel': 'noopener noreferrer author',
        'footer_rel': 'noopener noreferrer author',
        'bar_class': 'is-brand',
    },
    'pattaya-restaurant-guide.com': {
        'bar_label': 'Restaurants',
        'footer_title': 'Restaurant Guide',
        'footer_span': 'Where to eat in Pattaya',
        'href': 'https://pattaya-restaurant-guide.com/',
    },
    'pattayavisahelp.com': {
        'bar_label': 'Visa Help',
        'footer_title': 'Visa Help',
        'footer_span': 'Thailand visa support',
        'href': 'https://pattayavisahelp.com/',
    },
    'pattaya-gym.com': {
        'bar_label': 'Gym',
        'footer_title': 'Pattaya Gym',
        'footer_span': 'Gyms + fitness scene',
        'href': 'https://pattaya-gym.com/',
    },
    'pattaya-school-guide.com': {
        'bar_label': 'Schools',
        'footer_title': 'School Guide',
        'footer_span': 'International schools',
        'href': 'https://pattaya-school-guide.com/',
    },
    'pattaya-coffee.com': {
        'bar_label': 'Coffee',
        'footer_title': 'Pattaya Coffee',
        'footer_span': 'Cafes + coffee culture',
        'href': 'https://pattaya-coffee.com/',
    },
    'pattaya-medical.com': {
        'bar_label': 'Medical',
        'footer_title': 'Pattaya Medical',
        'footer_span': 'Healthcare + hospitals',
        'href': 'https://pattaya-medical.com/',
    },
    'pattayapets.com': {
        'bar_label': 'Pets',
        'footer_title': 'PattayaPets',
        'footer_span': 'Pets, vets, animal services',
        'href': 'https://pattayapets.com/',
    },
    'pattaya-vehicle-rentals.com': {
        'bar_label': 'Rentals',
        'footer_title': 'Vehicle Rentals',
        'footer_span': 'Bikes, cars, scooters',
        'href': 'https://pattaya-vehicle-rentals.com/',
    },
    'pattayapersonaltrainer.com': {
        'bar_label': 'Personal Trainer',
        'footer_title': 'Personal Trainer',
        'footer_span': 'Private fitness in Pattaya',
        'href': 'https://pattayapersonaltrainer.com/',
    },
    'pattayaolympian.com': {
        'bar_label': 'Olympian',
        'footer_title': 'Olympian',
        'footer_span': 'Greek souvlaki in Pattaya',
        'href': 'https://pattayaolympian.com/',
    },
    'mrweoutside.com': {
        'bar_label': 'Mr. We Outside',
        'footer_title': 'Mr. We Outside',
        'footer_span': 'Outdoor Pattaya content',
        'href': 'https://mrweoutside.com/',
    },
}


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding='utf-8'))


def expected_bar_domains(manifest: dict) -> list[str]:
    live = {s['domain'] for s in manifest['live']}
    missing = [d for d in BAR_ORDER if d not in live]
    extra = live - set(BAR_ORDER) - {'pattayastream.com'}
    if missing:
        raise SystemExit(f'manifest missing BAR_ORDER domains: {missing}')
    if extra:
        raise SystemExit(f'manifest has domains not in BAR_ORDER: {sorted(extra)}')
    return BAR_ORDER


def build_utility_scroll() -> str:
    lines = []
    for domain in BAR_ORDER:
        meta = SITE[domain]
        cls = f' class="{meta["bar_class"]}"' if meta.get('bar_class') else ''
        rel = meta.get('bar_rel', 'noopener noreferrer')
        lines.append(
            f'    <a href="{meta["href"]}" target="_blank" rel="{rel}"{cls}>{meta["bar_label"]}</a>'
        )
    return '\n'.join(lines) + '\n'


def build_footer_grid() -> str:
    lines = []
    for domain in BAR_ORDER:
        meta = SITE[domain]
        rel = meta.get('footer_rel', 'noopener noreferrer')
        lines.append(
            f'        <li><a href="{meta["href"]}" target="_blank" rel="{rel}">'
            f'<strong>{meta["footer_title"]}</strong><span>{meta["footer_span"]}</span></a></li>'
        )
    return '\n'.join(lines) + '\n'


def build_dns_prefetch() -> str:
    lines = []
    for domain in BAR_ORDER:
        lines.append(f'<link rel="dns-prefetch" href="https://{domain}">')
    return '\n'.join(lines) + '\n'


def build_sitemap_network(manifest: dict) -> str:
    today = date.today().isoformat()
    count = len(manifest['live'])
    entries = []
    for site in manifest['live']:
        domain = site['domain']
        entries.append(
            f'  <sitemap>\n'
            f'    <loc>https://{domain}/sitemap.xml</loc>\n'
            f'    <lastmod>{today}</lastmod>\n'
            f'  </sitemap>'
        )
    body = '\n'.join(entries)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<!-- PATTAYA VILLA STREAM · Network sitemap index — {count}-site TIMPAEMI Pattaya network -->\n'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{body}\n'
        '</sitemapindex>\n'
    )


def html_files() -> list[Path]:
    out = []
    for path in sorted(ROOT.glob('**/*.html')):
        if any(p in path.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        out.append(path)
    return out


def bar_domains(text: str) -> list[str]:
    bar = re.search(r'utility-scroll">\s*(.*?)\s*</div>', text, re.DOTALL)
    if not bar:
        return []
    return re.findall(r'href="https://([^/"\'>]+)', bar.group(1))


def patch_html(text: str, site_count: int) -> tuple[str, bool]:
    changed = False
    utility = build_utility_scroll()
    footer = build_footer_grid()
    dns = build_dns_prefetch()

    new, n = re.subn(
        r'(<div class="utility-scroll">\n)(.*?)(\s*</div>\n</div>)',
        rf'\1{utility}\3',
        text,
        count=1,
        flags=re.DOTALL,
    )
    if n:
        text = new
        changed = True

    new, n = re.subn(
        r'(<h3 id="footer-network-heading" class="footer-h">★ THE \d+-SITE PATTAYA NETWORK</h3>\n\s*<ul class="footer-grid">\n)(.*?)(\s*</ul>)',
        rf'\1{footer}\3',
        text,
        count=1,
        flags=re.DOTALL,
    )
    if n:
        text = new
        changed = True

    strap = f'// THE PATTAYA AUTHORITY NETWORK · {site_count} PROPERTIES'
    new, n = re.subn(
        r'// THE PATTAYA AUTHORITY NETWORK · \d+ PROPERTIES',
        strap,
        text,
    )
    if n:
        text = new
        changed = True

    new, n = re.subn(
        r'(<link rel="dns-prefetch" href="https://pattaya-authority.com">\n)(.*?)(\n<script)',
        rf'\1{dns}\3',
        text,
        count=1,
        flags=re.DOTALL,
    )
    if n:
        text = new
        changed = True

    return text, changed


def sync_sitemap_network(manifest: dict, fix: bool) -> bool:
    path = ROOT / 'sitemap-network.xml'
    expected = build_sitemap_network(manifest)
    current = path.read_text(encoding='utf-8')
    ok = current == expected
    if not ok and fix:
        path.write_text(expected, encoding='utf-8')
        print(f'  OK: sitemap-network.xml synced ({len(manifest["live"])} sites)')
    return ok or fix


def sync_html(manifest: dict, fix: bool) -> tuple[bool, int]:
    site_count = len(manifest['live'])
    expected_bar_domains(manifest)
    expected_domains = BAR_ORDER
    all_ok = True
    touched = 0

    for path in html_files():
        text = path.read_text(encoding='utf-8')
        if 'utility-scroll' not in text:
            continue
        patched, changed = patch_html(text, site_count)
        drift = bar_domains(text) != expected_domains or bar_domains(patched) != expected_domains
        if '// THE PATTAYA AUTHORITY NETWORK · 11 PROPERTIES' in text:
            drift = True
        if drift:
            all_ok = False
            if not fix:
                print(f'  DRIFT: {path.relative_to(ROOT)} network chrome out of sync')
        if fix and (changed or drift):
            path.write_text(patched, encoding='utf-8')
            print(f'  OK: {path.relative_to(ROOT)} network blocks synced')
            touched += 1

    return all_ok, touched


def main() -> int:
    parser = argparse.ArgumentParser(description='Sync network manifest to site chrome')
    parser.add_argument('--check', action='store_true', help='Exit 1 if anything drifts')
    parser.add_argument('--fix', action='store_true', help='Rewrite drifted files')
    args = parser.parse_args()
    fix = args.fix or not args.check

    manifest = load_manifest()
    print('=== NETWORK BAR SYNC ===\n')

    sitemap_ok = sync_sitemap_network(manifest, fix=fix)
    html_ok, touched = sync_html(manifest, fix=fix)

    if fix and touched:
        print(f'\nSynced {touched} HTML file(s)')
    if sitemap_ok and html_ok:
        print('\nNETWORK SYNC: OK')
        return 0
    if not fix:
        print('\nNETWORK SYNC: DRIFT — run python scripts/sync_network_bar.py --fix')
        return 1
    print('\nNETWORK SYNC: FIXED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
