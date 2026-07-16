#!/usr/bin/env python3
"""Guard the dismantled network chrome: single-brand utility bar only.

History: this repo used to carry a sitewide sister-domain "network bar"
(13 cross-site links), a footer network grid and a sitemap-network.xml
index, all synced from network_manifest.json. That cross-site link scheme
was dismantled for SEO on 2026-07-16. The canonical chrome is now:

  * utility bar  -> exactly ONE brand link: https://timpaemi.com/
  * footer       -> compact publisher credit (pattaya-authority.com), no grid
  * sitemap-network.xml -> deleted, must never come back

This script now enforces that end state:
  --check  exit 1 if any page drifts (extra bar links, legacy footer grid,
           resurrected sitemap-network.xml, stale sister dns-prefetch)
  --fix    rewrite the bar to the canonical single link and strip legacy
           sister-domain chrome

Do NOT extend this script to re-inject sister-domain link lists.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The one canonical utility-bar link (brand site).
BAR_LINK = (
    '    <a href="https://timpaemi.com/" target="_blank" '
    'rel="noopener noreferrer author" class="is-brand">TIMPAEMI</a>'
)
ALLOWED_BAR_DOMAINS = ['timpaemi.com']

# Old sister-domain list — kept ONLY so we can detect/remove regressions.
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

LEGACY_FOOTER_MARKERS = (
    'footer-network-heading',
    'footer-network-details',
    '<ul class="footer-grid">',
    '-SITE PATTAYA NETWORK',
)


def html_files() -> list[Path]:
    out = []
    for path in sorted(ROOT.glob('**/*.html')):
        if any(p in path.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        out.append(path)
    return out


def bar_block(text: str) -> str | None:
    m = re.search(r'<div class="utility-scroll">\s*(.*?)\s*</div>', text, re.DOTALL)
    return m.group(1) if m else None


def bar_domains(text: str) -> list[str]:
    block = bar_block(text)
    if block is None:
        return []
    return [d.lower() for d in re.findall(r'href="https://([^/"\'>]+)', block)]


def build_bar(text: str) -> str:
    """Rewrite the utility-scroll block to the canonical single brand link."""
    return re.sub(
        r'(<div class="utility-scroll">)\s*.*?(\s*</div>)',
        rf'\1\n{BAR_LINK}\2',
        text,
        count=1,
        flags=re.DOTALL,
    )


def strip_legacy_prefetch(text: str) -> str:
    """Drop dns-prefetch hints for dismantled sister domains."""
    def _keep(m: re.Match) -> str:
        return '' if m.group(1).lower() in LEGACY_SISTER_DOMAINS else m.group(0)

    return re.sub(
        r'<link rel="dns-prefetch" href="https://([^/"]+)">\n?',
        _keep,
        text,
    )


def legacy_prefetch_domains(text: str) -> list[str]:
    return sorted({
        d.lower()
        for d in re.findall(r'<link rel="dns-prefetch" href="https://([^/"]+)">', text)
        if d.lower() in LEGACY_SISTER_DOMAINS
    })


def legacy_footer_markers(text: str) -> list[str]:
    return [m for m in LEGACY_FOOTER_MARKERS if m in text]


def check_sitemap_network(fix: bool) -> bool:
    """sitemap-network.xml was deleted in the dismantle — it must stay gone."""
    path = ROOT / 'sitemap-network.xml'
    if not path.exists():
        print('  OK: sitemap-network.xml absent (network sitemap index dismantled)')
        return True
    if fix:
        path.unlink()
        print('  OK: sitemap-network.xml deleted (legacy network sitemap index)')
        return True
    print('  DRIFT: sitemap-network.xml exists — legacy network sitemap index must stay deleted')
    return False


def sync_html(fix: bool) -> tuple[bool, int]:
    all_ok = True
    touched = 0

    for path in html_files():
        text = path.read_text(encoding='utf-8')
        if 'utility-scroll' not in text:
            continue
        rel = path.relative_to(ROOT)
        problems: list[str] = []

        if bar_domains(text) != ALLOWED_BAR_DOMAINS:
            problems.append(
                f'utility bar must contain exactly one link (timpaemi.com), found {bar_domains(text)}'
            )
        stale = legacy_prefetch_domains(text)
        if stale:
            problems.append(f'stale sister dns-prefetch: {stale}')
        markers = legacy_footer_markers(text)
        if markers:
            problems.append(f'legacy network footer markers present: {markers}')

        if not problems:
            continue
        all_ok = False
        if not fix:
            for p in problems:
                print(f'  DRIFT: {rel}: {p}')
            continue

        patched = build_bar(text)
        patched = strip_legacy_prefetch(patched)
        if legacy_footer_markers(patched):
            # Never auto-rebuild footers — the legacy grid needs manual removal.
            print(f'  FAIL: {rel}: legacy network footer grid present — remove it manually')
            continue
        path.write_text(patched, encoding='utf-8')
        print(f'  OK: {rel} network chrome normalised')
        touched += 1

    return all_ok, touched


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Enforce the dismantled network chrome (single-brand bar, no sister lists)'
    )
    parser.add_argument('--check', action='store_true', help='Exit 1 if anything drifts')
    parser.add_argument('--fix', action='store_true', help='Rewrite drifted files')
    args = parser.parse_args()
    fix = args.fix or not args.check

    print('=== NETWORK BAR GUARD (single-brand bar, sister lists dismantled) ===\n')

    sitemap_ok = check_sitemap_network(fix=fix)
    html_ok, touched = sync_html(fix=fix)

    if fix and touched:
        print(f'\nNormalised {touched} HTML file(s)')

    if fix:
        # Re-verify after fixing: legacy footers cannot be auto-fixed.
        sitemap_ok = not (ROOT / 'sitemap-network.xml').exists()
        html_ok, _ = sync_html(fix=False)

    if sitemap_ok and html_ok:
        print('\nNETWORK GUARD: OK')
        return 0
    if not fix:
        print('\nNETWORK GUARD: DRIFT — run python scripts/sync_network_bar.py --fix')
    else:
        print('\nNETWORK GUARD: UNRESOLVED DRIFT (manual cleanup required)')
    return 1


if __name__ == '__main__':
    sys.exit(main())
