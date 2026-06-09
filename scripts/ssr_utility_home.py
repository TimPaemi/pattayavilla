#!/usr/bin/env python3
"""SSR ← HOME link + has-utility-home on subpages (prevents mobile CLS from JS injection)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = (
    'about/index.html', 'support/index.html', 'format/index.html',
    'code/index.html', 'faq/index.html', 'community/index.html',
    'watch/index.html', '404.html', '404/index.html',
)

HOME_LINK = '<a href="/" class="utility-home-link" data-gtm="utility_home">\u2190 HOME</a>'
ACTIONS_NEEDLE = '<div class="utility-bar-actions"><span class="live-status'
ACTIONS_REPL = f'<div class="utility-bar-actions">{HOME_LINK}<span class="live-status'


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    orig = text
    if 'class="utility-home-link"' not in text:
        if ACTIONS_NEEDLE not in text:
            print(f'skip {path}: utility-bar-actions pattern missing')
            return False
        text = text.replace(ACTIONS_NEEDLE, ACTIONS_REPL, 1)
    if 'class="has-utility-home"' not in text:
        text = text.replace('<html lang="en">', '<html lang="en" class="has-utility-home">', 1)
    if text != orig:
        path.write_text(text, encoding='utf-8')
        print(f'patched {path.relative_to(ROOT)}')
        return True
    return False


def main() -> int:
    n = sum(1 for rel in PAGES if patch_file(ROOT / rel))
    print(f'SSR utility home: {n} file(s) updated')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
