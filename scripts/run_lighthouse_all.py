#!/usr/bin/env python3
"""Run Lighthouse desktop on all pattayastream.com pages and print scores + failures."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = os.environ.get('LIGHTHOUSE_BASE', 'https://pattayastream.com').rstrip('/')

PAGES = [
    ('home', f'{BASE}/'),
    ('watch', f'{BASE}/watch/'),
    ('about', f'{BASE}/about/'),
    ('support', f'{BASE}/support/'),
    ('format', f'{BASE}/format/'),
    ('code', f'{BASE}/code/'),
    ('faq', f'{BASE}/faq/'),
    ('community', f'{BASE}/community/'),
    ('offline', f'{BASE}/offline/'),
    ('404', f'{BASE}/404/'),
]


def run_lighthouse(name: str, url: str) -> dict:
    out = ROOT / f'.lighthouse-{name}.json'
    cmd = [
        'npx', '--yes', 'lighthouse', url,
        '--preset=desktop',
        f'--output=json',
        f'--output-path={out}',
        '--chrome-flags=--headless --no-sandbox',
        '--quiet',
    ]
    print(f'Running {name} ({url})...', flush=True)
    last_err = ''
    for attempt in range(1, 4):
        proc = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if proc.returncode == 0 and out.exists() and out.stat().st_size > 1000:
            break
        last_err = proc.stderr[-800:] if proc.stderr else proc.stdout[-800:]
        if attempt < 3:
            print(f'  retry {attempt}/3 for {name}...', flush=True)
    else:
        raise RuntimeError(f'{name} failed: {last_err}')
    data = json.loads(out.read_text(encoding='utf-8'))
    cats = data['categories']
    row: dict = {'page': name, 'url': url}
    for key in ('performance', 'accessibility', 'best-practices', 'seo'):
        score = cats[key]['score']
        row[key] = round(score * 100) if score is not None else None
    fails = []
    for audit_id, audit in data['audits'].items():
        score = audit.get('score')
        mode = audit.get('scoreDisplayMode', '')
        if score is not None and score < 1 and mode not in ('notApplicable', 'manual', 'informative'):
            fails.append({
                'id': audit_id,
                'title': audit.get('title', ''),
                'score': score,
                'display': audit.get('displayValue', ''),
            })
    row['fails'] = sorted(fails, key=lambda x: x['score'])[:15]
    metrics = {}
    for mid in ('first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift'):
        m = data['audits'].get(mid, {})
        metrics[mid] = m.get('displayValue', '')
    row['metrics'] = metrics
    print(
        f"  perf={row['performance']} a11y={row['accessibility']} "
        f"bp={row['best-practices']} seo={row['seo']} "
        f"LCP={metrics.get('largest-contentful-paint','')}",
        flush=True,
    )
    return row


def main() -> int:
    results = []
    for name, url in PAGES:
        try:
            results.append(run_lighthouse(name, url))
        except RuntimeError as e:
            print(f'ERROR: {e}', file=sys.stderr)
            return 1
    summary = ROOT / '.lighthouse-summary.json'
    summary.write_text(json.dumps(results, indent=2), encoding='utf-8')
    print('\n=== SUMMARY ===')
    for r in results:
        print(
            f"{r['page']:10} perf={r['performance']:3} a11y={r['accessibility']:3} "
            f"bp={r['best-practices']:3} seo={r['seo']:3}"
        )
    print(f'\nReport: {summary.name}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
