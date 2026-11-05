# Kids Learn — Visual Asset Library (100 assets)

## Inventory

| Visual collection | Distinct files | Format | Source |
| --- | ---: | --- | --- |
| Photo-style animal, flower and vehicle cards | 16 | JPG | Existing original AI-generated artwork in `assets/photos/` |
| Animals (lion, giraffe, zebra, panda, etc.) | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| Weather and nature | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| Vehicles and public-safety transport | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| Food and fruit | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| Everyday classroom and household items | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| Places and geography | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| Science and technology | 12 | SVG | Twemoji graphics, CC BY 4.0 |
| **Total distinct bundled visual files** | **100** | **16 JPG + 84 SVG** | |

The 84 new SVG files are retained as real files in the GitHub repository, not just references to image URLs. The JavaScript manifest `illustrations.js` defines their category and accessible names, `visualPath()` resolves them locally, and `sw.js` precaches all 100 images for installed iPad offline use. Every asset has a stable, reproducible learning name.

## Where the visual content is used
- **Pre-K / Kindergarten General Knowledge:** Randomized sets of 2–4 related picture cards, spoken by existing recorded clips when possible. When there is no prerecorded noun, a picture-matching prompt is shown instead of silently guessing at pronunciation.
- **Reading:** Corresponding visual subjects in word picture clues and passages; photos are preserved for existing topics, with crisp SVG fallback for newly supported nouns.
- **Picture Puzzle:** All 84 SVG subjects can be selected as interlocking jigsaw puzzles; a subset appears alongside the 12 prior photographic puzzle themes. Difficulty is constrained to 4–16 pieces for short child sessions.
- **Parents:** The grown-up dashboard now offers up to three five-minute practice suggestions based on grade and locally recorded skills, with a hands-on discussion prompt.

## Attributions
The 84 illustrations are Twemoji graphics created by Twitter, Inc. and contributors. Graphics licensed Creative Commons Attribution 4.0 International (CC BY 4.0). See `assets/illustrations/ATTRIBUTION.md` and https://github.com/twitter/twemoji/blob/master/LICENSE-GRAPHICS.

The existing 16 JPG photos are a separate original asset group. **The 84 new illustrations are vectors, not photographic images**. The total visual asset target is reached, but a 100-photo objective would require a separate photographic production pass.

## Outstanding quality work
- More high-resolution **photographic** subject images, especially hands, numbers, plants and real-world scenes, could replace the vectors where photographic fidelity matters.
- Natural voice narration does not yet cover every word. Keep the fallback as visual matching; future audio must be recorded/verified before use.
- Child speech and handwriting fluency still require adult observation; multiple-choice accuracy cannot certify oral reading or fine-motor mastery.
- Automated browser and service-worker checks do not replace testing on the family's actual iPad (safe area, gesture controls, installed web app updates, audio levels, VoiceOver).
- Content/illustration quality is not equivalent to professional educator or accessibility certification.
