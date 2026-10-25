import * as ch from './chapters.mjs';
import { MODES } from '../assets/js/modes.js';
import { RULES } from '../assets/js/achievements.js';

const HEAD = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>尹伊茗 · 地球 Online</title>
<meta name="description" content="尹伊茗的作品集：从让观众鼓掌，到让用户下单。营销策划、导演天赋、AI 新解锁。">
<meta property="og:title" content="尹伊茗 · 地球 Online">
<meta property="og:description" content="从让观众鼓掌，到让用户下单。">
<meta name="theme-color" content="#93b3a6">
<link rel="preload" href="assets/fonts/yellowtail-latin-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/display-serif-900.woff2" as="font" type="font/woff2" crossorigin>
<script>/* start the scroll-unroll before first paint; main.js confirms, or this backs out after 3 s */(function(d){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('js'))d.classList.remove('motion')},3000)})(document.documentElement)</script>
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/print.css" media="print">
</head>`;

const NAV = `<nav class="bar" aria-label="主导航"><div class="bar-in">
  <a class="brand" href="#opening">Yiming</a>
  <div class="seg" role="group" aria-label="访客身份"><button type="button" data-mode="interviewer" aria-pressed="true">面试官</button><button type="button" data-mode="friend" aria-pressed="false">新朋友</button></div>
  <div class="ach-wrap"><button type="button" class="ach" aria-expanded="false" aria-controls="ach-list"><span class="ach-k">成就</span> <b class="ach-n">0/${RULES.length}</b></button>
    <ol class="ach-list" id="ach-list" hidden>${RULES.map(r => `<li data-ach="${r.id}">${r.title}</li>`).join('')}</ol></div>
  <a class="cta" href="#contact">联系我</a>
</div></nav>
<div id="toast" class="toast" role="status" aria-live="polite"></div>`;

// Chapters are written in the interviewer order; visitors who pick "friend" get them reordered in the browser.
export function renderPage() {
  const body = MODES.interviewer.map(id => ch[id]()).join('\n');
  return `${HEAD}
<body>
${NAV}
<div class="chart-edge" aria-hidden="true"></div>
<main id="chapters">
<svg class="route" aria-hidden="true" focusable="false"></svg>
${body}
</main>
<p class="the-end" aria-hidden="true">The End</p>
<footer class="foot">© 2026 尹伊茗 · 作品为本人创作或参与完成，团队项目均注明个人角色；消费券工作台（平江路夜游券）为示例项目，痛点认领为概念 Demo，饭搭子演示版的数据为预置</footer>
<script type="module" src="assets/js/main.js"></script>
</body>
</html>
`;
}
