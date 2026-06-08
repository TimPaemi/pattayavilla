#!/usr/bin/env python3
"""Patch HTML + sw.js asset ?v= strings from asset_versions.py."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from asset_versions import CORE_V, HOME_V, LIVE_JS_V, SUB_V, SW_VERSION  # noqa: E402

REPLACEMENTS = [
    (re.compile(r'pv-core\.css\?v=\d+'), f'pv-core.css?v={CORE_V}'),
    (re.compile(r'pv-sub\.css\?v=\d+'), f'pv-sub.css?v={SUB_V}'),
    (re.compile(r'pv-home\.css\?v=\d+'), f'pv-home.css?v={HOME_V}'),
    (re.compile(r'pv-live\.js\?v=\d+'), f'pv-live.js?v={LIVE_JS_V}'),
]


def patch_text(text: str, is_sw: bool = False) -> str:
    for pat, rep in REPLACEMENTS:
        text = pat.sub(rep, text)
    if is_sw:
        text = re.sub(r"const VERSION = '[^']+'", f"const VERSION = '{SW_VERSION}'", text)
    return text


def main() -> int:
    paths = list(ROOT.glob('**/*.html')) + [ROOT / 'sw.js']
    for path in paths:
        if any(p in path.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        text = path.read_text(encoding='utf-8')
        patched = patch_text(text, is_sw=path.name == 'sw.js')
        if patched != text:
            path.write_text(patched, encoding='utf-8')
            print(f'patched {path.relative_to(ROOT).as_posix()}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
