#!/usr/bin/env python3
"""Submit sitemap to Bing Webmaster Tools (optional — needs BING_WEBMASTER_API_KEY)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

SITE_URL = 'https://pattayastream.com/'
SITEMAP = 'https://pattayastream.com/sitemap.xml'


def main() -> int:
    api_key = os.environ.get('BING_WEBMASTER_API_KEY') or os.environ.get('BING_API_KEY')
    if not api_key:
        print('SKIP: BING_WEBMASTER_API_KEY not set — add GitHub secret to enable Bing sitemap submit')
        return 0
    endpoint = f'https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed?apikey={api_key}'
    payload = json.dumps({'siteUrl': SITE_URL, 'feedUrl': SITEMAP}).encode('utf-8')
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'PattayaStream-BingSubmit/1.0'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            print(f'OK: Bing Webmaster sitemap submit HTTP {resp.status}')
            if body.strip():
                print(body[:500])
            return 0
    except urllib.error.HTTPError as e:
        print(f'FAIL: Bing Webmaster HTTP {e.code} — {e.read().decode("utf-8", errors="replace")[:300]}')
        return 1
    except Exception as e:
        print(f'FAIL: Bing Webmaster submit — {e}')
        return 1


if __name__ == '__main__':
    sys.exit(main())
