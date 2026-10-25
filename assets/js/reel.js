// The content reel: drag the strip with a mouse (touch scrolls natively), step with the arrows,
// and pick a frame to project it on the screen above.
export function initReel() {
  const root = document.querySelector('#viewfinder .projector');
  if (!root) return;
  const reel = root.querySelector('.reel'), screen = root.querySelector('.screen');
  const frames = [...reel.querySelectorAll('.frame-btn')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';

  root.querySelectorAll('[data-reel]').forEach(b => b.addEventListener('click', () => {
    const step = reel.querySelector('li')?.getBoundingClientRect().width ?? 200;
    reel.scrollBy({ left: Number(b.dataset.reel) * (step + 12), behavior });
  }));

  // mouse drag; a drag longer than a few pixels is not a click
  let down = null, moved = false;
  reel.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = { x: e.clientX, left: reel.scrollLeft }; moved = false;
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 4) { moved = true; reel.classList.add('dragging'); }
    if (moved) reel.scrollLeft = down.left - dx;
  });
  addEventListener('pointerup', () => { down = null; reel.classList.remove('dragging'); });
  reel.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  const project = btn => {
    frames.forEach(f => f.setAttribute('aria-pressed', String(f === btn)));
    const pic = btn.querySelector('img'), cap = btn.querySelector('.frame-cap');
    const text = s => cap.querySelector(s).textContent;
    const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };
    let media;
    if (pic) {
      media = pic.cloneNode();
      media.alt = text('.frame-t'); media.sizes = '(max-width: 720px) 90vw, 420px'; media.removeAttribute('loading');
    } else media = el('span', 'screen-tx', text('.frame-p'));
    const capEl = el('div', 'screen-cap');
    capEl.append(el('p', 'kicker', text('.frame-p')), el('h3', '', text('.frame-t')), el('b', '', text('b')));
    const inner = el('div', 'screen-in');
    inner.append(media, capEl);
    screen.replaceChildren(inner);
    if (!reduce) { screen.classList.remove('flick'); void screen.offsetWidth; screen.classList.add('flick'); }
    btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior });
  };
  frames.forEach(f => f.addEventListener('click', () => project(f)));
}
