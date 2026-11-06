# Phase 2 — Science, geography and reading answer review

**Scope:** Source-informed corrections to the authored JSON banks. This is an
editorial accuracy pass, not a claim that every question in the app has been
independently fact-checked.

## Corrected issues

| Bank | Problem | Correction |
| --- | --- | --- |
| Science | Sunscreen and an umbrella both protected against sunlight, despite only sunscreen being graded correct | Ask specifically for a UV-protective skin product; replace the umbrella distractor |
| Science | Rainbow prompt implied every sunny period after rain produces one | Ask what sunlight interacting with raindrops *can sometimes* create |
| Science | Boiling/steam phrasing risked equating visible mist with gaseous water | Explicitly distinguish invisible water vapor from visible droplets |
| Science | Season/trees and plant-gas prompts were overgeneralized | Specify four-season climates, deciduous trees, and photosynthesis |
| Science | Food-chain energy could have exceptions outside photosynthetic systems | Specify food chains beginning with green plants |
| World23 science | “Most living things” is ambiguous between counts and species diversity | Ask about variety of plant/animal species |
| World23 science | Unqualified “paper clip” may be nonmagnetic material | Specify a steel paper clip |
| UK geography | English Channel incorrectly described in the question as a “sea” | Use “body of water” |
| Reading — Water | Claimed visible “steam” is a gas you can see | Explain that visible mist is condensed liquid droplets |
| Reading — Sea turtles | Claimed hatchlings follow moonlight reflected on water | Use naturally brighter, open seaward horizon and the danger of artificial light |
| Reading — Hummingbirds | Implied all hummingbirds are the smallest birds | Identify bee hummingbird as the smallest bird species |
| Reading — Spiders | Generalized web building to most spiders | Distinguish web builders from hunting spiders |
| Reading — Honeybees | Claimed queen always lays every egg | Ask about normal colony reproductive role |
| Reading — Rainforests | Used an unqualified “more than half” biodiversity fraction | Use a supportable, nonnumeric statement about high diversity |
| Reading — Other | Overstated bat feeding rates and ambiguous moon/camel facts | Narrow assertions to supported behavior and clearer terms |

## Evidence reviewed

- [American Academy of Dermatology — safe sun](https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/practice-safe-sun): shade and sunscreen are both protective, so the original answers were ambiguous.
- [U.S. Geological Survey — rainbows](https://www.usgs.gov/water-science-school/science/rainbows-water-and-light): sunlight and raindrops produce rainbows under suitable geometry.
- [Met Office — clouds](https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/clouds) and [USGS — water cycle](https://www.usgs.gov/glossary/glossary-water-cycle-terms): water vapor is invisible; droplets form visible clouds/mist.
- [Florida Fish and Wildlife Conservation Commission — hatchling orientation](https://myfwc.com/research/wildlife/sea-turtles/threats/artificial-lighting/): hatchlings seek the brighter ocean horizon even without moonlight.
- [Smithsonian National Zoo — hummingbirds](https://nationalzoo.si.edu/migratory-birds/hummingbirds): the bee hummingbird is the smallest bird species.
- [Smithsonian Environmental Research Center — webless spiders](https://sercblog.si.edu/deadly-tricks-of-spiders-without-webs/): some spiders hunt without prey-capture webs.
- [Smithsonian National Museum of Natural History — honeybee colonies](https://naturalhistory.si.edu/visit/accessibility/audio-and-visual-description/insect-zoo-audio-description-tour): the queen is the normal egg-laying member of a colony.
- [Dover District Council — English Channel](https://www.dover.gov.uk/News/Press-Releases/2023/New-Dover-Museum-Exhibition-Charts-History-of-Channel-Crossings.aspx): Channel separates England and France.
- [World Wildlife Fund — Amazon](https://www.worldwildlife.org/places/amazon/): high biodiversity; avoid unsupported precise fractions in a general rainforest lesson.

## CI safeguards

`tests/editorial-reviewed.json` records the source, the intended answer, and the
previously problematic wording. `tests/editorial-content-test.cjs` checks that:
1. Each reviewed question still exists exactly once with its intended correct answer.
2. Rejected ambiguous distractors and outdated misconceptions have not returned.
3. Reviewed reading answers have nearby supporting language in the passage.
4. **All 293** comprehension question sets across **115** stories have nonblank,
   distinct answer options and nonduplicate prompts within a passage.
5. **14** regional capital facts match a separate country-edition region/capital catalogue.

This audit is offline and is part of `npm run check`, `npm run audit:content`,
and `tests/run.sh`. No grade-specific presentation or routing was hardcoded.

## Remaining editorial debt

- The remaining science/GK facts and all language variants still require periodic
  expert review, especially culturally variable claims and natural-history generalizations.
- Some reading inference questions cannot be proved by checking a quoted evidence span;
  teacher review should distinguish *explicit text evidence* from *reasonable inference*.
- Landmark identification still lacks verified, locally bundled real photos.
- Offline real-device font, accessibility, audio and comprehension testing remain release gates.
