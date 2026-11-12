/* First measuring and first science for Pre-K and Kindergarten (data/early.json).
   Big & Small: which one is bigger, smaller, the biggest, the smallest; then taller, longer, heavier.
   Liquid or Solid?: sort a pictured thing, then find the liquid or the solid among three pictures.
   Every card is a picture card: the answers are pictures and the words are spoken. */
const EarlyLearning = (() => {
  const SIZE = ContentData.get('early', 'size'), MATTER = ContentData.get('early', 'matter');
  const pic = (e, scale) => `<span class="sz-pic" style="--sz:${scale}">${e}</span>`;
  // clearly different sizes: a child should never have to squint
  const SCALES2 = [[0.5, 1], [0.45, 0.85], [0.6, 1.05]], SCALES3 = [[0.42, 0.7, 1.05], [0.4, 0.66, 1]];
  // each choice has its own value (thing and size), so two cards with different pictures are never taken for the same card
  const optPics = (pics, id) => shuffle(pics.map((p, i) => ({ v: id + ':' + i, html: p })));
  const sideBySide = (pics, note) => `<div class="hint-note sz-hint">${note}<div class="sz-row">${pics.join('')}</div></div>`;

  // two or three pictures of the same thing; tap the bigger / smaller / biggest / smallest
  function sizeCard(level) {
    const three = level >= 2, e = pick(SIZE.things), scales = pick(three ? SCALES3 : SCALES2), big = Math.random() < 0.5;
    const pics = scales.map((s) => pic(e, s)), want = big ? scales.length - 1 : 0;
    const word = three ? (big ? 'biggest' : 'smallest') : (big ? 'bigger' : 'smaller');
    const ask = three ? `Which one is the ${word}?` : `Which one is ${word}?`;
    return {
      key: `size-${three ? 3 : 2}-${e}-${word}-${scales.join('_')}`, text: ask.replace(word, `<b>${word}</b>`), say: ask,
      main: '', mainClass: 'empty', options: optPics(pics, e + scales.join('_')), answer: e + scales.join('_') + ':' + want, optClass: 'opt-emoji sz-opts' + (three ? ' three' : ''),
      hint: { html: sideBySide(pics, big ? '⬆️ big' : '⬇️ small'), say: big ? 'Look for the big one!' : 'Look for the small one!' },
    };
  }
  // taller or shorter: the same thing drawn at two heights, standing on the same ground
  function tallCard() {
    const e = pick(SIZE.tall), scales = pick(SCALES2), tall = Math.random() < 0.5, pics = scales.map((s) => pic(e, s));
    const word = tall ? 'taller' : 'shorter';
    return {
      key: `size-tall-${e}-${word}-${scales.join('_')}`, text: `Which one is <b>${word}</b>?`, say: `Which one is ${word}?`,
      main: '', mainClass: 'empty', options: optPics(pics, e + scales.join('_')), answer: e + scales.join('_') + ':' + (tall ? 1 : 0), optClass: 'opt-emoji sz-opts',
      hint: { html: sideBySide(pics, tall ? '⬆️ tall' : '⬇️ short'), say: tall ? 'Look for the tall one!' : 'Look for the short one!' },
    };
  }
  // longer or shorter: two bars that start at the same line
  function longCard() {
    const [name, color] = pick(SIZE.long), lens = pick([[40, 90], [35, 75], [55, 100]]), long = Math.random() < 0.5;
    const bar = (w) => `<span class="sz-bar" style="--w:${w}%;--c:${color}"></span>`, word = long ? 'longer' : 'shorter';
    const pics = lens.map(bar);
    return {
      key: `size-long-${name}-${word}-${lens.join('_')}`, text: `Which one is <b>${word}</b>?`, say: `Which one is ${word}?`,
      main: '', mainClass: 'empty', options: optPics(pics, name + lens.join('_')), answer: name + lens.join('_') + ':' + (long ? 1 : 0), optClass: 'opt-emoji sz-opts sz-bars',
      hint: { html: `<div class="hint-note sz-hint">${long ? '➡️ long' : '⬅️ short'}<div class="sz-stack">${pics.join('')}</div></div>`, say: long ? 'Look for the long one!' : 'Look for the short one!' },
    };
  }
  // heavier or lighter: two real things a child knows (an elephant and a mouse), drawn the same size
  function heavyCard() {
    const [h, l] = pick(SIZE.heavy), heavy = Math.random() < 0.5, word = heavy ? 'heavier' : 'lighter';
    const pics = [pic(l, 0.9), pic(h, 0.9)];
    return {
      key: `size-heavy-${h}-${l}-${word}`, text: `Which one is <b>${word}</b>?`, say: `Which one is ${word}?`,
      main: '', mainClass: 'empty', options: optPics(pics, h + l), answer: h + l + ':' + (heavy ? 1 : 0), optClass: 'opt-emoji sz-opts',
      hint: { html: `<div class="hint-note sz-hint"><div class="sz-seesaw"><span>${l}</span><i></i><span>${h}</span></div></div>`, say: 'Think about lifting each one.' },
    };
  }
  function genSize(level) {
    if (level <= 2) return sizeCard(level);
    const r = Math.random();
    return r < 0.34 ? tallCard() : r < 0.67 ? longCard() : heavyCard();
  }

  const KIND = { liquid: { icon: '💧', tell: 'A liquid flows and pours.' }, solid: { icon: '🧱', tell: 'A solid keeps its shape.' } };
  const kindOpt = (k) => ({ v: k, html: `<span class="mt-ico">${KIND[k].icon}</span><span class="mt-word">${k}</span>` });
  const rules = () => `<div class="hint-note mt-hint"><div><b>💧 liquid</b> flows and pours</div><div><b>🧱 solid</b> keeps its shape</div></div>`;
  // one pictured thing: is it a liquid or a solid?
  function sortCard() {
    const kind = Math.random() < 0.5 ? 'liquid' : 'solid', [name, e] = pick(MATTER[kind]);
    return {
      key: `matter-sort-${name}`, text: 'Is it a <b>liquid</b> or a <b>solid</b>?', say: [name, 'Is it a liquid or a solid?'],
      main: `<div class="mt-thing"><span class="mt-pic">${e}</span><span class="mt-name">${name.replace(/^(a|an|the) /, '')}</span></div>`,
      options: [kindOpt('liquid'), kindOpt('solid')], answer: kind, optClass: 'opt-text mt-opts two',
      explain: KIND[kind].tell, hint: { html: rules(), say: KIND[kind].tell },
    };
  }
  // three pictures: find the liquid (among solids) or the solid (among liquids)
  function findCard() {
    const kind = Math.random() < 0.5 ? 'liquid' : 'solid', other = kind === 'liquid' ? 'solid' : 'liquid';
    const right = pick(MATTER[kind]), wrong = shuffle(MATTER[other].slice()).slice(0, 2);
    const opts = shuffle([right, ...wrong].map(([name, e]) => ({ v: name, html: e })));
    return {
      key: `matter-find-${kind}-${right[0]}-${wrong.map((w) => w[0]).sort().join('+')}`, text: `Which one is a <b>${kind}</b>?`, say: `Which one is a ${kind}?`,
      main: '', mainClass: 'empty', options: opts, answer: right[0], optClass: 'opt-emoji',
      explain: KIND[kind].tell, hint: { html: rules(), say: KIND[kind].tell },
    };
  }
  const genMatter = (level) => (level <= 1 ? sortCard() : Math.random() < 0.3 ? sortCard() : findCard());
  return { genSize, genMatter, sizeLevels: SIZE.levels, matterLevels: MATTER.levels, spoken: () => Object.values(KIND).map((k) => k.tell) };
})();
/* A picture for every Pre-K and Kindergarten card. Cards that arrive with no picture get one here:
   - a bare sum (4 + 5, 10 − 7) gets counters on ten frames;
   - two written numbers get a number line with both marked;
   - a skip count gets one bundle per number (pairs for 2s, ten-rods for 10s);
   - a sentence or a fact gets a picture of what it is about, never of a word that is one of the choices.
   Interactive cards (matching, ordering, tapping, building, puzzles) are already pictures. */
const EarlyPictures = (() => {
  const P = ContentData.get('early', 'pictures');
  const EM = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
  const plain = (h) => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const pictured = (h) => /<img|<svg|class="[^"]*\b(obj|clock|shape|ep-|sz-bar)/.test(h) || EM.test(String(h).replace(/[●○·]/g, ''));
  const has = (q) => q.match || q.order || q.puzzle || q.tap || q.spell || q.build || q.letterPath || q.fillIn || q.passageFill || q.illustrated || q.body3d || q.lesson === 'intro' ||
    pictured(q.main || '') || (q.options || []).some((o) => pictured(o.html != null ? o.html : ''));
  let dict = null, all = null;   // all: every picture word; dict: without the words that are usually not things in a sentence
  const words = () => {
    if (dict) return dict;
    dict = new Map();
    const add = (rows) => { for (const r of rows || []) if (Array.isArray(r) && typeof r[0] === 'string' && typeof r[1] === 'string' && EM.test(r[1]) && !dict.has(r[0].toLowerCase())) dict.set(r[0].toLowerCase(), r[1]); };
    add(P.words);
    add(typeof W3 !== 'undefined' ? W3 : []); add(typeof W4 !== 'undefined' ? W4 : []);
    add(typeof EARLY_READY_PICTURE_WORDS !== 'undefined' ? EARLY_READY_PICTURE_WORDS : []);
    all = new Map(dict);
    for (const w of P.notNouns) dict.delete(w);
    return dict;
  };
  const frames = (cells) => { // cells: array of 'a' | 'b' | 'x' (crossed out), laid on ten frames
    const out = []; for (let i = 0; i < Math.max(10, Math.ceil(cells.length / 10) * 10); i += 10)
      out.push(`<div class="ep-tf">${Array.from({ length: 10 }, (_, j) => `<i class="${cells[i + j] || ''}"></i>`).join('')}</div>`);
    return `<div class="ep-frames">${out.join('')}</div>`;
  };
  const numberLine = (a, b) => { const max = Math.max(a, b) > 10 ? 20 : 10;
    return `<div class="ep-line${max > 10 ? ' long' : ''}">${Array.from({ length: max }, (_, i) => `<span class="${i + 1 === a || i + 1 === b ? 'on' : ''}">${i + 1}</span>`).join('')}</div>`; };
  const bundles = (by, shown, next = true) => `<div class="ep-bundles">${Array.from({ length: shown + (next ? 1 : 0) }, (_, i) =>
    `<span class="ep-bundle by${by}${next && i === shown ? ' next' : ''}">${by === 10 ? '' : Array.from({ length: by }, () => '<i></i>').join('')}</span>`).join('')}</div>`;
  const DET = /^(a|an|the|my|his|her|our|your|this|that|some|no|one|two|three|four|five|six|seven|eight|nine|ten|many|\d+)$/;
  function about(q) {
    const text = (plain(q.text) + ' ' + plain(q.main) + ' ' + plain(q.readQ)).toLowerCase(), d = words();
    const taken = new Set((q.options || []).map((o) => plain(o.html != null ? o.html : o.v).toLowerCase()).concat(String(q.answer).toLowerCase()));
    const topic = (rows) => { for (const [needle, e] of rows) if (new RegExp('\\b' + needle + '\\b').test(text) && !taken.has(needle)) return e; return ''; };
    const first = topic(P.topics); if (first) return first;
    const toks = text.replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      const w = toks[i], single = w.replace(/(es|s)$/, ''), prev = toks[i - 1] || '';
      for (const [form, plural] of [[w, false], [single, true]]) {
        if (!d.has(form) || taken.has(form) || taken.has(w)) continue;
        if (plural && form === w) continue;
        if (plural || DET.test(prev) || P.words.some((r) => r[0] === w)) return d.get(form);
      }
    }
    const last = topic(P.fallback); if (last) return last;
    return '';
  }
  function add(q) {
    if (!q || has(q)) return q;
    const key = String(q.key || '').replace(/^chk-/, ''); let m, extra = '';
    if ((m = /^add-(\d+)-(\d+)$/.exec(key)) && +m[1] + +m[2] <= 20) extra = frames([...Array(+m[1]).fill('a'), ...Array(+m[2]).fill('b')]);
    else if ((m = /^sub-(\d+)-(\d+)$/.exec(key)) && +m[1] <= 20) extra = frames([...Array(m[1] - m[2]).fill('a'), ...Array(+m[2]).fill('x')]);
    else if ((m = /^cmpn-(\d+)-(\d+)-/.exec(key))) extra = numberLine(+m[1], +m[2]);
    else if ((m = /^tbl-next-(\d+)-(\d+)$/.exec(key)) && (+m[1] <= 5 || +m[1] === 10)) extra = bundles(+m[1], m[2] - 1);   // one bundle for each group counted so far, and a faint one for the next
    else if ((m = /^tbl-(\d+)x(\d+)$/.exec(key)) && m[1] * m[2] <= 30) extra = bundles(+m[1], +m[2], false);                  // 1 × 3: three groups of one
    else if ((m = /^cvc-miss-([a-z]+)$/.exec(key))) { words(); const e = all.get(m[1]); if (e) extra = `<div class="ep-pic">${e}</div>`; }
    else { const e = about(q); if (e) extra = `<div class="ep-pic">${e}</div>`; }
    if (extra) { q.main = (q.main || '') + extra; if (q.mainClass === 'empty') q.mainClass = ''; q.earlyPic = true; }
    return q;
  }
  return { add, has, forGrade: (g) => g === 'prek' || g === 'k' };
})();
CATEGORIES.push(
  { id: 'size', title: 'Big & Small', sub: 'bigger · smallest · taller', icon: '🐘', color: '#f08c00', gen: (l) => EarlyLearning.genSize(l), maxLevel: 3 },
  { id: 'matter', title: 'Liquid or Solid?', sub: 'pours or keeps its shape', icon: '💧', color: '#1c7ed6', gen: (l) => EarlyLearning.genMatter(l), maxLevel: 2 },
);
