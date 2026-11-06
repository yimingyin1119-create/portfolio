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

// Quest cards turn like React Bits' FlipCard: a press flips the card, a sideways drag turns it by hand and springs to the
// nearest face on release (a flick carries it over), it leans toward the cursor with a sheen, and its shadow narrows as
// it turns edge-on. The flip buttons on each face do the same from the keyboard. Without motion both faces simply stack.
const SLOP = { fine: 4, coarse: 8 };
const TURN = { stiffness: 170, damping: 20, mass: 1 }, TILT = { stiffness: 240, damping: 24, mass: .6 }, LIFT = { stiffness: 320, damping: 26, mass: 1 };
const TILT_MAX = 10, HOVER_SCALE = 1.02, PERSPECTIVE = 1100, FLING = .16, HISTORY_MS = 90;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const snap = deg => Math.round(deg / 180) * 180;
const isBack = deg => Math.abs(Math.round(deg / 180)) % 2 === 1;

// a damped spring; step() returns true while it is still moving
function spring(value, { stiffness, damping, mass }) {
  return {
    value, target: value, v: 0,
    step(dt) {
      const a = (-stiffness * (this.value - this.target) - damping * this.v) / mass;
      this.v += a * dt; this.value += this.v * dt;
      if (Math.abs(this.v) < .01 && Math.abs(this.value - this.target) < .05) { this.value = this.target; this.v = 0; return false; }
      return true;
    }
  };
}

function flipCard(card, onFlip) {
  const rotor = card.querySelector('.quest-in'), shadow = card.querySelector('.fc-shadow');
  const faces = [card.querySelector('.side.front'), card.querySelector('.side.back')];
  const buttons = [...card.querySelectorAll('.flip')];
  const turn = spring(0, TURN), tiltX = spring(0, TILT), tiltY = spring(0, TILT), lift = spring(1, LIFT), sheen = spring(0, LIFT);
  let shown = false, target = 0, grip = null, raf = 0, last = 0, settling = false, gx = 50, gy = 50;

  function paint() {
    rotor.style.transform = `perspective(${PERSPECTIVE}px) scale(${lift.value.toFixed(4)}) rotateX(${tiltX.value.toFixed(2)}deg) rotateY(${(turn.value + tiltY.value).toFixed(2)}deg)`;
    rotor.style.setProperty('--fc-gx', `${gx}%`); rotor.style.setProperty('--fc-gy', `${gy}%`); rotor.style.setProperty('--fc-sheen', sheen.value.toFixed(3));
    const facing = Math.abs(Math.cos(turn.value * Math.PI / 180));
    shadow.style.transform = `scaleX(${(.08 + .92 * facing).toFixed(3)})`;
    shadow.style.opacity = (.1 + .9 * facing * facing).toFixed(3);
  }
  function tick(now) {
    raf = 0;
    const dt = Math.min(.032, (now - last) / 1000 || .016); last = now;
    let moving = false;
    for (const s of [tiltX, tiltY, lift, sheen]) moving = s.step(dt) || moving;
    if (settling) { settling = turn.step(dt); moving = moving || settling; }
    paint();
    if (moving) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  function setShown(next) {
    if (next === shown) return;
    shown = next;
    card.classList.toggle('flipped', next);
    faces[0].inert = next; faces[1].inert = !next;
    faces[0].setAttribute('aria-hidden', String(next)); faces[1].setAttribute('aria-hidden', String(!next));
    buttons.forEach(b => b.setAttribute('aria-pressed', String(next)));
    if (next) onFlip();
  }
  function settle(to, velocity = 0) {
    target = to; turn.target = to; turn.v = velocity; settling = true; kick();
    setShown(isBack(to));
  }
  const flip = () => { const base = snap(turn.value); settle(isBack(base) ? base - 180 : base + 180); };
  const rest = () => { tiltX.target = 0; tiltY.target = 0; sheen.target = 0; lift.target = 1; kick(); };
  faces[1].inert = true; faces[1].setAttribute('aria-hidden', 'true');

  buttons.forEach(b => b.addEventListener('click', flip));
  card.addEventListener('pointerdown', e => {
    if (e.button !== 0 || grip || e.target.closest('a, button, input')) return;
    try { card.setPointerCapture(e.pointerId); } catch {}
    settling = false;
    grip = { id: e.pointerId, x: e.clientX, base: turn.value, moved: false, slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine, hist: [] };
    lift.target = HOVER_SCALE; kick();
  });
  card.addEventListener('pointermove', e => {
    if (grip && grip.id === e.pointerId) {
      const d = e.clientX - grip.x;
      if (!grip.moved) {
        if (Math.abs(d) < grip.slop) return;
        grip.moved = true; card.classList.add('dragging');
        tiltX.target = 0; tiltY.target = 0; sheen.target = 0;
      }
      turn.value = grip.base + d / card.offsetWidth * 180; turn.v = 0;
      const now = performance.now();
      grip.hist.push({ t: now, v: turn.value });
      while (grip.hist.length > 2 && now - grip.hist[0].t > HISTORY_MS) grip.hist.shift();
      kick();
      return;
    }
    if (e.pointerType === 'touch') return;
    const r = card.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
    tiltX.target = (.5 - py) * 2 * TILT_MAX; tiltY.target = (px - .5) * 2 * TILT_MAX;
    gx = Math.round(px * 100); gy = Math.round(py * 100); sheen.target = 1; lift.target = HOVER_SCALE;
    kick();
  });
  function release(e, cancelled) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try { if (card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId); } catch {}
    card.classList.remove('dragging');
    if (e.pointerType === 'touch' || !card.matches(':hover')) rest();
    if (!g.moved) {
      if (!cancelled && !getSelection()?.toString()) flip(); else settle(target);
      return;
    }
    const here = turn.value, a = g.hist[0], b = g.hist[g.hist.length - 1];
    let velocity = 0;
    if (!cancelled && a && b && b.t > a.t && performance.now() - b.t < 60) velocity = (b.v - a.v) / (b.t - a.t) * 1000;
    settle(cancelled ? snap(g.base) : clamp(snap(here + velocity * FLING), snap(here) - 180, snap(here) + 180), velocity);
  }
  card.addEventListener('pointerup', e => release(e, false));
  card.addEventListener('pointercancel', e => release(e, true));
  card.addEventListener('lostpointercapture', e => release(e, true));
  card.addEventListener('pointerleave', () => { if (!grip) rest(); });
  card.addEventListener('dragstart', e => e.preventDefault());
  paint();
}

export function initQuests({ tracker } = {}) {
  for (const card of document.querySelectorAll('.quest')) {
    if (motion()) flipCard(card, () => tracker?.record('quest-flip', { id: card.dataset.quest }));
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
