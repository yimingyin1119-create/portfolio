// Static HTML for every chapter, rendered at build time from data/. Interactions are layered on by assets/js.
import { chapter, esc, img } from './html.mjs';
import { icon, stamp, treasure } from './art.mjs';
import { PROFILE, QUESTS, POSTERS, BADGES_NOVICE, CASES, WORKS } from '../data/content.js';
import { levelFor, techRows, cueRules } from '../assets/js/bridge.js';
import { COUNTRIES } from '../data/places.js';

export const opening = () => `<section class="chapter opening" id="opening" data-chapter="opening" aria-labelledby="h-opening">
  <div class="frame boot">
    <canvas class="flag" data-title="EARTH ONLINE" data-sub="· VOYAGE 2027 ·" width="300" height="190" aria-hidden="true"></canvas>
    <ul class="hud" aria-label="玩家数值"><li>Class of <b>2027</b></li><li><b>26</b> 国</li><li><b>4</b> 段实习</li></ul>
    <div class="player">
      <figure class="pframe tilt">${img('portrait', '尹伊茗', { eager: true, sizes: '(max-width: 720px) 60vw, 300px' })}<figcaption class="plate">PLAYER · 尹伊茗</figcaption></figure>
      <div class="player-tx">
        <p class="online">玩家已上线<span class="caret" aria-hidden="true"></span></p>
        <h1 id="h-opening">从让观众鼓掌，<br>到让用户下单。</h1>
        <p class="lede">从导演一部校园微电影，到一个省的暑期消费季</p>
        <ul class="edu" aria-label="教育背景"><li><b>新加坡国立大学</b><span>传播学（数据方向）硕士 · 2026–2027 在读</span></li><li><b>阿姆斯特丹大学</b><span>媒体与信息本科 · 2023–2026</span></li></ul>
        <ul class="attrs">${PROFILE.map(p => `<li class="attr"><button type="button" class="attr-btn" aria-expanded="false" aria-controls="proof-${p.key}"><span class="attr-k">${esc(p.label)}</span><span class="attr-v">${esc(p.value)}</span><span class="attr-i" aria-hidden="true">?</span></button><p class="proof" id="proof-${p.key}">${esc(p.proof)}</p></li>`).join('')}</ul>
        <div class="pick" role="group" aria-label="你是谁"><button type="button" class="cta" data-pick="interviewer">我是面试官 <span aria-hidden="true">→</span></button><button type="button" class="ghost" data-pick="friend">我是新朋友 <span aria-hidden="true">→</span></button></div>
        <a class="play-link" href="#skills">▶ 先玩一下我做的 3 个 AI 作品</a>
      </div>
    </div>
    <span class="slash" aria-hidden="true">//</span>
  </div>
</section>`;
const list = items => `<ul class="ticks">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

export const quests = () => chapter('quests', 'MAIN QUEST', '主线任务 · 平台', `<div class="quests">${QUESTS.map(q => `<article class="quest" data-quest="${q.id}" data-reveal>
    <div class="quest-in">
      <div class="side front">
        <header class="q-head"><h3>${esc(q.company)}${stamp()}</h3><p class="q-meta">${esc(q.period)} · ${esc(q.place)}<br>${esc(q.role)}</p></header>
        ${q.photo ? `<figure class="pframe q-photo">${img(q.photo, `${q.company}实习`, { sizes: '(max-width: 720px) 40vw, 180px' })}</figure>` : ''}
        <p class="side-k">我做了什么</p>${list(q.did)}
      </div>
      <div class="side back">
        <p class="side-k">项目整体结果</p>${list(q.result)}
        ${q.source ? `<p class="src">数据来源：${esc(q.source)}</p>` : ''}
        ${q.caseId ? `<button type="button" class="chip" data-open="${q.caseId}">看完整案例 →</button>` : ''}
      </div>
    </div>
    <button type="button" class="flip" aria-pressed="false"><span>翻面看结果</span> <span aria-hidden="true">↻</span></button>
  </article>`).join('')}</div>`, { sub: '四段实习，倒着看。卡片正面是我做了什么，翻过来是项目整体的结果。' });
const LAMP = '<svg class="lamp" viewBox="0 0 80 60" aria-hidden="true"><path d="M40 4v4M40 8L18 46M40 8l22 38" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="40" cy="6" r="3.5" fill="currentColor"/></svg>';

export const posters = () => chapter('posters', 'TREASURE HAUL', '战利品 · 成绩', `<div class="posters">${POSTERS.map(p => `<figure class="poster" data-poster="${p.id}" data-count="${p.count}" data-reveal>${LAMP}<span class="beam" aria-hidden="true"></span><div class="sheet"><b class="big">${esc(p.value)}</b><figcaption>${esc(p.label)}</figcaption></div></figure>`).join('')}</div>`, { sub: '抖音项目的数字是概数；其他是原始数字。' });
// The three works a visitor can open and play with get the spotlight; the rest are listed below them.
const PLAYS = [
  { t: '痛点认领', k: 'AI 产品 Demo', d: 'AI 搜索的回答里，品牌买不到答案，只能认领用户的真实痛点。', try: '在 AI 搜索里点「散场打不到车」，再点「为什么看到」，看品牌凭什么出现。', href: 'painpoint.html' },
  { t: '饭搭子', k: 'n8n 点餐小程序 · 演示版', d: '提要求 → 算缺料 → 推送 → 接单做好 → 扣库存，后端全是 n8n 工作流。', try: '点一道菜，看它算出还缺哪些料；做好之后，库存会自动扣掉。', href: 'kitchen/' },
  { t: '消费券项目工作台', k: 'AI 营销工具', d: '把政府消费券项目从线索到复盘拆成五站，数字改了即时重算。', try: '点「评估这条线索」，再到执行站点「AI 归因与应对」，看它怎么解释核销慢了。', href: 'workbench.html' },
];
const TOOLS = [
  { i: 'radar', t: 'AI Agent 区域商机监测', d: '抖音实习时搭建，按周产出区域报告。' },
  { i: 'flask', t: 'AI「蒸馏」账号', d: '把人物与领域的经验方法论蒸馏成可复用的 AI skill，在 Claude、ChatGPT、Gemini 间按场景调配。' },
  { i: 'browser', t: '这个网站', d: '我提需求、做取舍、挑照片、讲故事；代码由 Claude 写。' },
];
export const skills = () => chapter('skills', 'SKILL TREE', '技能树解锁 · AI', `<ol class="unlock" data-reveal><li><b>2023</b>开始付费使用 ChatGPT</li><li><b>2026</b>开始用 AI 写代码、做产品</li></ol>
  <div class="plays">${PLAYS.map((x, i) => `<article class="play" data-reveal>
    <p class="play-k"><span class="play-tag">可以体验</span>0${i + 1} · ${esc(x.k)}</p>
    <h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>
    <p class="play-try"><b>试试看</b>${esc(x.try)}</p>
    <a class="cta" href="${x.href}">▶ 开始体验</a>
  </article>`).join('')}</div>
  <h3 class="subh">还在用的 AI 技能</h3>
  <div class="tools">${TOOLS.map(x => `<article class="tool" data-reveal>${icon(x.i)}<h3>${esc(x.t)}</h3><p>${esc(x.d)}</p></article>`).join('')}</div>`, { sub: '新解锁的技能：先用 AI 想，再用 AI 做。下面三个作品都能直接点开玩，演示数据为预置或模拟。' });
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
const SHOTS = [['3', '中景，摇镜头。窗外连雨时节，天阴地湿，丛林上空炊烟缓缓升起。', 'Medium shot, slow pan across a wooden window, rainy season, damp overcast forest, thin kitchen smoke rising above the trees, muted greens'],
  ['5', '远景，升镜头。水田上一行白鹭掠空而飞。', 'Wide shot, crane up over flooded rice paddies, a line of white egrets gliding across the frame, soft rain'],
  ['9', '近景，主观镜头。晨光熹微，木槿花开。', 'Close-up POV, early dawn light, a hibiscus flower slowly opening, shallow depth of field, gentle mist'],
  ['18', '特写。毛笔字逐个落下。', 'Extreme close-up, a calligraphy brush writing Chinese characters stroke by stroke on rice paper, warm candlelight, static camera']];
// The lens: grey outside is what the user sees, colour under the lens is what I see.
const xray = () => `<figure class="xray">
    <div class="lenscol">
      <div class="spec"><span>样本 · 拼多多游戏页弹窗</span><span class="modes" role="group" aria-label="查看方式"><button type="button" data-lens="lens" aria-pressed="true">透视镜</button><button type="button" data-lens="game" aria-pressed="false">找茬</button></span></div>
      <div class="stage" tabindex="0" role="img" aria-label="拼多多游戏页弹窗截图。透视镜下有三处批注：关闭键、奖励卡和红色主按钮。用方向键可以移动透视镜。">
        ${img('pdd_popup', '', { cls: 'base', sizes: '280px' })}
        <div class="top">${img('pdd_popup', '', { sizes: '280px' })}
          <span class="xpin" style="left:87%;top:12%" data-n="1">1</span><span class="xpin" style="left:50%;top:43%" data-n="2">2</span><span class="xpin" style="left:50%;top:76%" data-n="3">3</span>
        </div>
        <span class="ring" aria-hidden="true"></span>
      </div>
      <figcaption><span class="cap-lens">移动透视镜：镜外是用户看到的，镜下是我看到的</span><span class="cap-game">点出你觉得在诱导用户的地方<br><b class="score" aria-live="polite">已找到 0 / 3</b><button type="button" class="reveal-all" data-reveal-all>看答案</button></span></figcaption>
    </div>
    <div class="notecol">
      <h4>镜下批注</h4>
      <ol class="xnotes" aria-live="polite"><li data-n="1"><b>1</b><span>关闭键又灰又小，用户更难离开</span></li><li data-n="2"><b>2</b><span>「终极道具」让人觉得马上要赢</span></li><li data-n="3"><b>3</b><span>红色按钮加 2 秒倒计时，催人立刻点</span></li></ol>
    </div>
  </figure>`;
const items = xs => `<ul class="pts">${xs.map(d => `<li>${esc(d)}</li>`).join('')}</ul>`;
// The four layers every case keeps: my role, what I made myself, the project's result, where the numbers come from.
const caseFile = c => `<article class="case-file" id="case-${c.id}" data-case="${c.id}">
    <p class="tag">${esc(c.tag)}</p><h3>${esc(c.title)}</h3><p class="one">${esc(c.one)}</p>
    <dl class="meta">${c.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${c.out ? `<h4>我的直接产出</h4>${items(c.out)}` : ''}
    ${c.res ? `<h4>${esc(c.resLabel || '结果')}</h4><div class="res">${c.res.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
    ${c.src ? `<p class="src"><b>数据来源</b>${esc(c.src)}</p>` : ''}
    <h4>我做了什么、看到了什么</h4>${items(c.did)}
    <div class="use"><b>用在营销上</b>${esc(c.use)}</div>
    ${c.id === 'pdd' ? xray() : ''}
    ${c.prompts ? `<h4>如果今天用 AI 重做：物种海报提示词</h4>${c.prompts.map(([u, p], i) => `<div class="prompt"><span class="u">${esc(u)}</span><button type="button" class="chip" data-copy="pp-${c.id}-${i}">复制</button><code id="pp-${c.id}-${i}">${esc(p)}</code></div>`).join('')}` : ''}
    ${c.shots ? `<h4>分镜改写成 AI 视频提示词</h4><div class="tablewrap"><table class="shotlist"><thead><tr><th>镜号</th><th>我的分镜</th><th>视频提示词</th></tr></thead><tbody>${SHOTS.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td class="p">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${c.imgs ? `<div class="imgs">${c.imgs.map(([k, cap]) => `<figure>${img(k, cap, { sizes: '(max-width: 720px) 90vw, 280px' })}<figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>` : ''}
  </article>`;
const FILTERS = [['all', '全部'], ['insight', '洞察'], ['campaign', '战役'], ['content', '内容'], ['creative', '创意']];
export const cases = () => chapter('cases', 'CAPTAIN’S LOG', '航海日志 · 案例', `<h3 class="subh">代表项目 · 抖音</h3>
  <div class="cases feat">${CASES.filter(c => c.feat).map(caseCard).join('')}</div>
  <div class="exhibit paper" data-reveal><div class="exhibit-tx"><p class="kicker">透视镜 · 拼多多拆解</p><p>同一张弹窗，用户看到的是奖励，我看到的是三处设计。拖动镜片看看，或者切到「找茬」自己找。</p><button type="button" class="chip" data-open="pdd">看完整案例 →</button></div>${xray()}</div>
  <h3 class="subh">更多案例</h3>
  <div class="filters" role="group" aria-label="按方向筛选">${FILTERS.map(([f, t], i) => `<button type="button" aria-pressed="${i === 0}" data-f="${f}">${t}</button>`).join('')}</div>
  <div class="cases grid">${CASES.filter(c => !c.feat).map(caseCard).join('')}</div>
  <section class="dossier" aria-label="案例详情"><h3 class="subh">案例详情</h3>${CASES.map(caseFile).join('')}</section>
  <dialog class="drawer" aria-labelledby="dw-title"><div class="dw"></div></dialog>`, { sub: '点开卡片看我做了什么。抖音项目只写概数，团队成果都标了我的角色。' });

export const bridge = () => {
  const n = 17, L = levelFor(n);
  return chapter('bridge', 'SKILL', '一件事，说给三种人听', `<div class="scen">
    <p class="lead">消费券活动第 28 天，核销比计划慢了 <output class="wavy" id="gapOut" for="gap">${n} 个百分点</output>。客户、技术和达人需要听到的，是三件不同的事。</p>
    <div class="dial">
      <label for="gap">拖动试试：核销落后多少</label><span class="lvl" id="lvl" data-s="${L.key}">${esc(L.name)}</span>
      <input type="range" id="gap" min="0" max="30" step="1" value="${n}">
      <div class="dticks" aria-hidden="true"><span style="left:0">0</span><span style="left:26.7%">8</span><span style="left:60%">18</span><span style="left:100%">30</span></div>
    </div>
  </div>
  <div class="trio">
    <article class="doc mail"><header class="dh"><span class="fmt">周报邮件</span><span class="who">说给客户</span><span class="need">要的是心里有数</span></header>
      <dl class="mh"><div><dt>收件</dt><dd>客户项目组</dd></div><div><dt>主题</dt><dd id="mailSubj">${esc(L.subj)}</dd></div></dl>
      <p id="mailBody">${esc(L.mail(n))}</p></article>
    <article class="doc ticket"><header class="dh"><span class="fmt">需求单</span><span class="who">说给技术团队</span><span class="need">要的是能直接开工</span></header>
      <dl class="fields" id="techRows">${techRows(L)}</dl></article>
    <article class="doc cue"><header class="dh"><span class="fmt">口播卡</span><span class="who">说给达人</span><span class="need">要的是一句能说出口的话</span></header>
      <p class="say" id="cueSay">${esc(L.say)}</p><ul class="rules" id="cueRules">${cueRules(L)}</ul></article>
  </div>`, { sub: '示例场景，数据为虚构。同一个问题，写成三份不同的东西。' });
};
export const novice = () => chapter('novice', 'NOVICE VILLAGE', '新手村 · 南京', `<ul class="badges">${BADGES_NOVICE.map(b => `<li class="badge" data-reveal>${b.photo ? img(b.photo, b.title, { cls: 'b-img', sizes: '(max-width: 720px) 50vw, 240px' }) : '<span class="b-seal" aria-hidden="true">★</span>'}<div><b>${esc(b.title)}</b><p>${esc(b.note)}</p></div></li>`).join('')}</ul>`, { sub: '从小主持、讲故事。出发前的成就，先收进背包。' });
export const map = () => {
  const years = [...new Set(COUNTRIES.map(c => c.year))];
  const list = years.map(y => `<li class="yr" data-year="${y}"><span class="yr-n">${y}</span><span class="yr-c">${COUNTRIES.filter(c => c.year === y).map(c => `<button type="button" class="cty" data-country="${c.id}">${esc(c.name)}</button>`).join('')}</span></li>`).join('');
  return chapter('map', 'WORLD MAP', '地球 Online · 足迹', `<div class="atlas" data-reveal>
    <div class="map-view">
      <div class="map-hud"><span class="pill"><b id="map-count">26</b> 国已解锁</span><button type="button" class="chip" data-reset-map hidden>全图</button><button type="button" class="chip" data-expand-map hidden>展开地图</button></div>
      <div class="map-clip"><div class="map-stage" aria-hidden="true"></div></div>
      <label class="scrub"><span class="scrub-y" id="map-year">2026</span><input type="range" min="2019" max="2026" step="1" value="2026" aria-label="拖动时间轴，看每一年解锁了哪些国家"></label>
    </div>
    <ol class="countries" aria-label="去过的国家，按第一次到访的年份">${list}</ol>
  </div>
  <div class="card-layer" hidden></div>`, { sub: '中国加 25 个国家。点国家飞过去，点带照片的图钉打开存档卡，拖底部时间轴看每一年点亮了哪里。' });
};
const shot = (id, plate, alt) => `<figure class="pframe shot" data-reveal>${img(id, alt, { sizes: '(max-width: 720px) 90vw, 360px' })}<figcaption class="plate">${esc(plate)}</figcaption></figure>`;
export const abroad = () => chapter('abroad', 'FIRST VOYAGE', '第一次出海 · 阿姆斯特丹', `<div class="voyage">
    <article class="paper story" data-reveal>${icon('phone')}<p class="kicker">2022 年底 · 自媒体</p><h3>第一次站在「被投放」的一边</h3><p>小红书、视频号、抖音三个平台，选题、拍摄、剪辑都自己来。接过留学服务、AI 阅读工具等商单，保健品寄送类没接。</p></article>
    <article class="paper story" data-reveal>${icon('reel')}<p class="kicker">电影宣发 · 荷兰</p><h3>把中国电影讲给在荷兰的人听</h3><p>帮发行方宣发在荷兰上映的《唐人街探案1900》《哪吒2》《夜王》：写宣发文案、邀约观影、剪辑视频。《哪吒2》的切入点是留学生和父母的关系：</p><blockquote>站在父母的肩上看这个世界 / 中式家庭的托举是一代又一代传下的接力棒</blockquote>${img('nezha-note', '在荷兰看《哪吒2》的观影笔记', { cls: 'note-img', sizes: '200px' })}</article>
    <article class="paper story" data-reveal>${icon('mic')}<p class="kicker">主持 · 出镜</p><h3>站到台前</h3><p>连续两届担任全荷华人春晚主持人；中英双语主持海南「你好中国 · 阳光海南」欧洲推介会；做阿姆斯特丹大学国际学生大使，策划出镜官方内容、主持英文直播。</p></article>
  </div>
  <div class="shots">${shot('spring-gala', '全荷华人春晚 · 主持', '全荷华人春晚主持现场')}${shot('hainan', '你好中国·阳光海南 · 推介会', '海南推介会致辞')}${shot('ambassador-talk', 'UvA 国际学生大使', '在课堂上做大使宣讲')}${shot('middelburg', '米德尔堡 · 2025', '国际青年自由大会')}</div>`, { sub: '在阿姆斯特丹读完本科。内容、电影、舞台，都是在这里第一次做起来的。' });
// Photography sits in a camera viewfinder: corner marks, a REC dot, a frame counter.
const PHOTOS = [['amalfi', '阿马尔菲 · 2019', '在阿马尔菲海边拍照'], ['rain-lake', '雨天 · 湖边', '雨中在湖边拍照'], ['xuanwu', '玄武湖 · 南京', '在玄武湖边拍日落'],
  ['canon', 'Canon 5D', '手里的佳能 5D'], ['fuji', 'Fujifilm X-T30', '手里的富士 X-T30'], ['lianyungang', '连云港 · 2024', '在连云港拍照']];
const vf = ([id, label, alt], i) => `<figure class="vf" data-reveal>${img(id, alt, { sizes: '(max-width: 720px) 90vw, 380px' })}
    <span class="vf-c" aria-hidden="true"></span><span class="vf-n" aria-hidden="true">${String(i + 1).padStart(2, '0')} / ${String(PHOTOS.length).padStart(2, '0')}</span>
    <figcaption>${esc(label)}</figcaption></figure>`;
// The content reel: a strip of film, one frame per post. Picking a frame projects it on the screen above.
const reelFrame = (w, i) => `<li><button type="button" class="frame-btn" data-work="${w.id}" aria-pressed="${i === 0}">
    ${w.photo ? img(w.photo, '', { sizes: '200px' }) : `<span class="frame-tx">${esc(w.platform)}</span>`}
    <span class="frame-cap"><span class="frame-p">${esc(w.platform)}</span><span class="frame-t">${esc(w.title)}</span><b>${esc(w.stat)}</b></span></button></li>`;
const screen = w => `<div class="screen-in">${w.photo ? img(w.photo, w.title, { sizes: '(max-width: 720px) 90vw, 420px' }) : `<span class="screen-tx">${esc(w.platform)}</span>`}
    <div class="screen-cap"><p class="kicker">${esc(w.platform)}</p><h3>${esc(w.title)}</h3><b>${esc(w.stat)}</b></div></div>`;
export const viewfinder = () => chapter('viewfinder', 'SPYGLASS', '望远镜 · 取景', `<h3 class="subh">摄影 · 我拍照的样子</h3>
  <div class="vfs">${PHOTOS.map(vf).join('')}</div>
  <h3 class="subh">羽毛球与校园大使 · 2025</h3>
  <div class="sport">
    <article class="paper archive-card" data-reveal>
      <figure class="pframe">${img('badminton', '2025 中国学生学者羽毛球赛现场', { sizes: '(max-width: 720px) 90vw, 420px' })}<figcaption class="plate">导演组 · 北荷兰队</figcaption></figure>
      <div><p class="kicker">2025 中国学生学者羽毛球赛 · 荷兰</p><h3>场边排赛程，场上打比赛</h3><p>组委会导演组：排赛程、做宣传、执裁计分；同时作为北荷兰队队员上场比赛。</p></div>
    </article>
    <article class="paper archive-card" data-reveal>
      <figure class="pframe">${img('ambassadors', 'UvA 国际学生大使上岗合照（其他人已模糊处理）', { sizes: '(max-width: 720px) 90vw, 420px' })}<figcaption class="plate">UvA 国际学生大使</figcaption></figure>
      <div><p class="kicker">阿姆斯特丹大学 · 上岗合照</p><h3>给想来的人讲这所学校</h3><p>国际学生大使：策划出镜官方内容、主持英文直播，也在课堂上给学弟学妹做宣讲。</p></div>
    </article>
  </div>
  <h3 class="subh">漂流瓶 · 我发过的内容</h3>
  <div class="projector">
    <div class="screen" aria-live="polite">${screen(WORKS[0])}</div>
    <div class="reel-wrap">
      <button type="button" class="chip reel-btn" data-reel="-1" aria-label="往前翻">←</button>
      <ol class="reel" aria-label="内容作品，横向拖动或用按钮翻">${WORKS.map(reelFrame).join('')}</ol>
      <button type="button" class="chip reel-btn" data-reel="1" aria-label="往后翻">→</button>
    </div>
  </div>`, { sub: '想认识我的话，从这里开始：我总在拍东西，周末在羽毛球场，偶尔发点内容。' });
export const contact = () => chapter('contact', 'SIGNAL THE SHIP', '加个好友', `<div class="contact-row"><dl class="reach paper"><div><dt>微信</dt><dd><span id="c-wx">EmengYin</span><button type="button" class="chip" data-copy="c-wx">复制</button></dd></div><div><dt>邮箱</dt><dd><span id="c-mail">2091595480@qq.com</span><button type="button" class="chip" data-copy="c-mail">复制</button></dd></div><div><dt>PDF</dt><dd><span class="pdf">作品集打印版，可转发</span><a class="chip" href="%E5%B0%B9%E4%BC%8A%E8%8C%97_%E4%BD%9C%E5%93%81%E9%9B%86_%E8%93%9D%E8%89%B2%E5%85%89%E6%A0%87.pdf" download="尹伊茗_作品集_蓝色光标.pdf">下载</a></dd></div></dl>${treasure()}</div>`, { sub: '复制微信号或邮箱，说一声你是从这里来的。' });
