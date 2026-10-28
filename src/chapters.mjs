// Static HTML for every chapter, rendered at build time from data/. Interactions are layered on by assets/js.
import { chapter, esc, img } from './html.mjs';
import { icon, stamp, treasure } from './art.mjs';
import { t, data, places, isEn } from './i18n.mjs';
import { levelFor, techRows, cueRules } from '../assets/js/bridge.js';

export const opening = () => `<section class="chapter opening" id="opening" data-chapter="opening" aria-labelledby="h-opening">
  <div class="frame boot"><span class="curl top" aria-hidden="true"></span><span class="curl bottom" aria-hidden="true"></span>
    <canvas class="flag" data-title="EARTH ONLINE" data-sub="· VOYAGE 2027 ·" width="300" height="190" aria-hidden="true"></canvas>
    <button type="button" class="music-hint">♪ ${t('听一段航海的声音')}</button>
    <ul class="hud" aria-label="${t('玩家数值')}"><li>Class of <b>2027</b></li><li><b>26</b> ${t('国')}</li><li><b>4</b> ${t('段实习')}</li></ul>
    <div class="player">
      <figure class="pframe tilt">${img('portrait', t('尹伊茗'), { eager: true, sizes: '(max-width: 720px) 60vw, 300px' })}<figcaption class="plate">${t('PLAYER · 尹伊茗')}</figcaption></figure>
      <div class="player-tx">
        <p class="online">${t('玩家已上线')}<span class="caret" aria-hidden="true"></span></p>
        <h1 id="h-opening">${t('从让观众鼓掌，')}<br>${t('到让用户下单。')}</h1>
        <p class="lede">${t('从导演一部校园微电影，到一个省的暑期消费季')}</p>
        <ul class="edu" aria-label="${t('教育背景')}"><li><b>${t('新加坡国立大学')}</b><span>${t('传播学（数据方向）硕士 · 2026–2027 在读')}</span></li><li><b>${t('阿姆斯特丹大学')}</b><span>${t('媒体与信息本科 · 2023–2026')}</span></li></ul>
        <ul class="attrs">${data().PROFILE.map(p => `<li class="attr"><button type="button" class="attr-btn" aria-expanded="false" aria-controls="proof-${p.key}"><span class="attr-k">${esc(p.label)}</span><span class="attr-v">${esc(p.value)}</span><span class="attr-i" aria-hidden="true">?</span></button><p class="proof" id="proof-${p.key}">${esc(p.proof)}</p></li>`).join('')}</ul>
        <div class="pick" role="group" aria-label="${t('你是谁')}"><button type="button" class="cta" data-pick="interviewer">${t('我是面试官')} <span aria-hidden="true">→</span></button><button type="button" class="ghost" data-pick="friend">${t('我是新朋友')} <span aria-hidden="true">→</span></button></div>
        <a class="play-link" href="#skills">${t('▶ 先玩一下我做的 3 个 AI 作品')}</a>
      </div>
    </div>
    <span class="slash" aria-hidden="true">//</span>
  </div>
</section>`;
const list = items => `<ul class="ticks">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

export const quests = () => chapter('quests', 'MAIN QUEST', t('主线任务 · 平台'), `<div class="quests">${data().QUESTS.map(q => `<article class="quest" data-quest="${q.id}" data-reveal>
    <div class="quest-in">
      <div class="side front">
        <header class="q-head"><h3>${esc(q.company)}${stamp()}</h3><p class="q-meta">${esc(q.period)} · ${esc(q.place)}<br>${esc(q.role)}</p></header>
        ${q.photo ? `<figure class="pframe q-photo">${img(q.photo, `${q.company}${t('实习')}`, { sizes: '(max-width: 720px) 40vw, 180px' })}</figure>` : ''}
        <p class="side-k">${t('我做了什么')}</p>${list(q.did)}
      </div>
      <div class="side back">
        <p class="side-k">${t('项目整体结果')}</p>${list(q.result)}
        ${q.source ? `<p class="src">${t('数据来源：')}${esc(q.source)}</p>` : ''}
        ${q.caseId ? `<button type="button" class="chip" data-open="${q.caseId}">${t('看完整案例 →')}</button>` : ''}
      </div>
    </div>
    <button type="button" class="flip" aria-pressed="false"><span>${t('翻面看结果')}</span> <span aria-hidden="true">↻</span></button>
  </article>`).join('')}</div>`, { sub: t('四段实习，倒着看。卡片正面是我做了什么，翻过来是项目整体的结果。') });
const LAMP = '<svg class="lamp" viewBox="0 0 80 60" aria-hidden="true"><path d="M40 4v4M40 8L18 46M40 8l22 38" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="40" cy="6" r="3.5" fill="currentColor"/></svg>';

export const posters = () => chapter('posters', 'TREASURE HAUL', t('战利品 · 成绩'), `<div class="posters">${data().POSTERS.map(p => `<figure class="poster" data-poster="${p.id}" data-count="${p.count}" data-reveal>${LAMP}<span class="beam" aria-hidden="true"></span><div class="sheet"><b class="big">${esc(p.value)}</b><figcaption>${esc(p.label)}</figcaption></div></figure>`).join('')}</div>`);
// The three works a visitor can open and play with get the spotlight; the rest are listed below them.
const PLAYS = () => [
  { t: t('痛点认领'), k: t('AI 产品 Demo'), d: t('AI 搜索的回答里，品牌买不到答案，只能认领用户的真实痛点。'), try: t('在 AI 搜索里点「散场打不到车」，再点「为什么看到」，看品牌凭什么出现。'), href: 'painpoint.html' },
  { t: t('饭搭子'), k: t('n8n 点餐小程序 · 演示版'), d: t('提要求 → 算缺料 → 推送 → 接单做好 → 扣库存，后端全是 n8n 工作流。'), try: t('点一道菜，看它算出还缺哪些料；做好之后，库存会自动扣掉。'), href: 'kitchen/' },
  { t: t('消费券项目工作台'), k: t('AI 营销工具'), d: t('把政府消费券项目从线索到复盘拆成五站，数字改了即时重算。'), try: t('点「评估这条线索」，再到执行站点「AI 归因与应对」，看它怎么解释核销慢了。'), href: 'workbench.html' },
];
const TOOLS = () => [
  { i: 'radar', t: t('AI Agent 区域商机监测'), d: t('抖音实习时搭建，按周产出区域报告。') },
  { i: 'flask', t: t('AI「蒸馏」账号'), d: t('把人物与领域的经验方法论蒸馏成可复用的 AI skill，在 Claude、ChatGPT、Gemini 间按场景调配。') },
  { i: 'browser', t: t('这个网站'), d: t('我提需求、做取舍、挑照片、讲故事；代码由 Claude 写。') },
];
export const skills = () => chapter('skills', 'SKILL TREE', t('技能树解锁 · AI'), `<ol class="unlock" data-reveal><li><b>2023</b>${t('开始付费使用 ChatGPT')}</li><li><b>2026</b>${t('开始用 AI 写代码、做产品')}</li></ol>
  <div class="plays">${PLAYS().map((x, i) => `<article class="play" data-reveal>
    <p class="play-k"><span class="play-tag">${t('可以体验')}</span>0${i + 1} · ${esc(x.k)}</p>
    <h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>
    <p class="play-try"><b>${t('试试看')}</b>${esc(x.try)}</p>
    <a class="cta" href="${x.href}">${t('▶ 开始体验')}</a>
  </article>`).join('')}</div>
  <h3 class="subh">${t('还在用的 AI 技能')}</h3>
  <div class="tools">${TOOLS().map(x => `<article class="tool" data-reveal>${icon(x.i)}<h3>${esc(x.t)}</h3><p>${esc(x.d)}</p></article>`).join('')}</div>`, { sub: t('新解锁的技能：先用 AI 想，再用 AI 做。下面三个作品都能直接点开玩，演示数据为预置或模拟。') });
// Case cards link to the full file written out below them; with JS the file opens in a drawer instead.
const caseCard = c => {
  const art = c.art && c.art !== 'edit' ? ` data-art="${c.art}" data-seed="${c.seed || 1}"` : '';
  const vis = c.type
    ? `<div class="vis type${c.art ? ` art-${c.art}` : ''}"${art}>${c.label ? `<span class="label">${esc(c.label)}</span>` : ''}<span class="tx">${c.type}</span></div>`
    : `<div class="vis${c.fit ? ' fit' : ''}">${img(c.img, '', { sizes: '(max-width: 720px) 90vw, 380px' })}</div>`;
  return `<a class="case" href="#case-${c.id}" data-id="${c.id}" data-cat="${c.cat}" aria-haspopup="dialog">${vis}
    <span class="bd"><span class="tag">${esc(c.tag)}</span><span class="h">${esc(c.title)}</span><span class="note">${esc(c.note)}</span>
    <span class="num"><b>${esc(c.num[0])}</b><span>${esc(c.num[1])}</span></span></span></a>`;
};
const SHOTS = () => [['3', t('中景，摇镜头。窗外连雨时节，天阴地湿，丛林上空炊烟缓缓升起。'), 'Medium shot, slow pan across a wooden window, rainy season, damp overcast forest, thin kitchen smoke rising above the trees, muted greens'],
  ['5', t('远景，升镜头。水田上一行白鹭掠空而飞。'), 'Wide shot, crane up over flooded rice paddies, a line of white egrets gliding across the frame, soft rain'],
  ['9', t('近景，主观镜头。晨光熹微，木槿花开。'), 'Close-up POV, early dawn light, a hibiscus flower slowly opening, shallow depth of field, gentle mist'],
  ['18', t('特写。毛笔字逐个落下。'), 'Extreme close-up, a calligraphy brush writing Chinese characters stroke by stroke on rice paper, warm candlelight, static camera']];
// The lens: grey outside is what the user sees, colour under the lens is what I see.
const xray = () => `<figure class="xray">
    <div class="lenscol">
      <div class="spec"><span>${t('样本 · 拼多多游戏页弹窗')}</span><span class="modes" role="group" aria-label="${t('查看方式')}"><button type="button" data-lens="lens" aria-pressed="true">${t('透视镜')}</button><button type="button" data-lens="game" aria-pressed="false">${t('找茬')}</button></span></div>
      <div class="stage" tabindex="0" role="img" aria-label="${t('拼多多游戏页弹窗截图。透视镜下有三处批注：关闭键、奖励卡和红色主按钮。用方向键可以移动透视镜。')}">
        ${img('pdd_popup', '', { cls: 'base', sizes: '280px' })}
        <div class="top">${img('pdd_popup', '', { sizes: '280px' })}
          <span class="xpin" style="left:87%;top:12%" data-n="1">1</span><span class="xpin" style="left:50%;top:43%" data-n="2">2</span><span class="xpin" style="left:50%;top:76%" data-n="3">3</span>
        </div>
        <span class="ring" aria-hidden="true"></span>
      </div>
      <figcaption><span class="cap-lens">${t('移动透视镜：镜外是用户看到的，镜下是我看到的')}</span><span class="cap-game">${t('点出你觉得在诱导用户的地方')}<br><b class="score" aria-live="polite">${t('已找到 0 / 3')}</b><button type="button" class="reveal-all" data-reveal-all>${t('看答案')}</button></span></figcaption>
    </div>
    <div class="notecol">
      <h4>${t('镜下批注')}</h4>
      <ol class="xnotes" aria-live="polite"><li data-n="1"><b>1</b><span>${t('关闭键又灰又小，用户更难离开')}</span></li><li data-n="2"><b>2</b><span>${t('「终极道具」让人觉得马上要赢')}</span></li><li data-n="3"><b>3</b><span>${t('红色按钮加 2 秒倒计时，催人立刻点')}</span></li></ol>
    </div>
  </figure>`;
const items = xs => `<ul class="pts">${xs.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`;
// The four layers every case keeps: my role, what I made myself, the project's result, where the numbers come from.
const caseFile = c => `<article class="case-file" id="case-${c.id}" data-case="${c.id}">
    <p class="tag">${esc(c.tag)}</p><h3>${esc(c.title)}</h3><p class="one">${esc(c.one)}</p>
    <dl class="meta">${c.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${c.out ? `<h4>${t('我的直接产出')}</h4>${items(c.out)}` : ''}
    ${c.res ? `<h4>${esc(c.resLabel || t('结果'))}</h4><div class="res">${c.res.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
    ${c.src ? `<p class="src"><b>${t('数据来源')}</b>${esc(c.src)}</p>` : ''}
    <h4>${t('我做了什么、看到了什么')}</h4>${items(c.did)}
    <div class="use"><b>${t('用在营销上')}</b>${esc(c.use)}</div>
    ${c.id === 'pdd' ? xray() : ''}
    ${c.prompts ? `<h4>${t('如果今天用 AI 重做：物种海报提示词')}</h4>${c.prompts.map(([u, p], i) => `<div class="prompt"><span class="u">${esc(u)}</span><button type="button" class="chip" data-copy="pp-${c.id}-${i}">${t('复制')}</button><code id="pp-${c.id}-${i}">${esc(p)}</code></div>`).join('')}` : ''}
    ${c.shots ? `<h4>${t('分镜改写成 AI 视频提示词')}</h4><div class="tablewrap"><table class="shotlist"><thead><tr><th>${t('镜号')}</th><th>${t('我的分镜')}</th><th>${t('视频提示词')}</th></tr></thead><tbody>${SHOTS().map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td class="p">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${c.imgs ? `<div class="imgs">${c.imgs.map(([k, cap]) => `<figure>${img(k, cap, { sizes: '(max-width: 720px) 90vw, 280px' })}<figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>` : ''}
  </article>`;
// The other cases sit in a logbook: one spread per case, cover on the left page, the story on the right.
// Without JS every spread is listed; with it, logbook.js turns the pages and lays a magnifier on them.
const ARROW = d => `<svg viewBox="0 0 22 48" width="22" height="48" fill="none" aria-hidden="true"><polyline points="${d < 0 ? '17,4 5,24 17,44' : '5,4 17,24 5,44'}" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOUPE = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8"/><path d="M13 13l4.4 4.4"/></svg>';
const leaf = (c, i) => {
  const vis = c.type
    ? `<div class="vis type${c.art ? ` art-${c.art}` : ''}"${c.art && c.art !== 'edit' ? ` data-art="${c.art}" data-seed="${c.seed || 1}"` : ''}><span class="tx">${c.type}</span></div>`
    : `<div class="vis${c.fit ? ' fit' : ''}">${img(c.img, '', { sizes: '(max-width: 720px) 90vw, 420px' })}</div>`;
  return `<article class="case-leaf" data-id="${c.id}" data-cat="${c.cat}">
    <div class="pg l"><p class="pg-tag">${esc(c.tag)}</p>${vis}<p class="leaf-one">${esc(c.one)}</p><span class="pg-n">${2 * i + 1}</span></div>
    <div class="pg r"><h3 class="leaf-title">${esc(c.title)}</h3><p class="leaf-note">${esc(c.note)}</p>
      <p class="leaf-role"><b>${esc(c.meta[0][0])}</b>${esc(c.meta[0][1])}</p>
      <ul class="leaf-did">${c.did.slice(0, 3).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <p class="leaf-num"><b>${esc(c.num[0])}</b><span>${esc(c.num[1])}</span></p>
      <a class="leaf-more" href="#case-${c.id}" data-open="${c.id}">${t('看完整案例 →')}</a><span class="pg-n">${2 * i + 2}</span></div>
  </article>`;
};
const logbook = list => `<div class="logbook">
    <div class="book-stage">
      <button type="button" class="book-arrow" data-turn="-1" aria-label="${t('上一页')}">${ARROW(-1)}</button>
      <div class="book-3d" tabindex="0" aria-label="${t('案例日志，左右键翻页')}">
        <div class="book" aria-live="polite"></div>
        <div class="zoomwrap" aria-hidden="true"><div class="zoominner"></div></div>
        <div class="loupe" aria-hidden="true"><span class="grip"></span><span class="ring"><span class="lens"></span></span></div>
      </div>
      <button type="button" class="book-arrow" data-turn="1" aria-label="${t('下一页')}">${ARROW(1)}</button>
    </div>
    <div class="book-tools"><span class="book-count">1 / ${list.length}</span><span class="tool-sep" aria-hidden="true"></span><button type="button" class="book-tool" data-loupe aria-pressed="true" aria-label="${t('放大镜')}">${LOUPE}</button></div>
    <p class="book-hint">${t('拖动书页翻页 · 拖动放大镜看细节')}</p>
    <div class="leaves">${list.map(leaf).join('')}</div>
  </div>`;
const FILTERS = () => [['all', t('全部')], ['insight', t('洞察')], ['campaign', t('战役')], ['content', t('内容')], ['creative', t('创意')]];
export const cases = () => chapter('cases', 'CAPTAIN’S LOG', t('航海日志 · 案例'), `<h3 class="subh">${t('代表项目 · 抖音')}</h3>
  <div class="cases feat">${data().CASES.filter(c => c.feat).map(caseCard).join('')}</div>
  <div class="exhibit paper" data-reveal><div class="exhibit-tx"><p class="kicker">${t('透视镜 · 拼多多拆解')}</p><p>${t('同一张弹窗，用户看到的是奖励，我看到的是三处设计。拖动镜片看看，或者切到「找茬」自己找。')}</p><button type="button" class="chip" data-open="pdd">${t('看完整案例 →')}</button></div>${xray()}</div>
  <h3 class="subh">${t('更多案例')}</h3>
  <div class="filters" role="group" aria-label="${t('按方向筛选')}">${FILTERS().map(([f, t], i) => `<button type="button" aria-pressed="${i === 0}" data-f="${f}">${t}</button>`).join('')}</div>
  ${logbook(data().CASES.filter(c => !c.feat))}
  <section class="dossier" aria-label="${t('案例详情')}"><h3 class="subh">${t('案例详情')}</h3>${data().CASES.map(caseFile).join('')}</section>
  <dialog class="drawer" aria-labelledby="dw-title"><div class="dw"></div></dialog>`, { sub: t('点开卡片看我做了什么。抖音项目只写概数，团队成果都标了我的角色。') });

export const bridge = () => {
  const n = 17, L = levelFor(n, isEn());
  return chapter('bridge', 'SEND WORD', t('传令 · 一件事说给三种人'), `<div class="scen">
    <p class="lead">${t('消费券活动第 28 天，核销比计划慢了')} <output class="wavy" id="gapOut" for="gap">${n} ${t('个百分点')}</output>${t('。客户、技术和达人需要听到的，是三件不同的事。')}</p>
    <div class="dial">
      <label for="gap">${t('拖动试试：核销落后多少')}</label><span class="lvl" id="lvl" data-s="${L.key}">${esc(L.name)}</span>
      <input type="range" id="gap" min="0" max="30" step="1" value="${n}">
      <div class="dticks" aria-hidden="true"><span style="left:0">0</span><span style="left:26.7%">8</span><span style="left:60%">18</span><span style="left:100%">30</span></div>
    </div>
  </div>
  <div class="trio">
    <article class="doc mail"><header class="dh"><span class="fmt">${t('周报邮件')}</span><span class="who">${t('说给客户')}</span><span class="need">${t('要的是心里有数')}</span></header>
      <dl class="mh"><div><dt>${t('收件')}</dt><dd>${t('客户项目组')}</dd></div><div><dt>${t('主题')}</dt><dd id="mailSubj">${esc(L.subj)}</dd></div></dl>
      <p id="mailBody">${esc(L.mail(n))}</p></article>
    <article class="doc ticket"><header class="dh"><span class="fmt">${t('需求单')}</span><span class="who">${t('说给技术团队')}</span><span class="need">${t('要的是能直接开工')}</span></header>
      <dl class="fields" id="techRows">${techRows(L)}</dl></article>
    <article class="doc cue"><header class="dh"><span class="fmt">${t('口播卡')}</span><span class="who">${t('说给达人')}</span><span class="need">${t('要的是一句能说出口的话')}</span></header>
      <p class="say" id="cueSay">${esc(L.say)}</p><ul class="rules" id="cueRules">${cueRules(L)}</ul></article>
  </div>`, { sub: t('示例场景，数据为虚构。同一个问题，写成三份不同的东西。') });
};
export const novice = () => chapter('novice', 'NOVICE VILLAGE', t('新手村 · 南京'), `<ul class="badges">${data().BADGES_NOVICE.map(b => `<li class="badge" data-reveal>${b.photo ? img(b.photo, b.title, { cls: 'b-img', sizes: '(max-width: 720px) 50vw, 240px' }) : '<span class="b-seal" aria-hidden="true">★</span>'}<div><b>${esc(b.title)}</b><p>${esc(b.note)}</p></div></li>`).join('')}</ul>`, { sub: t('从小主持、讲故事。出发前的成就，先收进背包。') });
export const map = () => {
  const years = [...new Set(places().COUNTRIES.map(c => c.year))];
  const list = years.map(y => `<li class="yr" data-year="${y}"><span class="yr-n">${y}</span><span class="yr-c">${places().COUNTRIES.filter(c => c.year === y).map(c => `<button type="button" class="cty" data-country="${c.id}">${esc(c.name)}</button>`).join('')}</span></li>`).join('');
  return chapter('map', 'SEA CHART', t('航海图 · 去过的 26 国'), `<div class="atlas" data-reveal>
    <div class="map-view">
      <div class="map-hud"><span class="pill"><b id="map-count">26</b> ${t('国已解锁')}</span><button type="button" class="chip" data-reset-map hidden>${t('全图')}</button><button type="button" class="chip" data-expand-map hidden>${t('展开地图')}</button></div>
      <div class="map-clip"><div class="map-stage" aria-hidden="true"></div></div>
      <label class="scrub"><span class="scrub-y" id="map-year">2026</span><input type="range" min="2019" max="2026" step="1" value="2026" aria-label="${t('拖动时间轴，看每一年解锁了哪些国家')}"></label>
    </div>
    <ol class="countries" aria-label="${t('去过的国家，按第一次到访的年份')}">${list}</ol>
  </div>
  <div class="card-layer" hidden></div>`, { sub: t('中国加 25 个国家。点国家飞过去，点带照片的图钉打开存档卡，拖底部时间轴看每一年点亮了哪里。') });
};
const shot = (id, plate, alt) => `<figure class="pframe shot" data-reveal>${img(id, alt, { sizes: '(max-width: 720px) 90vw, 360px' })}<figcaption class="plate">${esc(plate)}</figcaption></figure>`;
export const abroad = () => chapter('abroad', 'FIRST VOYAGE', t('第一次出海 · 阿姆斯特丹'), `<div class="voyage">
    <article class="paper story" data-reveal>${icon('phone')}<p class="kicker">${t('2022 年底 · 自媒体')}</p><h3>${t('第一次站在「被投放」的一边')}</h3><p>${t('小红书、视频号、抖音三个平台，选题、拍摄、剪辑都自己来。接过留学服务、AI 阅读工具等商单，保健品寄送类没接。')}</p></article>
    <article class="paper story" data-reveal>${icon('reel')}<p class="kicker">${t('电影宣发 · 荷兰')}</p><h3>${t('把中国电影讲给在荷兰的人听')}</h3><p>${t('帮发行方宣发在荷兰上映的《唐人街探案1900》《哪吒2》《夜王》：写宣发文案、邀约观影、剪辑视频。《哪吒2》的切入点是留学生和父母的关系：')}</p><blockquote>${t('站在父母的肩上看这个世界 / 中式家庭的托举是一代又一代传下的接力棒')}</blockquote>${img('nezha-note', t('在荷兰看《哪吒2》的观影笔记'), { cls: 'note-img', sizes: '200px' })}</article>
    <article class="paper story" data-reveal>${icon('mic')}<p class="kicker">${t('主持 · 出镜')}</p><h3>${t('站到台前')}</h3><p>${t('连续两届担任全荷华人春晚主持人；中英双语主持海南「你好中国 · 阳光海南」欧洲推介会；做阿姆斯特丹大学国际学生大使，策划出镜官方内容、主持英文直播。')}</p></article>
  </div>
  <div class="shots">${shot('spring-gala', t('全荷华人春晚 · 主持'), t('全荷华人春晚主持现场'))}${shot('hainan', t('你好中国·阳光海南 · 推介会'), t('海南推介会致辞'))}${shot('ambassador-talk', t('UvA 国际学生大使'), t('在课堂上做大使宣讲'))}${shot('middelburg', t('米德尔堡 · 2025'), t('国际青年自由大会'))}</div>`, { sub: t('在阿姆斯特丹读完本科。内容、电影、舞台，都是在这里第一次做起来的。') });
// Photography sits in a camera viewfinder: corner marks, a REC dot, a frame counter.
const PHOTOS = () => [['amalfi', t('阿马尔菲 · 2019'), t('在阿马尔菲海边拍照')], ['rain-lake', t('雨天 · 湖边'), t('雨中在湖边拍照')], ['xuanwu', t('玄武湖 · 南京'), t('在玄武湖边拍日落')],
  ['canon', 'Canon 5D', t('手里的佳能 5D')], ['fuji', 'Fujifilm X-T30', t('手里的富士 X-T30')], ['lianyungang', t('连云港 · 2024'), t('在连云港拍照')]];
const vf = ([id, label, alt], i) => `<figure class="vf" data-reveal>${img(id, alt, { sizes: '(max-width: 720px) 90vw, 380px' })}
    <span class="vf-c" aria-hidden="true"></span><span class="vf-n" aria-hidden="true">${String(i + 1).padStart(2, '0')} / ${String(PHOTOS().length).padStart(2, '0')}</span>
    <figcaption>${esc(label)}</figcaption></figure>`;
// The content reel: a strip of film, one frame per post. Picking a frame projects it on the screen above.
const reelFrame = (w, i) => `<li><button type="button" class="frame-btn" data-work="${w.id}" aria-pressed="${i === 0}">
    ${w.photo ? img(w.photo, '', { sizes: '200px' }) : `<span class="frame-tx">${esc(w.platform)}</span>`}
    <span class="frame-cap"><span class="frame-p">${esc(w.platform)}</span><span class="frame-t">${esc(w.title)}</span><b>${esc(w.stat)}</b></span></button></li>`;
const screen = w => `<div class="screen-in">${w.photo ? img(w.photo, w.title, { sizes: '(max-width: 720px) 90vw, 420px' }) : `<span class="screen-tx">${esc(w.platform)}</span>`}
    <div class="screen-cap"><p class="kicker">${esc(w.platform)}</p><h3>${esc(w.title)}</h3><b>${esc(w.stat)}</b></div></div>`;
export const viewfinder = () => chapter('viewfinder', 'SPYGLASS', t('望远镜 · 取景'), `<h3 class="subh">${t('摄影 · 我拍照的样子')}</h3>
  <div class="vfs">${PHOTOS().map(vf).join('')}</div>
  <h3 class="subh">${t('羽毛球与校园大使 · 2025')}</h3>
  <div class="sport">
    <article class="paper archive-card" data-reveal>
      <figure class="pframe">${img('badminton', t('2025 中国学生学者羽毛球赛现场'), { sizes: '(max-width: 720px) 90vw, 420px' })}<figcaption class="plate">${t('导演组 · 北荷兰队')}</figcaption></figure>
      <div><p class="kicker">${t('2025 中国学生学者羽毛球赛 · 荷兰')}</p><h3>${t('场边排赛程，场上打比赛')}</h3><p>${t('组委会导演组：排赛程、做宣传、执裁计分；同时作为北荷兰队队员上场比赛。')}</p></div>
    </article>
    <article class="paper archive-card" data-reveal>
      <figure class="pframe">${img('ambassadors', t('UvA 国际学生大使上岗合照（其他人已模糊处理）'), { sizes: '(max-width: 720px) 90vw, 420px' })}<figcaption class="plate">${t('UvA 国际学生大使')}</figcaption></figure>
      <div><p class="kicker">${t('阿姆斯特丹大学 · 上岗合照')}</p><h3>${t('给想来的人讲这所学校')}</h3><p>${t('国际学生大使：策划出镜官方内容、主持英文直播，也在课堂上给学弟学妹做宣讲。')}</p></div>
    </article>
  </div>
  <h3 class="subh">${t('漂流瓶 · 我发过的内容')}</h3>
  <div class="projector">
    <div class="screen" aria-live="polite">${screen(data().WORKS[0])}</div>
    <div class="reel-wrap">
      <button type="button" class="chip reel-btn" data-reel="-1" aria-label="${t('往前翻')}">←</button>
      <ol class="reel" aria-label="${t('内容作品，横向拖动或用按钮翻')}">${data().WORKS.map(reelFrame).join('')}</ol>
      <button type="button" class="chip reel-btn" data-reel="1" aria-label="${t('往后翻')}">→</button>
    </div>
  </div>`, { sub: t('想认识我的话，从这里开始：我总在拍东西，周末在羽毛球场，偶尔发点内容。') });
export const contact = () => chapter('contact', 'SIGNAL THE SHIP', t('发信号 · 加个好友'), `<div class="contact-row"><dl class="reach paper"><div><dt>${t('微信')}</dt><dd><span id="c-wx">EmengYin</span><button type="button" class="chip" data-copy="c-wx">${t('复制')}</button></dd></div><div><dt>${t('邮箱')}</dt><dd><span id="c-mail">yinyiming2003@qq.com</span><button type="button" class="chip" data-copy="c-mail">${t('复制')}</button></dd></div><div><dt>PDF</dt><dd><span class="pdf">${t('作品集打印版，可转发')}</span><a class="chip" href="${isEn() ? 'Yiming_Yin_Portfolio_EN.pdf' : '%E5%B0%B9%E4%BC%8A%E8%8C%97_%E4%BD%9C%E5%93%81%E9%9B%86_%E8%93%9D%E8%89%B2%E5%85%89%E6%A0%87.pdf'}" download="${t('尹伊茗_作品集_蓝色光标.pdf')}">${t('下载')}</a></dd></div></dl>${treasure()}</div>`, { sub: t('复制微信号或邮箱，说一声你是从这里来的。') });
