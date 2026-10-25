// "4310 万" → {num: 4310, decimals: 0, prefix: '', suffix: ' 万'}; text without a leading number is not counted.
export function parseCount(value) {
  const m = /^(\D*?)(\d+(?:\.\d+)?)(.*)$/.exec(String(value));
  if (!m || m[1]) return null;
  const [, prefix, digits, suffix] = m;
  return { num: Number(digits), decimals: (digits.split('.')[1] ?? '').length, prefix, suffix };
}

// The value shown at progress t (0..1) of the count-up; at t >= 1 it is exactly the original text.
export function frame(value, t) {
  const p = parseCount(value);
  if (!p || t >= 1) return String(value);
  const eased = 1 - Math.pow(1 - Math.max(0, t), 3);
  return p.prefix + (p.num * eased).toFixed(p.decimals) + p.suffix;
}
