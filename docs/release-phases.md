# Release phases A–H — status

**Where it stands:** every automated gate is in place and green for all five grades. What remains needs people: content review by an educator, physical-iPad testing, and sessions with real children. Each grade shows 2/7 release gates until those five human checks are signed in `docs/release-signoff.json`.

Live scorecard: `docs/coverage/index.html` (rebuild with `node tests/coverage-audit.js --out docs/coverage/coverage.json && node scripts/build-coverage-report.cjs`). Release gate: `node scripts/release-readiness.cjs --require-complete`.

| Phase | What shipped | Still needs a person |
| --- | --- | --- |
| A — shared foundation | Seeded grade × section × level audit (240 levels): distinct cards, repeats, formats, hints, narration, pictures, answer keys, grade fit; in the suite with `--check`. Dashboard. Fixed Match It rounds shrinking to 1–2 cards. | — |
| 18 — media gate | 19 wrong landmark pictures rejected and blocked; release gate needs recorded sign-offs. | Identity, source and license review of the 18 plausible candidates |
| B — Pre-K | Grade fit (no reading, spelling, word answers, × ÷, numbers over 20); harder levels never leave Pre-K's band; picture sums; new formats: match picture sums, match helpers to tools, put pictures in order. Multi-format levels 5 → 9 of 15. | Educator review; child sessions |
| C — Kindergarten | K math within 20; short words only in reading sections; flags level 1 widened 6 → 11; four picture questions for My Country with recorded prompts; match and order formats. Multi-format 12 → 20 of 44. | Educator review; child sessions |
| D — 1st grade | Match clocks to times, match flags to countries, problem ↔ answer matching. Multi-format 15 → 25 of 50. | Educator review; child sessions |
| E — 2nd grade | Match fraction pictures to fractions; ×/÷ matching. Multi-format 11 → 32 of 73. | Educator review; child sessions |
| F — 3rd grade | No ×1/÷1 or younger card types; full-table matching (never ×1). Multi-format 5 → 25 of 58. | Educator review; child sessions |
| G — games | `tests/games-audit.js`: all 14 games open, draw, start inside the grade's level band and exit cleanly for every grade (67 grade × game runs); in the suite. | Physical-iPad playtest (touch, frame rate, 3D games) |
| H — release | Per-grade scorecard: 2 automated gates (CI) + 5 signed gates per grade; release stays closed until all are signed. | All human gates |

## After the parent review (Nov 6)

| Change | Status |
| --- | --- |
| First run asks who's learning and their grade, offers the placement check; Start today's 10 minutes; All done for today; zero as a picture; parent-ready progress page | Shipped (PR #80) |
| Story Time library for Pre-K and K, first book *Little Red Riding Hood* (painted pages, read-aloud with lit words, tap a word, picture questions) | Shipped |
| Release gates per grade: landmark photos block 1st–3rd only; the 3D anatomy model is optional | Shipped |
| Four in a Row playable by keyboard and screen reader; README game lists match the app | Shipped |
| 1st–3rd grade home: recommended row first, the full catalog behind Explore | Shipped |
| Build-it cards: ten frame (Pre-K/K), place-value blocks, arrays, fraction shading, set the clock; multi-format levels 111 → 120 of 240 | Shipped |
| More books; grade map; show-me demos before a new skill; read-along stories for 1st grade | Next |

## Known content limits (not bugs)

- Inside My Body has 8 organs, so its level 1 shows 10 distinct cards across five rounds.
- My Country for K (US) now has 7 picture-answer cards; other countries' editions still lean on word answers and need picture questions written and recorded.
- 120 of 240 levels still use a single question format. The next variants worth writing need new content (category sorting for Odd One Out, syllable sorting with unambiguous pictures), not reuse.
