/* =========================================================
   Learn & Play — content + question generators
   Every generator returns a question object:
   { key, text, say, main, mainClass, options:[{v, html}], answer,
     optClass, hint:{html, say}, speak (word for 🔊), tap (bool) }
   ========================================================= */

const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];
const shuffle = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const sample = (a, n, exclude = []) => shuffle(a.filter((x) => !exclude.includes(x))).slice(0, n);
const numOpts = (level) => (level >= 2 ? 4 : 3);

const PALETTE = [
  ['#ff6b6b', '#ffa8a8', '#c92a2a'],
  ['#4dabf7', '#a5d8ff', '#1864ab'],
  ['#51cf66', '#b2f2bb', '#2b8a3e'],
  ['#fcc419', '#ffec99', '#e67700'],
  ['#cc5de8', '#eebefa', '#862e9c'],
  ['#ff922b', '#ffd8a8', '#d9480f'],
  ['#20c997', '#96f2d7', '#087f5b'],
];

/* ---------------- WORDS ---------------- */
// Picture words by length. Pre-K/K: 3 letters · K/1st: 4 · 1st/2nd: 5 · 2nd: 6+
const W3 = ContentData.get('content','W3');
// Share a vetted, prerecorded picture word inventory across reading and spelling.
// Do not silently treat all three-letter spellings as regular CVC phonics.
for (const entry of EARLY_READY_PICTURE_WORDS) if (!W3.some(([w]) => w === entry[0])) W3.push(entry);
const isSimpleCVC = (word) => /^[bcdfghjklmnprstvwyz][aeiou][bcdfghjklmnprstvz]$/.test(word)
  && !new Set(['car', 'son', 'gel']).has(word);
const W4 = ContentData.get('content','W4');
const W5 = ContentData.get('content','W5');
const WL = ContentData.get('content','WL');
const bigWordList = (level) => (level <= 3 ? W4 : level === 4 ? W5 : W5.concat(WL));

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const CONS = 'bcdfghjklmnprstvwz'.split('');

/* ---------------- SYLLABLES for reading hints ---------------- */
// Kid-friendly splitter: vowel groups, silent e, consonant+le, keeps digraphs (sh, ch, th, ck...) together.
const SYL_FIX = ContentData.get('content','SYL_FIX');
const V = 'aeiou';
const DIGRAPH = ['ch', 'sh', 'th', 'ph', 'wh', 'ck', 'gh', 'qu'];
const BLEND = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sl', 'tr', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw', 'tw'];
const BREAK_PAIRS = ['io', 'ia', 'eo', 'iu', 'uo'];
function syllables(word) {
  const w = word.toLowerCase();
  if (SYL_FIX[w]) return SYL_FIX[w].split('-');
  if (!/^[a-z]+$/.test(w) || w.length <= 3) return [w];
  const isV = (i) => {
    const c = w[i]; if (!c) return false;
    if (V.includes(c)) return !(c === 'u' && w[i - 1] === 'q');
    const nextV = !!w[i + 1] && V.includes(w[i + 1]);
    if (c === 'y') return i > 0 && !nextV;
    if (c === 'w') return i > 0 && V.includes(w[i - 1]) && !nextV;
    return false;
  };
  // vowel groups as [start, end)
  let groups = [];
  for (let i = 0; i < w.length; i++) {
    if (!isV(i)) continue;
    const g = groups[groups.length - 1];
    if (g && g[1] === i && !BREAK_PAIRS.includes(w[i - 1] + w[i])) g[1] = i + 1; else groups.push([i, i + 1]);
  }
  // consonant + le at the end is its own syllable (ap-ple, tur-tle)
  const le = /[^aeiouy]les?$/.test(w) && groups.length >= 2;
  if (!le) {
    const last = groups[groups.length - 1];
    if (groups.length > 1 && last[0] === w.length - 1 && w.endsWith('e')) groups.pop();                    // silent e
    else if (groups.length > 1 && /[^aeiou]e[sd]$/.test(w) && last[0] === w.length - 2 && !/(t|d)ed$|(s|x|z|ch|sh|c|g)es$/.test(w)) groups.pop();
  }
  if (groups.length <= 1) return [w];
  const cuts = [];
  for (let k = 0; k < groups.length - 1; k++) {
    const a = groups[k][1], b = groups[k + 1][0];           // consonant cluster w[a..b)
    if (le && k === groups.length - 2) { cuts.push(w[b - 2] === 'k' && w[b - 3] === 'c' ? b - 2 : b - 2); continue; }  // split before the consonant of "Cle"
    const cl = w.slice(a, b);
    if (cl.length === 0) cuts.push(a);
    else if (cl.length === 1) cuts.push(cl === 'x' ? b : a);
    else {
      // break the cluster into units, keeping digraphs together
      const units = []; let i = 0;
      while (i < cl.length) { const two = cl.slice(i, i + 2); if (DIGRAPH.includes(two)) { units.push(two); i += 2; } else { units.push(cl[i]); i++; } }
      if (units.length === 1) cuts.push(units[0] === 'ck' ? b : a);
      else {
        const lastTwo = units.slice(-2).join('');
        let keep = units.length >= 3 && BLEND.includes(lastTwo) ? units.length - 2 : units.length - 1;
        if (units.length === 2 && units[0] === 'ck') keep = 1;
        cuts.push(a + units.slice(0, keep).join('').length);
      }
    }
  }
  const out = []; let prev = 0;
  for (const c of cuts) { out.push(w.slice(prev, c)); prev = c; }
  out.push(w.slice(prev));
  return out.filter(Boolean);
}
// one-syllable words: onset · rime (c · at, fr · og) so a child can sound them out
function soundChunks(word) {
  const w = word.toLowerCase();
  const m = w.match(/^([^aeiouy]*)(.*)$/);
  return m[1] && m[2] ? [m[1], m[2]] : [w];
}
const sylHTML = (parts) => parts.map((p, i) => `<span class="sy s${i % 4}">${p}</span>`).join('<i class="sy-dot">·</i>');
function readingHint(word) {
  const sy = syllables(word);
  if (sy.length > 1) return { html: `<div class="hint-syl">${sylHTML(sy)}</div><div class="hint-note">${sy.length} parts — say each part!</div>`, say: sy.join(', '), slow: true };
  return { html: `<div class="hint-syl">${sylHTML(soundChunks(word))}</div>`, say: 'Sound it out!' };
}
function sentenceSylHTML(sentence) {
  return sentence.split(' ').map((tok) => {
    const m = tok.match(/^([^A-Za-z]*)([A-Za-z]+)(.*)$/);
    if (!m) return tok;
    const sy = syllables(m[2]);
    const cased = sy.map((p, i) => (i === 0 && /[A-Z]/.test(m[2][0]) ? p[0].toUpperCase() + p.slice(1) : p));
    return m[1] + (sy.length > 1 ? `<span class="syw">${sylHTML(cased)}</span>` : m[2]) + m[3];
  }).join(' ');
}

// words that look alike come first as distractors at higher levels
function similarWords(list, word, n, level) {
  const others = list.filter(([w]) => w !== word);
  if (level < 3) return sample(others, n);
  const score = ([w]) =>
    (w[0] === word[0] ? 2 : 0) + (w.slice(-2) === word.slice(-2) ? 2 : 0) + (w.length === word.length ? 1 : 0) + Math.random();
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}

function genWords(list, level, kind) {
  const wordPool = kind === 'cvc' && level <= 1 ? list.filter(([w]) => isSimpleCVC(w)) : list;
  const [w, e] = pick(wordPool);
  const n = numOpts(level) - 1;
  // workbook-style variety: read → picture, picture → word, listen → word, missing letter, unscramble
  const clear = !(typeof PHON_SKIP !== 'undefined' && PHON_SKIP.has(w));      // the picture can only mean this word
  // little words from level 2 on: now and then a whole word search or picture crossword as one card
  const puzzles = kind === 'cvc' && level >= 2 && typeof mountWordSearch === 'function' ? ['wsearch', 'xword'] : [];
  const modes = clear ? ['read', 'pic', 'find', 'missing', 'missing', 'scramble', ...puzzles] : ['read', 'find', 'missing'];
  // Vowel teams and irregular three-letter words are not short-vowel CVC cards.
  const type = pick(kind === 'cvc' && !isSimpleCVC(w) ? modes.filter((m) => m !== 'missing') : modes);
  if (type === 'wsearch') return { key: `${kind}-ws-${rand(1e6)}`, text: 'Find the hidden words!', say: ['Find the hidden words!', 'Drag your finger across the letters.'],
    main: '', mainClass: 'puzzle-main', options: [], answer: 'done', optClass: 'spell-tray',
    puzzle: { kind: 'wsearch', size: level >= 3 ? 6 : 5, count: level >= 3 ? 3 : 2, down: level >= 3 }, hint: { html: '', say: '' } };
  if (type === 'xword') return { key: `${kind}-xw-${rand(1e6)}`, text: 'Fill in the crossword!', say: ['Fill in the crossword!', 'Tap a box, then tap a letter.'],
    main: '', mainClass: 'puzzle-main', options: [], answer: 'done', optClass: 'spell-tray',
    puzzle: { kind: 'xword', words: level >= 3 ? 3 : 2, lv: level >= 3 ? 2 : 1 }, hint: { html: '', say: '' } };
  const picHint = { html: `<div class="hint-pic">${visualPath(w) ? visualImage(w,'reading-word-photo') : e}</div>`, say: 'Look at the picture!' };

  if (type === 'pic') {
    // look at the picture, pick its word from words that look alike (man · pan · cat)
    const others = similarWords(wordPool.filter(([x]) => x.length === w.length), w, n, 3);
    return {
      key: `${kind}-pic-${w}`, text: 'Which word matches the picture?', say: 'Which word matches the picture?',
      main: `<div class="spell-pic">${visualPath(w) ? visualImage(w,'reading-word-photo') : e}</div>`,
      options: shuffle([w, ...others.map((o) => o[0])]).map((x) => ({ v: x, html: x })), answer: w, optClass: 'opt-word',
      hint: readingHint(w),
    };
  }
  if (type === 'scramble' && /^[a-z]+$/.test(w)) {
    // unscramble the letters (nsu → sun): the letters are the tiles, nothing extra
    let mixed; do { mixed = shuffle(w.split('')); } while (mixed.join('') === w && new Set(w).size > 1);
    return {
      key: `${kind}-scr-${w}`, text: 'Unscramble the letters!', say: 'Unscramble the letters!', speak: w,
      main: `<div class="spell-pic">${e}</div><div class="scrambled">${mixed.join(' ')}</div>`,
      options: [], answer: w, optClass: 'spell-tray',
      spell: { word: w, blanks: w.split('').map((_, i) => i), tiles: mixed },
      hint: { html: '', say: w, slow: true },
    };
  }

  if (type === 'read') {
    const others = similarWords(wordPool, w, n, level);
    return {
      key: `${kind}-read-${w}`,
      text: 'Read the word. Tap the picture!',
      say: 'Read the word, and tap the picture!',
      main: `<div class="word" style="font-size:min(var(--wfs), ${Math.floor(125 / w.length)}vw)">${w}</div>`,
      options: shuffle([[w, e], ...others]).map(([ow, oe]) => ({ v: ow, html: oe })),
      answer: w,
      optClass: 'opt-emoji',
      hint: readingHint(w),
    };
  }

  if (type === 'find') {
    const others = similarWords(wordPool, w, n, level);
    return {
      key: `${kind}-find-${w}`,
      text: 'Listen. Tap the word!',
      say: `Find the word. ${w}.`,
      speak: w,
      main: `<button class="big-speaker" data-speak="${w}" aria-label="Hear the word">🔊</button>`,
      options: shuffle([w, ...others.map((o) => o[0])]).map((x) => ({ v: x, html: x })),
      answer: w,
      optClass: 'opt-word',
      hint: picHint,
    };
  }

  // missing letter
  let pos;
  if (w.length === 3 && isSimpleCVC(w)) pos = level <= 1 ? 1 : pick([0, 1, 1, 2]); // regular CVC only
  else { do { pos = rand(w.length); } while (!/[a-z]/.test(w[pos])); }
  const letter = w[pos];
  const pool = (VOWELS.includes(letter) ? VOWELS : CONS).filter((l) => l !== letter);
  const opts = shuffle([letter, ...sample(pool, n)]);
  const shown = w.split('').map((c, i) => (i === pos ? '<span class="blank">_</span>' : c)).join('');
  return {
    key: `${kind}-miss-${w}`,
    text: 'Which letter is missing?',
    say: `Which letter is missing? ${w}.`,
    speak: w,
    // the picture is shown too: c_t could be cat, cot or cut — the picture says which
    main: `${clear ? `<div class="miss-pic">${e}</div>` : ''}<div class="word" style="font-size:min(var(--wfs), ${Math.floor(125 / w.length)}vw)">${shown}</div>`,
    options: opts.map((l) => ({ v: l, html: l })),
    answer: letter,
    optClass: 'opt-letter',
    hint: clear ? { html: '', say: [w], slow: true } : picHint,
    fill: { pos, word: w },
  };
}

/* ---------------- SIGHT WORDS ---------------- */
// [word, kind, level]  kind is used to pick distractors that do NOT fit a sentence
const SIGHT = ContentData.get('content','SIGHT');
const SIGHT_KIND = Object.fromEntries(SIGHT.map(([w, k]) => [w.toLowerCase(), k]));
// [sentence with ___, answer, level]
const FILL = ContentData.get('content','FILL');
const fillFull = (f) => f[0].replace('___', f[1]);
const OPPOSITES = ContentData.get('content','OPPOSITES');
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const firstLetterHint = (w) => ({ html: `<div class="hint-letters">${w[0]}<span class="faint">${'_'.repeat(w.length - 1)}</span></div>`, say: 'It starts with this letter!' });

function genSight(level) {
  const lv = Math.min(level, 3);
  const pool = SIGHT.filter((s) => s[2] <= lv).map((s) => s[0]);
  const n = numOpts(level) - 1;
  const types = level === 1 ? ['tap', 'tap', 'fill'] : level === 2 ? ['tap', 'fill', 'fill'] : ['tap', 'fill', 'fill', 'opp'];
  const type = pick(types);
  if (type === 'fill') {
    const fl = FILL.filter((f) => f[2] <= lv);
    const f = pick(fl.filter((x) => x[2] === lv).length && Math.random() < 0.7 ? fl.filter((x) => x[2] === lv) : fl);
    const [sent, ans] = f;
    const atStart = sent.startsWith('___');
    const kind = SIGHT_KIND[ans.toLowerCase()];
    const wrong = sample(pool.filter((w) => SIGHT_KIND[w.toLowerCase()] !== kind && w.toLowerCase() !== ans.toLowerCase()), n);
    const show = (w) => (atStart ? cap(w) : w === 'I' ? 'I' : w.toLowerCase());
    return {
      key: `sight-fill-${sent}`, text: 'Which word fits?', say: 'Which word fits?',
      main: `<div class="sentence">${sent.replace('___', '<span class="blank wide">___</span>')}</div>`,
      options: shuffle([ans, ...wrong]).map((w) => ({ v: show(w), html: show(w) })),
      answer: show(ans), optClass: 'opt-word', fill: true, hint: firstLetterHint(ans.toLowerCase()),
    };
  }
  if (type === 'opp') {
    const pair = shuffle(pick(OPPOSITES));
    const others = sample(OPPOSITES.flat().filter((w) => !pair.includes(w)), n);
    return {
      key: `sight-opp-${pair[0]}`, text: `What is the opposite of <b>${pair[0]}</b>?`, say: CLIPS[clipKey(pair[0])] ? ['What is the opposite of', pair[0]] : 'What is the opposite?',
      main: `<div class="word sm">${pair[0]}</div>`,
      options: shuffle([pair[1], ...others]).map((w) => ({ v: w, html: w })),
      answer: pair[1], optClass: 'opt-word', hint: firstLetterHint(pair[1]),
    };
  }
  const w = pick(pool);
  const look = (x) => (x[0].toLowerCase() === w[0].toLowerCase() ? 2 : 0) + (x.length === w.length ? 1 : 0) + Math.random();
  const others = (level >= 3 ? pool.filter((x) => x !== w).sort((a, b) => look(b) - look(a)) : shuffle(pool.filter((x) => x !== w))).slice(0, n);
  return {
    key: `sight-tap-${w}`, text: 'Listen. Tap the word!', say: ['Find the word.', w], speak: w,
    main: `<button class="big-speaker" data-speak="${w}" aria-label="Hear the word">🔊</button>`,
    options: shuffle([w, ...others]).map((x) => ({ v: x, html: x })),
    answer: w, optClass: 'opt-word', hint: firstLetterHint(w.toLowerCase()),
  };
}

/* ---------------- SPELLING ---------------- */
// Only words whose picture is unmistakable.
const SPELL3 = ContentData.get('content','SPELL3');
for (const [word] of EARLY_READY_PICTURE_WORDS) if (!SPELL3.includes(word)) SPELL3.push(word);
const SPELL4 = ContentData.get('content','SPELL4');
const SPELL5 = ContentData.get('content','SPELL5');
const SPELLL = ContentData.get('content','SPELLL');
const EMOJI_OF = Object.fromEntries(W3.concat(W4, W5, WL));
const LOOKALIKE = { b: 'dp', d: 'bp', p: 'bq', q: 'p', m: 'n', n: 'mu', u: 'n', i: 'l', l: 'i', e: 'a', a: 'eo', o: 'a', s: 'z', c: 'k', k: 'c' };

// Levels: 1 Pre-K · 2 K · 3 K/1st · 4 1st · 5 2nd
function genSpell(level) {
  let word, nBlank, nExtra, mode = 'pic', sentence = null;
  const r = Math.random();
  if (level === 1) { word = pick(SPELL3.filter(isSimpleCVC)); nBlank = r < 0.5 ? 1 : 2; nExtra = 2; }
  else if (level === 2) {
    if (r < 0.5) { word = pick(SPELL3); nBlank = 3; nExtra = 3; }
    else { word = pick(SPELL4); nBlank = 2; nExtra = 3; }
  } else if (level === 3) { word = pick(SPELL4); nBlank = r < 0.75 ? 4 : 3; nExtra = 4; }
  else if (level === 4) {
    // Grade-one picture words are extra spelling practice, not added to Pre-K.
    if (r < 0.4) { word = pick(Math.random() < 0.45 ? G1_PICTURE_WORDS : SPELL5); nBlank = 2 + rand(2); nExtra = 4; }
    else if (r < 0.7) { mode = 'listen'; }
    else { mode = 'sentence'; }
    nExtra = 4;
  } else {
    if (r < 0.35) { word = pick(SPELL5); nBlank = 5; nExtra = 4; }
    else if (r < 0.7) { word = pick(SPELLL); nBlank = Math.ceil(word.length / 2); nExtra = 4; }
    else { mode = 'sentence'; nExtra = 5; }
  }
  if (mode === 'listen') { word = pick(SIGHT.filter((x) => x[2] <= 3 && x[0].length >= 3))[0].toLowerCase(); nBlank = word.length; }
  if (mode === 'sentence') {
    const f = pick(FILL.filter((x) => x[2] >= (level === 4 ? 1 : 2) && x[1].length >= 3));
    word = f[1].toLowerCase(); nBlank = word.length; sentence = f;
  }
  const letters = word.split('');
  // which letters are blanks (vowels first when only one or two, they are the tricky part)
  const idx = letters.map((_, i) => i);
  let blanks;
  if (nBlank >= letters.length) blanks = idx;
  else {
    const vow = shuffle(idx.filter((i) => VOWELS.includes(letters[i])));
    const rest = shuffle(idx.filter((i) => !VOWELS.includes(letters[i])));
    const order = Math.random() < 0.6 ? vow.concat(rest) : shuffle(idx);
    blanks = order.slice(0, nBlank).sort((a, b) => a - b);
  }
  const need = blanks.map((i) => letters[i]);
  // decoys: look-alike letters from level 3, otherwise random letters not in the word
  const pool = [];
  if (level >= 3) need.forEach((l) => (LOOKALIKE[l] || '').split('').forEach((x) => pool.push(x)));
  const nLook = pool.length;
  'abcdefghijklmnoprstuvwyz'.split('').forEach((x) => pool.push(x));
  const extras = [];
  for (const x of shuffle(pool.slice(0, nLook)).concat(shuffle(pool.slice(nLook)))) {
    if (extras.length >= nExtra) break;
    if (!word.includes(x) && !extras.includes(x)) extras.push(x);
  }
  const full = blanks.length === letters.length;
  let text, say, main;
  // Text/picture-first spelling for new targets that lack recorded audio.
  const visualOnly = mode === 'pic' && Object.hasOwn(G1_SPELL_PICTURES, word);
  if (mode === 'sentence') {
    text = 'Spell the missing word!';
    say = ['Spell the missing word.', fillFull(sentence)];
    main = `<div class="sentence">${sentence[0].replace('___', '<span class="blank wide">___</span>')}</div><button class="mini-speaker" data-speak="${fillFull(sentence)}">🔊</button>`;
  } else if (mode === 'listen') {
    text = 'Listen and spell!';
    say = ['Listen and spell.', word];
    main = `<button class="big-speaker" data-speak="${word}" aria-label="Hear the word">🔊</button>`;
  } else {
    text = full ? 'Spell the word!' : 'Fill in the missing letters!';
    say = visualOnly ? 'Fill in the missing letters!' : [full ? 'Spell the word.' : 'Fill in the missing letters.', word];
    main = `<div class="spell-pic">${visualPath(word) ? visualImage(word,'reading-word-photo') : (EMOJI_OF[word] || G1_SPELL_PICTURES[word] || '')}</div>` +
      (visualOnly ? '' : `<button class="mini-speaker" data-speak="${word}" aria-label="Hear the word">🔊</button>`);
  }
  return {
    key: `spell-${word}-${blanks.join('')}`,
    text, say, speak: word, main,
    options: [],
    answer: word,
    optClass: 'spell-tray',
    spell: { word, blanks, tiles: shuffle(need.concat(extras)) },
    hint: { html: visualOnly ? '<div class="hint-note">Look closely at the picture and the letters.</div>' : '',
      say: visualOnly ? 'Look at the picture!' : sentence ? fillFull(sentence) : word, slow: true },
  };
}

/* ---------------- SENTENCES ---------------- */
const SENTENCES = ContentData.get('content','SENTENCES');
// level: given (4th item) or by length: 1 = up to 5 words, 2 = up to 8 words, 3 = longer / two sentences
const sentLevel = (x) => { if (typeof x !== 'string') return x[3] || sentLevel(x[0]); const n = x.split(' ').length; return n <= 5 ? 1 : n <= 8 && !/[.!?] [A-Z]/.test(x) ? 2 : 3; };

// every reading item as [text, [[question, options], ...], level]
const READING = () => READING.all || (READING.all = SENTENCES.map((x) => [x[0], [[x[1], x[2]]], sentLevel(x), x[4] === 'print-first'])
  .concat(PATTERN_SENTENCES.map((x) => [x[0], [[x[1], x[2]]], x[3]]), STORIES.map((x) => [x[1], x[2], x[0]])));
// words that never point to an answer on their own
const HINT_SKIP = new Set('a an the is are was were be to of and or in on at it its i you he she we they my his her their this that what who where when why how which do does did can has have had will with for from by so but not one some many much'.split(' '));
const HINT_NUMS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const plainWords = (t) => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)
  .map((w) => (/^\d+$/.test(w) && HINT_NUMS[+w] ? HINT_NUMS[+w] : w.replace(/'s$/, '')));
// which words of the sentence to light up for the hint: the answer's own words if the sentence has them,
// otherwise the question's words, so the child knows where to look (the hint never reads the answer out)
function sentenceHintMarks(s, q, answer) {
  const sw = s.split(' ').map((w) => plainWords(w)[0] || '');
  const find = (src) => { const want = new Set(plainWords(src).filter((w) => !HINT_SKIP.has(w))); return sw.map((w, i) => (w && (want.has(w) || want.has(w.replace(/s$/, ''))) ? i : -1)).filter((i) => i >= 0); };
  const a = find(answer);
  return a.length ? a : find(q);
}
function genSentence(level) {
  // 1st-grade workbook-style screens now and then: word box, read & fill, story order
  if (level >= 3 && level <= 4 && Math.random() < 0.35 && typeof genGrade1Reading === 'function') return genGrade1Reading(level);
  const all = READING();
  // mostly this level, sometimes one level easier for a quick win
  const exact = all.filter((x) => x[2] === level), near = all.filter((x) => x[2] === level - 1);
  const [s, qs, , printFirst] = pick(exact.length && (Math.random() < 0.8 || !near.length) ? exact : near.length ? near : all.filter((x) => x[2] <= level));
  const [q, opts] = pick(qs);
  const words = s.split(' ').map((w, i) => `<span class="sw" data-i="${i}">${w}</span>`).join(' ');
  const long = s.length > 120 ? ' passage' : s.length > 60 ? ' long' : '';
  const marks = sentenceHintMarks(s, q, opts[0]);
  // Real imagery supports early passage comprehension without replacing the wording.
  const storyWords = s.toLowerCase().split(/[^a-z]+/);
  const subject = level <= 3 && VISUAL_NAMES.find(name => storyWords.includes(name));
  const photo = subject ? '<div class="reading-photo-wrap">' + visualImage(subject, 'reading-photo') + '</div>' : '';
  return {
    key: `sent-${s}`, qkey: q,
    text: '📖 Read, then answer',     // the question is shown once, under the sentence
    // New print-first passages deliberately use only a known natural recording;
    // do not synthesize question text whose audio has not been recorded.
    say: printFirst ? 'Find the answer.' : '',
    readQ: printFirst ? null : q,
    main: `<div class="sentence${long}">${words}</div>${photo}<div class="question-line">${q}</div>`,
    options: shuffle(opts).map((o) => ({ v: o, html: o })),
    answer: opts[0],
    optClass: 'opt-text',
    // the hint points to the right words; it does not read the sentence (or the answer) out loud
    hint: marks.length ? { html: '<div class="hint-note">👀 Look at the yellow words. Read them!</div>', say: ['Look at the yellow words.', 'Read them!'], mark: marks }
      : { html: '<div class="hint-note">👀 Read the sentence again, slowly.</div>', say: ['Read the sentence again, slowly.'] },
  };
}

/* ---------------- SYLLABLES ---------------- */
const SYL = ContentData.get('content','SYL');

function genSyllable(level) {
  const pool = level === 1 ? SYL.filter((s) => s[1].split('-').length <= 3) : SYL;
  const [w, split, e] = pick(pool);
  const count = split.split('-').length;
  const max = level === 1 ? 3 : 4;
  const opts = [];
  for (let i = 1; i <= max; i++) opts.push(i);
  return {
    key: `syl-${w}`,
    text: 'How many claps?',
    say: `How many claps in ${w}?`,
    speak: w,
    main: `<div class="word">${w}</div><button class="mini-speaker" data-speak="${w}">🔊</button>`,
    options: opts.map((n) => ({ v: n, html: `${n}<small>${'👏'.repeat(n)}</small>` })),
    answer: count,
    optClass: 'opt-num',
    hint: {
      html: `<div class="hint-pic sm">${e}</div><div class="hint-claps">${split.split('-').map((p) => `<span>👏<b>${p}</b></span>`).join('')}</div>`,
      say: split.split('-').join(', '),
      slow: true,
    },
  };
}

/* ---------------- MATH ---------------- */
// Levels for Adding / Take Away:
//  1: within 5   2: within 10   3: within 20
//  4: two-digit ± one-digit, no regrouping (34 + 5, 47 − 3)
//  5: two-digit ± one-digit, with regrouping (38 + 7, 52 − 6)
const THINGS = ContentData.get('content','THINGS');
const NAMES = ContentData.get('content','NAMES');

function numberOptions(ans, level, min = 0) {
  const set = new Set([ans]);
  if (level >= 4) { if (ans + 10 >= min) set.add(ans + 10); else if (ans - 10 >= min) set.add(ans - 10); } // classic place-value slip
  const spread = level >= 3 ? 3 : 2;
  let guard = 0;
  while (set.size < numOpts(level) && guard++ < 60) {
    const d = ans + (rand(spread * 2 + 1) - spread);
    if (d >= min && d !== ans) set.add(d);
  }
  return shuffle([...set]).map((n) => ({ v: n, html: String(n) }));
}

function objects(emoji, n, crossFrom = Infinity) {
  let h = '';
  for (let i = 0; i < n; i++) h += `<span class="obj${i >= crossFrom ? ' crossed' : ''}">${emoji}</span>`;
  return h;
}

// base-ten blocks: tall bars are tens, little cubes are ones
function blocks(n, crossOnes = 0) {
  const t = Math.floor(n / 10), o = n % 10;
  let h = '<div class="b10">';
  for (let i = 0; i < t; i++) h += '<span class="ten"></span>';
  for (let i = 0; i < o; i++) h += `<span class="one${i >= o - crossOnes ? ' crossed' : ''}"></span>`;
  return h + '</div>';
}

// pick numbers for a level
function addPair(level) {
  let a, b;
  if (level <= 3) {
    const max = [5, 10, 20][level - 1];
    do { a = rand(Math.min(10, max) + 1); b = rand(Math.min(10, max) + 1); } while (a + b > max || (a === 0 && b === 0) || (level > 1 && (a === 0 || b === 0)));
  } else if (level === 4) { // no carry
    do { a = 10 + rand(89); b = 1 + rand(9); } while ((a % 10) + b > 9);
  } else { // carry
    do { a = 10 + rand(80); b = 2 + rand(8); } while ((a % 10) + b < 10);
  }
  return [a, b];
}
function subPair(level) {
  let a, b;
  if (level <= 3) { const max = [5, 10, 15][level - 1]; a = 1 + rand(max); b = level > 1 ? 1 + rand(a) : rand(a + 1); }
  else if (level === 4) { do { a = 11 + rand(89); b = 1 + rand(9); } while (b > a % 10); } // no borrow
  else { do { a = 20 + rand(80); b = 2 + rand(8); } while (b <= a % 10); }                 // borrow
  return [a, b];
}

function mathHint(op, a, b, e) {
  if (Math.max(a, b) <= 20) {
    return op === '+'
      ? { html: `<div class="objs">${objects(e, a)}</div><div class="plus">+</div><div class="objs">${objects(e, b)}</div>`, say: 'Count them all!' }
      : { html: `<div class="objs">${objects(e, a, a - b)}</div>`, say: `Cross out ${b}. Count what is left!` };
  }
  const o = a % 10;
  if (op === '+') {
    if (o + b <= 9) return { html: `${blocks(a)}<div class="plus">+</div>${blocks(b)}<div class="hint-note">Add the ones: ${o} + ${b} = ${o + b}</div>`, say: 'Add the ones first!' };
    const toTen = 10 - o;
    return { html: `${blocks(a)}<div class="plus">+</div>${blocks(b)}<div class="hint-note">${a} + ${toTen} = ${a + toTen}<br>${a + toTen} + ${b - toTen} = ${a + b}</div>`, say: 'Make a ten first!' };
  }
  if (b <= o) return { html: `${blocks(a, b)}<div class="hint-note">Take away the ones: ${o} − ${b} = ${o - b}</div>`, say: 'Take away the ones first!' };
  return { html: `${blocks(a)}<div class="hint-note">${a} − ${o} = ${a - o}<br>${a - o} − ${b - o} = ${a - b}</div>`, say: 'Go back to ten first!' };
}

function genAdd(level) {
  // Comparison is a math activity, not a separate category: mix age-appropriate
  // more/fewer and symbol comparisons into ordinary addition practice.
  if (Math.random() < 0.13) return genCompare(Math.min(level, 5));
  const [a, b] = addPair(level);
  const ans = a + b;
  const [e, things] = pick(THINGS);
  const story = (level === 2 || level === 3) && Math.random() < 0.3;
  const text = story ? `You have ${a} ${e}. You get ${b} more. How many now?` : 'Add them up!';
  return {
    key: `add-${a}-${b}`,
    text,
    say: story ? `You have ${a} ${things}. You get ${b} more. How many now?` : level >= 4 ? ['What is', a, 'plus', `${b}?`] : `What is ${a} plus ${b}?`,
    main: story ? `<div class="story">${text}</div>` : `<div class="equation">${a} + ${b} = <span class="qmark">?</span></div>`,
    options: numberOptions(ans, level),
    answer: ans,
    optClass: 'opt-num',
    hint: mathHint('+', a, b, e),
  };
}

function genSub(level) {
  const [a, b] = subPair(level);
  const ans = a - b;
  const [e, things] = pick(THINGS);
  const story = (level === 2 || level === 3) && Math.random() < 0.3;
  const text = story ? `You have ${a} ${e}. You give away ${b}. How many are left?` : 'Take away!';
  return {
    key: `sub-${a}-${b}`,
    text,
    say: story ? `You have ${a} ${things}. You give away ${b}. How many are left?` : level >= 4 ? ['What is', a, 'minus', `${b}?`] : `What is ${a} minus ${b}?`,
    main: story ? `<div class="story">${text}</div>` : `<div class="equation">${a} − ${b} = <span class="qmark">?</span></div>`,
    options: numberOptions(ans, level),
    answer: ans,
    optClass: 'opt-num',
    hint: mathHint('−', a, b, e),
  };
}

/* ---------------- WORD PROBLEMS ---------------- */
// Each template is a list of spoken pieces. Pieces are recorded once each
// ("Mia has", "apples.", numbers…) so any combination plays in the same voice.
// Levels: 1 within 10 · 2 within 20 · 3 two-digit ± one-digit · 4 "how many more" · 5 two steps
const WP_ITEMS = ContentData.get('content','WP_ITEMS');
const WP = ContentData.get('content','WP');

function wpNumbers(level, op) {
  if (level === 1) return op === '+' ? addPair(2) : subPair(2);
  if (level === 2) return op === '+' ? addPair(3) : (() => { const a = 11 + rand(10); return [a, 1 + rand(9)]; })();
  return op === '+' ? addPair(4 + rand(2)) : subPair(4 + rand(2));
}

function genWordProblem(level) {
  const n = pick(NAMES);
  const [e, t, kind] = pick(WP_ITEMS);
  let parts, ans, hint, key;
  if (level === 4 && Math.random() < 0.6) {
    // comparison: how many more?
    const m = pick(NAMES.filter((x) => x !== n));
    const big = 5 + rand(16), small = 1 + rand(big - 1);
    parts = [`${n} has`, big, `${t}.`, `${m} has`, small, `${t}.`, `How many more does ${n} have?`];
    ans = big - small; key = `wp-cmp-${big}-${small}`;
    hint = { html: `<div class="cmp"><div class="objs">${objects(e, big, small)}</div><div class="objs">${objects(e, small)}</div></div><div class="hint-note">Match them up. Count the extra ones!</div>`, say: 'Match them up. Count the extra ones!' };
  } else if (level === 5 && Math.random() < 0.6) {
    // two steps: start, get some, give some
    let a, b, c;
    do { a = 3 + rand(10); b = 1 + rand(9); c = 1 + rand(9); } while (c > a + b || a + b > 20);
    parts = [`${n} has`, a, `${t}.`, `${n} gets`, b, 'more.', `Then ${n} gives away`, `${c}.`, 'How many are left?'];
    ans = a + b - c; key = `wp-two-${a}-${b}-${c}`;
    hint = { html: `<div class="hint-note">Step 1: ${a} + ${b} = ${a + b}<br>Step 2: ${a + b} − ${c} = ?</div>`, say: 'Add first. Then take away.' };
  } else {
    const op = Math.random() < 0.5 ? '+' : '−';
    const lv = Math.min(level, 3);
    const [a, b] = wpNumbers(lv, op);
    parts = op === '+' ? pick(WP.add)(n, a, b, t) : pick(WP.sub[kind])(n, a, b, t);
    ans = op === '+' ? a + b : a - b; key = `wp-${op}-${a}-${b}`;
    hint = mathHint(op, a, b, e);
    hint = { html: `<div class="hint-note big">${a} ${op} ${b} = ?</div>${hint.html}`, say: op === '+' ? 'It is an adding problem!' : 'It is a take away problem!' };
  }
  const text = parts.map(String).join(' ').replace(new RegExp(`\\b${t}\\b`, 'g'), `${t} ${e}`);
  return {
    key, text: '📝 Read the story', say: parts,
    main: `<div class="story">${text}</div>`,
    options: numberOptions(ans, Math.max(level, 2)),
    answer: ans, optClass: 'opt-num', hint,
  };
}

/* ---------------- COMPARE  > < = ---------------- */
// 1 more/fewer + picture vs picture with signs · 2 pictures and numbers to 10 · 3 to 20 · 4 two-digit · 5 sums and differences
const SIGN_OPTS = [{ v: '>', html: '&gt;<small>greater</small>' }, { v: '<', html: '&lt;<small>less</small>' }, { v: '=', html: '=<small>equal</small>' }];
const signOf = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const gator = { html: '<div class="hint-pic sm">🐊</div><div class="hint-note">The alligator mouth opens to the bigger number!<br>7 &gt; 3 &nbsp; · &nbsp; 3 &lt; 7</div>', say: 'The alligator mouth opens to the bigger number!' };

// two picture groups with the sign box between them; counts shown under each group
function genComparePics(level) {
  const [e] = pick(THINGS);
  const max = level <= 1 ? 6 : 10;
  let a = 1 + rand(max), b = 1 + rand(max);
  if (Math.random() < 0.15) b = a;
  const showNums = level >= 2 || Math.random() < 0.5;
  const grp = (n) => `<div class="pgrp"><div class="objs small">${objects(e, n)}</div>${showNums ? `<b>${n}</b>` : ''}</div>`;
  return {
    key: `cmpp-${a}-${b}`, text: 'Count the pictures. Which sign goes in the box?', say: ['Count the pictures.', 'Which sign goes in the box?'],
    main: `<div class="pcmp">${grp(a)}<span class="qmark box">?</span>${grp(b)}</div>`,
    options: SIGN_OPTS, answer: signOf(a, b), optClass: 'opt-num signs',
    hint: {
      html: `<div class="hint-pic sm">🐊</div><div class="hint-note">${a} ${a === b ? 'is the same as' : a > b ? 'is more than' : 'is less than'} ${b}<br>The mouth opens to the bigger group!<br><span class="sign-key">&gt; greater · &lt; less · = equal</span></div>`,
      say: 'The alligator mouth opens to the bigger group!',
    },
  };
}

function genCompare(level) {
  // picture comparisons teach what the signs mean: often early, now and then later
  if (Math.random() < (level === 1 ? 0.5 : level === 2 ? 0.45 : 0.15)) return genComparePics(level);
  if (level === 1) {
    const [e] = pick(THINGS);
    let a, b; do { a = 1 + rand(8); b = 1 + rand(8); } while (a === b);
    const more = Math.random() < 0.6;
    const ans = (more ? a > b : a < b) ? 'A' : 'B';
    return {
      key: `cmp1-${a}-${b}-${more}`, text: more ? 'Which group has <b>more</b>?' : 'Which group has <b>fewer</b>?',
      say: more ? 'Which group has more?' : 'Which group has fewer?',
      main: `<div class="big-emoji muted">⚖️</div>`,
      options: [{ v: 'A', html: `<div class="objs small">${objects(e, a)}</div>` }, { v: 'B', html: `<div class="objs small">${objects(e, b)}</div>` }],
      answer: ans, optClass: 'opt-card two groups-opt',
      hint: { html: `<div class="hint-note big">${a} and ${b}</div>`, say: 'Count each group!' },
    };
  }
  let a, b, la = '', lb = '';
  if (level === 2) { a = rand(11); b = rand(11); }
  else if (level === 3) { a = rand(21); b = rand(21); }
  else if (level === 4) {
    a = 10 + rand(90);
    const t = rand(3);  // same tens, same ones, or anything
    b = t === 0 ? Math.floor(a / 10) * 10 + rand(10) : t === 1 ? (1 + rand(9)) * 10 + (a % 10) : 10 + rand(90);
  } else {
    const x = 1 + rand(10), y = 1 + rand(10);
    const op = Math.random() < 0.5 ? '+' : '−';
    const [p, q] = op === '+' ? [x, y] : [Math.max(x, y), Math.min(x, y)];
    a = op === '+' ? p + q : p - q; la = `${p} ${op} ${q}`;
    b = a + (rand(5) - 2); if (b < 0) b = 0;
    if (Math.random() < 0.3) { const u = 1 + rand(8), v = rand(6); lb = `${u} + ${v}`; b = u + v; }
  }
  if (level <= 3 && Math.random() < 0.15) b = a; // sometimes equal
  return {
    key: `cmp-${la || a}-${lb || b}`, text: 'Which sign goes in the box?', say: 'Which sign goes in the box?',
    main: `<div class="equation cmp-eq">${la || a} <span class="qmark box">?</span> ${lb || b}</div>`,
    options: SIGN_OPTS, answer: signOf(a, b), optClass: 'opt-num signs', hint: gator,
  };
}

/* ---------------- MULTIPLY ---------------- */
// 1 equal groups (pictures) · 2 ×2 ×5 ×10 · 3 up to 5×5 · 4 up to 10×10 · 5 missing factor & stories
function groupsHTML(e, g, each) {
  return `<div class="groups">${Array.from({ length: g }, () => `<div class="grp">${objects(e, each)}</div>`).join('')}</div>`;
}
function arrayHTML(r, c) {
  return `<div class="arr" style="grid-template-columns:repeat(${c},1fr)">${'<i></i>'.repeat(r * c)}</div>`;
}
const skipCount = (b, n) => Array.from({ length: n }, (_, i) => b * (i + 1)).join(', ');
const BAGS = [['bags', '👜'], ['boxes', '📦'], ['plates', '🍽️'], ['baskets', '🧺']];

function genMul(level) {
  const [e, things] = pick(THINGS);
  if (level === 1) {
    const g = 2 + rand(3), each = 2 + rand(4);
    return {
      key: `mul1-${g}-${each}`, text: `${g} groups of ${each}. How many in all?`, say: [`${g}`, 'groups of', `${each}.`, 'How many in all?'],
      main: groupsHTML(e, g, each), options: numberOptions(g * each, 2), answer: g * each, optClass: 'opt-num',
      hint: { html: `<div class="hint-note big">Count by ${each}s:<br>${skipCount(each, g)}</div>`, say: 'Count by groups!' },
    };
  }
  let a, b;
  if (level === 2) { a = pick([2, 5, 10]); b = 1 + rand(10); }
  else if (level === 3) { a = 1 + rand(5); b = 1 + rand(5); }
  else { a = 2 + rand(9); b = 1 + rand(10); }
  if (Math.random() < 0.5) [a, b] = [b, a];
  const c = a * b;
  const hint = { html: `${a * b <= 50 ? arrayHTML(a, b) : ''}<div class="hint-note big">Count by ${b}s:<br>${skipCount(b, Math.min(a, 10))}</div>`, say: 'Count by groups!' };
  if (level === 5 && Math.random() < 0.5) {
    if (Math.random() < 0.5) {
      const [bag, be] = pick(BAGS);
      const ga = 2 + rand(5), gb = 2 + rand(6);
      return {
        key: `mul5s-${ga}-${gb}-${bag}`, text: '📝 Read the story',
        say: ['There are', `${ga}`, `${bag}.`, 'Each one has', `${gb}`, `${things}.`, 'How many in all?'],
        main: `<div class="story">There are ${ga} ${bag} ${be}.<br>Each one has ${gb} ${things} ${e}.<br>How many ${things} in all?</div>`,
        options: numberOptions(ga * gb, 4), answer: ga * gb, optClass: 'opt-num',
        hint: { html: groupsHTML(e, ga, gb), say: 'Count by groups!' },
      };
    }
    return {
      key: `mul5m-${a}-${b}`, text: 'What number is missing?', say: ['What times', `${b}`, 'makes', `${c}?`],
      main: `<div class="equation"><span class="qmark">?</span> × ${b} = ${c}</div>`,
      options: numberOptions(a, 4, 1), answer: a, optClass: 'opt-num',
      hint: { html: `<div class="hint-note big">Count by ${b}s to ${c}:<br>${skipCount(b, a)}</div>`, say: 'Count by groups!' },
    };
  }
  return {
    key: `mul-${a}-${b}`, text: 'Multiply!', say: ['What is', `${a}`, 'times', `${b}?`],
    main: `<div class="equation">${a} × ${b} = <span class="qmark">?</span></div>`,
    options: numberOptions(c, Math.max(level, 3)), answer: c, optClass: 'opt-num', hint,
  };
}

/* ---------------- DIVIDE ---------------- */
// 1 share equally (pictures) · 2 ÷2 ÷5 ÷10 · 3 within 25 · 4 within 100 · 5 missing number & stories
function genDiv(level) {
  const [e, things] = pick(THINGS);
  if (level === 1) {
    const friends = 2 + rand(2), each = 1 + rand(4), total = friends * each;
    return {
      key: `div1-${total}-${friends}`, text: `Share with ${friends} friends. How many each?`,
      say: ['Share', `${total}`, `${things}`, 'with', `${friends}`, 'friends.', 'How many does each friend get?'],
      main: `<div class="objs">${objects(e, total)}</div><div class="friends">${'🧒'.repeat(friends)}</div>`,
      options: numberOptions(each, 2, 1), answer: each, optClass: 'opt-num',
      hint: { html: groupsHTML(e, friends, each), say: 'Give one to each friend, again and again!' },
    };
  }
  let b, q;
  if (level === 2) { b = pick([2, 5, 10]); q = 1 + rand(10); }
  else if (level === 3) { b = 1 + rand(5); q = 1 + rand(5); }
  else { b = 2 + rand(9); q = 1 + rand(10); }
  const c = b * q;
  const hint = { html: `${c <= 40 ? arrayHTML(q, b) : ''}<div class="hint-note big">Think: ${b} × ? = ${c}</div>`, say: ['What times', `${b}`, 'makes', `${c}?`] };
  if (level === 5 && Math.random() < 0.5) {
    const [bag, be] = pick(BAGS);
    return {
      key: `div5s-${c}-${b}-${bag}`, text: '📝 Read the story',
      say: ['There are', `${c}`, `${things}.`, 'Put them in', `${b}`, `${bag}.`, 'The same in each.', 'How many in each one?'],
      main: `<div class="story">${c} ${things} ${e}<br>go into ${b} ${bag} ${be},<br>the same in each.<br>How many in each?</div>`,
      options: numberOptions(q, 4, 1), answer: q, optClass: 'opt-num', hint,
    };
  }
  return {
    key: `div-${c}-${b}`, text: 'Divide!', say: ['What is', `${c}`, 'divided by', `${b}?`],
    main: `<div class="equation">${c} ÷ ${b} = <span class="qmark">?</span></div>`,
    options: numberOptions(q, Math.max(level, 3), 0), answer: q, optClass: 'opt-num', hint,
  };
}

/* ---------------- CLOCK ---------------- */
// 1 o'clock · 2 half past · 3 quarter past / to · 4 five minutes
function clockSVG(h, m, cls = 'clock') {
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  let nums = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    nums += `<text x="${50 + 37 * Math.cos(a)}" y="${50 + 37 * Math.sin(a) + 4.2}" text-anchor="middle" font-size="12" font-weight="800" fill="#2b2140">${i}</text>`;
  }
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 - 90) * Math.PI / 180, r1 = i % 5 ? 45 : 43;
    ticks += `<line x1="${50 + r1 * Math.cos(a)}" y1="${50 + r1 * Math.sin(a)}" x2="${50 + 47 * Math.cos(a)}" y2="${50 + 47 * Math.sin(a)}" stroke="#b9b0cc" stroke-width="${i % 5 ? .6 : 1.4}"/>`;
  }
  return `<svg viewBox="0 0 100 100" class="${cls}"><circle cx="50" cy="50" r="48" fill="#fff" stroke="#7c5cff" stroke-width="3"/>${ticks}${nums}
    <line x1="50" y1="50" x2="50" y2="25" stroke="#2b2140" stroke-width="5" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>
    <line x1="50" y1="50" x2="50" y2="12" stroke="#ff6b6b" stroke-width="3" stroke-linecap="round" transform="rotate(${ma} 50 50)"/>
    <circle cx="50" cy="50" r="3.5" fill="#2b2140"/></svg>`;
}
const timeStr = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
function randTime(level) {
  const h = 1 + rand(12);
  const mins = level === 1 ? [0] : level === 2 ? [0, 30] : level === 3 ? [0, 15, 30, 45] : Array.from({ length: 12 }, (_, i) => i * 5);
  return [h, pick(mins)];
}
function genClock(level) {
  const [h, m] = randTime(level);
  const ans = timeStr(h, m);
  const set = new Set([ans]);
  // common mix-ups: hands swapped, hour off by one, other minutes
  const swapped = m % 5 === 0 && m > 0 ? timeStr(m / 5, (h % 12) * 5) : null;
  if (swapped && level >= 3) set.add(swapped);
  let guard = 0;
  while (set.size < numOpts(level) && guard++ < 50) {
    const [h2, m2] = randTime(level);
    const near = Math.random() < 0.5 ? timeStr(((h + (Math.random() < 0.5 ? 0 : rand(3) - 1) + 11) % 12) + 1, m2) : timeStr(h2, m);
    set.add(near);
  }
  const opts = shuffle([...set]);
  const hint = { html: `<div class="hint-note">🔵 Short hand = hour<br>🔴 Long hand = minutes</div>`, say: 'The short hand shows the hour. The long hand shows the minutes.' };
  if (level >= 2 && Math.random() < 0.4) {
    return {
      key: `clock-pick-${ans}`, text: `Which clock shows <b>${ans}</b>?`, say: 'Which clock shows this time?',
      main: `<div class="digital">${ans}</div>`,
      options: opts.map((t) => { const [hh, mm] = t.split(':').map(Number); return { v: t, html: clockSVG(hh, mm, 'clock small') }; }),
      answer: ans, optClass: 'opt-svg', hint,
    };
  }
  return {
    key: `clock-read-${ans}`, text: 'What time is it?', say: 'What time is it?',
    main: clockSVG(h, m),
    options: opts.map((t) => ({ v: t, html: t })), answer: ans, optClass: 'opt-num clock-opts', hint,
  };
}

/* ---------------- MATCH IT (two columns) ---------------- */
// Reading: word ↔ picture · Math: number ↔ picture count, problem ↔ answer
function uniqPairs(make, n) {
  const out = [], seenL = new Set(), seenR = new Set();
  let guard = 0;
  while (out.length < n && guard++ < 300) {
    const [l, r, lv, rv] = make();
    if (seenL.has(lv) || seenR.has(rv)) continue;
    seenL.add(lv); seenR.add(rv); out.push([l, r]);
  }
  return out;
}
function genMatch(level) {
  const n = level === 1 ? 3 : level <= 3 ? 4 : 5;
  const reading = Math.random() < 0.5;
  let pairs, text, say, kind;
  if (reading) {
    const list = level === 1 ? W3 : level === 2 ? W4 : level === 3 ? W5 : level === 4 ? W5.concat(WL) : WL;
    pairs = sample(list, n).map(([w, e]) => [`<span class="m-word">${w}</span>`, `<span class="m-pic">${e}</span>`]);
    text = 'Match each word to its picture!'; say = 'Match each word to its picture!'; kind = 'read';
  } else {
    const [e] = pick(THINGS);
    let make;
    if (level === 1 || (level === 2 && Math.random() < 0.4)) {
      const max = level === 1 ? 5 : 10;
      make = () => { const k = 1 + rand(max); return [`<span class="m-num">${k}</span>`, `<span class="m-objs">${objects(e, k)}</span>`, k, k]; };
      text = 'Match each number to its picture!'; say = 'Match each number to its picture!';
    } else {
      make = () => {
        let a, b, op, v;
        if (level === 2) { [a, b] = addPair(2); op = '+'; v = a + b; }
        else if (level === 3) { if (Math.random() < 0.5) { [a, b] = addPair(3); op = '+'; v = a + b; } else { [a, b] = subPair(3); op = '−'; v = a - b; } }
        else if (level === 4) { if (Math.random() < 0.5) { [a, b] = addPair(4 + rand(2)); op = '+'; v = a + b; } else { a = pick([2, 5, 10]); b = 1 + rand(10); op = '×'; v = a * b; } }
        else { if (Math.random() < 0.6) { a = 1 + rand(5); b = 1 + rand(10); op = '×'; v = a * b; } else { b = 2 + rand(4); v = 1 + rand(5); a = b * v; op = '÷'; } }
        return [`<span class="m-eq">${a} ${op} ${b}</span>`, `<span class="m-num">${v}</span>`, `${a}${op}${b}`, v];
      };
      text = 'Match each problem to its answer!'; say = 'Match each problem to its answer!';
    }
    pairs = uniqPairs(make, n); kind = 'math';
  }
  const left = pairs.map((p, i) => ({ id: i, html: p[0] }));
  const right = shuffle(pairs.map((p, i) => ({ id: i, html: p[1] })));
  return {
    key: `match-${kind}-${pairs.map((p) => p[0]).join('')}`, text, say, main: '', mainClass: 'empty', options: [], answer: 'all',
    optClass: 'match-area', match: { left: shuffle(left), right, kind },
    hint: { html: '', say: 'Look carefully, and try again!' },
  };
}

/* ---------------- MULTIPLE-CHOICE FACT QUESTIONS ---------------- */
// [level, question, right answer, wrong answers...]  (hint removes one wrong answer)
function mcQuestion(prefix, row, level) {
  const [, q, ans, ...wrong] = row;
  const n = Math.min(numOpts(level) - 1, wrong.length);
  const opts = shuffle([ans, ...sample(wrong, n)]);
  return {
    key: `${prefix}-${q}`, text: q, say: q, main: '', mainClass: 'empty',
    options: opts.map((o) => ({ v: o, html: o })), answer: ans,
    optClass: opts.some((o) => o.length > 14) ? 'opt-text' : 'opt-text four-ok',
    hint: { html: '', say: 'Think about it!', remove: true },
  };
}
const pickLevelled = (rows, level) => {
  // Within a grade, teach mostly on-level material with some immediate-prior
  // review. Do not send a Grade 2 reader back to Pre-K picture matching.
  const eligible = rows.filter((r) => r[0] <= level);
  const exact = eligible.filter((r) => r[0] === level);
  const review = eligible.filter((r) => r[0] === level - 1);
  return pick(exact.length && (Math.random() < 0.82 || !review.length) ? exact :
    review.length ? review : eligible);
};

/* ---------------- BODY PARTS (outside) ---------------- */
// Clothed child figure; every tappable part is a <g data-val="...">.
function bodySVG(highlight) {
  const skin = '#ffd8b5', shirt = '#4dabf7', shorts = '#845ef7';
  const P = (name, inner) => `<g data-val="${name}" class="bp${highlight === name ? ' hl' : ''}">${inner}</g>`;
  const hit = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>`;
  return `<svg viewBox="0 0 200 310" class="body-fig">
    ${P('ears', `<ellipse cx="66" cy="64" rx="8" ry="11" fill="${skin}" stroke="#c8906a" stroke-width="1.5"/><ellipse cx="134" cy="64" rx="8" ry="11" fill="${skin}" stroke="#c8906a" stroke-width="1.5"/>`)}
    ${P('neck', `<rect x="91" y="90" width="18" height="16" fill="${skin}"/>`)}
    ${P('head', `<circle cx="100" cy="62" r="32" fill="${skin}" stroke="#c8906a" stroke-width="1.5"/>`)}
    ${P('hair', `<path d="M68 60Q66 22 100 22Q134 22 132 60Q124 38 100 38Q76 38 68 60Z" fill="#6b4226"/>`)}
    ${P('eyebrows', `${hit(78, 44, 44, 10)}<path d="M82 51q7-5 14 0M104 51q7-5 14 0" stroke="#6b4226" stroke-width="3" fill="none" stroke-linecap="round"/>`)}
    ${P('eyes', `${hit(78, 54, 44, 16)}<ellipse cx="89" cy="62" rx="6.5" ry="7" fill="#fff"/><circle cx="89" cy="63" r="3.6" fill="#2b2140"/><ellipse cx="111" cy="62" rx="6.5" ry="7" fill="#fff"/><circle cx="111" cy="63" r="3.6" fill="#2b2140"/>`)}
    ${P('cheeks', `<circle cx="80" cy="76" r="6" fill="#ffa8a8" opacity=".8"/><circle cx="120" cy="76" r="6" fill="#ffa8a8" opacity=".8"/>`)}
    ${P('nose', `${hit(93, 66, 14, 13)}<ellipse cx="100" cy="73" rx="4" ry="5" fill="#f4b183"/>`)}
    ${P('mouth', `${hit(88, 78, 24, 10)}<path d="M90 81q10 8 20 0" stroke="#c92a2a" stroke-width="3" fill="#ff8787" stroke-linecap="round"/>`)}
    ${P('chin', `${hit(90, 88, 20, 6)}`)}
    ${P('arms', `<rect x="46" y="112" width="15" height="40" rx="7" fill="${shirt}"/><rect x="47" y="158" width="13" height="32" rx="6" fill="${skin}"/><rect x="139" y="112" width="15" height="40" rx="7" fill="${shirt}"/><rect x="140" y="158" width="13" height="32" rx="6" fill="${skin}"/>`)}
    ${P('elbows', `<circle cx="53.5" cy="155" r="7.5" fill="${skin}" stroke="#c8906a"/><circle cx="146.5" cy="155" r="7.5" fill="${skin}" stroke="#c8906a"/>`)}
    ${P('wrists', `<rect x="46" y="188" width="15" height="7" rx="3" fill="#ffc9a3" stroke="#c8906a"/><rect x="139" y="188" width="15" height="7" rx="3" fill="#ffc9a3" stroke="#c8906a"/>`)}
    ${P('hands', `<circle cx="53.5" cy="204" r="10" fill="${skin}" stroke="#c8906a"/><circle cx="146.5" cy="204" r="10" fill="${skin}" stroke="#c8906a"/>`)}
    ${P('chest', `<path d="M62 106h76l-4 30H66z" fill="${shirt}"/>`)}
    ${P('tummy', `<path d="M66 136h68l-4 44H70z" fill="#74c0fc"/><circle cx="100" cy="160" r="2" fill="#1971c2"/>`)}
    ${P('shoulders', `<circle cx="62" cy="112" r="11" fill="#339af0"/><circle cx="138" cy="112" r="11" fill="#339af0"/>`)}
    <rect x="70" y="178" width="60" height="30" rx="5" fill="${shorts}"/>
    ${P('legs', `<rect x="75" y="206" width="20" height="34" rx="8" fill="${skin}"/><rect x="105" y="206" width="20" height="34" rx="8" fill="${skin}"/><rect x="76" y="252" width="18" height="28" rx="7" fill="${skin}"/><rect x="106" y="252" width="18" height="28" rx="7" fill="${skin}"/>`)}
    ${P('knees', `<circle cx="85" cy="246" r="9" fill="#ffc9a3" stroke="#c8906a"/><circle cx="115" cy="246" r="9" fill="#ffc9a3" stroke="#c8906a"/>`)}
    ${P('ankles', `<rect x="77" y="278" width="16" height="7" rx="3" fill="#ffc9a3" stroke="#c8906a"/><rect x="107" y="278" width="16" height="7" rx="3" fill="#ffc9a3" stroke="#c8906a"/>`)}
    ${P('feet', `<ellipse cx="80" cy="294" rx="16" ry="8" fill="#f03e3e"/><ellipse cx="120" cy="294" rx="16" ry="8" fill="#f03e3e"/>`)}
  </svg>`;
}
// [name, level, picture] — picture used for "find the picture" cards
const BODY_PARTS = ContentData.get('content','BODY_PARTS');
const BODY_FN = ContentData.get('content','BODY_FN');
function genBody(level) {
  if (HAS3D) return genBody3D(level);
  const parts = BODY_PARTS.filter((p) => p[1] <= level);
  const exact = parts.filter((p) => p[1] === level);
  const t = Math.random();
  if (level >= 2 && t < 0.4) return mcQuestion('body-fn', pickLevelled(BODY_FN, level), level);
  if (level === 1 && t < 0.3) {
    const withPic = parts.filter((p) => p[2]);
    const p = pick(withPic);
    const others = sample(withPic, numOpts(level) - 1, [p]);
    return {
      key: `body-pic-${p[0]}`, text: `Find the picture of <b>${p[0]}</b>!`, say: ['Find the picture of', p[0]],
      main: '', mainClass: 'empty', options: shuffle([p, ...others]).map((o) => ({ v: o[0], html: o[2] })),
      answer: p[0], optClass: 'opt-emoji', hint: { html: bodySVG(p[0]), say: 'Look at the picture!' },
    };
  }
  const p = pick(exact.length && Math.random() < 0.6 ? exact : parts);
  const word = p[0];
  return {
    key: `body-tap-${word}`, text: `Tap the <b>${word}</b>!`, say: ['Tap the', `${word}!`],
    main: bodySVG(), mainClass: 'body-main', tap: true, options: [], answer: word, optClass: '',
    hint: { html: `<div class="hint-mini">${bodySVG(word)}</div>`, say: 'Look for the part that is glowing!' },
  };
}

/* ---------------- 3D BODY questions (used when the device can show 3D) ---------------- */
const HAS3D = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
// body part → what is inside it (shown after a right answer from level 2)
const INSIDE = ContentData.get('content','INSIDE');
const BODY3_PARTS = ContentData.get('content','BODY3_PARTS');
function genBody3D(level) {
  const parts = BODY3_PARTS.filter((p) => p[1] <= level);
  const exact = parts.filter((p) => p[1] === level);
  const t = Math.random();
  if (level >= 2 && t < 0.3) return mcQuestion('body-fn', pickLevelled(BODY_FN, level), level);
  const name = pick(exact.length && Math.random() < 0.6 ? exact : parts)[0];
  const ins = level >= 2 && INSIDE[name];
  const reveal = ins ? { layer: ins[0], part: ins[1], text: ins[2] } : null;
  if (level >= 2 && t < 0.5) {
    const others = sample(parts.map((p) => p[0]), numOpts(level) - 1, [name]);
    return {
      key: `body3-name-${name}`, text: 'What is the glowing part called?', say: 'What is the glowing part called?', main: '', mainClass: 'b3d-main',
      body3d: { layer: 'skin', highlight: name }, reveal, options: shuffle([name, ...others]).map((x) => ({ v: x, html: x })), answer: name, optClass: 'opt-text two-col',
      hint: { html: '', say: 'Think about it!', remove: true },
    };
  }
  return {
    key: `body3-tap-${name}`, text: `Tap the <b>${name}</b>!`, say: ['Tap the', `${name}!`], main: '', mainClass: 'b3d-main',
    body3d: { layer: 'skin', tap: true, tappable: BODY3_PARTS.map((p) => p[0]) }, reveal, options: [], answer: name, optClass: '',
    hint: { html: '', say: 'Look for the part that is glowing!', glow: true },
  };
}
// Inside My Body: 1 organs · 2 more organs + big bones · 3 bone names + blood vessels · 4 more bones and science
const INNER = ContentData.get('content','INNER');
const INNER_LABEL = ContentData.get('content','INNER_LABEL');
const innerName = (n, level) => (level >= 3 && INNER_LABEL[n] ? INNER_LABEL[n] : n === 'spine' ? 'backbone' : n);
const ANATOMY_MORE = ContentData.get('content','ANATOMY_MORE');
function genAnatomy3D(level) {
  const pool = INNER.filter((x) => x[2] <= level);
  const exact = pool.filter((x) => x[2] === level);
  const t = Math.random();
  if (t < 0.3) return mcQuestion('ana', pickLevelled(ANATOMY.concat(ANATOMY_MORE), Math.min(level, 4)), level);
  const [name, layer] = pick(exact.length && Math.random() < 0.6 ? exact : pool);
  const shown = innerName(name, level);
  if (t < 0.55) {
    const others = sample(pool.filter((x) => x[1] === layer || pool.filter((y) => y[1] === layer).length < 4).map((x) => x[0]), numOpts(level) - 1, [name]);
    return {
      key: `ana3-name-${name}`, text: 'What is the glowing part called?', say: 'What is the glowing part called?', main: '', mainClass: 'b3d-main',
      body3d: { layer, highlight: name }, options: shuffle([name, ...others]).map((x) => ({ v: x, html: innerName(x, level) })), answer: name,
      optClass: 'opt-text two-col', hint: { html: '', say: 'Think about it!', remove: true },
    };
  }
  return {
    key: `ana3-tap-${name}`, text: `Tap the <b>${shown}</b>!`, say: ['Tap the', `${name}!`], main: '', mainClass: 'b3d-main',
    body3d: { layer, tap: true, tappable: INNER.filter((x) => x[1] === layer).map((x) => x[0]) }, options: [], answer: name, optClass: '',
    hint: { html: '', say: 'Look for the part that is glowing!', glow: true },
  };
}

/* ---------------- GENERAL KNOWLEDGE ---------------- */
// Levels: 1 Pre-K · 2 Kindergarten · 3 1st grade · 4 2nd grade
const GK = ContentData.get('content','GK');
/* Pre-K picture listening and recognition, with genuinely age-banded visual content.
   The bank is large, but each short question shows 2–4 related images, not a wall of thumbnails. */
function genVisualRecognition(level) {
  const topics = level <= 1 ? ['animals','transport','food','objects','nature'] :
    ['animals','transport','food','objects','nature','places']; // Kindergarten: familiar places, not molecular science equipment
  const group = pick(topics);
  const source = ILLUSTRATION_GROUPS[group];
  const correct = pick(source), options = shuffle([correct, ...sample(source.filter(x=>x!==correct),numOpts(level)-1)]);
  // Recorded-word speech only. Do not synthesize a phrase that does not exist in audio/clips.json.
  const hasRecording = !!CLIPS[clipKey(correct.replace(/_/g,' '))];
  const spoken = hasRecording
    ? ['Find the picture of', correct.replace(/_/g,' ')] : 'Look at the picture!';
  return {
    key:'visual-'+group+'-'+correct, text:hasRecording ? 'Find the '+correct.replace(/_/g,' ')+'!' : 'Find the matching picture!',
    say:spoken, main:hasRecording
      ? '<div class="visual-listen" aria-hidden="true">🔊 <span>Listen and choose</span></div>'
      : '<div class="visual-prompt-art">'+visualImage(correct,'visual-prompt-icon')+'</div>',
    options:options.map(name=>({v:name,html:visualImage(name,'gk-photo')+'<small>'+name.replace(/_/g,' ')+'</small>'})),
    answer:correct,optClass:'gk-picture-choices visual-choices',
    hint:{html:'<div class="hint-note">Look at the shapes and colors. Point to the matching picture!</div>',
      say:'Look at the picture!'}
  };
}
const genGK = (level) => {
  if (level <= 2 && Math.random() < (level === 1 ? 0.62 : 0.25)) return genVisualRecognition(level);
  const q = mcQuestion('gk', pickLevelled(GK, level), level);
  // Pre-K children hear a recognizable prompt and a target word with prerecorded audio.
  if (q.text.startsWith('Which picture shows')) {
    const noun = q.answer.split(' ').slice(1).join(' ');
    // Child-facing picture names stay audible without introducing unrecorded phrases:
    // syllabic clips sound out sunflower, airplane, tulip (two-lip), and daisy (day-zee).
    const pictureSpeech = { sunflower: ['sun','flower'], airplane: ['air','plane'],
      tulip: ['two','lip'], daisy: ['day','z'] };
    const parts = pictureSpeech[noun] || [noun];
    q.say = parts.every(part => CLIPS[clipKey(part)]) ? ['Find the picture of', ...parts] : 'Look at the picture!';
    q.optClass = 'gk-picture-choices';
    if (PHOTO_SET.has(noun)) {
      // All answers must be photographs from the same category, not a mixture of emoji and photos.
      const alternatives = shuffle(photoGroup(noun).filter(name => name !== noun)).slice(0, numOpts(level) - 1);
      q.answer = noun;
      q.options = shuffle([noun, ...alternatives]).map(name => ({
        v: name, html: photoImage(name, 'gk-photo') + '<small>' + name + '</small>'
      }));
    } else {
      q.options.forEach(option => {
        const space = option.html.indexOf(' ');
        option.html = '<span class="gk-picture">' + option.html.slice(0, space) +
          '</span><small>' + option.html.slice(space + 1) + '</small>';
      });
    }
  } else if (!CLIPS[clipKey(q.text)]) {
    // Newly added calendar questions remain readable offline without missing audio-file requests.
    q.say = 'Find the answer!';
  }
  return q;
};

/* ---------------- INSIDE MY BODY (optional) ---------------- */
function organSVG(highlight) {
  const O = (name, inner) => `<g data-val="${name}" class="org${highlight === name ? ' hl' : ''}">${inner}</g>`;
  return `<svg viewBox="0 0 200 300" class="organ-fig">
    <path d="M100 8c-30 0-46 22-46 46s14 40 30 46v10c-32 6-50 22-54 46v120h140V156c-4-24-22-40-54-46v-10c16-6 30-22 30-46S130 8 100 8z" fill="#fff0e6" stroke="#e8b796" stroke-width="2"/>
    ${O('brain', `<path d="M70 50c-6-18 12-30 24-24c6-10 26-8 30 4c16-2 22 16 12 24c6 12-8 22-18 16c-6 8-24 8-30 0c-12 6-26-6-18-20z" fill="#f9a8c8" stroke="#d6336c" stroke-width="2"/><path d="M88 40q6 6 0 12M108 36q-4 8 4 14M120 52q-8 0-8 8" stroke="#d6336c" stroke-width="1.6" fill="none"/>`)}
    ${O('lungs', `<path d="M92 128c-24-2-34 22-34 48c0 14 6 20 16 18c12-2 18-10 18-22z" fill="#ffc9c9" stroke="#e03131" stroke-width="2"/><path d="M108 128c24-2 34 22 34 48c0 14-6 20-16 18c-12-2-18-10-18-22z" fill="#ffc9c9" stroke="#e03131" stroke-width="2"/>`)}
    ${O('heart', `<path d="M110 162c-4-10-18-8-18 2c0 10 12 16 18 22c6-6 18-12 18-22c0-10-14-12-18-2z" fill="#e03131" stroke="#a51111" stroke-width="2"/>`)}
    ${O('stomach', `<path d="M118 200c18-4 26 10 20 24c-6 14-26 14-36 6c-8-6-2-14 6-12c8 2 14-2 10-10z" fill="#ffd8a8" stroke="#e8590c" stroke-width="2"/>`)}
    ${O('intestines', `<path d="M70 236h60v40H70z" fill="#ffe8cc" stroke="#d9480f" stroke-width="2" rx="10"/><path d="M76 246h46M122 246q6 6 0 10H78q-6 4 0 10h44" stroke="#d9480f" stroke-width="2" fill="none"/>`)}
    <path d="M100 100v12" stroke="#e8b796" stroke-width="4"/>
  </svg>`;
}
const ORGANS = [['brain', 1], ['heart', 1], ['lungs', 1], ['stomach', 1], ['intestines', 2]];
const ANATOMY = ContentData.get('content','ANATOMY');
function genAnatomy(level) {
  if (HAS3D) return genAnatomy3D(level);
  const t = Math.random();
  const organs = ORGANS.filter((o) => o[1] <= Math.min(level + 1, 2));
  if (t < 0.25) {
    const o = pick(organs)[0];
    return {
      key: `ana-tap-${o}`, text: `Tap the <b>${o}</b>!`, say: ['Tap the', `${o}!`], main: organSVG(), mainClass: 'body-main', tap: true,
      options: [], answer: o, optClass: '', hint: { html: `<div class="hint-mini">${organSVG(o)}</div>`, say: 'Look for the part that is glowing!' },
    };
  }
  if (t < 0.45) {
    const o = pick(organs)[0];
    const others = sample(ORGANS.map((x) => x[0]), numOpts(level) - 1, [o]);
    return {
      key: `ana-name-${o}`, text: 'What is the glowing part called?', say: 'What is the glowing part called?',
      main: organSVG(o), mainClass: 'body-main', options: shuffle([o, ...others]).map((x) => ({ v: x, html: x })),
      answer: o, optClass: 'opt-text two-col', hint: { html: '', say: 'Think about it!', remove: true },
    };
  }
  return mcQuestion('ana', pickLevelled(ANATOMY, level), level);
}

/* ---------------- 2D SHAPES ---------------- */
function regular(n, r = 42, cx = 50, cy = 52, rotDeg = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((rotDeg + (360 / n) * i) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
const SHAPE_PTS = {
  triangle: [[50, 10], [92, 86], [8, 86]],
  square: [[14, 14], [86, 14], [86, 86], [14, 86]],
  rectangle: [[4, 26], [96, 26], [96, 76], [4, 76]],
  diamond: [[50, 6], [86, 50], [50, 94], [14, 50]],
  pentagon: regular(5),
  hexagon: regular(6, 44, 50, 50, 0),
  octagon: regular(8, 44, 50, 50, 22.5),
};
const SHAPES2 = ContentData.get('content','SHAPES2');

function shape2D(name, col, cls = 'shape') {
  const [c, , d] = col;
  const st = `fill="${c}" stroke="${d}" stroke-width="3" stroke-linejoin="round"`;
  let body;
  if (name === 'circle') body = `<circle cx="50" cy="50" r="42" ${st}/>`;
  else if (name === 'oval') body = `<ellipse cx="50" cy="50" rx="45" ry="29" ${st}/>`;
  else if (name === 'heart') body = `<path d="M50 88 C22 64 6 46 16 26 C26 8 46 12 50 28 C54 12 74 8 84 26 C94 46 78 64 50 88 Z" ${st}/>`;
  else if (name === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 19 : 45;
      const a = ((-90 + 36 * i) * Math.PI) / 180;
      pts.push(`${50 + r * Math.cos(a)},${53 + r * Math.sin(a)}`);
    }
    body = `<polygon points="${pts.join(' ')}" ${st}/>`;
  } else body = `<polygon points="${SHAPE_PTS[name].map((p) => p.join(',')).join(' ')}" ${st}/>`;
  return `<svg viewBox="0 0 100 100" class="${cls}" aria-label="${name}">${body}</svg>`;
}

function sidesHintSVG(name, col) {
  const pts = SHAPE_PTS[name];
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let labels = '';
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    let mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    const dx = mx - cx, dy = my - cy, len = Math.hypot(dx, dy) || 1;
    mx = cx + dx * (1 - 13 / len); my = cy + dy * (1 - 13 / len);
    labels += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${PALETTE[i % PALETTE.length][2]}" stroke-width="5" stroke-linecap="round"/>`;
    labels += `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#222">${i + 1}</text>`;
  });
  return `<svg viewBox="-4 -4 108 108" class="shape sm"><polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${col[1]}"/>${labels}</svg>`;
}

function genShape2(level) {
  const names = Object.keys(SHAPES2).filter((n) => SHAPES2[n].level <= level);
  const polys = names.filter((n) => SHAPE_PTS[n]);
  const col = pick(PALETTE);
  const types = level >= 2 ? ['name', 'name', 'find', 'sides'] : ['name', 'name', 'find'];
  const type = pick(types);
  const n = numOpts(level) - 1;

  if (type === 'sides') {
    const s = pick(polys);
    const ans = SHAPES2[s].sides;
    return {
      key: `s2-sides-${s}`,
      text: 'How many sides?',
      say: 'How many sides does this shape have?',
      main: shape2D(s, col),
      options: numberOptions(ans, level, 3),
      answer: ans,
      optClass: 'opt-num',
      hint: { html: sidesHintSVG(s, col), say: 'Count each side!' },
    };
  }
  const s = pick(names);
  const hint = { html: `<div class="hint-pic">${SHAPES2[s].real}</div>`, say: SHAPES2[s].tip };
  if (type === 'find') {
    const others = sample(names, n, [s]);
    return {
      key: `s2-find-${s}`,
      text: `Find the ${s}!`,
      say: `Can you find the ${s}?`,
      main: `<div class="word sm">${s}</div>`,
      options: shuffle([s, ...others]).map((x) => ({ v: x, html: shape2D(x, pick(PALETTE), 'shape shape-opt') })),
      answer: s,
      optClass: 'opt-svg',
      hint,
    };
  }
  const others = sample(names, n, [s]);
  return {
    key: `s2-name-${s}`,
    text: 'What shape is this?',
    say: 'What shape is this?',
    main: shape2D(s, col),
    options: shuffle([s, ...others]).map((x) => ({ v: x, html: x })),
    answer: s,
    optClass: 'opt-text',
    hint,
  };
}

/* ---------------- 3D SHAPES ---------------- */
let gid = 0;
function shape3D(name, col, cls = 'shape') {
  const [c, l, d] = col;
  const id = `g${++gid}`;
  const lin = `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${d}"/><stop offset=".45" stop-color="${l}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <radialGradient id="${id}r" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${l}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></radialGradient></defs>`;
  const sk = `stroke="${d}" stroke-width="1.5" stroke-linejoin="round"`;
  let b = '';
  switch (name) {
    case 'cube':
      b = `<polygon points="18,36 62,36 62,86 18,86" fill="${c}" ${sk}/><polygon points="18,36 38,16 82,16 62,36" fill="${l}" ${sk}/><polygon points="62,36 82,16 82,66 62,86" fill="${d}" ${sk}/>`; break;
    case 'rectangular prism':
      b = `<polygon points="6,44 66,44 66,82 6,82" fill="${c}" ${sk}/><polygon points="6,44 28,24 94,24 66,44" fill="${l}" ${sk}/><polygon points="66,44 94,24 94,62 66,82" fill="${d}" ${sk}/>`; break;
    case 'sphere':
      b = `<circle cx="50" cy="50" r="40" fill="url(#${id}r)"/><ellipse cx="50" cy="88" rx="26" ry="4" fill="#0002"/>`; break;
    case 'cylinder':
      b = `<ellipse cx="50" cy="78" rx="28" ry="10" fill="url(#${id})"/><rect x="22" y="22" width="56" height="56" fill="url(#${id})"/><ellipse cx="50" cy="22" rx="28" ry="10" fill="${l}" ${sk}/>`; break;
    case 'cone':
      b = `<path d="M50 10 L20 78 A30 10 0 0 0 80 78 Z" fill="url(#${id})"/>`; break;
    case 'pyramid':
      b = `<polygon points="50,10 12,74 50,90" fill="${c}" ${sk}/><polygon points="50,10 50,90 88,72" fill="${d}" ${sk}/>`; break;
  }
  return `<svg viewBox="0 0 100 100" class="${cls}" aria-label="${name}">${lin}${b}</svg>`;
}

const SHAPES3 = ContentData.get('content','SHAPES3');

function genShape3(level) {
  const names = Object.keys(SHAPES3).filter((n) => SHAPES3[n].level <= level);
  const col = pick(PALETTE);
  const type = pick(['name', 'name', 'find', 'real', 'dim']);
  const n = Math.min(numOpts(level) - 1, names.length - 1);

  if (type === 'dim') {
    const is3 = Math.random() < 0.5;
    const sh = is3 ? shape3D(pick(names), col) : shape2D(pick(['circle', 'square', 'triangle', 'rectangle']), col);
    return {
      key: `s3-dim-${Math.random()}`,
      text: 'Flat or solid?',
      say: 'Is this shape flat, or solid?',
      main: sh,
      options: [{ v: '2D', html: 'Flat<small>2D</small>' }, { v: '3D', html: 'Solid<small>3D</small>' }],
      answer: is3 ? '3D' : '2D',
      optClass: 'opt-text two',
      hint: { html: '<div class="hint-note">📄 Flat = like paper<br>⚽ Solid = you can hold it</div>', say: 'Flat shapes are like paper. Solid shapes you can hold in your hand.' },
    };
  }
  const s = pick(names);
  const real = pick(SHAPES3[s].real);
  if (type === 'real' && s !== 'pyramid') {
    const others = sample(names.filter((x) => x !== 'pyramid'), n, [s]);
    return {
      key: `s3-real-${s}`,
      text: `Which is shaped like a ${s}?`,
      say: `Which one is shaped like a ${s}?`,
      main: shape3D(s, col),
      options: shuffle([s, ...others]).map((x) => ({ v: x, html: x === s ? real : pick(SHAPES3[x].real) })),
      answer: s,
      optClass: 'opt-emoji',
      hint: { html: '', say: SHAPES3[s].tip },
    };
  }
  const hint = { html: `<div class="hint-pic">${real}</div>`, say: SHAPES3[s].tip };
  if (type === 'find') {
    const others = sample(names, n, [s]);
    return {
      key: `s3-find-${s}`,
      text: `Find the ${s}!`,
      say: `Can you find the ${s}?`,
      main: `<div class="word sm">${s}</div>`,
      options: shuffle([s, ...others]).map((x) => ({ v: x, html: shape3D(x, pick(PALETTE), 'shape shape-opt') })),
      answer: s,
      optClass: 'opt-svg',
      hint,
    };
  }
  const others = sample(names, n, [s]);
  return {
    key: `s3-name-${s}`,
    text: 'What shape is this?',
    say: 'What 3D shape is this?',
    main: shape3D(s, col),
    options: shuffle([s, ...others]).map((x) => ({ v: x, html: x })),
    answer: s,
    optClass: 'opt-text',
    hint,
  };
}

/* ---------------- JOBS ---------------- */
const JOBS = ContentData.get('content','JOBS');

// one Shapes game: flat shapes first, then 3D shapes join in
// look at real things: tap all the circles (like "color all the circles you see")
const SHAPE_THINGS = ContentData.get('content','SHAPE_THINGS');
function genShapeTapAll() {
  const s = pick(Object.keys(SHAPE_THINGS)), right = sample(SHAPE_THINGS[s], 2 + rand(2));
  const wrong = sample(Object.entries(SHAPE_THINGS).filter(([k]) => k !== s).flatMap(([, v]) => v), 6 - right.length);
  return {
    key: `shape-all-${s}-${right.join('')}`, text: `Tap <b>all</b> the ${s}s you see!`, say: [`Tap all the ${s}s you see!`],
    main: shape2D(s, pick(PALETTE)), options: shuffle([...right, ...wrong]).map((e) => ({ v: e, html: e })),
    answer: right.join(','), optClass: 'opt-emoji six', multi: right, hint: { html: `<div class="hint-pic">${SHAPES2[s].real}</div>`, say: SHAPES2[s].tip },
  };
}
function genShapes(level) {
  if (level <= 3 && Math.random() < 0.25) return genShapeTapAll();
  if (level <= 1) return genShape2(1);
  if (level === 2) return Math.random() < 0.5 ? genShape2(2) : genShape3(1);
  if (level === 3) return Math.random() < 0.5 ? genShape2(3) : genShape3(2);
  return Math.random() < 0.65 ? genShape3(3) : genShape2(3);
}
function genJobs(level) {
  const pool = level === 1 ? JOBS.slice(0, 12) : JOBS;
  const j = pick(pool);
  const [name, e, does, clue] = j;
  const others = sample(pool, numOpts(level) - 1, [j]);
  const type = level >= 2 ? pick(['who', 'who', 'name', 'does']) : pick(['who', 'name']);
  const hint = { html: `<div class="hint-pic">${clue}</div>`, say: `This person ${does}.` };
  const article = /^[aeiou]/.test(name) ? 'an' : 'a';
  if (type === 'name') {
    return {
      key: `job-name-${name}`, text: 'Who is this?', say: 'Who is this?',
      main: `<div class="big-emoji">${e}</div>`,
      options: shuffle([j, ...others]).map((o) => ({ v: o[0], html: o[0] })),
      answer: name, optClass: 'opt-text', hint,
    };
  }
  if (type === 'does') {
    return {
      key: `job-does-${name}`, text: `What does ${article} ${name} do?`, say: `What does ${article} ${name} do?`,
      main: `<div class="big-emoji">${e}</div>`,
      options: shuffle([j, ...others]).map((o) => ({ v: o[0], html: o[2] })),
      answer: name, optClass: 'opt-text', hint: { html: `<div class="hint-pic">${clue}</div>`, say: `Look at the clues!` },
    };
  }
  return {
    key: `job-who-${name}`, text: `Who ${does}?`, say: `Who ${does}?`,
    main: `<div class="big-emoji muted">❓</div>`,
    options: shuffle([j, ...others]).map((o) => ({ v: o[0], html: `<span class="oe">${o[1]}</span><span class="ot">${o[0]}</span>` })),
    answer: name, optClass: 'opt-card', hint,
  };
}

/* ---------------- FLAGS ---------------- */
const FLAGS = ContentData.get('content','FLAGS');

function genFlags(level) {
  const pool = FLAGS.filter((f) => f[4] <= level);
  const f = pick(pool);
  const [name, flag, clue, clueText] = f;
  const the = /^(United|Netherlands)/.test(name) ? 'the ' : '';
  const others = sample(pool, numOpts(level) - 1, [f]);
  const hint = { html: `<div class="hint-pic">${clue}</div>`, say: `This country has ${clueText}.` };
  if (Math.random() < 0.5) {
    return {
      key: `flag-c-${name}`, text: 'Which country has this flag?', say: 'Which country has this flag?',
      main: `<div class="big-flag">${flag}</div>`,
      options: shuffle([f, ...others]).map((o) => ({ v: o[0], html: o[0] })),
      answer: name, optClass: 'opt-text', hint,
    };
  }
  return {
    key: `flag-f-${name}`, text: `Find the flag of ${the}${name}!`, say: `Find the flag of ${the}${name}!`,
    main: `<div class="word sm">${name}</div>`,
    options: shuffle([f, ...others]).map((o) => ({ v: o[0], html: o[1] })),
    answer: name, optClass: 'opt-emoji flag', hint,
  };
}

/* ---------------- WORLD MAP (real country shapes) ---------------- */
// GEO comes from geo.js (Natural Earth borders). Famous countries carry f = level 1/2/3.
const CONT = ContentData.get('content','CONT');
const LAND_COLORS = { 'North America': '#69db7c', 'South America': '#ffd43b', Europe: '#da77f2', Africa: '#ffa94d', Asia: '#ff8787', Australia: '#4dabf7', Antarctica: '#e9ecef' };
const COUNTRY_FLAG = ContentData.get('content','COUNTRY_FLAG');
const CAPITAL = ContentData.get('content','CAPITAL');
const theC = (n) => (/^(United|Netherlands)/.test(n) ? 'the ' : '') + n;   // "the United States"
const SMALL_COUNTRIES = ContentData.get('content','SMALL_COUNTRIES');
const famousCountries = (level) => GEO.countries.filter((c) => c.f && c.f <= level).map((c) => c.n);
const countryOf = (name) => GEO.countries.find((c) => c.n === name);

// draw the world. mode 'cont' colors continents; mode 'country' shows countries.
// hl = continent or country to glow orange; tap = 'cont' | 'country' makes it tappable
function worldSVG({ mode = 'country', hl = null, tap = null, level = 3 } = {}) {
  const famous = new Set(famousCountries(level));
  let body = '';
  if (tap === 'cont' || mode === 'cont') {
    for (const cont of Object.keys(LAND_COLORS)) {
      const paths = GEO.countries.filter((c) => c.c === cont).map((c) => `<path d="${c.d}"/>`).join('');
      const fill = tap ? LAND_COLORS[cont] : cont === hl ? '#ff6b00' : '#cfe8b4';
      body += `<g data-val="${tap ? cont : ''}" fill="${fill}" class="${!tap && cont === hl ? 'hl' : ''}">${paths}</g>`;
    }
  } else {
    for (const c of GEO.countries) {
      const isHl = c.n === hl, fam = famous.has(c.n);
      const fill = isHl ? '#ff6b00' : fam ? '#b2e3a0' : '#e3f0d6';
      body += `<path d="${c.d}" fill="${fill}" ${tap && fam ? `data-val="${c.n}"` : ''} class="${isHl ? 'hl' : ''}"/>`;
    }
    // small countries get a circle so they are easy to see and to tap
    for (const c of GEO.countries) {
      if (!SMALL_COUNTRIES.includes(c.n)) continue;
      if (c.n === hl) body += `<circle cx="${c.x}" cy="${c.y}" r="7" class="ring"/>`;
      if (tap && famous.has(c.n)) body += `<circle cx="${c.x}" cy="${c.y}" r="6" fill="transparent" data-val="${c.n}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${GEO.W} ${GEO.H}" class="map real${tap ? ' tappable' : ''}"><rect x="0" y="0" width="${GEO.W}" height="${GEO.H}" rx="10" fill="#a5d8ff"/>
    <g stroke="#ffffff" stroke-width=".35" stroke-linejoin="round">${body}</g></svg>`;
}
const flagHint = (name) => ({ html: `<div class="hint-pic">${COUNTRY_FLAG[name] || '🗺️'}</div><div class="hint-note">This is its flag!</div>`, say: 'Here is its flag!' });
const contHint = (c) => ({ html: `<div class="hint-pic">${CONT[c].e}</div>`, say: `Hint: ${CONT[c].clue}` });

function genMaps(level) {
  const conts = Object.keys(CONT).filter((n) => CONT[n].level <= level);
  const countries = famousCountries(level);
  const n = numOpts(level) - 1;
  const types = level === 1 ? ['cname', 'ctap', 'kname', 'kname', 'kcont'] : level === 2 ? ['cname', 'ctap', 'kname', 'kname', 'ktap', 'ktap', 'kcont', 'kcont']
    : ['cname', 'kname', 'kname', 'ktap', 'ktap', 'kcont', 'capital', 'capital', 'capital'];
  const type = pick(types);
  if (type === 'cname' || type === 'ctap') {
    const c = pick(conts);
    if (type === 'ctap') return {
      key: `map-ctap-${c}`, text: `Tap on <b>${c}</b>!`, say: `Can you tap on ${c}?`, main: worldSVG({ mode: 'cont', tap: 'cont' }), mainClass: 'map-main',
      tap: true, options: [], answer: c, optClass: '', hint: contHint(c),
    };
    return {
      key: `map-cname-${c}`, text: 'Which continent is orange?', say: 'Which continent is orange?', main: worldSVG({ mode: 'cont', hl: c }), mainClass: 'map-main',
      options: shuffle([c, ...sample(conts, n, [c])]).map((x) => ({ v: x, html: x })), answer: c, optClass: 'opt-text', hint: contHint(c),
    };
  }
  const exact = countries.filter((x) => countryOf(x).f === level);
  if (type === 'capital') {
    const withCap = countries.filter((x) => CAPITAL[x]);
    const k = pick(withCap);
    return {
      key: `map-cap-${k}`, text: `What is the capital city of <b>${theC(k)}</b>? ${COUNTRY_FLAG[k] || ''}`, say: ['What is the capital city of', `${theC(k)}?`],
      main: worldSVG({ hl: k, level }), mainClass: 'map-main',
      options: shuffle([k, ...sample(withCap, n, [k])]).map((x) => ({ v: x, html: CAPITAL[x] })), answer: k, optClass: 'opt-text',
      hint: { html: '', say: 'The capital is where the country is run from!', remove: true },
    };
  }
  if (type === 'kcont') {
    const ok = countries.filter((x) => !['Russia', 'Turkey', 'Egypt'].includes(x));
    const k = pick(ok), c = countryOf(k).c;
    return {
      key: `map-kcont-${k}`, text: `Which continent is <b>${theC(k)}</b> in? ${COUNTRY_FLAG[k] || ''}`, say: ['Which continent is', theC(k), 'in?'],
      main: worldSVG({ hl: k, level }), mainClass: 'map-main',
      options: shuffle([c, ...sample(conts.filter((x) => x !== 'Antarctica'), n, [c])]).map((x) => ({ v: x, html: `${CONT[x].e} ${x}` })), answer: c, optClass: 'opt-text',
      hint: contHint(c),
    };
  }
  const k = pick(exact.length && Math.random() < 0.6 ? exact : countries);
  if (type === 'ktap') return {
    key: `map-ktap-${k}`, text: `Tap on <b>${k}</b>!`, say: ['Can you tap on', `${k}?`], main: worldSVG({ tap: 'country', level }), mainClass: 'map-main',
    tap: true, options: [], answer: k, optClass: '', hint: flagHint(k),
  };
  return {
    key: `map-kname-${k}`, text: 'Which country is orange?', say: 'Which country is orange?', main: worldSVG({ hl: k, level }), mainClass: 'map-main',
    options: shuffle([k, ...sample(countries, n, [k])]).map((x) => ({ v: x, html: `${COUNTRY_FLAG[x] || ''} ${x}` })), answer: k, optClass: 'opt-text', hint: flagHint(k),
  };
}

/* ---------------- ANIMALS OF THE WORLD ---------------- */
// choices that would also be right are never offered (e.g. polar bears live in Russia too)
const ANIMAL_ALSO = ContentData.get('content','ANIMAL_ALSO');
// does this animal live in this place? (a country, or a continent)
function livesIn(a, place) {
  const [name, , ans, kind] = a, also = ANIMAL_ALSO[name] || [];
  if (place === ans || also.includes(place)) return true;
  if (CONT[place]) return (kind === 'country' && countryOf(ans).c === place) || also.some((x) => countryOf(x) && countryOf(x).c === place);
  return kind === 'continent' && countryOf(place) && (countryOf(place).c === ans || also.includes(countryOf(place).c));
}
function genAnimals(level) {
  const pool = WORLD_ANIMALS.filter((a) => a[4] <= level);
  const exact = pool.filter((a) => a[4] === level);
  const A = pick(exact.length && Math.random() < 0.6 ? exact : pool);
  const [name, emoji, ans, kind] = A;
  const also = ANIMAL_ALSO[name] || [];
  // the other way round: which animal lives here?
  if (Math.random() < 0.35) {
    const wrong = sample(pool.filter((b) => b[0] !== name && b[1] !== emoji && !livesIn(b, ans)), numOpts(level) - 1);
    const map = kind === 'country' ? worldSVG({ hl: ans, level: 3 }) : worldSVG({ mode: 'cont', hl: ans });
    return {
      key: `ani-which-${name}`, text: `Which animal lives in <b>${theC(ans)}</b>? ${COUNTRY_FLAG[ans] || ''}`, say: ['Which animal lives in', `${theC(ans)}?`],
      main: `<div class="hint-map">${map}</div>`, mainClass: 'map-main',
      options: shuffle([A, ...wrong]).map((b) => ({ v: b[0], html: `<span class="ani-opt"><span class="ani-e">${b[1]}</span>${b[0]}</span>` })), answer: name, optClass: 'opt-text two-col',
      hint: { html: '', say: 'Think about where each animal lives!', remove: true },
    };
  }
  const choices = kind === 'country' ? famousCountries(Math.max(level, 2)) : Object.keys(CONT);
  const wrong = sample(choices.filter((x) => x !== ans && !also.includes(x)), numOpts(level) - 1);
  const map = kind === 'country' ? worldSVG({ hl: ans, level: 3 }) : worldSVG({ mode: 'cont', hl: ans });
  return {
    key: `ani-${name}`, text: `Where does the <b>${name}</b> live?`, say: `Where does the ${name} live?`,
    main: `<div class="big-emoji">${emoji}</div>`,
    options: shuffle([ans, ...wrong]).map((x) => ({ v: x, html: `${COUNTRY_FLAG[x] || (CONT[x] ? '🌍' : '')} ${x}` })), answer: ans, optClass: 'opt-text',
    hint: { html: `<div class="hint-map">${map}</div>`, say: 'Look at the orange place on the map!' },
  };
}

/* ---------------- FAMOUS PLACES ---------------- */
function genPlaces(level) {
  const pool = LANDMARKS.filter((l) => l[4] <= level);
  const exact = pool.filter((l) => l[4] === level);
  const L = pick(exact.length && Math.random() < 0.6 ? exact : pool);
  const [id, name, country, city] = L;
  const n = numOpts(level) - 1;
  const mapHint = { html: `<div class="hint-map">${worldSVG({ hl: country, level: 3 })}</div><div class="hint-note">📍 ${city}</div>`, say: 'Look at the orange place on the map!' };
  const type = pick(['where', 'where', 'which', 'name']);
  if (type === 'which') {
    const others = sample(LANDMARKS.filter((x) => x[2] !== country && !(LM_ALSO[x[0]] || []).includes(country) && x[4] <= Math.max(level, 2)), n);
    return {
      key: `lm-which-${id}`, text: `Which one is in <b>${theC(country)}</b>? ${COUNTRY_FLAG[country] || ''}`, say: ['Which one is in', `${theC(country)}?`],
      main: '', mainClass: 'empty', options: shuffle([L, ...others]).map((x) => ({ v: x[0], html: landmarkArt(x[0], 'small') })), answer: id,
      optClass: 'opt-svg lm-opts', hint: mapHint,
    };
  }
  if (type === 'name') {
    const others = sample(pool.filter((x) => x[0] !== id), n);
    return {
      key: `lm-name-${id}`, text: 'What is this famous place called?', say: 'What is this famous place called?',
      main: landmarkArt(id), mainClass: 'lm-main', options: shuffle([L, ...others]).map((x) => ({ v: x[0], html: x[1] })), answer: id,
      optClass: 'opt-text', hint: { html: `<div class="hint-note">📍 ${city}, ${country} ${COUNTRY_FLAG[country] || ''}</div>`, say: 'Think about where it is!' },
    };
  }
  const not = LM_ALSO[id] || [];
  const wrong = sample(famousCountries(Math.max(level, 2)).filter((x) => x !== country && !not.includes(x)), n);
  return {
    key: `lm-where-${id}`, text: lmWhere(id, `<b>${name}</b>`), say: lmWhere(id, name),
    main: landmarkArt(id), mainClass: 'lm-main', options: shuffle([country, ...wrong]).map((x) => ({ v: x, html: `${COUNTRY_FLAG[x] || ''} ${x}` })), answer: country,
    optClass: 'opt-text', hint: mapHint,
  };
}

/* ---------------- VOCABULARY (Word Wonders) ---------------- */
// [word, picture, meaning (finishes "X means ..."), example sentence, talk-together question, group]
// Words in the same group are never offered as choices together.
const VOCAB = ContentData.get('content','VOCAB');
const vocabMeaning = (v) => `${v[0][0].toUpperCase() + v[0].slice(1)} means ${v[2]}.`;
// word level: the first 55 words keep their old levels; the new ones come from words.js
const VOCAB_LEVEL = new Map(VOCAB.map((v, i) => [v, i < 20 ? 1 : i < 40 ? 2 : 3]));
Object.entries(VOCAB_MORE).forEach(([lv, list]) => list.forEach((v) => { VOCAB.push(v); VOCAB_LEVEL.set(v, +lv); }));
const vocabPool = (level) => VOCAB.filter((v) => VOCAB_LEVEL.get(v) <= level);
// learn cards: this level's words first, then the ones before
const vocabLearnList = (level) => VOCAB.filter((v) => VOCAB_LEVEL.get(v) === level).concat(VOCAB.filter((v) => VOCAB_LEVEL.get(v) < level));

function vocabDistractors(v, pool, n) {
  // no word from the same meaning group, and never two choices with the same picture
  const seen = new Set([v[1]]), out = [];
  for (const x of shuffle(pool.filter((x) => x !== v && (!v[5] || x[5] !== v[5])))) { if (seen.has(x[1])) continue; seen.add(x[1]); out.push(x); if (out.length === n) break; }
  return out;
}

function genVocab(level) {
  const pool = vocabPool(level), exact = pool.filter((x) => VOCAB_LEVEL.get(x) === level);
  const v = pick(exact.length && Math.random() < 0.7 ? exact : pool);
  const [word, pic, gloss] = v;
  const others = vocabDistractors(v, pool, numOpts(level) - 1);
  const meaningHint = { html: `<div class="hint-note">${vocabMeaning(v)}</div>`, say: vocabMeaning(v) };
  if (Math.random() < 0.5) {
    return {
      key: `voc-pic-${word}`, text: `Which picture shows <b>${word}</b>?`, say: `Which picture shows ${word}?`,
      main: `<div class="word sm">${word}</div><button class="mini-speaker" data-speak="${word}">🔊</button>`,
      options: shuffle([v, ...others]).map((o) => ({ v: o[0], html: o[1] })),
      answer: word, optClass: 'opt-emoji', hint: meaningHint,
    };
  }
  return {
    key: `voc-word-${word}`, text: `Which word means <b>${gloss}</b>?`, say: `Which word means ${gloss}?`,
    main: `<div class="big-emoji muted">💬</div>`,
    options: shuffle([v, ...others]).map((o) => ({ v: o[0], html: o[0] })),
    answer: word, optClass: 'opt-text', hint: { html: `<div class="hint-pic">${pic}</div>`, say: 'Look at the picture!' },
  };
}

/* ---------------- CATEGORIES ---------------- */
const CATEGORIES = [
  { id: 'trace', title: 'Letters & Numbers', sub: 'trace A–Z · a–z · 1–20', icon: '✍️', color: '#f76707', trace: true },
  { id: 'phonics', title: 'Letter Sounds', sub: 'starts with · rhymes · blends', icon: '🔠', color: '#7950f2', gen: genPhonics, maxLevel: 5 },
  { id: 'cvc', title: 'Little Words', sub: 'cat · ant · bee', icon: '🐱', color: '#ff8787', gen: (l) => genWords(W3, l, 'cvc') },
  { id: 'w4', title: 'Big Words', sub: 'frog · truck · tiger', icon: '🐸', color: '#69db7c', gen: (l) => genWords(bigWordList(l), l, 'w4'), maxLevel: 5 },
  { id: 'sight', title: 'Sight Words', sub: 'he · she · went', icon: '👀', color: '#e64980', gen: genSight, maxLevel: 4 },
  { id: 'spell', title: 'Spell It', sub: 'drag the letters', icon: '🔤', color: '#20c997', gen: genSpell, maxLevel: 5 },
  { id: 'vocab', title: 'Word Wonders', sub: 'learn new words', icon: '🌟', color: '#f59f00', gen: genVocab, learn: true, maxLevel: 4 },
  { id: 'sent', title: 'Read & Answer', sub: 'sentences & stories', icon: '📖', color: '#74c0fc', gen: genSentence, maxLevel: 6 },
  { id: 'words', title: 'Word Detective', sub: 'nouns · plurals · past tense', icon: '🕵️', color: '#5f3dc4', gen: (l) => genGrammar(l), maxLevel: 5 },
  { id: 'match', title: 'Match It', sub: 'word ↔ picture · 3+2 ↔ 5', icon: '🔗', color: '#5c7cfa', gen: genMatch, maxLevel: 5, roundLen: 5 },
  { id: 'syl', title: 'Clap It!', sub: 'syllables', icon: '👏', color: '#ffd43b', gen: genSyllable },
  { id: 'add', title: 'Adding', sub: '2 + 3 · 34 + 5', icon: '➕', color: '#b197fc', gen: genAdd, maxLevel: 5 },
  { id: 'sub', title: 'Subtraction', sub: '5 − 2 · 47 − 3', icon: '➖', color: '#f783ac', gen: genSub, maxLevel: 5 },
  { id: 'story', title: 'Word Problems', sub: 'math stories', icon: '📝', color: '#4c6ef5', gen: genWordProblem, maxLevel: 5 },
  { id: 'cmp', title: 'Compare', sub: '7 > 3 · 2 < 9', icon: '🐊', color: '#40c057', gen: genCompare, maxLevel: 5 },
  { id: 'mul', title: 'Multiply', sub: '3 × 4 = ?', icon: '✖️', color: '#fa5252', gen: genMul, maxLevel: 5 },
  { id: 'div', title: 'Divide', sub: 'share equally', icon: '➗', color: '#15aabf', gen: genDiv, maxLevel: 5 },
  { id: 'clock', title: 'Clock', sub: 'tell the time', icon: '🕐', color: '#7950f2', gen: genClock, maxLevel: 4 },
  { id: 'shape2', title: 'Shapes', sub: 'flat & 3D shapes', icon: '🔺', color: '#ffa94d', gen: genShapes, maxLevel: 4 },
  { id: 'numsense', title: 'Number Sense', sub: 'place value · fractions · money', icon: '🧮', color: '#0ca678', gen: (l) => genNumSense(l), maxLevel: 5 },
  { id: 'sci', title: 'Science', sub: 'living things · matter · space', icon: '🔬', color: '#1098ad', gen: (l) => genScience(l), maxLevel: 4 },
  { id: 'home', title: 'My Country', sub: 'symbols · places · facts', icon: '🏳️', color: '#e03131', gen: (l) => genCountry(l), maxLevel: 4 },
  { id: 'body', title: 'Body Parts', sub: 'nose · knees · elbows', icon: '🙋', color: '#ff8787', gen: genBody },
  { id: 'gk', title: 'Did You Know?', sub: 'general knowledge', icon: '💡', color: '#fab005', gen: genGK, maxLevel: 4 },
  { id: 'anatomy', title: 'Inside My Body', sub: 'organs · bones · veins', icon: '🫀', color: '#e64980', gen: genAnatomy, maxLevel: 4 },
  { id: 'jobs', title: 'Jobs', sub: 'who helps us?', icon: '🧑‍🚒', color: '#ff922b', gen: genJobs },
  { id: 'flags', title: 'Flags', sub: 'countries', icon: '🚩', color: '#ff6b6b', gen: genFlags },
  { id: 'animals', title: 'Animals of the World', sub: 'where do they live?', icon: '🐼', color: '#2f9e44', gen: genAnimals },
  { id: 'places', title: 'Famous Places', sub: 'landmarks', icon: '🗽', color: '#1c7ed6', gen: genPlaces },
  { id: 'maps', title: 'World Map', sub: 'continents & countries', icon: '🗺️', color: '#38d9a9', gen: genMaps },
  { id: 'mix', title: 'Mix It Up!', sub: 'a bit of all', icon: '🎲', color: '#845ef7', gen: null },
];

// Which games each grade sees, and the level range inside that grade ("start-max").
// Games not listed are hidden for that grade (unless "Show all games" is on).
// Roughly follows Common Core: time to the hour/half hour in 1st, 5 minutes in 2nd;
// multiplication/division start as equal groups and sharing in 2nd.
// which games each grade sees, and the levels that suit it; a child starts in the middle of the range
// and then moves up or down with how well she does (even past the range)
const GRADES = ContentData.get('content','GRADES');
// where a child of this grade starts: the middle of the range (rounded down)
const gradeStart = (r) => { const [a, b] = r.split('-').map(Number); return Math.floor((a + b) / 2); };
const gradeRange = (grade, id) => { const r = GRADES[grade] && GRADES[grade].g[id]; return r ? r.split('-').map(Number) : null; };

const STICKERS = ContentData.get('content','STICKERS');
