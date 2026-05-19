# Security Policy

## Reporting a vulnerability

If you discover a security issue affecting **pattayastream.com** or this repository, please contact us privately. **Do not open a public GitHub issue.**

### Preferred channel

**Email:** info@pattayastream.com
**Subject:** `SECURITY · PATTAYA VILLA STREAM · [short summary]`

Please include:

- The URL or component affected (e.g., `https://pattayastream.com/support/`, `sw.js`, etc.)
- Steps to reproduce — exact actions, payloads, screenshots if relevant
- Your assessment of severity (informational / low / medium / high / critical)
- Whether the issue is exploitable as-is, or requires specific conditions
- A safe contact address for follow-up

### Response timeline

We aim to acknowledge reports within **48 hours** and provide an initial assessment within **7 days**.

We will keep you informed as we investigate and remediate. We're a small operator — please be patient.

### Scope

In scope:
- The live site `pattayastream.com` and all its sub-paths
- This repository's deployed code
- The Service Worker, Web Vitals reporting, and any in-browser logic

Out of scope:
- Cloudflare Pages infrastructure itself (report to Cloudflare directly)
- Third-party services we link to (YouTube, WhatsApp share, etc. — report to those providers)
- Issues requiring physical access to operator devices
- Self-XSS or attacks requiring social engineering against the operator

### Disclosure

We follow **coordinated disclosure**. We'll work with you on a fix and a public disclosure timeline that protects users. Researchers who report in good faith and follow this policy will be publicly thanked (with consent and an alias if preferred) in the relevant release notes.

We do not currently offer a paid bounty program. We do offer respect and a credit.

## Related

- Operator security contact: <https://pattayastream.com/.well-known/security.txt> (RFC 9116)
- Operator privacy policy: <https://timpaemi.com/privacy/>
- License (proprietary): see [LICENSE](LICENSE)
