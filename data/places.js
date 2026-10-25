// Where the player has been. `year` is the year each country was first visited (confirmed by Yiming).
export const COUNTRIES = [
  { id: 'cn', name: '中国', year: 2019, cities: ['南京', '北京', '烟台', '连云港', '常熟', '西安'] },
  { id: 'fr', name: '法国', year: 2019, cities: ['巴黎', '里昂', '马赛', '尼斯', '戛纳'] },
  { id: 'va', name: '梵蒂冈', year: 2019, cities: ['梵蒂冈'] },
  { id: 'mc', name: '摩纳哥', year: 2019, cities: ['摩纳哥'] },
  { id: 'it', name: '意大利', year: 2019, cities: ['罗马', '米兰', '热那亚', '威尼斯', '阿马尔菲'] },
  { id: 'nl', name: '荷兰', year: 2023, cities: ['阿姆斯特丹', '阿尔梅勒', '埃因霍芬', '哈勒姆', '海牙', '莱顿', '鹿特丹', '米德尔堡', '乌得勒支', '代尔夫特'] },
  { id: 'at', name: '奥地利', year: 2023, cities: ['维也纳'] },
  { id: 'be', name: '比利时', year: 2023, cities: ['布鲁塞尔'] },
  { id: 'cz', name: '捷克', year: 2023, cities: ['布拉格'] },
  { id: 'mm', name: '缅甸', year: 2023, cities: ['孟邦'] },
  { id: 'de', name: '德国', year: 2024, cities: ['柏林', '杜塞尔多夫', '科隆', '慕尼黑'] },
  { id: 'es', name: '西班牙', year: 2024, cities: ['巴塞罗那'] },
  { id: 'gr', name: '希腊', year: 2024, cities: ['雅典'] },
  { id: 'gb', name: '英国', year: 2024, cities: ['伦敦', '剑桥'] },
  { id: 'us', name: '美国', year: 2025, cities: ['亚特兰大', '纽约', '华盛顿'] },
  { id: 'jp', name: '日本', year: 2025, cities: ['大阪', '东京', '京都'] },
  { id: 'dk', name: '丹麦', year: 2025, cities: ['哥本哈根'] },
  { id: 'fi', name: '芬兰', year: 2025, cities: ['赫尔辛基'] },
  { id: 'mt', name: '马耳他', year: 2025, cities: ['马耳他'] },
  { id: 'no', name: '挪威', year: 2025, cities: ['奥斯陆'] },
  { id: 'sg', name: '新加坡', year: 2026, cities: ['新加坡'] },
  { id: 'ie', name: '爱尔兰', year: 2026, cities: ['都柏林'] },
  { id: 'my', name: '马来西亚', year: 2026, cities: ['槟城'] },
  { id: 'pt', name: '葡萄牙', year: 2026, cities: ['法鲁', '里斯本'] },
  { id: 'th', name: '泰国', year: 2026, cities: ['普吉'] },
  { id: 'vn', name: '越南', year: 2026, cities: ['河内'] },
];

// Big pins open an archive card. `year` is when the city joins the timeline.
export const PINS = [
  { id: 'nanjing', city: '南京', countryId: 'cn', year: 2019, photo: 'xuanwu', chapter: 'novice' },
  { id: 'amalfi', city: '阿马尔菲', countryId: 'it', year: 2019, photo: 'amalfi', chapter: 'abroad' },
  { id: 'amsterdam', city: '阿姆斯特丹', countryId: 'nl', year: 2023, photo: 'graduation', chapter: 'abroad' },
  { id: 'changshu', city: '常熟', countryId: 'cn', year: 2024, chapter: 'quest' },
  { id: 'yantai', city: '烟台', countryId: 'cn', year: 2024, photo: 'weibo-yantai', chapter: 'quest' },
  { id: 'lianyungang', city: '连云港', countryId: 'cn', year: 2024, photo: 'lianyungang', chapter: 'quest' },
  { id: 'barcelona', city: '巴塞罗那', countryId: 'es', year: 2024, photo: 'xhs-top', chapter: 'abroad' },
  { id: 'middelburg', city: '米德尔堡', countryId: 'nl', year: 2025, photo: 'middelburg', chapter: 'abroad' },
  { id: 'beijing', city: '北京', countryId: 'cn', year: 2025, photo: 'douyin-lobby', chapter: 'quest' },
  { id: 'atlanta', city: '亚特兰大', countryId: 'us', year: 2025, chapter: 'exchange' },
  { id: 'xian', city: '西安', countryId: 'cn', year: 2026, chapter: 'quest' },
  { id: 'singapore', city: '新加坡', countryId: 'sg', year: 2026, chapter: 'now' },
];

// Display names for cities; the Chinese page shows the key itself.
export const CITY_LABEL = {};

const pinned = new Set(PINS.map(p => p.city));
export const DOTS = COUNTRIES.flatMap(c => c.cities.filter(city => !pinned.has(city)).map(city => ({ city, countryId: c.id })));
