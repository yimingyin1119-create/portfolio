// Every character drawn in the hand face (霞鹜文楷): the logbook pages, try-this notes, lens notes, attribute proofs,
// quotes and the map's save-file cards. Used to cut the font (subset-display.py) and by the test that checks the cut.
import { readFileSync } from 'node:fs';
import * as ZH from '../data/content.js';
import * as EN from '../data/content.en.js';

// Blocks styled with var(--f-hand); keep in sync with the CSS.
const BLOCKS = ['<article class="case-leaf"', '<p class="play-try"', '<ol class="xnotes"', '<p class="proof"', '<blockquote'];
const END = { '<article class="case-leaf"': '</article>', '<p class="play-try"': '</p>', '<ol class="xnotes"': '</ol>', '<p class="proof"': '</p>', '<blockquote': '</blockquote>' };

const text = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

export function handChars(html = ['index.html', 'en.html'].map(f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n')) {
  const parts = [];
  for (const start of BLOCKS) {
    let i = 0;
    while ((i = html.indexOf(start, i)) !== -1) { const j = html.indexOf(END[start], i); parts.push(text(html.slice(i, j))); i = j; }
  }
  for (const d of [ZH, EN]) for (const s of Object.values(d.STORIES)) parts.push(s.title, s.meta, s.text);   // map save-file cards
  for (let i = 32; i < 127; i++) parts.push(String.fromCharCode(i));
  parts.push('，。、：；！？「」『』《》（）·—…“”‘’→←＋×％');
  return [...new Set(parts.join('').replace(/\s/g, ''))].sort().join('');
}

if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(handChars());
