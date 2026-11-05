/* =========================================================
   🏘️ Our Community · 🗺️ My State / Province / Nation / Region · extra science units
   Social studies for 1st–3rd grade in every supported country: needs and wants,
   goods and services, rules and laws, citizenship, money choices, map skills,
   timelines, and who leads the town, the state or province, and the country.
   The region pack follows the region a grown-up picks in Settings: capitals for every
   region, and deeper packs for Michigan, Ontario, the four UK nations and more.
   For India, Science and Our Community are shown as EVS.
   ========================================================= */
const W23 = (k) => ContentData.get('world23', k);
const w23Say = (q) => (typeof CLIPS !== 'undefined' && CLIPS[clipKey(q)] ? q : 'Find the answer!');
const w23MC = (prefix, row, level) => { const q = mcQuestion(prefix, row, level); q.say = w23Say(q.text); return q; };
const REGION_WORD = { us: 'State', ca: 'Province', uk: 'Nation', au: 'State', nz: 'Region', in: 'State', ie: 'Province' };

function w23Compass() {
  // a 3 × 3 map: places sit in cells; ask the direction between two in the same row or column
  const places = shuffle([['🏫', 'school'], ['🌳', 'park'], ['🏠', 'house'], ['🏪', 'shop'], ['📚', 'library'], ['🏥', 'hospital'], ['⛲', 'fountain']]).slice(0, 5);
  const cells = shuffle([...Array(9).keys()]).slice(0, 5);
  const at = places.map((p, i) => ({ p, r: Math.floor(cells[i] / 3), c: cells[i] % 3 }));
  const pairs = [];
  for (const a of at) for (const b of at) if (a !== b && (a.r === b.r || a.c === b.c)) pairs.push([a, b]);
  if (!pairs.length) return null;
  const [a, b] = pick(pairs);
  const dir = a.r === b.r ? (a.c > b.c ? 'east' : 'west') : (a.r > b.r ? 'south' : 'north');
  const grid = Array.from({ length: 9 }, (_, i) => { const hit = at.find((x) => x.r * 3 + x.c === i); return `<span>${hit ? hit.p[0] : ''}</span>`; }).join('');
  return { key: `com-dir-${a.p[1]}-${b.p[1]}-${dir}`, text: `The ${a.p[0]} ${a.p[1]} is which direction from the ${b.p[0]} ${b.p[1]}?`, say: 'Which direction is it?',
    main: `<div class="w23-map"><div class="w23-grid">${grid}</div><div class="w23-rose" aria-label="Compass rose"><b class="n">N</b><b class="e">E</b><b class="s">S</b><b class="w">W</b><i>✦</i></div></div>`,
    mainClass: 'ph-main', answer: dir, optClass: 'opt-text', options: ['north', 'south', 'east', 'west'].map((v) => ({ v, html: v })),
    hint: { html: '<div class="hint-note">North is up. South is down. East is right. West is left.</div>', say: 'North is up!' } };
}
function w23Key() {
  const key = shuffle([['▲', 'mountain'], ['〰️', 'river'], ['■', 'school'], ['●', 'city'], ['✚', 'hospital'], ['🌲', 'forest']]).slice(0, 4);
  const [sym, meaning] = pick(key);
  return { key: `com-key-${sym}`, text: `On this map key, what does <b>${sym}</b> stand for?`, say: 'What does this symbol stand for?',
    main: `<div class="w23-key"><b>Map key</b>${key.map(([s, m]) => `<div><span>${s}</span> ${m}</div>`).join('')}</div>`, mainClass: 'ph-main',
    answer: meaning, optClass: 'opt-text', options: shuffle(key.map((k) => k[1])).map((v) => ({ v, html: v })), hint: { html: '', say: 'Look at the map key!', remove: true } };
}
function w23Timeline() {
  const events = pick(W23('TIMELINES')), [i, j] = sample([0, 1, 2, 3], 2).sort((a, b) => a - b);
  const pair = shuffle([events[i], events[j]]);
  return { key: `com-time-${events[i]}-${events[j]}`, text: 'Which happened first?', say: 'Which happened first?', main: '', mainClass: 'empty',
    answer: events[i], optClass: 'opt-text gp-long', options: pair.map((v) => ({ v, html: v })), hint: { html: '', say: 'Think about it!', remove: true } };
}
function genCommunity(level) {
  const t = Math.random(), cc = typeof countryCode === 'function' ? countryCode() : 'us', gov = W23('GOV')[cc] || W23('GOV').us;
  if (t < 0.18) { const q = w23Compass(); if (q) return q; }
  if (t < 0.3) return w23Key();
  if (t < 0.42) return w23Timeline();
  if (level >= 2 && t < 0.62) { const [q, ...rest] = pick(gov); return w23MC(`com-gov-${cc}`, [level, q, ...rest], level); }
  return w23MC('com', pickLevelled(W23('COMMUNITY'), level), level);
}

/* ---------- My State / Province / Nation / Region ---------- */
function myRegion() {
  const C = typeof myCountry === 'function' && myCountry();
  if (!C || !C.regions || !C.regions.length) return null;
  return C.regions.find((r) => r[0] === state.region) || C.regions[0];
}
function genRegion(level) {
  const C = myCountry() || COUNTRIES.us, R0 = myRegion(), word = (C.region || 'state').split(' ')[0];
  const facts = (W23('REGION_FACTS')[R0[0]] || []).filter((r) => r[0] <= level);
  const withCap = C.regions.filter((r) => r[1]);
  const t = Math.random();
  if (facts.length && t < 0.55) return w23MC(`reg-${R0[0]}`, pickLevelled(facts, level), level);
  if (R0[1] && t < 0.7) {
    const wrong = sample([...new Set(withCap.map((r) => r[1]).filter((x) => x !== R0[1]))], 3);
    return w23MC(`reg-cap-${R0[0]}`, [level, `What is the capital of ${R0[0]}?`, R0[1], ...wrong], level);
  }
  if (level >= 2 && withCap.length >= 4 && t < 0.88) {
    const r = pick(withCap), wrong = sample([...new Set(withCap.map((x) => x[1]).filter((x) => x !== r[1]))], 3);
    return w23MC(`reg-ocap-${r[0]}`, [level, `What is the capital of ${r[0]}?`, r[1], ...wrong], level);
  }
  const other = Object.values(COUNTRIES).filter((x) => x !== C).flatMap((x) => x.regions.map((r) => r[0]));
  const right = pick(C.regions)[0];
  return w23MC(`reg-is-${right}`, [level, `Which one is a ${word} of ${C.name}?`, right, ...sample(other.filter((x) => !C.regions.some((r) => r[0] === x)), 3)], level);
}

/* ---------- Science: grade 2–3 units (matter, plants, habitats, landforms, forces, life cycles,
   traits, fossils, weather and climate, hazards) mixed into Science ---------- */
function genSciencePlus(level) {
  if (level >= 2 && Math.random() < 0.38) return w23MC('sci23', pickLevelled(W23('SCIENCE23'), level), level);
  return genScience(level);
}

/* ---------- names that change with the country ---------- */
function localTileTitle(id, title) {
  const cc = typeof countryCode === 'function' ? countryCode() : 'us';
  if (id === 'region') return `My ${REGION_WORD[cc] || 'State'}`;
  if (cc === 'in' && id === 'sci') return 'EVS · Science';
  if (cc === 'in' && id === 'community') return 'EVS · Our World';
  return title;
}
