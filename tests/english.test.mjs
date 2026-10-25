import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { MODES } from '../assets/js/modes.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('an English page exists alongside the Chinese one, and each links to the other', () => {
  assert.ok(existsSync(new URL('../en.html', import.meta.url)));
  const zh = read('index.html'), en = read('en.html');
  assert.ok(zh.includes('<html lang="zh-CN">') && en.includes('<html lang="en">'));
  assert.ok(/<a[^>]+class="lang"[^>]+href="en\.html"[^>]*hreflang="en"/.test(zh));
  assert.ok(/<a[^>]+class="lang"[^>]+href="index\.html"[^>]*hreflang="zh-CN"/.test(en));
  for (const id of MODES.interviewer) assert.ok(en.includes(`data-chapter="${id}"`), id);
});

test('the English page shows no Chinese except her name and the Chinese titles of works it quotes', () => {
  const en = read('en.html');
  const visible = en.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<a class="lang"[^>]*>[^<]*<\/a>/g, '').replace(/download="[^"]*"/g, '').replace(/href="[^"]*"/g, '').replace(/src(set)?="[^"]*"/g, '');
  const allowed = new Set([...'尹伊茗']);
  const stray = [...new Set(visible.match(/[㐀-鿿]/g) ?? [])].filter(c => !allowed.has(c));
  assert.deepEqual(stray, [], `untranslated: ${stray.join('')}`);
});

test('the English page loads the English data through its import map', () => {
  const en = read('en.html');
  const map = JSON.parse(en.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  assert.ok(map['./data/content.js'].startsWith('./data/content.en.js?v='));
  assert.ok(map['./data/places.js'].startsWith('./data/places.en.js?v='));
});

test('English data keeps the same shape and the Douyin redaction rules', async () => {
  const zh = await import('../data/content.js'), en = await import('../data/content.en.js');
  for (const k of ['CASES', 'QUESTS', 'POSTERS', 'PROFILE', 'BADGES_NOVICE', 'WORKS']) {
    assert.deepEqual(en[k].map(x => x.id ?? x.key), zh[k].map(x => x.id ?? x.key), k);
  }
  assert.deepEqual(Object.keys(en.STORIES), Object.keys(zh.STORIES));
  assert.deepEqual(en.POSTERS.map(p => p.count), zh.POSTERS.map(p => p.count));
  const dy = JSON.stringify([en.CASES.filter(c => c.feat), en.QUESTS[0], en.STORIES.xian, en.POSTERS.filter(p => p.id.startsWith('dy-'))]);
  assert.ok(!/\bled\b|life services?|local services?/i.test(dy));
  assert.ok(!/\d\s*%|\d+(\.\d+)?\s*(million|billion|m\b)/i.test(JSON.stringify(en.CASES.find(c => c.id === 'shaanxi'))));
  const { COUNTRIES } = await import('../data/places.en.js');
  for (const c of COUNTRIES) assert.ok(/^[A-Za-z .'-]+$/.test(c.name), c.id);
});
