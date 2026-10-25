import { QUESTS } from '../../data/content.js';

const KEY = 'eo.achievements';
const QUEST_IDS = QUESTS.map(q => q.id);

export const RULES = [
  { id: 'novice-done', title: '新手村毕业', en: 'Left the starter village', test: s => s.novice },
  { id: 'first-card', title: '打开第一张存档卡', en: 'Opened a first save file', test: s => s.cards.length >= 1 },
  { id: 'five-cards', title: '翻开 5 张存档卡', en: 'Opened 5 save files', test: s => s.cards.length >= 5 },
  { id: 'ten-countries', title: '点亮 10 个国家', en: 'Lit up 10 countries', test: s => s.maxCount >= 10 },
  { id: 'world-tour', title: '点亮全部 26 国', en: 'Lit up all 26 countries', test: s => s.maxCount >= 26 },
  { id: 'all-quests', title: '看完全部主线任务', en: 'Finished every main quest', test: s => QUEST_IDS.every(id => s.quests.includes(id)) },
  { id: 'add-friend', title: '加了好友', en: 'Made a friend', test: s => s.friend },
];

// Every rule with whether it is unlocked, in rule order: what the nav badge lists.
export const progress = unlocked => RULES.map(r => ({ id: r.id, title: r.title, done: unlocked.includes(r.id) }));

function read(store) {
  try {
    const raw = JSON.parse(store.get(KEY));
    if (raw && Array.isArray(raw.unlocked) && raw.state) return raw;
  } catch {}
  return { unlocked: [], state: { novice: false, cards: [], maxCount: 0, quests: [], friend: false } };
}

export function createTracker(store, onUnlock) {
  const data = read(store);
  const s = data.state;
  const add = (list, v) => { if (v != null && !list.includes(v)) list.push(v); };
  return {
    record(event, payload = {}) {
      if (event === 'novice-seen') s.novice = true;
      if (event === 'card-open') add(s.cards, payload.pin);
      if (event === 'timeline') s.maxCount = Math.max(s.maxCount, Number(payload.count) || 0);
      if (event === 'quest-flip') add(s.quests, payload.id);
      if (event === 'add-friend') s.friend = true;
      for (const rule of RULES) {
        if (!data.unlocked.includes(rule.id) && rule.test(s)) {
          data.unlocked.push(rule.id);
          onUnlock(rule);
        }
      }
      store.set(KEY, JSON.stringify(data));
    },
    unlocked() { return [...data.unlocked]; },
  };
}
