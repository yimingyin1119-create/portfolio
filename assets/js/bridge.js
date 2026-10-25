// One problem written three ways. How far verification lags decides what each audience hears.
// Example warning lines, same defaults as the workbench: lag ≤ 8pp is normal, ≤ 18pp needs attention, beyond that is serious.
// No DOM access at the top level: the page builder imports LEVELS to render the default state.
export const TIME_P = 45.9;
export const LEVELS = [
  { max: 8, key: 'ok', name: '正常',
    subj: '核销进度正常',
    mail: n => n === 0 ? '核销进度和时间进度基本持平，领取和核销都正常。周五照常同步数据。' : `核销比时间进度慢 ${n} 个百分点，在正常波动范围内，主要是文旅消费集中在周末。按现在的节奏，活动结束前能追平，周五照常同步数据。`,
    tech: [['动作', '暂不新增需求，保持日报口径'], ['关注', '周末核销峰值是否正常'], ['时间', '周五复盘一次']],
    say: '满 200 减 50，周五到周日能用。',
    rules: [['时机', '按原排期发布'], ['画面', '带上领券入口'], ['别说', '「全网最低」']] },
  { max: 18, key: 'warn', name: '需关注',
    subj: '核销进度说明与下一步',
    mail: n => `领取正常，核销慢了约 ${n} 个百分点，主要因为文旅消费集中在周末、部分商家不熟悉核销。我们已逐家回访商家并加了到期提醒，周五前给您一版新预估。`,
    tech: [['触发', '券到期前 48 小时'], ['人群', '已支付、未核销的用户'], ['内容', '推送一次提醒，带券面额和门店入口'], ['上线', '周五 18:00 前'], ['埋点', '区分推送进入和自然进入'], ['验收', '次日看核销率变化']],
    say: '满 200 减 50，周五到周日能用。券快到期了，领了记得用。',
    rules: [['时机', '周五直播口播一次'], ['画面', '带上领券入口'], ['别说', '「全网最低」']] },
  { max: 100, key: 'bad', name: '严重滞后',
    subj: '核销严重滞后，请确认调整方案',
    mail: n => `核销落后约 ${n} 个百分点，按现在的速度，活动结束时只能用掉约 ${Math.round((TIME_P - n) / TIME_P * 100)}% 的资金。建议两项调整：下一批券有效期从 7 天延到 14 天，预算向核销高的商家倾斜。今天下班前给您完整方案，需要您确认。`,
    tech: [['触发', '立即一次，到期前 48 小时再一次'], ['人群', '已领券未下单、已支付未核销的用户'], ['内容', '推送提醒，带券面额、门店入口和新有效期'], ['配置', '下一批券有效期 7 天改为 14 天'], ['上线', '明天 12:00 前'], ['验收', '每天看核销率，连续对比 3 天']],
    say: '满 200 减 50，这周末就能用。券马上过期，领了的赶紧用起来。',
    rules: [['时机', '周五晚加一场专场直播'], ['画面', '领券入口全程挂在直播间'], ['别说', '「全网最低」「最后一次」']] },
];
export const LEVELS_EN = [
  { max: 8, key: 'ok', name: 'On track',
    subj: 'Redemption on track',
    mail: n => n === 0 ? 'Redemption is keeping pace with the timeline; claims and redemptions both look normal. Usual data update on Friday.' : `Redemption is ${n} points behind the timeline, within the normal range: tourism spending bunches at weekends. At this pace we will catch up before the end. Usual data update on Friday.`,
    tech: [['Action', 'No new requests; keep the daily report as is'], ['Watch', 'Whether the weekend redemption peak looks normal'], ['When', 'Review on Friday']],
    say: '¥50 off every ¥200, valid Friday to Sunday.',
    rules: [['When', 'Publish as scheduled'], ['On screen', 'Show the voucher link'], ['Don’t say', '“Lowest price anywhere”']] },
  { max: 18, key: 'warn', name: 'Needs attention',
    subj: 'Redemption update and next steps',
    mail: n => `Claims are normal, but redemption is about ${n} points behind, mainly because tourism spending bunches at weekends and some merchants are new to redeeming. We have called every merchant and added expiry reminders, and will send you a new forecast before Friday.`,
    tech: [['Trigger', '48 hours before the voucher expires'], ['Audience', 'Users who paid but have not redeemed'], ['Content', 'One reminder push with the voucher value and store link'], ['Ship', 'By 18:00 Friday'], ['Tracking', 'Separate push visits from organic visits'], ['Check', 'Next day, compare redemption rates']],
    say: '¥50 off every ¥200, valid Friday to Sunday. Your voucher’s about to expire, so use it if you’ve got one.',
    rules: [['When', 'One mention in Friday’s livestream'], ['On screen', 'Show the voucher link'], ['Don’t say', '“Lowest price anywhere”']] },
  { max: 100, key: 'bad', name: 'Seriously behind',
    subj: 'Redemption seriously behind: please confirm changes',
    mail: n => `Redemption is about ${n} points behind. At this rate only about ${Math.round((TIME_P - n) / TIME_P * 100)}% of the budget will be used by the end. We suggest two changes: extend the next batch’s validity from 7 to 14 days, and shift budget towards merchants with high redemption. Full plan by end of day today; we need your sign-off.`,
    tech: [['Trigger', 'Once now, again 48 hours before expiry'], ['Audience', 'Users who claimed but did not order, and those who paid but did not redeem'], ['Content', 'Reminder push with voucher value, store link and new validity'], ['Config', 'Next batch: validity from 7 to 14 days'], ['Ship', 'By 12:00 tomorrow'], ['Check', 'Daily redemption rate, compared over 3 days']],
    say: '¥50 off every ¥200, good this weekend. Vouchers expire soon, so if you’ve claimed one, use it now.',
    rules: [['When', 'An extra dedicated livestream on Friday night'], ['On screen', 'Voucher link pinned for the whole stream'], ['Don’t say', '“Lowest price anywhere”, “last chance”']] },
];
// `en` defaults to the page language in the browser; the page builder passes it explicitly.
const pageIsEn = () => typeof document !== 'undefined' && document.documentElement.lang === 'en';
export const levelFor = (n, en = pageIsEn()) => { const set = en ? LEVELS_EN : LEVELS; return set.find(l => n <= l.max) ?? set[set.length - 1]; };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const techRows = L => L.tech.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
export const cueRules = L => L.rules.map(([k, v]) => `<li><b>${esc(k)}</b>${esc(v)}</li>`).join('');

export function initBridge() {
  const root = document.getElementById('bridge');
  const gap = root?.querySelector('#gap');
  if (!gap) return;
  const $ = s => root.querySelector(s);
  const trio = $('.trio');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = '';
  const render = () => {
    const n = Number(gap.value), L = levelFor(n);
    $('#gapOut').textContent = pageIsEn() ? `${n} points` : `${n} 个百分点`;
    $('#lvl').textContent = L.name; $('#lvl').dataset.s = L.key;
    $('#mailSubj').textContent = L.subj; $('#mailBody').textContent = L.mail(n);
    $('#techRows').innerHTML = techRows(L);
    $('#cueSay').textContent = L.say;
    $('#cueRules').innerHTML = cueRules(L);
    gap.setAttribute('aria-valuetext', pageIsEn() ? `${n} points behind, ${L.name}` : `落后 ${n} 个百分点，${L.name}`);
    if (last && last !== L.key && !reduce) { trio.classList.remove('flash'); void trio.offsetWidth; trio.classList.add('flash'); }
    last = L.key;
  };
  gap.addEventListener('input', render);
  render();
}
