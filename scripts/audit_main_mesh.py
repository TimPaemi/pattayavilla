#!/usr/bin/env python3
"""Audit in-page body mesh links inside <main> — complements check_internal_links.py."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

INDEXED_MAIN = (
    'index.html',
    'about/index.html',
    'support/index.html',
    'format/index.html',
    'code/index.html',
    'faq/index.html',
)


def extract_main(rel: str) -> str:
    html = (ROOT / rel).read_text(encoding='utf-8')
    m = re.search(r'<main[^>]*>(.*?)</main>', html, re.S | re.I)
    return m.group(1) if m else ''


def section_slice(main: str, section_id: str) -> str:
    """Rough slice from id=section_id through next </article> or </section>."""
    start = main.find(f'id="{section_id}"')
    if start < 0:
        return ''
    end = len(main)
    for tag in ('</article>', '</section>'):
        pos = main.find(tag, start)
        if pos >= 0:
            end = min(end, pos + len(tag))
    return main[start:end]


def audit_mesh() -> list[str]:
    errors: list[str] = []

    fmt_main = extract_main('format/index.html')
    chat = section_slice(fmt_main, 'chat-is-the-room')
    if chat and 'href="/code/"' not in chat:
        errors.append('format/index.html #chat-is-the-room must link to /code/')
    if chat and 'href="/about/' not in chat:
        errors.append('format/index.html #chat-is-the-room must link to /about/')

    about_main = extract_main('about/index.html')
    contact = section_slice(about_main, 'contact')
    if contact and '/support/#tip-tonight' not in contact:
        errors.append('about/index.html #contact must link to /support/#tip-tonight')

    comm_main = extract_main('community/index.html')
    if comm_main and '/format/#' not in comm_main:
        errors.append('community/index.html <main> must include a /format/# deep link')
    if comm_main and '/support/#free' not in comm_main:
        errors.append('community/index.html <main> must link to /support/#free')

    code_main = extract_main('code/index.html')
    first = section_slice(code_main, 'first-night')
    if first and 'href="/faq/"' not in first:
        errors.append('code/index.html #first-night must link to /faq/')
    if first and 'timpaemi.com/live' not in first:
        errors.append('code/index.html #first-night must link to timpaemi.com/live')

    for rel in INDEXED_MAIN:
        main = extract_main(rel)
        if not main:
            errors.append(f'{rel} missing <main>')
            continue
        if rel != 'format/index.html' and 'href="/format/' not in main:
            errors.append(f'{rel} <main> must link to /format/')
        if rel != 'code/index.html' and 'href="/code/' not in main:
            errors.append(f'{rel} <main> must link to /code/')
        if rel != 'faq/index.html' and 'href="/faq/' not in main:
            errors.append(f'{rel} <main> must link to /faq/')
        if rel != 'support/index.html' and not re.search(
            r'href="/support/#(?:free|tip-tonight)', main
        ):
            errors.append(f'{rel} <main> must deep-link /support/#free or #tip-tonight')

    home_main = extract_main('index.html')
    if home_main and 'pattaya-authority.com' not in home_main:
        errors.append('index.html <main> must link to pattaya-authority.com')

    return errors


def main() -> int:
    errors = audit_mesh()
    if errors:
        for e in errors[:25]:
            print(f'::error::{e}')
        return 1
    print('Main body mesh links: PASS')
    return 0


if __name__ == '__main__':
    sys.exit(main())
