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

const NAV = () => `<nav class="bar" aria-label="${t('主导航')}"><div class="bar-in">
  <a class="brand" href="#opening">Yiming</a>
  <div class="seg" role="group" aria-label="${t('访客身份')}"><button type="button" data-mode="interviewer" aria-pressed="true">${t('面试官')}</button><button type="button" data-mode="friend" aria-pressed="false">${t('新朋友')}</button></div>
  <div class="ach-wrap"><button type="button" class="ach" aria-expanded="false" aria-controls="ach-list"><span class="ach-k">${t('成就')}</span> <b class="ach-n">0/${RULES.length}</b></button>
    <ol class="ach-list" id="ach-list" hidden>${RULES.map(r => `<li data-ach="${r.id}">${isEn() ? r.en : r.title}</li>`).join('')}</ol></div>
  ${isEn() ? '<a class="lang" href="index.html" hreflang="zh-CN" lang="zh-CN">中文</a>' : '<a class="lang" href="en.html" hreflang="en" lang="en">EN</a>'}
  <a class="cta" href="#contact">${t('联系我')}</a>
</div></nav>
<div id="toast" class="toast" role="status" aria-live="polite"></div>`;

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
