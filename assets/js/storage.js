// localStorage can be missing or throw (private mode, WeChat quirks); fall back to memory for this visit.
export function makeStore(backing) {
  const memory = new Map();
  return {
    get(key) {
      try { const v = backing?.getItem(key); if (v != null) return v; } catch {}
      return memory.has(key) ? memory.get(key) : null;
    },
    set(key, value) {
      memory.set(key, String(value));
      try { backing?.setItem(key, String(value)); } catch {}
    },
  };
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export const store = makeStore(browserStorage());
