import { initReveal } from './motion.js';
import { initOpening } from './opening.js';
import { initQuests } from './quests.js';
import { initCases } from './cases.js';
import { initBridge } from './bridge.js';
import { initReel } from './reel.js';
import { createTracker, progress } from './achievements.js';
import { store } from './storage.js';

document.documentElement.classList.add('js');

// Motion is opt-in: content is visible unless we know animations can run and are welcome.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && 'IntersectionObserver' in window) document.documentElement.classList.add('motion');

const run = (name, fn) => { try { fn(); } catch (err) { console.error(`[${name}]`, err); } };

// Achievements: one tracker for every module. Unlocks queue up as toasts and refresh the nav badge.
const toast = document.getElementById('toast');
const queue = [];
let showing = false;
function nextToast() {
  if (showing || !queue.length) return;
  showing = true;
  toast.textContent = `成就解锁 · ${queue.shift()}`;
  toast.classList.add('on');
  setTimeout(() => { toast.classList.remove('on'); setTimeout(() => { showing = false; nextToast(); }, 400); }, 3000);
}
const achBtn = document.querySelector('.bar .ach'), achList = document.getElementById('ach-list');
function paintBadge() {
  const list = progress(tracker.unlocked());
  achBtn.querySelector('.ach-n').textContent = `${list.filter(r => r.done).length}/${list.length}`;
  for (const r of list) achList.querySelector(`[data-ach="${r.id}"]`)?.classList.toggle('done', r.done);
}
const tracker = createTracker(store, rule => { queue.push(rule.title); nextToast(); paintBadge(); });
paintBadge();
achBtn.addEventListener('click', () => {
  const open = achList.hidden;
  achList.hidden = !open; achBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', e => { if (!achList.hidden && !e.target.closest('.ach-wrap')) { achList.hidden = true; achBtn.setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !achList.hidden) { achList.hidden = true; achBtn.setAttribute('aria-expanded', 'false'); achBtn.focus(); } });
run('opening', () => initOpening({ tracker }));
run('quests', () => initQuests({ tracker }));
run('cases', () => initCases({ tracker }));
run('bridge', () => initBridge());
run('reel', () => initReel({ tracker }));
run('reveal', () => initReveal(document));

// The map pulls in ~110 KB of geometry; load it on its own so a failure there never takes the rest down.
import('./map.js').then(m => run('map', () => {
  m.initMap({ tracker });
  document.dispatchEvent(new CustomEvent('eo:mode', { detail: { mode: document.querySelector('.bar [data-mode="friend"]')?.getAttribute('aria-pressed') === 'true' ? 'friend' : 'interviewer' } }));
})).catch(err => console.error('[map]', err));

// copy buttons
document.addEventListener('click', async e => {
  const b = e.target.closest('button[data-copy]');
  if (!b) return;
  const text = document.getElementById(b.dataset.copy)?.textContent ?? '';
  try { await navigator.clipboard.writeText(text); } catch {
    const r = document.createRange(); const el = document.getElementById(b.dataset.copy);
    if (el) { r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  }
  if (b.closest('#contact')) tracker.record('add-friend');
  const was = b.textContent; b.textContent = '已复制'; setTimeout(() => { b.textContent = was; }, 1400);
});
