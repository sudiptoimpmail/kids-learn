/* Auditable checklist of early-reading words supplied by the parent.
   A word is NOT automatically activated by being on this list: active practice
   requires a correct picture/context, sound pattern and natural voice coverage. */
const EARLY_REQUIRED_WORDS = [...new Set(
  'cat bat fan hat rat bag car ear can jar tap jam man mat van pen oar ram yuck nap fat yam hen bed jet key net ten den leg pet wet dew sea ill eel new red gel pin zip pie bib leap bean fig seat big six tie lead kid oil dip air dig rib win kit mix boy dog jog mop cow fox toy cot log top zoo dot rot bow cop hot box pot mob mo toe sun son run hut cup bug nut jug bus tub rug bud cub gum mud none tug mug hug fun bun cut buy ice egg ant cry owl emu sky ink spy arm two fly'.split(' ')
)];
const EARLY_STANDALONE_LETTERS = ['B', 'P', 'T', 'I', 'X'];
const EARLY_PHRASES = ["I don't"];
// Short-vowel consonant-vowel-consonant sound patterns. This is a phonics
// classification, not a generic rule for every three-letter spelling.
const EARLY_CVC = new Set(
  'cat bat fan hat rat bag pig lip can tap jam man mat van pen ram nap fat yam hen bed jet net ten den leg pet wet red pin bib fig big kid dip dig rib win kit dog jog mop cot log top dot rot cop hot pot mob sun run hut cup bug nut jug bus tub rug bud cub gum mud tug mug hug fun bun cut web cap map pan sad'.split(' ')
);
const EARLY_REVIEW = new Set(['mo', 'lead', 'bow', 'son', 'none']); // unclear token / multiple pronunciations
const EARLY_PATTERN_L2 = new Set('ant egg ill ink six mix fox box yuck'.split(' '));
const earlyWordLevel = (word) => word === 'zip' || EARLY_CVC.has(word) ? 1 : EARLY_PATTERN_L2.has(word) ? 2 : 3;
// Unambiguous picture prompts only. All other terms remain on the audit list,
// not automatically mixed into picture-answer questions (which could teach errors).
const EARLY_PICTURES = Object.freeze({
  fan: '🪭', car: '🚗', ear: '👂', jar: '🫙', yam: '🍠',
  cow: '🐄', egg: '🥚', ice: '🧊', arm: '💪', two: '2️⃣',
  sea: '🌊', air: '💨', sky: '🌤️',
});
// These do not yet have direct natural recorded-word clips in the current
// audio/clips.json. Do not route them to new LISTEN-only question types.
const EARLY_AUDIO_PENDING = new Set(
  'fan ear jar tap jam mat oar yuck nap fat yam den pet dew sea ill eel new gel zip bib leap bean fig seat tie lead dip air dig rib win kit mix jog mop cot top zoo dot rot bow cop mob mo toe son jug rug bud cub gum none tug bun cut ice egg emu sky ink spy arm'.split(' ')
);
// Only these curated additions are eligible for existing picture-based lessons.
// Other requested tokens need audio, sentence context, or an editorial decision.
const EARLY_PICTURE_WORDS = Object.freeze(EARLY_REQUIRED_WORDS
  .filter((w) => !EARLY_REVIEW.has(w) && EARLY_PICTURES[w])
  .map((w) => [w, EARLY_PICTURES[w]]));
