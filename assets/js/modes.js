// The two reading orders. Both list every chapter; only the order and emphasis change.
export const MODES = {
  interviewer: ['opening', 'skills', 'quests', 'posters', 'cases', 'bridge', 'novice', 'map', 'abroad', 'viewfinder', 'contact'],
  friend: ['opening', 'map', 'abroad', 'viewfinder', 'novice', 'quests', 'posters', 'skills', 'cases', 'bridge', 'contact'],
};
const KEY = 'eo.mode';

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
