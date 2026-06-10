#!/usr/bin/env python3
"""Move the pv-live.js runtime-injected stylesheet into static CSS.

The injected <style> restyled the hero h1 (font-size!important, text-wrap,
text-box) when JS executed (~4.5s on throttled mobile), so Lighthouse counted
the LCP at TTI on every page. Making the layer static means the hero paints
once. The block lands at the END of pv-sub.css and pv-home.css (the last
stylesheet on each page type) to preserve the injected-last cascade position.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'assets/js/pv-live.js'
MARK_START = '/* === PV RUNTIME LAYER (formerly injected by pv-live.js) === */'
MARK_END = '/* === END PV RUNTIME LAYER === */'


def extract_css(js: str) -> str:
    m = re.search(r"s\.textContent = \[\n(.*?)\n\s*\]\.join\('\\n'\);", js, re.S)
    if not m:
        sys.exit('CSS array not found in pv-live.js')
    out: list[str] = []
    for raw in m.group(1).split('\n'):
        line = raw.strip()
        if not line:
            continue
        if line.startswith(('/*', '*')):
            out.append(line)
            continue
        sm = re.fullmatch(r"'(.*)',?", line)
        if not sm:
            sys.exit(f'unparseable array line: {line!r}')
        out.append(sm.group(1).replace("\\'", "'"))
    return '\n'.join(out)


def strip_injector(js: str) -> str:
    m = re.search(r"\n  function injectStyles\(\)\{.*?\n  \}\n", js, re.S)
    if not m:
        sys.exit('injectStyles function not found')
    js = js.replace(m.group(0), '\n')
    js = js.replace('    injectStyles();\n', '')
    if 'injectStyles' in js:
        sys.exit('injectStyles still referenced after strip')
    return js


def append_layer(css_path: Path, layer: str) -> None:
    t = css_path.read_text(encoding='utf-8')
    if MARK_START in t:
        t = re.sub(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END), '', t, flags=re.S).rstrip() + '\n'
    t = t.rstrip() + f'\n\n{MARK_START}\n{layer}\n{MARK_END}\n'
    css_path.write_text(t, encoding='utf-8')
    print(f'runtime layer -> {css_path.relative_to(ROOT)}')


def main() -> int:
    js = JS.read_text(encoding='utf-8')
    layer = extract_css(js)
    print(f'extracted {len(layer)} chars of CSS')
    JS.write_text(strip_injector(js), encoding='utf-8')
    print('injectStyles removed from pv-live.js')
    append_layer(ROOT / 'assets/css/pv-sub.css', layer)
    append_layer(ROOT / 'assets/css/pv-home.css', layer)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
