# Phase 3B — Authoritative learning-objective mastery tracking

## Scope and source of truth

**Previously:** the app recorded correct answers at the game/level level, but a
reading, science or geography answer could not consistently be attributed to its
specific learning objective. The parent dashboard therefore showed broad game
skills rather than verified authored objectives.

**Now:** questions carrying *explicit authored metadata* report their actual
learning objective in addition to the existing game-level measurements:

- `data/curriculum-map.json` `ROUTES[*].skill` is retained in the runtime
  question for the 115 Grade 2–3 extension entries (science, GK,
  classification, sequencing and comprehension). The objective is taken from
  the selected row, not guessed from its grade or difficulty level.
- Explorer math/science questions carry their already authored `domain` as
  the objective, and preserve explicit eligible grades.
- Untagged, randomized or older question banks still count toward game/level
  performance. They **do not** receive speculative objective labels.
- The new objective evidence model is **additive** and does not redefine
  existing level progression thresholds or the old skill summaries.

## Grade-specific mastery evidence

Each grade defines `objectiveEvidence` in `data/curriculum-map.json`:
`window`, `minCards`, `minDays`, `masteryRate`, and `practiceRate`.
The generic tracking algorithm does not contain grade-name branches.

For each finished card:
- first-try, unhinted success is independent performance (`1`);
- a first-try result completed with help is represented as `h`;
- an unsuccessful first try is represented as `0`.

A mastery label requires enough recent attempts, a high independent-success rate
and practice on multiple days. Repeated difficulty is labeled *needs practice*.
A small number of attempts is labeled *just starting* instead of prematurely
claiming mastery. Objective history uses only the configured recent window for
classification, while keeping lifetime totals for display.

## Local storage and safety

Evidence is stored only in the current child's offline
`state.stats.objectives`, keyed by **grade + section + objective**.
There is no account synchronization or network upload. The existing profile
storage and backup mechanism preserve these records. Old profiles load without
the field and corrupted or incompatible stored maps are normalized.

The dashboard filters to the selected child's current grade. Parent practice
recommendations prioritize objectives needing more help. Grade-specific default
practice choices now come from `GRADES[grade].practiceFocus` in curriculum JSON
rather than a hard-coded map in UI code.

## Coverage and limitations

This is **not** a claim that every generated question has a known exact learning
objective. More question generators need their own editorially reviewed
objective tags before objective-level mastery can be comprehensive. Explorer
`domain` is a broad authored topic, while Grade 2–3 route `skill` is the
author's stated objective. Both are clearly described as authored objectives.

The new tracker is observational: existing multi-round grade-level progression
from Phase 3A remains the mechanism that changes difficulty. A subsequent
phase can use objective evidence to schedule targeted practice *after* question
banks have adequate unique depth and explicit objective coverage.

## Regression checks

`tests/objective-mastery-test.js` tests:
- preservation of objective metadata through authored content routes,
  multiple-choice rendering, reading, classification and sequencing;
- no Grade 2–3 route leakage into Grade 1;
- Explorer domain and eligible grades on delivered cards;
- duplicate-attempt protection and hinted/wrong-answer handling;
- grade-specific mastery thresholds, multi-day evidence and low-sample states;
- grade-scoped dashboard filtering and actionable recommendations;
- isolation across child profiles;
- a real `next()` completion logging the objective of the answered card.

`tests/curriculum-map-test.cjs` validates each grade's mastery thresholds and
practice-priority references. Both are in the standard GitHub Actions tests.
