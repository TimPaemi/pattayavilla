#!/usr/bin/env python3
"""PATTAYA VILLA STREAM — SEO audit (CI + local). Exit 1 on critical failures."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from asset_versions import CORE_V, SUB_V  # noqa: E402
NS = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

INDEXED = {'/', '/about/', '/support/', '/format/', '/faq/', '/code/'}
NOINDEX_OK = {'/community/'}
HTML_PAGES = [
    'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
    'code/index.html', 'faq/index.html', 'community/index.html', '404.html', '404/index.html', 'offline/index.html',
]

failures: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)
    print(f'FAIL: {msg}')


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f'WARN: {msg}')


def ok(msg: str) -> None:
    print(f'OK: {msg}')


def audit_sitemap() -> None:
    path = ROOT / 'sitemap.xml'
    if not path.exists():
        fail('sitemap.xml missing')
        return
    tree = ET.parse(path)
    urls = [loc.text.strip() for loc in tree.findall('.//sm:loc', NS)]
    if not urls:
        urls = [loc.text.strip() for loc in tree.findall('.//{*}loc')]
    expected = {f'https://pattayastream.com{p}' if p != '/' else 'https://pattayastream.com/' for p in INDEXED}
    found = set(urls)
    missing = expected - found
    extra = found - expected
    if missing:
        fail(f'sitemap missing URLs: {sorted(missing)}')
    if extra:
        fail(f'sitemap has unexpected URLs: {sorted(extra)}')
    if '/community/' in ' '.join(urls):
        fail('sitemap must not include /community/ (noindex)')
    if not missing and not extra:
        ok(f'sitemap has {len(urls)} indexed URLs')


def audit_robots() -> None:
    text = (ROOT / 'robots.txt').read_text(encoding='utf-8')
    if 'Sitemap: https://pattayastream.com/sitemap.xml' not in text:
        fail('robots.txt missing main sitemap directive')
    else:
        ok('robots.txt sitemap directive')


def audit_indexnow() -> None:
    key_file = ROOT / 'psindex2026pattayastreamkey.txt'
    if not key_file.exists():
        fail('IndexNow key file missing')
        return
    key = key_file.read_text(encoding='utf-8').strip()
    if key != 'psindex2026pattayastreamkey':
        fail('IndexNow key file content mismatch')
    else:
        ok('IndexNow key file present')


def audit_canonicals() -> None:
    for rel in HTML_PAGES:
        if rel in ('404.html', '404/index.html', 'offline/index.html'):
            continue
        html = (ROOT / rel).read_text(encoding='utf-8')
        if 'rel="canonical"' not in html:
            fail(f'{rel}: missing canonical')
            continue
        m = re.search(r'<link rel="canonical" href="(https://pattayastream.com[^"]+)"', html)
        if not m:
            fail(f'{rel}: canonical not parseable')


def audit_internal_links() -> None:
    inbound: dict[str, set[str]] = {p: set() for p in INDEXED}
    scan = [r for r in HTML_PAGES if r != 'offline/index.html']
    for rel in scan:
        html = (ROOT / rel).read_text(encoding='utf-8')
        for m in re.finditer(r'href="(/[^"#?][^"]*)"', html):
            base = m.group(1)
            if not base.endswith('/') and base.count('/') == 1:
                base += '/'
            if base in INDEXED:
                inbound[base].add(rel)
    if len(inbound['/about/']) < 6:
        fail(f'/about/ weak inbound ({len(inbound["/about/"])} pages) — target 6+')
    else:
        ok(f'/about/ inbound from {len(inbound["/about/"])} pages')
    for p in INDEXED:
        if p == '/':
            continue
        if not inbound[p]:
            fail(f'{p} has zero inbound internal links')


def audit_faq_mesh_links() -> None:
    faq = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    if faq.count('href="/format/"') < 3:
        fail('FAQ has fewer than 3 links to /format/')
    if faq.count('href="/code/"') < 3:
        fail('FAQ has fewer than 3 links to /code/')
    for needle in ('/format/#locked-format', '/format/#live-vs-recordings', '/support/#superchat-vs-thanks'):
        if needle not in faq:
            fail(f'FAQ missing mesh deep link {needle}')
    ok('FAQ format + code mesh links wired')


def audit_faq_schema() -> None:
    html = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    details_count = len(re.findall(r'<details name="faq"', html))
    for block in re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.DOTALL):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        graph = data.get('@graph', [data])
        for node in graph:
            if node.get('@type') == 'FAQPage':
                q_count = len(node.get('mainEntity', []))
                if q_count != details_count:
                    fail(f'FAQ mismatch: HTML={details_count} JSON-LD={q_count}')
                else:
                    ok(f'FAQ parity: {q_count} questions')
                return
    fail('FAQPage schema not found')


def audit_date_modified() -> None:
    sitemap = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    m = re.search(r'<lastmod>(\d{4}-\d{2}-\d{2})</lastmod>', sitemap)
    if not m:
        warn('sitemap.xml lastmod not found')
        return
    expected = m.group(1)
    expected_iso = f'{expected}T00:00:00+07:00'
    indexed = [
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html',
    ]
    stale = []
    for rel in indexed:
        text = (ROOT / rel).read_text(encoding='utf-8')
        if expected_iso in text or f'"dateModified":"{expected}"' in text:
            continue
        stale.append(rel)
    if stale:
        fail(f'dateModified not synced to sitemap lastmod ({expected}): {stale}')
    else:
        ok(f'dateModified synced to {expected} on indexed pages')


def audit_indexed_support_paths() -> None:
    indexed = [
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html',
    ]
    bad = []
    for rel in indexed:
        text = (ROOT / rel).read_text(encoding='utf-8')
        if '/support/#free' not in text and '/support/#tip-tonight' not in text:
            bad.append(rel)
    if bad:
        fail(f'indexed pages missing support deep links: {bad}')
    ok('all indexed pages link to support paths')


def audit_speakable_selectors() -> None:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    required = ['class="hero-sub"', 'class="hero-meta"', 'id="when-heading"', 'class="tz-grid"']
    missing = [s for s in required if s not in html]
    if missing:
        fail(f'homepage missing speakable targets: {missing}')
    else:
        ok('homepage speakable CSS targets present')


def audit_support_backlinks() -> None:
    support = (ROOT / 'support/index.html').read_text(encoding='utf-8')
    format_html = (ROOT / 'format/index.html').read_text(encoding='utf-8')
    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    required_support = ('/faq/', '/code/', '/format/', '/community/', '/about/')
    missing_support = [p for p in required_support if p not in support]
    if missing_support:
        fail(f'support page missing internal mesh links: {missing_support}')
    if '/faq/' not in format_html:
        fail('format page missing /faq/ link')
    if '/support/#tip-tonight' not in format_html:
        fail('format page missing /support/#tip-tonight deep link')
    if '/support/#free' not in home:
        fail('homepage missing /support/#free deep link')
    ok('support + format cross-links wired')


def audit_donate_action() -> None:
    text = (ROOT / 'support/index.html').read_text(encoding='utf-8')
    for needle in (
        'DonateAction',
        'support/#free',
        'support/#tip-tonight',
        'EntryPoint',
        'pattayastream.com/#org',
        'support/#payment-methods',
    ):
        if needle not in text:
            fail(f'support DonateAction schema missing {needle}')
    ok('support DonateAction schema wired to #free + #tip-tonight')


def audit_dns_prefetch() -> None:
    bad = []
    for f in ROOT.glob('**/*.html'):
        if any(p in f.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        text = f.read_text(encoding='utf-8')
        if 'dns-prefetch' not in text:
            continue
        hrefs = re.findall(r'<link rel="dns-prefetch" href="([^"]+)">', text)
        dupes = [h for h in set(hrefs) if hrefs.count(h) > 1]
        if dupes:
            bad.append(f'{f.relative_to(ROOT)}: {dupes}')
    if bad:
        fail(f'duplicate dns-prefetch hrefs: {bad[:5]}')
    ok('dns-prefetch blocks deduplicated')


def audit_video_graph() -> None:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    if '"isPartOf":{"@id":"https://pattayastream.com/#nightly-show"}' not in html:
        fail('VideoObject missing isPartOf link to nightly Event')
    if '"workFeatured":{"@id":"https://pattayastream.com/#livestream"}' not in html:
        fail('Event missing workFeatured link to VideoObject')
    if 'WatchAction' not in html:
        fail('VideoObject missing WatchAction')
    ok('VideoObject + Event graph linked')


def audit_error_page_schema() -> None:
    for rel, selectors in (
        ('404/index.html', ['SpeakableSpecification', 'h1']),
        ('offline/index.html', ['SpeakableSpecification', 'offline-sub']),
    ):
        text = (ROOT / rel).read_text(encoding='utf-8')
        for needle in selectors:
            if needle not in text:
                fail(f'{rel} schema/speakable missing {needle}')
    ok('404 + offline speakable schema present')


def audit_error_route_parity() -> None:
    redirects = (ROOT / '_redirects').read_text(encoding='utf-8')
    headers = (ROOT / '_headers').read_text(encoding='utf-8')

    if not re.search(r'^/404\s+/404/\s+301', redirects, re.M):
        fail('_redirects missing /404 -> /404/ 301')
    if not re.search(r'^/404\.html\s+/404/\s+301', redirects, re.M):
        fail('_redirects missing /404.html -> /404/ 301')
    if not re.search(r'^/404/\s*$', headers, re.M):
        fail('_headers missing /404/ cache block')

    root404 = (ROOT / '404.html').read_text(encoding='utf-8')
    page404 = (ROOT / '404/index.html').read_text(encoding='utf-8')

    def norm404(s: str) -> str:
        return re.sub(r'https://pattayastream.com/404/?(?:html)?', 'CANON', s)

    if norm404(root404) != norm404(page404):
        fail('404.html and 404/index.html content drift')
    for rel in ('404.html', '404/index.html'):
        text = (ROOT / rel).read_text(encoding='utf-8')
        if 'https://pattayastream.com/404/"' not in text:
            fail(f'{rel} canonical must point to /404/')

    if not re.search(r'^/offline\s+/offline/\s+301', redirects, re.M):
        fail('_redirects missing /offline -> /offline/ 301')
    if not re.search(r'^/offline\.html\s+/offline/\s+301', redirects, re.M):
        fail('_redirects missing /offline.html -> /offline/ 301')
    if not re.search(r'^/offline/\s*$', headers, re.M):
        fail('_headers missing /offline/ cache block')
    if not re.search(r'^/LICENSE/\s+/LICENSE\s+301', redirects, re.M):
        fail('_redirects missing /LICENSE/ -> /LICENSE 301')
    offline = (ROOT / 'offline/index.html').read_text(encoding='utf-8')
    if 'https://pattayastream.com/offline/"' not in offline:
        fail('offline/index.html canonical must point to /offline/')

    ok('Error route parity locked (404 + offline)')


def audit_redirect_shortcuts() -> None:
    redirects = (ROOT / '_redirects').read_text(encoding='utf-8')
    rules = (
        (r'^/donate\s+/support/\s+301', 'donate -> support'),
        (r'^/tip\s+/support/#tip-tonight\s+301', 'tip -> support/#tip-tonight'),
        (r'^/free\s+/support/#free\s+301', 'free -> support/#free'),
        (r'^/live\s+https://www\.youtube\.com/@timpaemi/live', 'live -> YouTube live'),
        (r'^/subscribe\s+https://www\.youtube\.com/@timpaemi\?sub_confirmation=1', 'subscribe -> YouTube sub'),
        (r'^/rules\s+/code/\s+301', 'rules -> code'),
    )
    missing = [label for pat, label in rules if not re.search(pat, redirects, re.M)]
    if missing:
        fail(f'_redirects missing shortcuts: {missing[:4]}')
    else:
        ok('Redirect shortcuts wired in _redirects')


def audit_sticky_support_cta() -> None:
    bad = []
    for f in ROOT.glob('**/*.html'):
        if any(p in f.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        text = f.read_text(encoding='utf-8')
        if 'class="cta-support"' not in text:
            continue
        if 'href="/support/#tip-tonight" class="cta-support"' not in text:
            bad.append(str(f.relative_to(ROOT)))
    if bad:
        fail(f'sticky support CTA must use /support/#tip-tonight: {bad}')
    ok('sticky support CTAs use #tip-tonight')


def audit_support_speakable() -> None:
    text = (ROOT / 'support/index.html').read_text(encoding='utf-8')
    for sel in ('#free', '#tip-tonight', 'SpeakableSpecification'):
        if sel not in text:
            fail(f'support page missing speakable target {sel}')
    ok('support page speakable schema wired')


def audit_network_bar_sync() -> None:
    import subprocess
    r = subprocess.run(
        [sys.executable, str(ROOT / 'scripts' / 'sync_network_bar.py'), '--check'],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        fail('network bar/footer drift — run scripts/sync_network_bar.py --fix')
        return
    ok('network bar + footer synced to manifest')


def audit_network_strap() -> None:
    import json
    manifest = json.loads((ROOT / 'scripts' / 'network_manifest.json').read_text(encoding='utf-8'))
    count = len(manifest['live'])
    bad = []
    for f in ROOT.glob('**/*.html'):
        if any(p in f.parts for p in ('.git', '.deploy-stage', '_pattayavilla-scaffold')):
            continue
        text = f.read_text(encoding='utf-8')
        if 'network-strap-sub' in text and f'· {count} PROPERTIES' not in text:
            bad.append(str(f.relative_to(ROOT)))
        if ' an 14-site' in text:
            bad.append(f'{f.relative_to(ROOT)} (grammar: an 14-site)')
    if bad:
        fail(f'network property count stale: {bad[:5]}')
    ok(f'network strap shows {count} properties')


def _selector_in_html(html: str, sel: str) -> bool:
    if sel.startswith('#'):
        return f'id="{sel[1:]}"' in html
    if sel.startswith('.'):
        cls = sel[1:]
        return (
            f'class="{cls}"' in html
            or f'class="{cls} ' in html
            or f' {cls}"' in html
            or f' {cls} ' in html
        )
    return sel in html


def audit_speakable_dom() -> None:
    checks = {
        'code/index.html': ['#why-code-heading', '#welcome-heading', '#banned-heading', '#how-enforcement-heading', '#mods-heading'],
        'community/index.html': ['#why-community-heading', '#become-heading', '#why-heading', '#mods-community-heading', '.tier-name'],
        'support/index.html': ['#free', '#tip-tonight', '#superchat-howto-heading', '#superthanks-howto-heading', '#how-support-heading', '#superchat-vs-thanks-heading', '#recognition-policy-heading', '.support-card-name', '.equal-paths-a'],
        'format/index.html': ['#typical-night', '#chat-is-the-room', '#the-vibe', '#first-night', '#locked-format', '#live-vs-recordings'],
    }
    bad = []
    for rel, selectors in checks.items():
        html = (ROOT / rel).read_text(encoding='utf-8')
        for sel in selectors:
            if not _selector_in_html(html, sel):
                bad.append(f'{rel} missing speakable target {sel}')
    if bad:
        fail(f'speakable CSS targets missing in DOM: {bad[:6]}')
    ok('subpage speakable selectors present in DOM')


def audit_end_cta_support() -> None:
    pages = (
        'about/index.html',
        'format/index.html',
        'faq/index.html',
        'community/index.html',
        'code/index.html',
    )
    bad = []
    for rel in pages:
        text = (ROOT / rel).read_text(encoding='utf-8')
        block = text.split('class="end-cta"', 1)
        if len(block) < 2:
            bad.append(f'{rel} missing end-cta')
            continue
        tail = block[1][:900]
        if 'btn-yellow' in tail and '/support/#free' not in tail and 'href="#free"' not in tail:
            bad.append(rel)
    if bad:
        fail(f'end-cta support buttons must use /support/#free: {bad}')
    ok('subpage end-cta support buttons use #free')


DEDICATED_OG = {
    'about/index.html': 'og-about.jpg',
    'faq/index.html': 'og-faq.jpg',
    'code/index.html': 'og-code.jpg',
}


def audit_dedicated_og() -> None:
    for rel, og in DEDICATED_OG.items():
        html = (ROOT / rel).read_text(encoding='utf-8')
        m = re.search(r'property="og:image" content="https://pattayastream.com/assets/og/([^"]+)"', html)
        if not m or m.group(1) != og:
            fail(f'{rel}: og:image must be {og}')
        if not (ROOT / 'assets' / 'og' / og).is_file():
            fail(f'missing asset assets/og/{og}')
    ok('dedicated OG images on about, faq, code')


def audit_sitemap_og_images() -> None:
    text = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    pairs = {
        '/about/': 'og-about.jpg',
        '/faq/': 'og-faq.jpg',
        '/code/': 'og-code.jpg',
    }
    for path, og in pairs.items():
        block = re.search(rf'<loc>https://pattayastream.com{re.escape(path)}</loc>.*?</url>', text, re.DOTALL)
        if not block or og not in block.group(0):
            fail(f'sitemap {path} missing image {og}')
    ok('sitemap OG images match dedicated assets')


def audit_og_file_sizes() -> None:
    max_bytes = 80_000
    og_dir = ROOT / 'assets' / 'og'
    for f in og_dir.glob('*.jpg'):
        size = f.stat().st_size
        if size > max_bytes:
            warn(f'{f.name} is {size:,} bytes — target under {max_bytes:,}')
    ok('OG image size check complete')


def audit_llms_txt() -> None:
    path = ROOT / '.well-known' / 'llms.txt'
    if not path.exists():
        fail('llms.txt missing')
        return
    text = path.read_text(encoding='utf-8')
    html = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    faq_count = len(re.findall(r'<details name="faq"', html))
    if f'{faq_count} common questions' not in text and f'twenty common questions' not in text.lower():
        # accept spelled-out twenty for 20
        num_words = {17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 21: 'twenty-one'}
        expected = num_words.get(faq_count, str(faq_count))
        if expected not in text.lower():
            fail(f'llms.txt FAQ count stale — expected ~{faq_count} ({expected})')
    if 'pattayastream.com/support/#free' not in text:
        fail('llms.txt missing support/#free deep link')
    for needle in (
        'format/#locked-format',
        'support/#superchat-vs-thanks',
        'pattayastream.com/offline/',
        'pattayastream.com/404/',
    ):
        if needle not in text:
            fail(f'llms.txt missing deep link {needle}')
    manifest = json.loads((ROOT / 'scripts' / 'network_manifest.json').read_text(encoding='utf-8'))
    for site in manifest['live']:
        if site['domain'] == 'pattayastream.com':
            continue
        if site['domain'] not in text:
            fail(f'llms.txt missing network domain {site["domain"]}')
    ok('llms.txt current')


def audit_support_deep_links() -> None:
    faq = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    if faq.count('/support/#free') < 2:
        fail('FAQ has fewer than 2 links to /support/#free')
    if faq.count('/support/#tip-tonight') < 4:
        fail('FAQ has fewer than 4 links to /support/#tip-tonight')
    ok('FAQ support deep links wired')


def audit_faq_jsonld_mesh() -> None:
    faq = (ROOT / 'faq/index.html').read_text(encoding='utf-8')
    needles = (
        'live vs recordings on the format page',
        'locked format rules on the format page',
        'Super Chat vs Super Thanks on the support page',
        'timpaemi.com/privacy',
        'pattayastream.com/LICENSE',
    )
    missing = [n for n in needles if n not in faq]
    if missing:
        fail(f'FAQ JSON-LD answers missing mesh text: {missing[:3]}')
    else:
        ok('FAQ JSON-LD mesh answers synced')


def _main_word_count(html: str) -> int:
    m = re.search(r'<main[^>]*>(.*)</main>', html, re.S | re.I)
    chunk = m.group(1) if m else html
    text = re.sub(r'<script[^>]*>.*?</script>', ' ', chunk, flags=re.S | re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    return len(text.split())


def audit_article_wordcounts() -> None:
    drift = []
    for rel in ('format/index.html', 'code/index.html'):
        text = (ROOT / rel).read_text(encoding='utf-8')
        m = re.search(r'"wordCount":(\d+)', text)
        if not m:
            drift.append(f'{rel} missing wordCount')
            continue
        schema_wc = int(m.group(1))
        actual = _main_word_count(text)
        if abs(schema_wc - actual) > 120:
            drift.append(f'{rel} schema={schema_wc} main={actual}')
    if drift:
        fail(f'Article wordCount drift: {drift[:3]}')
    else:
        ok('Article wordCount schema synced')


def _org_sameas_urls() -> list[str]:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    blocks = re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.DOTALL)
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        graph = data.get('@graph', [data])
        for node in graph:
            if node.get('@id') == 'https://pattayastream.com/#org':
                return list(node.get('sameAs', []))
    return []


def audit_org_sameas_network() -> None:
    manifest = json.loads((ROOT / 'scripts' / 'network_manifest.json').read_text(encoding='utf-8'))
    expected = {f'https://{s["domain"]}/' for s in manifest['live'] if s['domain'] != 'pattayastream.com'}
    same_as = set(_org_sameas_urls())
    missing = sorted(u for u in expected if u not in same_as and u.rstrip('/') not in {x.rstrip('/') for x in same_as})
    if missing:
        fail(f'homepage Organization sameAs missing network URLs: {missing}')
    else:
        ok(f'Organization sameAs lists all {len(expected)} sister domains')


def audit_support_live_banner_slot() -> None:
    html = (ROOT / 'support/index.html').read_text(encoding='utf-8')
    css = (ROOT / 'assets/css/pv-core.css').read_text(encoding='utf-8')
    if 'live-banner-slot' not in html:
        fail('support/index.html missing live-banner-slot wrapper')
    if 'data-live-banner' not in html:
        fail('support/index.html missing data-live-banner')
    if 'data-live-countdown' not in html:
        fail('support/index.html missing data-live-countdown offline strip')
    if '.live-banner-slot' not in css or 'min-height' not in css.split('.live-banner-slot')[1][:200]:
        fail('pv-core.css missing live-banner-slot min-height reserve')
    ok('support live-banner CLS slot wired')


def audit_org_privacy_terms_schema() -> None:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    blocks = re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.DOTALL)
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        graph = data.get('@graph', [data])
        for node in graph:
            if node.get('@id') == 'https://pattayastream.com/#org':
                if node.get('privacyPolicy') != 'https://timpaemi.com/privacy/':
                    fail('Organization schema missing privacyPolicy -> timpaemi.com/privacy/')
                if node.get('termsOfUse') != 'https://pattayastream.com/LICENSE':
                    fail('Organization schema missing termsOfUse -> /LICENSE')
                ok('Organization privacyPolicy + termsOfUse wired')
                return
    fail('Organization node not found for privacy/terms schema')


def audit_live_pill_placeholder() -> None:
    pages = (
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html', 'community/index.html', '404.html', '404/index.html',
    )
    css = (ROOT / 'assets/css/pv-core.css').read_text(encoding='utf-8')
    bad = []
    for rel in pages:
        html = (ROOT / rel).read_text(encoding='utf-8')
        if 'live-status is-placeholder' not in html:
            bad.append(f'{rel} missing SSR live pill placeholder')
    if bad:
        fail(f'live pill SSR placeholder missing: {bad[:4]}')
    if '.live-status.is-placeholder' not in css:
        fail('pv-core.css missing .live-status.is-placeholder rule')
    ok('SSR live pill placeholder on all chrome pages')


def audit_share_placeholder() -> None:
    pages = (
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html', 'community/index.html', '404.html', '404/index.html',
    )
    css = (ROOT / 'assets/css/pv-core.css').read_text(encoding='utf-8')
    bad = []
    for rel in pages:
        html = (ROOT / rel).read_text(encoding='utf-8')
        if 'pv-share is-placeholder' not in html:
            bad.append(f'{rel} missing SSR share button placeholder')
    if bad:
        fail(f'share SSR placeholder missing: {bad[:4]}')
    if '.pv-share.is-placeholder' not in css:
        fail('pv-core.css missing .pv-share.is-placeholder rule')
    ok('SSR share button placeholder on all chrome pages')


def audit_offline_critical_css() -> None:
    css_path = ROOT / 'assets/css/pv-critical-offline.css'
    html = (ROOT / 'offline/index.html').read_text(encoding='utf-8')
    if not css_path.is_file():
        fail('assets/css/pv-critical-offline.css missing')
    if 'id="pv-critical-offline"' not in html:
        fail('offline/index.html missing inline #pv-critical-offline critical CSS block')
    if 'media="print" onload="this.media=\'all\'"' not in html:
        fail('offline/index.html missing async stylesheets')
    if len(re.findall(r'<noscript>', html)) != 1:
        fail('offline/index.html must have exactly one <noscript> fallback block')
    if 'data-gtm="offline_watch_live"' not in html:
        fail('offline/index.html missing data-gtm offline_watch_live on watch CTA')
    inline = re.search(r'<style id="pv-critical-offline">(.*?)</style>', html, re.S)
    if not inline or _normalize_css(inline.group(1)) != _normalize_css(css_path.read_text(encoding='utf-8')):
        fail('offline/index.html critical CSS drift — run python scripts/sync_critical_css.py --offline')
    ok(f'offline critical CSS inlined (async pv-core + pv-sub)')


def _normalize_css(text: str) -> str:
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return re.sub(r'\s+', ' ', text).strip()


def audit_homepage_critical_css() -> None:
    css_path = ROOT / 'assets/css/pv-critical-home.css'
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    if not css_path.exists():
        fail('assets/css/pv-critical-home.css missing')
        return
    if 'id="pv-critical-home"' not in html:
        fail('index.html missing inline #pv-critical-home critical CSS block')
        return
    if 'media="print" onload="this.media=\'all\'"' not in html:
        fail('index.html missing async stylesheet loading for pv-core/pv-home')
    css_min = _normalize_css(css_path.read_text(encoding='utf-8'))
    match = re.search(r'<style id="pv-critical-home">(.*?)</style>', html, re.S)
    if not match:
        fail('index.html critical CSS block not parseable')
        return
    inline = _normalize_css(match.group(1))
    if css_min != inline:
        fail('index.html critical CSS drift — run python scripts/sync_critical_css.py --home')
    ok(f'homepage critical CSS inlined ({len(inline)} bytes, async full stylesheets)')


def audit_subpage_critical_css() -> None:
    css_path = ROOT / 'assets/css/pv-critical-chrome.css'
    if not css_path.exists():
        fail('assets/css/pv-critical-chrome.css missing')
        return
    css_min = _normalize_css(css_path.read_text(encoding='utf-8'))
    pages = (
        'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html', 'community/index.html',
        '404.html', '404/index.html',
    )
    bad = []
    for rel in pages:
        html = (ROOT / rel).read_text(encoding='utf-8')
        if 'id="pv-critical-chrome"' not in html:
            bad.append(f'{rel} missing inline critical CSS')
            continue
        m = re.search(r'<style id="pv-critical-chrome">(.*?)</style>', html, re.S)
        if not m or _normalize_css(m.group(1)) != css_min:
            bad.append(f'{rel} critical CSS drift')
        if f'pv-sub.css?v={SUB_V}" media="print" onload' not in html:
            bad.append(f'{rel} missing async pv-sub.css')
        if 'data-utility-countdown' not in html:
            bad.append(f'{rel} missing utility countdown chip')
    if bad:
        fail(f'subpage critical CSS: {bad[:3]} — run python scripts/sync_critical_css.py --chrome')
    ok(f'subpage critical CSS inlined on {len(pages)} chrome pages (async pv-core + pv-sub)')


def audit_live_status_core_css() -> None:
    css = (ROOT / 'assets/css/pv-core.css').read_text(encoding='utf-8')
    if '.live-status{display:inline-flex' not in css.replace(' ', ''):
        fail('pv-core.css missing base .live-status styles (should not rely on JS injection)')
    if '@keyframes pvlive' not in css:
        fail('pv-core.css missing @keyframes pvlive for live pill dot')
    if '.utility-countdown{' not in css.replace(' ', ''):
        fail('pv-core.css missing .utility-countdown styles for chrome utility bar')
    ok('live pill base styles in pv-core.css (SSR paint without JS)')


def audit_footer_trust_links() -> None:
    pages = (
        'index.html', 'about/index.html', 'support/index.html', 'format/index.html',
        'code/index.html', 'faq/index.html', 'community/index.html', '404.html', '404/index.html',
    )
    bad = []
    for rel in pages:
        html = (ROOT / rel).read_text(encoding='utf-8')
        if 'timpaemi.com/privacy/' not in html:
            bad.append(f'{rel} missing privacy link')
        if 'href="/LICENSE"' not in html:
            bad.append(f'{rel} missing terms link')
    if bad:
        fail(f'footer trust links missing: {bad[:4]}')
    else:
        ok('footer privacy + terms links on all chrome pages')


def main() -> int:
    print('=== PATTAYA VILLA STREAM SEO AUDIT ===\n')
    audit_sitemap()
    audit_robots()
    audit_indexnow()
    audit_canonicals()
    audit_internal_links()
    audit_faq_schema()
    audit_article_wordcounts()
    audit_dedicated_og()
    audit_sitemap_og_images()
    audit_og_file_sizes()
    audit_llms_txt()
    audit_support_deep_links()
    audit_faq_jsonld_mesh()
    audit_support_backlinks()
    audit_donate_action()
    audit_dns_prefetch()
    audit_faq_mesh_links()
    audit_indexed_support_paths()
    audit_speakable_selectors()
    audit_video_graph()
    audit_error_page_schema()
    audit_error_route_parity()
    audit_redirect_shortcuts()
    audit_sticky_support_cta()
    audit_support_speakable()
    audit_network_bar_sync()
    audit_network_strap()
    audit_speakable_dom()
    audit_end_cta_support()
    audit_org_sameas_network()
    audit_org_privacy_terms_schema()
    audit_support_live_banner_slot()
    audit_live_pill_placeholder()
    audit_share_placeholder()
    audit_live_status_core_css()
    audit_homepage_critical_css()
    audit_subpage_critical_css()
    audit_offline_critical_css()
    audit_footer_trust_links()
    audit_date_modified()
    print()
    if warnings:
        print(f'Warnings: {len(warnings)}')
        for w in warnings:
            print(f'  - {w}')
    if failures:
        print(f'\nCritical failures: {len(failures)}')
        for f in failures:
            print(f'  - {f}')
        return 1
    print('\nSEO AUDIT: PASSED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
