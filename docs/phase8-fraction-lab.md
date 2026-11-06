# Phase 8 — Interactive fraction lab

Grade 3 Explorer fraction-strip questions now include an independent, interactive fraction model. Learners can tap or keyboard-activate each equal part to shade/unshade it, see a live numerator/denominator, and clear the model. This is a practice manipulative, not an answer-selection control: changing it does not change the question's correct answer, scoring, objective mastery, or profile.

The model uses semantic native buttons, `aria-pressed`, per-part labels, a polite live output and 44px+ touch targets. All models are generated from validated JSON fraction-strip metadata. Event delegation allows the same controls to work when question cards are replaced.

The browser regression checks every fraction model for shade, unshade, reset and isolation from non-fraction diagrams, across four viewport sizes. Offline cache increments to v90.

This is a first manipulatives milestone. Next extensions should add arrays, number-line and chart construction and independent evidence-based responses. Physical iPad and VoiceOver validation remains outstanding.
