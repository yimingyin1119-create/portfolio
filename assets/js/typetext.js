// Typewriter text, ported from React Bits' <TextType /> to plain DOM (no React, no GSAP): sentences type out one
// character at a time with an optional per-character effect, can be cleared by backspace or by a select-then-delete,
// may hit a neighbouring key now and then and correct it, and a soft-blinking cursor glides to the typing position.
// The finished text is laid out invisibly underneath, so the element keeps its final size while it types.

const NEIGHBORS = {
  a: 'qwsz', b: 'vghn', c: 'xdfv', d: 'serfcx', e: 'wsdr', f: 'drtgvc', g: 'ftyhbv', h: 'gyujnb', i: 'ujko', j: 'huikmn',
  k: 'jiolm', l: 'kop', m: 'njk', n: 'bhjm', o: 'iklp', p: 'ol', q: 'wa', r: 'edft', s: 'awedxz', t: 'rfgy', u: 'yhji',
  v: 'cfgb', w: 'qase', x: 'zsdc', y: 'tghu', z: 'asx', 0: '9p', 1: '2q', 2: '13w', 3: '24e', 4: '35r', 5: '46t',
  6: '57y', 7: '68u', 8: '79i', 9: '80o'
};

const EFFECTS = {
  fade: { keyframes: [{ opacity: 0 }, { opacity: 1 }], options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' } },
  blur: { keyframes: [{ opacity: 0, filter: 'blur(0.3em)' }, { opacity: 1, filter: 'blur(0em)' }], options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } },
  rise: { keyframes: [{ opacity: 0, top: '0.6em' }, { opacity: 1, top: '0em' }], options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' } }
};

const graphemes = value => typeof Intl !== 'undefined' && Intl.Segmenter
  ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), part => part.segment)
  : Array.from(value);

const typoFor = char => {
  const keys = NEIGHBORS[char.toLowerCase()];
  if (!keys) return null;
  const pick = keys[Math.floor(Math.random() * keys.length)];
  return char === char.toLowerCase() ? pick : pick.toUpperCase();
};

const span = (cls, text) => { const s = document.createElement('span'); if (cls) s.className = cls; if (text != null) s.textContent = text; return s; };

// Turns `el` into a typewriter. Options follow the React component's props; `start: false` waits for .start().
export function typeText(el, {
  text,
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  deleteMode = 'backspace',
  loop = true,
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorStyle = 'character',
  cursorCharacter = '|',
  cursorColor = 'currentColor',
  cursorBlinkDuration = 0.5,
  cursorGlide = true,
  typeEffect = 'none',
  mistakes = 0,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  reverseMode = false,
  start = true
} = {}) {
  const sentences = (Array.isArray(text) ? text : [String(text ?? '')]).map(String);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minSpeed = variableSpeed?.min ?? typingSpeed, maxSpeed = variableSpeed?.max ?? typingSpeed;
  const glide = Math.min(0.18, Math.max(0.06, (minSpeed + maxSpeed) / 2 * 0.0016));
  const speed = () => minSpeed + Math.random() * (maxSpeed - minSpeed);

  // markup: a screen-reader copy, the invisible finished text (sets the size), the typed text and the cursor
  el.classList.add('text-type');
  el.replaceChildren();
  const sr = span('text-type__sr', sentences.join(' '));
  const ghost = span('text-type__ghost', sentences.reduce((a, b) => a.length >= b.length ? a : b));
  ghost.setAttribute('aria-hidden', 'true');
  const content = span('text-type__content'); content.setAttribute('aria-hidden', 'true');
  const line = span(''), caret = span('text-type__caret', '\u200B');
  if (reverseMode) content.append(caret, line); else content.append(line, caret);
  el.append(sr, ghost, content);
  let cursor = null, blink = null, blinkAnim = null, blinkTimer = 0;
  if (showCursor) {
    cursor = span(`text-type__cursor text-type__cursor--${cursorStyle}`);
    cursor.setAttribute('aria-hidden', 'true');
    if (cursorColor && cursorColor !== 'currentColor') cursor.style.color = cursorColor;
    blink = span('text-type__blink');
    if (cursorStyle === 'character') blink.textContent = cursorCharacter; else blink.append(span('text-type__shape'));
    cursor.append(blink); el.append(cursor);
    if (!reduce && cursorBlinkDuration > 0) {
      const d = cursorBlinkDuration, T = 2 * d, hold = .7 * d, fade = .45 * d;
      blinkAnim = blink.animate([
        { opacity: 1, offset: 0 }, { opacity: 1, offset: hold / T, easing: 'ease-in-out' }, { opacity: 0, offset: (hold + fade) / T },
        { opacity: 0, offset: (hold + fade + .4 * d) / T, easing: 'ease-in-out' }, { opacity: 1, offset: 1 }
      ], { duration: T * 1000, iterations: Infinity });
    }
  }

  // state, as in the component
  let index = 0, count = 0, selected = 0, typo = null, deleting = false, lastTypo = -1, timer = 0, running = false;
  let chars = graphemes(sentences[0]);
  const nodes = new Map();               // key -> character span currently on screen
  let lastPos = null;

  function animate(node) {
    const fx = EFFECTS[typeEffect];
    if (fx && !reduce && typeof node.animate === 'function') node.animate(fx.keyframes, fx.options);
  }
  function render() {
    const total = chars.length, shown = Math.min(count, total);
    const startAt = reverseMode ? total - shown : 0, marked = Math.min(selected, shown);
    const want = [];
    for (let i = 0; i < shown; i++) want.push({ key: `c${startAt + i}`, ch: chars[startAt + i], sel: reverseMode ? i < marked : i >= shown - marked });
    const mis = (typo?.tail ?? []).map((ch, i) => ({ key: `t${i}`, ch, sel: false }));
    if (reverseMode) mis.reverse();
    const list = reverseMode ? [...mis, ...want] : [...want, ...mis];
    const keep = new Set(list.map(w => w.key));
    for (const [k, n] of nodes) if (!keep.has(k)) { n.remove(); nodes.delete(k); }
    let ref = line.firstChild;
    for (const w of list) {
      let n = nodes.get(w.key);
      if (!n) { n = span('text-type__char', w.ch); nodes.set(w.key, n); line.insertBefore(n, ref); animate(n); }
      else if (n === ref) ref = ref.nextSibling;
      else line.insertBefore(n, ref);
      n.classList.toggle('text-type__char--selected', w.sel);
    }
    line.style.color = textColors.length ? textColors[index % textColors.length] : '';
    if (cursor) cursor.classList.toggle('text-type__cursor--hidden', hideCursorWhileTyping && (shown < total || deleting || typo !== null));
    place(false);
  }
  function place(instant) {
    if (!cursor) return;
    const x = caret.offsetLeft, y = caret.offsetTop;
    if (lastPos && Math.abs(lastPos.x - x) < .5 && Math.abs(lastPos.y - y) < .5) return;
    const jump = instant || !lastPos || !cursorGlide || reduce || Math.abs(lastPos.y - y) > 1;
    lastPos = { x, y };
    cursor.style.transition = jump ? 'none' : `transform ${glide}s cubic-bezier(.215, .61, .355, 1)`;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    if (instant || !blinkAnim) return;
    // stay solid while moving, then pick the blink up again
    blinkAnim.cancel(); clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => blinkAnim.play(), 120);
  }

  const wait = (ms, next) => { timer = setTimeout(() => { next(); render(); step(); }, ms); };
  function step() {
    if (!running) return;
    const total = chars.length, shown = Math.min(count, total);
    if (!deleting) {
      if (typo) {
        if (reduce) wait(0, () => { typo = null; });
        else if (!typo.fixing) {
          if (typo.tail.length < typo.plan.length) wait(speed(), () => { typo = { ...typo, tail: typo.plan.slice(0, typo.tail.length + 1) }; });
          else wait(260 + Math.random() * 320, () => { typo = { ...typo, fixing: true }; });
        } else if (typo.tail.length) wait(Math.max(45, deletingSpeed), () => { typo = { ...typo, tail: typo.tail.slice(0, -1) }; });
        else wait(90 + Math.random() * 140, () => { typo = null; });
      } else if (shown < total) {
        const lead = shown === 0 ? initialDelay : 0;
        const next = reverseMode ? total - shown - 1 : shown;
        const wrong = mistakes > 0 && shown > 0 && lastTypo !== next ? typoFor(chars[next]) : null;
        if (reduce) wait(lead, () => { count = total; });
        else if (wrong && Math.random() < Math.min(1, mistakes) * 0.16) {
          lastTypo = next;
          const plan = [wrong], follow = chars[reverseMode ? next - 1 : next + 1];
          if (follow && follow.trim() && Math.random() < 0.4) plan.push(follow);
          wait(lead + speed(), () => { typo = { plan, tail: [wrong], fixing: false }; });
        } else wait(lead + speed(), () => { count = shown + 1; });
      } else if (loop || index < sentences.length - 1) wait(pauseDuration, () => { deleting = true; });
    } else if (shown > 0) {
      if (reduce) wait(0, () => { count = 0; });
      else if (deleteMode === 'select') {
        if (selected < shown) wait(deletingSpeed, () => { selected++; });
        else wait(Math.max(160, deletingSpeed * 8), () => { selected = 0; count = 0; });
      } else wait(deletingSpeed, () => { count = shown - 1; });
    } else {
      onSentenceComplete?.(sentences[index], index);
      lastTypo = -1; selected = 0; deleting = false;
      index = (index + 1) % sentences.length;
      chars = graphemes(sentences[index]);
      for (const n of nodes.values()) n.remove();
      nodes.clear();
      wait(0, () => {});
    }
  }

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => place(true)).observe(el);
  render();
  const api = {
    start() { if (running) return; running = true; step(); },
    stop() { running = false; clearTimeout(timer); }
  };
  if (start) api.start();
  return api;
}

// The opening headline types itself out once the scroll has unrolled far enough to show it.
export function initHeadline() {
  const h = document.getElementById('h-opening');
  const boot = h?.closest('.boot');
  if (!h || !boot || !document.documentElement.classList.contains('motion')) return;
  const text = [...h.childNodes].map(n => n.nodeName === 'BR' ? '\n' : n.textContent).join('');
  const typer = typeText(h, {
    text, start: false, loop: false,
    typingSpeed: 110, variableSpeed: { min: 70, max: 160 },
    typeEffect: 'fade', mistakes: 0.2,
    cursorStyle: 'bar', cursorGlide: true, showCursor: true
  });
  const go = () => setTimeout(() => typer.start(), 1100);
  if (boot.classList.contains('go') || boot.classList.contains('unrolled')) go();
  else boot.addEventListener('unfurl', go, { once: true });
}
