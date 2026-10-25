// English twin of data/places.js, loaded through the English page's import map. Where the player has been. `year` is the year each country was first visited (confirmed by Yiming).
export const COUNTRIES = [
  { id: 'cn', name: 'China', year: 2019, cities: ['南京', '北京', '烟台', '连云港', '常熟', '西安'] },
  { id: 'fr', name: 'France', year: 2019, cities: ['巴黎', '里昂', '马赛', '尼斯', '戛纳'] },
  { id: 'va', name: 'Vatican City', year: 2019, cities: ['梵蒂冈'] },
  { id: 'mc', name: 'Monaco', year: 2019, cities: ['摩纳哥'] },
  { id: 'it', name: 'Italy', year: 2019, cities: ['罗马', '米兰', '热那亚', '威尼斯', '阿马尔菲'] },
  { id: 'nl', name: 'Netherlands', year: 2023, cities: ['阿姆斯特丹', '阿尔梅勒', '埃因霍芬', '哈勒姆', '海牙', '莱顿', '鹿特丹', '米德尔堡', '乌得勒支', '代尔夫特'] },
  { id: 'at', name: 'Austria', year: 2023, cities: ['维也纳'] },
  { id: 'be', name: 'Belgium', year: 2023, cities: ['布鲁塞尔'] },
  { id: 'cz', name: 'Czechia', year: 2023, cities: ['布拉格'] },
  { id: 'mm', name: 'Myanmar', year: 2023, cities: ['孟邦'] },
  { id: 'de', name: 'Germany', year: 2024, cities: ['柏林', '杜塞尔多夫', '科隆', '慕尼黑'] },
  { id: 'es', name: 'Spain', year: 2024, cities: ['巴塞罗那'] },
  { id: 'gr', name: 'Greece', year: 2024, cities: ['雅典'] },
  { id: 'gb', name: 'United Kingdom', year: 2024, cities: ['伦敦', '剑桥'] },
  { id: 'us', name: 'United States', year: 2025, cities: ['亚特兰大', '纽约', '华盛顿'] },
  { id: 'jp', name: 'Japan', year: 2025, cities: ['大阪', '东京', '京都'] },
  { id: 'dk', name: 'Denmark', year: 2025, cities: ['哥本哈根'] },
  { id: 'fi', name: 'Finland', year: 2025, cities: ['赫尔辛基'] },
  { id: 'mt', name: 'Malta', year: 2025, cities: ['马耳他'] },
  { id: 'no', name: 'Norway', year: 2025, cities: ['奥斯陆'] },
  { id: 'sg', name: 'Singapore', year: 2026, cities: ['新加坡'] },
  { id: 'ie', name: 'Ireland', year: 2026, cities: ['都柏林'] },
  { id: 'my', name: 'Malaysia', year: 2026, cities: ['槟城'] },
  { id: 'pt', name: 'Portugal', year: 2026, cities: ['法鲁', '里斯本'] },
  { id: 'th', name: 'Thailand', year: 2026, cities: ['普吉'] },
  { id: 'vn', name: 'Vietnam', year: 2026, cities: ['河内'] },
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

// City keys stay Chinese (they index the map coordinates); these are the names shown.
export const CITY_LABEL = {"南京": "Nanjing", "北京": "Beijing", "烟台": "Yantai", "连云港": "Lianyungang", "常熟": "Changshu", "西安": "Xi'an", "巴黎": "Paris", "里昂": "Lyon", "马赛": "Marseille", "尼斯": "Nice", "戛纳": "Cannes", "梵蒂冈": "Vatican City", "摩纳哥": "Monaco", "罗马": "Rome", "米兰": "Milan", "热那亚": "Genoa", "威尼斯": "Venice", "阿马尔菲": "Amalfi", "阿姆斯特丹": "Amsterdam", "阿尔梅勒": "Almere", "埃因霍芬": "Eindhoven", "哈勒姆": "Haarlem", "海牙": "The Hague", "莱顿": "Leiden", "鹿特丹": "Rotterdam", "米德尔堡": "Middelburg", "乌得勒支": "Utrecht", "代尔夫特": "Delft", "维也纳": "Vienna", "布鲁塞尔": "Brussels", "布拉格": "Prague", "孟邦": "Mon State", "柏林": "Berlin", "杜塞尔多夫": "Düsseldorf", "科隆": "Cologne", "慕尼黑": "Munich", "巴塞罗那": "Barcelona", "雅典": "Athens", "伦敦": "London", "剑桥": "Cambridge", "亚特兰大": "Atlanta", "纽约": "New York", "华盛顿": "Washington", "大阪": "Osaka", "东京": "Tokyo", "京都": "Kyoto", "哥本哈根": "Copenhagen", "赫尔辛基": "Helsinki", "马耳他": "Malta", "奥斯陆": "Oslo", "新加坡": "Singapore", "都柏林": "Dublin", "槟城": "Penang", "法鲁": "Faro", "里斯本": "Lisbon", "普吉": "Phuket", "河内": "Hanoi"};

const pinned = new Set(PINS.map(p => p.city));
export const DOTS = COUNTRIES.flatMap(c => c.cities.filter(city => !pinned.has(city)).map(city => ({ city, countryId: c.id })));
