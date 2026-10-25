import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, PINS, DOTS } from '../data/places.js';
import { CASES, QUESTS, POSTERS, PROFILE } from '../data/content.js';

test('26 countries with the confirmed unlock years', () => {
  assert.equal(COUNTRIES.length, 26);
  const perYear = y => COUNTRIES.filter(c => c.year <= y).length;
  assert.deepEqual([2019, 2022, 2023, 2024, 2025, 2026].map(perYear), [5, 5, 10, 14, 20, 26]);
});

test('every pin and dot belongs to a listed country', () => {
  const ids = new Set(COUNTRIES.map(c => c.id));
  for (const p of [...PINS, ...DOTS]) assert.ok(ids.has(p.countryId), p.city);
});

// Forbidden names are checked by the private pre-launch audit, so they never appear in this public file.
test('the newest quest is the Douyin internship, named as 抖音', () => {
  assert.equal(QUESTS[0].company, '抖音');
});

test('Douyin posters are approximate and do not count up', () => {
  const dy = POSTERS.filter(p => p.id.startsWith('dy-'));
  assert.ok(dy.length > 0);
  for (const p of dy) assert.equal(p.count, false);
  assert.ok(POSTERS.some(p => p.value === '4310 万' && p.count));
});

test('Douyin quest says the role honestly', () => {
  const t = QUESTS[0].did.join('');
  assert.ok(t.includes('不是总负责人'));
  assert.ok(!/主导|总负责(?!人)/.test(t));
});

test('the Shaanxi case shows only approximate figures', () => {
  const s = JSON.stringify(CASES.find(c => c.id === 'shaanxi'));
  assert.ok(s.includes('亿级曝光'));
  // no exact figure of any kind: no percentages and no counted 万/亿 amounts
  assert.ok(!/%|\d\s*万|\d\s*亿/.test(s));
});
