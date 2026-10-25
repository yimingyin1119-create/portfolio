import { t } from './i18n.mjs';
// Line drawings in one hand (nautical: wheel, chest, spyglass, bottle…): 120×120, round 2px strokes in the chalk colour, one red accent (class "a").
// Every shape carries pathLength="1" so CSS can draw it on when its chapter scrolls in.
const star = (cx, cy, R, r) => 'M' + Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R;
  return `${(cx + d * Math.cos(a)).toFixed(1)} ${(cy + d * Math.sin(a)).toFixed(1)}`;
}).join(' L') + ' Z';
const sparkle = (cx, cy, s) => `M${cx} ${cy - s} C${cx + s * .08} ${cy - s * .3} ${cx + s * .3} ${cy - s * .08} ${cx + s} ${cy} C${cx + s * .3} ${cy + s * .08} ${cx + s * .08} ${cy + s * .3} ${cx} ${cy + s} C${cx - s * .08} ${cy + s * .3} ${cx - s * .3} ${cy + s * .08} ${cx - s} ${cy} C${cx - s * .3} ${cy - s * .08} ${cx - s * .08} ${cy - s * .3} ${cx} ${cy - s} Z`;

// Each drawing is a list of [shape, attributes, accent?]
const DRAW = {
  // a ship's wheel: the internships are the main voyage
  quests: [['circle', 'cx="60" cy="60" r="30"'], ['circle', 'cx="60" cy="60" r="9"', 1], ['path', 'M60 8v104M8 60h104M23 23l74 74M97 23l-74 74'], ['circle', 'cx="60" cy="60" r="22"']],
  // a pile of coins: the haul
  posters: [['ellipse', 'cx="60" cy="96" rx="40" ry="10"'], ['path', 'M20 96v-10c0-6 18-10 40-10s40 4 40 10v10'], ['ellipse', 'cx="48" cy="62" rx="22" ry="7"', 1], ['path', 'M26 62v14c0 4 10 7 22 7s22-3 22-7V62'], ['ellipse', 'cx="78" cy="38" rx="18" ry="6"'], ['path', 'M60 38v12c0 3 8 6 18 6s18-3 18-6V38']],
  // a big sparkle and a small one: new skill unlocked
  skills: [['path', sparkle(54, 62, 40)], ['path', sparkle(98, 22, 13), 1], ['path', sparkle(100, 96, 8)]],
  // a treasure chest
  cases: [['path', 'M16 56h88v48H16z'], ['path', 'M16 56c0-26 88-26 88 0'], ['path', 'M16 70h88M40 56v48M80 56v48'], ['rect', 'x="52" y="62" width="16" height="16" rx="2"', 1]],
  // a megaphone with sound coming out
  bridge: [['path', 'M18 50v24h16l48 24V26L34 50z'], ['path', 'M34 74l8 26h12l-7-26'], ['path', 'M94 46c8 9 8 23 0 32M104 36c14 15 14 37 0 52', 1]],
  // a medal on a ribbon
  novice: [['path', 'M38 10h14l10 36H48zM82 10H68L58 46h14z'], ['circle', 'cx="60" cy="76" r="30"'], ['path', star(60, 76, 17, 7), 1]],
  // the globe with a flight path around it
  map: [['circle', 'cx="60" cy="62" r="40"'], ['ellipse', 'cx="60" cy="62" rx="17" ry="40"'], ['path', 'M20 62h80M27 42h66M27 82h66'], ['path', 'M6 92C30 118 96 104 114 36', 1], ['path', 'M106 34l10-6-2 11z', 1]],
  // a ship under sail: the first voyage out
  abroad: [['path', 'M18 78h84l-12 18H30z'], ['path', 'M46 78V18M76 78V28'], ['path', 'M48 22c17 6 17 20 0 25zM48 52c19 5 19 16 0 21zM78 32c13 5 13 16 0 20zM78 56c13 4 13 12 0 16z'], ['path', 'M46 18l12 4-12 4', 1], ['path', 'M6 104q8-6 16 0t16 0 16 0 16 0 16 0 16 0 16 0']],
  // a spyglass
  viewfinder: [['path', 'M14 84l52-30 6 11-52 30z'], ['path', 'M66 54l26-15 7 13-26 15z'], ['path', 'M92 39l12-7 8 14-12 7z', 1], ['path', 'M40 82l10 24M36 106h20']],
  // a message in a bottle, adrift
  contact: [['rect', 'x="12" y="44" width="70" height="40" rx="18"'], ['path', 'M82 56h16v16H82'], ['rect', 'x="98" y="54" width="9" height="20" rx="2"'], ['rect', 'x="26" y="56" width="42" height="16" rx="7"', 1], ['path', 'M30 64h34', 1], ['path', 'M6 100q8-6 16 0t16 0 16 0 16 0 16 0 16 0 16 0']],
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

// Sea-chart ornaments for the open water between chapters (120×90), and the treasure mark at the end of the route.
const rose = (cx, cy, R, r) => 'M' + Array.from({ length: 16 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 8, d = i % 4 === 0 ? R : i % 2 === 0 ? R * .55 : r;
  return `${(cx + d * Math.cos(a)).toFixed(1)} ${(cy + d * Math.sin(a)).toFixed(1)}`;
}).join(' L') + ' Z';
const WAVES = 'M6 82q7-6 14 0t14 0 14 0 14 0 14 0 14 0 14 0 14 0';
const SEA = {
  ship: [['path', 'M22 62h76l-11 14H33z'], ['path', 'M46 62V14M74 62V22'], ['path', 'M48 18c15 6 15 18 0 22zM48 44c17 5 17 14 0 18zM76 26c12 5 12 15 0 19zM76 48c12 4 12 10 0 14z'], ['path', 'M46 14l11 4-11 4', 1], ['path', WAVES]],
  serpent: [['path', 'M10 74c6-30 22-30 26 0M42 74c6-36 24-36 28 0'], ['path', 'M76 74c2-26 18-36 30-22l8-3-4 9c-6 2-10 0-12-4-4 6-6 12-6 20', 0], ['circle', 'cx="101" cy="51" r="1.6"', 1], ['path', WAVES]],
  compass: [['circle', 'cx="60" cy="48" r="30"'], ['circle', 'cx="60" cy="48" r="24"'], ['path', rose(60, 48, 38, 7)], ['path', 'M60 10l4 10h-8z', 1]],
  anchor: [['circle', 'cx="60" cy="12" r="6"'], ['path', 'M60 18v58M46 30h28'], ['path', 'M28 58c3 22 18 28 32 28s29-6 32-28', 0], ['path', 'M28 58l-5 8M28 58l8 3M92 58l5 8M92 58l-8 3', 1]],
  whale: [['path', 'M12 62c10-24 58-28 80-8 6-8 14-11 20-9-4 6-6 12-4 18-8 0-14-2-18-6-18 18-68 16-78 5z'], ['circle', 'cx="30" cy="56" r="1.8"'], ['path', 'M44 34c-2-8 4-10 2-16M44 34c4-6 10-4 12-10', 1], ['path', 'M6 84q7-6 14 0t14 0 14 0 14 0']],
  waves: [['path', 'M8 36q8-7 16 0t16 0 16 0 16 0'], ['path', 'M40 56q8-7 16 0t16 0 16 0 16 0', 1], ['path', 'M14 76q8-7 16 0t16 0 16 0']],
};
export const SEA_ORDER = ['ship', 'serpent', 'compass', 'whale', 'anchor', 'waves'];
export const sea = name => `<svg class="sea" viewBox="0 0 120 90" aria-hidden="true" focusable="false">${shapes(SEA[name])}</svg>`;
export const treasure = () => `<span class="treasure" aria-hidden="true"><canvas class="flag small" data-title="TREASURE" data-sub="" width="150" height="96"></canvas><svg viewBox="0 0 120 120" focusable="false"><path d="M24 24C48 46 74 74 98 98" pathLength="1"/><path d="M98 22C74 48 48 72 22 96" pathLength="1"/></svg><b>${t('宝藏在这里')}</b></span>`;
