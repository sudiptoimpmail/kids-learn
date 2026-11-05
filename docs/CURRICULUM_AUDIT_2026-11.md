# Curriculum and UX quality audit — November 2026

## Scope and standards
Reviewed the app's existing Pre-K, Kindergarten, Grades 1–3 generators and curriculum banks against:
- Michigan K–12 Mathematics Standards (especially K–3 number sense, operations, measurement/data and geometry).
- Michigan K–12 English Language Arts Standards (decoding, comprehension, vocabulary, informational text and communication).
- Head Start Early Learning Outcomes Framework (language, cognition, approaches to learning, social/emotional and motor development).

These are learning-design references, **not certification**. School scope, student readiness, accessibility needs and classroom pacing vary.

## Age-appropriate learning progression
| Profile | Core practice | Optional/stretch |
| --- | --- | --- |
| Pre-K | Name pictures, speak/listen, animal/vehicle recognition, count small sets, compare more/less, rhymes, letter exposure, shapes, fine-motor tracing and short play | Early CVC blending and sight words only where the child is ready |
| Kindergarten | Letter names/sounds, beginning decoding, common words, counting/cardinality, addition/subtraction with objects, patterns, shapes, routines and calendar vocabulary | Short independent reading and place-value exploration |
| Grade 1 | CVC/blends/digraphs/vowel teams, short passages and evidence-based answers, spelling/sentence building, addition/subtraction, place value, measure with repeated units, picture graphs | Expanded vocabulary, mixed word problems, early multiplication as groups |
| Grade 2 | Longer texts, multi-step comprehension, grammar, sums and differences within 100, length, time, money, bar graphs, foundations of multiplication | Multiplicative thinking, more detailed informational passages |
| Grade 3 | Longer informative/narrative reading, reasoning and inference, multiplication/division, fractions, area/perimeter, observation/evidence and scientific explanations | More complex patterns, graphs and exploratory world knowledge |

A child can revisit earlier material; that is different from exposing a young child to above-grade material. Ordinary child sessions clamp difficulty and question eligibility to the selected profile. Explicit parent QA mode is unrestricted.

## Verified content inventory after this audit
- General Knowledge: **127** authored multiple-choice question rows across four levels; additional procedural variation from photo-based presentation.
- Science: **111** authored fact questions plus **6** sorting templates with numerous individual classification items.
- Reading: **94** base sentence/comprehension rows, **22** illustrated multi-question passages, **19** story-ordering scenarios and **29** word-box phrase targets, plus other workbook and word-generation variations.
- Thinking: **65** temporal/cause-effect sequences (including 21 added multi-step routines and inquiry cycles), **28** odd-one-out sets, multiple repeating-pattern templates, Grade 1 skip-counting patterns and older-grade procedural number patterns.
- Sight words: **47** targeted words in the base list, with sentence and meaning variations.
- Pictures: **16** original AI-generated locally stored JPGs (8 animals, 4 flowers, 4 vehicles); **12** selected as rotating photographic puzzle themes.
- Tracing: alphabet capitals/lowercase, numbers 1–20, and a bank of recorded Grade 1 handwriting words.
- Arithmetic, number sense, shape puzzles, phonics and spelling are procedural generators; finite bank size is not a meaningful question-count metric for these.

## Defects corrected by this audit
1. Grade 1 multi-question passage, fill-in and sequencing cards were available in Kindergarten reading level 2. They now begin at reading level 3.
2. The antonym bank misidentified gendered word pairs as opposites; removed these and supplied genuine antonyms.
3. The science sort called smoke a gas; replaced it with genuine gas examples. Corrected ambiguous claims about animal winter behavior and renewable energy.
4. Repeated Pre-K picture questions were removed; one bird-nest prompt was clarified.
5. Older grades could receive very early general-knowledge fact questions too often. Reviews now draw primarily from the immediately preceding content level.
6. Added measurement, nonstandard length units, data interpretation, and Grade 3 area/perimeter inside Number Sense, without adding a new top-level category.
7. Expanded reading banks with genuine short informational/story content; added scientific evidence and community/calendar questions.
8. Improved question cards and response accessibility (contrast, touch affordance, focus indication, feedback layout) and preserved iPad safe-area styling.
9. Added randomized content-quality regression to protect answer validity, grade eligibility, audio fallbacks and image manifest.

## Outstanding quality limitations
- **Not every illustration is a photo.** Detailed illustrated worksheets still contain custom SVG; many short-word options and game visuals still use emoji. Photo coverage is 16 assets, not a complete illustrated lexicon.
- **Not every spoken question has a custom recording.** New science and other older-reader prompts can use a short prerecorded instruction while the full question is printed. Pre-K image naming and pronunciation need a larger verified recording library.
- **Animations are selective.** Game feedback, jigsaw/Pinball motion and UI interactions exist; a fully illustrated animated lesson library does not.
- **Writing, speaking and social skills are not comprehensively assessable** through touch multiple-choice alone. Add short adult-led open-ended prompts, read-aloud discussion and real-world tasks in a later phase.
- **Mastery evidence is limited.** Stars and percentage-correct do not measure reading fluency, explanation quality or transfer to new contexts. Consider spaced review, skill-specific diagnostics and parent-readable progress.
- **Accessibility and on-device coverage:** Automated browser tests are not a substitute for VoiceOver, switch access, low-vision and real iPad orientation/gesture testing.
- **Content bank growth is not the same as pedagogical validation.** Educator review of factual phrasing, decoding sequence and sensitivity to languages/cultures remains recommended.
- **Stretch content** must remain parent-selected or in an appropriate grade band, not automatically shown to Pre-K learners.

## Previous issues / pull requests
- PR #21: closed, unmerged, superseded by later fixes.
- PRs #22, #23 and #24: merged; include iPad controls, offline photos, interlocking jigsaws, test-mode navigation and grade-safety fixes.
- This audit is implemented in a separate PR and must pass the full Browser regression workflow before merge.
