// Renders ../index.html from src/ and data/. Run from tools/: node build-page.mjs
import { writeFileSync } from 'node:fs';
import { renderPage } from '../src/page.mjs';
const html = renderPage();
writeFileSync(new URL('../index.html', import.meta.url), html);
console.log(`index.html ${(html.length / 1024).toFixed(1)} KB`);
