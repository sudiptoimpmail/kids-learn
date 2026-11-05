# Grade 2–3 learning quality and art audit

**Scope:** Kids-Learn's JSON curriculum, question engines, offline media references and age-level configurations on the external-content feature line. Automated assertions do not substitute for teacher and child testing.

## Findings and implemented corrections

| Area | Measured baseline | Change and remaining concern |
|---|---|---|
| Grade 2 catalogue | 28 configured learning sections (including thinking activities) | Substantial breadth; needs more inquiry/manipulatives rather than repeated fact recognition |
| Grade 3 catalogue | 27 configured learning sections (including thinking activities) | Keep Grade 3; make the experience more independent, evidence-based and project driven |
| Grade 2 reading, fixed Level 4 bank | 20 passages before this change | **28** passages after adding 8 original reading/evidence exercises |
| Grade 3 reading, fixed Level 5 bank | 16 before | **22** after adding 6 original passages |
| Grade 3 challenge reading, fixed Level 6 bank | 12 before | **25** after adding 13 original research/experiment/evidence passages |
| Science fact bank | 111 static questions, plus generated sort/classify tasks | Correct answer sets passed structural checks; classroom investigations and observation models still needed |
| General knowledge | 127 static questions | Answer sets passed structural checks; mostly recognition and short fact recall |
| Country facts | 140 questions across seven supported countries | No duplicate choices found; audit facts and cultural assumptions before distribution updates |
| Syllable lessons | 34 curated words | Each word's hyphenated pronunciation matches its spelling. CSS fixed for long words; iPad visual QA still required |
| Famous Places | 39 bundled external SVG illustrations; **0 verified real photographs** | Disable cartoon-driven photo identification until real, licensed, accuracy-reviewed photos are bundled; retain map/city/fact discovery |
| Body Parts | Legacy simple inline SVG and default 3D | Introduced a transparent standalone WebP child character with interactive body-part hit regions; 3D remains for optional advanced anatomy |
| Voice wording | A recorded clip exists for "Which word fits?" | Visible instruction changed to "Which word fits in the blank?" **New natural narration for the full phrase is still needed** |

## Curriculum fit

The [Common Core Grade 2 mathematics overview](https://corestandards.org/wp-content/uploads/2023/09/Math_Standards1.pdf) emphasizes place value, addition/subtraction, equal groups, measurement, time, money and interpreting data. Existing grade ranges cover these domains reasonably well, but the app needs visual measurement instruments, drag-to-build arrays, authentic coins, ruler interactions and graph reading, rather than answering only multiple-choice questions.

The [Common Core Grade 3 mathematics overview](https://www.thecorestandards.org/Math/Content/3/introduction/) emphasizes multiplication/division within 100, fractions, area, equal groups, 2D shapes and reasoned arithmetic. Existing Number Sense, multiplication and division have appropriate topic coverage; they need **deeper models** (area model, fraction strips/number line, word-problem scratchpad, multi-step reasoning).

The [Grade 3 NGSS expectations](https://www.cde.ca.gov/ci/pl/documents/cangssgr3-dci.pdf) call for observable evidence, patterns, models and life-cycle explanations. A bank of science terms by itself cannot teach or assess these practices. Add hands-on virtual experiments, evidence collection, prediction, graphing and explanation prompts. Avoid presenting speculative or uncertain factual claims as established knowledge.

## Recommendation: one app with two age-specific experiences

Do **not** split Grade 3 into another paid app now. Instead introduce an older learner track beginning gradually in Grade 2 and becoming the default in Grade 3. Keep free and purchased content policy unchanged: offline-first, no child-facing upsells or ads.

### Pre-K–Grade 1: playful foundations
- Listen, tap, trace, sort, count, match and explore with short rounds.
- Full-screen, generously sized images and native recorded narration.

### Grades 2–3: Explorer / Investigator
- **Read → Notice → Predict → Try → Explain → Reflect** instead of repeating `question → 3 answers`.
- Use three-step missions: a short illustrated scene, an interactive test/model, then a written or spoken explanation.
- Reading tasks should identify supporting sentences, infer a character's motivation, and distinguish evidence from opinion.
- Math should present money, number line, arrays, measuring tools, graphs and multiple steps.
- Science should model circuits, weather observations, plant variables and forces.
- Geography should use reviewed *real* photographs, maps, distances, cultural context and fact-checkable sources.
- Give older children exploration notebooks, collectable discoveries, optional clues and mastery by skill rather than simplistic sticker rewards.

A separate Grades 4–5 app may later make sense if research shows significantly different navigation, hardware or curriculum needs. Grade 3 alone is not a reason to split immediately.

## Automated checks

- `node scripts/audit-content.cjs` validates every static general-knowledge, science and country multiple-choice bank; all fixed readings; syllable splits; matching response sets; external landmark media presence; and grade-level breadth. Fails on objective structural errors and warns on editorial/photo debt.
- `tests/generated-curriculum-audit.js` (Playwright) samples 40 generated questions per available grade, category and level and verifies answer uniqueness and referenced images. This does **not** establish a complete correctness proof for infinite random parameter combinations.
- `tests/grade-ux-and-media-test.js` checks 320/360/390/768px widths, responsive syllables and external body artwork.
- `sw.js` v59+ pre-caches all required JSON/art files and no longer references deleted scripts.

**Status:** Structural audit completed by evaluating repository JSON in a JavaScript runtime, no blocking errors in the checked datasets; new browser tests have been authored but not run on a complete Playwright/iPad runtime in this work session. No native StoreKit / Play Billing content downloader exists yet.

## Content quality release gates

1. Verify grade/section/level variety, question/answer correctness, and answer distractor plausibility through sample evaluation and editorial review.
2. For every child-facing learning illustration, confirm recognizable subject and sufficient resolution. Landmark recognition **requires true real-world photos**; low-fidelity art may remain for coloring, not testing architectural identification.
3. Give young prereaders clear natural audio. Never silently drop a phrase when only an older, shorter recording is available; add it to the voice production queue.
4. Verify all referenced media are local, correctly licensed, cached offline and available after a fresh install and in airplane mode.
5. Re-run mobile/iPad contrast, text overflow, reduced-motion, accessibility, and 3D fallback tests.
