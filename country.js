/* =========================================================
   🏳️ My Country — questions about the child's own country (chosen in ⚙️ Settings)
   and local spelling (colour, favourite, maths …) on screen.
   Rows use the GK format: [level, question, right answer, wrong answers…].
   Levels: 1 money, emergency number, symbols · 2 capital, flag, national day, coins
           3 states/provinces, leaders, neighbours, oceans · 4 mountains, rivers, state capitals
   ========================================================= */
const formatLocalMoney = (id, n) => {
  if (id === 'in') return '₹' + (n / 100);
  const symbol = id === 'uk' ? '£' : id === 'ie' ? '€' : '$';
  const small = id === 'uk' ? 'p' : ['au', 'nz', 'ie'].includes(id) ? 'c' : '¢';
  return n < 100 ? String(n) + small : symbol + (n / 100).toFixed(2);
};
const COUNTRIES = Object.fromEntries(
  Object.entries(ContentData.get('country', 'COUNTRIES')).map(([id, data]) =>
    [id, {...data, fmt: n => formatLocalMoney(id, n)}])
);
const COUNTRY_ORDER = ['us', 'uk', 'ca', 'au', 'nz', 'in', 'ie'];
// first guess from the device language (en-GB → uk …); a grown-up can change it in Settings
function guessCountry() {
  const r = ((navigator.language || '').split('-')[1] || '').toLowerCase();
  return { us: 'us', gb: 'uk', ca: 'ca', au: 'au', nz: 'nz', in: 'in', ie: 'ie' }[r] || 'us';
}
const myCountry = () => (state.country === 'other' ? null : COUNTRIES[state.country || guessCountry()] || null);
const countryCode = () => (state.country === 'other' ? 'other' : COUNTRIES[state.country] ? state.country : guessCountry());

function countryRows(C) {
  const rows = C.rows.slice(), regionQ = C.regionOf || `Which one is a ${C.region} of ${C.name}?`;
  const otherRegions = Object.values(COUNTRIES).filter((x) => x !== C).flatMap((x) => x.regions.map((r) => r[0]));
  for (const [r, cap] of C.regions) {
    rows.push([3, regionQ, r, ...sample(otherRegions.filter((x) => !C.regions.some((y) => y[0] === x)), 3)]);
    if (cap) {
      const wrong = [...new Set(C.regions.map((y) => y[1]).filter((y) => y && y !== cap))];
      rows.push([4, `What is the capital of ${r}?`, cap, ...sample(wrong, 3)]);
    }
  }
  return rows;
}
function genCountry(level) {
  const C = myCountry() || COUNTRIES.us;
  // Money is practised by counting (Number Sense), never by naming which coin or note a picture shows.
  if (level <= 2 && Math.random() < 0.15) {
    const others = sample(COUNTRY_ORDER.filter((k) => COUNTRIES[k] !== C), level >= 2 ? 3 : 2).map((k) => COUNTRIES[k].flag);
    const q = `Which flag is the flag of ${C.name}?`;
    return { key: `home-flag-${C.name}`, text: q, say: q, main: '', mainClass: 'empty', options: shuffle([C.flag, ...others]).map((f) => ({ v: f, html: f })), answer: C.flag, optClass: 'opt-emoji', hint: { html: '', say: 'Think about it!', remove: true } };
  }
  const q = mcQuestion('home', pickLevelled(countryRows(C), level), level);
  q.key += '-' + q.answer;     // one question text ("Which one is a state…?") has many answers
  return q;
}

/* ---------- local spelling on screen (the voice is the same) ---------- */
const BRIT = { color: 'colour', colors: 'colours', colored: 'coloured', coloring: 'colouring', colorful: 'colourful', favorite: 'favourite', favorites: 'favourites',
  gray: 'grey', center: 'centre', neighbor: 'neighbour', neighbors: 'neighbours', theater: 'theatre' };
const MATHS = new Set(['uk', 'au', 'nz', 'ie', 'in']);
function locText(t) {
  const cc = countryCode();
  if (cc === 'us' || cc === 'other') return t;
  t = t.replace(/(^|[^\w-])([Cc]olou?r(?:s|ed|ing|ful)?|[Ff]avorites?|[Gg]ray|[Cc]enter|[Nn]eighbors?|[Tt]heater)(?![\w-])/g, (m, pre, w) => {
    const low = w.toLowerCase(), b = BRIT[low]; if (!b) return m;
    return pre + (w[0] === w[0].toUpperCase() ? b[0].toUpperCase() + b.slice(1) : b);
  });
  if (MATHS.has(cc)) t = t.replace(/(^|[^\w-])Math(?![\w-])/g, '$1Maths');
  return t;
}
// only the text between tags, never class names or attributes
const locHTML = (h) => ('>' + (h || '') + '<').replace(/>([^<]+)</g, (m, t) => '>' + locText(t) + '<').slice(1, -1);
