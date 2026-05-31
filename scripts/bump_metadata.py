#!/usr/bin/env python3
"""Sync deploy metadata: JSON-LD dateModified, article:modified_time, sitemap lastmod."""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'404.html', 'offline/index.html'}
ISO = re.compile(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}')
SHORT = re.compile(r'\d{4}-\d{2}-\d{2}')


def main() -> int:
    today = date.today().isoformat()
    today_iso = f'{today}T00:00:00+07:00'
    touched = 0

    for path in sorted(ROOT.glob('**/*.html')):
        if any(p in path.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        if path.name in SKIP and path.parent == ROOT:
            continue
        text = path.read_text(encoding='utf-8')
        if 'dateModified' not in text and 'article:modified_time' not in text:
            continue
        new = text
        new = re.sub(r'"dateModified":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}"', f'"dateModified":"{today_iso}"', new)
        new = re.sub(r'"dateModified":"\d{4}-\d{2}-\d{2}"', f'"dateModified":"{today}"', new)
        new = re.sub(
            r'(<meta property="article:modified_time" content=")\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}(">)',
            rf'\g<1>{today_iso}\2',
            new,
        )
        if new != text:
            path.write_text(new, encoding='utf-8')
            print(f'  OK: {path.relative_to(ROOT)} dateModified -> {today}')
            touched += 1

    for name in ('sitemap.xml', 'sitemap-network.xml'):
        sp = ROOT / name
        if not sp.exists():
            continue
        text = sp.read_text(encoding='utf-8')
        if name == 'sitemap.xml':
            new = re.sub(r'<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', f'<lastmod>{today}</lastmod>', text)
        else:
            new = re.sub(
                r'(<loc>https://pattayastream\.com/sitemap\.xml</loc>\s*<lastmod>)\d{4}-\d{2}-\d{2}(</lastmod>)',
                rf'\g<1>{today}\2',
                text,
            )
        if new != text:
            sp.write_text(new, encoding='utf-8')
            print(f'  OK: {name} lastmod -> {today}')
            touched += 1

    print(f'Metadata sync: {touched} file(s) updated to {today}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
