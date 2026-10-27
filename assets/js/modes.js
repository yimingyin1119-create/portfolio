// The two reading orders. Both list every chapter; only the order and emphasis change.
export const MODES = {
  interviewer: ['opening', 'skills', 'quests', 'posters', 'cases', 'bridge', 'novice', 'map', 'abroad', 'viewfinder', 'contact'],
  friend: ['opening', 'map', 'abroad', 'viewfinder', 'novice', 'quests', 'posters', 'skills', 'cases', 'bridge', 'contact'],
};
// Interviewers get the work first; the personal chapters wait behind a 「更多关于我」 entry placed just before them.
const FOLDED = { interviewer: ['novice', 'map', 'abroad', 'viewfinder'], friend: [] };
const KEY = 'eo.mode';

export const foldedFor = mode => [...(FOLDED[mode] ?? FOLDED.interviewer)];

// Puts the entry in front of the folded chapters and hides them unless `open`; in friend mode the entry goes away.
export function applyFold(container, mode, open) {
  const fold = container.querySelector(':scope > .more-about');
  if (!fold) return;
  const ids = foldedFor(mode);
  const first = ids.length ? container.querySelector(`:scope > [data-chapter="${ids[0]}"]`) : null;
  fold.hidden = !first;
  if (first) container.insertBefore(fold, first);
  for (const el of container.querySelectorAll(':scope > [data-chapter]')) el.hidden = ids.includes(el.dataset.chapter) && !open;
  fold.classList.toggle('open', open);
  fold.querySelector('.more-btn')?.setAttribute('aria-expanded', String(open));
}

export function orderFor(mode) {
  return MODES[mode] ?? MODES.interviewer;
}

// Moves the chapter nodes into the given order; chapters not listed keep their place at the end.
export function applyOrder(container, ids) {
  for (const id of ids) {
    const el = container.querySelector(`:scope > [data-chapter="${id}"]`);
    if (el) container.appendChild(el);
  }
  for (const el of [...container.querySelectorAll(':scope > [data-chapter]')]) {
    if (!ids.includes(el.dataset.chapter)) container.appendChild(el);
  }
}

export function loadMode(store) {
  const m = store.get(KEY);
  return m in MODES ? m : null;
}

export function saveMode(store, mode) {
  if (mode in MODES) store.set(KEY, mode);
}
