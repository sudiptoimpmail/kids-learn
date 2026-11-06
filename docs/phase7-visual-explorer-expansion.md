# Grade 2–3 visual Explorer expansion

Adds twelve authored, offline visual math missions (74 → 86 total; 12 → 24 visual). The new questions cover equal arrays, bar-chart totals and comparisons, marked number lines, and shaded fractions.

Each mission includes authored grade eligibility, an objective domain, four distinct answer choices, a mathematical verification expression, an SVG representation, and three pedagogical reasoning prompts. The prompts are available in a native keyboard/touch-accessible disclosure, without requiring network calls.

The renderer escapes all authored step text and validates three nonempty bounded steps. Existing SVG diagram validation, grade routing and correct-answer logic remain unchanged. The browser regression now verifies the expandable reasoning scaffolds and all 24 visual models across four phone/tablet viewport sizes. The independent arithmetic audit checks authored results and model geometry. Service-worker cache increments to v89.

**Limits:** This adds guided reasoning and visual interpretation, not draggable manipulatives or a full Grade 2–3 standards crosswalk. Real iPad/VoiceOver testing and educator review remain required before release.
