#!/usr/bin/env python3
"""Validate internal href targets — same logic as preflight.yml."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

KNOWN = {
    '/', '/about/', '/support/', '/community/', '/format/', '/code/', '/faq/',
    '/404', '/404/', '/offline', '/offline/',
    '/manifest.json', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png',
    '/sw.js', '/sitemap.xml', '/robots.txt', '/404.html', '/LICENSE',
}


def norm_route(path: str) -> str:
    if not path or path == '/':
        return '/'
    return path if path.endswith('/') else path + '/'


def file_to_route(rel: str) -> str | None:
    rel = rel.replace('\\', '/')
    if rel == 'index.html':
        return '/'
    if rel == '404.html':
        return '/404.html'
    m = re.fullmatch(r'([^/]+)/index\.html', rel)
    if m:
        return f'/{m.group(1)}/'
    if rel == 'offline/index.html':
        return '/offline/'
    return None


def html_files() -> list[Path]:
    return [
        p for p in ROOT.glob('**/*.html')
        if '_pattayavilla-scaffold' not in p.parts
    ]


def collect_route_ids() -> dict[str, set[str]]:
    routes: dict[str, set[str]] = {}
    for path in html_files():
        rel = str(path.relative_to(ROOT)).replace('\\', '/')
        route = file_to_route(rel)
        if not route:
            continue
        html = path.read_text(encoding='utf-8')
        routes[route] = {'#' + m for m in re.findall(r'\bid="([^"]+)"', html)}
    return routes


def check_links() -> list[tuple[str, str]]:
    broken: list[tuple[str, str]] = []
    route_ids = collect_route_ids()
    for path in html_files():
        rel = str(path.relative_to(ROOT)).replace('\\', '/')
        html = path.read_text(encoding='utf-8')
        page_ids = {'#' + m for m in re.findall(r'\bid="([^"]+)"', html)}
        for h in re.findall(r'href="(/[^"]*)"', html):
            base = h.split('#')[0].split('?')[0]
            frag = h.split('#', 1)[1] if '#' in h else ''
            if base in KNOWN or base.startswith('/assets/'):
                if frag:
                    target = route_ids.get(norm_route(base))
                    frag_id = '#' + frag.split('?')[0]
                    if target is not None and frag_id not in target:
                        broken.append((rel, h))
                continue
            broken.append((rel, h))
        for h in re.findall(r'href="(#[^"]+)"', html):
            if h not in page_ids:
                broken.append((rel, h))
    return broken


def main() -> int:
    broken = check_links()
    if broken:
        for f, h in broken[:20]:
            print(f'::error file={f}::broken internal link: {h}')
        return 1
    print('Internal links: PASS')
    return 0


if __name__ == '__main__':
    sys.exit(main())
