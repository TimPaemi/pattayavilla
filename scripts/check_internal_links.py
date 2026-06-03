#!/usr/bin/env python3
"""Validate internal href targets — same logic as preflight.yml."""
from __future__ import annotations

import glob
import re
import sys

KNOWN = {
    '/', '/about/', '/support/', '/community/', '/format/', '/code/', '/faq/',
    '/404', '/404/', '/offline', '/offline/',
    '/manifest.json', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png',
    '/sw.js', '/sitemap.xml', '/robots.txt', '/404.html', '/LICENSE',
}


def main() -> int:
    broken: list[tuple[str, str]] = []
    for f in glob.glob('**/*.html', recursive=True):
        if '_pattayavilla-scaffold' in f:
            continue
        html = open(f, encoding='utf-8').read()
        page_ids = {'#' + m for m in re.findall(r'\bid="([^"]+)"', html)}
        for h in re.findall(r'href="(/[^"]*)"', html):
            base = h.split('#')[0].split('?')[0]
            if base in KNOWN or base.startswith('/assets/'):
                continue
            broken.append((f, h))
        for h in re.findall(r'href="(#[^"]+)"', html):
            if h not in page_ids:
                broken.append((f, h))
    if broken:
        for f, h in broken[:20]:
            print(f'::error file={f}::broken internal link: {h}')
        return 1
    print('Internal links: PASS')
    return 0


if __name__ == '__main__':
    sys.exit(main())
