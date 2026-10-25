// Copies the two self-hosted Latin display fonts (both SIL OFL) into ../assets/fonts.
import { copyFileSync, mkdirSync } from 'node:fs';
const dest = new URL('../assets/fonts/', import.meta.url);
mkdirSync(dest, { recursive: true });
const files = [
  ['@fontsource/yellowtail/files/yellowtail-latin-400-normal.woff2', 'yellowtail-latin-400.woff2'],
  ['@fontsource/oswald/files/oswald-latin-600-normal.woff2', 'oswald-latin-600.woff2'],
  ['@fontsource/oswald/LICENSE', 'OFL.txt'],
];
for (const [from, to] of files) copyFileSync(new URL(`./node_modules/${from}`, import.meta.url), new URL(to, dest));
console.log('fonts copied');
