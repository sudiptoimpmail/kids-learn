# v1 release gates

The latest parent QA review controls scope. Pause the unshipped puzzle-size, dragging and drawing expansion until after v1. Do not add accounts, purchases, chat/social or more arcade games.

## Parent trust — release blockers

- [ ] Merge and verify PIN-gated in-game difficulty changes, removal of the arithmetic Forgot PIN bypass, and cancellation of pending PIN callbacks. Implementation and automated coverage are in the parent-gate change; device verification remains.
- [ ] Audit all activity transitions for stale narration, delayed callbacks and overlapping question audio. Shared screen/game exits now cancel clips and invalidate game callbacks; browser regressions pass. Device audio verification remains.
- [ ] Use consistent grade-relative steps in Home, Settings and play; distinguish brain-game levels from learning progress.
- [ ] Play Zone: charge only active arcade play, retain earned credit, give a 30-second warning, and permit an active round to finish. Implemented active-play charging, persistent balances, a visual 30-second warning and up to two minutes of foreground finishing time. No new round can start after expiry; browser coverage includes hourly mode, menus, results and backgrounding. Device acceptance remains.

## Learning quality

- [ ] Verify Word Wonders, Clap It and Quick Check against every grade, particularly Pre-K/K vocabulary and subtraction. Added shared curriculum policies for everyday early-grade vocabulary (learn cards and picture-answer quizzes), one/two-syllable starting pools with picture cues, and entry-level assessment sections. Pre-K Quick Check uses addition/shapes and sounds/claps, not subtraction. Older content remains available. Browser regression and recorded-prompt checks pass; family review remains.
- [ ] Audit Grade 2 multiplication representations, Read & Answer and Science content routes with concrete reproduced examples.
- [ ] Reproduce Letter Sounds number-2 trap; show target counts for multi-selection questions.
- [ ] Add brief interaction teaching for matching tasks.
- [ ] Configure shorter Pre-K/K rounds and preserve earned learning credit when leaving mid-round. Implemented curriculum-owned lengths (5 for Pre-K/K, 8 for Grade 1, 10 for Grades 2–3), per-completed-card credit and duplicate protection. Reload/profile-isolation browser tests pass; family acceptance remains.

## Content and discovery

- [ ] Recheck grade catalog/quest parity after PR #92; ensure home examples reflect entry difficulty.
- [ ] Assess Story Time depth: existing fairy tales plus two three-page Grade 1 readers are not a deep library. Only approved launch content additions; no new game systems.

## Device and release acceptance

- [ ] Physical iPhone near 390px, portrait/landscape: layout, audio, touch targets, scroll and interruption checks.
- [ ] Physical iPad near 820px, portrait/landscape: same checks.
- [ ] Install, cache, close completely, enable airplane mode, and cold-start on each device. Verify available audio separately from app-shell availability.
- [ ] Default country from locale; do not silently assign the first state/province. Ask a parent when the region is unknown and preserve explicit choices.
- [ ] Review privacy policy and support entry in the parent area plus App Store metadata; accurately describe actual data flows. No child-facing external links in v1.
- [ ] TestFlight family sessions, including a five-year-old using the app alone for ten minutes.
- [ ] Review all arcade games for speed and frustration in Pre-K, particularly Pinball, Ball Maze and Rolling Ball.

Automated browser results are evidence of regression coverage, not physical-device or App Store acceptance. Mark items complete only with recorded verification.
