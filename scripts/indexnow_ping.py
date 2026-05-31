#!/usr/bin/env python3
"""Ping IndexNow endpoints (global + Bing) after deploy."""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY = 'psindex2026pattayastreamkey'
HOST = 'pattayastream.com'
ENDPOINTS = (
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
)


def load_urls() -> list[str]:
    text = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    return re.findall(r'<loc>(https://pattayastream\.com[^<]+)</loc>', text)


def ping(endpoint: str, payload: dict) -> bool:
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'PattayaStream-IndexNow/1.0'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            ok = resp.status in (200, 202)
            print(f'  OK: {endpoint} HTTP {resp.status}')
            return ok
    except urllib.error.HTTPError as e:
        print(f'  WARN: {endpoint} HTTP {e.code}')
        return False
    except Exception as e:
        print(f'  WARN: {endpoint} failed - {e}')
        return False


def main() -> int:
    urls = load_urls()
    if not urls:
        print('FAIL: no URLs in sitemap.xml')
        return 1
    payload = {
        'host': HOST,
        'key': KEY,
        'keyLocation': f'https://{HOST}/{KEY}.txt',
        'urlList': urls,
    }
    print(f'=== IndexNow ping ({len(urls)} URLs) ===')
    results = [ping(ep, payload) for ep in ENDPOINTS]
    if any(results):
        print('IndexNow: at least one endpoint accepted the ping')
        return 0
    print('WARN: all IndexNow endpoints failed (non-fatal)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
