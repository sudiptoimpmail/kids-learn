# Phase 4B — Grade 2–3 authored variety and accessible math models

## Scope

This phase increases authored content breadth **without changing the grade
progression algorithm or inferring a grade from a numeric level**. The existing
curriculum map owns grade eligibility and objective identity. All additions are
bundled with the offline application; no image service, runtime generation API,
or remote content dependency is introduced.

## Added instructional content

| Curriculum bank | Before | After | Added |
| --- | ---: | ---: | ---: |
| Explorer math | 62 | 74 | 12 |
| Grade-routed science investigations | 40 | 48 | 8 |
| Grade-routed reading passages | 15 | 27 | 12 |
| Grade-routed items across all five extension banks | 115 | 135 | 20 |
| Comprehension questions in extension passages | 45 | 81 | 36 |

Reading additions include Grade 2 evidence collection, measurement, recycling
data and fair tests; Grade 3 adds comparing survey rates, safe-route decisions,
weather history, accessibility, runoff investigation, sampling bias,
temperature controls and engineering investigations. **Six** new Grade 3
level-6 passages bring the combined level-6 library above the earlier
editorial-review threshold of 20.

Science questions focus on observation, controlled variables, fair testing,
repeated trials, and interpreting evidence. Correct answers and distractors
are reviewed as authored statements, not inferred from random generators.

## Visual math — structured, independently verifiable models

Twelve math missions include these diagrams, rendered as local inline SVG:

- **Equal arrays** (rows × columns, including perimeter from a rectangle)
- **Number lines** (integer steps and fractions between zero and one)
- **Bar charts** (totals and comparisons)
- **Fraction strips** (colored equal parts)

The content JSON stores a safe, typed `representation` descriptor, such as
`{ "kind": "array", "rows": 3, "columns": 5, "answerRule": "count" }`.
The renderer validates element limits, arithmetic parameters and categories
before drawing and escapes all authored labels. It never inserts authored
HTML. Every SVG is labelled for assistive technology and scales down for
narrow phones and iPad viewports.

Each visual math item also contains its **independent** `verification`
expression. The deterministic test recomputes the answer from the expression
and **separately** from the diagram's data. Those two results must agree
and match exactly one answer choice. This makes a picture/answer mismatch a CI
failure, not just a textual correctness problem.

## Grade and learning-objective integrity

- New reading and science rows have aligned `ROUTES` entries in
  `data/curriculum-map.json`; each specifies exact grade, section,
  difficulty level, and authored objective.
- New Grade 2 visual math questions are eligible for Grade 2 and as review
  in Grade 3. Grade 3-only visual math is explicitly tagged `g3`.
- Existing spaced-review and dashboard features can target new items through
  their original `skill` and `domain` metadata, without learning-content
  rules hardcoded by grade.
- Reading route regression now derives ownership from route metadata rather
  than assuming that the first few rows belong to Grade 2.

## Validation and remaining work

- `tests/explorer-math-answer-audit.js` recomputes all **74** math missions,
  and cross-checks the **12** visual representations.
- `tests/grade23-content-test.js` verifies new reading/science bank sizes,
  distinct answers and nonduplicated scenarios.
- `tests/curriculum-map-test.cjs` checks all **135** route mappings.
- `tests/phase4b-visual-content-test.js` checks SVG accessibility,
  responsive fit, grade eligibility, routed reading/science content and
  correctness through the actual question renderers.
- Existing lesson/answer/media/school-grade/browser tests remain mandatory.

This is additive content coverage, not a complete standards or factual
certification. Future work should add more varied representations to
Grade 2–3 **generated** math, diversify geography, improve per-objective
question-bank depth, and test touch/voice accessibility on real iPads.
