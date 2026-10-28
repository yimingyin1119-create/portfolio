import * as ch from './chapters.mjs';
import { t, isEn } from './i18n.mjs';
import { MODES, foldedFor } from '../assets/js/modes.js';
import { RULES } from '../assets/js/achievements.js';

const HEAD = () => `<!doctype html>
<html lang="${isEn() ? 'en' : 'zh-CN'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${t('尹伊茗 · 地球 Online')}</title>
<link rel="alternate" hreflang="zh-CN" href="./">
<link rel="alternate" hreflang="en" href="en.html">
<meta name="description" content="${t('尹伊茗的作品集：从让观众鼓掌，到让用户下单。营销策划、导演天赋、AI 新解锁。')}">
<meta property="og:title" content="${t('尹伊茗 · 地球 Online')}">
<meta property="og:description" content="${t('从让观众鼓掌，到让用户下单。')}">
<meta name="theme-color" content="#ceae82">
<link rel="preload" href="assets/fonts/latin-pirata-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/text-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/display-old.woff2" as="font" type="font/woff2" crossorigin>
<script>/* roll the scroll up before first paint so it can unfurl; main.js confirms, or this backs out after 3 s */(function(d){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('js'))d.classList.remove('motion')},3000)})(document.documentElement)</script>
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/print.css" media="print">
</head>`;

// The explorer's guide: every interaction on the page, how to do it, and a link to where it lives.
const GUIDE = [
  ['opening', '选身份', '点「我是面试官」或「我是新朋友」，章节会按你的身份重新排列。'],
  ['opening', '看属性', '点首屏四个属性卡上的「?」，看每一项背后的证据。'],
  ['skills', '试玩 AI 作品', '三张「可以体验」卡片都能直接打开玩，卡片里写了第一步做什么。'],
  ['quests', '翻任务卡', '点主线任务卡底部的「翻面看结果」，看每段实习的整体结果。'],
  ['lens', '透视镜', '拖动镜片看弹窗里藏的设计；切到「找茬」自己把它们点出来。'],
  ['logbook', '翻航海日志', '拖动书页、点左右箭头或用方向键翻页；上面的筛选可以只看某一类案例。'],
  ['logbook', '放大镜', '在电脑上拖动书上的放大镜，看截图里的小字。'],
  ['cases', '打开案例详情', '点任意案例卡或「看完整案例 →」，在侧边抽屉里读完整内容，左右键翻页。'],
  ['bridge', '传令滑块', '拖动滑块，看同一件事写给客户、技术和达人的三份文案怎么跟着变。'],
  ['map', '航海图', '点国家飞过去，点带照片的图钉打开存档卡，拖底部时间轴看每年点亮了哪里。'],
  ['bottles', '漂流瓶', '左右拖动绳子上的卡片，点一张把它放到上面的屏幕。'],
  ['contact', '加个好友', '一键复制微信号或邮箱。'],
  [null, '背景音乐', '点导航栏的音柱按钮，或旗子旁的「♪」，播放一首航海歌。'],
  [null, '中英切换', '点导航栏的「EN / 中文」，换语言后停在同一章节。'],
  [null, '成就', '做上面这些事会解锁成就，导航栏的「成就」里能看到进度。'],
];
const guide = () => `<dialog class="guide" aria-labelledby="guide-title">
  <div class="g-in">
    <header class="g-head"><p class="kicker">EXPLORER'S GUIDE</p><h2 id="guide-title">${t('探索指南')}</h2><p class="g-sub">${t('这张地图上能玩的东西都在这里。点「去看看」直接过去。')}</p><button type="button" class="chip g-x" data-close>${t('关闭')}</button></header>
    <ol class="g-list">${GUIDE.map(([to, name, how], i) => `<li class="g-item"><span class="g-n">${String(i + 1).padStart(2, '0')}</span><div><b>${t(name)}</b><p>${t(how)}</p></div>${to ? `<a class="g-go" href="#${to}">${t('去看看 →')}</a>` : ''}</li>`).join('')}</ol>
  </div>
</dialog>`;

const NAV = () => `<nav class="bar" aria-label="${t('主导航')}"><div class="bar-in">
  <a class="brand" href="#opening">Yiming</a>
  <div class="seg" role="group" aria-label="${t('访客身份')}"><button type="button" data-mode="interviewer" aria-pressed="true">${t('面试官')}</button><button type="button" data-mode="friend" aria-pressed="false">${t('新朋友')}</button></div>
  <button type="button" class="music" aria-pressed="false" aria-label="${t('播放背景音乐')}" data-src="assets/audio/shanty.m4a"><svg viewBox="0 0 20 16" aria-hidden="true"><rect class="b1" x="2" y="5" width="3" height="10" rx="1"/><rect class="b2" x="8.5" y="1" width="3" height="14" rx="1"/><rect class="b3" x="15" y="7" width="3" height="8" rx="1"/></svg></button>
  <div class="ach-wrap"><button type="button" class="ach" aria-expanded="false" aria-controls="ach-list"><span class="ach-k">${t('成就')}</span> <b class="ach-n">0/${RULES.length}</b></button>
    <ol class="ach-list" id="ach-list" hidden>${RULES.map(r => `<li data-ach="${r.id}">${isEn() ? r.en : r.title}</li>`).join('')}</ol></div>
  ${isEn() ? '<a class="lang" href="index.html" hreflang="zh-CN" lang="zh-CN">中文</a>' : '<a class="lang" href="en.html" hreflang="en" lang="en">EN</a>'}
  <button type="button" class="guide-btn" aria-haspopup="dialog" aria-label="${t('探索指南')}"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M13.5 6.5l-2.2 4.8-4.8 2.2 2.2-4.8z"/></svg><span>${t('指南')}</span></button>
  <a class="cta" href="#contact">${t('联系我')}</a>
</div></nav>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
${guide()}`;

const FOLD_NAMES = { novice: '新手村', map: '航海图', abroad: '第一次出海', viewfinder: '望远镜' };
const moreAbout = ids => `<aside class="more-about" aria-label="${t('更多关于我')}">
  <button type="button" class="more-btn" aria-expanded="false" aria-controls="${ids.join(' ')}">
    <span class="kicker">MORE ABOUT ME</span>
    <span class="more-t"><b class="when-shut">${t('更多关于我 →')}</b><b class="when-open">${t('收起 ↑')}</b></span>
    <span class="more-list">${ids.map(id => t(FOLD_NAMES[id])).join(' · ')}</span>
    <span class="more-sub">${t('成长、旅行、摄影和羽毛球：想多认识我一点的话，从这里展开。')}</span>
  </button>
</aside>`;

// Chapters are written in the interviewer order; visitors who pick "friend" get them reordered in the browser.
export function renderPage() {
  // the 「更多关于我」 entry sits in front of the chapters interviewer mode folds away (moved by modes.js on mode change)
  const folded = foldedFor('interviewer');
  const body = MODES.interviewer.map(id => (id === folded[0] ? moreAbout(folded) + '\n' : '') + ch[id]()).join('\n');
  return `${HEAD()}
<body>
${NAV()}
<div class="chart-edge" aria-hidden="true"></div>
<main id="chapters">
<svg class="route" aria-hidden="true" focusable="false"></svg>
${body}
</main>
<p class="the-end" aria-hidden="true">Bon Voyage</p>
<footer class="foot">${t('© 2026 尹伊茗 · 作品为本人创作或参与完成，团队项目均注明个人角色；消费券工作台（平江路夜游券）为示例项目，痛点认领为概念 Demo，饭搭子演示版的数据为预置')}</footer>
<script type="module" src="assets/js/main.js"></script>
</body>
</html>
`;
}
