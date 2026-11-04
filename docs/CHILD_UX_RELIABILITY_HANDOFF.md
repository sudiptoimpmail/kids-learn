# Release handoff — child UX, counting blocks and PWA reliability

**Date:** 2026-11-04  
**Pull request:** https://github.com/sudiptoimpmail/kids-learn/pull/2  
**Branch:** `fix/child-ux-reliability-20261104`  
**Base:** `fd6ec366b32879ae507ae36c12d673411b100e8c` (`main`)

## Why this work was requested

A child was asked to count dozens of little blocks (around 80); the welcome screen sometimes appeared again after tapping “Let's Play”; and praise such as “Brilliant!” sometimes appeared or played before the next question was answered. Earlier review also found an unversioned offline cache, expensive play-time writes and audio caching, gaps in progress/reset behavior, and curriculum ambiguity.

## Implemented changes

| Files | Change |
| --- | --- |
| `app.js` | The first splash dismissal is stored in **sessionStorage** for the tab, so a service-worker reload doesn't show the welcome screen a second time. Auto-updates now wait until the child has entered Home. |
| `app.js` | Clears answer popovers whenever a new question/round starts or navigation exits Play; cancels old voice clips; ignores stale audio decodes, delayed synthetic speech, and delayed wrong-answer hint continuations. `choose()` rejects input from inactive questions/screens. |
| `numsense.js`, `ui-improvements.css` | Displays numbers as **base-ten manipulatives**: one shaded blue flat represents 100, an orange rod represents 10, and a green cube represents 1. Beginner 2-digit counting is restricted to 10–39, and hundreds questions to 100–399. Higher grades no longer randomly receive a Level 1 counting question. Uses CSS shading, not WebGL. |
| `app.js` | Progress Reset retains `country` and `dailyGoal` along with other adult preferences. |
| `progress.js` | A successful Brain Game or completed tracing counts as a learning day and contributes to streaks. The parent dashboard no longer claims a child did no learning when they solved puzzles or traced. |
| `games.js` | Hourly arcade timer uses `performance.now()`, persists approximately every 10 seconds (not every second), and flushes on time-up. Existing visibility/pagehide saving remains. |
| `grammar.js` | Makes noun/verb classification contextual: “I see the ...” versus “We ...” to avoid category ambiguity with words such as “play”. |
| `thinking.js` | Many more variable visual patterns and category subsets; adds child-appropriate everyday sequences and missing-first/middle/last formats. In a randomized validation of 2,200 samples/level: **288 beginner pattern variants, 96 odd-one-out variants, 84 beginner sequencing variants; zero malformed answers.** |
| `storage.js` | Native restore clears stale pending writes, sanitizes the recovered root and uses a normal return instead of an intentionally never-resolving promise. |
| `pathmaze.js`, `trace.js` | Solver-injection debug hooks are exposed only for test mode or localhost. |
| `sw.js` | Offline app cache bumped **v32 → v33**. Caching a fetched asset now completes before returning it. Initial audio preloading uses a lightweight common-phrases pack; all other clips cache on demand, with an explicit parent-controlled full offline download available in Settings. |
| `index.html`, `app.js`, `storage.js` | Added the large offline-voice download button and device-level preference. After opting in, download attempts resume when the app reopens. |
| `scripts/check-cache-version.cjs`, GitHub workflow | CI compares with `main` / previous release and fails when a precached script, stylesheet, manifest or `sw.js` changes without a service-worker version bump. Also verifies the HTML's script/CSS references are precached. Older CI runs are cancelled when superseded. |
| `tests/child-regressions.js`, `tests/swtest.js`, `tests/voiceaudit.js`, `tests/run.sh` | Added regression assertions for splash reload, stale reward, old hint, reset, learning days, age-sized blocks, advanced difficulty, offline core audio, and missing voice recordings. |

## Verification and follow-up

1. Review the current PR's latest GitHub Actions run; **do not merge with a failing run**.
2. On an *already-installed* iPhone PWA, deploy an update and verify that a previous user receives the new JS/CSS and does not get asked to tap “Let's Play” again.
3. Play Number Sense at grades 1–3. Confirm that the tens/ones visual is clear at 320–390px widths, and hundreds flats are not clipped.
4. Rapidly answer a question, go Home, start another category, and verify the prior “Brilliant!” overlay and prior voice clip never appear on an unanswered card.
5. Test in airplane mode: common praise prompts work immediately; subject prompts may use device speech unless a parent downloads the complete voice pack.
6. Test an interrupted full offline-voice download on iOS. The service-worker background task can be stopped by the OS and should resume on next launch; this is not yet an exhaustive resilient downloader.
7. Verify 3D games, PIN recovery, tracing accuracy, swipe gestures, and physical iPad/iPhone VoiceOver; browser CI cannot replace on-device QA.

## Known limitations / additional work

- The early-grades reasoning pool now contains more variations, but some are variations of the same learning concept; a human educator should review age fit, ambiguity, and pedagogical progression.
- New story-sequence explanation phrases do not yet have natural prerecorded voice clips and therefore use device TTS fallback. These are explicitly allowed in `tests/voiceaudit.js`; they should be recorded before a full offline-audio guarantee is claimed.
- Game rules and parental PIN remain local controls, not secure authentication. The PIN reset question is guessable; do not reuse it for payment authorization.
- The native restore still relies on a page restart after resolving a newer native copy; a future Capacitor-specific async bootstrap could avoid the restart entirely.
- Audio download progress reports attempted files, not a byte-level guarantee of all media saved. Browser and storage quotas can interrupt a full download.
- Some legacy game tests are still smoke tests rather than complete branch coverage.

## Run local tests

```sh
npm install
npx playwright install chromium
npm run check
CHROME_BIN="$(node -p 'require("playwright").chromium.executablePath()')" npm test
```

Run `node scripts/check-cache-version.cjs` only in a Git checkout with full history; the CI workflow uses `fetch-depth: 0`.

**Merge criteria:** latest CI success, in-device review of the three user-observed bugs, and no local-storage regressions after child profile switching.
