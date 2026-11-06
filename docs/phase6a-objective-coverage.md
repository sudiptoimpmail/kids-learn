# Phase 6A — Transparent objective coverage and first-time discovery

## Rationale

The parent dashboard already showed mastery evidence for objectives the child
had answered. It did not indicate which explicitly tagged authored objectives
had **never been tried**. A family could mistake a small list of mastered items
for complete coverage of the curriculum.

## What the dashboard now reports

The catalog is derived at runtime from the **authored curriculum route data**
and the Explorer math/science banks. Each entry has an explicit grade, game
section, learning objective and first authored level. The catalog does not
invent labels for older random generators.

- **Practiced**: number of catalog objectives with at least one recorded card.
- **Available**: number of distinct, tagged objectives in that child's grade.
- **Coverage percentage**: practiced ÷ available. Clearly described as
  *tagged objective coverage, not grade completion*.
- **Not yet sampled**: objectives with no recorded evidence.
- **Explore new objective**: an optional parent action selecting an untried
  objective with authored questions at or below the child's current level.

The existing mastery, hints, game statistics, weekly activity, and recommendations
remain separate from this coverage measure.

## How first-time exploration works

Previously a parent's focused review only worked after an objective had already
been attempted. A new targeted item may now be requested only when the
objective exists in the curated, grade-eligible catalog. The usual authored
question bank and round duplicate/grade guards still apply.

No synthetic success, failure or mastery record is created by the button.
Evidence begins only when the child actually answers the question. Unavailable
or out-of-grade objectives cannot be requested through a crafted focus value.

## Privacy and limitations

Everything stays in the existing offline per-child profile. Switching the child
or grade changes the coverage scope, and no account or network dependency is
added. For Pre-K, Kindergarten and Grade 1, many existing question generators
do not have authored objective metadata; the dashboard explicitly shows a
game-level tracking explanation rather than a misleading zero-mastery score.

This is not a complete formal coverage audit of every educational standard.
Adding precise objective tags to the remaining generic question banks requires
educator review before their coverage can be represented truthfully.

## Tests

`tests/objective-coverage-dashboard-test.js` checks the catalog is derived
from valid grade-routed items, zero-practice counts, a real first authored
focus card, authentic attempt recording, grade isolation, invalid objective
rejection and an honest fallback for untagged Pre-K material.
