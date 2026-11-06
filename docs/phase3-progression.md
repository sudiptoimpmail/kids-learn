# Phase 3A — Grade-aware evidence-based difficulty progression

## Why change

The earlier learning-round algorithm advanced a section after **one** round with
at most 10% mistakes and could lower a section after **one** difficult round.
A saved `state.good` counter existed but did not affect promotion. This made
difficulty change abruptly based on a lucky or frustrating session rather than
consistent evidence of mastery.

## Where behavior is configured

`data/curriculum-map.json` owns the rules:

- `GRADES[grade].progression.minQuestions`: minimum unique questions in an
  assessment round before it can affect progression;
- `GRADES[grade].progression.promote`: minimum first-try accuracy, maximum
  mistake rate, and consecutive qualifying rounds to advance;
- `GRADES[grade].progression.support`: maximum first-try accuracy, minimum
  mistake rate, and consecutive qualifying rounds before returning to a
  preceding step for additional practice;
- `policy.adaptive`: a schema-compatible fallback when a grade is not set.

The app does not special-case Pre-K, Grade 1, Grade 2, or Grade 3 in the
progression algorithm. These policies can be tuned by curriculum review without
editing the application logic.

## Round behavior

1. A short or incomplete-content round cannot advance or lower the current
   level, regardless of whether every answer is correct.
2. A qualifying strong round adds one mastery observation; a difficult round
   adds one support observation. The other streak is reset.
3. Mixed performance clears both consecutive-evidence streaks.
4. When the configured number of consecutive strong rounds is reached, advance
   by **one** level, up to the configured grade's maximum.
5. When the configured number of consecutive difficult rounds is reached,
   return by **one** level, no lower than the configured grade's minimum.
6. After a level change, old observations cannot count toward an additional
   immediate change.
7. Quiz/placement checks and explicit parent-selected practice remain excluded
   from automatic difficulty changes, as before.

Evidence is recorded per child, section, grade, and level in
`state.progressionStreaks`. Existing profiles can load without this field.
Changing the grade, manually changing difficulty, or rerunning placement
invalidates relevant previous evidence. The field follows the existing child's
local offline profile and backup/restore path; no server calls are added.

## Safeguards and release testing

`tests/grade-progression-evidence-test.js` covers all five grades and confirms:

- one strong round does not advance a child;
- sustained mastery advances exactly one step;
- one difficult round does not lower a child;
- sustained difficulty offers one earlier step;
- top and bottom curriculum levels remain bounded;
- too-small rounds do not provide false mastery evidence;
- a mixed round breaks a consecutive streak;
- outdated grade/level evidence is not reused;
- placement clears evidence;
- the real `finish()` path persists an advanced level after the required
  consecutive Grade 2 math rounds.

`tests/curriculum-map-test.cjs` validates the schema and thresholds of each
grade policy.

## Remaining work

These rules adjust progression **between existing authored difficulty levels**.
They do not yet give mastery by granular learning objective, guarantee sufficient
question-bank depth at every level, or implement question-level spaced repetition.
Future Phase 3B/4 work should add per-skill evidence and genuinely harder
Grade 2–3 representations (area arrays, number lines, fraction strips, longer
reasoning passages), with all eligibility in curriculum data.
