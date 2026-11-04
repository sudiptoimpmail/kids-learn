# Grade 1 reading expansion — handoff and verification

**Scope:** Adds the user's November 4 Grade 1 word lists to a dedicated, grade-gated reading activity without changing Pre-K content. This branch is a separate pull request; the reliability changes in PR #2 remain independent.

## Implemented

- **243 distinct requested tokens** retained in `grade1.js` as the auditable list; **241** are active quiz targets. The dictated `mo` requires editorial clarification and `shwip` is a nonword, not taught as normal vocabulary.
- **Short vowels** (117 words in explicitly checked groups), **consonant blends/digraphs** (59 words), **long vowels** (64 words), other spelling patterns and antonyms. Some words occur in several groups.
- **Grade 1 Reading** appears under *Reading & Words* for grade 1 and grade 2, not Pre-K. Default level 3 mixes short vowels, blends and long vowels; level 4–5 also draws from the entire active bank.
- Added **13 Grade 1 reading-comprehension passages**, with questions and unique answer choices, including the contraction “I don't.”
- Added **17 carefully pictured words** as extra Grade 1 spelling prompts at level 4; these do not enter Pre-K spelling. Unrecorded words use visual/picture clues and only existing recorded instruction clips, rather than synthetic narration.
- New JS file is included in the service worker's offline asset list; app cache was bumped to v36.
- New randomized regression checks validate duplicate-free options, one correct answer, word reachability, grade gating, and natural recorded instructions.

## Voice limitations — not silently synthesized

The existing `audio/clips.json` contains no word-level recording for **134** of the 243 requested tokens. Those words are available in *print-based Grade 1 Reading* but **are not claimed to have recorded pronunciation**. The 13 new comprehension passages use a known recorded generic instruction instead of requesting synthetic reading of novel sentences.

Missing word-level recordings (lowercase manifest keys):

```text
air, arm, bank, bay, bean, best, bib, blast, block, bow, brag, bud, bump, bun, camp, cart, chop, class, close, coat, cone, cop, cot, cub, cube, cut, cute, dad, day, den, desk, dew, dig, dip, dot, dune, ear, eel, egg, emu, fan, fat, fig, flag, flat, float, flute, front, gel, glad, glass, glue, grab, gum, hay, hide, hike, hit, hose, ice, ill, ink, jam, jar, jog, jug, keep, kit, lake, lane, lead, leap, mail, mat, mix, mo, mob, moot, mop, moth, nap, neat, new, none, oar, old, pail, pay, peg, pet, pete, plum, read, rib, road, rot, rug, sand, sat, sea, seat, sheet, shoot, short, shwip, sick, skin, skip, sky, slide, small, son, spin, spot, spy, step, string, tap, thick, thin, tie, toe, top, trip, tug, tune, wash, what, wheel, win, yam, yuck, zip, zoo
```

Before enabling **listen-and-identify**, **dictation spelling**, or **sound blending** of unrecorded words, add human/natural recordings using the project's existing audio pipeline. Do not introduce device TTS or mechanical voices. Existing TTS fallback elsewhere in the app is tracked separately in issue #8.

## Editorial considerations

- `mo` is preserved only as a source entry pending clarification; `shwip` should be taught, if intended, only as an explicitly labeled decodable pseudoword.
- `read`, `lead`, `bow`, `wind`, and `close` may change pronunciation by meaning or tense. They are available for **printed spelling-pattern** questions, but not assigned unqualified phoneme labels.
- `Pete` is a proper name. Display uses a capital letter even though data is deduplicated lowercase.
- The earlier letter names/sounds **B, P, T, I, X** are already handled by Letter Sounds. The prior phrase **“I don't”** is practiced in a comprehension passage, not mislabeled CVC.
- Visual phonics puzzles are **not a substitute for word-level spoken modeling**. New natural recordings, curriculum/editorial review and actual iPhone/iPad playtesting remain release checks.

## Verify

```sh
npm run check
node tests/g1readtest.js
npm test
```

The new test also samples 17,500 randomized Grade 1 questions across five difficulty levels and forces every active word to be the correct answer once. Existing regression tests and physical-device testing must still pass before merge.

**Related:** [Early reading word coverage issue #12](https://github.com/sudiptoimpmail/kids-learn/issues/12) and [natural recorded voice issue #8](https://github.com/sudiptoimpmail/kids-learn/issues/8).
