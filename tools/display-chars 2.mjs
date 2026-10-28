// Every character drawn in the display face (titles), so the font can be cut down to just those glyphs.
// Used by tools/subset-display.py (through `node display-chars.mjs`) and by the test that checks the cut is current.
import { readFileSync } from 'node:fs';
import { STORIES, WORKS } from '../data/content.js';

// Elements styled with var(--f-display); keep in sync with the CSS.
const TAGS = ['h1', 'h2', 'h3'];
const CLASSES = ['attr-v', 'tx', 'big', 'screen-tx', 'frame-tx'];

const text = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

export function displayChars(html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')) {
  const parts = [];
  for (const t of TAGS) for (const m of html.matchAll(new RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)</${t}>`, 'g'))) parts.push(text(m[1]));
  for (const c of CLASSES) for (const m of html.matchAll(new RegExp(`<(\\w+)[^>]*class="(?:[^"]*\\s)?${c}(?:\\s[^"]*)?"[^>]*>([\\s\\S]*?)</\\1>`, 'g'))) parts.push(text(m[2]));
  // built in the browser: map archive cards, the projector screen, the badge list
  for (const s of Object.values(STORIES)) parts.push(s.title);
  for (const w of WORKS) parts.push(w.title, w.platform);
  // printable ASCII and common CJK punctuation, so small edits rarely need a re-cut
  for (let i = 32; i < 127; i++) parts.push(String.fromCharCode(i));
  parts.push('，。、：；！？「」『』《》（）·—…“”‘’→←＋');
  return [...new Set(parts.join('').replace(/\s/g, ''))].sort().join('');
}

if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(displayChars());
