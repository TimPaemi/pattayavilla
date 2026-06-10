#!/usr/bin/env python3
"""Append the above-fold subset of the runtime layer to the critical CSS files.

These rules previously arrived late (JS-injected) and repainted the hero h1 /
above-fold chrome after first paint. Inlining them means the first paint
already matches the final cascade, so the LCP element never re-renders.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARK_START = '/* === runtime-layer above-fold subset (keep in sync with pv-sub/pv-home runtime layer) === */'
MARK_END = '/* === end runtime-layer subset === */'

SUBSET = '''html,body{overflow-x:clip;max-width:100vw}
html{scroll-padding-top:80px;hanging-punctuation:first allow-end last}
h1,h2,h3,.section-title,.tier-name,.equal-paths-q{text-wrap:balance}
.hero h1,.footer-brand,.section-title{text-box:trim-both cap alphabetic}
.lead,.hero-sub,.body-section p,.tier-body,.manifesto p{text-wrap:pretty}
@supports(padding:env(safe-area-inset-bottom)){.sticky-cta{padding-bottom:env(safe-area-inset-bottom)}body{padding-bottom:calc(62px + env(safe-area-inset-bottom))}}
@media(max-width:760px){
  main{padding-left:0;padding-right:0}
  section{padding:2.2rem 1rem!important}
  .hero{padding:1.6rem 1rem 2.2rem!important}
  .hero h1{font-size:clamp(3rem,12.5vw,5.4rem)!important;line-height:.9;letter-spacing:-.012em;margin:0 0 .8rem}
  .hero p,.hero-sub,.lead{font-size:.98rem;line-height:1.55;margin:0 0 1rem}
  .hero-eyebrow{font-size:.58rem;letter-spacing:1.6px;padding:.32rem .75rem;margin-bottom:.9rem}
  .hero-meta{font-size:.58rem;letter-spacing:1.5px;margin-bottom:1.2rem;line-height:1.6}
  .hero-cta,.end-cta,.equal-paths-cta,.watch-bar,.cta-row{display:flex;flex-direction:column;align-items:stretch;gap:.6rem;width:100%}
  .hero-cta .btn,.end-cta .btn,.equal-paths-cta a,.watch-bar .btn{width:100%;justify-content:center;text-align:center}
  .btn{padding:.95rem 1.4rem;font-size:.75rem;letter-spacing:1.6px;min-height:48px}
  .btn-mega{font-size:.95rem;padding:1.05rem 1.5rem;letter-spacing:1.9px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin:1.2rem 0 0}
  .stat{padding:1rem .75rem}
  .stat-num{font-size:clamp(2rem,8vw,3rem)}
  .stat-label{font-size:.55rem;letter-spacing:1.3px}
  .sticky-cta a{font-size:.7rem;letter-spacing:1.3px;padding:.85rem .6rem;min-height:64px;gap:.35rem}
  body{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))}
  .page-breadcrumb{position:sticky;top:0;z-index:100;background:rgba(8,8,12,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:2px solid #ff2f8e;margin:0 0 1.2rem 0!important;padding:.85rem 1rem;width:100%;view-transition-name:brand-bar}
  .page-breadcrumb ol{justify-content:center}
  .page-breadcrumb a{font-family:"Bebas Neue",sans-serif;font-size:1.15rem;letter-spacing:.04em}
  .page-breadcrumb [aria-current="page"]{font-family:"Bebas Neue",sans-serif;font-size:1.15rem;letter-spacing:.04em;color:#ffe156}
}
@media(max-width:440px){
  .utility-bar{padding:.5rem .75rem;min-height:40px}
  .utility-bar .live-status{font-size:.6rem;letter-spacing:1.5px;padding:.4rem .85rem;min-height:44px}
  .marquee-track{font-size:.62rem;letter-spacing:1.4px;animation-duration:36s}
  .hero h1{font-size:clamp(2.5rem,12vw,4.4rem)!important;line-height:.92;letter-spacing:-.018em;word-break:break-word;overflow-wrap:anywhere}
  .hero-eyebrow{font-size:.54rem;letter-spacing:1.4px;padding:.28rem .65rem;margin-bottom:.75rem}
  .hero p,.hero-sub{font-size:.95rem}
  section,.hero{padding-left:.85rem!important;padding-right:.85rem!important}
  .btn{font-size:.72rem;letter-spacing:1.4px;padding:.85rem 1.2rem}
  .btn-mega{font-size:.86rem;padding:.95rem 1.3rem;letter-spacing:1.7px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}
  .stat{padding:.85rem .55rem}
  .sticky-cta a{font-size:.64rem;letter-spacing:1.2px;padding:.8rem .45rem;min-height:60px}
  body{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px))}
}
@media(max-width:360px){
  .utility-bar .live-status{font-size:.55rem;letter-spacing:1.3px;padding:.35rem .7rem}
  .hero h1{font-size:clamp(2.2rem,12.5vw,4rem)!important;letter-spacing:-.02em}
  .marquee-track{font-size:.58rem;animation-duration:30s}
  .stats{grid-template-columns:1fr;gap:.5rem}
  .sticky-cta a{font-size:.58rem;letter-spacing:1px;padding:.75rem .35rem}
}'''


def patch(path: Path) -> None:
    t = path.read_text(encoding='utf-8')
    if MARK_START in t:
        t = re.sub(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END), '', t, flags=re.S).rstrip() + '\n'
    t = t.rstrip() + f'\n\n{MARK_START}\n{SUBSET}\n{MARK_END}\n'
    path.write_text(t, encoding='utf-8')
    print(f'subset -> {path.relative_to(ROOT)}')


if __name__ == '__main__':
    patch(ROOT / 'assets/css/pv-critical-chrome.css')
    patch(ROOT / 'assets/css/pv-critical-home.css')
