#!/usr/bin/env python3
"""Sync inlined critical CSS into HTML pages. Run after editing pv-critical-*.css files."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

HOME_CSS = ROOT / 'assets/css/pv-critical-home.css'
CHROME_CSS = ROOT / 'assets/css/pv-critical-chrome.css'
OFFLINE_CSS = ROOT / 'assets/css/pv-critical-offline.css'
INDEX = ROOT / 'index.html'
OFFLINE = ROOT / 'offline/index.html'

CHROME_PAGES = (
    'about/index.html', 'support/index.html', 'format/index.html',
    'code/index.html', 'faq/index.html', 'community/index.html',
    '404.html', '404/index.html',
)

CORE_V = '14'
SUB_V = '10'
HOME_V = '8'


def normalize_css(text: str) -> str:
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return re.sub(r'\s+', ' ', text).strip()


def minify_file(path: Path) -> str:
    return normalize_css(path.read_text(encoding='utf-8'))


def sync_home() -> None:
    css_min = minify_file(HOME_CSS)
    html = INDEX.read_text(encoding='utf-8')
    html = re.sub(
        r'<style id="pv-critical-home">.*?</style>',
        f'<style id="pv-critical-home">{css_min}</style>',
        html,
        count=1,
        flags=re.S,
    )
    INDEX.write_text(html, encoding='utf-8')
    print(f'synced homepage critical CSS ({len(css_min)} bytes)')


def chrome_stylesheet_block(css_min: str) -> str:
    return (
        f'<style id="pv-critical-chrome">{css_min}</style>\n'
        f'<link rel="preload" href="/assets/css/pv-core.css?v={CORE_V}" as="style">\n'
        f'<link rel="stylesheet" href="/assets/css/pv-core.css?v={CORE_V}" media="print" onload="this.media=\'all\'">\n'
        f'<link rel="preload" href="/assets/css/pv-sub.css?v={SUB_V}" as="style">\n'
        f'<link rel="stylesheet" href="/assets/css/pv-sub.css?v={SUB_V}" media="print" onload="this.media=\'all\'">\n'
        f'<noscript><link rel="stylesheet" href="/assets/css/pv-core.css?v={CORE_V}">'
        f'<link rel="stylesheet" href="/assets/css/pv-sub.css?v={SUB_V}"></noscript>'
    )


def sync_chrome() -> None:
    css_min = minify_file(CHROME_CSS)
    block = chrome_stylesheet_block(css_min)
    pattern = re.compile(
        r'(?:<style id="pv-critical-chrome">.*?</style>\s*)?'
        r'<link rel="stylesheet" href="/assets/css/pv-core\.css\?v=\d+">\s*'
        r'<link rel="stylesheet" href="/assets/css/pv-sub\.css\?v=\d+">',
        re.S,
    )
    alt_pattern = re.compile(
        r'<style id="pv-critical-chrome">.*?</style>\s*'
        r'<link rel="preload" href="/assets/css/pv-core\.css\?v=\d+" as="style">\s*'
        r'<link rel="stylesheet" href="/assets/css/pv-core\.css\?v=\d+" media="print" onload="this\.media=\'all\'">\s*'
        r'<link rel="preload" href="/assets/css/pv-sub\.css\?v=\d+" as="style">\s*'
        r'<link rel="stylesheet" href="/assets/css/pv-sub\.css\?v=\d+" media="print" onload="this\.media=\'all\'">\s*'
        r'<noscript>.*?</noscript>',
        re.S,
    )
    for rel in CHROME_PAGES:
        path = ROOT / rel
        html = path.read_text(encoding='utf-8')
        if alt_pattern.search(html):
            html = alt_pattern.sub(block, html, count=1)
        elif pattern.search(html):
            html = pattern.sub(block, html, count=1)
        else:
            raise SystemExit(f'stylesheet block not found in {rel}')
        path.write_text(html, encoding='utf-8')
        print(f'synced chrome critical CSS -> {rel}')


def offline_stylesheet_block(css_min: str) -> str:
    return (
        f'<style id="pv-critical-offline">{css_min}</style>\n'
        f'<link rel="preload" href="/assets/css/pv-core.css?v={CORE_V}" as="style">\n'
        f'<link rel="stylesheet" href="/assets/css/pv-core.css?v={CORE_V}" media="print" onload="this.media=\'all\'">\n'
        f'<link rel="preload" href="/assets/css/pv-sub.css?v={SUB_V}" as="style">\n'
        f'<link rel="stylesheet" href="/assets/css/pv-sub.css?v={SUB_V}" media="print" onload="this.media=\'all\'">\n'
        f'<noscript><link rel="stylesheet" href="/assets/css/pv-core.css?v={CORE_V}">'
        f'<link rel="stylesheet" href="/assets/css/pv-sub.css?v={SUB_V}"></noscript>'
    )


def sync_offline() -> None:
    css_min = minify_file(OFFLINE_CSS)
    block = offline_stylesheet_block(css_min)
    html = OFFLINE.read_text(encoding='utf-8')
    pattern = re.compile(
        r'(?:<style id="pv-critical-offline">.*?</style>\s*)?'
        r'<link rel="stylesheet" href="/assets/css/pv-core\.css\?v=\d+">\s*'
        r'<link rel="stylesheet" href="/assets/css/pv-sub\.css\?v=\d+">',
        re.S,
    )
    if not pattern.search(html):
        raise SystemExit('stylesheet block not found in offline/index.html')
    html = pattern.sub(block, html, count=1)
    OFFLINE.write_text(html, encoding='utf-8')
    print(f'synced offline critical CSS ({len(css_min)} bytes)')


def check_home() -> bool:
    css_min = minify_file(HOME_CSS)
    html = INDEX.read_text(encoding='utf-8')
    m = re.search(r'<style id="pv-critical-home">(.*?)</style>', html, re.S)
    if not m or normalize_css(m.group(1)) != css_min:
        print('DRIFT: index.html pv-critical-home out of sync')
        return False
    if 'media="print" onload="this.media=\'all\'"' not in html:
        print('DRIFT: index.html missing async stylesheets')
        return False
    return True


def check_chrome() -> bool:
    css_min = minify_file(CHROME_CSS)
    ok = True
    for rel in CHROME_PAGES:
        html = (ROOT / rel).read_text(encoding='utf-8')
        m = re.search(r'<style id="pv-critical-chrome">(.*?)</style>', html, re.S)
        if not m:
            print(f'DRIFT: {rel} missing #pv-critical-chrome')
            ok = False
            continue
        if normalize_css(m.group(1)) != css_min:
            print(f'DRIFT: {rel} pv-critical-chrome out of sync')
            ok = False
        if f'pv-sub.css?v={SUB_V}" media="print" onload' not in html:
            print(f'DRIFT: {rel} missing async pv-sub.css')
            ok = False
    return ok


def check_offline() -> bool:
    css_min = minify_file(OFFLINE_CSS)
    html = OFFLINE.read_text(encoding='utf-8')
    m = re.search(r'<style id="pv-critical-offline">(.*?)</style>', html, re.S)
    if not m:
        print('DRIFT: offline/index.html missing #pv-critical-offline')
        return False
    if normalize_css(m.group(1)) != css_min:
        print('DRIFT: offline/index.html pv-critical-offline out of sync')
        return False
    if 'media="print" onload="this.media=\'all\'"' not in html:
        print('DRIFT: offline/index.html missing async stylesheets')
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--home', action='store_true', help='sync homepage only')
    parser.add_argument('--chrome', action='store_true', help='sync subpages only')
    parser.add_argument('--offline', action='store_true', help='sync offline page only')
    parser.add_argument('--check', action='store_true', help='verify parity, no writes')
    args = parser.parse_args()
    do_all = not args.home and not args.chrome and not args.offline and not args.check

    if args.check:
        home_ok = check_home()
        chrome_ok = check_chrome()
        offline_ok = check_offline()
        if home_ok and chrome_ok and offline_ok:
            print('critical CSS parity: OK')
            return 0
        return 1

    if args.home or do_all:
        sync_home()
    if args.chrome or do_all:
        sync_chrome()
    if args.offline or do_all:
        sync_offline()
    return 0


if __name__ == '__main__':
    sys.exit(main())
