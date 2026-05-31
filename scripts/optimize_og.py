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
TARGETS = {
    'og-about.jpg': 55_000,
    'og-faq.jpg': 55_000,
    'og-code.jpg': 55_000,
    'og-home.jpg': 55_000,
    'og-support.jpg': 55_000,
    'og-format.jpg': 55_000,
}


def compress(path: Path, target: int) -> None:
    img = Image.open(path).convert('RGB')
    if img.size != (1200, 630):
        img = img.resize((1200, 630), Image.LANCZOS)
    for q in (82, 75, 68, 60, 52, 45, 38):
        img.save(path, 'JPEG', quality=q, optimize=True)
        size = path.stat().st_size
        if size <= target:
            print(f'  {path.name}: {size:,} bytes @ q={q}')
            return
    print(f'  {path.name}: {path.stat().st_size:,} bytes (min quality)')


def main() -> int:
    print('=== OG image optimize ===')
    for name, target in TARGETS.items():
        p = ROOT / name
        if p.is_file():
            compress(p, target)
        else:
            print(f'  skip {name} (missing)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
