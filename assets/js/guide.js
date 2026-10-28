// The explorer's guide: opens from the bar or the opening, closes on its button, Esc or a click outside,
// and closes itself when a "take me there" link is followed (modes.js unfolds a folded chapter on the way).
export function initGuide() {
  const dlg = document.querySelector('dialog.guide');
  if (!dlg) return;
  let opener = null;
  const open = e => { opener = e.currentTarget; try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); } };
  document.querySelectorAll('.guide-btn, .guide-open').forEach(b => b.addEventListener('click', open));
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(); opener?.focus(); }
    if (e.target.closest('.g-go')) { opener = null; dlg.close(); }
  });
  dlg.addEventListener('close', () => opener?.focus());
}
