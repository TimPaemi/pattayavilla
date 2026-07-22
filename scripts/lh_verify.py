#!/usr/bin/env python3
"""Post-deploy mobile Lighthouse verification on the worst-scoring pages."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://pattayastream.com'

TARGETS = [
    ('mobile', 'home', f'{BASE}/'),
    ('mobile', 'watch', f'{BASE}/watch/'),
    ('mobile', 'faq', f'{BASE}/faq/'),
    ('mobile', 'support', f'{BASE}/support/'),
    ('mobile', 'format', f'{BASE}/format/'),
    ('mobile', 'community', f'{BASE}/community/'),
]

for form_factor, name, url in TARGETS:
    out = ROOT / f'.lighthouse-verify-{form_factor}-{name}.json'
    cmd = [
        'npx', '--yes', 'lighthouse', url,
        f'--form-factor={form_factor}',
        '--output=json',
        f'--output-path={out}',
        '--chrome-flags=--headless --no-sandbox',
        '--quiet',
    ]
    print(f'Running {form_factor} {name}...', flush=True)
    proc = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if proc.returncode != 0 or not out.exists():
        print(f'FAIL: {form_factor}/{name}')
        continue
    data = json.loads(out.read_text(encoding='utf-8'))
    cats = data['categories']
    scores = {k: round(cats[k]['score'] * 100) for k in ('performance', 'accessibility', 'best-practices', 'seo')}
    a = data['audits']
    lcp = a['largest-contentful-paint'].get('displayValue', '')
    cls = a['cumulative-layout-shift'].get('displayValue', '')
    tbt = a['total-blocking-time'].get('displayValue', '')
    print(f"  {name:10} perf={scores['performance']:3} a11y={scores['accessibility']:3} "
          f"bp={scores['best-practices']:3} seo={scores['seo']:3} LCP={lcp} CLS={cls} TBT={tbt}", flush=True)
