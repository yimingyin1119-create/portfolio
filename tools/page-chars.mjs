// Every character the main page can show in body text: the built page, the data, and strings built in the browser.
// Used to cut the text faces (tools/subset-display.py) and by the test that checks the cut is current.
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const files = ['index.html', 'en.html', 'data/content.en.js', 'data/places.en.js', ...readdirSync(new URL('assets/js/', root)).map(f => `assets/js/${f}`), 'data/content.js', 'data/places.js'];

export function pageChars() {
  const parts = files.map(f => readFileSync(new URL(f, root), 'utf8'));
  for (let i = 32; i < 127; i++) parts.push(String.fromCharCode(i));
  parts.push('，。、：；！？「」『』《》（）·—…“”‘’→←＋×％～');
  return [...new Set(parts.join('').replace(/\s/g, ''))].filter(c => c.codePointAt(0) < 0x10000 && c.codePointAt(0) >= 32).sort().join('');
}

if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(pageChars());
