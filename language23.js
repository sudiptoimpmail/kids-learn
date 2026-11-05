/* =========================================================
   ✏️ Grammar & Punctuation (2nd–3rd grade) and extra Word Study cards
   Level 1 capitals, end marks, apostrophes for owning · 2 commas in lists, collective nouns,
   reflexive pronouns, irregular past tense · 3 adjective or adverb, comparing words,
   subject–verb agreement, joining words, speech marks
   Word Detective (Word Study) gains: multiple-meaning words, root words, prefixes and
   suffixes, ABC order, similes and (3rd grade) idioms.
   Read & Answer gains longer passages: main idea, details, cause and effect, two texts.
   UK children also spot made-up "alien" words, like the Year 1 phonics check.
   ========================================================= */
const L23 = (k) => ContentData.get('language23', k);
const l23Q = (key, text, say, main, answer, wrong, level, optClass = 'opt-text') => {
  const n = level >= 2 ? 3 : 2;
  const opts = shuffle([answer, ...sample([...new Set(wrong)].filter((x) => x && x !== answer), n)]);
  return { key, text, say, main, mainClass: main ? 'ph-main' : 'empty', answer, optClass,
    options: opts.map((o) => ({ v: o, html: o })), hint: { html: '', say: 'Think about it!', remove: true } };
};
const l23Sent = (s) => `<div class="gr-sent">${s.replace('___', '<span class="gr-gap">___</span>')}</div>`;

function genGrammarPunct(level) {
  const t = Math.random();
  if (level === 1) {
    if (t < 0.4) {
      const s = pick(L23('GP_CAPITALS'));
      const words = s.split(' ');
      const lowerFirst = s[0].toLowerCase() + s.slice(1);
      const name = words.slice(1).find((w) => /^[A-Z]/.test(w) && w !== 'I');
      const noName = name ? s.replace(name, name.toLowerCase()) : s.replace(/ I /, ' i ');
      const noMark = s.replace(/[.!?]$/, '');
      return l23Q(`gp-cap-${s}`, 'Which sentence is written correctly?', 'Which sentence is written correctly?', '',
        s, [lowerFirst, noName, noMark].filter((x) => x !== s), 2, 'opt-text gp-long');
    }
    if (t < 0.75) {
      const [s, m] = pick(L23('GP_ENDMARKS'));
      return l23Q(`gp-end-${s}`, 'Which mark ends this sentence?', 'Which mark ends this sentence?', l23Sent(s + ' ___'), m, ['.', '?', '!'], 2, 'opt-num');
    }
    const [phrase, right] = pick(L23('GP_POSSESSIVE'));
    const wrong = [right.replace("'s", 's'), right.replace("'s", "s'"), right.replace("'s", ",s")];
    return l23Q(`gp-pos-${right}`, `Which is the short way to write <b>${phrase}</b>?`, 'Which one is correct?', '', right, wrong, 2);
  }
  if (level === 2) {
    if (t < 0.25) {
      const [right, ...wrong] = pick(L23('GP_LISTS'));
      return l23Q(`gp-list-${right}`, 'Which sentence uses commas correctly?', 'Which one is correct?', '', right, wrong, 2, 'opt-text gp-long');
    }
    if (t < 0.5) { const [s, a, ...w] = pick(L23('GP_COLLECTIVE')); return l23Q(`gp-coll-${s}`, 'Which word fits?', 'Which word fits?', l23Sent(s), a, w, 2); }
    if (t < 0.75) { const [s, a, ...w] = pick(L23('GP_REFLEXIVE')); return l23Q(`gp-refl-${s}`, 'Which word fits?', 'Which word fits?', l23Sent(s), a, w, 2); }
    const [s, a, ...w] = pick(L23('GP_IRREGULAR'));
    return l23Q(`gp-irr-${s}`, 'Which word fits?', 'Which word fits?', l23Sent(s), a, w, 2);
  }
  const kinds = ['adverb', 'compare', 'agree', 'conj', 'quotes'], k = pick(kinds);
  if (k === 'adverb') { const [s, a, w] = pick(L23('GP_ADVERB')); return l23Q(`gp-adv-${s}`, 'Which word fits?', 'Which word fits?', l23Sent(s), a, [w], 3, 'opt-text two'); }
  if (k === 'compare') { const [s, a, ...w] = pick(L23('GP_COMPARE')); return l23Q(`gp-cmp-${s}`, 'Which word fits?', 'Which word fits?', l23Sent(s), a, w, 3); }
  if (k === 'agree') { const [s, a, w] = pick(L23('GP_AGREE')); return l23Q(`gp-agr-${s}`, 'Which word fits?', 'Which word fits?', l23Sent(s), a, [w], 3, 'opt-text two'); }
  if (k === 'conj') { const [s, a, ...w] = pick(L23('GP_CONJ')); return l23Q(`gp-conj-${s}`, 'Which joining word fits?', 'Which word fits?', l23Sent(s), a, w, 3); }
  const [right, ...wrong] = pick(L23('GP_QUOTES'));
  return l23Q(`gp-q-${right}`, 'Which one uses speech marks correctly?', 'Which one is correct?', '', right, wrong, 3, 'opt-text gp-long');
}

/* ---------- extra Word Study cards, mixed into Word Detective ---------- */
function genWordStudy(level) {
  const t = Math.random();
  if (t < 0.22) {
    const row = pick(L23('WS_MEANING')), [w, s, right, wrong] = row;
    return l23Q(`ws-mean-${w}-${right}`, `What does <b>${w}</b> mean in this sentence?`, 'What does this word mean?', `<div class="gr-sent">${s.replace(new RegExp(`\\b${w}\\b`), `<b>${w}</b>`)}</div>`, right, [wrong], level, 'opt-text two');
  }
  if (t < 0.4) {
    const [w, root] = pick(L23('WS_ROOT')), others = L23('WS_ROOT').filter((r) => r[1] !== root).map((r) => r[1]);
    return l23Q(`ws-root-${w}`, `What is the root word of <b>${w}</b>?`, 'What is the root word?', `<div class="gr-word">${w}</div>`, root, [...sample(others, 2), w.slice(0, 3)], level);
  }
  if (t < 0.58) {
    const useP = Math.random() < 0.5, bank = L23(useP ? 'WS_PREFIX' : 'WS_SUFFIX'), [part, meaning, example] = pick(bank);
    return l23Q(`ws-${useP ? 'pre' : 'suf'}-${part}`, `In <b>${example}</b>, what does <b>${useP ? part + '-' : '-' + part}</b> mean?`, 'What does this part mean?',
      `<div class="gr-word">${example}</div>`, meaning, bank.filter((x) => x[0] !== part).map((x) => x[1]), level);
  }
  if (t < 0.76) {
    const words = shuffle(pick(L23('WS_ABC')).slice()), first = [...words].sort()[0];
    return l23Q(`ws-abc-${words.join('')}`, 'Which word comes first in ABC order?', 'Which word comes first in ABC order?', '', first, words.filter((x) => x !== first), level);
  }
  if (level >= 5 && t < 0.88) {
    const [s, right, wrong] = pick(L23('WS_IDIOM'));
    return l23Q(`ws-idiom-${s}`, 'What does it really mean?', 'What does it really mean?', `<div class="gr-sent">“${s}”</div>`, right, [wrong], level, 'opt-text two');
  }
  const [s, a, ...w] = pick(L23('WS_SIMILE'));
  return l23Q(`ws-sim-${s}`, 'Which word finishes the saying?', 'Which word fits?', l23Sent(s), a, w, level);
}
function genWordsPlus(level) {
  return level >= 3 && Math.random() < 0.4 ? genWordStudy(level) : genGrammar(level);
}

/* ---------- longer passages for 2nd–3rd grade ---------- */
function genPassage23(level) {
  const rows = L23('PASSAGES23'), exact = rows.filter((r) => r[3] === level), near = rows.filter((r) => r[3] <= level);
  const [lines, qs, pic] = pick(exact.length && Math.random() < 0.75 ? exact : near.length ? near : rows);
  return {
    key: `sent-p23-${lines[0]}`, text: 'Read the text. Then answer each question!', say: ['Read the story.', 'Then answer each question.'],
    main: `<div class="g1-passage p23"><span class="g1-pic">${pic}</span>${lines.map((l) => `<p>${l.replace(/^(Text [AB]):/, '<b>$1:</b>')}</p>`).join('')}</div>`, mainClass: 'g1-main',
    options: [], answer: 'done', optClass: 'spell-tray', parts: qs.length,
    passageFill: qs.map(([s, ...o]) => ({ s, answer: o[0], options: shuffle(o.slice()) })),
    hint: { html: '', say: 'Look back at the story!' },
  };
}
function genSentencePlus(level) {
  return level >= 4 && Math.random() < 0.4 ? genPassage23(level) : genSentence(level);
}

/* ---------- UK phonics check practice: spot the made-up "alien" word ---------- */
function genPhonicsPlus(level) {
  if (typeof countryCode === 'function' && countryCode() === 'uk' && level >= 3 && Math.random() < 0.18) {
    const alien = pick(L23('ALIEN_WORDS')), real = sample(L23('REAL_WORDS'), 2);
    return l23Q(`ph-alien-${alien}`, 'Which one is an <b>alien word</b> (a made-up word)?', 'Which word is an alien word?', '<div class="ns-big">👽</div>',
      alien, real, 2, 'opt-text');
  }
  return genPhonics(level);
}
