import { store } from './storage.js';
import { orderFor, applyOrder, applyFold, foldedFor, loadMode, saveMode } from './modes.js';

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

let mode = 'interviewer', moreOpen = false;
const fold = () => applyFold(document.getElementById('chapters'), mode, moreOpen);

// Reorders the chapters for a visitor; the swap happens behind a short fade.
export function setMode(next, { scroll = false } = {}) {
  mode = next;
  const main = document.getElementById('chapters');
  const ids = orderFor(mode);
  const swap = () => {
    applyOrder(main, ids);
    fold();
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
  mode = saved ?? 'interviewer';
  if (saved) {
    applyOrder(document.getElementById('chapters'), orderFor(saved));
    syncNav(saved);
  }
  fold();
  initMore();
  document.dispatchEvent(new CustomEvent('eo:mode', { detail: { mode } }));
}

// 「更多关于我」: opens the folded chapters in place, or folds them away again.
function initMore() {
  const btn = document.querySelector('#chapters > .more-about .more-btn');
  if (!btn) return;
  const reveal = () => {
    const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.closest('#chapters > [data-chapter][hidden]')) {
      moreOpen = true; fold();
      // jump, not glide: the page is still growing while it loads, which cuts a smooth scroll short
      const go = () => target.scrollIntoView({ block: 'start', behavior: 'instant' });
      requestAnimationFrame(go); setTimeout(go, 450);
    }
  };
  btn.addEventListener('click', () => {
    moreOpen = !moreOpen; fold();
    document.dispatchEvent(new CustomEvent('eo:mode', { detail: { mode } }));
    const to = moreOpen ? document.getElementById(foldedFor(mode)[0]) : btn.closest('.more-about');
    requestAnimationFrame(() => to?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  });
  reveal();
  addEventListener('hashchange', reveal);
}
