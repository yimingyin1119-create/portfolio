// The case logbook. Each case is a spread (cover on the left page, story on the right). A turn swings a leaf
// about the gutter, built as a chain of narrow strips that each lean a little further, so the paper bends
// instead of pivoting like a door; light and shade follow each strip's angle. A magnifier lies on the book and
// shows a 2× copy of whatever is under it. Phones and tablets get one page at a time and a swipe instead.
import { L } from './i18n.js';

const N = 12;        // strips in the turning leaf
const BEND = 0.6;    // peak curl, radians
const MAG = 2;       // magnifier power

const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

export function initLogbook() {
  const root = document.querySelector('#cases .logbook');
  if (!root) return;
  const stage = root.querySelector('.book-3d'), book = root.querySelector('.book');
  const zoomWrap = root.querySelector('.zoomwrap'), zoomInner = root.querySelector('.zoominner');
  const loupe = root.querySelector('.loupe'), loupeBtn = root.querySelector('[data-loupe]');
  const count = root.querySelector('.book-count'), hint = root.querySelector('.book-hint');
  const leaves = [...root.querySelectorAll('.case-leaf')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => matchMedia('(max-width: 900px)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  let deck = leaves.slice(), idx = 0, turn = null, motion = null, raf = 0, last = 0;

  /* ---------- drawing the book ---------- */
  // copies of a page; their images load at once (the hidden originals never scroll into view to trigger lazy loading)
  const page = (leaf, side) => {
    const p = leaf.querySelector(`.pg.${side}`).cloneNode(true);
    p.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    return p;
  };
  const half = (side, leaf) => { const h = el('div', `half ${side}`); h.append(page(leaf, side), el('span', `gutter ${side}`)); return h; };

  // One face of one strip: a window onto a page, shifted so the strip shows its own slice of it.
  function face(leaf, side, offset, back) {
    const f = el('div', `face${back ? ' back' : ''}`);
    const p = page(leaf, side);
    p.style.width = 'var(--pw)'; p.style.left = `calc(${offset} * var(--sw) * -1)`;
    f.append(p, el('span', 'lit'));
    return f;
  }
  function leafCurl(dir, from, to) {
    const leaf3d = el('div', `leafturn ${dir > 0 ? 'next' : 'prev'}`);
    let host = leaf3d;
    for (let i = 0; i < N; i++) {
      const s = el('div', 'strip');
      // next: front = from's right page slice i, back = to's left page slice from the gutter; prev mirrors it
      if (dir > 0) s.append(face(from, 'r', i, false), face(to, 'l', N - 1 - i, true));
      else s.append(face(from, 'l', N - 1 - i, false), face(to, 'r', i, true));
      host.append(s); host = s;
    }
    return leaf3d;
  }
  function paint() {
    book.textContent = '';
    if (!deck.length) return;
    if (turn && !narrow()) {
      const next = turn.dir > 0, from = deck[turn.from], to = deck[turn.to];
      book.append(half('l', next ? from : to), half('r', next ? to : from), leafCurl(turn.dir, from, to));
      bend(turn.t);
    } else {
      const cur = deck[idx];
      book.append(half('l', cur), half('r', cur));
      book.style.setProperty('--shade', '0');
    }
    count.textContent = `${(turn ? turn.to : idx) + 1} / ${deck.length}`;
    measure();
    mirror();
  }
  function measure() {
    const w = book.clientWidth;
    stage.style.setProperty('--pw', `${w / 2}px`);
    stage.style.setProperty('--sw', `${w / 2 / N}px`);
  }

  /* ---------- the bend ---------- */
  function bend(t) {
    const swing = Math.PI * t, curl = BEND * Math.sin(Math.PI * t);
    const lead = swing + curl, step = 2 * curl / N, D = 180 / Math.PI;
    book.style.setProperty('--tt', `${(lead * D).toFixed(2)}deg`);
    book.style.setProperty('--td', `${(step * D).toFixed(3)}deg`);
    book.style.setProperty('--shade', Math.sin(Math.PI * t).toFixed(3));
    book.querySelectorAll('.strip').forEach((s, i) => {
      const facing = Math.abs(Math.cos(lead - (i + .5) * step));
      s.style.setProperty('--dark', ((1 - facing) * .55).toFixed(3));
    });
  }

  /* ---------- motion: a spring towards 0 (cancel) or 1 (commit) ---------- */
  function settle(target, done) { motion = { target, v: 0, done }; kick(); }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    const dt = Math.min(.032, (now - last) / 1000 || .016); last = now;
    if (motion && turn) {
      const x = turn.t - motion.target;
      motion.v += (-170 * x - 26 * motion.v) * dt;
      turn.t += motion.v * dt;
      if (Math.abs(turn.t - motion.target) < .002 && Math.abs(motion.v) < .02) {
        turn.t = motion.target; const done = motion.done; motion = null; done();
      } else bend(turn.t);
    }
    if (motion) raf = requestAnimationFrame(tick);
  }

  /* ---------- turning ---------- */
  const wrap = i => (i + deck.length) % deck.length;
  function start(dir) {
    if (deck.length < 2) return false;
    if (turn) { idx = turn.to; turn = null; motion = null; }
    turn = { dir, from: idx, to: wrap(idx + dir), t: 0 };
    paint();
    return true;
  }
  function finish() { idx = turn.to; turn = null; paint(); }
  function commit() {
    if (!turn) return;
    if (reduce || narrow()) { const dir = turn.dir; finish(); swap(dir); return; }
    settle(1, finish);
  }
  function cancel() { if (turn) settle(0, () => { turn = null; paint(); }); }
  function step(dir) { hint.classList.add('gone'); if (start(dir)) commit(); }
  // on a phone the page simply slides in from the side it came from
  function swap(dir) {
    if (reduce) return;
    book.classList.remove('in-l', 'in-r'); void book.offsetWidth;
    book.classList.add(dir > 0 ? 'in-r' : 'in-l');
  }

  root.querySelectorAll('[data-turn]').forEach(b => b.addEventListener('click', () => step(Number(b.dataset.turn))));
  stage.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1);
  });

  /* ---------- dragging a page ---------- */
  let drag = null;
  book.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    const r = book.getBoundingClientRect();
    const dir = narrow() ? 0 : ((e.clientX - r.left) / r.width > .5 ? 1 : -1);
    drag = { dir, x0: e.clientX, w: r.width, moved: 0, vel: 0, at: performance.now(), started: false };
    try { book.setPointerCapture(e.pointerId); } catch {}
    hint.classList.add('gone');
  });
  book.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (!drag.dir || drag.moved < 4) return;
    if (!drag.started) { drag.started = start(drag.dir); if (!drag.started) return; }
    const t = Math.max(0, Math.min(1, (drag.dir > 0 ? -dx : dx) / (drag.w * .62)));
    const now = performance.now();
    drag.vel = (t - turn.t) / Math.max(.001, (now - drag.at) / 1000); drag.at = now;
    turn.t = t; bend(t);
  });
  function release(e) {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.dir) {                               // phone: a swipe turns, a tap does nothing
      const dx = e.clientX - d.x0;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      return;
    }
    if (!d.started) { if (d.moved < 4) step(d.dir); return; }   // a tap on either half turns that way
    if (turn.t > .42 || d.vel > 1.1) commit(); else cancel();
  }
  book.addEventListener('pointerup', release);
  book.addEventListener('pointercancel', release);
  book.addEventListener('dragstart', e => e.preventDefault());

  /* ---------- filters choose which cases the book holds ---------- */
  const btns = [...document.querySelectorAll('#cases .filters button')];
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    deck = leaves.filter(l => b.dataset.f === 'all' || l.dataset.cat === b.dataset.f);
    idx = 0; turn = null; motion = null;
    paint();
  }));

  /* ---------- the magnifier ---------- */
  let loupeOn = finePointer, lx = null, ly = null, grab = null;
  const size = () => Math.round(Math.max(150, Math.min(230, book.clientWidth * .22)));
  function rest() { lx = book.clientWidth * .9; ly = book.clientHeight * .86; place(); }
  function mirror() {
    zoomInner.textContent = '';
    if (!loupeOn || turn) { zoomWrap.style.opacity = '0'; return; }
    for (const c of book.children) { const k = c.cloneNode(true); k.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; }); zoomInner.append(k); }
    place();
  }
  function place() {
    if (lx === null || !loupeOn) return;
    const R = size() / 2, glass = R * .88;
    loupe.style.setProperty('--lr', `${R * 2}px`);
    loupe.style.transform = `translate3d(${(lx - R).toFixed(1)}px, ${(ly - R).toFixed(1)}px, 0)`;
    const w = book.clientWidth, h = book.clientHeight;
    const over = lx > 0 && lx < w && ly > 0 && ly < h;
    zoomWrap.style.opacity = over && !turn ? '1' : '0';
    const mask = `radial-gradient(circle ${glass.toFixed(1)}px at ${lx.toFixed(1)}px ${ly.toFixed(1)}px, #000 calc(100% - 1px), transparent 100%)`;
    zoomWrap.style.webkitMaskImage = zoomWrap.style.maskImage = mask;
    zoomInner.style.transform = `translate(${(lx - lx * MAG).toFixed(1)}px, ${(ly - ly * MAG).toFixed(1)}px) scale(${MAG})`;
  }
  loupe.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    grab = { x: e.clientX, y: e.clientY, lx, ly };
    loupe.classList.add('held'); try { loupe.setPointerCapture(e.pointerId); } catch {}
    hint.classList.add('gone');
  });
  loupe.addEventListener('pointermove', e => {
    if (!grab) return;
    const w = book.clientWidth, h = book.clientHeight, R = size() / 2;
    lx = Math.max(-R * .6, Math.min(w + R * .6, grab.lx + e.clientX - grab.x));
    ly = Math.max(-R * .6, Math.min(h + R * .8, grab.ly + e.clientY - grab.y));
    place();
  });
  const drop = () => { grab = null; loupe.classList.remove('held'); };
  loupe.addEventListener('pointerup', drop);
  loupe.addEventListener('pointercancel', drop);
  function setLoupe(on) {
    loupeOn = on && finePointer && !narrow();
    loupeBtn.setAttribute('aria-pressed', String(loupeOn));
    loupe.classList.toggle('on', loupeOn);
    if (loupeOn && lx === null) rest();
    mirror();
  }
  loupeBtn.addEventListener('click', () => setLoupe(!loupeOn));
  loupeBtn.hidden = !finePointer;
  root.querySelector('.book-tools .tool-sep').hidden = !finePointer;
  if (!finePointer) hint.textContent = L('左右滑动翻页', 'Swipe to turn the pages');

  let resizeT = 0;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { measure(); if (loupeOn) rest(); mirror(); }, 120); });

  root.classList.add('ready');
  paint();
  setLoupe(loupeOn);
}
