# Phase 5B — Landmark photograph provenance gate

The current photo allowlist is empty. **No new real photographs are claimed or enabled by this phase.** The 39 schematic landmarks remain illustrations, and photo-identification questions remain disabled until authentic, rights-cleared images are supplied.

## Release gate

Before adding an ID to `data/landmark-photos.json:datasets.ids`, bundle `assets/landmark-photos/<id>.webp` and provide a matching `datasets.records[id]` entry:

- `sourceUrl`: HTTPS source page for provenance, not a runtime dependency
- `creator`: original photographer or public-domain credit
- `license`: one of `acceptedLicense`
- `attribution`: mandatory for CC BY/CC BY-SA assets
- `reviewedBy`: human reviewer identity
- `reviewedOn`: ISO date (YYYY-MM-DD)
- `altReviewed`: literal `yes` after confirming the existing descriptive alternative is visually accurate and does not reveal the answer

The automated audit checks IDs, one-to-one records, required fields, bundled WebP signature, minimum dimensions and descriptive alternatives. It does **not** independently establish copyright ownership, likeness, source authenticity, accessibility quality or whether a license permits a particular use. Those require human review.

Run `npm run audit:media` or `npm run check`; the same check is part of browser CI. All assets remain offline. No grade-specific behavior or difficulty thresholds are hard-coded, and no runtime behavior changes are introduced.

## Next work

Curate a small batch of 10 authentic landmark photographs with explicit permission and visual review, then replace misleading generic currency recognition artwork with accurately sourced US/Canada/India images. Follow with physical iPad/VoiceOver/touch testing and interactive Grade 2–3 curriculum expansion.
