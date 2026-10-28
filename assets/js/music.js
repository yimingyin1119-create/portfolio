// Background music, strictly opt-in: nothing loads or plays until a visitor presses the nav button or the hint by
// the flag. It eases in quietly, loops, pauses while the tab is hidden, and remembers the choice for the next visit
// (browsers still need one tap before sound, so a returning listener hears it from their first click).
import { L } from './i18n.js';
import { store } from './storage.js';

const KEY = 'eo.music';
const LEVEL = .35, FADE_IN = 1500, FADE_OUT = 600;

// Volume at time t (ms) of a fade from `from` to `to` lasting `dur`, eased so it never jumps at either end.
export function fadeLevel(t, from, to, dur) {
  const k = Math.min(1, Math.max(0, t / dur));
  const e = k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
  return k >= 1 ? to : from + (to - from) * e;
}

export function initMusic() {
  const btn = document.querySelector('.bar .music');
  if (!btn) return;
  const hint = document.querySelector('.music-hint');
  let audio = null, playing = false, fadeRaf = 0;

  const label = on => {
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? L('关闭背景音乐', 'Turn the music off') : L('播放背景音乐', 'Play music'));
    btn.classList.toggle('on', on);
    hint?.classList.toggle('on', on);
  };
  function fadeTo(to, dur, done) {
    cancelAnimationFrame(fadeRaf);
    const from = audio.volume, t0 = performance.now();
    const tick = now => {
      audio.volume = fadeLevel(now - t0, from, to, dur);
      if (now - t0 < dur) fadeRaf = requestAnimationFrame(tick); else done?.();
    };
    fadeRaf = requestAnimationFrame(tick);
  }
  function play() {
    if (!audio) {
      audio = new Audio(btn.dataset.src);
      audio.loop = true; audio.preload = 'auto';
    }
    audio.volume = 0;
    audio.play().then(() => { playing = true; label(true); fadeTo(LEVEL, FADE_IN); }).catch(() => label(false));
  }
  function stop() {
    playing = false; label(false);
    if (audio) fadeTo(0, FADE_OUT, () => { if (!playing) audio.pause(); });
  }
  const toggle = () => {
    const on = !playing;
    try { store.set(KEY, on ? 'on' : 'off'); } catch {}
    on ? play() : stop();
  };

  btn.addEventListener('click', toggle);
  hint?.addEventListener('click', toggle);

  // tab hidden → quiet; back → carry on
  document.addEventListener('visibilitychange', () => {
    if (!audio || !playing) return;
    if (document.hidden) audio.pause(); else audio.play().catch(() => {});
  });

  // a returning listener: start on their first tap anywhere (a browser rule, not a choice)
  if (store.get(KEY) === 'on') {
    btn.classList.add('ready');
    const first = e => {
      if (e.target.closest('.bar .music, .music-hint')) return;   // the toggle handles itself
      play();
    };
    addEventListener('pointerdown', first, { once: true, capture: true });
  }
  label(false);
}
