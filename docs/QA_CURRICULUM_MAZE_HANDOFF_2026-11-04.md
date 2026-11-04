# Implementation handoff: advanced mazes, early words, QA safety, and natural audio

**2026-11-04 · Draft PR [#15](https://github.com/sudiptoimpmail/kids-learn/pull/15)**
**Branch:** `feature/qa-curriculum-maze-20261104`
**Base:** `main` commit `5985a1729c519bc660c3eca920ba8f60ab627c0f`

## Non-negotiable user requirements

- Question, answer, visual correctness and educational value take priority over entertainment features.
- No mechanical/OS speech synthesis for child narration. Follow the existing prerecorded natural `af_heart` voice pattern.
- Small Finger Mazes stay appropriate to Pre-K. Offer bigger, difficult and genuinely circular mazes for older children.
- Home and Settings should not accidentally pinch-expand. Learning questions, coloring, mazes and large puzzles should allow appropriate content zoom and pan.
- Fast test-mode answer review and skipping must not alter child results. Gate test mode using a file-based switch OFF in the production artifact.

## Implemented code changes

| Component | Implementation | Open issue |
| --- | --- | --- |
| `app-config.js`, `index.html`, `app.js`, `games.js`, `wordgames.js`, `trace.js`, `pathmaze.js` | `APP_FEATURES.qaTools:false` default; `isQAMode()` gating. PIN-protected Settings toggle appears in QA-enabled deployments. Hidden 5-tap gesture removed. Answer reveal, Skip, Previous, End and keyboard navigation added. QA rounds use `browse=true` and do not award stars/progress/levels/play passes. | #6, #7 |
| `app.js` | Replaced system `SpeechSynthesisUtterance` fallback with silent-but-auditable missing-clips behavior. Available natural recorded sentence segments are still played independently. | #8 — incomplete audio catalog |
| `games.js`, `pathmaze.js`, `ui-improvements.css` | 12 levels of mazes: original Pre-K 3×4, older rectangles to 19×23; best-of-16 longest-route candidate search for older rectangles. Grade starts: Pre-K 1, K 2, G1 5, G2 8, G3 10. Advanced circular mazes use rings/sectors and graph-verified radial/arc passages; zoom controls and normalized pointer hit-testing. | #3, #4 |
| `index.html`, `app.js`, `ui-improvements.css` | Question content +/−/Reset zoom separate from answer buttons/navigation. Suppress accidental two-finger page scaling on Home/Settings. Preserve native/system accessibility zoom rather than setting `user-scalable=no`. | #5 |
| `early-words.js`, `content.js`, `phonics.js`, `wordgames.js` | Source checklist of 116 unique user-requested words, five standalone letters and the phrase “I don't”; short-vowel CVC vs later phonics levels. 13 new picturable words editorially selected. New audio-pending words excluded from listening-only practice and Word Search/Crossword; visually eligible words added to level-filtered reading, prerecorded eligible ones to spelling. | #12, #13 — partial |
| `grammar.js` | 20 curated meaningful noun/verb example sentences replace nonsensical randomized subject–verb combinations. | #10 |
| `ui-improvements.css` | Removed orphan declarations and repaired reduced-motion rule. | #11 |
| `sw.js` | Cache version **v38**, precaches both new `app-config.js` and `early-words.js`. | Deployment |
| `tests/release-and-maze.js`, `tests/pintest.js`, `tests/run.sh`, `package.json` | Added strict browser tests of prod-disabled/test-enabled flag, non-reward fast skip, 116-word checklist/CVC pools, meaningful grammar, zoom, original Pre-K maze and large circular graph. PIN test simulates QA-enabled config by intercepting local JS; production file remains OFF. | CI |

### Technical generator validation

500 random radial puzzles per shape size generated **zero unsolvable** for 5×12, 6×16 and 7×18 ring-sector graphs; average shortest solution length was ~31, 46, 58 logical cells respectively *before* best-of-25 selection. Source modules were parsed as JavaScript successfully. This is not equivalent to real device touch/gameplay testing.

### IMPORTANT: Missing natural audio & content coverage

The requested checklist contains **116 unique tokens**. At feature development start only **53** had direct entries in `audio/clips.json`; **63 were missing** and remain enumerated in `EARLY_AUDIO_PENDING` inside `early-words.js`. Do **not** synthesize with platform TTS or claim full coverage. Produce reviewed natural recordings using the existing audio generation and name-key mapping conventions. Then:
1. Verify each recording's exact pronunciation, accent and pace against the existing clips.
2. Update `audio/clips.json` and `EARLY_AUDIO_PENDING`.
3. Only then enable its listening/phonics/spelling prompts.
4. Check ambiguous or non-picturable words such as `mo`, `lead`, `bow`, `ill`, `none`, `son`, `sky` with a short meaningful sentence, not misleading emoji.
5. Keep individual letters B/P/T/I/X in *letter-sound instruction* and “I don't” in *phrases/contractions*. They are not regular CVC words.

`early-words.js` is a **coverage checklist**, not proof that all 116 words are active learning cards. The full semantic correctness task #9 and word-coverage #12 must remain open until educator review and audio work complete.

## Validation gates

The new `tests/release-and-maze.js` checks that QA mode is impossible with production file false; with a dev-only intercepted true flag it checks card skipping does not award progress. It also checks maze graph solving and word level selection.

Check the latest GitHub Actions run for PR #15. An older run failed on two `$('[data-z]').forEach` typos in `pathmaze.js` and a word-search `sky` voice gap; both were subsequently fixed by changing to `$$('[data-z]')` and filtering `EARLY_AUDIO_PENDING` from `WG_WORDS`. **Do not merge until the latest workflow succeeds.**

Mandatory iPad/iPhone PWA checks:
- Pre-K mazes 3×4; Level 8–12 larger and circular mazes; pinch zoom, finger tracing, wall collision, rapid drag, backtracking, hints, screen rotation and task interruption.
- Home and Settings: no accidental pinch scaling; retain scrolling and VoiceOver/system accessibility options.
- Word cards: every correct answer supported by image and wording. Phonics middle-letter/glyph grapheme is correct and matching natural voice exists.
- QA flag: OFF in release, ON in developer build; switching profiles/refresh cannot bypass it; QA skip/prev/end/reveal never mutate learning stats.
- Offline installation/update: `sw.js` v38, cache contains `app-config.js` and `early-words.js`; missing natural voice does not trigger robotic speech.

## Follow-up issues

- [#3](https://github.com/sudiptoimpmail/kids-learn/issues/3), [#4](https://github.com/sudiptoimpmail/kids-learn/issues/4): maze rollout, mobile QA and performance.
- [#5](https://github.com/sudiptoimpmail/kids-learn/issues/5): scoped zoom and accessibility confirmation.
- [#6](https://github.com/sudiptoimpmail/kids-learn/issues/6), [#7](https://github.com/sudiptoimpmail/kids-learn/issues/7): test mode flagging and non-reward testing.
- [#8](https://github.com/sudiptoimpmail/kids-learn/issues/8): natural voice coverage; 63 missing word recordings.
- [#9](https://github.com/sudiptoimpmail/kids-learn/issues/9), [#10](https://github.com/sudiptoimpmail/kids-learn/issues/10): semantic answer QA and curated Word Detective.
- [#11](https://github.com/sudiptoimpmail/kids-learn/issues/11): CSS parsing and visual QA.
- [#12](https://github.com/sudiptoimpmail/kids-learn/issues/12), [#13](https://github.com/sudiptoimpmail/kids-learn/issues/13): audited word coverage and age-appropriate phonics.

**Merge policy:** Keep this PR draft until CI passes and on-device QA. Do not silently close partially implemented issues.

## Merge note (2026-11-04)
This branch overlapped PR #16, which was merged first and covers the same issues (test-mode flag in `feature-flags.js`, no device speech, larger and circular mazes in `pathmaze.js`/`radialmaze.js`, scoped zoom, curated grammar, early-word checklist in `early-words.js`).
To avoid two implementations of each feature, conflicts were resolved in favour of main. `app-config.js`, `tests/release-and-maze.js` and the `EARLY_AUDIO_PENDING` filter were dropped: every early and Grade 1 word now has a natural recording, so nothing is pending. This document is kept for history.
