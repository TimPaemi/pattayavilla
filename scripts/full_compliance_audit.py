#!/usr/bin/env python3
"""Full compliance audit: live metadata, keywords, mobile/desktop signals, content depth."""
from __future__ import annotations

import json
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://pattayastream.com'
UA = 'PattayaStream-FullCompliance/1.0'
CTX = ssl.create_default_context()

INDEXED = [
    ('/', 'index.html', 'Homepage'),
    ('/watch/', 'watch/index.html', 'Watch Live'),
    ('/about/', 'about/index.html', 'About'),
    ('/support/', 'support/index.html', 'Support'),
    ('/format/', 'format/index.html', 'Format'),
    ('/faq/', 'faq/index.html', 'FAQ'),
    ('/code/', 'code/index.html', 'Code of Conduct'),
]

# Primary keywords each indexed page should surface (title OR meta description OR h1)
PAGE_KEYWORDS: dict[str, list[str]] = {
    '/': ['Pattaya', 'livestream', 'Tim', 'Paemi', '9 PM', 'ICT'],
    '/watch/': ['Watch', 'Live', 'YouTube', 'Pattaya', '9 PM', 'ICT'],
    '/about/': ['Tim', 'Paemi', 'Pattaya', 'villa'],
    '/support/': ['support', 'YouTube', 'Super Chat'],
    '/format/': ['format', 'villa', 'chat', '9 PM'],
    '/faq/': ['FAQ', 'Pattaya', 'livestream', 'schedule'],
    '/code/': ['conduct', 'chat', 'code'],
}

GLOBAL_KEYWORDS = ['Pattaya', 'Tim', 'Paemi', 'livestream', '9 PM', 'ICT', 'YouTube', 'villa']

MOBILE_SIGNALS = [
    ('viewport meta', r'<meta name="viewport"[^>]+width=device-width'),
    ('theme-color', r'<meta name="theme-color"'),
    ('apple-mobile-web-app', r'apple-mobile-web-app-capable'),
    ('touch-friendly CTAs', r'min-height:\s*44px|min-height:44px'),
    ('sticky CTA', r'class="sticky-cta"'),
    ('utility bar', r'class="utility-bar"'),
    ('has-thai mobile labels', r'class="btn-thai"|class="cta-thai"'),
    ('prefetch/preconnect', r'rel="preconnect"|rel="dns-prefetch"'),
]

failures: list[str] = []
warnings: list[str] = []
oks: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)
    print(f'FAIL: {msg}')


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f'WARN: {msg}')


def ok(msg: str) -> None:
    oks.append(msg)
    print(f'OK: {msg}')


def fetch(url: str) -> tuple[int | None, str]:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
            return r.status, r.read(900_000).decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read(200_000).decode('utf-8', errors='replace')
    except Exception as e:
        return None, str(e)


def extract_meta(html: str) -> dict:
    def meta(name: str, prop: bool = False) -> str:
        if prop:
            m = re.search(rf'<meta property="{re.escape(name)}" content="([^"]*)"', html, re.I)
        else:
            m = re.search(rf'<meta name="{re.escape(name)}" content="([^"]*)"', html, re.I)
        return unescape(m.group(1)) if m else ''

    title_m = re.search(r'<title>([^<]+)</title>', html, re.I)
    canon_m = re.search(r'<link rel="canonical" href="([^"]+)"', html, re.I)
    h1_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S | re.I)
    h1 = re.sub(r'<[^>]+>', '', h1_m.group(1)).strip() if h1_m else ''
    h1 = unescape(re.sub(r'\s+', ' ', h1))

    main_m = re.search(r'<main[^>]*>(.*)</main>', html, re.S | re.I)
    main_chunk = main_m.group(1) if main_m else ''
    main_text = re.sub(r'<script[^>]*>.*?</script>', ' ', main_chunk, flags=re.S | re.I)
    main_text = unescape(re.sub(r'<[^>]+>', ' ', main_text))
    word_count = len(main_text.split())

    return {
        'title': unescape(title_m.group(1).strip()) if title_m else '',
        'description': meta('description'),
        'robots': meta('robots'),
        'canonical': canon_m.group(1) if canon_m else '',
        'og_title': meta('og:title', prop=True),
        'og_description': meta('og:description', prop=True),
        'og_url': meta('og:url', prop=True),
        'og_image': meta('og:image', prop=True),
        'twitter_card': meta('twitter:card'),
        'twitter_title': meta('twitter:title'),
        'h1': h1,
        'word_count': word_count,
        'ga4': 'G-WSGWG7999E' in html,
        'hreflang': len(re.findall(r'<link rel="alternate" hreflang=', html)),
        'json_ld_blocks': len(re.findall(r'<script type="application/ld\+json">', html)),
    }


def audit_live_metadata() -> list[dict]:
    print('=== LIVE METADATA + KEYWORDS (7 indexed pages) ===\n')
    rows: list[dict] = []
    for path, _rel, label in INDEXED:
        url = BASE + path
        status, html = fetch(url)
        if status != 200:
            fail(f'{label} {url} HTTP {status}')
            continue
        meta = extract_meta(html)
        meta['path'] = path
        meta['label'] = label
        meta['url'] = url
        rows.append(meta)

        expected_canon = url if path != '/' else BASE + '/'
        if meta['canonical'] != expected_canon:
            fail(f'{label}: canonical mismatch ({meta["canonical"]!r})')
        elif not meta['title']:
            fail(f'{label}: missing <title>')
        elif not meta['description']:
            fail(f'{label}: missing meta description')
        elif len(meta['description']) < 80:
            warn(f'{label}: meta description short ({len(meta["description"])} chars)')
        elif len(meta['description']) > 165:
            warn(f'{label}: meta description long ({len(meta["description"])} chars)')
        else:
            ok(f'{label}: title + description + canonical')

        if not meta['h1']:
            fail(f'{label}: missing h1')
        elif not meta['og_title'] or not meta['og_description'] or not meta['og_url']:
            fail(f'{label}: incomplete Open Graph tags')
        elif not meta['twitter_card']:
            warn(f'{label}: missing twitter:card')
        else:
            ok(f'{label}: OG + Twitter metadata')

        if not meta['ga4']:
            fail(f'{label}: missing GA4 G-WSGWG7999E')
        if 'noindex' in meta['robots'].lower() and path in {p for p, _, _ in INDEXED}:
            fail(f'{label}: indexed page has noindex')
        if meta['word_count'] < 850:
            fail(f'{label}: thin main content ({meta["word_count"]} words, target 850+)')
        else:
            ok(f'{label}: {meta["word_count"]} words in <main>')

        if meta['json_ld_blocks'] < 1:
            warn(f'{label}: no JSON-LD blocks')
        else:
            ok(f'{label}: {meta["json_ld_blocks"]} JSON-LD block(s)')

        blob = ' '.join([meta['title'], meta['description'], meta['h1'], meta['og_title']]).lower()
        missing_kw = [k for k in PAGE_KEYWORDS[path] if k.lower() not in blob]
        if missing_kw:
            warn(f'{label}: page-level keywords missing in title/desc/h1: {missing_kw}')
        else:
            ok(f'{label}: page keyword targets present')

    return rows


def audit_global_keyword_coverage(rows: list[dict]) -> None:
    print('\n=== GLOBAL KEYWORD COVERAGE (indexed set) ===\n')
    combined = ' '.join(
        r['title'] + ' ' + r['description'] + ' ' + r['h1'] for r in rows
    ).lower()
    for kw in GLOBAL_KEYWORDS:
        if kw.lower() not in combined:
            warn(f'global keyword "{kw}" absent from all indexed titles/descriptions/h1')
        else:
            ok(f'global keyword "{kw}" covered across site')


def audit_mobile_desktop_signals() -> None:
    print('\n=== MOBILE + DESKTOP HTML SIGNALS (live) ===\n')
    for path, _rel, label in INDEXED:
        url = BASE + path
        status, html = fetch(url)
        if status != 200:
            continue
        for name, pat in MOBILE_SIGNALS:
            if re.search(pat, html, re.I):
                ok(f'{label}: {name}')
            else:
                fail(f'{label}: missing {name}')

        if 'pv-critical-home' in html or 'pv-critical-chrome' in html:
            ok(f'{label}: critical CSS inlined (fast first paint)')
        else:
            warn(f'{label}: no inlined critical CSS block')

        if f'media="print" onload="this.media=\'all\'"' in html:
            ok(f'{label}: async full CSS loading')
        else:
            fail(f'{label}: missing async CSS pattern')

        if 'page-breadcrumb' in html or path == '/':
            if path == '/':
                ok(f'{label}: homepage (no breadcrumb expected)')
            else:
                ok(f'{label}: breadcrumb markup present')
        elif path != '/':
            fail(f'{label}: missing page-breadcrumb')


def run_lighthouse(form_factor: str) -> list[dict]:
    print(f'\n=== LIGHTHOUSE {form_factor.upper()} ===\n')
    pages = [
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
    results: list[dict] = []
    for name, url in pages:
        out = ROOT / f'.lighthouse-{form_factor}-{name}.json'
        cmd = [
            'npx', '--yes', 'lighthouse', url,
            f'--form-factor={form_factor}',
            '--output=json',
            f'--output-path={out}',
            '--chrome-flags=--headless --no-sandbox',
            '--quiet',
        ]
        if form_factor == 'desktop':
            cmd.insert(4, '--preset=desktop')
        print(f'Running {form_factor} {name}...', flush=True)
        proc = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if proc.returncode != 0 or not out.exists():
            fail(f'lighthouse {form_factor}/{name} failed')
            continue
        data = json.loads(out.read_text(encoding='utf-8'))
        cats = data['categories']
        row = {'page': name, 'form_factor': form_factor, 'url': url}
        for key in ('performance', 'accessibility', 'best-practices', 'seo'):
            score = cats[key]['score']
            row[key] = round(score * 100) if score is not None else None
        metrics = {}
        for mid in ('first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'interactive'):
            metrics[mid] = data['audits'].get(mid, {}).get('displayValue', '')
        row['metrics'] = metrics
        seo_fails = []
        for aid, audit in data['audits'].items():
            if audit.get('score') is not None and audit['score'] < 1:
                if audit.get('scoreDisplayMode') in ('notApplicable', 'manual', 'informative'):
                    continue
                if aid.startswith('seo-') or 'meta' in aid or 'document-title' in aid:
                    seo_fails.append({'id': aid, 'title': audit.get('title', ''), 'display': audit.get('displayValue', '')})
        row['seo_audit_fails'] = seo_fails[:8]
        results.append(row)
        print(
            f"  {name:10} perf={row['performance']:3} a11y={row['accessibility']:3} "
            f"bp={row['best-practices']:3} seo={row['seo']:3} "
            f"LCP={metrics.get('largest-contentful-paint', '')} CLS={metrics.get('cumulative-layout-shift', '')}",
            flush=True,
        )
        if row['performance'] is not None and row['performance'] < 70:
            warn(f'{form_factor}/{name}: performance {row["performance"]} below 70')
        if row['seo'] is not None and row['seo'] < 90 and name not in ('community', 'offline', '404'):
            fail(f'{form_factor}/{name}: SEO score {row["seo"]} below 90 on indexed page')
    return results


def run_subprocess_audit(script: str, label: str) -> bool:
    print(f'\n=== {label} ===\n')
    proc = subprocess.run(
        [sys.executable, str(ROOT / 'scripts' / script)] + (['--check'] if script == 'sync_critical_css.py' else []),
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    tail = (proc.stdout + proc.stderr)[-4000:]
    print(tail)
    if proc.returncode != 0:
        fail(f'{label} exited {proc.returncode}')
        return False
    ok(f'{label} PASSED')
    return True


def main() -> int:
    print('=== PATTAYA VILLA STREAM — FULL COMPLIANCE AUDIT ===\n')
    print(f'Target: {BASE}\n')

    rows = audit_live_metadata()
    audit_global_keyword_coverage(rows)
    audit_mobile_desktop_signals()

    run_subprocess_audit('seo_audit.py', 'LOCAL SEO AUDIT')
    run_subprocess_audit('audit_pattayastream.py', 'LIVE PATTAYASTREAM AUDIT')
    run_subprocess_audit('full_live_audit.py', 'FULL LIVE AUDIT (network)')
    run_subprocess_audit('network_audit.py', 'NETWORK AUDIT')
    run_subprocess_audit('check_internal_links.py', 'INTERNAL LINKS')
    run_subprocess_audit('check_asset_versions.py', 'ASSET VERSIONS')
    run_subprocess_audit('sync_critical_css.py', 'CRITICAL CSS CHECK')

    desktop_lh = run_lighthouse('desktop')
    mobile_lh = run_lighthouse('mobile')

    report = {
        'metadata': rows,
        'failures': failures,
        'warnings': warnings,
        'ok_count': len(oks),
        'lighthouse_desktop': desktop_lh,
        'lighthouse_mobile': mobile_lh,
    }
    out = ROOT / '.full-compliance-audit.json'
    out.write_text(json.dumps(report, indent=2), encoding='utf-8')

    print('\n' + '=' * 60)
    print('FULL COMPLIANCE SUMMARY')
    print('=' * 60)
    print(f'Checks OK: {len(oks)} | Warnings: {len(warnings)} | Failures: {len(failures)}')
    print(f'Report: {out.name}')

    if desktop_lh:
        print('\n--- LIGHTHOUSE DESKTOP ---')
        for r in desktop_lh:
            print(f"{r['page']:10} perf={r['performance']:3} a11y={r['accessibility']:3} seo={r['seo']:3}")
    if mobile_lh:
        print('\n--- LIGHTHOUSE MOBILE ---')
        for r in mobile_lh:
            print(f"{r['page']:10} perf={r['performance']:3} a11y={r['accessibility']:3} seo={r['seo']:3}")

    if rows:
        print('\n--- METADATA TABLE (indexed pages) ---')
        for r in rows:
            print(f"\n{r['label']} ({r['path']})")
            print(f"  title: {r['title'][:90]}{'…' if len(r['title']) > 90 else ''}")
            print(f"  desc:  {r['description'][:100]}{'…' if len(r['description']) > 100 else ''} ({len(r['description'])} chars)")
            print(f"  h1:    {r['h1'][:80]}")
            print(f"  words: {r['word_count']} | JSON-LD: {r['json_ld_blocks']}")

    if failures:
        print('\n--- FAILURES ---')
        for f in failures:
            print(f'  • {f}')
    if warnings:
        print('\n--- WARNINGS ---')
        for w in warnings:
            print(f'  • {w}')

    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
