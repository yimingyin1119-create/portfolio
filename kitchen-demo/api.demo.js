// Demo build of 饭搭子: the same core module the n8n backend runs, executed in the browser
// on data kept in this device's localStorage. Nothing is sent anywhere.
import { handle, applyWrites, stateFromTables } from '../../../core/index.js';
import { deserialize } from '../../../core/schema.js';
import { seedRows } from '../../../core/seed.js';
import { localDate } from '../../../core/time.js';
import recipes from '../../../seed/recipes.json';
import { storage } from '../storage.js';

export class OfflineError extends Error {}

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const STATE_KEY = 'pk.demo.state';
const TZ = 'Asia/Singapore';
export const DEMO_USERS = [{ name: '小尹', pin: '1234' }, { name: '室友', pin: '1234' }];

function ctx(token) {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const rand = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return { now: new Date().toISOString(), rand, tz: TZ, seq: 0, token, internal: false };
}

function run(state, action, payload, token = '') {
  const r = handle(action, state, payload, ctx(token));
  return { ...r, state: applyWrites(state, r.writes) };
}

// A fresh kitchen: preset dishes, two members, a half-stocked pantry and one request waiting to be taken.
function seed() {
  let state = stateFromTables({});
  state.recipes = seedRows(ctx(''), recipes).map((row) => deserialize('pk_recipes', row));
  const tokens = [];
  for (const u of DEMO_USERS) {
    const r = run(state, 'auth.register', u);
    state = r.state;
    tokens.push(r.body.data.token);
  }
  const pantry = [
    { name: '鸡蛋', qty: 6, unit: '个', lowThreshold: 2 }, { name: '番茄', qty: 1, unit: '个' },
    { name: '土豆', qty: 3, unit: '个' }, { name: '五花肉', qty: 200, unit: 'g', expiresOn: localDate(new Date(Date.now() + 2 * 864e5).toISOString(), TZ) },
    { name: '米饭', qty: 2, unit: '碗' }, { name: '盐', kind: 'seasoning', status: 'ok' }, { name: '生抽', kind: 'seasoning', status: 'low' },
  ];
  for (const item of pantry) state = run(state, 'inventory.save', { item }, tokens[1]).state;
  const dish = state.recipes.find((r) => r.name === '番茄炒蛋');
  state = run(state, 'requests.create', {
    items: [dish.uid], servings: 2, wantedDate: localDate(new Date().toISOString(), TZ), meal: 'dinner', note: '少放糖',
  }, tokens[1]).state;
  storage.set(STATE_KEY, JSON.stringify(state));
  storage.set('pk.token', tokens[0]);
  return state;
}

let memory = null; // used when localStorage is unavailable
function load() {
  if (memory) return memory;
  try { const s = JSON.parse(storage.get(STATE_KEY)); if (s && Array.isArray(s.users)) return s; } catch {}
  return seed();
}
function save(state) {
  storage.set(STATE_KEY, JSON.stringify(state));
  if (storage.get(STATE_KEY) === null) memory = state;
}
// Seed on load so the demo member's token is in place before the app reads it.
if (storage.get(STATE_KEY) === null) {
  const fresh = seed();
  if (storage.get(STATE_KEY) === null) memory = fresh;
}

let resetting = false;
export function resetDemo() {
  resetting = true; // a call still in flight must not sign the fresh demo member out
  for (const k of Object.keys(window.localStorage || {})) if (k.startsWith('pk.')) storage.remove(k);
  window.location.reload();
}

export function getApiBase() { return ''; }

export async function call(action, payload, token) {
  await new Promise((r) => setTimeout(r, 120));
  if (resetting) return new Promise(() => {});
  if (action === 'me.testPush') throw new ApiError('BAD_INPUT', '演示版不发真推送；正式版会推送到你的微信', 400);
  const r = run(load(), action, payload, token);
  save(r.state);
  if (!r.body.ok) throw new ApiError(r.body.error.code, r.body.error.message, r.status);
  return r.body.data;
}

export async function postAi() {
  throw new ApiError('UPSTREAM', '演示版不调用 AI', 502);
}
