// Small helpers for the build-time page generator.
import { readFileSync } from 'node:fs';
import { chapterArt, sea } from './art.mjs';

// Open water above each chapter gets one chart ornament, on alternating sides.
const SEA = { skills: ['waves', 'r'], quests: ['ship', 'l'], posters: ['whale', 'r'], cases: ['compass', 'l'], bridge: ['serpent', 'r'], novice: ['anchor', 'l'], map: ['waves', 'r'], abroad: ['ship', 'l'], viewfinder: ['serpent', 'r'], contact: ['whale', 'l'] };

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const IMG_DIR = new URL('../assets/img/', import.meta.url);

// Reads width/height from a WebP header (VP8, VP8L and VP8X).
export function webpSize(file) {
  const b = readFileSync(file);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') {
    const [b0, b1, b2, b3] = [b[21], b[22], b[23], b[24]];
    return [1 + (b0 | ((b1 & 0x3f) << 8)), 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10))];
  }
  throw new Error(`unknown webp chunk ${kind} in ${file}`);
}

// <img> with both sizes, real dimensions and lazy loading unless `eager`.
export function img(id, alt, { eager = false, cls = '', sizes = '(max-width: 720px) 100vw, 480px' } = {}) {
  const [w, h] = webpSize(new URL(`${id}-l.webp`, IMG_DIR));
  const lazy = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img${cls ? ` class="${cls}"` : ''} src="assets/img/${id}-s.webp" srcset="assets/img/${id}-s.webp 480w, assets/img/${id}-l.webp ${w}w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" ${lazy} decoding="async">`;
}

// A chapter: kicker in display Latin, title in heavy italic Chinese.
export function chapter(id, kicker, title, body, { sub = '' } = {}) {
  const water = SEA[id] ? `<span class="water ${SEA[id][1]}">${sea(SEA[id][0])}</span>` : '';
  return `<section class="chapter" id="${id}" data-chapter="${id}" aria-labelledby="h-${id}">${water}
  <header class="ch-head" data-reveal>${chapterArt(id)}<p class="kicker">${esc(kicker)}</p><h2 id="h-${id}">${title}</h2>${sub ? `<p class="ch-sub">${sub}</p>` : ''}</header>
  ${body}
</section>`;
}
