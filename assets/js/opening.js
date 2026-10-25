import { store } from './storage.js';
import { orderFor, applyOrder, loadMode, saveMode } from './modes.js';

const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

function setExpanded(btn, open) { btn.setAttribute('aria-expanded', String(open)); }

// Attribute proofs: tap or click toggles; on a mouse, hovering also opens.
function initAttributes(root) {
  const btns = [...root.querySelectorAll('.attr-btn')];
  for (const b of btns) {
    b.addEventListener('click', () => setExpanded(b, b.getAttribute('aria-expanded') !== 'true'));
    if (finePointer) {
      b.addEventListener('mouseenter', () => setExpanded(b, true));
      b.closest('.attr').addEventListener('mouseleave', () => setExpanded(b, false));
    }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') btns.forEach(b => setExpanded(b, false)); });
}

function syncNav(mode) {
  for (const b of document.querySelectorAll('.bar [data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
}

// Reorders the chapters for a visitor; the swap happens behind a short fade.
export function setMode(mode, { scroll = false } = {}) {
  const main = document.getElementById('chapters');
  const ids = orderFor(mode);
  const swap = () => {
    applyOrder(main, ids);
    syncNav(mode);
    document.dispatchEvent(new CustomEvent('eo:mode', { detail: { mode } }));
    if (scroll) document.getElementById(ids[1])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (!document.documentElement.classList.contains('motion')) return swap();
  main.classList.add('reordering');
  setTimeout(() => { swap(); main.classList.remove('reordering'); }, 250);
}

export function initOpening() {
  initAttributes(document.getElementById('opening'));
  const pick = mode => { saveMode(store, mode); setMode(mode, { scroll: true }); };
  for (const b of document.querySelectorAll('[data-pick]')) b.addEventListener('click', () => pick(b.dataset.pick));
  for (const b of document.querySelectorAll('.bar [data-mode]')) b.addEventListener('click', () => pick(b.dataset.mode));
  const saved = loadMode(store);
  if (saved) {
    applyOrder(document.getElementById('chapters'), orderFor(saved));
    syncNav(saved);
  }
  document.dispatchEvent(new CustomEvent('eo:mode', { detail: { mode: saved ?? 'interviewer' } }));
}
