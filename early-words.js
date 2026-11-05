/* Required early-reading vocabulary supplied by the user.
   This is an audited inventory, not a license to put irregular spellings in
   a Pre-K short-vowel lesson.  Words lacking a natural voice clip remain
   tracked for the existing audio production pipeline; no mechanical TTS. */
const EARLY_WORD_INVENTORY = Object.freeze(ContentData.get('early-words','EARLY_WORD_INVENTORY'));
const EARLY_WORD_SPECIALS = Object.freeze(ContentData.get('early-words','EARLY_WORD_SPECIALS'));
// Picturable words with one clear meaning enter the shared reading/spelling question generators.
// Every word on the list now has its own natural recording (audio/clips.json).
const EARLY_READY_PICTURE_WORDS = Object.freeze(ContentData.get('early-words','EARLY_READY_PICTURE_WORDS'));
