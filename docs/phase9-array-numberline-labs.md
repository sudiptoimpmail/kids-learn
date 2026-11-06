# Phase 9 — Build and explore math models

Adds two playable manipulatives to existing Grade 2–3 Explorer math questions:

- **Array builder:** add/remove rows and columns within the authored diagram dimensions; tiles and multiplication count update immediately. Reset returns to one tile.
- **Number-line point picker:** select one labeled tick, move the selected point, or clear it. Horizontally scrollable ticks support narrow phones and keyboard operation.

The existing fraction-strip manipulative is unchanged. Model controls are separate from answer submission, scoring and stored child progress. Grade eligibility and problem content remain JSON-configured. No arbitrary HTML is loaded from question data.

Browser regression exercises every authored array and number-line model, checks bounds, selection replacement, reset and responsive rendering across four viewport widths. Offline cache version v91.

Next: chart construction, multistep evidence and reading investigations, then actual iPad and VoiceOver device validation.
