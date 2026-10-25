// Case files: cards open their written-out file in a drawer, filters narrow the grid,
// covers are drawn in code, and the x-ray lens works wherever it appears.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initCases({ tracker } = {}) {
  const root = document.getElementById('cases');
  if (!root) return;
  const files = [...root.querySelectorAll('.case-file')];
  const ids = files.map(f => f.dataset.case);
  const dlg = root.querySelector('dialog.drawer'), dw = dlg.querySelector('.dw');
  let opener = null, current = null, lensOff = null;

  function open(id, from) {
    const file = files.find(f => f.dataset.case === id);
    if (!file) return;
    lensOff?.abort();
    const pos = ids.indexOf(id) + 1;
    dw.innerHTML = `<div class="top"><span class="tg">${file.querySelector('.tag').textContent}</span><span class="pager"><button type="button" class="chip" data-step="-1" aria-label="上一个案例">←</button><span>${pos} / ${ids.length}</span><button type="button" class="chip" data-step="1" aria-label="下一个案例">→</button></span><button type="button" class="chip" data-close>关闭</button></div>`;
    const body = file.cloneNode(true);
    body.removeAttribute('id');
    body.querySelector('.tag').remove();
    body.querySelectorAll('[id]').forEach(el => { el.id = `dw-${el.id}`; });
    body.querySelector('h3').id = 'dw-title';
    body.querySelectorAll('[data-copy]').forEach(b => { b.dataset.copy = `dw-${b.dataset.copy}`; });
    dw.append(body);
    const fig = dw.querySelector('.xray');
    lensOff = fig ? xray(fig) : null;
    current = id;
    if (!dlg.open) { opener = from || null; try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); } }
    dw.scrollTop = 0;
    dw.querySelector('[data-close]').focus();
    try { history.replaceState(null, '', `#${id}`); } catch {}
    tracker?.record('case-open', { id });
  }
  const step = dir => {
    const next = ids[(ids.indexOf(current) + dir + ids.length) % ids.length];
    open(next);
    dw.querySelector(`[data-step="${dir}"]`)?.focus();
  };

  dlg.addEventListener('close', () => {
    lensOff?.abort(); lensOff = null;
    opener?.focus();
    try { history.replaceState(null, '', '#cases'); } catch {}
  });
  dlg.addEventListener('click', e => {
    const st = e.target.closest('[data-step]');
    if (st) return step(Number(st.dataset.step));
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
  });
  dlg.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.target.closest('.stage')) return; // arrows move the lens there
    e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1);
  });
  root.addEventListener('click', e => {
    const card = e.target.closest('a.case');
    if (!card) return;
    e.preventDefault(); open(card.dataset.id, card);
  });
  // quest cards, the lens exhibit and anything else can point at a case
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-open]');
    if (b && !dlg.contains(b)) open(b.dataset.open, b);
  });

  // filters
  const grid = root.querySelector('.cases.grid');
  const btns = [...root.querySelectorAll('.filters button')];
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    grid.querySelectorAll('.case').forEach(c => { c.hidden = !(b.dataset.f === 'all' || c.dataset.cat === b.dataset.f); });
    balance();
  }));
  // a lone last card in a row spans the row instead of sitting by itself
  function balance() {
    root.querySelectorAll('.cases').forEach(g => {
      const cards = [...g.querySelectorAll('.case')].filter(c => !c.hidden);
      g.querySelectorAll('.case.wide').forEach(c => c.classList.remove('wide'));
      const cols = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (cols > 1 && cards.length % cols === 1) cards[cards.length - 1].classList.add('wide');
    });
  }
  balance();
  addEventListener('resize', balance);

  // covers
  const arts = [...root.querySelectorAll('.vis[data-art]')];
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(e => paintArt(e.target))) : null;
  arts.forEach(el => { paintArt(el); ro?.observe(el); });

  // flagship cards tilt toward the pointer while a sheen follows it
  if (!reduce()) root.querySelectorAll('.cases.feat .case').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${((px - .5) * 8).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((.5 - py) * 6).toFixed(2)}deg`);
      card.style.setProperty('--sx', `${(100 - px * 100).toFixed(1)}%`);
      card.style.setProperty('--sy', `${(100 - py * 100).toFixed(1)}%`);
      card.classList.add('tilt');
    });
    card.addEventListener('pointerleave', () => card.classList.remove('tilt'));
  });

  root.querySelectorAll('.exhibit .xray').forEach(fig => xray(fig, { intro: true }));

  // deep link: #shaanxi or #case-shaanxi
  const h = location.hash.slice(1).replace(/^case-/, '');
  if (ids.includes(h)) open(h);
}

/* the lens. Returns an AbortController that removes its window listeners. */
function xray(fig, { intro = false } = {}) {
  const ctl = new AbortController(), sig = { signal: ctl.signal };
  const st = fig.querySelector('.stage'), top = st.querySelector('.top'), pins = [...fig.querySelectorAll('.xpin')], notes = [...fig.querySelectorAll('.xnotes li')];
  const modeBtns = [...fig.querySelectorAll('[data-lens]')], score = fig.querySelector('.score'), reveal = fig.querySelector('[data-reveal-all]');
  let x = .5, y = .42, drag = false, mode = 'lens';
  const found = new Set();
  const radius = () => parseFloat(getComputedStyle(st).getPropertyValue('--lr')) || 66;
  const pinAt = p => [parseFloat(p.style.left) / 100, parseFloat(p.style.top) / 100];
  function set(nx, ny) {
    x = Math.min(1, Math.max(0, nx)); y = Math.min(1, Math.max(0, ny));
    if (mode !== 'lens') return;
    st.style.setProperty('--x', `${x * 100}%`); st.style.setProperty('--y', `${y * 100}%`);
    const r = st.getBoundingClientRect(), R = radius();
    pins.forEach(p => {
      const [px, py] = pinAt(p), hit = Math.hypot((px - x) * r.width, (py - y) * r.height) < R;
      notes.find(n => n.dataset.n === p.dataset.n)?.classList.toggle('on', hit);
    });
  }
  // spot-the-pattern: the screenshot stays grey until the viewer clicks on a dark pattern
  function paintGame() {
    const shown = pins.filter(p => found.has(p.dataset.n));
    const mask = shown.length ? shown.map(p => { const [px, py] = pinAt(p); return `radial-gradient(circle 50px at ${px * 100}% ${py * 100}%, #000 96%, transparent 100%)`; }).join(',') : 'linear-gradient(transparent, transparent)';
    top.style.webkitMaskImage = top.style.maskImage = mask;
    pins.forEach(p => { p.hidden = !found.has(p.dataset.n); });
    notes.forEach(n => { const on = found.has(n.dataset.n); n.classList.toggle('hid', !on); n.classList.toggle('on', on); });
    const all = found.size === pins.length;
    score.textContent = all ? `${pins.length} / ${pins.length}，全部找到` : `已找到 ${found.size} / ${pins.length}`;
    fig.classList.toggle('done', all);
    reveal.hidden = all;
  }
  function setMode(m) {
    mode = m; fig.classList.toggle('is-game', m === 'game'); st.classList.toggle('game', m === 'game');
    modeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lens === m)));
    if (m === 'game') { found.clear(); paintGame(); return; }
    top.style.webkitMaskImage = top.style.maskImage = '';
    pins.forEach(p => { p.hidden = false; }); notes.forEach(n => n.classList.remove('hid')); fig.classList.remove('done');
    set(x, y);
  }
  function miss(px, py) {
    const m = document.createElement('span'); m.className = 'miss'; m.style.left = `${px}px`; m.style.top = `${py}px`;
    st.append(m); setTimeout(() => m.remove(), 900);
  }
  const fromEv = e => { const r = st.getBoundingClientRect(); set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
  st.addEventListener('pointermove', e => { if (mode === 'lens' && (e.pointerType === 'mouse' || drag)) fromEv(e); });
  st.addEventListener('pointerdown', e => {
    if (mode === 'game') {
      const r = st.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      const hit = pins.find(p => { const [a, b] = pinAt(p); return Math.hypot(a * r.width - px, b * r.height - py) < 54; });
      if (hit) { found.add(hit.dataset.n); paintGame(); } else miss(px, py);
      return;
    }
    fromEv(e); if (e.pointerType !== 'mouse') drag = true;
  });
  addEventListener('pointerup', () => { drag = false; }, sig);
  st.addEventListener('pointercancel', () => { drag = false; });
  st.addEventListener('keydown', e => {
    if (mode !== 'lens') return;
    const d = { ArrowLeft: [-.05, 0], ArrowRight: [.05, 0], ArrowUp: [0, -.04], ArrowDown: [0, .04] }[e.key];
    if (d) { e.preventDefault(); set(x + d[0], y + d[1]); }
  });
  function glide(tx, ty, dur = 700) {
    if (reduce()) return set(tx, ty);
    const sx = x, sy = y, t0 = performance.now();
    const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); set(sx + (tx - sx) * e, sy + (ty - sy) * e); if (k < 1 && !ctl.signal.aborted) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  notes.forEach(n => n.addEventListener('click', () => { if (mode === 'lens') glide(...pinAt(pins.find(p => p.dataset.n === n.dataset.n))); }));
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.lens)));
  reveal.addEventListener('click', () => { pins.forEach(p => found.add(p.dataset.n)); paintGame(); });
  addEventListener('resize', () => set(x, y), sig);
  set(.5, .42);
  // the exhibit glides to the first note once it scrolls into view
  if (intro && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(() => glide(.87, .12, 1100), 300); } }, { threshold: .5 });
    io.observe(st);
  }
  return ctl;
}

/* covers drawn in code: guilloche rosettes like the security print on a voucher, cracks for a collapsing persona,
   a feed of posts, a court and a globe for the content work */
function rng(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function rosette(ctx, cx, cy, size, p, q, rings) {
  const r = p / q, k = (1 - r) / r, steps = 720 * p;
  for (let j = 0; j < rings; j++) {
    const d = .16 + j * (.46 / rings), s = size / (1 - r + d);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps * Math.PI * 2 * p;
      const px = cx + ((1 - r) * Math.cos(t) + d * Math.cos(k * t)) * s, py = cy + ((1 - r) * Math.sin(t) - d * Math.sin(k * t)) * s;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
}
function paintArt(el) {
  const w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  const dpr = 2, cv = document.createElement('canvas');
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const art = el.dataset.art, seed = Number(el.dataset.seed) || 1, R = rng(seed);
  const on = cssVar('--line'), mark = cssVar('--red');
  if (art === 'rose') {
    const [p, q] = [[3, 11], [2, 9], [4, 13]][(seed - 1) % 3];
    ctx.strokeStyle = on; ctx.lineWidth = .6;
    ctx.globalAlpha = .22; rosette(ctx, w * .8, h * .36, Math.min(w, h) * .5, p, q, 8);
    ctx.globalAlpha = .1; rosette(ctx, w * .8, h * .36, Math.min(w, h) * .76, p, q + 2, 5);
  } else if (art === 'crack') {
    ctx.strokeStyle = on; ctx.lineCap = 'round';
    const grow = (gx, gy, ang, len, width, depth) => {
      let cx = gx, cy = gy;
      for (let walked = 0; walked < len;) {
        const s = 7 + R() * 12; ang += (R() - .5) * .7;
        const nx = cx + Math.cos(ang) * s, ny = cy + Math.sin(ang) * s;
        ctx.lineWidth = width; ctx.globalAlpha = .28; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
        cx = nx; cy = ny; walked += s; width = Math.max(.4, width * .94);
        if (depth < 2 && R() < .14) grow(cx, cy, ang + (R() < .5 ? -1 : 1) * (.5 + R() * .6), len * .45, width * .8, depth + 1);
      }
    };
    for (let i = 0; i < 7; i++) grow(w * .68, h * .28, i / 7 * Math.PI * 2 + R() * .4, Math.max(w, h) * (.35 + R() * .3), 1.6, 0);
  } else if (art === 'feed') {
    const cols = 5, gap = 7, cw = (w - gap * (cols + 1)) / cols;
    ctx.lineWidth = .8;
    for (let c = 0; c < cols; c++) {
      let fy = gap - R() * cw;
      while (fy < h) {
        const ch = cw * (1.15 + R() * .5), fx = gap + c * (cw + gap);
        ctx.strokeStyle = on; ctx.globalAlpha = .13; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(fx, fy, cw, ch, 5); else ctx.rect(fx, fy, cw, ch);
        ctx.stroke();
        if (R() < .16) { ctx.fillStyle = mark; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(fx + cw - 9, fy + ch - 9, 3, 0, Math.PI * 2); ctx.fill(); }
        fy += ch + gap;
      }
    }
  } else if (art === 'court') {
    const top = h * .36, bot = h * 1.05, netH = h * .07;
    const X = (u, v) => w * .5 + (u - .5) * w * (.42 + (v - top) / (bot - top) * .9);
    const seg = (u1, v1, u2, v2) => { ctx.beginPath(); ctx.moveTo(X(u1, v1), v1); ctx.lineTo(X(u2, v2), v2); ctx.stroke(); };
    ctx.strokeStyle = on; ctx.lineWidth = 1.2; ctx.globalAlpha = .3;
    seg(0, top, 0, bot); seg(1, top, 1, bot); seg(.125, top, .125, bot); seg(.875, top, .875, bot);
    const sv = top + (bot - top) * .5; seg(.125, sv, .875, sv); seg(.5, top, .5, sv);
    ctx.globalAlpha = .4; ctx.beginPath(); ctx.moveTo(X(-.02, top), top - netH); ctx.lineTo(X(1.02, top), top - netH); ctx.stroke(); seg(0, top, 1, top);
    ctx.globalAlpha = .14; for (let u = 0; u <= 1.0001; u += .04) { ctx.beginPath(); ctx.moveTo(X(u, top), top); ctx.lineTo(X(u, top), top - netH); ctx.stroke(); }
    ctx.strokeStyle = mark; ctx.globalAlpha = .7; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(w * .2, h * .95); ctx.quadraticCurveTo(w * .5, h * -.08, w * .84, h * .26); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = mark; ctx.globalAlpha = .95; ctx.beginPath(); ctx.arc(w * .84, h * .26, 4.5, 0, Math.PI * 2); ctx.fill();
  } else if (art === 'globe') {
    const cx = w * .8, cy = h * .74, r = Math.min(w, h) * .62;
    ctx.strokeStyle = on; ctx.lineWidth = .8; ctx.globalAlpha = .2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .12;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, r * Math.cos(i * Math.PI / 12), r, 0, 0, Math.PI * 2); ctx.stroke(); }
    for (let i = -4; i <= 4; i++) { const a = i * Math.PI / 10, rx = r * Math.cos(a); ctx.beginPath(); ctx.ellipse(cx, cy - r * Math.sin(a), rx, rx * .12, 0, 0, Math.PI * 2); ctx.stroke(); }
    const ex = cx - r * .45, ey = cy - r * .5;
    ctx.strokeStyle = mark; ctx.globalAlpha = .7; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(w * .07, h * .3); ctx.quadraticCurveTo(w * .4, h * .02, ex, ey); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = mark; ctx.globalAlpha = .9; [[w * .07, h * .3], [ex, ey]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); });
  }
  el.style.backgroundImage = `url(${cv.toDataURL('image/png')})`;
}
