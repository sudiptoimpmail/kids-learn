# Phase 4B — Authored math representations and deeper reading

This increment grows the existing Grade 2–3 offline banks rather than forcing
more repeats of the same questions.

## Content changes

- **Math Explorer: 62 → 78** independently answer-checked missions.
  Eight new Grade 2 items and eight new Grade 3 items use four visual
  representations: **dot arrays**, **fraction strips**, **number lines** and
  **bar graphs**.
- Each diagram is described in `data/explorer-math.json` and drawn by a single
  generic `explorer-engine.js` renderer. No grade-specific diagram rules are
  embedded in the renderer.
- The diagram data, answer, wrong options and mathematical verification must
  agree. The offline math audit calculates the result independently and
  checks that each figure represents the same number.
- **Curated comprehension: 15 → 27** passages in `data/grade23-extension.json`,
  with **81** total questions (36 new). Six new passages belong to Grade 2
  and six to Grade 3. Grade ownership, difficulty and learning objective
  are explicitly mapped in `data/curriculum-map.json` (127 total routes).
- Subjects include fair tests and measurement, maps, graphs, library care,
  gardening, sound investigation, flood monitoring, pavement temperature,
  biodiversity surveys, energy use, historical sources and safe water testing.
  The passages distinguish measured evidence from unsupported conclusions.

## Offline and accessibility

The generic diagrams are **locally generated SVGs** with role=img,
descriptive screen-reader labels, strong contrast, responsive scaling and
no remote assets. Visuals convey real mathematical data, not decorative art.
At 320 px wide they must remain readable without horizontal scrolling.
The classroom reading scale remains controlled by the grade presentation
policy from earlier phases.

## Regression coverage

- `tests/explorer-math-answer-audit.js`: verifies all 78 answers, numerical
  distractors and the 16 visual diagrams against independently calculated
  values from the verification model.
- `tests/grade23-visual-depth-test.js`: checks diagram rendering, accessible
  descriptions and layout at 320, 390, 768 and 1024 px, as well as
  Grade 2/3 reading eligibility and unambiguous correct-option placement.
- Existing routing, content-integrity, app and offline browser tests now use
  the expanded bank counts. The story grade test uses routes, **not an
  array-index split** that would silently break when new stories were added.

## Remaining Phase 4B/5 work

More distinct Grade 2–3 science experiments, interactive manipulatives and
number-line reasoning are still needed. A sound/factual editorial pass of the
new passages remains valuable, as do physical iPad touch and audio tests.
The existing illustrated landmark and generic currency media gaps are not
resolved by this PR. These should be separate improvements rather than
claiming that adding math diagrams solves missing photographs.
