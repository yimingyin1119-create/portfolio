import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { COUNTRIES, PINS, DOTS } from '../data/places.js';
import { QUESTS, BADGES_NOVICE, WORKS, CASES } from '../data/content.js';
import { VIEW, LAND, POINTS, FOCUS } from '../assets/map/world.js';

const IMG = new URL('../assets/img/', import.meta.url);
const FONTS = new URL('../assets/fonts/', import.meta.url);

// Photos the page markup uses directly, beyond those referenced from data.
const MARKUP_PHOTOS = ['portrait', 'spring-gala', 'hainan', 'ambassadors', 'ambassador-talk', 'middelburg', 'badminton',
  'amalfi', 'rain-lake', 'xuanwu', 'canon', 'fuji', 'graduation', 'lianyungang', 'nezha-note', 'kuaishou', 'pdd_popup'];

function photoIds() {
  const ids = new Set(MARKUP_PHOTOS);
  for (const x of [...PINS, ...QUESTS, ...BADGES_NOVICE, ...WORKS]) if (x.photo) ids.add(x.photo);
  for (const c of CASES) {
    if (c.img) ids.add(c.img);
    for (const [k] of c.imgs ?? []) ids.add(k);
  }
  return [...ids];
}

test('map has a land path and a point inside the view for every city', () => {
  assert.ok(LAND.startsWith('M') && LAND.length > 1000);
  for (const { city } of [...PINS, ...DOTS]) {
    const p = POINTS[city];
    assert.ok(p, city);
    assert.ok(p[0] >= 0 && p[0] <= VIEW.width && p[1] >= 0 && p[1] <= VIEW.height, city);
  }
});

test('every country has a fly-to focus', () => {
  for (const c of COUNTRIES) {
    const f = FOCUS[c.id];
    assert.ok(f, c.id);
    assert.ok(f.scale >= 1 && f.scale <= 6, c.id);
  }
});

test('every referenced photo exists in both sizes, within budget, without EXIF', () => {
  for (const id of photoIds()) {
    for (const size of ['s', 'l']) {
      const url = new URL(`${id}-${size}.webp`, IMG);
      assert.ok(existsSync(url), `${id}-${size}.webp missing`);
      const bytes = readFileSync(url);
      assert.ok(!bytes.includes(Buffer.from('Exif')), `${id}-${size} has EXIF`);
      if (size === 'l') assert.ok(bytes.length <= 150 * 1024, `${id}-l is ${bytes.length} bytes`);
    }
  }
});

test('fonts are self-hosted woff2 and small', () => {
  const files = readdirSync(FONTS);
  assert.ok(files.length >= 2);
  let total = 0;
  for (const f of files) {
    assert.ok(f.endsWith('.woff2') || f.endsWith('.txt') || f === 'display.chars', f);
    if (!f.startsWith('display')) total += statSync(new URL(f, FONTS)).size;
  }
  assert.ok(total < 120 * 1024, `latin fonts total ${total}`);
});

test('the title face is cut to the characters the titles use, and the cut is current', async () => {
  const { displayChars } = await import('../tools/display-chars.mjs');
  const woff = new URL('display-serif-900.woff2', FONTS);
  assert.ok(existsSync(woff));
  assert.ok(statSync(woff).size < 260 * 1024, `display font ${statSync(woff).size}`);
  const cut = new Set(readFileSync(new URL('display.chars', FONTS), 'utf8'));
  const missing = [...displayChars()].filter(c => !cut.has(c));
  assert.deepEqual(missing, [], 'run tools/subset-display.py again');
});
