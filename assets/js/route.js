// The treasure route: a red dashed line that leaves the opening scroll, winds down the margins past every chapter
// heading and ends on the ✕ by the contact card. It is drawn as the reader scrolls, with a little ship at its tip.
// Wide screens only (it lives in the margins); rebuilt when the layout or the reading order changes.
const NS = 'http://www.w3.org/2000/svg';
const SHIP = 'M-11 3h22l-4 6h-14zM-2 3v-17M-1-13c7 3 7 9 0 12zM-1 -1c-5-2-6-7 0-10';

export function initRoute() {
  const main = document.getElementById('chapters');
  const svg = main?.querySelector('svg.route');
  if (!svg) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let path, ink, ship, total = 0, samples = [];

  function build() {
    svg.replaceChildren();
    const box = main.getBoundingClientRect();
    const opening = main.querySelector('[data-chapter="opening"] .boot');
    const heads = [...main.querySelectorAll(':scope > [data-chapter]:not([data-chapter="opening"]) > .ch-head')].filter(h => h.offsetParent);   // folded chapters are skipped
    const treasure = main.querySelector('.treasure svg');
    const margin = Math.min(box.left, innerWidth - box.right);
    svg.classList.toggle('off', margin < 34 || !opening || !treasure);
    if (svg.classList.contains('off')) return;
    svg.setAttribute('width', box.width + margin * 2); svg.setAttribute('height', main.scrollHeight);
    svg.style.left = `${-margin}px`;
    const L = margin * .5, R = box.width + margin * 1.5;         // the two margin lanes, in svg coordinates
    const rel = el => { const r = el.getBoundingClientRect(); return { x: r.left - box.left + margin, y: r.top - box.top, w: r.width, h: r.height }; };
    const o = rel(opening);
    let x = o.x + o.w / 2, y = o.y + o.h + 14;
    let d = `M${x} ${y}`;
    heads.forEach((h, i) => {
      const r = rel(h), last = i === heads.length - 1;
      const side = last ? R : i % 2 ? R : L;
      const gap = r.y - 70;                                          // the open water above the heading
      d += ` C${x} ${(y + gap) / 2} ${side} ${gap - 40} ${side} ${gap + 30}`;
      x = side; y = r.y + 30;
      d += ` L${x} ${y}`;
      if (!last) {
        const next = rel(heads[i + 1]);
        d += ` L${x} ${next.y - 120}`; y = next.y - 120;
      }
    });
    const t = rel(treasure);
    d += ` C${x} ${t.y + t.h / 2} ${t.x + t.w + 60} ${t.y + t.h / 2} ${t.x + t.w / 2} ${t.y + t.h / 2}`;

    const defs = document.createElementNS(NS, 'defs'), mask = document.createElementNS(NS, 'mask');
    mask.id = 'route-drawn';
    ink = document.createElementNS(NS, 'path'); ink.setAttribute('d', d); ink.setAttribute('class', 'route-ink');
    mask.append(ink); defs.append(mask);
    path = document.createElementNS(NS, 'path'); path.setAttribute('d', d); path.setAttribute('class', 'route-line'); path.setAttribute('mask', 'url(#route-drawn)');
    ship = document.createElementNS(NS, 'g'); ship.setAttribute('class', 'route-ship');
    const hull = document.createElementNS(NS, 'path'); hull.setAttribute('d', SHIP); hull.setAttribute('class', 'hull');
    ship.append(hull);                                             // the group follows the route; the hull bobs inside it
    svg.append(defs, path, ship);
    total = path.getTotalLength();
    ink.style.strokeDasharray = `${total} ${total}`;
    // length at which the route first reaches each depth, so scroll position maps straight to drawn length
    samples = [];
    for (let l = 0; l <= total; l += 24) samples.push([path.getPointAtLength(l).y, l]);
    draw();
  }

  function draw() {
    if (!path) return;
    const fold = scrollY + innerHeight * .7 - (main.getBoundingClientRect().top + scrollY);
    let len = reduce ? total : 0;
    if (!reduce) for (const [y, l] of samples) { if (y <= fold) len = l; else break; }
    ink.style.strokeDashoffset = `${total - len}`;
    const p = path.getPointAtLength(len);
    ship.setAttribute('transform', `translate(${p.x.toFixed(1)} ${(p.y - 4).toFixed(1)})`);
    ship.classList.toggle('home', len >= total - 30);
  }

  let frame = 0;
  const later = fn => () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fn); };
  addEventListener('scroll', draw, { passive: true });          // a lookup per event: cheap enough to run directly
  addEventListener('resize', later(build));
  document.addEventListener('eo:mode', () => setTimeout(build, 350));
  if ('ResizeObserver' in window) new ResizeObserver(later(build)).observe(main);
  build();

  // the ✕ is drawn when the contact chapter comes into view
  const contact = document.getElementById('contact');
  if (contact && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { contact.classList.add('found'); io.disconnect(); } }, { threshold: .35 });
    io.observe(contact);
  } else contact?.classList.add('found');

  // a tap on the scroll skips the unrolling
  const boot = main.querySelector('.boot');
  boot?.addEventListener('pointerdown', () => boot.classList.add('unrolled'), { once: true });
}
