#!/usr/bin/env python3
"""Replace .back-bar with visible .page-breadcrumb on subpages."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = {
    'about/index.html': 'About',
    'support/index.html': 'Support',
    'format/index.html': 'Format',
    'faq/index.html': 'FAQ',
    'code/index.html': 'Chat Code',
    'community/index.html': 'Community',
    'watch/index.html': 'Watch Live',
    '404.html': 'Page Not Found',
    '404/index.html': 'Page Not Found',
}

BACK_BAR = re.compile(
    r'<div class="back-bar">\s*'
    r'<a href="/">← BACK TO PATTAYA VILLA STREAM</a>\s*'
    r'</div>',
    re.S,
)


def crumb(label: str) -> str:
    return (
        '<nav class="page-breadcrumb" aria-label="Breadcrumb">\n'
        '  <ol>\n'
        '    <li><a href="/" data-gtm="breadcrumb_home">Home</a></li>\n'
        f'    <li><span aria-current="page">{label}</span></li>\n'
        '  </ol>\n'
        '</nav>'
    )


def main() -> int:
    for rel, label in PAGES.items():
        path = ROOT / rel
        text = path.read_text(encoding='utf-8')
        if 'class="page-breadcrumb"' in text:
            print(f'skip (already breadcrumb): {rel}')
            continue
        if not BACK_BAR.search(text):
            print(f'WARN: back-bar not found: {rel}')
            continue
        text = BACK_BAR.sub(crumb(label), text, count=1)
        path.write_text(text, encoding='utf-8')
        print(f'OK: {rel} -> {label}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
