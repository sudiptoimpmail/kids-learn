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
// each letter's sound, as phonemes for the voice model (recorded into audio/ as "sound b" etc.)
// stop sounds (b, d, k…) are kept short with no "uh" after them, the way phonics is taught
const LETTER_SOUNDS = { a: 'ˈæ', b: 'b', c: 'k', d: 'd', e: 'ˈɛ', f: 'ˈf', g: 'ɡ', h: 'h', i: 'ˈɪ', j: 'dʒ', k: 'k', l: 'ˈl', m: 'ˈm', n: 'ˈn', o: 'ˈɑ', p: 'p',
  q: 'kw', r: 'ˈɹ', s: 'ˈs', t: 't', u: 'ˈʌ', v: 'ˈv', w: 'w', x: 'ks', y: 'j', z: 'ˈz', sh: 'ˈʃ', ch: 'tʃ', th: 'ˈθ' };
const soundClip = (l) => `sound ${l}`;
// letter tiles: tap one to hear its sound; tap ▶ (or slide a finger across) to hear them blend into the word
function wireBlend(q) {
  const tiles = $$('.ph-tiles .ph-t'); if (!tiles.length) return;
  const lit = (i) => tiles.forEach((t, k) => t.classList.toggle('on', k === i));
  const playOne = (i) => { lit(i); return say([soundClip(q.blend[i])]).then(() => lit(-1)); };
  // keyboard only: a finger or mouse tap is handled on pointerdown below (the row captures the pointer, so taps never reach a tile's click)
  tiles.forEach((t, i) => (t.onclick = (e) => { e.stopPropagation(); if (e.detail === 0) playOne(i); }));
  let blending = false;
  const blendAll = async () => {
    if (blending) return; blending = true;
    for (let i = 0; i < tiles.length; i++) { lit(i); await say([soundClip(q.blend[i])]); await sleep(120); }
    lit(-1); tiles.forEach((t) => t.classList.add('joined'));
    await say([q.answer]); setTimeout(() => tiles.forEach((t) => t.classList.remove('joined')), 900); blending = false;
  };
  const go = $('.ph-blend-go'); if (go) go.onclick = (e) => { e.stopPropagation(); blendAll(); };
  // slide across the tiles: each tile sounds as the finger reaches it
  const row = $('.ph-tiles'); let seen = -1;
  const tileAt = (x) => tiles.findIndex((t) => { const r = t.getBoundingClientRect(); return x >= r.left && x <= r.right; });
  row.onpointerdown = (e) => {
    seen = tileAt(e.clientX);
    if (seen >= 0) playOne(seen);          // a tap on a letter says its sound
    try { row.setPointerCapture(e.pointerId); } catch {}
  };
  row.onpointermove = (e) => {
    if (!e.buttons && e.pointerType === 'mouse') return;
    const i = tileAt(e.clientX);
    if (i > seen) { seen = i; lit(i); say([soundClip(q.blend[i])]); if (i === tiles.length - 1) setTimeout(() => { lit(-1); say([q.answer]); }, 450); }
  };
}
// a big letter you can tap to hear its sound
function wireLetter(q) { const el = $('#qMain .ph-letters'); if (el && q.letterSound) el.onclick = () => { el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce'); say([soundClip(q.letterSound)]); }; }
const picOpt = (x) => ({ v: x[0], html: x[1] });
const namesHint = (opts, say) => ({ html: `<div class="hint-note">${opts.map((o) => `${o[1]} ${o[0]}`).join(' · ')}</div>`, say: [say, ...opts.map((o) => o[0])] });
const firstLetter = (w) => w[0];
// the big letter on the card: a real button, so a tap always works (iPad Safari is unreliable with taps on plain text)
const tapLetter = (l, label = `${l.toUpperCase()} ${l}`) => `<button class="ph-letters tap" aria-label="Hear the sound">${label}</button><small class="ph-tip">👆 tap the letter to hear its sound</small>`;

// workbook-style letter cards for beginners: tap every picture that starts with a letter, or follow a letter path
const PH_PATH_THEMES = [['🦓', '🦓', 'baby zebra'], ['🐥', '🦆', 'duckling'], ['🐶', '🏠', 'puppy'], ['🐜', '🍓', 'ant'], ['🐰', '🥕', 'bunny']];
function genPhonicsExtra(level) {
  const P = phonData();
  if (Math.random() < 0.55) {
    // Tap all the pictures that start with B (2–3 right among 6)
    const byLetter = {}; for (const x of P.first) (byLetter[firstLetter(x[0])] = byLetter[firstLetter(x[0])] || []).push(x);
    const L = pick(Object.keys(byLetter).filter((k) => byLetter[k].length >= 2));
    const right = sample(byLetter[L], Math.min(3, byLetter[L].length));
    const wrong = sample(P.words.filter(([w]) => firstLetter(w) !== L && !(L === 'c' && w[0] === 'k') && !(L === 'k' && w[0] === 'c')), 6 - right.length);
    const opts = shuffle([...right, ...wrong]);
    return {
      key: `ph-all-${L}-${right.map((x) => x[0]).join('')}`, text: `Tap <b>all</b> the pictures that start with <b>${L.toUpperCase()}</b>!`,
      say: ['Tap all the pictures that start with', `${L.toUpperCase()}!`], main: tapLetter(L), mainClass: 'ph-main', letterSound: L,
      options: opts.map(picOpt), answer: right.map((x) => x[0]).join(','), optClass: 'opt-emoji six', multi: right.map((x) => x[0]),
      hint: { html: '', say: [`${L.toUpperCase()} says`, soundClip(L), ...right.map((x) => x[0])] },
    };
  }
  // follow the letter: a path of one letter from the baby to its mom; other letters are dead ends
  const L = pick('abcdefghjklmnoprstuvwz'.split(''));
  const [hero, home, who] = pick(PH_PATH_THEMES);
  // a path that only goes right or down never touches itself, so the letter boxes show exactly one way
  const cols = 4, rows = 5, route = [[0, 0]];
  while (route.length < cols + rows - 1) { const [x, y] = route[route.length - 1]; route.push(x === cols - 1 ? [x, y + 1] : y === rows - 1 ? [x + 1, y] : Math.random() < 0.5 ? [x + 1, y] : [x, y + 1]); }
  const onRoute = new Set(route.map((c) => c.join()));
  const others = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((x) => x !== L && !(LOOKALIKE_SAFE[L] || '').includes(x));
  const grid = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid.push(onRoute.has(`${x},${y}`) ? L : pick(others));
  return {
    key: `ph-path-${L}-${route.length}-${rand(1e5)}`, text: `Follow the <b>${L}</b>'s to take the ${who} home!`,
    say: ['Follow the letter', `${L.toUpperCase()}!`], main: tapLetter(L), mainClass: 'ph-main', letterSound: L,
    options: [], answer: 'done', optClass: 'spell-tray',
    letterPath: { L, cols, rows, grid, route, hero, home }, hint: { html: '', say: [`${L.toUpperCase()} says`, soundClip(L)] },
  };
}
// letters too easy to mix up for a beginner are never used as the wrong ones in a letter path
const LOOKALIKE_SAFE = { b: 'dpq', d: 'bpq', p: 'bdq', q: 'bdp', m: 'nw', n: 'mu', u: 'nv', w: 'mv', i: 'lj', l: 'i', j: 'i' };
function genPhonics(level) {
  if (level <= 2 && Math.random() < 0.3) return genPhonicsExtra(level);
  if (level >= 4 && Math.random() < 0.3 && typeof genGrade1Phonics === 'function') return genGrade1Phonics();
  // 1st-grade word list (short/long vowels, blends, endings) mixed into the same round — no extra tile
  if (level >= 3 && Math.random() < 0.25 && typeof genGrade1Read === 'function') return genGrade1Read(Math.min(5, level - 2 + rand(2)));
  const P = phonData(), n = numOpts(Math.min(level, 2)) - 1;
  const t = Math.random();
  // ---- level 5: blends and digraphs (sh, ch, tr, st …)
  if (level >= 5 && t < 0.6) {
    const keys = Object.keys(P.blends), b = pick(keys), right = pick(P.blends[b]);
    const wrong = sample(P.words.filter(([w]) => !w.startsWith(b)), n);
    const opts = shuffle([right, ...wrong]);
    return {
      key: `ph-blend-${b}-${right[0]}`, text: `Which picture starts with <b>${b}</b>?`, say: ['Which picture starts with', `${b.toUpperCase().split('').join(' ')}?`],
      main: LETTER_SOUNDS[b] ? tapLetter(b, b) : `<div class="ph-letters">${b}</div>`, mainClass: 'ph-main', options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji', letterSound: LETTER_SOUNDS[b] ? b : undefined,
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
        key: `ph-blendw-${w}`, text: 'Blend the sounds. Which picture is it?', say: ['Tap each letter to hear its sound.', 'Then slide your finger to blend them!'],
        main: `<div class="ph-tiles">${w.split('').map((c, i) => `<button class="ph-t" style="animation-delay:${i * 0.25}s">${c}</button>`).join('')}</div><button class="ph-blend-go">▶ Blend</button>`, mainClass: 'ph-main',
        options: opts.map(picOpt), answer: w, optClass: 'opt-emoji', blend: w.split(''),
        hint: { html: `<div class="hint-note">${w.split('').join(' · ')} → ${w}</div>`, say: [...w.split('').map(soundClip), w] },
      };
    }
    const L = pick([...new Set(P.cvc.map(([w]) => w[2]))]);
    const ends = P.cvc.filter(([w]) => w.endsWith(L));
    if (ends.length) {
      const right = pick(ends), wrong = sample(P.words.filter(([w]) => !w.endsWith(L) && !w.endsWith(L + 'e')), n);
      const opts = shuffle([right, ...wrong]);
      return {
        key: `ph-end-${L}-${right[0]}`, text: `Which picture ends with <b>${L}</b>?`, say: ['Which picture ends with', `${L.toUpperCase()}?`],
        main: tapLetter(L), mainClass: 'ph-main', options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji', letterSound: L,
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
      options: opts.map(picOpt), answer: b[0], optClass: 'opt-emoji', hint: namesHint(opts, 'Say each picture. Listen to the end!'),
    };
  }
  // ---- level 1: first letter
  const right = pick(P.first), L = firstLetter(right[0]);
  const wrong = sample(P.words.filter(([w]) => firstLetter(w) !== L && !(L === 'c' && w[0] === 'k') && !(L === 'k' && w[0] === 'c')), n);
  const opts = shuffle([right, ...wrong]);
  return {
    key: `ph-first-${L}-${right[0]}`, text: `Which picture starts with <b>${L.toUpperCase()}</b>?`, say: ['Which picture starts with', `${L.toUpperCase()}?`],
    main: tapLetter(L), mainClass: 'ph-main', options: opts.map(picOpt), answer: right[0], optClass: 'opt-emoji',
    letterSound: L, hint: { html: namesHint(opts, '').html, say: [`${L.toUpperCase()} says`, soundClip(L), 'Listen to the start of each picture!', ...opts.map((o) => o[0])] },
  };
}
