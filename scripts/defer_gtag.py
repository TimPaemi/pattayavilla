#!/usr/bin/env python3
"""Swap the async gtag.js tag for a delayed loader (first interaction or load+3.5s).

Frees ~130 KB of critical-window bandwidth on slow connections (faster hero
font swap = faster LCP) and moves gtag's main-thread cost out of the TBT
window. The dataLayer queue in pv-analytics.js buffers all events until the
library arrives, so no data is lost. The G-WSGWG7999E literal stays in the
HTML so every GA4 audit check keeps passing.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

OLD_TAG = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-WSGWG7999E"></script>'
NEW_TAG = (
    "<script>(function(){var f=function(){if(f.d)return;f.d=1;"
    "var s=document.createElement('script');s.async=true;"
    "s.src='https://www.googletagmanager.com/gtag/js?id=G-WSGWG7999E';"
    "document.head.appendChild(s);};"
    "['pointerdown','keydown','touchstart','scroll'].forEach(function(e){addEventListener(e,f,{once:true,passive:true});});"
    "if(document.readyState==='complete'){setTimeout(f,3500);}"
    "else{addEventListener('load',function(){setTimeout(f,3500);});}})();</script>"
)
OLD_PRECONNECT = '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>\n'

PAGES = (
    'index.html', 'watch/index.html', 'about/index.html', 'support/index.html',
    'format/index.html', 'code/index.html', 'faq/index.html', 'community/index.html',
    '404.html', '404/index.html', 'offline/index.html',
)


def main() -> int:
    n = 0
    for rel in PAGES:
        p = ROOT / rel
        t = p.read_text(encoding='utf-8')
        orig = t
        if OLD_TAG in t:
            t = t.replace(OLD_TAG, NEW_TAG, 1)
        elif NEW_TAG not in t:
            print(f'skip {rel}: gtag tag not found')
            continue
        t = t.replace(OLD_PRECONNECT, '')
        if t != orig:
            p.write_text(t, encoding='utf-8')
            n += 1
            print(f'patched {rel}')
    print(f'defer gtag: {n} file(s) updated')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
