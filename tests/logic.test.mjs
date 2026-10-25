import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore } from '../assets/js/storage.js';
import { unlockedAt, clampYear, YEARS } from '../assets/js/timeline.js';
import { MODES, orderFor, loadMode, saveMode } from '../assets/js/modes.js';
import { parseCount, frame } from '../assets/js/count.js';
import { createTracker, RULES, progress } from '../assets/js/achievements.js';

test('store falls back to memory when storage throws', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const s = makeStore(bad);
  s.set('a', '1');
  assert.equal(s.get('a'), '1');
});

test('store works with no storage at all', () => {
  const s = makeStore(undefined);
  assert.equal(s.get('missing'), null);
  s.set('k', 'v');
  assert.equal(s.get('k'), 'v');
});

test('unlock counts follow the confirmed table', () => {
  assert.deepEqual([2019, 2022, 2023, 2024, 2025, 2026].map(y => unlockedAt(y).count), [5, 5, 10, 14, 20, 26]);
  assert.deepEqual(YEARS, [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
});

test('years outside the range are clamped', () => {
  assert.equal(clampYear(2010), 2019);
  assert.equal(clampYear(2031), 2026);
  assert.equal(clampYear(Number.NaN), 2026);
  assert.equal(unlockedAt(2031).count, 26);
  assert.equal(unlockedAt(2010).count, 5);
});

test('cities unlock with their country unless the pin says later', () => {
  assert.ok(unlockedAt(2019).cities.includes('南京'));
  assert.ok(!unlockedAt(2023).cities.includes('北京'));
  assert.ok(unlockedAt(2025).cities.includes('北京'));
  assert.ok(unlockedAt(2023).cities.includes('阿姆斯特丹'));
});

test('mode order: unknown mode falls back to interviewer, both modes list every chapter', () => {
  assert.deepEqual(orderFor('???'), MODES.interviewer);
  assert.deepEqual([...MODES.friend].sort(), [...MODES.interviewer].sort());
  assert.equal(MODES.friend[1], 'map');
  assert.equal(MODES.interviewer[1], 'skills');
  assert.equal(MODES.interviewer.length, 11);
});

test('mode persists and survives a broken store', () => {
  const s = makeStore(undefined);
  assert.equal(loadMode(s), null);
  saveMode(s, 'friend');
  assert.equal(loadMode(s), 'friend');
  saveMode(s, 'nonsense');
  assert.equal(loadMode(s), 'friend');
});

test('count parsing keeps units and decimals; approximate text is not counted', () => {
  assert.deepEqual(parseCount('4310 万'), { num: 4310, decimals: 0, prefix: '', suffix: ' 万' });
  assert.equal(parseCount('5.8 万').decimals, 1);
  assert.equal(parseCount('亿级曝光'), null);
  assert.equal(parseCount('数百万级'), null);
  assert.equal(frame('5.8 万', 1), '5.8 万');
  assert.equal(frame('4310 万', 1), '4310 万');
  assert.equal(frame('26', 0), '0');
  assert.equal(frame('26', 2), '26');
  assert.equal(frame('亿级曝光', 0.5), '亿级曝光');
});

test('achievements unlock once and persist', () => {
  const s = makeStore(undefined);
  const seen = [];
  const t = createTracker(s, r => seen.push(r.id));
  t.record('card-open', { pin: 'amsterdam' });
  t.record('card-open', { pin: 'nanjing' });
  assert.deepEqual(seen, ['first-card']);
  t.record('timeline', { count: 9 });
  assert.ok(!seen.includes('ten-countries'));
  t.record('timeline', { count: 10 });
  assert.ok(seen.includes('ten-countries'));
  assert.ok(createTracker(s, () => {}).unlocked().includes('first-card'));
});

test('achievement list has the required rules and stays small', () => {
  const ids = RULES.map(r => r.id);
  for (const id of ['novice-done', 'first-card', 'ten-countries', 'all-quests', 'add-friend']) assert.ok(ids.includes(id), id);
  assert.ok(RULES.length >= 6 && RULES.length <= 8);
});

test('all quests unlocks only after every quest card is flipped', () => {
  const seen = [];
  const t = createTracker(makeStore(undefined), r => seen.push(r.id));
  for (const id of ['douyin', 'kuaishou', 'chinadaily']) t.record('quest-flip', { id });
  t.record('quest-flip', { id: 'douyin' });
  assert.ok(!seen.includes('all-quests'));
  t.record('quest-flip', { id: 'weibo' });
  assert.ok(seen.includes('all-quests'));
});

test('bridge levels: 0–8 normal, 9–18 needs attention, above that serious', async () => {
  const { levelFor } = await import('../assets/js/bridge.js');
  assert.deepEqual([0, 8, 9, 17, 18, 19, 30].map(n => levelFor(n).key), ['ok', 'ok', 'warn', 'warn', 'warn', 'bad', 'bad']);
  assert.ok(levelFor(30).mail(30).includes('35%'));
  assert.ok(levelFor(0).mail(0).includes('基本持平'));
});

test('achievement progress lists every rule with its state, in rule order', () => {
  const list = progress(['add-friend', 'first-card']);
  assert.deepEqual(list.map(r => r.id), RULES.map(r => r.id));
  assert.deepEqual(list.filter(r => r.done).map(r => r.id), ['first-card', 'add-friend']);
});
