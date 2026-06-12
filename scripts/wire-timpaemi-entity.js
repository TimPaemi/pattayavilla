// Wire canonical TimPaemi author entity + Pattaya After Dark into all pages. Idempotent.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const PAGES = ['index.html', '404.html', '404/index.html', 'about/index.html', 'code/index.html',
  'community/index.html', 'faq/index.html', 'format/index.html', 'support/index.html', 'watch/index.html'];

const UTIL_OLD = '<a href="https://pattaya-vehicle-rentals.com/" target="_blank" rel="noopener noreferrer">Rentals</a>';
const UTIL_NEW = UTIL_OLD + '\n    <a href="https://pattaya-afterdark.com/" target="_blank" rel="noopener noreferrer">After Dark</a>';

const FOOT_OLD = '<li><a href="https://pattaya-vehicle-rentals.com/" target="_blank" rel="noopener noreferrer"><strong>Vehicle Rentals</strong><span>Bikes, cars, scooters</span></a></li>';
const FOOT_NEW = FOOT_OLD + '\n        <li><a href="https://pattaya-afterdark.com/" target="_blank" rel="noopener noreferrer"><strong>After Dark</strong><span>Pattaya nightlife, hour by hour</span></a></li>';

const PERSON_NODE = '{"@type":"Person","@id":"https://timpaemi.com/#timpaemi","name":"TimPaemi","alternateName":["Tim Paemi","Paemi Tim","Tim & Paemi","TIMPAEMI"],"url":"https://timpaemi.com/","image":"https://timpaemi.com/authors/timpaemi.jpg","jobTitle":"Founders & editors, Pattaya Authority network","worksFor":{"@id":"https://timpaemi.com/#org"},"knowsAbout":["Pattaya","Pattaya nightlife","Livestreaming","Thailand travel","Local directory editorial"],"sameAs":["https://www.youtube.com/@timpaemi","https://www.tiktok.com/@timpaemi.com","https://www.instagram.com/timpaemi/","https://www.facebook.com/profile.php?id=61583166493467","https://timpaemi.com/","https://pattaya-authority.com/","https://pattaya-gym.com/","https://pattaya-afterdark.com/","https://pattaya-restaurant-guide.com/","https://pattayavisahelp.com/","https://pattaya-school-guide.com/","https://pattaya-coffee.com/","https://pattayastream.com/","https://pattaya-medical.com/","https://pattayapets.com/","https://pattaya-vehicle-rentals.com/","https://pattayapersonaltrainer.com/","https://mrweoutside.com/","https://pattayaolympian.com/"]}';

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
  html = html.replace(/ALL 14 SITES/g, 'ALL 15 SITES')
             .replace(/14-site/g, '15-site')
             .replace(/14-SITE/g, '15-SITE')
             .replace(/14 sites/g, '15 sites')
             .replace(/14 sister sites/g, '15 sister sites');

  if (rel === 'index.html') {
    // org sameAs: append afterdark
    html = html.replace(
      '"https://pattaya-vehicle-rentals.com/","https://pattayapersonaltrainer.com/","https://pattayaolympian.com/","https://mrweoutside.com/"]',
      '"https://pattaya-vehicle-rentals.com/","https://pattayapersonaltrainer.com/","https://pattayaolympian.com/","https://mrweoutside.com/","https://pattaya-afterdark.com/"]'
    );
    if (!html.includes('"@id":"https://timpaemi.com/#timpaemi"')) {
      html = html.replace(PAEMI_END, PAEMI_END + '\n' + PERSON_NODE + ',');
    }
  }

  if (html !== before) { fs.writeFileSync(fp, html); console.log('patched', rel); }
  else console.log('unchanged', rel);
}
