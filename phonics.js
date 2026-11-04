/* =========================================================
   🔠 Letter Sounds (phonics) — pictures and sounds, ages 4–7
   Level 1: Which picture starts with B?          (first letter)
   Level 2: Which picture rhymes with cat?        (rhymes)
   Level 3: Which picture ends with T? · blend the letters c-a-t into a word
   Level 4: Which picture has the same middle sound as cat? (short vowels)
   Level 5: Which picture starts with SH / CH / TR …? (digraphs and blends)
   The pictures and words come from the word lists in content.js.
   ========================================================= */
// words whose picture could be read two ways, or whose first letter doesn't make its usual sound
const PHON_SKIP = new Set(['red', 'sad', 'wet', 'hug', 'mud', 'hot', 'see', 'run', 'six', 'ten', 'kid', 'man', 'boy', 'girl', 'woman', 'blue', 'pink', 'cold',
  'stop', 'food', 'tube', 'green', 'white', 'black', 'brown', 'home', 'mother', 'father', 'sister', 'brother', 'nurse', 'yellow', 'purple', 'pot', 'net', 'can',
  'ram', 'lip', 'pin', 'hut', 'mask', 'vase', 'tent', 'swan', 'seal', 'gift', 'wing', 'yo-yo', 'puppy', 'woman', 'owl', 'pie', 'key', 'fly', 'toy', 'see']);
let PHON = null;
function phonData() {
  if (PHON) return PHON;
  const all = W3.concat(W4, W5, WL).filter(([w]) => !PHON_SKIP.has(w) && /^[a-z]+$/.test(w));
  const uniq = [...new Map(all.map((x) => [x[0], x])).values()];
  const cvc = uniq.filter(([w]) => /^[^aeiou][aeiou][^aeiouwxy]$/.test(w));
  const startsWithDigraph = (w) => /^(sh|ch|th|wh|kn|wr|ph)/.test(w);
  PHON = {
    words: uniq,
    first: uniq.filter(([w]) => !startsWithDigraph(w) && !/^[aeiou]/.test(w) || /^(apple|ant|egg|octopus|umbrella|anchor)$/.test(w)),
    cvc,
    // rhyme families: words that share their ending (-at, -ug …)
    rimes: Object.values(cvc.reduce((m, x) => ((m[x[0].slice(1)] = m[x[0].slice(1)] || []).push(x), m), {})).filter((g) => g.length >= 2),
    blends: { sh: [], ch: [], th: [], tr: [], dr: [], br: [], cr: [], fr: [], gr: [], st: [], sn: [], sl: [], sw: [], bl: [], cl: [], pl: [] },
  };
  for (const x of uniq) for (const b of Object.keys(PHON.blends)) if (x[0].startsWith(b)) PHON.blends[b].push(x);
  // a few extra pictures for the sounds that have only one or two words in the lists
  const extra = [['shell', '🐚'], ['shark', '🦈'], ['chick', '🐤'], ['cheese', '🧀'], ['cherry', '🍒'], ['thumb', '👍'], ['three', '3️⃣'], ['tractor', '🚜'],
    ['dragon', '🐉'], ['broom', '🧹'], ['crown', '👑'], ['crayon', '🖍️'], ['fries', '🍟'], ['grapes', '🍇'], ['strawberry', '🍓'], ['snail', '🐌'], ['snowman', '⛄'],
    ['sloth', '🦥'], ['cloud', '☁️'], ['clown', '🤡'], ['plane', '✈️'], ['plant', '🪴'], ['sheep', '🐑'],
    ['shirt', '👕'], ['chair', '🪑'], ['train', '🚆'], ['truck', '🚚'], ['bread', '🍞'], ['brush', '🪥'], ['crab', '🦀'], ['frog', '🐸'], ['drum', '🥁'], ['star', '⭐'],
    ['snake', '🐍'], ['sled', '🛷'], ['clock', '🕰️'], ['ship', '🚢'], ['shoe', '👟'], ['tree', '🌳']];
  for (const x of extra) for (const b of Object.keys(PHON.blends)) if (x[0].startsWith(b) && !PHON.blends[b].some((y) => y[0] === x[0])) PHON.blends[b].push(x);
  for (const b of Object.keys(PHON.blends)) if (PHON.blends[b].length < 2) delete PHON.blends[b];
  return PHON;
}
const picOpt = (x) => ({ v: x[0], html: x[1] });
const namesHint = (opts, say) => ({ html: `<div class="hint-note">${opts.map((o) => `${o[1]} ${o[0]}`).join(' · ')}</div>`, say: [say, ...opts.map((o) => o[0])] });
const firstLetter = (w) => w[0];

function genPhonics(level) {
  const P = phonData(), n = numOpts(Math.min(level, 2)) - 1;
  const t = Math.random();
  // ---- level 5: blends and digraphs (sh, ch, tr, st …)
  if (level >= 5 && t < 0.6) {
    const keys = Object.keys(P.blends), b = pick(keys), right = pick(P.blends[b]);
    const wrong = sample(P.words.filter(([w]) => !w.startsWith(b)), n);
    const opts = shuffle([right, ...wrong]);
    return {
      key: `ph-blend-${b}-${right[0]}`, text: `Which picture starts with <b>${b}</b>?`, say: ['Which picture starts with', `${b.toUpperCase().split('').join(' ')}?`],
      main: `<div class="ph-letters">${b}</div>`, mainClass: 'ph-main', options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji',
      hint: namesHint(opts, 'Say each picture. Listen to the start!'),
    };
  }
  // ---- level 4: same middle (short vowel) sound
  if (level >= 4 && t < 0.75) {
    const target = pick(P.cvc), v = target[0][1];
    const right = pick(P.cvc.filter(([w]) => w[1] === v && w !== target[0]));
    const wrong = sample(P.cvc.filter(([w]) => w[1] !== v), n);
    if (right) {
      const opts = shuffle([right, ...wrong]);
      return {
        key: `ph-mid-${target[0]}-${right[0]}`, text: `Which picture has the same <b>middle sound</b> as <b>${target[0]}</b>?`,
        say: ['Which picture has the same middle sound as', `${target[0]}?`],
        main: `<div class="ph-word"><span class="ph-e">${target[1]}</span>${target[0][0]}<b>${target[0][1]}</b>${target[0][2]}</div>`, mainClass: 'ph-main',
        options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji', hint: namesHint(opts, `Listen for the middle sound in ${target[0]}.`),
      };
    }
  }
  // ---- level 3: ending letter, or blend the letters into a word
  if (level >= 3 && t < 0.85) {
    if (Math.random() < 0.5) {
      const right = pick(P.cvc), w = right[0];
      const wrong = sample(P.cvc.filter((x) => x[0] !== w && x[0][0] === w[0] || x[0] !== w && x[0].slice(1) === w.slice(1)), n);
      const fill = wrong.length < n ? sample(P.cvc.filter((x) => x[0] !== w && !wrong.includes(x)), n - wrong.length) : [];
      const opts = shuffle([right, ...wrong, ...fill]);
      return {
        key: `ph-blendw-${w}`, text: 'Put the sounds together. Which word is it?', say: 'Put the sounds together. Which word is it?',
        main: `<div class="ph-tiles">${w.split('').map((c, i) => `<span style="animation-delay:${i * 0.35}s">${c}</span>`).join('')}</div>`, mainClass: 'ph-main',
        options: opts.map(picOpt), answer: w, optClass: 'opt-emoji', hint: { html: `<div class="hint-note">${w.split('').join(' · ')} → ${w}</div>`, say: w, slow: true },
      };
    }
    const L = pick([...new Set(P.cvc.map(([w]) => w[2]))]);
    const ends = P.cvc.filter(([w]) => w.endsWith(L));
    if (ends.length) {
      const right = pick(ends), wrong = sample(P.words.filter(([w]) => !w.endsWith(L) && !w.endsWith(L + 'e')), n);
      const opts = shuffle([right, ...wrong]);
      return {
        key: `ph-end-${L}-${right[0]}`, text: `Which picture ends with <b>${L}</b>?`, say: ['Which picture ends with', `${L.toUpperCase()}?`],
        main: `<div class="ph-letters">${L.toUpperCase()} ${L}</div>`, mainClass: 'ph-main', options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji',
        hint: namesHint(opts, 'Say each picture. Listen to the end!'),
      };
    }
  }
  // ---- level 2: rhymes
  if (level >= 2 && t < 0.92) {
    const fam = pick(P.rimes), [a, b] = sample(fam, 2);
    const wrong = sample(P.cvc.filter(([w]) => w.slice(1) !== a[0].slice(1)), n);
    const opts = shuffle([b, ...wrong]);
    return {
      key: `ph-rhyme-${a[0]}-${b[0]}`, text: `Which picture rhymes with <b>${a[0]}</b>?`, say: ['Which picture rhymes with', `${a[0]}?`],
      main: `<div class="ph-word"><span class="ph-e">${a[1]}</span>${a[0]}</div>`, mainClass: 'ph-main',
      options: opts.map(picOpt), answer: b[0], optClass: 'opt-emoji', hint: namesHint(opts, `Rhymes sound the same at the end, like ${a[0]}!`),
    };
  }
  // ---- level 1: first letter
  const right = pick(P.first), L = firstLetter(right[0]);
  const wrong = sample(P.words.filter(([w]) => firstLetter(w) !== L && !(L === 'c' && w[0] === 'k') && !(L === 'k' && w[0] === 'c')), n);
  const opts = shuffle([right, ...wrong]);
  return {
    key: `ph-first-${L}-${right[0]}`, text: `Which picture starts with <b>${L.toUpperCase()}</b>?`, say: ['Which picture starts with', `${L.toUpperCase()}?`],
    main: `<div class="ph-letters">${L.toUpperCase()} ${L}</div>`, mainClass: 'ph-main', options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji',
    hint: namesHint(opts, 'Say each picture. Listen to the start!'),
  };
}
