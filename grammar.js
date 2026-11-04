/* =========================================================
   🕵️ Word Detective (1st–3rd grade): how words work
   Level 1: naming words (nouns) and action words (verbs)
   Level 2: plurals (-s, -es, -ies, mice …) and opposites
   Level 3: past tense (jumped, ran …) and compound words (sun + flower)
   Level 4: contractions (do not → don't) and words that mean the same
   Level 5: prefixes and suffixes (un-, re-, -ful, -less), describing words, sound-alike words
   The voice reads the question; the child reads the words.
   ========================================================= */
const GR_NOUNS = ['dog', 'apple', 'school', 'teacher', 'ball', 'tree', 'house', 'girl', 'boy', 'park', 'book', 'car', 'cake', 'river', 'farmer', 'pencil', 'kitten', 'city', 'chair', 'garden'];
const GR_VERBS = ['run', 'jump', 'swim', 'eat', 'sing', 'read', 'write', 'play', 'climb', 'sleep', 'dance', 'throw', 'kick', 'cook', 'laugh', 'draw', 'clap', 'fly', 'dig', 'hop'];
const GR_ADJS = ['happy', 'big', 'tiny', 'red', 'soft', 'loud', 'tall', 'cold', 'shiny', 'funny', 'slow', 'sweet', 'brave', 'fluffy', 'noisy', 'quiet', 'bumpy', 'sleepy'];
const GR_PLURAL = [['cat', 'cats'], ['dog', 'dogs'], ['book', 'books'], ['fox', 'foxes'], ['box', 'boxes'], ['bus', 'buses'], ['dish', 'dishes'], ['brush', 'brushes'],
  ['bench', 'benches'], ['lunch', 'lunches'], ['baby', 'babies'], ['puppy', 'puppies'], ['berry', 'berries'], ['city', 'cities'], ['pony', 'ponies'],
  ['mouse', 'mice'], ['child', 'children'], ['foot', 'feet'], ['tooth', 'teeth'], ['man', 'men'], ['woman', 'women'], ['goose', 'geese'], ['sheep', 'sheep'], ['fish', 'fish'],
  ['leaf', 'leaves'], ['wolf', 'wolves'], ['knife', 'knives']];
const GR_PAST = [['jump', 'jumped'], ['play', 'played'], ['walk', 'walked'], ['help', 'helped'], ['bake', 'baked'], ['smile', 'smiled'], ['hop', 'hopped'], ['clap', 'clapped'],
  ['cry', 'cried'], ['run', 'ran'], ['go', 'went'], ['eat', 'ate'], ['see', 'saw'], ['swim', 'swam'], ['sing', 'sang'], ['write', 'wrote'], ['take', 'took'], ['make', 'made'],
  ['sit', 'sat'], ['drink', 'drank'], ['fly', 'flew'], ['catch', 'caught'], ['buy', 'bought'], ['think', 'thought'], ['come', 'came'], ['give', 'gave'], ['ride', 'rode'], ['sleep', 'slept']];
const GR_COMPOUND = [['sun', 'flower'], ['rain', 'bow'], ['butter', 'fly'], ['foot', 'ball'], ['snow', 'man'], ['cup', 'cake'], ['star', 'fish'], ['bed', 'room'], ['tooth', 'brush'],
  ['pan', 'cake'], ['fire', 'truck'], ['lady', 'bug'], ['pop', 'corn'], ['sand', 'box'], ['air', 'plane'], ['back', 'pack'], ['gold', 'fish'], ['sun', 'shine'], ['rain', 'coat'], ['hand', 'bag']];
const GR_CONTRACT = [['do not', "don't"], ['can not', "can't"], ['will not', "won't"], ['I am', "I'm"], ['it is', "it's"], ['we are', "we're"], ['they are', "they're"],
  ['you are', "you're"], ['she is', "she's"], ['is not', "isn't"], ['are not', "aren't"], ['did not', "didn't"], ['I will', "I'll"], ['we will', "we'll"],
  ['have not', "haven't"], ['was not', "wasn't"], ['let us', "let's"], ['he is', "he's"], ['does not', "doesn't"], ['could not', "couldn't"]];
const GR_SAME = [['big', 'large'], ['happy', 'glad'], ['fast', 'quick'], ['small', 'little'], ['begin', 'start'], ['shout', 'yell'], ['smart', 'clever'], ['scared', 'afraid'],
  ['tired', 'sleepy'], ['angry', 'mad'], ['jump', 'leap'], ['close', 'shut'], ['gift', 'present'], ['end', 'finish'], ['look', 'see'], ['rock', 'stone'], ['sick', 'ill'],
  ['hard', 'difficult'], ['easy', 'simple'], ['under', 'below']];
const GR_AFFIX = [['unhappy', 'not happy'], ['unkind', 'not kind'], ['unlock', 'open the lock'], ['untidy', 'not tidy'], ['redo', 'do again'], ['reread', 'read again'],
  ['rebuild', 'build again'], ['refill', 'fill again'], ['helpful', 'full of help'], ['careful', 'full of care'], ['joyful', 'full of joy'], ['fearless', 'without fear'],
  ['careless', 'without care'], ['homeless', 'without a home'], ['preheat', 'heat before'], ['teacher', 'a person who teaches'], ['singer', 'a person who sings'],
  ['quickly', 'in a quick way'], ['softly', 'in a soft way'], ['dislike', 'not like']];
const GR_HOMO = [['I can ___ the ship.', 'see', 'sea'], ['We swim in the ___.', 'sea', 'see'], ['I have ___ cats.', 'two', 'too'], ['I want to come ___!', 'too', 'two'],
  ['The ___ is shining.', 'sun', 'son'], ['The wind ___ hard.', 'blew', 'blue'], ['The sky is ___.', 'blue', 'blew'], ['I ___ the answer.', 'know', 'no'],
  ['Put it over ___.', 'there', 'their'], ['They lost ___ hats.', 'their', 'there'],
  ['I ate ___ apple.', 'one', 'won'], ['We ___ the game!', 'won', 'one'], ['Can you ___ me?', 'hear', 'here'], ['Come over ___.', 'here', 'hear'],
  ['She has a ___ dress.', 'new', 'knew'], ['I ___ it was you!', 'knew', 'new'], ['The ___ ran in the forest.', 'deer', 'dear'], ['I will ___ a letter.', 'write', 'right']];
const GR_WRONG_PLURAL = (s, p) => [...new Set([s + 's', s + 'es', s.replace(/y$/, 'ys'), s.replace(/f(e)?$/, 'fs'), p.replace(/s$/, ''), s + 'ies'].filter((x) => x !== p && x !== s))];
const GR_WRONG_PAST = (v, p) => [...new Set([v + 'ed', v + 'd', v + 'ing', v.replace(/e$/, '') + 'ed', v + 's', p + 'ed'].filter((x) => x !== p && x !== v))];

function grQ(key, text, main, answer, wrong, sayQ, n) {
  const opts = shuffle([answer, ...sample([...new Set(wrong)].filter((x) => x !== answer), n)]);
  return { key: `gr-${key}`, text, say: sayQ, main, mainClass: main ? 'ph-main' : 'empty', options: opts.map((o) => ({ v: o, html: o })), answer,
    optClass: 'opt-text', hint: { html: '', say: 'Think about it!', remove: true } };
}
// Curated combinations: never randomly generate statements such as
// "The cold book can swim" or "The fluffy river can read".
const GR_SIMPLE_SENTENCES = [
  ['happy', 'dog', 'run'], ['little', 'cat', 'jump'], ['brave', 'girl', 'swim'],
  ['happy', 'boy', 'play'], ['tall', 'teacher', 'read'], ['brave', 'farmer', 'climb'],
  ['tiny', 'kitten', 'sleep'], ['big', 'dog', 'dig'], ['happy', 'girl', 'sing'],
  ['little', 'boy', 'dance'], ['soft', 'kitten', 'hop'], ['funny', 'teacher', 'laugh'],
  ['brave', 'boy', 'swim'], ['happy', 'teacher', 'write'], ['tiny', 'dog', 'run'],
  ['tall', 'girl', 'throw'], ['little', 'boy', 'kick'], ['sleepy', 'kitten', 'sleep'],
  ['happy', 'farmer', 'cook'], ['brave', 'girl', 'climb'], ['funny', 'boy', 'sing'],
  ['tall', 'farmer', 'walk'], ['sleepy', 'cat', 'sleep'], ['happy', 'kid', 'draw'],
  ['funny', 'dog', 'jump'], ['little', 'kid', 'read'], ['tiny', 'kitten', 'play']
].filter(([adj, noun, verb]) => GR_ADJS.includes(adj) && GR_NOUNS.includes(noun) && GR_VERBS.includes(verb));

function genGrammar(level) {
  const n = level >= 2 ? 3 : 2, t = Math.random(), big = (w) => `<div class="gr-word">${w}</div>`;
  if (level >= 5 && t < 0.7) {
    const k = Math.random();
    if (k < 0.4) { const [w, m] = pick(GR_AFFIX); return grQ(`aff-${w}`, `What does <b>${w}</b> mean?`, big(w), m, GR_AFFIX.filter((x) => x[0] !== w).map((x) => x[1]), ['What does this word mean?'], n); }
    if (k < 0.7) { const [s, a, b] = pick(GR_HOMO); return grQ(`homo-${s}`, 'Which word fits?', `<div class="gr-sent">${s.replace('___', '<span class="gr-gap">___</span>')}</div>`, a, [b], ['Which word fits?', 'They sound the same!'], 1); }
    const a = pick(GR_ADJS); return grQ(`adj-${a}`, 'Which word is a <b>describing word</b> (adjective)?', '', a, [...GR_NOUNS, ...GR_VERBS], ['Which word is a describing word?'], n);
  }
  if (level >= 4 && t < 0.75) {
    if (Math.random() < 0.55) { const [full, c] = pick(GR_CONTRACT); const base = c.replace("'", ''); return grQ(`con-${full}`, `What is the short way to write <b>${full}</b>?`, big(full), c, [base, c.replace(/'(.)/, '$1\''), ...GR_CONTRACT.filter((x) => x[1] !== c).map((x) => x[1])].filter((x) => x !== c), ['What is the short way to write this?'], n); }
    const [a, b] = pick(GR_SAME); return grQ(`same-${a}`, `Which word means the same as <b>${a}</b>?`, big(a), b, GR_SAME.filter((x) => x[0] !== a).map((x) => x[1]), ['Which word means the same?'], n);
  }
  if (level >= 3 && t < 0.8) {
    if (Math.random() < 0.55) { const [v, p] = pick(GR_PAST); return grQ(`past-${v}`, `Today I <b>${v}</b>. Yesterday I…`, big(`${v} → ?`), p, GR_WRONG_PAST(v, p), ['Today I', `${v}.`, 'Yesterday I…'], n); }
    const [a, b] = pick(GR_COMPOUND); return grQ(`comp-${a}${b}`, 'Put the two words together!', big(`${a} + ${b}`), a + b, [b + a, a + ' ' + b, ...GR_COMPOUND.filter((x) => x[0] !== a).map((x) => a + x[1])].filter((x) => x !== a + b), ['Put the two words together!'], n);
  }
  if (level >= 2 && t < 0.8) {
    if (Math.random() < 0.65) { const [s, p] = pick(GR_PLURAL); const w = GR_WRONG_PLURAL(s, p); return grQ(`pl-${s}`, `One <b>${s}</b>, two…`, big(`1 ${s} → 2 ?`), p, w.length >= n ? w : [...w, s + 'ss', s + 'z'], ['One', `${s}.`, 'Two…?'], n); }
    const [a, b] = pick(OPPOSITES); return grQ(`opp-${a}`, `What is the opposite of <b>${a}</b>?`, big(a), b, OPPOSITES.filter((x) => x[0] !== a).map((x) => x[1]), ['What is the opposite?'], n);
  }
  // level 1: naming word or action word — all three choices come from one little sentence,
  // so the child decides what each word does (not just which word is in the sentence)
  const [adj, noun, verb] = pick(GR_SIMPLE_SENTENCES);
  const sent = `The ${adj} ${noun} can ${verb}.`;
  const wantNoun = Math.random() < 0.5;
  const q = grQ(`${wantNoun ? 'noun' : 'verb'}-${noun}-${verb}-${adj}`,
    wantNoun ? 'Which word is a <b>naming word</b> (noun)?' : 'Which word is an <b>action word</b> (verb)?',
    `<div class="gr-sent">${sent}</div><small class="ph-tip">${wantNoun ? 'a person, place or thing' : 'something you can do'}</small>`,
    wantNoun ? noun : verb, wantNoun ? [verb, adj] : [noun, adj], [wantNoun ? 'Which word is a naming word?' : 'Which word is an action word?'], 2);
  return q;
}
