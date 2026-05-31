#!/usr/bin/env python3
"""Read-only inbound link audit: do sister sites link back to pattayastream.com?"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = Path(__file__).resolve().parent / 'network_manifest.json'
TARGET = re.compile(r'pattayastream\.com|pattayavilla', re.I)
UA = 'PattayaStream-InboundAudit/1.0'

warnings: list[str] = []


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f'WARN: {msg}')


def ok(msg: str) -> None:
    print(f'OK: {msg}')


def fetch_homepage(domain: str) -> str:
    url = f'https://{domain}/'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read(500_000).decode('utf-8', errors='replace')


def audit_inbound() -> dict:
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    results: dict[str, dict] = {}
    linked = 0
    checked = 0
    for site in manifest['live']:
        domain = site['domain']
        if domain == 'pattayastream.com':
            continue
        checked += 1
        try:
            html = fetch_homepage(domain)
            hits = TARGET.findall(html)
            count = len(hits)
            if count:
                linked += 1
                ok(f'{domain} links to stream ({count} refs on homepage)')
                results[domain] = {'status': 'linked', 'refs': count, 'repo': site['repo']}
            else:
                warn(f'{domain} ({site["repo"]}) — no pattayastream.com link on homepage')
                results[domain] = {'status': 'missing', 'refs': 0, 'repo': site['repo']}
        except urllib.error.HTTPError as e:
            warn(f'{domain} HTTP {e.code}')
            results[domain] = {'status': 'error', 'code': e.code, 'repo': site['repo']}
        except Exception as e:
            warn(f'{domain} fetch failed: {e}')
            results[domain] = {'status': 'error', 'error': str(e), 'repo': site['repo']}
    summary = {'checked': checked, 'linked': linked, 'missing': checked - linked, 'sites': results}
    print(f'\nInbound summary: {linked}/{checked} sister homepages link to pattayastream.com')
    return summary


def main() -> int:
    if os.environ.get('SKIP_INBOUND_PROBE') == '1':
        print('SKIP: inbound audit (SKIP_INBOUND_PROBE=1)')
        return 0
    print('=== PATTAYA VILLA STREAM INBOUND AUDIT ===\n')
    summary = audit_inbound()
    out = ROOT / '.inbound-audit.json'
    out.write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(f'\nReport written to {out.name} (gitignored locally if present)')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        missing = [d for d, r in summary['sites'].items() if r.get('status') == 'missing']
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f:
            f.write('\n## Inbound link audit\n')
            f.write(f'{summary["linked"]}/{summary["checked"]} sister sites link to pattayastream.com\n')
            if missing:
                f.write('\nMissing inbound links:\n')
                for d in missing:
                    f.write(f'- `{d}` ({summary["sites"][d]["repo"]})\n')
    # Warnings only — sister-site fixes happen in their own repos
    print('\nINBOUND AUDIT: COMPLETE (warnings only)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
