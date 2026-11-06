# Phase 17 — Media review and sourcing

The original 24 real candidate photographs from Phase 16 are retained. This phase attempts to find the remaining 13 using alternative Commons search phrases and CC BY / CC BY-SA candidates (with attribution review). It rejects obvious paintings, maps, renders and illustrations, but **automated filename filtering does not prove a photo is authentic**.

Run `npm run review:landmarks` and open `docs/landmark-photo-review.html` locally. This generates an offline contact sheet of every candidate image with its Wikimedia source, claimed creator/license, integrity check, and individual visual-review checklist. Checkboxes are not persistent and do not count as curator approval.

To publish a candidate, a human must confirm identity, subject, rights and attribution at the source, then run the existing reviewed-photo importer. Candidate assets remain outside the service-worker cache and learner-facing photo allowlist until approved. If candidate search fails, manual sourcing remains necessary.

Inside My Body still uses the eight-organ offline SVG explorer. `vendor/body.glb` is not bundled; a medically accurate, properly licensed, optimized 3D model still requires actual source acquisition, testing and inclusion. Physical iPad acceptance also requires a real device.

**Do not describe this PR as the completion of all remaining media or the final release.**
