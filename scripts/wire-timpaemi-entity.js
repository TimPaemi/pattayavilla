// Wire canonical TimPaemi author entity + Pattaya After Dark into all pages. Idempotent.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const PAGES = ['index.html', '404.html', '404/index.html', 'about/index.html', 'code/index.html',
  'community/index.html', 'faq/index.html', 'format/index.html', 'support/index.html', 'watch/index.html'];

const UTIL_OLD = 'Rentals';
const UTIL_NEW = UTIL_OLD + '\n    After Dark';

const FOOT_OLD = '';
const FOOT_NEW = FOOT_OLD + '\n';

const PERSON_NODE = '{"@type":"Person","@id":"https://timpaemi.com/#timpaemi","name":"TimPaemi","alternateName":["Tim Paemi","Paemi Tim","Tim & Paemi","TIMPAEMI"],"url":"https://timpaemi.com/","image":"https://timpaemi.com/authors/timpaemi.jpg","jobTitle":"Founders & editors, Pattaya Authority network","worksFor":{"@id":"https://timpaemi.com/#org"},"knowsAbout":["Pattaya","Pattaya nightlife","Livestreaming","Thailand travel","Local directory editorial"],"sameAs":["https://www.youtube.com/@timpaemi","https://www.tiktok.com/@timpaemi.com","https://www.instagram.com/timpaemi/","https://www.facebook.com/timpaemi","https://pattaya-authority.com/","https://pattayastream.com/"]}';

// Anchor: end of the local #paemi Person node line in the index @graph.
const PAEMI_END = '"sameAs":["https://timpaemi.com/","https://www.youtube.com/@timpaemi","https://www.instagram.com/timpaemi/"]},';

for (const rel of PAGES) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) { console.log('missing', rel); continue; }
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;

  if (!html.includes('pattaya-afterdark.com/" target="_blank" rel="noopener noreferrer">After Dark')) {
    html = html.split(UTIL_OLD).join(UTIL_NEW);
  }
  if (!html.includes('<strong>After Dark</strong>')) {
    html = html.split(FOOT_OLD).join(FOOT_NEW);
  }
  // Canonical network size = 18 owned Pattaya sites. Number-agnostic so it pins to 18 and never drifts.
  html = html.replace(/ALL \d+ SITES/g, 'ALL 18 SITES')
             .replace(/\b\d+-site\b/g, '18-site')
             .replace(/\b\d+-SITE\b/g, '18-SITE')
             .replace(/\b\d+ sister sites\b/g, '18 sister sites');

  if (rel === 'index.html') {
    // Note: sister-site URLs are intentionally NOT appended to org sameAs
    // (sameAs = social profiles + publisher hub only, no network mesh).
    if (!html.includes('"@id":"https://timpaemi.com/#timpaemi"')) {
      html = html.replace(PAEMI_END, PAEMI_END + '\n' + PERSON_NODE + ',');
    }
  }

  if (html !== before) { fs.writeFileSync(fp, html); console.log('patched', rel); }
  else console.log('unchanged', rel);
}
