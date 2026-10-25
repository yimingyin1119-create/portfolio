// Adds .in to [data-reveal] elements as they enter the viewport; with no observer everything is simply shown.
export function initReveal(root) {
  const els = [...root.querySelectorAll('[data-reveal]:not(.in)')];
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach(el => io.observe(el));
}
