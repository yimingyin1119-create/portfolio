// The content reel: cards hanging on a rope that drift slowly sideways and loop without end. Hovering a card eases the
// whole row to a stop and lifts that card; dragging (mouse), swiping (touch), the arrows or the wheel take over for a
// moment, then the drift picks up again. Picking a card projects it on the screen above. Drift after React Bits'
// DriftWall, kept to one row on its rope.
const SPEED = 26;          // drift, px per second
const HOLD = 2200;         // ms the drift waits after any input
export function initReel() {
  const root = document.querySelector('#viewfinder .projector');
  if (!root) return;
  const reel = root.querySelector('.reel'), screen = root.querySelector('.screen');
  const frames = [...reel.querySelectorAll('.frame-btn')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  const drift = reduce || !document.documentElement.classList.contains('motion') ? null : initDrift(reel);

  root.querySelectorAll('[data-reel]').forEach(b => b.addEventListener('click', () => {
    drift?.hold();
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

  const project = (btn, shown = btn) => {
    reel.querySelectorAll('.frame-btn').forEach(f => f.setAttribute('aria-pressed', String(f.dataset.work === btn.dataset.work)));
    drift?.hold(HOLD + 1200);
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
    if (!shown.closest('li').matches(':hover')) shown.scrollIntoView({ block: 'nearest', inline: 'center', behavior });
  };
  frames.forEach(f => f.addEventListener('click', () => project(f)));
  reel.querySelectorAll('[data-clone] .frame-btn').forEach(c => c.addEventListener('click', () => project(frames.find(f => f.dataset.work === c.dataset.work), c)));
}

// Copies of the row follow the originals so the strip can loop; the scroll position is moved a little every frame and
// wrapped back by one row's width. Anything the visitor does (scroll, drag, arrows, a pick) pauses it for a moment.
function initDrift(reel) {
  const originals = [...reel.children];
  if (originals.length < 2) return null;
  const rowWidth = () => originals.at(-1).offsetLeft + originals.at(-1).offsetWidth - originals[0].offsetLeft + parseFloat(getComputedStyle(reel).columnGap || 12);
  // the strip may start folded away (zero width), so the row is measured, and copies added, whenever its size changes
  let row = 0, copies = 0;
  const addCopy = () => {
    for (const li of originals) {
      const c = li.cloneNode(true);
      c.dataset.clone = ''; c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('button, a').forEach(b => { b.tabIndex = -1; });
      reel.append(c);
    }
    copies++;
  };
  const measure = () => {
    if (!reel.clientWidth) return;
    row = rowWidth();
    while (copies < Math.ceil(reel.clientWidth / row) + 1) addCopy();
  };
  addCopy();
  reel.classList.add('drifting');

  let x = reel.scrollLeft, written = x, v = 0, last = 0, holdUntil = 0, hovered = false, focused = false, visible = true, raf = 0;
  const hold = (ms = HOLD) => { holdUntil = Math.max(holdUntil, performance.now() + ms); };
  const wrap = value => (value % row + row) % row;
  function tick(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (!row) { measure(); if (!row) return; }
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    if (Math.abs(reel.scrollLeft - written) > 1) { x = reel.scrollLeft; written = x; v = 0; hold(); }   // the visitor moved it
    const target = hovered || focused || now < holdUntil ? 0 : SPEED;
    v += (target - v) * (1 - Math.exp(-dt / (target ? .9 : .18)));
    if (v > .3) {
      x = wrap(x + v * dt);
      reel.scrollLeft = x; written = reel.scrollLeft;
    }
    raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  // a visitor scrolling past either end lands on the matching spot of the next copy
  reel.addEventListener('scroll', () => {
    if (!row || Math.abs(reel.scrollLeft - written) <= 1) return;
    if (reel.scrollLeft >= row * copies) reel.scrollLeft -= row;
    else if (reel.scrollLeft < 1) reel.scrollLeft += row;
  }, { passive: true });
  reel.addEventListener('pointerover', e => { hovered = !!e.target.closest('li'); });
  reel.addEventListener('pointerleave', () => { hovered = false; });
  reel.addEventListener('focusin', () => { focused = true; });
  reel.addEventListener('focusout', e => { if (!reel.contains(e.relatedTarget)) focused = false; });
  reel.addEventListener('pointerdown', () => hold());
  reel.addEventListener('wheel', () => hold(), { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(reel);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { measure(); kick(); }).observe(reel);
  kick();
  return { hold };
}
