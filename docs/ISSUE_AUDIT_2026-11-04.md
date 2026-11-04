# Issue-audit implementation handoff — November 4, 2026

**Branch:** `fix/issue-audit-qa-and-curriculum-20261104`  
**Pull request:** https://github.com/sudiptoimpmail/kids-learn/pull/16  
**Base:** `5985a1729c519bc660c3eca920ba8f60ab627c0f`  
**Scope:** Issues #3–#13. Do not merge until CI, educational review and iPad/iPhone QA pass.

> **Branch coordination:** PR #15 (`feature/qa-curriculum-maze-20261104`) is separately open and overlaps this PR. Both branches originate near the same base and modify many of the same files. **Do not blindly merge both.** Compare implementation and choose one authoritative branch; cherry-pick unique fixes only after resolving conflicts and rerunning tests.

## Implemented

| Issue | Scope | Files |
| --- | --- | --- |
| #3 | Preserve original Pre-K 3×4–9×12 grid presets; add 12×15, 12×16, 14×19 and 16×22 challenges; grade-aware initial Finger Maze level (Pre-K 1, K 2, G1 4, G2 6, G3 9) | `pathmaze.js`, `games.js` |
| #4 | Add 6-ring/14-sector and 8-ring/20-sector concentric/radial mazes with DFS perfect-maze graph, longest-of-14 solve-path selection, circular-arc walls, BFS hint and exact graph-edge collision checking; render correctly across sector wraparound. Two-finger zoom with on-screen +/−, one-finger tracing. | `radialmaze.js`, `pathmaze.js`, `games.js` |
| #5 | Suppress accidental native pinch/expand gestures on active Home/Settings screens while preserving system accessibility zoom; question cards have separate +/−/1× content zoom and scrolling. Coloring already has its own zoom. | `app.js`, `index.html`, `ui-improvements.css` |
| #6 | `feature-flags.js` defaults to `testMode:false`; `localTestAutomation:true` permits local Playwright tests. Production hostname ignores stale saved `state.testMode`. `isTestMode()` now guards QA answer reveal, grade override, arcade bypass, rewards and debug hooks. Included in service-worker precache. | `feature-flags.js`, `index.html`, `app.js`, `games.js`, `pathmaze.js`, `trace.js`, `wordgames.js`, `sw.js` |
| #7 | Test switch is visible in PIN-protected Settings when file flag permits it; QA skips immediately, don't increment first-try credit, and normal QA rounds return Home without rewards or learning-attempt logs. Existing Prev/End/Question Browser retained. | `app.js` |
| #8 | Existing natural prerecorded audio stays intact; browser `speechSynthesis` fallback removed. Missing narration is silent rather than robotic and is logged during local QA. | `app.js` |
| #9, #10 | Replace semantically nonsensical Word Detective sentence permutations with curated adjective+noun+verb samples. Add randomized answer/distractor correctness and CVC-type checks. Human educational sign-off **still required**. | `grammar.js`, `tests/issue-audit-test.js` |
| #11 | Remove orphaned CSS declarations and restore meaningful reduced-motion rule. | `ui-improvements.css` |
| #12 | Track every one of the requested 116 distinct early-reading words plus standalone letters, phrase and editorial exceptions. Activate only three additional words (`car`, `cow`, `two`) with clear pictures **and already present recorded natural audio**. Other missing recordings remain blocked from beginner spoken activities. | `early-words.js`, `content.js` |
| #13 | Use a true short-vowel CVC pattern for Pre-K Little Words/Spell It; avoid treating every three-letter spelling as CVC or prompting a missing middle vowel on `pie`, `bee`, etc. Keep distractors within Pre-K CVC pool. | `content.js` |

## Verification

- `node --check` succeeds on all changed JavaScript modules; CI `npm run check` now includes new scripts.
- Ran 240 randomized radial mazes per difficulty level directly against current code: **0 invalid edges/routes**, correct spanning-tree edge count; min solution lengths 39 cells (6×14) and 72 cells (8×20), mean approximately 51 and 91.
- `tests/issue-audit-test.js` covers production default flag, local tester enablement, 116 word IDs and active audio coverage, CVC Pre-K generators, valid graph connectivity and physical game mount, QA skip without stars, and question zoom.
- CI run is attached to PR #16. Always verify the **latest** workflow before merge.

## Open / partially complete

1. **Voice production:** 63 of the 116 requested words were not in `audio/clips.json` at the start of this work. Generate them with the repository's existing natural-voice recording pattern, then activate appropriate exercises **only after listening QA**. Do not introduce system TTS. Also review dynamic hints/feedback audio.
2. **Content QA:** a single machine-readable answer is not sufficient. Audit correct image/meaning, distractors, grammar, country/science facts, and age suitability with a human educator. `mo` requires editorial clarification; `lead` and `bow` need pronunciation context.
3. **Maze gameplay:** graph generation is tested, but the exact tactile experience with multiple pointers, long swipes, pinch and maze-wall collision on older iPhones/iPads needs device smoke testing. The circular layout needs an accessibility alternative for motor impairments.
4. **Zoom accessibility:** test pinching on Home/Settings and scaling/repositioning question content on iOS Safari, standalone PWA and desktop trackpads. OS text zoom/magnification should remain functional.
5. **QA browser:** existing normal tests may rely on localhost-only debug hooks; production flag must remain OFF, and release workflow should confirm it explicitly.
6. **Parallel PR:** #15 is a separate agent's overlapping implementation. Review differences; do not merge both without an integration plan.

## Regression commands

```sh
npm install
npx playwright install chromium
npm run check
CHROME_BIN="$(node -p 'require("playwright").chromium.executablePath()')" npm test
```

Do not alter `main` directly. When cached assets change after this branch, bump the service-worker VERSION (main has since reached v38; this PR now uses v39). The CI check rejects changed precached assets without a version bump.
