import { VIEW, LAND, POINTS, FOCUS } from '../map/world.js';
import { COUNTRIES, PINS, DOTS } from '../../data/places.js';
import { STORIES } from '../../data/content.js';
import { unlockedAt, clampYear } from './timeline.js';

const pct = (v, total) => `${(v / total) * 100}%`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderStage(stage) {
  const dots = DOTS.map(d => {
    const [x, y] = POINTS[d.city];
    return `<circle class="dot" data-city="${esc(d.city)}" cx="${x}" cy="${y}" r="2.4"/>`;
  }).join('');
  const pins = PINS.map(p => {
    const [x, y] = POINTS[p.city];
    const thumb = p.photo ? `<img src="assets/img/${p.photo}-s.webp" alt="" width="40" height="40" loading="lazy">` : '<span class="pin-dot"></span>';
    return `<button type="button" class="pin" data-pin="${p.id}" data-city="${esc(p.city)}" style="left:${pct(x, VIEW.width)};top:${pct(y, VIEW.height)}" aria-label="${esc(STORIES[p.id]?.title ?? p.city)}，打开存档卡">${thumb}<span class="pin-label">${esc(p.city)}</span></button>`;
  }).join('');
  stage.innerHTML = `<svg viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-label="世界地图，标出去过的城市"><path class="land" d="${LAND}"/>${dots}</svg><div class="map-pins">${pins}</div>`;
  stage.removeAttribute('aria-hidden');
}

export function initMap({ tracker } = {}) {
  const root = document.getElementById('map');
  const atlas = root.querySelector('.atlas');
  const stage = root.querySelector('.map-stage');
  const count = root.querySelector('#map-count');
  const yearLabel = root.querySelector('#map-year');
  const range = root.querySelector('.scrub input');
  const resetBtn = root.querySelector('[data-reset-map]');
  const expandBtn = root.querySelector('[data-expand-map]');
  const layer = root.querySelector('.card-layer');
  renderStage(stage);

  // fly-to: move and scale the whole stage; pins and dots counter-scale to keep their size
  function fly(f) {
    const s = f ? f.scale : 1;
    const tx = f ? (0.5 - (f.x / VIEW.width) * s) * 100 : 0;
    const ty = f ? (0.5 - (f.y / VIEW.height) * s) * 100 : 0;
    stage.style.transform = `translate(${tx}%, ${ty}%) scale(${s})`;
    stage.style.setProperty('--s', s);
    for (const c of stage.querySelectorAll('.dot')) c.setAttribute('r', String(2.4 / s));
    stage.classList.toggle('zoomed', Boolean(f));
    resetBtn.hidden = !f;
  }
  root.querySelectorAll('[data-country]').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-country]').forEach(x => x.removeAttribute('aria-current'));
    b.setAttribute('aria-current', 'true');
    atlas.classList.remove('compact'); expandBtn.hidden = true;
    fly(FOCUS[b.dataset.country]);
    root.querySelector('.map-view').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
  resetBtn.addEventListener('click', () => { fly(null); root.querySelectorAll('[data-country]').forEach(x => x.removeAttribute('aria-current')); });

  // timeline: everything first visited after the chosen year goes dark
  function setYear(value) {
    const y = clampYear(Number(value));
    const u = unlockedAt(y);
    const cities = new Set(u.cities), countries = new Set(u.countries);
    stage.querySelectorAll('[data-city]').forEach(el => el.classList.toggle('off', !cities.has(el.dataset.city)));
    root.querySelectorAll('[data-country]').forEach(el => el.classList.toggle('off', !countries.has(el.dataset.country)));
    count.textContent = String(u.count);
    yearLabel.textContent = String(y);
    return u;
  }
  // only a visitor's own drag counts toward achievements, not the initial render
  range.addEventListener('input', () => tracker?.record('timeline', { count: setYear(range.value).count }));
  setYear(range.value);

  // archive card
  let opener = null;
  function closeCard() {
    layer.hidden = true; layer.innerHTML = '';
    opener?.focus();
  }
  function openCard(pinId, from) {
    const pin = PINS.find(p => p.id === pinId), story = STORIES[pinId];
    if (!pin || !story) return;
    opener = from;
    const photo = pin.photo
      ? `<figure class="pframe develop"><img src="assets/img/${pin.photo}-l.webp" alt="${esc(story.title)}" loading="lazy"><figcaption class="plate">${esc(story.meta)}</figcaption></figure>` : '';
    layer.innerHTML = `<div class="card-back" data-close></div><article class="archive paper" role="dialog" aria-modal="true" aria-labelledby="card-t">
      <button type="button" class="chip card-x" data-close>关闭</button>${photo}
      <p class="kicker">SAVE FILE · ${esc(pin.city)}</p><h3 id="card-t">${esc(story.title)}</h3><p class="card-meta">${esc(story.meta)}</p><p>${esc(story.text)}</p></article>`;
    layer.hidden = false;
    const img = layer.querySelector('.develop img');
    if (img) {
      const done = () => requestAnimationFrame(() => img.closest('.develop').classList.add('done'));
      img.complete ? done() : img.addEventListener('load', done, { once: true });
    }
    layer.querySelector('.card-x').focus();
    tracker?.record('card-open', { pin: pinId });
  }
  stage.addEventListener('click', e => { const b = e.target.closest('.pin'); if (b) openCard(b.dataset.pin, b); });
  layer.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeCard(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !layer.hidden) closeCard(); });

  // interviewers get a folded map; friends get the full one
  document.addEventListener('eo:mode', e => {
    const compact = e.detail.mode !== 'friend';
    atlas.classList.toggle('compact', compact);
    expandBtn.hidden = !compact;
  });
  expandBtn.addEventListener('click', () => { atlas.classList.remove('compact'); expandBtn.hidden = true; });
}
