# Agent handoff — age-aware learning, brain games, and navigation

**Date:** 2026-11-03  
**Repository:** `sudiptoimpmail/kids-learn`  
**Feature branch:** `feature/age-aware-learning-navigation`  
**Starting point:** `d5dd736ef4850c5b7ec5df075652b3405f34ae60`

## Product decisions

1. Pattern recognition, odd-one-out/classification, and event sequencing are **educational lessons**, not earned reward games.
2. Memory Match, Picture Puzzle, Sudoku, Tic-Tac-Toe, Four in a Row, and Ball Maze are **Brain Games**, available without an arcade play-time pass.
3. Pinball, Balloons, Coloring, Rolling Ball 3D, Tap the Mole, Draw & Copy, and Silly Moves remain in the time-gated **Play Zone**. These are still available at parents' chosen play-time rules.
4. Launch audience remains approximately ages 4–7, with Pre-K to Grade 3 material. Difficulty and puzzle visibility depend on grade; parents can override with "Show all games".

## Implemented changes

### Phase A — reliability and brain game rules

- `games.js`: Sudoku now has a `solved` guard; a completed puzzle cannot award repeated wins by entering values or hints.
- `games.js`: Picture Puzzle now locks after completion; Restart and Pictures navigation are explicit. Restart/menu transitions invalidate previous delayed completion panels.
- `games.js`: Picture Puzzle updates only swapped tile elements instead of rebuilding all 4–36 SVG tiles after each move. **Still embeds full SVG in each tile initially**; more optimization may be warranted.
- `games.js`: asynchronous 3D Ball/Pinball imports verify the original `gameSession` and game ID before starting or showing an error.
- `games.js`: Sudoku defaults to grade-specific difficulty (Pre-K/K 1, Grade 1 2, Grade 2 3, Grade 3 4).
- `games.js`: `brainMode` separates untimed educational puzzle access from timed arcade access; no reward pass is needed. Age filters: Memory, Tic-Tac-Toe and Picture Puzzle in Pre-K; Sudoku and Ball Maze from Kindergarten; Four in a Row from Grade 1. Parent "Show all games" overrides.

### Phase B — educational reasoning content and child UI

- **New `thinking.js`**: Pattern Detective (5 levels), Odd One Out (3), What Comes Next? (3). Each produces normal question objects with key, answer choices, hint and explanation, supports recent-question avoidance and grade-specific ranges. Minimum unique level-1 pools: 12 patterns, 16 classification prompts, 14 sequencing prompts.
- `index.html`: loads `thinking.js` between `content.js` and `app.js`, adds an always-accessible Brain Games card, names the Play Zone title element, adds Settings back control, and removes disabled browser zoom. Uses `ui-improvements.css`.
- **New `ui-improvements.css`**: responsive grouped catalog, obvious Brain Games access, touch-friendly activity rendering, keyboard focus indicator, and sticky Settings header.
- `app.js`: groups the learning catalog into Reading, Math, Thinking Skills, and Science & World. Preserves Home scroll position on return; Settings Back saves and returns to Home.
- `progress.js`: tracks the new reasoning skills and incorporates a Thinking Skills activity into alternating daily quests without dropping discovery. Records completed Brain Games separately from arcade minutes and surfaces a weekly count in the parent dashboard.
- `sw.js`: updates offline app cache to `kids-learn-v29`; adds the new JS/CSS to the release cache.

### Phase C — testing and quality infrastructure

- **New `tests/learningtest.js`**: strict generated-question validation across ages and levels (correct answer exists exactly once, no duplicate options, minimum question variety); verifies category grouping, age gating, and Brain versus arcade separation.
- **New `tests/brain-games-test.js`**: Sudoku/Picture Puzzle single-award checks; restarts, stale result panel, and brain game navigation smoke tests.
- `tests/run.sh`: returns failure when any script exits nonzero and includes both new tests.
- `tests/*.js`: Chrome binary can be supplied via `CHROME_BIN`.
- **New `package.json`**: Playwright dev dependency and `npm run check` syntax validation.
- **New `.github/workflows/browser-tests.yml`**: installs Chromium, runs syntax checks and all browser scripts on PRs/pushes.

## Validation already performed

- Verified `thinking.js`, `app.js`, `progress.js`, and `games.js` compile successfully as JavaScript (V8 syntax parsing).
- Executed pure-JavaScript generated-question checks, 1,000 generated questions per level: **0 missing/duplicate answers or options** for the three new categories.
- Unique question keys observed: Pattern 12/36/60/75/100 for levels 1–5; Odd 16/22/28 for levels 1–3; Sequence 14/18/21 for levels 1–3.

**NOT yet verified:** full Playwright browser suite, touchscreen iOS behavior, battery/frame rate, WebGL device behavior, every path in all 13 games, accessibility with VoiceOver, and visual screenshots. Do not claim the app is bug-free. CI status must be checked after the pull request opens.

## Local verification instructions

```bash
git checkout feature/age-aware-learning-navigation
npm install
npx playwright install chromium
npm run check
CHROME_BIN="$(node -p 'require("playwright").chromium.executablePath()')" npm test
```

Tests use a local static HTTP server on port **8765**. Existing test scripts may generate screenshots in `tests/out/`.

### Device test matrix (mandatory before release)

| Area | Test |
| --- | --- |
| Pre-K / K | Home shows phonics, simple patterns, classification, short sequences; Sudoku/Four in a Row not shown below their minimum grade |
| Grades 1–3 | Correct difficulty for patterns, number sequences, Sudoku and other games; override via "Show all games" |
| Brain vs Arcade | Brain Games available when Play Zone is locked; arcade timers do not appear on Brain Games |
| Sudoku | Fill incorrect values; use hints; complete grid; repeatedly tap after solving; reward count changes exactly once |
| Picture Puzzle | Solve 2×2 and 6×6; tap after completion; restart; choose another picture before result animation ends |
| Memory / Tic-Tac-Toe / Four in a Row | Test wins, draws, loss, rapid inputs and navigation |
| 3D Ball / Pinball | Navigate away while modules load; open another game; ensure no late canvas/renderer/error overlays |
| iPhone / iPad | Portrait and landscape; no clipping; large touch targets; parent settings back/save; scroll restoration |
| Offline | Install, load new curriculum JS/CSS offline after update, verify audio behavior |
| Parent stats | Brain puzzle count increments once per win, persists for the right child, arcade time remains separate |
| Accessibility | VoiceOver, keyboard focus, reduced-motion preference and larger text |

## Known opportunities, not fixed in this branch

- **Release QA:** Existing browser scripts are still mostly smoke/logging tests; add assertions for every branch in all 13 games. New strict tests cover two game win conditions and the new educational subjects but not exhaustive behavior.
- **Curriculum:** Have an educator review all classification and sequencing explanations for developmental clarity and ambiguity. 2nd–3rd grade math remains supplementary (fractions, area/perimeter, measurement and data are not complete).
- **Future thinking activities:** Tangrams, spot-the-difference, deeper visual logic and language-free reasoning can be separate scoped phases.
- **Persistence:** Progress and user art are local-only; test migrations and backup/restore with several children.
- **Offline audio:** Thousands of clips still download in the background and may consume significant storage. A granular audio-pack strategy remains desirable.
- **3D performance:** Use an older iPad to profile GPU memory and sustained FPS.
- **UX:** Long puzzles do not yet support pause/resume across app process termination. Consider restoring boards from local state.
- **Monetization:** Store entitlements, parental gates and app-store compliance remain out of scope.

## Agent instructions

Review **this branch**, not `main`, before applying further edits. Preserve the existing no-build HTML/CSS/JS architecture. Do not put educational reasoning lessons behind arcade time gates. Increment the service worker `VERSION` when changing cached assets. Add deterministic tests for new generators and interactive games. Use a separate PR/commit for new curriculum breadth versus stability fixes to keep regressions traceable.

**Merge gate:** syntax check + required CI browser tests green, device spot checks completed, and explicit PR review. Do not merge solely on static source inspection.

## Review on merge (2026-11-04)
- Fixed: Sudoku crashed on open (`$('.sdk-key')` → `$$`), so the number keys never worked.
- Fixed: "What happens next?" could offer a second right answer from a related sequence (seed → 🌻 with 🌳 offered); related pictures are no longer used as wrong answers. Removed two duplicate sequence rows.
- Fixed: quest step trimming could remove the first step when no droppable step was left (`find()` gives `undefined`, not `-1`).
- Recorded voice clips for all 51 new Thinking Skills lines (questions and hints); voice audit clean.
- Tests: learningtest expected 25 grade/level combinations but GRADES gives 23; brain-games-test lost its grade to the reload's own save. Both fixed; full suite green.
