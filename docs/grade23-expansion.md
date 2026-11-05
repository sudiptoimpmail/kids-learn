# Grade 2–3 curriculum expansion

Data-only bundled content in `data/grade23-extension.json`. It is loaded before question engines and
pre-cached for completely offline play; there are no ads, unlocked lesson solicitations, or remote scripts.

## Additions
- 40 evidence- and experiment-based science questions (20 level 3, 20 level 4).
- 20 everyday reasoning, graph interpretation, money, geography and research questions (10 per level).
- 20 Odd One Out classification cards (levels 2 and 3).
- 20 four-step cause-and-effect/life-cycle/investigation sequences (levels 2 and 3).
- 15 original reading passages (5 each level 4, 5 and 6), with 3 comprehension questions each (45 additional questions).

**115 authored rows containing at least 145 unique individual question prompts** (the
reading passages each include three questions); algorithmic variants are additional.

## Grades and pedagogy
Grade 2 uses levels 2–4 in science/knowledge and level 4 reading. Grade 3 uses level 4
science/knowledge and reading levels 4–6. The activity generators dynamically
select compatible content and preserve previous-review and progress logic.
Questions emphasize observing, measuring, identifying variables, comparing evidence,
reading diagrams and charts, and explaining reasonable conclusions rather than only
memorizing disconnected facts.

## QA
Run `npm run audit:content`, `npm run audit:grade23`, `npm run check`, `npm test`.
The static tests verify answer uniqueness, level bounds, repeated prompts, and
bank sizes; Playwright samples randomized tasks at each grade. Editorial and
physical-device testing remain release gates. External landmark photographs and
native premium media downloads are not added here.
