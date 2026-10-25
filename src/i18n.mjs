// Build-time language switch. Templates wrap every Chinese string in t(); when rendering English, a missing
// translation stops the build instead of leaking Chinese onto the English page.
import { EN } from './en.mjs';
import * as ZH_DATA from '../data/content.js';
import * as EN_DATA from '../data/content.en.js';
import * as ZH_PLACES from '../data/places.js';
import * as EN_PLACES from '../data/places.en.js';

let lang = 'zh';
export const setLang = l => { lang = l; };
export const getLang = () => lang;
export const isEn = () => lang === 'en';

export function t(zh) {
  if (lang === 'zh') return zh;
  const en = EN[zh];
  if (en === undefined) throw new Error(`no English for: ${zh}`);
  return en;
}

export const data = () => (lang === 'en' ? EN_DATA : ZH_DATA);
export const places = () => (lang === 'en' ? EN_PLACES : ZH_PLACES);
