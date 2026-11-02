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
const W3 = [
  ['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['hen', '🐔'], ['bat', '🦇'], ['bus', '🚌'],
  ['sun', '☀️'], ['cup', '🥤'], ['bed', '🛏️'], ['box', '📦'], ['fox', '🦊'], ['hat', '🎩'],
  ['map', '🗺️'], ['pen', '🖊️'], ['pot', '🍲'], ['rat', '🐀'], ['web', '🕸️'], ['bug', '🐛'],
  ['net', '🥅'], ['van', '🚐'], ['log', '🪵'], ['leg', '🦵'], ['bag', '👜'], ['cap', '🧢'],
  ['can', '🥫'], ['kid', '🧒'], ['man', '👨'], ['pan', '🍳'], ['ram', '🐏'], ['nut', '🥜'],
  ['six', '6️⃣'], ['ten', '🔟'], ['jet', '🛩️'], ['lip', '👄'], ['pin', '📌'], ['hut', '🛖'],
  ['tub', '🛁'], ['red', '🔴'], ['sad', '😢'], ['wet', '💦'], ['hug', '🤗'], ['mud', '🟤'],
  ['ant', '🐜'], ['pie', '🥧'], ['key', '🔑'], ['mug', '☕'], ['fly', '🪰'], ['bee', '🐝'],
  ['boy', '👦'], ['toy', '🧸'], ['owl', '🦉'], ['run', '🏃'], ['hot', '🥵'], ['see', '👀'],
];
const W4 = [
  ['frog', '🐸'], ['duck', '🦆'], ['fish', '🐟'], ['crab', '🦀'], ['drum', '🥁'], ['bell', '🔔'],
  ['cake', '🍰'], ['kite', '🪁'], ['moon', '🌙'], ['star', '⭐'], ['ship', '🚢'], ['milk', '🥛'],
  ['sock', '🧦'], ['tree', '🌳'], ['bird', '🐦'], ['lion', '🦁'], ['bear', '🐻'], ['ball', '⚽'],
  ['book', '📖'], ['boat', '⛵'], ['corn', '🌽'], ['door', '🚪'], ['hand', '✋'], ['lamp', '💡'],
  ['rain', '🌧️'], ['ring', '💍'], ['rose', '🌹'], ['shoe', '👟'], ['snow', '❄️'], ['worm', '🪱'],
  ['gift', '🎁'], ['lock', '🔒'], ['nose', '👃'], ['foot', '🦶'], ['king', '🤴'], ['goat', '🐐'],
  ['deer', '🦌'], ['swan', '🦢'], ['seal', '🦭'], ['sled', '🛷'], ['pear', '🍐'], ['bone', '🦴'],
  ['tent', '⛺'], ['bike', '🚲'], ['home', '🏠'], ['leaf', '🍃'], ['nest', '🪺'], ['soap', '🧼'],
  ['mask', '🎭'], ['coin', '🪙'], ['vase', '🏺'], ['girl', '👧'], ['wolf', '🐺'], ['wing', '🪽'],
  ['food', '🍱'], ['blue', '🔵'], ['pink', '🩷'], ['stop', '🛑'], ['cold', '🥶'], ['tube', '🧪'],
];
const W5 = [
  ['truck', '🚚'], ['tiger', '🐯'], ['brick', '🧱'], ['puppy', '🐶'], ['nurse', '🧑‍⚕️'], ['brush', '🪥'],
  ['woman', '👩'], ['green', '🟢'], ['white', '⚪'], ['black', '⚫'], ['brown', '🟤'], ['yo-yo', '🪀'],
  ['apple', '🍎'], ['bread', '🍞'], ['clock', '🕰️'], ['train', '🚆'], ['sheep', '🐑'], ['zebra', '🦓'],
  ['robot', '🤖'], ['pizza', '🍕'], ['shirt', '👕'], ['chair', '🪑'], ['snake', '🐍'], ['horse', '🐴'],
];
const WL = [
  ['orange', '🍊'], ['anchor', '⚓'], ['mother', '👩‍👧'], ['father', '👨‍👧'], ['sister', '👭'], ['brother', '👬'],
  ['alligator', '🐊'], ['yellow', '🟡'], ['purple', '🟣'], ['rabbit', '🐰'], ['monkey', '🐵'], ['turtle', '🐢'],
  ['rocket', '🚀'], ['pencil', '✏️'], ['spider', '🕷️'], ['flower', '🌸'], ['banana', '🍌'], ['carrot', '🥕'],
  ['castle', '🏰'], ['penguin', '🐧'], ['balloon', '🎈'], ['dragon', '🐉'],
];
const bigWordList = (level) => (level <= 3 ? W4 : level === 4 ? W5 : W5.concat(WL));

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const CONS = 'bcdfghjklmnprstvwz'.split('');

// words that look alike come first as distractors at higher levels
function similarWords(list, word, n, level) {
  const others = list.filter(([w]) => w !== word);
  if (level < 3) return sample(others, n);
  const score = ([w]) =>
    (w[0] === word[0] ? 2 : 0) + (w.slice(-2) === word.slice(-2) ? 2 : 0) + (w.length === word.length ? 1 : 0) + Math.random();
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}

function genWords(list, level, kind) {
  const [w, e] = pick(list);
  const n = numOpts(level) - 1;
  const type = pick(['read', 'read', 'find', 'missing']);
  const picHint = { html: `<div class="hint-pic">${e}</div>`, say: 'Look at the picture!' };

  if (type === 'read') {
    const others = similarWords(list, w, n, level);
    return {
      key: `${kind}-read-${w}`,
      text: 'Read the word. Tap the picture!',
      say: 'Read the word, and tap the picture!',
      main: `<div class="word">${w}</div>`,
      options: shuffle([[w, e], ...others]).map(([ow, oe]) => ({ v: ow, html: oe })),
      answer: w,
      optClass: 'opt-emoji',
      hint: { html: `<div class="hint-letters">${w.split('').join(' · ')}</div>`, say: 'Sound it out!' },
    };
  }

  if (type === 'find') {
    const others = similarWords(list, w, n, level);
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
  if (w.length === 3) pos = 1; // CVC: the vowel
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
    main: `<div class="word">${shown}</div>`,
    options: opts.map((l) => ({ v: l, html: l })),
    answer: letter,
    optClass: 'opt-letter',
    hint: picHint,
    fill: { pos, word: w },
  };
}

/* ---------------- SIGHT WORDS ---------------- */
// [word, kind, level]  kind is used to pick distractors that do NOT fit a sentence
const SIGHT = [
  ['I', 'pron', 1], ['see', 'verb', 1], ['go', 'verb', 1], ['up', 'prep', 1], ['no', 'misc', 1], ['yes', 'misc', 1],
  ['he', 'pron', 1], ['she', 'pron', 1], ['like', 'verb', 1], ['big', 'adj', 1], ['run', 'verb', 1], ['fun', 'adj', 1],
  ['stop', 'verb', 1], ['the', 'misc', 1],
  ['down', 'prep', 2], ['here', 'prep', 2], ['all', 'misc', 2], ['some', 'misc', 2], ['went', 'verb', 2], ['away', 'prep', 2],
  ['make', 'verb', 2], ['take', 'verb', 2], ['good', 'adj', 2], ['bad', 'adj', 2], ['happy', 'adj', 2], ['sad', 'adj', 2],
  ['hot', 'adj', 2], ['cold', 'adj', 2], ['not', 'misc', 2], ['but', 'misc', 2], ['same', 'adj', 2], ['we', 'pron', 2],
  ['from', 'prep', 3], ['over', 'prep', 3], ['under', 'prep', 3], ['write', 'verb', 3], ['wrong', 'adj', 3],
  ['smell', 'verb', 3], ['touch', 'verb', 3], ['crawl', 'verb', 3], ['ride', 'verb', 3], ['chew', 'verb', 3],
  ['huge', 'adj', 3], ['rude', 'adj', 3], ['heat', 'noun', 3], ['hang', 'verb', 3], ['exit', 'noun', 3],
];
const SIGHT_KIND = Object.fromEntries(SIGHT.map(([w, k]) => [w.toLowerCase(), k]));
// [sentence with ___, answer, level]
const FILL = [
  ['I ___ my dog.', 'like', 1], ['I can ___ the moon.', 'see', 1], ['Look ___ at the sky!', 'up', 1],
  ['___ is my brother.', 'He', 1], ['___ is my sister.', 'She', 1], ['Red means ___.', 'stop', 1],
  ['Green means ___.', 'go', 1], ['An elephant is ___.', 'big', 1], ['I can ___ fast.', 'run', 1],
  ['The party was so much ___!', 'fun', 1], ['Is it a cat? ___, it is!', 'Yes', 1], ['___, it is not a dog.', 'No', 1],
  ['Mom and I ___ to the park.', 'went', 2], ['The cat ran ___.', 'away', 2], ['Come ___ and sit with me.', 'here', 2],
  ['Can you ___ a cake?', 'make', 2], ['Please ___ one cookie.', 'take', 2], ['You did a ___ job!', 'good', 2],
  ['I am ___ on my birthday.', 'happy', 2], ['He is ___ because he lost his toy.', 'sad', 2], ['The sun is ___.', 'hot', 2],
  ['Ice is very ___.', 'cold', 2], ['Can I have ___ juice?', 'some', 2], ['We have the ___ shoes!', 'same', 2],
  ['Sit ___ on the rug.', 'down', 2], ['Did you eat ___ your peas?', 'all', 2], ['A fish can ___ walk.', 'not', 2],
  ['I like milk, ___ I do not like tea.', 'but', 2], ['___ like to play together.', 'We', 2],
  ['I got a gift ___ Grandma.', 'from', 3], ['The bird flew ___ the tree.', 'over', 3], ['The cat hid ___ the bed.', 'under', 3],
  ['I like to ___ my bike.', 'ride', 3], ['A baby can ___ on the floor.', 'crawl', 3], ['I can ___ my name.', 'write', 3],
  ['I ___ the flowers with my nose.', 'smell', 3], ['Do not ___ the hot stove.', 'touch', 3], ['A whale is ___.', 'huge', 3],
  ['It is ___ to grab toys.', 'rude', 3], ['___ your food with your mouth closed.', 'Chew', 3], ['That answer is ___. Try again!', 'wrong', 3],
  ['Please ___ your coat on the hook.', 'hang', 3], ['The fire gives off ___.', 'heat', 3], ['Go out the ___ door.', 'exit', 3],
];
const fillFull = (f) => f[0].replace('___', f[1]);
const OPPOSITES = [['up', 'down'], ['over', 'under'], ['yes', 'no'], ['hot', 'cold'], ['happy', 'sad'], ['good', 'bad'],
  ['go', 'stop'], ['he', 'she'], ['boy', 'girl'], ['man', 'woman'], ['mother', 'father'], ['sister', 'brother'],
  ['huge', 'tiny'], ['take', 'give'], ['right', 'wrong']];
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
      key: `sight-opp-${pair[0]}`, text: `What is the opposite of <b>${pair[0]}</b>?`, say: ['What is the opposite of', `${pair[0]}?`],
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
const SPELL3 = ['cat', 'dog', 'pig', 'hen', 'bat', 'bus', 'sun', 'cup', 'bed', 'box', 'fox', 'hat', 'map', 'pen', 'web', 'bug',
  'van', 'leg', 'bag', 'cap', 'can', 'pan', 'nut', 'jet', 'pin', 'tub', 'log', 'rat', 'net',
  'ant', 'pie', 'key', 'mug', 'fly', 'bee', 'boy', 'toy', 'owl', 'red'];
const SPELL4 = ['frog', 'duck', 'fish', 'crab', 'drum', 'bell', 'cake', 'kite', 'moon', 'star', 'ship', 'milk', 'sock', 'tree',
  'bird', 'lion', 'bear', 'ball', 'book', 'boat', 'corn', 'door', 'hand', 'lamp', 'ring', 'rose', 'shoe', 'snow', 'gift',
  'lock', 'nose', 'foot', 'king', 'goat', 'deer', 'swan', 'seal', 'pear', 'bone', 'tent', 'bike', 'leaf', 'nest', 'soap',
  'mask', 'coin', 'vase', 'girl', 'wolf', 'wing', 'food', 'blue', 'pink', 'stop'];
const SPELL5 = ['truck', 'tiger', 'brick', 'puppy', 'nurse', 'brush', 'woman', 'green', 'white', 'black', 'brown', 'apple',
  'bread', 'clock', 'train', 'sheep', 'zebra', 'robot', 'pizza', 'shirt', 'chair', 'snake', 'horse'];
const SPELLL = ['orange', 'anchor', 'mother', 'father', 'sister', 'brother', 'yellow', 'purple', 'rabbit', 'monkey', 'turtle',
  'rocket', 'pencil', 'spider', 'flower', 'banana', 'carrot', 'castle', 'alligator'];
const EMOJI_OF = Object.fromEntries(W3.concat(W4, W5, WL));
const LOOKALIKE = { b: 'dp', d: 'bp', p: 'bq', q: 'p', m: 'n', n: 'mu', u: 'n', i: 'l', l: 'i', e: 'a', a: 'eo', o: 'a', s: 'z', c: 'k', k: 'c' };

// Levels: 1 Pre-K · 2 K · 3 K/1st · 4 1st · 5 2nd
function genSpell(level) {
  let word, nBlank, nExtra, mode = 'pic', sentence = null;
  const r = Math.random();
  if (level === 1) { word = pick(SPELL3); nBlank = r < 0.5 ? 1 : 2; nExtra = 2; }
  else if (level === 2) {
    if (r < 0.5) { word = pick(SPELL3); nBlank = 3; nExtra = 3; }
    else { word = pick(SPELL4); nBlank = 2; nExtra = 3; }
  } else if (level === 3) { word = pick(SPELL4); nBlank = r < 0.75 ? 4 : 3; nExtra = 4; }
  else if (level === 4) {
    if (r < 0.4) { word = pick(SPELL5); nBlank = 2 + rand(2); nExtra = 4; }
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
    say = [full ? 'Spell the word.' : 'Fill in the missing letters.', word];
    main = `<div class="spell-pic">${EMOJI_OF[word]}</div><button class="mini-speaker" data-speak="${word}" aria-label="Hear the word">🔊</button>`;
  }
  return {
    key: `spell-${word}-${blanks.join('')}`,
    text, say, speak: word, main,
    options: [],
    answer: word,
    optClass: 'spell-tray',
    spell: { word, blanks, tiles: shuffle(need.concat(extras)) },
    hint: { html: '', say: sentence ? fillFull(sentence) : word, slow: true },
  };
}

/* ---------------- SENTENCES ---------------- */
const SENTENCES = [
  ['The cat is on the mat.', 'Where is the cat?', ['on the mat', 'in the box', 'in the bed']],
  ['The dog can run.', 'What can the dog do?', ['run 🏃', 'fly 🕊️', 'read 📖']],
  ['I see a red hen.', 'What color is the hen?', ['red 🔴', 'blue 🔵', 'green 🟢']],
  ['The sun is hot.', 'What is hot?', ['the sun ☀️', 'the snow ❄️', 'the ice 🧊']],
  ['Sam has a big hat.', 'Who has a hat?', ['Sam', 'Pam', 'Tom']],
  ['The pig is in the mud.', 'Where is the pig?', ['in the mud', 'on the bus', 'in the van']],
  ['A fox sat on a log.', 'Who sat on a log?', ['a fox 🦊', 'a cat 🐱', 'a hen 🐔']],
  ['I can see six ducks.', 'How many ducks?', ['6', '3', '10']],
  ['The frog can jump.', 'What can the frog do?', ['jump', 'sing', 'cook']],
  ['Mom has a blue cup.', 'What does Mom have?', ['a cup 🥤', 'a hat 🎩', 'a bag 👜']],
  ['The bus is big and yellow.', 'What color is the bus?', ['yellow 🟡', 'pink 🩷', 'black ⚫']],
  ['Ben fed the fish.', 'What did Ben feed?', ['the fish 🐟', 'the dog 🐶', 'the cat 🐱']],
  ['The bug is on the rug.', 'Where is the bug?', ['on the rug', 'on the bed', 'in the cup']],
  ['We go to the park.', 'Where do we go?', ['the park 🌳', 'the shop 🏪', 'the zoo 🦁']],
  ['The moon is up at night.', 'When is the moon up?', ['at night 🌙', 'at lunch 🥪', 'in the bath 🛁']],
  ['I like to eat cake.', 'What do I like to eat?', ['cake 🍰', 'soap 🧼', 'rocks 🪨']],
  ['The bird is in the nest.', 'Where is the bird?', ['in the nest', 'in the pot', 'in the car']],
  ['Dad can fix the car.', 'What can Dad fix?', ['the car 🚗', 'the cake 🍰', 'the moon 🌙']],
  ['It is cold. I see snow.', 'What do I see?', ['snow ❄️', 'sand 🏖️', 'a sun ☀️']],
  ['The kid has a red kite.', 'What does the kid have?', ['a kite 🪁', 'a ball ⚽', 'a book 📖']],
  ['Ten hens sat in a pen.', 'How many hens?', ['10', '2', '5']],
  ['The duck can swim in the pond.', 'Where does the duck swim?', ['in the pond', 'in the sky', 'in the bed']],
  ['I have a pet cat. Her name is Dot.', 'What is the cat\'s name?', ['Dot', 'Max', 'Sam']],
  ['The ball is under the bed.', 'Where is the ball?', ['under the bed', 'on the tree', 'in the sun']],
  ['I brush my teeth at night.', 'What do I brush?', ['my teeth 🦷', 'the dog 🐶', 'my shoe 👟']],
  ['The big bear ate a fish.', 'What did the bear eat?', ['a fish 🐟', 'a cake 🍰', 'a hat 🎩']],
  ['The ant is on a leaf.', 'Where is the ant?', ['on a leaf 🍃', 'in a cup 🥤', 'on a bus 🚌']],
  ['The owl can see at night.', 'When can the owl see?', ['at night 🌙', 'at lunch 🥪', 'in the bath 🛁']],
  ['A bee is on the pink flower.', 'What color is the flower?', ['pink 🩷', 'blue 🔵', 'black ⚫']],
  ['The boy and the girl ride a bike.', 'What do they ride?', ['a bike 🚲', 'a boat ⛵', 'a truck 🚚']],
  ['My mother has a red mug.', 'What does Mother have?', ['a mug ☕', 'a key 🔑', 'a coin 🪙']],
  ['The wolf ran up the hill.', 'Who ran up the hill?', ['the wolf 🐺', 'the fox 🦊', 'the crab 🦀']],
  ['Dad put the key in the box.', 'Where is the key?', ['in the box 📦', 'under the bed 🛏️', 'on the boat ⛵']],
  ['The puppy likes to chew a bone.', 'What does the puppy chew?', ['a bone 🦴', 'a coin 🪙', 'a vase 🏺']],
  ['The tiger is huge and orange.', 'What color is the tiger?', ['orange 🟠', 'green 🟢', 'purple 🟣']],
  ['A crab went under a rock.', 'Where did the crab go?', ['under a rock', 'over a tree', 'up a hill']],
  ['My brother and sister went to the park.', 'Where did they go?', ['the park 🌳', 'the shop 🏪', 'the ship 🚢']],
  ['The truck is big, but the bike is small.', 'What is small?', ['the bike 🚲', 'the truck 🚚', 'the ship 🚢']],
  ['The nurse helps sick kids.', 'Who helps sick kids?', ['the nurse 🧑‍⚕️', 'the king 🤴', 'the wolf 🐺']],
  ['The king has a gold coin.', 'What does the king have?', ['a coin 🪙', 'a mask 🎭', 'a pie 🥧']],
  ['The fish swims by the ship.', 'What swims by the ship?', ['the fish 🐟', 'the fly 🪰', 'the owl 🦉']],
  ['I smell a hot apple pie.', 'What do I smell?', ['a pie 🥧', 'a sock 🧦', 'a drum 🥁']],
  ['Stop at the red light. Go at the green light.', 'When do we go?', ['at the green light 🟢', 'at the red light 🔴', 'at night 🌙']],
  ['The alligator has a long tail and sharp teeth.', 'Who has sharp teeth?', ['the alligator 🐊', 'the bee 🐝', 'the yo-yo 🪀']],
  ['Do not touch the stove. It is hot!', 'Why not touch the stove?', ['it is hot 🔥', 'it is cold 🧊', 'it is wet 💦']],
  ['The baby can crawl, but she can not walk yet.', 'What can the baby do?', ['crawl 👶', 'run 🏃', 'ride a bike 🚲']],
  ['It is rude to take a toy from a friend.', 'What is rude?', ['taking a toy from a friend', 'sharing a toy', 'saying thank you']],
  ['I write my name with a blue pen.', 'What color is the pen?', ['blue 🔵', 'pink 🩷', 'brown 🟤']],
  ['The boat has a big anchor.', 'What does the boat have?', ['an anchor ⚓', 'a wing 🪽', 'a vase 🏺']],
  ['A bird can fly, but a fish can not.', 'Who can fly?', ['a bird 🐦', 'a fish 🐟', 'a crab 🦀']],
  ['Hang your coat by the door.', 'Where do you hang your coat?', ['by the door 🚪', 'in the tub 🛁', 'on the truck 🚚']],
  ['The orange is in the yellow bowl.', 'What is in the bowl?', ['an orange 🍊', 'a key 🔑', 'a brick 🧱']],
  ['Father made a pie for all of us.', 'Who made the pie?', ['Father', 'the king', 'the nurse']],
  ['The man and the woman like to read.', 'What do they like to do?', ['read 📖', 'swim 🏊', 'cook 🍳']],
  ['The yo-yo goes up and down.', 'How does the yo-yo go?', ['up and down', 'over and under', 'in and out']],
  ['The little brown mouse ran away from the cat.', 'Who ran away?', ['the mouse 🐭', 'the cat 🐱', 'the dog 🐶']],
  ['We went to the farm and saw a goat, a pig and a hen.', 'Which animal did we NOT see?', ['a tiger 🐯', 'a goat 🐐', 'a pig 🐷']],
  ['Tom was sad because it rained, but then he saw a rainbow.', 'What made Tom happy?', ['a rainbow 🌈', 'the rain 🌧️', 'his shoe 👟']],
];
// level by length: 1 = up to 5 words, 2 = up to 8 words, 3 = longer / two sentences
const sentLevel = (s) => { const n = s.split(' ').length; return n <= 5 ? 1 : n <= 8 && !/[.!?] [A-Z]/.test(s) ? 2 : 3; };

function genSentence(level) {
  const pool = SENTENCES.filter((x) => sentLevel(x[0]) <= level);
  const exact = pool.filter((x) => sentLevel(x[0]) === level);
  const [s, q, opts] = pick(exact.length && Math.random() < 0.7 ? exact : pool);
  const words = s.split(' ').map((w, i) => `<span class="sw" data-i="${i}">${w}</span>`).join(' ');
  return {
    key: `sent-${s}`,
    text: q,
    say: '',  // she reads the sentence herself
    readQ: q,
    main: `<div class="sentence">${words}</div><div class="question-line">${q}</div>`,
    options: shuffle(opts).map((o) => ({ v: o, html: o })),
    answer: opts[0],
    optClass: 'opt-text',
    hint: { html: '<div class="hint-note">👂 Listen and follow along</div>', say: s, karaoke: true },
  };
}

/* ---------------- SYLLABLES ---------------- */
const SYL = [
  ['cat', 'cat', '🐱'], ['sun', 'sun', '☀️'], ['dog', 'dog', '🐶'], ['fish', 'fish', '🐟'], ['book', 'book', '📖'],
  ['tree', 'tree', '🌳'], ['apple', 'ap-ple', '🍎'], ['tiger', 'ti-ger', '🐯'], ['rabbit', 'rab-bit', '🐰'],
  ['monkey', 'mon-key', '🐵'], ['pizza', 'piz-za', '🍕'], ['pencil', 'pen-cil', '✏️'], ['rocket', 'rock-et', '🚀'],
  ['cookie', 'cook-ie', '🍪'], ['carrot', 'car-rot', '🥕'], ['flower', 'flow-er', '🌸'], ['turtle', 'tur-tle', '🐢'],
  ['banana', 'ba-na-na', '🍌'], ['butterfly', 'but-ter-fly', '🦋'], ['elephant', 'el-e-phant', '🐘'],
  ['dinosaur', 'di-no-saur', '🦕'], ['umbrella', 'um-brel-la', '☂️'], ['computer', 'com-pu-ter', '💻'],
  ['tomato', 'to-ma-to', '🍅'], ['ladybug', 'la-dy-bug', '🐞'], ['kangaroo', 'kan-ga-roo', '🦘'],
  ['octopus', 'oc-to-pus', '🐙'], ['strawberry', 'straw-ber-ry', '🍓'], ['watermelon', 'wa-ter-mel-on', '🍉'],
  ['caterpillar', 'cat-er-pil-lar', '🐛'], ['alligator', 'al-li-ga-tor', '🐊'], ['helicopter', 'hel-i-cop-ter', '🚁'],
  ['avocado', 'av-o-ca-do', '🥑'], ['television', 'tel-e-vi-sion', '📺'],
];

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
const THINGS = [['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🍓', 'strawberries'], ['🎈', 'balloons'], ['🐟', 'fish'], ['🧁', 'cupcakes'], ['🐥', 'chicks']];
const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Ben'];

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
const WP_ITEMS = [
  ['🍎', 'apples', 'food'], ['🍪', 'cookies', 'food'], ['🍓', 'strawberries', 'food'], ['🧁', 'cupcakes', 'food'],
  ['🎈', 'balloons', 'fly'], ['🐦', 'birds', 'fly'], ['🦋', 'butterflies', 'fly'],
  ['🖍️', 'crayons', 'toy'], ['🚗', 'toy cars', 'toy'], ['🐚', 'shells', 'toy'], ['⭐', 'stickers', 'toy'],
];
const WP = {
  add: [
    (n, a, b, t) => [`${n} has`, a, `${t}.`, `${n} gets`, b, 'more.', 'How many now?'],
    (n, a, b, t) => ['There are', a, `${t} in a box.`, 'You put in', b, 'more.', 'How many are in the box?'],
    (n, a, b, t) => [`${n} found`, a, `${t}.`, `Then ${n} found`, b, 'more.', 'How many in all?'],
  ],
  sub: {
    food: [(n, a, b, t) => [`${n} has`, a, `${t}.`, `${n} eats`, `${b}.`, 'How many are left?']],
    fly: [(n, a, b, t) => ['There are', a, `${t}.`, b, 'fly away.', 'How many are left?']],
    toy: [(n, a, b, t) => [`${n} has`, a, `${t}.`, `${n} gives`, b, 'to a friend.', 'How many are left?']],
  },
};

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
// 1 more/fewer with pictures · 2 numbers to 10 · 3 to 20 · 4 two-digit · 5 sums and differences
const SIGN_OPTS = [{ v: '>', html: '&gt;<small>greater</small>' }, { v: '<', html: '&lt;<small>less</small>' }, { v: '=', html: '=<small>equal</small>' }];
const signOf = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
const gator = { html: '<div class="hint-pic sm">🐊</div><div class="hint-note">The alligator mouth opens to the bigger number!<br>7 &gt; 3 &nbsp; · &nbsp; 3 &lt; 7</div>', say: 'The alligator mouth opens to the bigger number!' };

function genCompare(level) {
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
const SHAPES2 = {
  circle: { sides: 0, real: '🍪', level: 1, tip: 'It is round like a cookie.' },
  square: { sides: 4, real: '🧇', level: 1, tip: 'It has 4 sides that are all the same.' },
  triangle: { sides: 3, real: '🍕', level: 1, tip: 'It has 3 sides, like a pizza slice.' },
  rectangle: { sides: 4, real: '🚪', level: 1, tip: 'It has 4 sides, 2 long and 2 short, like a door.' },
  oval: { sides: 0, real: '🥚', level: 1, tip: 'It is shaped like an egg.' },
  star: { sides: 10, real: '⭐', level: 1, tip: 'It twinkles in the sky.' },
  heart: { sides: 0, real: '💖', level: 1, tip: 'It means love.' },
  diamond: { sides: 4, real: '🪁', level: 2, tip: 'It looks like a kite.' },
  pentagon: { sides: 5, real: '🏠', level: 2, tip: 'It has 5 sides, like a house.' },
  hexagon: { sides: 6, real: '🐝', level: 2, tip: 'It has 6 sides, like a beehive cell.' },
  octagon: { sides: 8, real: '🛑', level: 3, tip: 'It has 8 sides, like a stop sign.' },
};

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

const SHAPES3 = {
  cube: { real: ['🎲', '🧊'], level: 1, tip: 'It is like a dice. All its faces are squares.' },
  sphere: { real: ['⚽', '🏀', '🌍'], level: 1, tip: 'It is round like a ball.' },
  cylinder: { real: ['🥫', '🔋'], level: 1, tip: 'It is like a can of soup.' },
  cone: { real: ['🍦'], level: 1, tip: 'It is like an ice cream cone.' },
  pyramid: { real: ['🔺'], level: 2, tip: 'It has a pointy top and triangle sides.' },
  'rectangular prism': { real: ['📦', '🧱'], level: 2, tip: 'It is like a box or a brick.' },
};

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
const JOBS = [
  ['firefighter', '🧑‍🚒', 'puts out fires', '🔥🚒'],
  ['doctor', '🧑‍⚕️', 'helps sick people get better', '🩺💊'],
  ['teacher', '🧑‍🏫', 'teaches children at school', '📚✏️'],
  ['chef', '🧑‍🍳', 'cooks yummy food', '🍲🥘'],
  ['farmer', '🧑‍🌾', 'grows food and feeds animals', '🌽🐄'],
  ['police officer', '👮', 'keeps people safe', '🚓🚨'],
  ['pilot', '🧑‍✈️', 'flies airplanes', '✈️☁️'],
  ['astronaut', '🧑‍🚀', 'goes into space', '🚀🌙'],
  ['mechanic', '🧑‍🔧', 'fixes cars', '🚗🔧'],
  ['artist', '🧑‍🎨', 'paints pictures', '🎨🖌️'],
  ['scientist', '🧑‍🔬', 'does experiments', '🧪🔬'],
  ['builder', '👷', 'builds houses', '🏗️🧱'],
  ['singer', '🧑‍🎤', 'sings songs', '🎤🎵'],
  ['judge', '🧑‍⚖️', 'decides what is fair in court', '⚖️🏛️'],
  ['coder', '🧑‍💻', 'writes programs for computers', '💻⌨️'],
  ['dentist', '🦷', 'takes care of our teeth', '🪥😁'],
  ['mail carrier', '📬', 'brings letters to our homes', '✉️📦'],
  ['baker', '🧁', 'bakes bread and cakes', '🍞🎂'],
  ['vet', '🐾', 'takes care of sick animals', '🐶🐱'],
  ['bus driver', '🚌', 'drives kids to school', '🚏🧒'],
];

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
const FLAGS = [
  ['United States', '🇺🇸', '🗽', 'the Statue of Liberty', 1],
  ['India', '🇮🇳', '🐅', 'tigers and the Taj Mahal', 1],
  ['Canada', '🇨🇦', '🍁', 'maple leaves', 1],
  ['Mexico', '🇲🇽', '🌮', 'tacos', 1],
  ['Japan', '🇯🇵', '🗻', 'Mount Fuji', 1],
  ['United Kingdom', '🇬🇧', '💂', 'Big Ben and red buses', 1],
  ['China', '🇨🇳', '🐼', 'pandas and the Great Wall', 2],
  ['France', '🇫🇷', '🥐', 'the Eiffel Tower and croissants', 2],
  ['Brazil', '🇧🇷', '🦜', 'parrots and the Amazon', 2],
  ['Italy', '🇮🇹', '🍕', 'pizza', 2],
  ['Germany', '🇩🇪', '🥨', 'pretzels and castles', 2],
  ['Turkey', '🇹🇷', '🕌', 'Istanbul and big mosques', 2],
  ['Australia', '🇦🇺', '🦘', 'kangaroos', 2],
  ['Egypt', '🇪🇬', '🐫', 'pyramids and camels', 3],
  ['Kenya', '🇰🇪', '🦒', 'giraffes and safaris', 3],
  ['Spain', '🇪🇸', '💃', 'flamenco dancing', 3],
  ['Greece', '🇬🇷', '🏛️', 'old temples', 3],
  ['Nepal', '🇳🇵', '🏔️', 'Mount Everest', 3],
  ['Switzerland', '🇨🇭', '🧀', 'cheese and mountains', 3],
  ['Netherlands', '🇳🇱', '🌷', 'tulips and windmills', 3],
  ['Russia', '🇷🇺', '🪆', 'nesting dolls', 3],
  ['New Zealand', '🇳🇿', '🥝', 'kiwi birds', 3],
  ['Bangladesh', '🇧🇩', '🛶', 'lots of rivers and boats', 3],
  ['South Korea', '🇰🇷', '🥟', 'dumplings and K-pop', 3],
];

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

/* ---------------- WORLD MAP ---------------- */
// very simplified continents, [lon, lat] points (kid-friendly, not to scale)
const LAND = {
  'North America': [
    [[-168, 66], [-156, 71], [-130, 70], [-110, 73], [-90, 72], [-78, 70], [-64, 60], [-56, 52], [-66, 44], [-70, 41], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 26], [-97, 21], [-90, 21], [-87, 16], [-83, 10], [-78, 8], [-80, 7], [-86, 11], [-92, 15], [-105, 20], [-110, 24], [-117, 32], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-158, 57], [-165, 60]],
    [[-55, 60], [-42, 60], [-20, 70], [-20, 80], [-40, 83], [-65, 80], [-70, 77], [-55, 70]],
  ],
  'South America': [[[-78, 8], [-72, 12], [-62, 11], [-50, 2], [-35, -5], [-39, -15], [-48, -25], [-58, -35], [-65, -42], [-68, -52], [-72, -54], [-74, -45], [-72, -30], [-71, -18], [-80, -5], [-80, 1]]],
  Europe: [
    [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [0, 50], [5, 53], [8, 57], [5, 62], [15, 69], [25, 71], [40, 68], [45, 66], [60, 68], [60, 55], [50, 47], [40, 45], [30, 45], [28, 41], [22, 38], [18, 40], [12, 44], [15, 40], [10, 38], [3, 42], [-2, 37]],
    [[-6, 50], [1, 51], [2, 53], [-2, 57], [-5, 58], [-6, 55], [-3, 54], [-5, 52]],
  ],
  Africa: [
    [[-17, 15], [-17, 21], [-13, 28], [-6, 36], [10, 37], [20, 32], [32, 31], [34, 28], [43, 12], [51, 12], [48, 4], [40, -5], [40, -15], [35, -25], [32, -29], [20, -35], [17, -29], [12, -17], [13, -5], [9, 4], [-5, 5], [-13, 8]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  ],
  Asia: [
    [[27, 41], [40, 45], [50, 47], [60, 55], [60, 68], [70, 73], [100, 77], [130, 72], [160, 70], [180, 66], [180, 62], [163, 58], [155, 51], [142, 52], [140, 45], [130, 42], [127, 35], [122, 30], [120, 24], [110, 20], [108, 12], [104, 10], [100, 13], [98, 8], [103, 2], [100, 7], [98, 16], [94, 17], [90, 22], [87, 21], [80, 15], [78, 8], [73, 18], [70, 22], [62, 25], [57, 25], [59, 22], [52, 16], [43, 12], [39, 20], [35, 28], [35, 33], [36, 36], [27, 37]],
    [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [144, 44], [140, 41], [136, 37], [131, 34]],
    [[95, 5], [105, -6], [115, -8], [125, -8], [120, -2], [118, 5], [110, 2], [104, 1]],
  ],
  Australia: [
    [[114, -22], [122, -18], [130, -12], [137, -12], [136, -16], [142, -11], [146, -19], [153, -25], [150, -37], [141, -38], [135, -35], [129, -32], [116, -35], [114, -28]],
    [[131, -1], [141, -3], [150, -10], [141, -9], [135, -4]],
    [[172, -35], [178, -38], [174, -41], [167, -46], [171, -44]],
  ],
  Antarctica: [[[-180, -72], [-120, -74], [-60, -64], [-30, -77], [0, -70], [60, -67], [120, -66], [180, -70], [180, -88], [-180, -88]]],
};
const CONT = {
  'North America': { e: '🦅🦬', clue: 'bald eagles and bison live here. We live here too!', animal: ['bald eagles', '🦅'], level: 1 },
  'South America': { e: '🦜🦙', clue: 'the Amazon rainforest, parrots and llamas are here.', animal: ['llamas', '🦙'], level: 1 },
  Europe: { e: '🏰🥐', clue: 'it has old castles and the Eiffel Tower.', animal: ['hedgehogs', '🦔'], level: 2 },
  Africa: { e: '🦁🦒', clue: 'lions, giraffes and zebras live here.', animal: ['giraffes', '🦒'], level: 1 },
  Asia: { e: '🐼🐘', clue: 'pandas and elephants live here. It is the biggest!', animal: ['pandas', '🐼'], level: 1 },
  Australia: { e: '🦘🐨', clue: 'kangaroos and koalas live here.', animal: ['kangaroos', '🦘'], level: 1 },
  Antarctica: { e: '🐧❄️', clue: 'it is covered in ice. Penguins live here. Brrr!', animal: ['penguins', '🐧'], level: 1 },
};
const LAND_COLORS = { 'North America': '#69db7c', 'South America': '#ffd43b', Europe: '#da77f2', Africa: '#ffa94d', Asia: '#ff8787', Australia: '#4dabf7', Antarctica: '#e9ecef' };

function mapSVG(highlight, tapMode) {
  const path = (poly) => 'M' + poly.map(([lo, la]) => `${(lo + 180).toFixed(1)},${(90 - la).toFixed(1)}`).join('L') + 'Z';
  let g = '';
  for (const [name, polys] of Object.entries(LAND)) {
    const fill = tapMode ? LAND_COLORS[name] : name === highlight ? '#ff6b00' : '#cfe3b4';
    const extra = !tapMode && name === highlight ? ' class="hl"' : '';
    g += `<g data-val="${tapMode ? name : ''}" fill="${fill}" stroke="#fff" stroke-width="1"${extra}>${polys.map((p) => `<path d="${path(p)}"/>`).join('')}</g>`;
  }
  return `<svg viewBox="0 8 360 164" class="map${tapMode ? ' tappable' : ''}"><rect x="0" y="8" width="360" height="164" rx="10" fill="#a5d8ff"/>${g}</svg>`;
}

function genMaps(level) {
  const names = Object.keys(CONT).filter((n) => CONT[n].level <= level);
  const c = pick(names);
  const others = sample(names, numOpts(level) - 1, [c]);
  const type = pick(['name', 'name', 'tap', 'animal']);
  if (type === 'tap') {
    return {
      key: `map-tap-${c}`, text: `Tap on ${c}!`, say: `Can you tap on ${c}?`,
      main: mapSVG(null, true), tap: true, options: [], answer: c, optClass: '',
      hint: { html: `<div class="hint-pic">${CONT[c].e}</div>`, say: `Hint: ${CONT[c].clue}` },
    };
  }
  if (type === 'animal') {
    const [an, ae] = CONT[c].animal;
    return {
      key: `map-ani-${c}`, text: `Where do ${an} live? ${ae}`, say: `Where do ${an} live?`,
      main: `<div class="big-emoji">${ae}</div>`,
      options: shuffle([c, ...others]).map((x) => ({ v: x, html: x })),
      answer: c, optClass: 'opt-text',
      hint: { html: mapSVG(c, false), say: 'Look at the orange place on the map!' },
    };
  }
  return {
    key: `map-name-${c}`, text: 'Which continent is orange?', say: 'Which continent is orange?',
    main: mapSVG(c, false),
    options: shuffle([c, ...others]).map((x) => ({ v: x, html: x })),
    answer: c, optClass: 'opt-text',
    hint: { html: `<div class="hint-pic">${CONT[c].e}</div>`, say: `Hint: ${CONT[c].clue}` },
  };
}

/* ---------------- VOCABULARY (Word Wonders) ---------------- */
// [word, picture, meaning (finishes "X means ..."), example sentence, talk-together question, group]
// Words in the same group are never offered as choices together.
const VOCAB = [
  ['enormous', '🐘', 'very, very big', 'An elephant is enormous.', 'What else is enormous?', 'big'],
  ['tiny', '🐜', 'very, very small', 'An ant is tiny.', 'Can you find something tiny?', 'small'],
  ['brave', '🦸', 'not giving up, even when you feel scared', 'The firefighter was brave.', 'When were you brave?'],
  ['curious', '🧐', 'wanting to know more', 'The curious cat peeked into the box.', 'What are you curious about?'],
  ['gentle', '🐣', 'soft and careful', 'Be gentle with the baby chick.', 'How do you pet a puppy gently?'],
  ['delicious', '😋', 'it tastes really yummy', 'This pizza is delicious!', 'What food is delicious to you?'],
  ['exhausted', '😴', 'very, very tired', 'After the long walk, I was exhausted.', 'What makes you exhausted?', 'tired'],
  ['giggle', '🤭', 'a small, silly laugh', 'The baby began to giggle.', 'What makes you giggle?'],
  ['whisper', '🤫', 'talking very quietly', 'We whisper in the library.', 'Can you whisper your name?', 'quiet'],
  ['shiver', '🥶', 'shaking because you are cold', 'I shiver in the snow.', 'When do you shiver?', 'cold'],
  ['sparkle', '✨', 'to shine with tiny bits of light', 'The stars sparkle at night.', 'What things sparkle?'],
  ['fragile', '🥚', 'easy to break', 'Eggs are fragile, so hold them carefully.', 'What else is fragile?'],
  ['cozy', '🛌', 'warm, soft and comfy', 'My bed is so cozy.', 'What is cozy in our house?'],
  ['grumpy', '😠', 'in a bad mood', 'The grumpy bear did not want to play.', 'What makes you grumpy?', 'mad'],
  ['nibble', '🐰', 'to take tiny bites', 'The bunny likes to nibble carrots.', 'Can you nibble like a bunny?', 'eat'],
  ['cheerful', '😊', 'happy and bright', 'Grandma is always cheerful.', 'What makes you cheerful?', 'happy'],
  ['swift', '🐆', 'very fast', 'The cheetah is swift.', 'What other animal is swift?', 'fast'],
  ['sticky', '🍯', 'things stay stuck to it', 'Honey is sticky.', 'What else is sticky?'],
  ['noisy', '📢', 'very loud', 'The drums are noisy.', 'What is noisy?', 'loud'],
  ['tidy', '🧹', 'neat and clean', 'Please keep your room tidy.', 'How can we make your room tidy?', 'neat'],
  ['timid', '🐭', 'shy and a little scared', 'The timid mouse hid in its hole.', 'Do you ever feel timid?', 'scared'],
  ['furious', '😡', 'very, very angry', 'The dragon was furious.', 'What can you do when you feel furious?', 'mad'],
  ['soar', '🦅', 'to fly high in the sky', 'The eagle can soar over the mountains.', 'What else can soar?'],
  ['drowsy', '🥱', 'sleepy', 'I feel drowsy at bedtime.', 'When do you feel drowsy?', 'tired'],
  ['gobble', '🦃', 'to eat very fast', 'The hungry dog gobbled his food.', 'Should we gobble our food?', 'eat'],
  ['scurry', '🐁', 'to run with quick, tiny steps', 'The mouse scurried under the bed.', 'Can you scurry across the room?', 'fast'],
  ['gloomy', '🌧️', 'dark and sad looking', 'It is a gloomy, rainy day.', 'What do you like to do on a gloomy day?'],
  ['ancient', '🏛️', 'very, very old', 'The dinosaurs lived in ancient times.', 'What is something ancient?'],
  ['fierce', '🦁', 'strong and scary', 'The lion has a fierce roar.', 'What animal is fierce?'],
  ['hollow', '🪵', 'empty inside', 'The owl lives in a hollow tree.', 'What else is hollow?'],
  ['delighted', '🥰', 'very, very happy', 'I was delighted with my present.', 'When were you delighted?', 'happy'],
  ['pounce', '🐈', 'to jump on something quickly', 'The cat will pounce on the toy.', 'Can you pounce like a cat?'],
  ['feast', '🍽️', 'a big, special meal', 'We had a feast on my birthday.', 'What would you eat at a feast?', 'eat'],
  ['vanish', '🪄', 'to disappear so you cannot see it', 'The magician made the coin vanish.', 'What would you make vanish?'],
  ['chilly', '🌬️', 'a little bit cold', 'It is chilly outside, so wear a jacket.', 'What do we wear when it is chilly?', 'cold'],
  ['scorching', '🔥', 'very, very hot', 'The sand is scorching in summer.', 'What is scorching?'],
  ['soggy', '🥣', 'wet and mushy', 'My cereal got soggy.', 'What gets soggy?'],
  ['sturdy', '🧱', 'strong and hard to break', 'The brick house is sturdy.', 'What is sturdy?'],
  ['explore', '🧭', 'to look around a new place', 'Let us explore the forest!', 'Where would you like to explore?'],
  ['imagine', '💭', 'to make a picture in your mind', 'Imagine that you can fly!', 'What do you like to imagine?'],
  ['silent', '🤐', 'no sound at all', 'The room was silent.', 'Can you be silent for five seconds?', 'quiet'],
  ['generous', '🎁', 'happy to share and give', 'Mia was generous and shared her snack.', 'How can you be generous?'],
  ['polite', '🙏', 'using kind words like please and thank you', 'It is polite to say thank you.', 'What polite words do you know?'],
  ['patient', '⏳', 'able to wait calmly', 'Be patient, the cookies are baking.', 'When do you need to be patient?'],
  ['marvelous', '🌈', 'wonderful and amazing', 'What a marvelous rainbow!', 'What is marvelous to you?'],
  ['puzzled', '🤔', 'not sure, a little mixed up', 'I was puzzled by the riddle.', 'What makes you puzzled?'],
  ['frightened', '😱', 'very scared', 'The kitten was frightened of the thunder.', 'What helps when you feel frightened?', 'scared'],
  ['proud', '🏅', 'happy about something you did well', 'I am proud of my drawing.', 'What are you proud of?', 'happy'],
  ['dangerous', '⚠️', 'something that could hurt you', 'Fire is dangerous.', 'What is dangerous?'],
  ['blossom', '🌸', 'a flower on a tree or plant', 'The tree is full of pink blossoms.', 'Where do you see blossoms?'],
  ['harvest', '🌽', 'to pick food when it is ready', 'Farmers harvest corn in the fall.', 'What would you like to harvest?'],
  ['hibernate', '🐻', 'to sleep all winter long', 'Bears hibernate in winter.', 'Would you like to hibernate?'],
  ['nocturnal', '🦉', 'awake at night and asleep in the day', 'Owls are nocturnal.', 'What other animals are nocturnal?'],
  ['predator', '🦈', 'an animal that hunts other animals', 'A shark is a predator.', 'What other predators do you know?'],
  ['migrate', '🦆', 'to move far away when the seasons change', 'Some birds migrate south for the winter.', 'Where would you migrate?'],
];
const vocabMeaning = (v) => `${v[0][0].toUpperCase() + v[0].slice(1)} means ${v[2]}.`;
const vocabPool = (level) => VOCAB.slice(0, [20, 40, VOCAB.length][level - 1]);

function vocabDistractors(v, pool, n) {
  return sample(pool.filter((x) => x !== v && (!v[5] || x[5] !== v[5])), n);
}

function genVocab(level) {
  const pool = vocabPool(level);
  const v = pick(pool);
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
  { id: 'cvc', title: 'Little Words', sub: 'cat · ant · bee', icon: '🐱', color: '#ff8787', gen: (l) => genWords(W3, l, 'cvc') },
  { id: 'w4', title: 'Big Words', sub: 'frog · truck · tiger', icon: '🐸', color: '#69db7c', gen: (l) => genWords(bigWordList(l), l, 'w4'), maxLevel: 5 },
  { id: 'sight', title: 'Sight Words', sub: 'he · she · went', icon: '👀', color: '#e64980', gen: genSight, maxLevel: 4 },
  { id: 'spell', title: 'Spell It', sub: 'drag the letters', icon: '🔤', color: '#20c997', gen: genSpell, maxLevel: 5 },
  { id: 'vocab', title: 'Word Wonders', sub: 'learn new words', icon: '🌟', color: '#f59f00', gen: genVocab, learn: true },
  { id: 'sent', title: 'Sentences', sub: 'read & answer', icon: '📖', color: '#74c0fc', gen: genSentence },
  { id: 'syl', title: 'Clap It!', sub: 'syllables', icon: '👏', color: '#ffd43b', gen: genSyllable },
  { id: 'add', title: 'Adding', sub: '2 + 3 · 34 + 5', icon: '➕', color: '#b197fc', gen: genAdd, maxLevel: 5 },
  { id: 'sub', title: 'Take Away', sub: '5 − 2 · 47 − 3', icon: '➖', color: '#f783ac', gen: genSub, maxLevel: 5 },
  { id: 'story', title: 'Word Problems', sub: 'math stories', icon: '📝', color: '#4c6ef5', gen: genWordProblem, maxLevel: 5 },
  { id: 'cmp', title: 'Compare', sub: '7 > 3 · 2 < 9', icon: '🐊', color: '#40c057', gen: genCompare, maxLevel: 5 },
  { id: 'mul', title: 'Multiply', sub: '3 × 4 = ?', icon: '✖️', color: '#fa5252', gen: genMul, maxLevel: 5 },
  { id: 'div', title: 'Divide', sub: 'share equally', icon: '➗', color: '#15aabf', gen: genDiv, maxLevel: 5 },
  { id: 'clock', title: 'Clock', sub: 'tell the time', icon: '🕐', color: '#7950f2', gen: genClock, maxLevel: 4 },
  { id: 'shape2', title: 'Shapes', sub: 'flat shapes', icon: '🔺', color: '#ffa94d', gen: genShape2 },
  { id: 'shape3', title: '3D Shapes', sub: 'cube · cone', icon: '🧊', color: '#3bc9db', gen: genShape3 },
  { id: 'jobs', title: 'Jobs', sub: 'who helps us?', icon: '🧑‍🚒', color: '#ff922b', gen: genJobs },
  { id: 'flags', title: 'Flags', sub: 'countries', icon: '🚩', color: '#ff6b6b', gen: genFlags },
  { id: 'maps', title: 'World Map', sub: 'continents', icon: '🗺️', color: '#38d9a9', gen: genMaps },
  { id: 'mix', title: 'Mix It Up!', sub: 'a bit of all', icon: '🎲', color: '#845ef7', gen: null },
];

// Which games each grade sees, and the level range inside that grade ("start-max").
// Games not listed are hidden for that grade (unless "Show all games" is on).
// Roughly follows Common Core: time to the hour/half hour in 1st, 5 minutes in 2nd;
// multiplication/division start as equal groups and sharing in 2nd.
const GRADES = {
  prek: { label: 'Pre-K', g: { cvc: '1-1', sight: '1-1', spell: '1-1', vocab: '1-1', syl: '1-1', add: '1-1', sub: '1-1', cmp: '1-1',
    shape2: '1-1', shape3: '1-1', jobs: '1-1', flags: '1-1', maps: '1-1' } },
  k: { label: 'Kindergarten', g: { cvc: '2-3', w4: '1-2', sight: '1-2', spell: '1-2', vocab: '1-1', sent: '1-1', syl: '1-2', add: '1-2',
    sub: '1-2', story: '1-1', cmp: '1-2', shape2: '1-2', shape3: '1-1', jobs: '1-2', flags: '1-2', maps: '1-2' } },
  g1: { label: '1st Grade', g: { cvc: '3-3', w4: '2-4', sight: '2-3', spell: '3-4', vocab: '1-2', sent: '1-2', syl: '2-3', add: '3-4',
    sub: '3-4', story: '2-3', cmp: '2-4', clock: '1-2', shape2: '2-3', shape3: '1-2', jobs: '2-3', flags: '2-3', maps: '2-3' } },
  g2: { label: '2nd Grade', g: { cvc: '3-3', w4: '4-5', sight: '3-4', spell: '4-5', vocab: '2-3', sent: '2-3', syl: '3-3', add: '4-5',
    sub: '4-5', story: '3-5', cmp: '4-5', mul: '1-3', div: '1-2', clock: '2-4', shape2: '3-3', shape3: '2-2', jobs: '3-3', flags: '3-3', maps: '3-3' } },
};
const gradeRange = (grade, id) => { const r = GRADES[grade] && GRADES[grade].g[id]; return r ? r.split('-').map(Number) : null; };

const STICKERS = ['🦄', '🐶', '🐱', '🐼', '🦊', '🐯', '🐸', '🐵', '🦁', '🐨', '🐰', '🐻', '🐷', '🐮', '🐙', '🦋',
  '🐬', '🦖', '🐳', '🦩', '🦉', '🐢', '🐝', '🐞', '🌈', '🚀', '🍩', '🍓', '🍦', '🎈', '🌻', '🌟',
  '🏆', '👑', '🎠', '🧸', '🪅', '🍉', '🐧', '🦕'];
