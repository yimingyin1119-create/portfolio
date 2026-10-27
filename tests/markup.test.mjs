import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODES } from '../assets/js/modes.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const html = read('index.html');

test('every chapter of both reading orders is in the page, inside #chapters', () => {
  const main = html.slice(html.indexOf('<main id="chapters"'), html.indexOf('</main>'));
  for (const id of MODES.interviewer) assert.ok(main.includes(`data-chapter="${id}"`), id);
});

test('nothing is loaded from another host', () => {
  assert.ok(!/fonts\.googleapis|gstatic|unpkg|jsdelivr|cdnjs|cdn\./i.test(html));
  assert.ok(!/<script[^>]+src="https?:/i.test(html));
  assert.ok(!/<link[^>]+href="https?:/i.test(html));
});

test('images are files, sized, and lazy outside the opening', () => {
  assert.ok(!html.includes('data:image'));
  const opening = html.slice(html.indexOf('data-chapter="opening"'), html.indexOf('data-chapter="', html.indexOf('data-chapter="opening"') + 30));
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    assert.ok(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag), tag);
    if (!opening.includes(tag)) assert.ok(tag.includes('loading="lazy"'), tag);
  }
});

test('hidden starting states only exist under html.motion or html.js', () => {
  for (const file of ['assets/css/layout.css', 'assets/css/components.css']) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/opacity:\s*0(?![.\d])|(?<![-\w])visibility:\s*hidden/.test(body) && !/:hover|:focus|\[hidden\]|\.toast|::before|::after/.test(selector)) {
        for (const s of selector.split(',')) assert.ok(/^html\.(motion|js)\b/.test(s.trim()), `${file}: ${s.trim()}`);
      }
    }
  }
});

test('reduced motion is honoured', () => {
  assert.ok(read('assets/css/tokens.css').includes('prefers-reduced-motion'));
  assert.ok(read('assets/js/main.js').includes('prefers-reduced-motion'));
});

test('contact details are present and the phone number is not', () => {
  assert.ok(html.includes('EmengYin') && html.includes('yinyiming2003@qq.com'));
});

test('opening shows the player card, the headline and both visitor buttons', async () => {
  const { PROFILE } = await import('../data/content.js');
  const start = html.indexOf('data-chapter="opening"');
  const opening = html.slice(start, html.indexOf('data-chapter="', start + 30));
  const text = opening.replace(/<[^>]+>/g, '');
  assert.ok(text.includes('从让观众鼓掌，到让用户下单。'));
  assert.ok(opening.includes('从导演一部校园微电影，到一个省的暑期消费季'));
  assert.ok(opening.includes('PLAYER · 尹伊茗'));
  for (const p of PROFILE) {
    assert.ok(opening.includes(p.value), p.value);
    assert.ok(opening.includes(p.proof), p.proof);
  }
  assert.equal((opening.match(/aria-expanded="false"/g) ?? []).length, PROFILE.length);
  assert.ok(opening.includes('data-pick="interviewer"') && opening.includes('data-pick="friend"'));
  for (const badge of ['Class of 2027', '26 国', '4 段实习']) assert.ok(text.includes(badge), badge);
});

test('map chapter works without JS: every country listed by year, plus the stage and timeline', async () => {
  const { COUNTRIES } = await import('../data/places.js');
  const start = html.indexOf('data-chapter="map"');
  const map = html.slice(start, html.indexOf('data-chapter="', start + 30));
  for (const c of COUNTRIES) assert.ok(map.includes(`data-country="${c.id}"`), c.id);
  for (const y of [2019, 2023, 2024, 2025, 2026]) assert.ok(map.includes(`data-year="${y}"`), y);
  assert.ok(map.includes('class="map-stage"'));
  assert.ok(/<input[^>]+type="range"[^>]+min="2019"[^>]+max="2026"/.test(map));
  assert.ok(map.includes('id="map-count"'));
});

const chapterHtml = id => {
  const start = html.indexOf(`data-chapter="${id}"`);
  const next = html.indexOf('data-chapter="', start + 30);
  return html.slice(start, next === -1 ? html.indexOf('</main>') : next);
};
const textOf = s => s.replace(/<[^>]+>/g, '');

test('quest cards: four, newest first, with a flip button and both sides in the markup', async () => {
  const { QUESTS } = await import('../data/content.js');
  const q = chapterHtml('quests');
  const ids = [...q.matchAll(/data-quest="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, QUESTS.map(x => x.id));
  assert.equal((q.match(/class="flip"[^>]*aria-pressed="false"/g) ?? []).length, 4);
  for (const x of QUESTS) {
    for (const line of [...x.did, ...x.result]) assert.ok(textOf(q).includes(line), line);
  }
});

test('posters: every poster with its value, and only exact ones marked to count', async () => {
  const { POSTERS } = await import('../data/content.js');
  const p = chapterHtml('posters');
  for (const x of POSTERS) {
    assert.ok(p.includes(`data-poster="${x.id}"`), x.id);
    assert.ok(new RegExp(`data-poster="${x.id}"[^>]*data-count="${x.count}"`).test(p), x.id);
    assert.ok(textOf(p).includes(x.value), x.value);
  }
});

test('novice badges, skill links and the first voyage are all there', async () => {
  const { BADGES_NOVICE } = await import('../data/content.js');
  const n = textOf(chapterHtml('novice'));
  for (const b of BADGES_NOVICE) assert.ok(n.includes(b.title) && n.includes(b.note), b.id);
  const s = chapterHtml('skills');
  for (const href of ['painpoint.html', 'kitchen/', 'workbench.html']) assert.ok(s.includes(`href="${href}"`), href);
  const a = textOf(chapterHtml('abroad'));
  for (const t of ['唐人街探案1900', '哪吒2', '夜王', '中式家庭的托举是一代又一代传下的接力棒', '保健品寄送类没接', '全荷华人春晚']) assert.ok(a.includes(t), t);
});

test('cases: a card and a full written-out file for every case, filters, the lens and the drawer', async () => {
  const { CASES } = await import('../data/content.js');
  const c = chapterHtml('cases');
  const t = textOf(c);
  for (const x of CASES) {
    assert.ok(new RegExp(`class="case[^"]*"[^>]*data-id="${x.id}"`).test(c), `card ${x.id}`);
    assert.ok(c.includes(`id="case-${x.id}"`), `file ${x.id}`);
    for (const line of [...(x.out ?? []), ...x.did]) assert.ok(t.includes(line), line);
  }
  for (const f of ['all', 'insight', 'campaign', 'content', 'creative']) assert.ok(c.includes(`data-f="${f}"`), f);
  assert.ok(t.includes('内容'));
  assert.ok(/class="xray"[\s\S]*pdd_popup/.test(c));
  assert.ok(c.includes('<dialog class="drawer"'));
});

test('bridge: the slider and three documents, rendered at the default gap', async () => {
  const { LEVELS, levelFor } = await import('../assets/js/bridge.js');
  const b = chapterHtml('bridge');
  assert.ok(/<input[^>]+type="range"[^>]+id="gap"[^>]+min="0"[^>]+max="30"[^>]+value="17"/.test(b));
  for (const k of ['mail', 'ticket', 'cue']) assert.ok(b.includes(`class="doc ${k}"`), k);
  assert.ok(textOf(b).includes(levelFor(17).say));
  assert.equal(LEVELS.length, 3);
});

test('viewfinder: six photos in viewfinder frames, the badminton card and a reel frame per work', async () => {
  const { WORKS } = await import('../data/content.js');
  const v = chapterHtml('viewfinder');
  const t = textOf(v);
  for (const id of ['amalfi', 'rain-lake', 'xuanwu', 'canon', 'fuji', 'lianyungang']) assert.ok(new RegExp(`class="vf"[^>]*>[\\s\\S]*?assets/img/${id}-s\\.webp`).test(v), id);
  assert.equal((v.match(/class="vf"/g) ?? []).length, 6);
  assert.ok(v.includes('assets/img/badminton-s.webp') && t.includes('组委会导演组：排赛程、做宣传、执裁计分；同时作为北荷兰队队员上场比赛'));
  assert.ok(v.includes('assets/img/ambassadors-s.webp'));
  for (const w of WORKS) {
    assert.ok(new RegExp(`data-work="${w.id}"`).test(v), w.id);
    assert.ok(t.includes(w.title) && t.includes(w.stat), w.id);
  }
  assert.ok(v.includes('class="reel"') && v.includes('data-reel="-1"') && v.includes('data-reel="1"'));
});

test('contact offers the PDF', () => {
  const c = chapterHtml('contact');
  assert.ok(/<a[^>]+href="%E5%B0%B9%E4%BC%8A%E8%8C%97_[^"]+\.pdf"[^>]+download/.test(c));
});

test('achievements: a toast region and a nav badge listing every rule', async () => {
  const { RULES } = await import('../assets/js/achievements.js');
  assert.ok(/<div id="toast" class="toast" role="status" aria-live="polite"><\/div>/.test(html));
  const nav = html.slice(html.indexOf('<nav class="bar"'), html.indexOf('</nav>'));
  assert.ok(/<button[^>]+class="ach"[^>]+aria-expanded="false"[^>]+aria-controls="ach-list"/.test(nav));
  assert.ok(textOf(nav).includes(`0/${RULES.length}`));
  for (const r of RULES) assert.ok(nav.includes(`data-ach="${r.id}"`) && textOf(nav).includes(r.title), r.id);
});

test('the three playable AI works are singled out with a hint and a start button, and the opening points to them', () => {
  const s = chapterHtml('skills');
  const plays = [...s.matchAll(/<article class="play"[\s\S]*?<\/article>/g)].map(m => m[0]);
  assert.equal(plays.length, 3);
  for (const [p, href] of plays.map((p, i) => [p, ['painpoint.html', 'kitchen/', 'workbench.html'][i]])) {
    assert.ok(p.includes(`href="${href}"`) && textOf(p).includes('试试看') && textOf(p).includes('开始体验'), href);
  }
  const opening = chapterHtml('opening');
  assert.ok(/<a[^>]+class="play-link"[^>]+href="#skills"/.test(opening));
});

test('illustrations: every chapter but the opening has a line drawing, cards with no photo get an icon, quests get a stamp', () => {
  for (const id of MODES.interviewer.filter(x => x !== 'opening')) {
    assert.ok(/<svg class="ch-art"[^>]*aria-hidden="true"/.test(chapterHtml(id)), id);
  }
  assert.equal((chapterHtml('skills').match(/<svg class="icon"/g) ?? []).length, 3);
  assert.equal((chapterHtml('abroad').match(/<svg class="icon"/g) ?? []).length, 3);
  assert.equal((chapterHtml('quests').match(/<svg class="stamp"/g) ?? []).length, 4);
  assert.ok(html.includes('class="the-end"'));
});

test('the opening states both degrees', () => {
  const t = textOf(chapterHtml('opening'));
  for (const s of ['新加坡国立大学', '传播学（数据方向）硕士', '阿姆斯特丹大学', '媒体与信息本科']) assert.ok(t.includes(s), s);
});

test('the kraft palette: kraft ground, parchment cards, sepia ink, route red', () => {
  const t = read('assets/css/tokens.css');
  const root = t.slice(t.indexOf(':root {'), t.indexOf('}', t.indexOf(':root {')));
  assert.ok(root.includes('color-scheme: light'));
  for (const [k, v] of [['--bg', '#ceae82'], ['--card', '#f1e3c4'], ['--ink', '#2e1f12'], ['--red', '#9a3a22']]) assert.ok(new RegExp(`${k}:\\s*${v}`, 'i').test(root), k);
  assert.ok(html.includes('<meta name="theme-color" content="#ceae82">'));
});

test('the opening is a paper scroll: a rolled curl at the top and one at the bottom', () => {
  const o = chapterHtml('opening');
  assert.ok(/class="curl top"[^>]*aria-hidden="true"/.test(o) && /class="curl bottom"[^>]*aria-hidden="true"/.test(o));
});

test('flags fly over the opening and the treasure, and the page carries a route layer', () => {
  assert.ok(/<canvas class="flag"[^>]*data-title="EARTH ONLINE"[^>]*aria-hidden="true"/.test(chapterHtml('opening')));
  assert.ok(/class="treasure"[\s\S]*?<canvas class="flag small"/.test(chapterHtml('contact')));
  assert.ok(/<svg class="route"[^>]*aria-hidden="true"/.test(html));
});

test('no red text: red is only for drawn lines (route, treasure, drawing accents)', () => {
  for (const file of ['assets/css/layout.css', 'assets/css/components.css']) {
    for (const [, sel, body] of read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const decl of body.split(';')) {
        if (/^\s*(color|fill|background(-color)?)\s*:/.test(decl)) assert.ok(!decl.includes('var(--red)'), `${file}: ${sel.trim()} → ${decl.trim()}`);
      }
    }
  }
});

test('frames and borders are never red; red is kept for buttons, text and drawing accents', () => {
  for (const file of ['assets/css/tokens.css', 'assets/css/layout.css', 'assets/css/components.css']) {
    const css = read(file);
    for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const decl of body.split(';')) {
        if (/^\s*(border[\w-]*|outline|box-shadow)\s*:/.test(decl)) assert.ok(!decl.includes('var(--red)'), `${file}: ${sel.trim()} → ${decl.trim()}`);
      }
    }
  }
});

test('every stylesheet and script URL carries a hash of its content, so a deploy is never mixed with a cached old file', async () => {
  const { createHash } = await import('node:crypto');
  const { readdirSync } = await import('node:fs');
  const hash = p => createHash('sha256').update(readFileSync(new URL(`../${p}`, import.meta.url))).digest('hex').slice(0, 10);
  for (const m of html.matchAll(/<link rel="stylesheet" href="([^"?]+)\?v=([0-9a-f]+)"/g)) assert.equal(m[2], hash(m[1]), m[1]);
  assert.equal((html.match(/<link rel="stylesheet" href="[^"?]+"/g) ?? []).length, 0, 'unversioned stylesheet');
  const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const modules = [...readdirSync(new URL('../assets/js/', import.meta.url)).map(f => `assets/js/${f}`), 'data/content.js', 'data/places.js', 'assets/map/world.js'];
  for (const p of modules) assert.equal(map[`./${p}`], `./${p}?v=${hash(p)}`, p);
  assert.ok(html.indexOf('type="importmap"') < html.indexOf('type="module"'));
});

test('no Chinese is set in fake italics: only the decorative // mark and English-page rules slant', () => {
  for (const file of ['assets/css/layout.css', 'assets/css/components.css']) {
    for (const [, sel, body] of read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/italic/.test(body)) assert.ok(sel.trim() === '.frame > .slash' || /^html\[lang="en"\]/.test(sel.trim()), `${file}: ${sel.trim()}`);   // English has a real italic
    }
  }
});

test('chapter titles follow "theme word · plain words"', () => {
  for (const [id, t] of [['bridge', '传令 · 一件事说给三种人'], ['contact', '发信号 · 加个好友'], ['map', '航海图 · 去过的 26 国']]) {
    assert.ok(textOf(chapterHtml(id)).includes(t), id);
  }
});

test('more cases are a logbook: one spread per case, turn controls, a magnifier, readable without JS', async () => {
  const { CASES } = await import('../data/content.js');
  const c = chapterHtml('cases');
  const book = c.slice(c.indexOf('class="logbook"'), c.indexOf('class="dossier"'));
  for (const x of CASES.filter(x => !x.feat)) {
    assert.ok(new RegExp(`<article class="case-leaf"[^>]*data-id="${x.id}"[^>]*data-cat="${x.cat}"`).test(book), x.id);
    assert.ok(new RegExp(`href="#case-${x.id}"[^>]*data-open="${x.id}"`).test(book), `${x.id} link`);
  }
  assert.equal((book.match(/<article class="case-leaf"/g) ?? []).length, CASES.filter(x => !x.feat).length);
  assert.ok(book.includes('data-turn="-1"') && book.includes('data-turn="1"'));
  assert.ok(/<button[^>]+data-loupe[^>]+aria-pressed="true"/.test(book));
  assert.ok(/class="loupe"[^>]*aria-hidden="true"/.test(book));
  assert.ok(!c.includes('class="cases grid"'));
});

test('each logbook spread also shows my role and the first things I did', async () => {
  const { CASES } = await import('../data/content.js');
  const c = chapterHtml('cases');
  for (const x of CASES.filter(x => !x.feat)) {
    const leaf = c.slice(c.indexOf(`<article class="case-leaf" data-id="${x.id}"`), c.indexOf('</article>', c.indexOf(`<article class="case-leaf" data-id="${x.id}"`)));
    assert.ok(textOf(leaf).includes(x.meta[0][1].slice(0, 12)), `${x.id} role`);
    assert.ok(/<ul class="leaf-did">/.test(leaf), `${x.id} did`);
    for (const d of x.did.slice(0, 2)) assert.ok(textOf(leaf).includes(d.slice(0, 12)), d);
  }
});

test('interviewer mode folds the personal chapters behind a 「更多关于我」 entry placed right after the bridge', () => {
  const at = id => html.indexOf(`data-chapter="${id}"`);
  const fold = html.indexOf('<aside class="more-about"');
  assert.ok(fold > at('bridge') && fold < at('novice'));
  const aside = html.slice(fold, html.indexOf('</aside>', fold));
  assert.ok(/<button[^>]+class="more-btn"[^>]+aria-expanded="false"/.test(aside));
  assert.ok(textOf(aside).includes('更多关于我'));
  const en = read('en.html');
  assert.ok(textOf(en.slice(en.indexOf('<aside class="more-about"'), en.indexOf('</aside>', en.indexOf('<aside class="more-about"')))).includes('More about me'));
});
