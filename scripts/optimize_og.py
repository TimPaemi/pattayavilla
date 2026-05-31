#!/usr/bin/env python3
"""Compress OG JPEGs to 1200x630, target ~55KB each."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print('SKIP: Pillow not installed')
    sys.exit(0)

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'og'
TARGET = 55_000
FILES = ['og-about.jpg', 'og-faq.jpg', 'og-code.jpg', 'og-home.jpg', 'og-support.jpg', 'og-format.jpg']


def compress(path: Path) -> None:
    img = Image.open(path).convert('RGB')
    if img.size != (1200, 630):
        img = img.resize((1200, 630), Image.LANCZOS)
    for q in (82, 75, 68, 60, 52):
        img.save(path, 'JPEG', quality=q, optimize=True)
        size = path.stat().st_size
        if size <= TARGET:
            print(f'  {path.name}: {size:,} bytes @ q={q}')
            return
    print(f'  {path.name}: {path.stat().st_size:,} bytes (min quality)')


def main() -> int:
    print('=== OG image optimize ===')
    for name in FILES:
        p = ROOT / name
        if p.is_file():
            compress(p)
        else:
            print(f'  skip {name} (missing)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
