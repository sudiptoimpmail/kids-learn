# Learning framework

The reusable core in `learning-framework.js` has no grade names, DOM, game generators or country assumptions. The configuration lives at `data/curriculum-map.json → datasets.learningFramework`; `grade-journey.js` is the current app adapter and UI.

## Data contract

- `schema`: version 1.
- `grades`: grade ID → goals. Each goal has a stable `id`, parent-facing `label`, and explicit `requirements` (skill IDs). The app adapter also accepts `categories` for activity discovery.
- `banks`: bank ID → `mapping`, mapping a question/source ID to one or more skill IDs. Unregistered banks and unmapped sources earn no skill evidence.
- `activities`: skill ID → `{category, level}` for practice navigation. This is separate from the skill label and can point to a replacement bank/activity.
- `evidence`: recent-answer window, minimum answers, minimum distinct practice days, and mastery/practice accuracy thresholds.
- `demonstrations`: activity source → a title, ordered `{text,visual,audio}` steps, and a guided `try` with question, choices, correct answer and explanation. Audio arrays use bundled clip keys. This initial renderer supports text/counters; richer visual renderers can be added without changing evidence tracking.
- `milestones`: configurable titles and minimum secure-goal counts. These are app-practice achievements, not school-grade certification.

## Adding another grade or question bank

1. Author reviewed grade goals and explicit skill requirements. Do not infer standards from an activity title.
2. Register the bank's source-to-skill mapping and practice activities.
3. The app's question object may provide `learningBank` and `learningSource`. Existing generators use the built-in category/level mapping. A bank must be registered in configuration before these fields affect evidence.
4. Add demonstrations and all required recordings. Keep demo examples separate from scored questions.
5. Validate the configuration, run `tests/learning-framework-test.cjs`, and test a round through the UI.

`LearningFramework.record(config, profile, event)` accepts `{grade, bank, source, correct, independent, date, preview}`. `assess(config, profile, grade)` returns the goal statuses. Data is stored in the existing per-child profile and included in backups. Grade is part of every evidence key; legacy results are retained but are not retroactively assigned to a grade.

Secure requires enough independent recent answers on multiple days for **every** requirement. Hints, demonstrations and preview/test mode do not establish mastery. An empty requirement list stays Not assessed. The displayed goals cover supported app practice, not all school learning.

## Included in this first framework release

- Shared parent and child grade-goal views, grade/profile-separated evidence, independent-answer assessment.
- Collapsed learning and brain-game sections, without arcade levels in the brain section.
- A reusable demonstration player with addition, subtraction and comparison examples.
- Evidence-based milestone cards.

## Follow-on modules from the parent review

Still to implement: persistent themed sticker collections, a configurable creations/word portfolio, expanded reading/phonics demonstrations and Grade 1 read-alongs, family story-speed controls, optional session limits/quiet hours, and physical-device acceptance. Existing saved drawings and story readers remain available. These are not claimed complete by this foundational PR.
