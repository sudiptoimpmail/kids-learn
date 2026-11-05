/* Grade 1 reading patterns and required vocabulary.
   Source: user-provided November 4 lists. Intentionally text-first:
   no synthesized audio is requested for words missing natural recordings.
   "mo" is unconfirmed; "shwip" is a pseudoword, not vocabulary.
   "read", "lead", "bow", "wind" and "close" are pronunciation-sensitive;
   they are not used for phoneme-label questions without sentence context. */

const G1_WORDS = Object.freeze(ContentData.get('grade1words','G1_WORDS'));
// Additional vocabulary visibly present in the user's illustrated Grade 1 references.
 // Kept separate from the original 243-token request, so historical audits stay stable.
 // Context-only words are tested for print recognition, not automatically labelled
 // with a vowel sound (e.g. watch, hair, arrow, and proper-name examples).
const G1_WORKBOOK_WORDS = Object.freeze(ContentData.get('grade1words','G1_WORKBOOK_WORDS'));
const G1_EDITORIAL = Object.freeze(ContentData.get('grade1words','G1_EDITORIAL')); // retained for editorial review, not presented as real vocabulary
const G1_ACTIVE_WORDS = Object.freeze(G1_WORDS.filter(w => !G1_EDITORIAL.includes(w)));
const G1_READING_WORDS = Object.freeze([...new Set([...G1_ACTIVE_WORDS, ...G1_WORKBOOK_WORDS])].sort());

// Only use these sound labels where the pronunciation is unambiguous in ordinary US English.
const G1_SHORT_VOWELS = Object.freeze(ContentData.get('grade1words','G1_SHORT_VOWELS'));
const G1_LONG_VOWELS = Object.freeze(ContentData.get('grade1words','G1_LONG_VOWELS'));
// Starts with real digraphs or consonant blends. No nonsense "shwip" in the picture pool.
const G1_START_CLUSTERS = Object.freeze(ContentData.get('grade1words','G1_START_CLUSTERS'));
const G1_BLEND_WORDS = Object.freeze(G1_ACTIVE_WORDS.filter(w => G1_START_CLUSTERS.some(p => w.startsWith(p))));
const G1_SHORT_WORDS = Object.freeze([...new Set(Object.values(G1_SHORT_VOWELS).flat())].filter(w => G1_READING_WORDS.includes(w)));
const G1_LONG_WORDS = Object.freeze([...new Set(Object.values(G1_LONG_VOWELS).flat())].filter(w => G1_READING_WORDS.includes(w)));
const G1_CORE_WORDS = Object.freeze([...new Set([...G1_SHORT_WORDS, ...G1_BLEND_WORDS, ...G1_LONG_WORDS])]);
const G1_OPPOSITES = Object.freeze(ContentData.get('grade1words','G1_OPPOSITES'));

// Unambiguous picture cues for optional grade-one spelling practice; not injected into Pre-K.
const G1_SPELL_PICTURES = Object.freeze(ContentData.get('grade1words','G1_SPELL_PICTURES'));
const G1_PICTURE_WORDS = Object.freeze(Object.keys(G1_SPELL_PICTURES));

// Each prompt is scored from visible print. The shared audio prompts below are already
// human-recorded in audio/clips.json; do not ask the browser to say unrecorded new words.
function genGrade1Vocab() {
  const [a,b] = pick(G1_OPPOSITES);
  const [given,answer] = Math.random() < .5 ? [a,b] : [b,a];
  const wrong = sample([...new Set(G1_OPPOSITES.flat())].filter(w => w !== answer && w !== given), 3);
  return { key:'g1-opp-'+given, text:'Which word means the opposite of <b>'+given+'</b>?',
    say:'Which word fits?', main:'<div class="word sm">'+given+'</div>',
    options:shuffle([answer,...wrong]).map(w=>({v:w,html:w})), answer, optClass:'opt-word',
    hint:{html:'<div class="hint-note">Think of a word with the opposite meaning.</div>',say:'Think about it'} };
}
function genGrade1Read(level, requestedWord) {
  if (!requestedWord && level >= 3 && Math.random() < (level >= 4 ? .2 : .13)) return genGrade1Vocab();
  const focus = level <= 1 ? G1_SHORT_WORDS :
    level === 2 ? G1_BLEND_WORDS : level === 3 ? G1_CORE_WORDS : G1_READING_WORDS;
  const word = requestedWord || pick(focus);
  if (!G1_READING_WORDS.includes(word)) throw Error('Unapproved Grade 1 word: '+word);
  let candidates, textLabel, pattern, mode;
  const short = Object.entries(G1_SHORT_VOWELS).find(([,words])=>words.includes(word));
  const long = Object.entries(G1_LONG_VOWELS).find(([,words])=>words.includes(word));
  const blend = G1_START_CLUSTERS.find(p=>word.startsWith(p));
  if (short && (level <= 1 || (!requestedWord && Math.random() < .4))) {
    pattern=short[0]; mode='short'; textLabel='Which word has the <b>short '+pattern+'</b> sound?';
    candidates=G1_SHORT_WORDS.filter(w=>w!==word && !short[1].includes(w));
  } else if (blend && (level === 2 || (!requestedWord && Math.random() < .5))) {
    pattern=blend; mode='start'; textLabel='Which word begins with <b>'+pattern+'</b>?';
    candidates=G1_READING_WORDS.filter(w=>w!==word && !w.startsWith(pattern));
  } else if (long && (level === 3 || (!requestedWord && Math.random() < .5))) {
    pattern=long[0]; mode='long'; textLabel='Which word has the <b>long '+pattern+'</b> sound?';
    candidates=G1_LONG_WORDS.filter(w=>w!==word && !long[1].includes(w));
  } else {
    // Orthographic identification includes irregular and ambiguous words without
    // making inaccurate claims about how "read", "wind", "lead" or "bow" sound.
    pattern=word.slice(-2); mode='end'; textLabel='Which word ends in <b>'+pattern+'</b>?';
    candidates=G1_READING_WORDS.filter(w=>w!==word && !w.endsWith(pattern));
  }
  const wrong=sample(candidates,3);
  if (wrong.length!==3) throw Error('Insufficient Grade 1 distractors for '+word);
  const opts=shuffle([word,...wrong]);
  return {
    key:'g1-'+mode+'-'+pattern+'-'+word, text:textLabel, say:'Find the word.',
    main:'<div class="word sm">🔤</div>', options:opts.map(w=>({v:w,html:w==='pete'?'Pete':w})),
    answer:word,optClass:'opt-word',
    hint:{html:'<div class="hint-note">Read each choice carefully. Look at its letters and sounds.</div>',
      say:'Sound it out!'}
  };
}
