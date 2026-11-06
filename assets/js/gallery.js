// A curved WebGL photo gallery, ported from React Bits' <CircularGallery /> to plain DOM. Cards sit on an arc, ripple
// while they move, settle on the nearest one, and open to the full photo on click (click again, click outside, Esc or
// the close button to return). Drag, arrow keys, or a sideways wheel move it; a vertical wheel still scrolls the page.
// Needs WebGL2: without it the caller keeps its own markup.

const SEGMENTS_X = 32, SEGMENTS_Y = 24, INTRO_SECONDS = 1.4, WORLD_HEIGHT = 16.57;
const STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

const VERTEX = `#version 300 es
in vec2 aPosition;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uAngle;
uniform float uPad;
uniform float uWave;
uniform float uWaveTime;
uniform float uFocal;
out vec2 vLocal;
void main() {
  vec2 local = aPosition * (uSize + 2.0 * uPad);
  vec2 unit = local / max(uSize, vec2(1.0));
  float z = uWave * (sin(unit.x * 4.0 + uWaveTime) + cos(unit.y * 2.0 + uWaveTime)) * 0.5;
  float depth = uFocal / max(uFocal - z, 1.0);
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 turned = vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  vLocal = local;
  gl_Position = vec4((uCenter + turned * depth) / (uResolution * 0.5), 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uSize;
uniform float uRadius;
uniform float uImageAspect;
uniform float uReady;
uniform vec3 uPlaceholder;
uniform float uGray;
uniform float uDim;
uniform float uAlpha;
uniform float uRing;
uniform vec3 uRingColor;
uniform float uRingWidth;
uniform float uRingGap;
uniform float uFade;
uniform float uShadow;
uniform float uBlur;
uniform vec2 uShadowOffset;
in vec2 vLocal;
out vec4 outColor;

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float edgeFade() {
  if (uFade <= 0.0) return 1.0;
  float u = gl_FragCoord.x / uResolution.x;
  return smoother(u / uFade) * smoother((1.0 - u) / uFade);
}

void main() {
  vec2 extent = uSize * 0.5;
  if (uShadow > 0.0) {
    float d = roundBox(vLocal - uShadowOffset, extent, uRadius);
    float a = uShadow * (1.0 - smoothstep(-uBlur, uBlur, d)) * uAlpha * edgeFade();
    outColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  float d = roundBox(vLocal, extent, uRadius);
  float pixel = max(length(vec2(dFdx(d), dFdy(d))), 1e-4);
  float cover = clamp(0.5 - d / pixel, 0.0, 1.0);
  vec2 uv = vLocal / uSize + 0.5;
  float aspect = uSize.x / uSize.y;
  vec2 crop = aspect > uImageAspect ? vec2(1.0, uImageAspect / aspect) : vec2(aspect / uImageAspect, 1.0);
  vec3 image = texture(uTexture, (uv - 0.5) * crop + 0.5).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(luma), uGray) * (1.0 - uDim);
  float body = cover * mix(0.08, 1.0, uReady);
  float band = abs(d - uRingGap - uRingWidth * 0.5) - uRingWidth * 0.5;
  float ring = clamp(0.5 - band / pixel, 0.0, 1.0) * uRing;
  vec4 card = vec4(color * body, body);
  vec4 outline = vec4(uRingColor * ring, ring);
  outColor = (card + outline * (1.0 - card.a)) * uAlpha * edgeFade();
}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = value => value * value * (3 - 2 * value);
const wrap = (value, length) => ((value % length) + length) % length;
const fontScale = font => { const m = String(font).match(/(\d+(?:\.\d+)?)px/); return m ? parseFloat(m[1]) / 30 : 1; };

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};
const link = gl => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX), fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT), program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex); gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) { const info = gl.getActiveUniform(program, i); if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name); }
  return { program, uniforms };
};

const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

// Builds the gallery inside `container` (which sets its size). Returns null when WebGL2 is unavailable.
export function circularGallery(container, {
  items, label = 'Image gallery', closeLabel = 'Close', openedLabel = 'opened', ofLabel = 'of',
  bend = 3, textColor = '#ffffff', borderRadius = 0.05, font = 'bold 30px sans-serif', scrollSpeed = 2, scrollEase = 0.05,
  itemSize = 1, itemAspect = 0.78, gap = 0.26, wave = 1, fadeEdges = 0.12, shadow = 0.25, grayscale = false, showTitles = true,
  snap = true, autoScroll = 0, openOnClick = true, intro = true, onItemClick, onActiveChange, dpr
} = {}) {
  const s = {
    items, bend, textColor, borderRadius: clamp(borderRadius, 0, 0.5), scrollSpeed: Math.max(0, scrollSpeed), scrollEase: clamp(scrollEase, 0.001, 1),
    itemSize: clamp(itemSize, 0.2, 2), itemAspect: clamp(itemAspect, 0.2, 5), gap: Math.max(0, gap), wave: Math.max(0, wave),
    fadeEdges: clamp(fadeEdges, 0, 0.5), shadow: clamp(shadow, 0, 1), grayscale, showTitles, snap, autoScroll, openOnClick, intro, dpr
  };

  // markup (what the React component renders)
  container.classList.add('circular-gallery');
  container.style.color = textColor;
  container.setAttribute('role', 'region');
  container.setAttribute('aria-roledescription', 'carousel');
  container.setAttribute('aria-label', label);
  const canvas = el('canvas', 'circular-gallery-canvas'); canvas.setAttribute('aria-hidden', 'true');
  const labelLayer = el('div', 'circular-gallery-labels'); labelLayer.setAttribute('aria-hidden', 'true');
  const caption = el('div', 'circular-gallery-caption'); caption.setAttribute('aria-hidden', 'true');
  const captionText = el('p', 'circular-gallery-caption-text'); caption.append(captionText);
  const closeBtn = el('button', 'circular-gallery-close'); closeBtn.type = 'button'; closeBtn.dataset.galleryClose = ''; closeBtn.tabIndex = -1; closeBtn.setAttribute('aria-label', closeLabel);
  closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const listEl = el('ul', 'circular-gallery-hidden'); listEl.dataset.galleryList = '';
  const buttons = items.map((item, index) => {
    const li = el('li'), b = el('button'); b.type = 'button';
    b.textContent = item.text || item.alt || `Image ${index + 1}`;
    b.setAttribute('aria-label', `${item.text || item.alt || 'Image'}, ${index + 1} ${ofLabel} ${items.length}`);
    li.append(b); listEl.append(li);
    return b;
  });
  const live = el('div', 'circular-gallery-hidden'); live.setAttribute('aria-live', 'polite');

  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const program = link(gl);
  if (!program) return null;
  container.append(canvas, labelLayer, caption, closeBtn, listEl, live);
  const u = program.uniforms;

  let activeIndex = 0, isOpen = false;
  const showActive = index => {
    activeIndex = index;
    buttons.forEach((b, i) => { b.tabIndex = i === index ? 0 : -1; if (i === index) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    captionText.textContent = items[index]?.description || '';
    if (isOpen) live.textContent = `${items[index].text || items[index].alt || 'Image'} ${openedLabel}`;
  };
  const showOpen = open => {
    isOpen = open;
    if (open) closeBtn.dataset.visible = ''; else delete closeBtn.dataset.visible;
    closeBtn.tabIndex = open ? 0 : -1;
    caption.setAttribute('aria-hidden', String(!open));
    live.textContent = open ? `${items[activeIndex].text || items[activeIndex].alt || 'Image'} ${openedLabel}` : '';
  };
  showActive(0);

  const vertices = [];
  for (let y = 0; y <= SEGMENTS_Y; y++) for (let x = 0; x <= SEGMENTS_X; x++) vertices.push(x / SEGMENTS_X - 0.5, y / SEGMENTS_Y - 0.5);
  const indices = [];
  for (let y = 0; y < SEGMENTS_Y; y++) for (let x = 0; x < SEGMENTS_X; x++) {
    const a = y * (SEGMENTS_X + 1) + x, b = a + 1, c = a + SEGMENTS_X + 1, d = c + 1;
    indices.push(a, b, d, a, d, c);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
  const blank = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const colorCache = new Map();
  const parse = value => {
    const key = String(value);
    if (colorCache.has(key)) return colorCache.get(key);
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#ffffff'; probe.fillStyle = key; probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    colorCache.set(key, rgb);
    return rgb;
  };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const textures = new Map();
  const view = { width: 1, height: 1, ratio: 1 };
  const state = {
    scroll: 0, target: 0, velocity: 0, open: 0, openTarget: 0, intro: s.intro && !reduce ? 0 : 1, waveTime: 0, ring: 0,
    keyboard: false, hovered: null, hover: new Map(), focus: new Map(), drag: null, lastInput: 0, active: 0, spacing: 1
  };
  let cards = [], pool = [], raf = 0, last = 0, visible = true, snapTimer = 0, typing = false;

  const textureFor = url => {
    const existing = textures.get(url);
    if (existing) return existing;
    const entry = { texture: null, aspect: 1, ready: 0, loaded: false };
    textures.set(url, entry);
    const image = new Image();
    image.crossOrigin = 'anonymous'; image.decoding = 'async';
    image.onload = () => {
      if (!textures.has(url)) return;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      entry.texture = texture;
      entry.aspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      entry.loaded = true;
      wake();
    };
    image.src = url;
    return entry;
  };

  const measure = () => {
    const height = 0.6 * view.height * s.itemSize, width = height * s.itemAspect;
    const scale = Math.min(1, (view.width * 0.82) / width);
    return { w: width * scale, h: height * scale, spacing: width * scale * (1 + s.gap) };
  };
  const arcOf = x => {
    if (!s.bend) return { y: 0, angle: 0 };
    const depth = (Math.abs(s.bend) * view.height) / WORLD_HEIGHT;
    const half = Math.max(view.width, view.height * 1.9) / 2;
    const radius = (half * half + depth * depth) / (2 * depth);
    const reach = Math.min(Math.abs(x), half, radius * 0.999);
    const arc = radius - Math.sqrt(radius * radius - reach * reach);
    const angle = Math.sign(x) * Math.asin(reach / radius);
    return s.bend > 0 ? { y: -arc, angle: -angle } : { y: arc, angle };
  };
  const captionSize = () => clamp(view.height * 0.045, 15, 22);
  const ensurePool = spacing => {
    const size = Math.ceil(view.width / Math.max(spacing, 1)) + 8;
    if (pool.length === size) return;
    labelLayer.replaceChildren();
    pool = Array.from({ length: size }, () => {
      const e = el('span', 'circular-gallery-label'); e.style.opacity = '0'; labelLayer.appendChild(e);
      return { el: e, slot: null, font: '', text: '' };
    });
  };

  const layout = () => {
    const list = s.items, count = list.length;
    const { w, h, spacing } = measure();
    state.spacing = spacing;
    const introEase = 1 - Math.pow(1 - state.intro, 3);
    const scroll = state.scroll + (1 - introEase) * spacing * 1.6;
    const margin = Math.max(20, Math.min(view.width, view.height) * 0.06);
    const baseLabel = h * 0.072 * fontScale(font);
    const openFrame = item => {
      const aspect = textureFor(item.image).aspect || w / h;
      const titleSpace = item.text && s.showTitles ? captionSize() * 2.4 : 0;
      const captionSpace = titleSpace + (item.description ? 52 : 0);
      const width = Math.min(view.width - margin * 2, (view.height - margin * 2 - captionSpace) * aspect);
      return { width, height: width / aspect, y: captionSpace / 2, titleSpace };
    };
    const activeFrame = openFrame(list[wrap(state.active, count)]);
    const spread = Math.max(0, activeFrame.width / 2 - w / 2);
    const activeX = state.active * spacing - scroll;
    const first = Math.floor((scroll - view.width / 2 - spacing * 2) / spacing);
    const lastSlot = Math.ceil((scroll + view.width / 2 + spacing * 2) / spacing);
    const next = [];
    let lead = null;
    for (let slot = first; slot <= lastSlot; slot++) {
      const index = wrap(slot, count), item = list[index], entry = textureFor(item.image);
      const focus = ease(state.focus.get(slot) || 0);
      let x = slot * spacing - scroll;
      x += Math.sign(x - activeX) * state.open * (1 - focus) * spread;
      const arc = arcOf(x);
      const frame = focus > 0 ? openFrame(item) : activeFrame;
      const order = Math.abs(slot * spacing - state.scroll) / spacing;
      const shown = ease(clamp(state.intro * 2.2 - order * 0.22, 0, 1));
      const hover = state.hover.get(slot) || 0;
      const lift = 1 + hover * 0.04 * (1 - focus);
      const card = {
        slot, index, item, entry,
        x: mix(x, 0, focus), y: mix(arc.y, frame.y, focus) - (1 - shown) * h * 0.18, angle: arc.angle * (1 - focus),
        w: mix(w, frame.width, focus) * lift, h: mix(h, frame.height, focus) * lift, radius: s.borderRadius * Math.min(w, h),
        alpha: shown * mix(1, 0.12, state.open * (1 - focus)), dim: state.open * (1 - focus) * 0.4,
        gray: s.grayscale ? 1 - Math.max(hover, focus, slot === state.active ? state.ring : 0) : 0,
        focus, labelAlpha: mix(1 - state.open, 1, focus), labelSize: mix(baseLabel, captionSize(), focus), frame
      };
      if (!lead || focus > lead.focus) lead = card;
      next.push(card);
    }
    next.sort((a, b) => a.focus - b.focus || Math.abs(b.x) - Math.abs(a.x));
    cards = next;
    const frame = lead && lead.focus > 0 ? lead.frame : activeFrame;
    return { w, h, spacing, openH: frame.height, openY: frame.y, titleSpace: frame.titleSpace };
  };

  const draw = metrics => {
    const ratio = view.ratio;
    const speed = Math.min(Math.abs(state.velocity) / Math.max(metrics.spacing * 4, 1), 1);
    const wavePx = reduce ? 0 : s.wave * speed * view.height * 0.08 * ratio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program.program); gl.bindVertexArray(vao);
    gl.uniform2f(u.uResolution, canvas.width, canvas.height);
    gl.uniform1f(u.uFocal, view.height * 1.207 * ratio);
    gl.uniform1f(u.uWaveTime, state.waveTime);
    gl.uniform1f(u.uFade, s.fadeEdges);
    gl.uniform3fv(u.uPlaceholder, parse(s.textColor));
    gl.uniform3fv(u.uRingColor, parse(s.textColor));
    gl.uniform1f(u.uRingWidth, 2 * ratio);
    gl.uniform1f(u.uRingGap, 5 * ratio);
    gl.activeTexture(gl.TEXTURE0); gl.uniform1i(u.uTexture, 0);
    const count = SEGMENTS_X * SEGMENTS_Y * 6;
    const blur = Math.max(10, metrics.h * 0.09) * ratio;
    const place = card => {
      gl.uniform2f(u.uCenter, card.x * ratio, card.y * ratio);
      gl.uniform2f(u.uSize, card.w * ratio, card.h * ratio);
      gl.uniform1f(u.uAngle, card.angle);
      gl.uniform1f(u.uRadius, Math.min(card.radius, card.w / 2, card.h / 2) * ratio);
      gl.uniform1f(u.uWave, wavePx * (1 - card.focus));
      gl.uniform1f(u.uAlpha, card.alpha);
    };
    if (s.shadow > 0) {
      gl.uniform1f(u.uShadow, s.shadow); gl.uniform1f(u.uBlur, blur);
      gl.uniform2f(u.uShadowOffset, 0, -blur * 0.45); gl.uniform1f(u.uPad, blur * 1.6);
      gl.bindTexture(gl.TEXTURE_2D, blank);
      cards.forEach(card => { place(card); gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0); });
    }
    gl.uniform1f(u.uShadow, 0); gl.uniform1f(u.uPad, 10 * ratio);
    cards.forEach(card => {
      place(card);
      gl.bindTexture(gl.TEXTURE_2D, card.entry.texture || blank);
      gl.uniform1f(u.uImageAspect, card.entry.aspect);
      gl.uniform1f(u.uReady, card.entry.ready);
      gl.uniform1f(u.uGray, card.gray);
      gl.uniform1f(u.uDim, card.dim);
      gl.uniform1f(u.uRing, card.slot === state.active ? state.ring * (1 - card.focus) : 0);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    });
  };

  const placeLabels = metrics => {
    ensurePool(metrics.spacing);
    const used = new Set();
    const fade = value => { if (s.fadeEdges <= 0) return 1; const t = clamp(value / s.fadeEdges, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
    if (s.showTitles) cards.forEach(card => {
      if (!card.item.text) return;
      const entry = pool[wrap(card.slot, pool.length)];
      used.add(entry);
      if (entry.slot !== card.slot || entry.text !== card.item.text) { entry.slot = card.slot; entry.text = card.item.text; entry.el.textContent = card.item.text; }
      if (entry.font !== font) { entry.font = font; entry.el.style.font = font; }
      const size = card.labelSize, offset = card.h / 2 + size * 1.1;
      const x = card.x + Math.sin(card.angle) * offset, y = card.y - Math.cos(card.angle) * offset;
      const cssX = view.width / 2 + x, cssY = view.height / 2 - y;
      const edge = fade(cssX / view.width) * fade(1 - cssX / view.width);
      entry.el.style.fontSize = `${size}px`;
      entry.el.style.color = s.textColor;
      entry.el.style.transform = `translate(${cssX}px, ${cssY}px) translate(-50%, -50%) rotate(${-card.angle}rad)`;
      entry.el.style.opacity = String(card.alpha * card.labelAlpha * mix(edge, 1, card.focus));
    });
    pool.forEach(entry => { if (!used.has(entry) && entry.el.style.opacity !== '0') entry.el.style.opacity = '0'; });
    const top = view.height / 2 - (metrics.openY - metrics.openH / 2) + metrics.titleSpace + 4;
    caption.style.transform = `translate(-50%, ${top}px)`;
    caption.style.opacity = String(ease(clamp((state.open - 0.5) / 0.5, 0, 1)));
    caption.style.color = s.textColor;
    if (caption.dataset.font !== font) { caption.dataset.font = font; caption.style.font = font; caption.style.fontWeight = '400'; }
    caption.style.fontSize = `${captionSize() * 0.8}px`;
  };

  const nearest = () => Math.round(state.target / Math.max(state.spacing, 1));
  const setSlot = (slot, announce = true) => {
    state.target = slot * state.spacing;
    if (slot !== state.active) {
      state.active = slot;
      const index = wrap(slot, s.items.length);
      if (announce) showActive(index);
      onActiveChange?.(index);
    }
    wake();
  };
  const openSlot = slot => { setSlot(slot); state.openTarget = 1; showOpen(true); wake(); };
  const close = () => { state.openTarget = 0; showOpen(false); wake(); };

  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    const idle = now - state.lastInput > 1800;
    const auto = s.autoScroll && !reduce && !state.drag && state.open < 0.01 && state.hovered === null && !state.keyboard && idle;
    if (auto) state.target += s.autoScroll * state.spacing * 0.25 * dt;
    const follow = reduce ? 1 : 1 - Math.pow(1 - s.scrollEase, dt * 60);
    const before = state.scroll;
    state.scroll += (state.target - state.scroll) * follow;
    if (Math.abs(state.target - state.scroll) < 0.05) state.scroll = state.target;
    const velocity = (state.scroll - before) / dt;
    state.velocity += (velocity - state.velocity) * (1 - Math.exp(-dt / 0.08));
    if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
    state.waveTime += dt * 2.4;
    const openFollow = reduce ? 1 : 1 - Math.exp(-dt / 0.14);
    state.open += (state.openTarget - state.open) * openFollow;
    if (Math.abs(state.openTarget - state.open) < 0.001) state.open = state.openTarget;
    state.ring += ((state.keyboard ? 1 : 0) - state.ring) * (1 - Math.exp(-dt / 0.1));
    if (Math.abs((state.keyboard ? 1 : 0) - state.ring) < 0.002) state.ring = state.keyboard ? 1 : 0;
    if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    let settling = false;
    state.hover.forEach((value, slot) => {
      const goal = slot === state.hovered ? 1 : 0;
      const next = value + (goal - value) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(goal - next) < 0.002) { if (goal === 0) state.hover.delete(slot); else state.hover.set(slot, 1); }
      else { state.hover.set(slot, next); settling = true; }
    });
    if (state.openTarget > 0 && !state.focus.has(state.active)) state.focus.set(state.active, 0);
    state.focus.forEach((value, slot) => {
      const goal = state.openTarget > 0 && slot === state.active ? 1 : 0;
      const next = reduce ? goal : value + (goal - value) * (1 - Math.exp(-dt / 0.16));
      if (Math.abs(goal - next) < 0.001) { if (goal === 0) state.focus.delete(slot); else state.focus.set(slot, 1); }
      else { state.focus.set(slot, next); settling = true; }
    });
    textures.forEach(entry => {
      if (!entry.loaded || entry.ready >= 1) return;
      entry.ready = reduce ? 1 : Math.min(1, entry.ready + dt / 0.45);
      settling = true;
    });
    const slot = auto ? Math.round(state.scroll / Math.max(state.spacing, 1)) : nearest();
    if (slot !== state.active && !state.drag) {
      state.active = slot;
      const index = wrap(slot, s.items.length);
      showActive(index);
      onActiveChange?.(index);
    }
    const metrics = layout();
    draw(metrics);
    placeLabels(metrics);
    const moving = (s.autoScroll && !reduce) || state.scroll !== state.target || state.velocity !== 0 || state.open !== state.openTarget
      || state.intro < 1 || (state.ring !== 0 && state.ring !== 1) || settling;
    if (moving) raf = requestAnimationFrame(frame); else last = 0;
  };
  function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  const resize = () => {
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    const before = state.spacing;
    const { spacing } = measure();
    if (before > 1 && spacing !== before) { state.scroll = (state.scroll / before) * spacing; state.target = (state.target / before) * spacing; }
    state.spacing = spacing;
    wake();
  };

  const point = event => { const r = container.getBoundingClientRect(); return { x: event.clientX - r.left - r.width / 2, y: r.height / 2 - (event.clientY - r.top) }; };
  const hit = ({ x, y }) => {
    for (let i = cards.length - 1; i >= 0; i--) {
      const card = cards[i];
      if (card.alpha < 0.05) continue;
      const dx = x - card.x, dy = y - card.y, c = Math.cos(-card.angle), sn = Math.sin(-card.angle);
      const lx = c * dx - sn * dy, ly = sn * dx + c * dy;
      if (Math.abs(lx) <= card.w / 2 && Math.abs(ly) <= card.h / 2) return card;
    }
    return null;
  };
  const setPointer = card => {
    const slot = card ? card.slot : null;
    if (slot !== state.hovered) { state.hovered = slot; if (slot !== null && !state.hover.has(slot)) state.hover.set(slot, 0); wake(); }
    if (card) container.setAttribute('data-pointer', ''); else container.removeAttribute('data-pointer');
  };
  const snapNow = () => { if (!s.snap && state.open < 0.5) return; setSlot(nearest()); };

  container.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('[data-gallery-close]')) return;
    state.drag = { id: event.pointerId, x0: event.clientX, y0: event.clientY, start: state.target, moved: false, samples: [], p: point(event) };
    state.lastInput = performance.now();
    wake();
  });
  container.addEventListener('pointermove', event => {
    const drag = state.drag;
    if (drag && drag.id === event.pointerId) {
      const dx = event.clientX - drag.x0, dy = event.clientY - drag.y0;
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        if (Math.abs(dy) > Math.abs(dx) && event.pointerType !== 'mouse') { state.drag = null; return; }
        drag.moved = true;
        container.setPointerCapture?.(event.pointerId);
        container.setAttribute('data-dragging', '');
        setPointer(null);
      }
      if (drag.moved) {
        state.target = drag.start - dx * (s.scrollSpeed / 2);
        drag.samples.push({ x: event.clientX, t: performance.now() });
        if (drag.samples.length > 6) drag.samples.shift();
        state.lastInput = performance.now();
        wake();
      }
      return;
    }
    if (event.pointerType === 'mouse') setPointer(hit(point(event)));
  });
  container.addEventListener('pointerup', event => {
    const drag = state.drag;
    if (!drag || drag.id !== event.pointerId) return;
    state.drag = null;
    container.removeAttribute('data-dragging');
    if (container.hasPointerCapture?.(event.pointerId)) container.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      const samples = drag.samples;
      if (samples.length > 1) {
        const a = samples[0], b = samples[samples.length - 1], span = Math.max(b.t - a.t, 16);
        state.target -= ((b.x - a.x) / span) * 1000 * 0.18 * (s.scrollSpeed / 2);
      }
      snapNow();
      return;
    }
    const card = hit(drag.p);
    if (!card) { if (state.open > 0.5) close(); return; }
    onItemClick?.(card.item, card.index);
    if (!s.openOnClick) { setSlot(card.slot); return; }
    if (state.open > 0.5 && card.slot === state.active) close(); else openSlot(card.slot);
  });
  container.addEventListener('pointercancel', event => {
    if (state.drag && state.drag.id === event.pointerId) { state.drag = null; container.removeAttribute('data-dragging'); snapNow(); }
  });
  container.addEventListener('pointerleave', () => setPointer(null));
  // only a sideways wheel (or shift + wheel) moves the gallery; an ordinary wheel keeps scrolling the page
  container.addEventListener('wheel', event => {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.height : 1;
    const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const delta = sideways ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    if (!delta) return;
    event.preventDefault();
    state.target += delta * unit * (s.scrollSpeed / 2);
    state.lastInput = performance.now();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(snapNow, 140);
    wake();
  }, { passive: false });
  container.addEventListener('keydown', event => {
    const step = STEPS[event.key];
    state.lastInput = performance.now();
    if (step) {
      event.preventDefault();
      if (container.contains(document.activeElement) && document.activeElement !== container) state.keyboard = true;
      setSlot(nearest() + step);
      const index = wrap(state.active, s.items.length);
      if (container.contains(document.activeElement)) buttons[index]?.focus({ preventScroll: true });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const base = nearest() - wrap(nearest(), s.items.length);
      setSlot(event.key === 'Home' ? base : base + s.items.length - 1);
      return;
    }
    if (event.key === 'Escape' && state.openTarget > 0) { event.preventDefault(); close(); }
  });
  container.addEventListener('focusin', event => {
    if (!event.target.closest('[data-gallery-list]')) return;
    state.keyboard = typing || event.target.matches(':focus-visible');
    wake();
  });
  container.addEventListener('focusout', event => { if (container.contains(event.relatedTarget)) return; state.keyboard = false; wake(); });
  document.addEventListener('visibilitychange', () => { last = 0; wake(); });
  document.addEventListener('keydown', event => { if (event.key === 'Tab' || event.key.startsWith('Arrow')) typing = true; }, true);
  document.addEventListener('pointerdown', () => { typing = false; }, true);
  closeBtn.addEventListener('click', close);

  const slotFor = index => {
    const count = s.items.length, slot = nearest(), base = slot - wrap(slot, count) + index;
    return [base - count, base, base + count].reduce((best, value) => Math.abs(value - slot) < Math.abs(best - slot) ? value : best);
  };
  buttons.forEach((b, index) => {
    b.addEventListener('focus', () => setSlot(slotFor(index), false));
    b.addEventListener('click', () => openSlot(slotFor(index)));
  });

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); if (visible) { last = 0; wake(); } }).observe(container);
  s.items.forEach(item => textureFor(item.image));
  resize();
  return { open: index => openSlot(slotFor(index)), close, wake };
}

// The photography section: its photos move from the grid onto the curved gallery. The grid stays for print, for
// browsers without WebGL2, and as the source of the images, titles and alt text.
export function initPhotoGallery() {
  const grid = document.querySelector('#viewfinder .vfs');
  if (!grid) return;
  const items = [...grid.querySelectorAll('.vf')].map(f => {
    const im = f.querySelector('img');
    const large = (im.getAttribute('srcset') || '').split(',').map(x => x.trim().split(' ')[0]).pop() || im.src;
    return { image: new URL(large, location.href).href, text: f.querySelector('figcaption')?.textContent.trim(), alt: im.alt };
  });
  const en = document.documentElement.lang === 'en';
  const box = document.createElement('div');
  box.className = 'photo-gallery';
  grid.before(box);
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2e1f12';
  const g = circularGallery(box, {
    items, bend: 3, textColor: ink, borderRadius: 0.05, scrollEase: 0.05, autoScroll: 0.35,
    font: `600 30px "EO Text", "Songti SC", serif`, itemAspect: 0.78, shadow: 0.3,
    label: en ? 'Photo gallery' : '摄影照片', closeLabel: en ? 'Close' : '关闭', openedLabel: en ? 'opened' : '已打开', ofLabel: en ? 'of' : '/'
  });
  if (!g) { box.remove(); return; }
  grid.hidden = true;
  box.insertAdjacentHTML('afterend', `<p class="photo-hint">${en ? 'Drag the photos sideways, or tap one to see it whole.' : '左右拖动照片，点一张看大图。'}</p>`);
}
