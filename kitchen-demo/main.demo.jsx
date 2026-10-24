import { DEMO_USERS, resetDemo } from './api.demo.js';
import '../main.jsx';

// A strip above the app saying what this copy is, with the demo accounts and a reset.
const strip = document.createElement('div');
strip.className = 'demo-strip';
strip.innerHTML = `<span><b>演示版</b> · 数据只存在这台设备 · 账号 ${DEMO_USERS.map((u) => u.name).join(' / ')}，口令都是 ${DEMO_USERS[0].pin}</span>
  <span class="demo-acts"><button type="button">重置</button><a href="../index.html#kitchen" target="_top">作品集</a></span>`;
strip.querySelector('button').addEventListener('click', resetDemo);
document.body.prepend(strip);

const css = document.createElement('style');
css.textContent = `.demo-strip{max-width:480px;margin:0 auto;display:flex;gap:8px;align-items:center;justify-content:space-between;
  padding:6px 12px;font-size:11px;line-height:1.5;background:var(--wood-dark);color:var(--milk)}
.demo-strip b{color:var(--gold);font-weight:normal}
.demo-acts{display:flex;gap:10px;flex:none}
.demo-strip button,.demo-strip a{font:inherit;color:var(--gold);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}`;
document.head.append(css);
