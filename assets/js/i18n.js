// Runtime language: the page's <html lang>. Scripts pick their few built-in strings with L(chinese, english).
export const EN = typeof document !== 'undefined' && document.documentElement.lang === 'en';
export const L = (zh, en) => (EN ? en : zh);
