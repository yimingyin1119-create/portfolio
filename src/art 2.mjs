// Line drawings in one hand: 120×120, round 2px strokes in the chalk colour, one red accent (class "a").
// Every shape carries pathLength="1" so CSS can draw it on when its chapter scrolls in.
const star = (cx, cy, R, r) => 'M' + Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R;
  return `${(cx + d * Math.cos(a)).toFixed(1)} ${(cy + d * Math.sin(a)).toFixed(1)}`;
}).join(' L') + ' Z';
const sparkle = (cx, cy, s) => `M${cx} ${cy - s} C${cx + s * .08} ${cy - s * .3} ${cx + s * .3} ${cy - s * .08} ${cx + s} ${cy} C${cx + s * .3} ${cy + s * .08} ${cx + s * .08} ${cy + s * .3} ${cx} ${cy + s} C${cx - s * .08} ${cy + s * .3} ${cx - s * .3} ${cy + s * .08} ${cx - s} ${cy} C${cx - s * .3} ${cy - s * .08} ${cx - s * .08} ${cy - s * .3} ${cx} ${cy - s} Z`;

// Each drawing is a list of [shape, attributes, accent?]
const DRAW = {
  // a game controller: the internships are the main quest
  quests: [['path', 'M32 46h56c15 0 23 13 25 30 2 17-9 25-19 17l-12-12H38l-12 12c-10 8-21 0-19-17 2-17 10-30 25-30z'], ['path', 'M34 62h16M42 54v16'], ['circle', 'cx="80" cy="58" r="4"', 1], ['circle', 'cx="91" cy="68" r="4"', 1], ['path', 'M54 32c0-8 12-8 12 0v14']],
  // a stage spotlight on a stand, throwing light down
  posters: [['path', 'M42 16h36l9 26H33z'], ['path', 'M60 42v10M52 52h16'], ['path', 'M34 56L14 108M86 56l20 52', 1], ['path', 'M14 108c20 8 72 8 92 0'], ['path', 'M60 4v12']],
  // a big sparkle and a small one: new skill unlocked
  skills: [['path', sparkle(54, 62, 40)], ['path', sparkle(98, 22, 13), 1], ['path', sparkle(100, 96, 8)]],
  // a clapperboard
  cases: [['rect', 'x="14" y="50" width="92" height="56" rx="4"'], ['path', 'M14 64h92M24 78h34M24 90h50M74 78h22', 0], ['path', 'M13 47l88-20 4 15-88 20z', 1], ['path', 'M33 43l6-15M55 38l6-15M77 33l6-15']],
  // a megaphone with sound coming out
  bridge: [['path', 'M18 50v24h16l48 24V26L34 50z'], ['path', 'M34 74l8 26h12l-7-26'], ['path', 'M94 46c8 9 8 23 0 32M104 36c14 15 14 37 0 52', 1]],
  // a medal on a ribbon
  novice: [['path', 'M38 10h14l10 36H48zM82 10H68L58 46h14z'], ['circle', 'cx="60" cy="76" r="30"'], ['path', star(60, 76, 17, 7), 1]],
  // the globe with a flight path around it
  map: [['circle', 'cx="60" cy="62" r="40"'], ['ellipse', 'cx="60" cy="62" rx="17" ry="40"'], ['path', 'M20 62h80M27 42h66M27 82h66'], ['path', 'M6 92C30 118 96 104 114 36', 1], ['path', 'M106 34l10-6-2 11z', 1]],
  // a plane climbing away
  abroad: [['path', 'M14 84l70-48c9-6 20-5 22 0 2 5-3 12-12 17L26 98z'], ['path', 'M52 60L34 38l-10 4 14 30M70 64l4 30 10-4 0-34'], ['path', 'M6 110c18-2 30-8 40-18', 1]],
  // a camera
  viewfinder: [['rect', 'x="10" y="38" width="100" height="66" rx="9"'], ['path', 'M40 38l7-13h26l7 13'], ['circle', 'cx="60" cy="71" r="22"'], ['circle', 'cx="60" cy="71" r="12"', 1], ['rect', 'x="88" y="47" width="12" height="8" rx="2"'], ['path', 'M20 38v-6h12v6']],
  // an envelope with a stamp
  contact: [['rect', 'x="8" y="30" width="104" height="70" rx="5"'], ['path', 'M8 35l52 36 52-36'], ['rect', 'x="84" y="40" width="20" height="24" rx="2"', 1], ['path', 'M18 88h26']],
};
const ICONS = {
  radar: [['circle', 'cx="20" cy="20" r="15"'], ['circle', 'cx="20" cy="20" r="8"'], ['path', 'M20 20l11-11', 1], ['circle', 'cx="27" cy="15" r="2"', 1]],
  flask: [['path', 'M15 5h10M17 5v11L7 33c-1 2 0 3 2 3h22c2 0 3-1 2-3L23 16V5'], ['path', 'M11 26h18', 1]],
  browser: [['rect', 'x="4" y="7" width="32" height="26" rx="3"'], ['path', 'M4 14h32'], ['path', 'M13 21l-4 4 4 4M27 21l4 4-4 4M22 20l-4 10', 1]],
  phone: [['rect', 'x="11" y="3" width="18" height="34" rx="4"'], ['path', 'M17 31h6'], ['path', 'M16 13l9 5-9 5z', 1]],
  reel: [['circle', 'cx="20" cy="20" r="16"'], ['circle', 'cx="20" cy="20" r="3"', 1], ['circle', 'cx="20" cy="10" r="4"'], ['circle', 'cx="20" cy="30" r="4"'], ['circle', 'cx="10" cy="20" r="4"'], ['circle', 'cx="30" cy="20" r="4"']],
  mic: [['rect', 'x="14" y="3" width="12" height="20" rx="6"'], ['path', 'M8 18c0 7 5 12 12 12s12-5 12-12M20 30v7M13 37h14'], ['path', 'M14 11h12', 1]],
};

const shapes = list => list.map(([tag, attrs, accent]) => `<${tag} ${tag === 'path' ? `d="${attrs}"` : attrs} pathLength="1"${accent ? ' class="a"' : ''}/>`).join('');

export const chapterArt = id => DRAW[id] ? `<svg class="ch-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${shapes(DRAW[id])}</svg>` : '';
export const icon = name => `<svg class="icon" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${shapes(ICONS[name])}</svg>`;

// A rubber stamp for finished quests
export const stamp = () => `<svg class="stamp" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="36"/><path d="${star(50, 50, 11, 4.5)}"/><text x="50" y="34" text-anchor="middle">QUEST</text><text x="50" y="78" text-anchor="middle">CLEAR</text></svg>`;
