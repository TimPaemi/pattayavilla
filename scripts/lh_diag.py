#!/usr/bin/env python3
"""Summarize Lighthouse mobile opportunities + LCP breakdown from saved reports."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

for name in ('watch', 'faq', 'support', 'format', 'community', 'home'):
    p = ROOT / f'.lighthouse-mobile-{name}.json'
    if not p.exists():
        continue
    d = json.loads(p.read_text(encoding='utf-8'))
    a = d['audits']
    print(f"\n=== {name} (perf {round(d['categories']['performance']['score']*100)}) ===")
    for mid in ('first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time',
                'speed-index', 'interactive', 'cumulative-layout-shift'):
        print(f"  {mid}: {a[mid].get('displayValue','')}")
    lcp_el = a.get('largest-contentful-paint-element', {})
    items = (lcp_el.get('details') or {}).get('items') or []
    if items:
        node = (items[0].get('items') or [{}])[0].get('node', {})
        print(f"  LCP element: {node.get('snippet','')[:120]}")
        if len(items) > 1:
            for ph in (items[1].get('items') or []):
                print(f"    phase {ph.get('phase','')}: {ph.get('timing',0):.0f}ms")
    print('  -- opportunities --')
    for aid, audit in a.items():
        det = audit.get('details') or {}
        ms = det.get('overallSavingsMs', 0)
        if ms and ms > 50:
            print(f"  {aid}: save ~{ms:.0f}ms  {audit.get('displayValue','')}")
    rb = a.get('render-blocking-resources', {})
    for it in ((rb.get('details') or {}).get('items') or []):
        print(f"  render-blocking: {it.get('url','')} {it.get('wastedMs',0):.0f}ms")
    nrt = a.get('network-rtt', {})
    bf = a.get('bootup-time', {})
    print(f"  bootup-time: {bf.get('displayValue','')}")
    mw = a.get('mainthread-work-breakdown', {})
    print(f"  mainthread: {mw.get('displayValue','')}")
