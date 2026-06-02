#!/usr/bin/env python3
"""Inline pv-critical-home.css into index.html and bump homepage stylesheet loading."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
css_path = ROOT / 'assets/css/pv-critical-home.css'
index_path = ROOT / 'index.html'

css_raw = css_path.read_text(encoding='utf-8')
css_min = re.sub(r'/\*.*?\*/', '', css_raw, flags=re.S)
css_min = re.sub(r'\s+', ' ', css_min).strip()

html = index_path.read_text(encoding='utf-8')
old_block = re.search(
    r'<link rel="stylesheet" href="/assets/css/pv-core\.css\?v=\d+">\s*'
    r'<link rel="stylesheet" href="/assets/css/pv-home\.css\?v=\d+">',
    html,
)
if not old_block:
    raise SystemExit('stylesheet block not found in index.html')

new_block = (
    f'<style id="pv-critical-home">{css_min}</style>\n'
    '<link rel="preload" href="/assets/css/pv-core.css?v=13" as="style">\n'
    '<link rel="stylesheet" href="/assets/css/pv-core.css?v=13" media="print" onload="this.media=\'all\'">\n'
    '<link rel="stylesheet" href="/assets/css/pv-home.css?v=6" media="print" onload="this.media=\'all\'">\n'
    '<noscript><link rel="stylesheet" href="/assets/css/pv-core.css?v=13">'
    '<link rel="stylesheet" href="/assets/css/pv-home.css?v=6"></noscript>'
)
html = html[: old_block.start()] + new_block + html[old_block.end() :]
index_path.write_text(html, encoding='utf-8')
print(f'inlined {len(css_min)} bytes critical CSS into index.html')
