# Kids-Learn: grade-by-grade content coverage audit

**Source:** current `GRADES` config in `content.js` plus `thinking.js` extension, assessed on the working feature branch. This is a **configuration and fixed-bank inventory**, not a claim that every randomized visual/question/audio interaction has been device-tested.

## Which lesson sections each grade sees

Cells show the **allowed question levels**; "—" means the section is not visible in the default child catalogue (parents may enable Show all games). The Play Zone is separate and not included here.

| Learning section | Pre-K | Kindergarten | Grade 1 | Grade 2 | Grade 3 |
|---|---|---|---|---|---|
| Letters & Numbers (`trace`) | 1-1 | 1-1 | 1-1 | — | — |
| Letter Sounds (`phonics`) | 1-2 | 1-4 | 3-5 | 4-5 | — |
| Little Words (`cvc`) | 1-1 | 2-3 | 3-3 | — | — |
| Big Words (`w4`) | — | 1-2 | 2-4 | 4-5 | 5-5 |
| Sight Words (`sight`) | 1-1 | 1-2 | 2-3 | 3-4 | 4-4 |
| Spell It (`spell`) | 1-1 | 1-2 | 3-4 | 4-5 | 5-5 |
| Word Wonders (`vocab`) | 1-1 | 1-2 | 1-2 | 2-4 | 3-4 |
| Read & Answer (`sent`) | — | 1-2 | 2-3 | 3-4 | 4-6 |
| Word Detective (`words`) | — | — | 1-2 | 2-4 | 3-5 |
| Match It (`match`) | 1-1 | 1-2 | 2-3 | 3-5 | 4-5 |
| Clap It! (`syl`) | 1-1 | 1-2 | 2-3 | — | — |
| Adding (`add`) | 1-1 | 1-2 | 3-4 | 4-5 | 5-5 |
| Subtraction (`sub`) | 1-1 | 1-2 | 3-4 | 4-5 | 5-5 |
| Word Problems (`story`) | — | 1-1 | 2-3 | 3-5 | 4-5 |
| Compare (`cmp`) | 1-1 | 1-2 | 2-4 | 4-5 | 5-5 |
| Multiply (`mul`) | — | — | — | 1-3 | 3-5 |
| Divide (`div`) | — | — | — | 1-2 | 2-5 |
| Clock (`clock`) | — | — | 1-2 | 2-4 | 3-4 |
| Shapes (`shape2`) | 1-1 | 1-2 | 2-3 | 3-4 | 4-4 |
| Number Sense (`numsense`) | — | — | 1-2 | 2-4 | 3-5 |
| Science (`sci`) | — | — | 1-2 | 2-3 | 3-4 |
| My Country (`home`) | — | 1-2 | 2-3 | 2-4 | 3-4 |
| Body Parts (`body`) | 1-1 | 1-2 | — | — | — |
| Did You Know? (`gk`) | 1-1 | 1-2 | 2-3 | 3-4 | 4-4 |
| Inside My Body (`anatomy`) | 1-1 | 1-1 | 1-2 | 2-3 | 3-4 |
| Jobs (`jobs`) | 1-1 | 1-2 | 2-3 | — | — |
| Flags (`flags`) | 1-1 | 1-2 | 2-3 | 3-3 | 3-3 |
| Animals of the World (`animals`) | 1-1 | 1-2 | 1-2 | 2-3 | 3-3 |
| Famous Places (`places`) | 1-1 | 1-1 | 1-2 | 2-3 | 3-3 |
| World Map (`maps`) | 1-1 | 1-2 | 2-3 | 3-3 | 3-3 |
| Pattern Puzzle (`pattern`) | 1-1 | 1-2 | 2-3 | 3-4 | 4-5 |
| Odd One Out (`odd`) | 1-1 | 1-2 | 2-3 | 3-3 | 3-3 |
| What Comes Next? (`sequence`) | 1-1 | 1-2 | 2-3 | 3-3 | 3-3 |

Sections present: **Pre-K 23**, **Kindergarten 27**, **Grade 1 30**, **Grade 2 28**, **Grade 3 27**. Some are intentionally absent due to age appropriateness, not necessarily a content gap.

## Question-bank size and variety indicators

| Bank | Inventory | Variety / risk |
|---|---|---|
| Odd One Out | 1: 16, 2: 16, 3: 17 | Expanded Level 2/3 classification; still relies mostly on emoji triplets and one obvious outlier, so add drag-and-sort and "why" variants in a future app binary |
| What Comes Next? | 1: 39, 2: 21, 3: 24 | Expanded four-step timelines; future packs should add picture-based sequences with distinct missing positions |
| Science fact bank | 111 total (1: 25, 2: 27, 3: 30, 4: 29) | Additional generated sorting and group-classification formats also exist, so static row count is not total question count |
| Stories | 73 passages (1: 0, 2: 0, 3: 25, 4: 20, 5: 16, 6: 12) | Levels 5–6 have fewer fixed texts than Level 3; prioritize new multi-question reading passages |
| Grade 1 specialist reading | 22 passage activities, 19 ordering activities | Good format breadth exists, but story ordering needs new original picture-story sets to avoid repeats |
| Photos + illustrations | 16 photo names + 84 illustrated subjects | Offline precaching tests exist; assess art consistency, legibility and the actual visual design on iPad before release |
| Money | Existing Number Sense coin questions at selected levels | Changed from denomination-only chips to illustrated coins. Future premium packs should add coins/banknotes from each supported country, making change and shopping scenarios |

Generated mathematics and spelling banks can create many variants from fewer templates, while fixed text/story/science banks repeat sooner. **This table must not be interpreted as a unique-question count for every game.**

## Grade-by-grade priorities

- **Pre-K:** keep short instruction cards, big tappable pictures, basic sounds, sorting and tracing. Improve tangible picture choices in place of emoji wherever practical. No pressure-based timer for learning rounds.
- **Kindergarten:** prioritize stronger word-picture matching, CVC phonics and interactive counting, plus picture-based sequencing, classifying and beginning money identification. Do not mix advanced grammar or overly long passages into K.
- **Grade 1:** expand sentence composition, mixed phonics and reading comprehension formats (word-box, passage, story ordering); strengthen real-life shopping, measurement, time and charts. Preserve multiple formats per session.
- **Grade 2:** prioritize varied short passages, place value, money, 2-digit reasoning, science experiments, and explanation-driven questions, not only another batch of multiple choice.
- **Grade 3:** highest priority for **new fixed reading passages** at levels 5–6, inference/main-idea, nontrivial geography and science reasoning. World Map / Flags currently remain at one top level and should get new targets and formats.

## Content authoring release gates

1. For each `grade × section × level`, log sampled unique question keys over at least 100 generated rounds; distinguish static banks from parameterized generators.
2. Assert one unambiguous correct answer, age-level bounds, varied prompts, no accidental cross-grade leakage, and no repeated cards while new cards are available.
3. Require a local image/alt text, adequate touch targets and offline voice for prereaders; assess image-based questions on an actual iPad.
4. Do not ship newly downloaded executable code. Optional purchased question data should use the [offline content-pack schema](offline-content-packs.md) and parent-authorized downloads.
5. Never add ads, child-facing locked cards, or purchase prompts to fill these gaps.

## Implementation state

- Expanded Odd One Out Levels 2–3 and four-step event sequences.
- Improved garden maze and Mole Meadow presentation, plus local schematic currency pictures.
- Added parent-only optional pack infrastructure, data validation, and offline pack persistence; **native StoreKit/Play Billing and downloadable new media are not yet implemented**.
- Full visual QA and full browser/device regression suite remain to be run by CI or in the project environment.
