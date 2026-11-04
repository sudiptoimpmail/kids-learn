/* Grade 1 reading patterns and required vocabulary.
   Source: user-provided November 4 lists. Intentionally text-first:
   no synthesized audio is requested for words missing natural recordings.
   "mo" is unconfirmed; "shwip" is a pseudoword, not vocabulary.
   "read", "lead", "bow", "wind" and "close" are pronunciation-sensitive;
   they are not used for phoneme-label questions without sentence context. */

const G1_WORDS = Object.freeze([...new Set(`
cat bat fan hat rat bag car ear can jar tap jam man mat van pen oar ram yuck nap fat yam hen bed jet key net ten den leg pet wet dew sea ill eel new red gel pin zip pie bib leap bean fig seat big six tie lead kid oil dip air dig rib win kit mix boy dog jog mop cow fox toy cot log top zoo dot rot bow cop hot box pot mob mo toe sun son run hut cup bug nut jug bus tub rug bud cub gum mud none tug mug hug fun bun cut buy ice egg ant cry owl emu sky ink spy arm two fly
cat hat bat rat pen man can fan dad bag sat peg red jet sit hit pete bug wet gum nut cup block blast clap climb flag float plant plum clock flat block brick brag cry crab frog front grass grab sky small snow spot spin snake small skin spot cart keep spy snake skip smell star tree trip stop slow glad glass sleep sleep step glass tree ant jump bank best fast ink lamp tent fast tent bump best what sleep chin thin thick chop shark wheel thin ship shwip fish lunch hand rock sick sand bench wash class glass camp clock drink dig dog chop tree moth cake lake hay pay rain pail mail brain bay day play lane bee see tree feet shoot moot neat seat hit read bike five sky slide ride hide kite fly dry rose hose cone bone coat goat road close tune dune blue glue flute cute tube cube read sheet blue hike neat catch leaf wind water bird wolf string desk chair sing snake dog short fast slow big small hot cold new old
`.trim().toLowerCase().split(/\s+/))].sort());
const G1_EDITORIAL = Object.freeze(['mo', 'shwip']); // retained for editorial review, not presented as real vocabulary
const G1_ACTIVE_WORDS = Object.freeze(G1_WORDS.filter(w => !G1_EDITORIAL.includes(w)));

// Only use these sound labels where the pronunciation is unambiguous in ordinary US English.
const G1_SHORT_VOWELS = Object.freeze({
  a: 'cat hat bat rat man can fan dad bag sat tap jam mat van nap fat yam ram ant hand sand lamp camp bank catch class glass'.split(' '),
  e: 'pen peg red jet wet bed hen net ten den leg pet web gel best tent step bench desk'.split(' '),
  i: 'sit hit pin zip bib fig big six kid dip dig rib win kit mix ill ink ship fish sick spin skip skin drink string'.split(' '),
  o: 'dog jog mop fox cot log top dot rot cop hot box pot mob rock clock block spot stop chop frog moth'.split(' '),
  u: 'bug gum nut cup sun son run hut jug bus tub rug bud cub mud tug mug hug fun bun cut jump bump plum lunch'.split(' '),
});
const G1_LONG_VOWELS = Object.freeze({
  a: 'cake lake hay pay rain pail mail brain bay day play lane'.split(' '),
  e: 'bee see tree feet keep neat seat leap bean sea eel key leaf sheet sleep'.split(' '),
  i: 'bike five slide ride hide kite hike sky fly cry spy dry pie tie'.split(' '),
  o: 'rose hose cone bone coat goat road toe float snow slow'.split(' '),
  u: 'tune dune blue glue flute cute tube cube new dew shoot moot'.split(' '),
});
// Starts with real digraphs or consonant blends. No nonsense "shwip" in the picture pool.
const G1_START_CLUSTERS = Object.freeze('bl br cl cr fl fr gl gr pl sk sl sm sn sp st tr sh ch th wh sw'.split(' '));
const G1_BLEND_WORDS = Object.freeze(G1_ACTIVE_WORDS.filter(w => G1_START_CLUSTERS.some(p => w.startsWith(p))));
const G1_SHORT_WORDS = Object.freeze([...new Set(Object.values(G1_SHORT_VOWELS).flat())].filter(w => G1_ACTIVE_WORDS.includes(w)));
const G1_LONG_WORDS = Object.freeze([...new Set(Object.values(G1_LONG_VOWELS).flat())].filter(w => G1_ACTIVE_WORDS.includes(w)));
const G1_OPPOSITES = Object.freeze([['hot','cold'],['fast','slow'],['big','small'],['new','old'],['wet','dry']]);

// Unambiguous picture cues for optional grade-one spelling practice; not injected into Pre-K.
const G1_SPELL_PICTURES = Object.freeze({
  fan:'🪭', car:'🚗', jar:'🫙', cow:'🐄', egg:'🥚', ice:'🧊',
  flag:'🚩', clap:'👏', plant:'🪴', rock:'🪨', shark:'🦈',
  wheel:'🛞', lake:'🏞️', flute:'🪈', coat:'🧥', road:'🛣️', brain:'🧠'
});
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
  if (!requestedWord && level >= 4 && Math.random() < .2) return genGrade1Vocab();
  const focus = level <= 1 ? G1_SHORT_WORDS :
    level === 2 ? G1_BLEND_WORDS : level === 3 ? G1_LONG_WORDS : G1_ACTIVE_WORDS;
  const word = requestedWord || pick(focus);
  if (!G1_ACTIVE_WORDS.includes(word)) throw Error('Unapproved Grade 1 word: '+word);
  let candidates, textLabel, pattern, mode;
  const short = Object.entries(G1_SHORT_VOWELS).find(([,words])=>words.includes(word));
  const long = Object.entries(G1_LONG_VOWELS).find(([,words])=>words.includes(word));
  const blend = G1_START_CLUSTERS.find(p=>word.startsWith(p));
  if (short && (level <= 1 || (!requestedWord && Math.random() < .4))) {
    pattern=short[0]; mode='short'; textLabel='Which word has the <b>short '+pattern+'</b> sound?';
    candidates=G1_SHORT_WORDS.filter(w=>w!==word && !short[1].includes(w));
  } else if (blend && (level === 2 || (!requestedWord && Math.random() < .5))) {
    pattern=blend; mode='start'; textLabel='Which word begins with <b>'+pattern+'</b>?';
    candidates=G1_ACTIVE_WORDS.filter(w=>w!==word && !w.startsWith(pattern));
  } else if (long && (level === 3 || (!requestedWord && Math.random() < .5))) {
    pattern=long[0]; mode='long'; textLabel='Which word has the <b>long '+pattern+'</b> sound?';
    candidates=G1_LONG_WORDS.filter(w=>w!==word && !long[1].includes(w));
  } else {
    // Orthographic identification includes irregular and ambiguous words without
    // making inaccurate claims about how "read", "wind", "lead" or "bow" sound.
    pattern=word.slice(-2); mode='end'; textLabel='Which word ends in <b>'+pattern+'</b>?';
    candidates=G1_ACTIVE_WORDS.filter(w=>w!==word && !w.endsWith(pattern));
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
