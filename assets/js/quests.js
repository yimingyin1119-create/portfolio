import { frame } from './count.js';

const motion = () => document.documentElement.classList.contains('motion');

function countUp(el, value, ms = 1200) {
  const t0 = performance.now();
  const step = now => {
    const t = Math.min(1, (now - t0) / ms);
    el.textContent = frame(value, t);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function onceVisible(els, fn, rootMargin = '0px 0px -10% 0px') {
  if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
  }, { rootMargin });
  els.forEach(el => io.observe(el));
}

export function initQuests({ tracker } = {}) {
  for (const card of document.querySelectorAll('.quest')) {
    const btn = card.querySelector('.flip');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      card.classList.toggle('flipped', on);
      btn.firstElementChild.textContent = on ? '翻回正面' : '翻面看结果';
      if (on) tracker?.record('quest-flip', { id: card.dataset.quest });
    });
  }

  // lamps light up one after another; exact figures count up from zero
  const posters = [...document.querySelectorAll('.poster')];
  onceVisible(posters, p => {
    const delay = posters.indexOf(p) % 7 * 140;
    setTimeout(() => {
      p.classList.add('lit');
      const big = p.querySelector('.big');
      if (motion() && p.dataset.count === 'true') countUp(big, big.textContent);
    }, motion() ? delay : 0);
  });

  const novice = document.getElementById('novice');
  if (novice) onceVisible([novice], () => tracker?.record('novice-seen'), '0px 0px -30% 0px');
}
