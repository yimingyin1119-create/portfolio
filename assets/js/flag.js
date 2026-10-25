// Waving cloth flags on a pole. The cloth is painted once (dark sailcloth, weave, stitched hem, lettering) and redrawn
// every frame in thin vertical slices: each slice is lifted by a travelling wave that grows away from the pole, and
// shaded by the wave's slope so the folds catch the light. Only animates while on screen; still under reduced motion.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function cloth(w, h, title, sub, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#33281d'); g.addColorStop(1, '#241b13');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // weave
  x.globalAlpha = .07; x.strokeStyle = '#f4e8cc'; x.lineWidth = .5;
  for (let y = 0; y < h; y += 2.5) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  x.globalAlpha = .05;
  for (let i = 0; i < w; i += 2.5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  // stitched hem
  x.globalAlpha = .55; x.setLineDash([4, 3]); x.lineWidth = 1;
  x.strokeRect(5, 5, w - 10, h - 10); x.setLineDash([]);
  // lettering
  x.globalAlpha = 1; x.fillStyle = '#f1e3c4'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const size = Math.min(h * (sub ? .26 : .34), w / (title.length * .62));
  x.font = `900 ${size}px "EO Display", "Songti SC", Georgia, serif`;
  x.fillText(title, w / 2, sub ? h * .44 : h / 2);
  if (sub) { x.font = `600 ${size * .38}px "Oswald", "Arial Narrow", sans-serif`; x.globalAlpha = .8; x.fillText(sub, w / 2, h * .7); }
  // slub noise
  const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() * 2 - 1) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(id, 0, 0);
  return c;
}

function initFlag(canvas) {
  const W = canvas.width, H = canvas.height;           // logical size from the markup
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const x = canvas.getContext('2d');
  x.scale(dpr, dpr);
  const poleX = 8, top = 10, cw = W - poleX - 14, ch = Math.round(H * .62), amp = H * .07;
  const tex = cloth(cw, ch, canvas.dataset.title || '', canvas.dataset.sub || '', dpr);
  const STEP = 2;

  function frame(t) {
    x.clearRect(0, 0, W, H);
    // pole and finial
    x.fillStyle = '#4a321c'; x.fillRect(poleX - 2, top - 4, 4, H - top + 4);
    x.beginPath(); x.arc(poleX, top - 6, 4.5, 0, Math.PI * 2); x.fillStyle = '#8a6a2c'; x.fill();
    for (let i = 0; i < cw; i += STEP) {
      const u = i / cw;
      const phase = u * Math.PI * 2.4 - t * 3.1;
      const lift = amp * u * (Math.sin(phase) + .35 * Math.sin(phase * 1.9 + 1.2)) - u * 4;
      const slope = Math.cos(phase) * u;
      const shrink = 1 - u * .06;                       // the free end droops a little
      x.drawImage(tex, i * dpr, 0, STEP * dpr, ch * dpr, poleX + 2 + i, top + lift + ch * (1 - shrink) / 2, STEP + .6, ch * shrink);
      x.fillStyle = slope > 0 ? `rgba(255, 240, 210, ${slope * .16})` : `rgba(0, 0, 0, ${-slope * .3})`;
      x.fillRect(poleX + 2 + i, top + lift + ch * (1 - shrink) / 2, STEP + .6, ch * shrink);
    }
  }

  if (reduce()) { frame(1.2); return; }
  let raf = 0, on = false, t0 = performance.now();
  const loop = now => { frame((now - t0) / 1000); raf = requestAnimationFrame(loop); };
  const start = () => { if (!on) { on = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { on = false; cancelAnimationFrame(raf); };
  frame(0);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es[0].isIntersecting ? start() : stop()).observe(canvas);
  else start();
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
}

export function initFlags() {
  const flags = [...document.querySelectorAll('canvas.flag')];
  if (!flags.length) return;
  // wait for the title face so the lettering is painted in it
  const ready = document.fonts?.load ? document.fonts.load('900 20px "EO Display"').catch(() => {}) : Promise.resolve();
  ready.then(() => flags.forEach(initFlag));
}
