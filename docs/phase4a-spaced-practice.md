# Phase 4A — Grade-configured spaced review and targeted practice

## What changed

Until this phase, the app recorded objective-level performance but did not use it
when building learning rounds. The old generator avoided duplicate and recent
cards but did not schedule harder/easier **authored learning objectives** based
on actual performance.

Phase 4A introduces a bounded, **additive** review plan. The existing core
question generator still makes most cards, while a small number of
curriculum-sourced review items appear when evidence shows they are due.

## Configuration belongs to curriculum data

`data/curriculum-map.json` now contains:

- `GRADES[grade].reviewSchedule.maxReviewCards`: maximum scheduled review
  cards inserted into a learning round;
- `GRADES[grade].reviewSchedule.intervalDays`: minimum calendar days since
  the last attempt for each objective state (`new`, `learning`,
  `practicing`, `mastered`);
- `policy.reviewSchedule`: grade-neutral fallback.

A mastered objective receives a longer interval than an objective needing
help. Dates are compared as local calendar days, rather than relying on exact
elapsed hours, so crossing a daylight-saving-time boundary does not alter the
required number of days. Every grade policy is independently validated in CI.

## Which questions can be selected

A review must have explicit author-assigned provenance and current-grade
eligibility. The existing `data/curriculum-map.json` routes provide objective
and grade for Grade 2–3 science, GK, reading, classification and sequencing
questions. The Explorer math and science JSON banks provide explicit
`domain` and `grades`. No objective is fabricated from generic generators.

Review selection retains the original question renderer, options and correct
answer. It passes through the full round's grade bounds, seen-key and semantic
fingerprint checks. If available authored material is exhausted or too
recent, review is skipped and the normal category generator supplies cards.
A too-small bank is **not** a reason to repeat an identical card within a round.

## What the child and parent experience

- Normal rounds get at most the per-grade review cap, mixed among regular
  questions rather than replacing the whole learning experience.
- Parent dashboard recommendations use a weak objective, when one is
  available, and show that specific practice focus. Starting practice may
  include that objective even before its next automatic review date, while
  still honoring recent-question safeguards.
- Today's Quest now selects a *due* weak learning objective ahead of broad
  game-level weakness when eligible; its practice step can request that
  objective and its current level.
- Mastered objectives are not repeatedly promoted to the top of the queue;
  they return after their longer configured interval.

Existing grade-bounded level progression, first-try/hint accounting, multiple
child profiles, ordinary category performance, placement, QA previews, offline
storage and backup behavior are unchanged.

## Limitations and next steps

Objective-aware review is limited to banks that already contain valid explicit
tags. A generic generated math card remains untagged until its objective is
reviewed and authored, and the review planner never falsely claims coverage.
`last` represents the most recent attempt at an objective; the new schedule
uses that existing field and requires no new storage schema.

Phase 4B should expand the Grade 2–3 bank depth and diversify visuals
(number lines, arrays, area models, real-world diagrams) before increasing
the review cap or making this the sole source of question selection.
Offline iPad QA and source/answer reviews remain release gates.

## Regression coverage

`tests/spaced-objective-practice-test.js` covers review intervals for every
grade, malformed dates, early and due mastered objectives, struggling-skill
priority, six source banks, cross-grade isolation, same-round/recent duplicates,
automatic review caps, parent practice, Today's Quest and child isolation.

`tests/curriculum-map-test.cjs` enforces valid per-grade caps and spaced
intervals. Both run through the standard GitHub Actions workflows.
