#!/usr/bin/env python3
"""Submit sitemap to Google Search Console via API (optional — needs GSC_KEY secret)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = 'sc-domain:pattayastream.com'
SITEMAP = 'https://pattayastream.com/sitemap.xml'


def main() -> int:
    key_json = os.environ.get('GSC_KEY') or os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    if not key_json:
        print('SKIP: GSC_KEY not set — add GitHub secret to enable auto sitemap submit')
        return 0
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        print('FAIL: pip install -r scripts/requirements-gsc.txt')
        return 1
    try:
        info = json.loads(key_json)
    except json.JSONDecodeError as e:
        print(f'FAIL: GSC_KEY is not valid JSON — {e}')
        return 1
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=['https://www.googleapis.com/auth/webmasters']
    )
    svc = build('searchconsole', 'v1', credentials=creds, cache_discovery=False)
    svc.sitemaps().submit(siteUrl=SITE_URL, feedpath=SITEMAP).execute()
    print(f'OK: submitted {SITEMAP} to GSC for {SITE_URL}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
