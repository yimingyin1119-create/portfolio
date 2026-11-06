// The title screen: a galleon riding ink waves that are redrawn every frame. "Set sail" (or scrolling down at the top
// of the page) plays one long move: the sea rises over the headline, the ship shrinks to the horizon, and a palm island
// with a captain slides in from the left. Scrolling back up at the top plays it in reverse. Every animated value is
// worked out in render(); nothing runs while the screen is out of view.

const SHEET = { w: 2048, h: 1360 };
// sprite boxes on the 2048x1360 sheets: x, y, w, h
const BOX = {
  capt: [34, 153, 1246, 1074],
  chest: [1475, 830, 446, 392],
  palm: [19, 32, 910, 1284],
  bushL: [515, 820, 860, 496],
  bushR: [1528, 908, 499, 405]
};

const LAY = {
  land: {
    w: 1600, h: 900,
    wave: { y0: 748, y1: 272, gap0: 1, gap1: .6 },
    ship: { x0: 1130, w0: 710, x1: 1345, w1: 176 },
    palm: { x: -92, y: -112, w: 620 }, capt: { x: 120, y: 318, w: 540 }, chest: { x: 640, y: 628, w: 200 },
    bushL: { x: 96, y: 716, w: 700 }, bushR: { x: 1370, y: 740, w: 300 }
  },
  port: {
    w: 800, h: 1500,
    wave: { y0: 1300, y1: 430, gap0: 1, gap1: .7 },
    ship: { x0: 420, w0: 620, x1: 640, w1: 150 },
    palm: { x: -150, y: -60, w: 560 }, capt: { x: 20, y: 440, w: 600 }, chest: { x: 560, y: 830, w: 190 },
    bushL: { x: -150, y: 1450, w: 520 }, bushR: { x: 590, y: 1370, w: 240 }
  }
};

// wave layers, back to front. dy = offset from the main swell, fill optional, span = open line drawn over part of the width
const BACK = [
  { dy: -100, a: 20, k: 1.5, v: .9, ph: 0, fill: 'var(--vy-band)' },
  { dy: -52, a: 23, k: 1.9, v: 1.15, ph: 1.7, fill: 'var(--vy-paper)' }
];
const FRONT = [
  { dy: 0, a: 25, k: 1.7, v: 1.3, ph: 3.1, fill: 'var(--vy-band2)' },
  { dy: 26, a: 18, k: 2.4, v: 1, ph: 4.4, span: [.06, .44] },
  { dy: 48, a: 22, k: 1.45, v: 1.4, ph: .6, fill: 'var(--vy-paper)' },
  { dy: 76, a: 15, k: 2.1, v: 1.2, ph: 5.1, span: [.52, .97] },
  { dy: 104, a: 24, k: 1.8, v: 1.25, ph: 2.2, fill: 'var(--vy-paper)' },
  { dy: 130, a: 14, k: 2.7, v: 1, ph: 1.1, span: [0, .62] },
  { dy: 158, a: 20, k: 1.6, v: 1.1, ph: 3.8 }
];

const NS = 'http://www.w3.org/2000/svg';
const clamp = v => Math.min(1, Math.max(0, v));
const mix = (a, b, k) => a + (b - a) * k;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const io = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const out = k => 1 - Math.pow(1 - k, 3);
const back = k => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
const tf = (x, y, r = 0, s = 1) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;

export function initVoyage() {
  const root = document.querySelector('.voyage');
  if (!root) return;
  const frame = root.querySelector('.vy-frame'), scene = root.querySelector('.vy-scene');
  const $ = s => root.querySelector(s);
  const el = {
    cloud: $('.vy-cloud'), t1: $('.vy-t1'), ship: $('.vy-ship'), t2: $('.vy-t2'), h2: $('.vy-t2 .vy-h'), p2: $('.vy-p'), btn2: $('.vy-btnw'),
    palm: $('.vy-palm'), capt: $('.vy-capt'), chest: $('.vy-chest'), bushL: $('.vy-bushL'), bushR: $('.vy-bushR')
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // one <path> per wave layer
  const layers = (svg, list) => list.map(l => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('fill', l.fill || 'none');
    svg.append(p);
    return { l, p };
  });
  const svgBack = $('.vy-back'), svgFront = $('.vy-front');
  const backPaths = layers(svgBack, BACK), frontPaths = layers(svgFront, FRONT);

  // sprites are cut from the sheets with background-size and -position
  for (const [id, [x, y, w, h]] of Object.entries(BOX)) {
    const s = el[id].style;
    s.backgroundSize = `${SHEET.w / w * 100}% ${SHEET.h / h * 100}%`;
    s.backgroundPosition = `${x / (SHEET.w - w) * 100}% ${y / (SHEET.h - h) * 100}%`;
  }

  let L = LAY.land, S = 1, DX = 0, DY = 0, portrait = false;
  function resize() {
    const W = frame.clientWidth, H = frame.clientHeight;
    portrait = H > W;
    root.classList.toggle('portrait', portrait);
    L = portrait ? LAY.port : LAY.land;
    S = Math.min(W / L.w, H / L.h);
    DX = (W / S - L.w) / 2; DY = (H / S - L.h) / 2;
    scene.style.width = `${L.w}px`; scene.style.height = `${L.h}px`;
    scene.style.transform = `translate(${DX * S}px,${DY * S}px) scale(${S})`;
    for (const svg of [svgBack, svgFront]) { svg.setAttribute('width', L.w); svg.setAttribute('height', L.h); }
    for (const id of ['palm', 'capt', 'chest', 'bushL', 'bushR']) {
      const c = L[id], [, , w, h] = BOX[id], s = el[id].style;
      s.left = `${c.x}px`; s.top = `${c.y}px`; s.width = `${c.w}px`; s.height = `${c.w * h / w}px`;
    }
  }

  function yAt(l, x, t, p) {
    const W = L.wave;
    const base = mix(W.y0, W.y1, p) + l.dy * mix(W.gap0, W.gap1, p);
    const a = l.a * mix(1, .72, p);
    const f = 2 * Math.PI / 1100 * l.k * (1 - .35 * p);
    return base + a * Math.sin(f * x + t * l.v + l.ph) + a * .45 * Math.sin(f * 2.3 * x - t * l.v * .7 + l.ph * 1.7);
  }
  function drawWaves(list, t, p) {
    const x0 = -DX - 20, x1 = L.w + DX + 20, bottom = L.h + DY + 40, span = x1 - x0;
    for (const { l, p: path } of list) {
      const a = l.span ? x0 + span * l.span[0] : x0, b = l.span ? x0 + span * l.span[1] : x1;
      let d = '';
      for (let x = a; ; x += 22) {
        const xx = Math.min(x, b);
        d += `${d ? 'L' : 'M'}${xx.toFixed(1)} ${yAt(l, xx, t, p).toFixed(1)}`;
        if (xx >= b) break;
      }
      if (l.fill) d += `L${b.toFixed(1)} ${bottom}L${a.toFixed(1)} ${bottom}Z`;
      path.setAttribute('d', d);
    }
  }

  // palm-frond shade: a tiny canvas stretched over the frame, so its low resolution is the blur
  const shade = $('.vy-shade');
  (() => {
    const g = shade.getContext('2d');
    g.scale(.5, .5);
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 72);
    g.strokeStyle = 'rgba(120,114,96,.9)'; g.lineCap = 'round';
    for (const [x0, y0, x1, y1, w] of [[-10, 26, 38, -8, 8], [-8, 46, 58, -2, 5], [-10, 62, 74, 6, 4], [14, 78, 96, 16, 4], [40, 82, 118, 22, 3], [78, 80, 140, 34, 5], [-12, 74, 22, 56, 6]]) {
      g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2 + 8, x1, y1); g.stroke();
    }
  })();

  /* ---------- the transition: p runs from 0 (open sea) to 1 (island) ---------- */
  const DUR = reduce ? 1 : 2100;
  let p = 0, pFrom = 0, pTo = 0, pT0 = 0, lockUntil = 0;
  function go(to) {
    if (to === pTo) return;
    pFrom = p; pTo = to; pT0 = performance.now(); lockUntil = pT0 + 1200;
    kick();
  }
  root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); go(Number(b.dataset.go)); }));

  // at the top of the page, scrolling down sets sail instead of moving the page; scrolling up sails back
  const atTop = () => scrollY < 8 && root.getBoundingClientRect().top >= -8;
  addEventListener('wheel', e => {
    if (!atTop() || e.ctrlKey) return;
    const now = performance.now();
    if (now < lockUntil && (e.deltaY > 0 ? pTo === 1 : pTo === 0)) { e.preventDefault(); return; }
    if (e.deltaY > 8 && pTo < 1) { e.preventDefault(); go(1); }
    else if (e.deltaY < -8 && pTo > 0) { e.preventDefault(); go(0); }
  }, { passive: false });
  let ty = null;
  addEventListener('touchstart', e => { ty = atTop() ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', e => {
    if (ty === null) return;
    const dy = e.touches[0].clientY - ty;
    if (dy < -24 && pTo < 1) { e.preventDefault(); go(1); ty = null; }
    else if (dy > 24 && pTo > 0) { e.preventDefault(); go(0); ty = null; }
  }, { passive: false });
  addEventListener('keydown', e => {
    if (!atTop() || pTo === 1 || e.target.closest?.('input, textarea, dialog')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
  });

  /* ---------- the ring cursor (mouse only, inside the frame) ---------- */
  const cur = $('.vy-cur'), ping = $('.vy-ping');
  let mx = 0, my = 0, cx = 0, cy = 0, down = false, overLink = false, pingAt = -1e9, px = 0, py = 0, lastNow = 0;
  if (fine) {
    frame.classList.add('fine');
    const local = e => { const r = frame.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    frame.addEventListener('pointerenter', e => { [mx, my] = local(e); cx = mx; cy = my; frame.classList.add('in'); kick(); });
    frame.addEventListener('pointerleave', () => frame.classList.remove('in'));
    frame.addEventListener('pointermove', e => { [mx, my] = local(e); overLink = !!e.target.closest('a, button'); kick(); });
    frame.addEventListener('pointerdown', e => { down = true; [px, py] = local(e); pingAt = performance.now(); kick(); });
    addEventListener('pointerup', () => { down = false; });
  }
  ping.style.opacity = '0';

  /* ---------- one frame ---------- */
  const t0 = performance.now();
  function render(now) {
    const t = reduce ? 0 : (now - t0) / 1000;
    p = mix(pFrom, pTo, io(seg(now, pT0, pT0 + DUR)));

    drawWaves(backPaths, t, p);
    drawWaves(frontPaths, t, p);

    // the ship rides the main swell, sunk 5% into it, and leans with its slope
    const c = L.ship, sw = mix(c.w0, c.w1, p), sx = mix(c.x0, c.x1, p), sh = sw * 2002 / 1961;
    const wy = yAt(FRONT[0], sx, t, p);
    const slope = (yAt(FRONT[0], sx + 90, t, p) - yAt(FRONT[0], sx - 90, t, p)) / 180;
    Object.assign(el.ship.style, { width: `${sw}px`, height: `${sh}px`, left: `${sx - sw / 2}px`, top: `${wy + sw * .05 - sh}px`, transform: `rotate(${(Math.atan(slope) * 57.3 * .75).toFixed(3)}deg)` });

    const cl = ((L.w * .72 - t * 16) % (L.w + 700) + (L.w + 700)) % (L.w + 700) - 400;
    Object.assign(el.cloud.style, { left: `${cl}px`, top: `${portrait ? 110 : 150}px`, opacity: 1 - seg(p, .3, .7) });

    const intro = reduce ? 1 : out(seg(now, t0 + 200, t0 + 1100));
    el.t1.style.opacity = intro * (1 - seg(p, .62, .7));
    el.t1.style.transform = tf(0, (1 - intro) * 26 - p * 40);
    el.t1.inert = p > .1;

    const e = io(seg(p, .04, .92));
    el.palm.style.transform = tf(mix(-L.palm.w - 80, 0, e), mix(-170, 0, e), Math.sin(t * .8) * .7);
    el.capt.style.transform = tf(mix(-L.capt.w - 160, 0, e), 0, Math.sin(t * 1.1) * .5 * p);
    el.chest.style.transform = tf(mix(-L.chest.w - 720, 0, e), mix(120, 0, e));
    const b = out(seg(p, .5, 1));
    el.bushL.style.transform = tf(0, mix(340, 0, b));
    el.bushR.style.transform = tf(0, mix(300, 0, b));

    const hk = seg(p, .42, .82), pk = seg(p, .76, .92), bk = seg(p, .86, 1);
    el.h2.style.opacity = hk * hk; el.h2.style.transform = tf(0, mix(70, 0, out(hk)));
    el.p2.style.opacity = pk; el.p2.style.transform = tf(0, mix(16, 0, pk));
    el.btn2.style.opacity = bk; el.btn2.style.transform = tf(0, 0, 0, mix(.7, 1, back(bk)));
    el.t2.inert = p <= .9;

    shade.style.transform = `translate(${(Math.sin(t * .35) * 2.2).toFixed(3)}%,${(Math.cos(t * .27) * 1.6).toFixed(3)}%) rotate(${(Math.sin(t * .22) * .8).toFixed(3)}deg)`;

    if (fine) {
      const dt = Math.min(.05, (now - lastNow) / 1000 || .016);
      const f = 1 - Math.exp(-dt * 22);
      cx += (mx - cx) * f; cy += (my - cy) * f;
      cur.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) scale(${down ? .7 : overLink ? 1.35 : 1})`;
      const k = clamp((now - pingAt) / 650);
      ping.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${1 + out(k) * 1.9})`;
      ping.style.opacity = String(k < 1 ? 1 - k : 0);
    }
    lastNow = now;
  }

  // run only while the screen is in view (reduced motion: draw when something changes)
  let visible = true, raf = 0;
  function loop(now) {
    raf = 0;
    if (!visible) return;
    render(now);
    const moving = !reduce || now < pT0 + DUR || (fine && frame.classList.contains('in'));
    if (moving) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }).observe(frame);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); kick(); }, 80); });
  resize();
  render(t0);
  kick();
  root.classList.add('ready');
}
