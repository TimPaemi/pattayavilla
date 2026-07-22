#!/usr/bin/env python3
"""Verify HTML + sw.js asset ?v= query strings match scripts/asset_versions.py."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from asset_versions import (  # noqa: E402
    ANALYTICS_V,
    CORE_V,
    HOME_V,
    LIVE_JS_V,
    LIVE_LITE_JS_V,
    SUB_V,
    SW_VERSION,
)

VERSIONED = {
    'css/pv-core.css': CORE_V,
    'css/pv-sub.css': SUB_V,
    'css/pv-home.css': HOME_V,
    'js/pv-live.js': LIVE_JS_V,
    'js/pv-live-lite.js': LIVE_LITE_JS_V,
    'js/pv-analytics.js': ANALYTICS_V,
}


def check_html() -> list[str]:
    errors: list[str] = []
    for path in ROOT.glob('**/*.html'):
        if '_pattayavilla-scaffold' in path.parts:
            continue
        rel = str(path.relative_to(ROOT)).replace('\\', '/')
        text = path.read_text(encoding='utf-8')
        for m in re.finditer(r'/assets/(css|js)/([a-z0-9._-]+\.(?:css|js))\?v=(\d+)', text):
            key = f'{m.group(1)}/{m.group(2)}'
            found = m.group(3)
            expected = VERSIONED.get(key)
            if expected and found != expected:
                errors.append(f'{rel}: {key}?v={found} expected v={expected}')
    return errors


def check_sw() -> list[str]:
    errors: list[str] = []
    sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
    if f"const VERSION = '{SW_VERSION}'" not in sw:
        errors.append(f'sw.js VERSION must be {SW_VERSION!r}')
    for key, ver in VERSIONED.items():
        needle = f'/assets/{key}?v={ver}'
        if needle not in sw:
            errors.append(f'sw.js PRECACHE missing {needle}')
    return errors


def main() -> int:
    errors = check_html() + check_sw()
    if errors:
        for e in errors[:25]:
            print(f'::error::{e}')
        return 1
    print(f'Asset versions: PASS (pv-live v{LIVE_JS_V}, pv-core v{CORE_V}, sw {SW_VERSION})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
