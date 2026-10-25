// Renders ../index.html (Chinese) and ../en.html (English) from src/ and data/. Run from tools/: node build-page.mjs
// Every stylesheet and script URL gets ?v=<content hash>, so after a deploy no browser mixes the new page with a
// cached old file (GitHub Pages caches each file for 10 minutes). Modules are versioned through an import map;
// on the English page the same map points data/content.js and data/places.js at their English twins.
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { renderPage } from '../src/page.mjs';
import { setLang } from '../src/i18n.mjs';

const root = new URL('../', import.meta.url);
const hash = p => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex').slice(0, 10);
const versioned = p => `${p}?v=${hash(p)}`;
const modules = [...readdirSync(new URL('assets/js/', root)).filter(f => f.endsWith('.js')).map(f => `assets/js/${f}`), 'data/content.js', 'data/places.js', 'assets/map/world.js'];
const SWAP = { en: { 'data/content.js': 'data/content.en.js', 'data/places.js': 'data/places.en.js' }, zh: {} };

for (const [lang, file] of [['zh', 'index.html'], ['en', 'en.html']]) {
  setLang(lang);
  const target = p => SWAP[lang][p] ?? p;
  const importmap = `<script type="importmap">${JSON.stringify({ imports: Object.fromEntries(modules.map(p => [`./${p}`, `./${versioned(target(p))}`])) })}</script>`;
  const html = renderPage()
    .replace(/<link rel="stylesheet" href="(assets\/css\/[^"?]+)"/g, (_, p) => `<link rel="stylesheet" href="${versioned(p)}"`)
    .replace('<script type="module" src="assets/js/main.js"></script>', `${importmap}\n<script type="module" src="${versioned('assets/js/main.js')}"></script>`);
  writeFileSync(new URL(file, root), html);
  console.log(`${file} ${(html.length / 1024).toFixed(1)} KB`);
}
setLang('zh');
