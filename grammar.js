/* =========================================================
   🕵️ Word Detective (1st–3rd grade): how words work
   Level 1: naming words (nouns) and action words (verbs)
   Level 2: plurals (-s, -es, -ies, mice …) and opposites
   Level 3: past tense (jumped, ran …) and compound words (sun + flower)
   Level 4: contractions (do not → don't) and words that mean the same
   Level 5: prefixes and suffixes (un-, re-, -ful, -less), describing words, sound-alike words
   The voice reads the question; the child reads the words.
   ========================================================= */
const GR_NOUNS = ContentData.get('grammar','GR_NOUNS');
const GR_VERBS = ContentData.get('grammar','GR_VERBS');
const GR_ADJS = ContentData.get('grammar','GR_ADJS');
const GR_PLURAL = ContentData.get('grammar','GR_PLURAL');
const GR_PAST = ContentData.get('grammar','GR_PAST');
const GR_COMPOUND = ContentData.get('grammar','GR_COMPOUND');
const GR_CONTRACT = ContentData.get('grammar','GR_CONTRACT');
const GR_SAME = ContentData.get('grammar','GR_SAME');
const GR_AFFIX = ContentData.get('grammar','GR_AFFIX');
const GR_HOMO = ContentData.get('grammar','GR_HOMO');
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
