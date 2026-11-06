# Phase 12 — Curated offline landmark photograph import

**Current status:** the offline photograph allowlist remains empty. This PR does **not** add actual photograph bytes or claim to solve offline visual recognition. It adds a reproducible, fail-closed route to ship them without bypassing media provenance rules.

## For a human media curator

1. Select an accurate, child-appropriate landmark photograph from a reputable source. Confirm the actual photo depicts the named landmark, and verify its license on the source page.
2. Convert the locally downloaded original into a visually reviewed, optimized WebP at least 480×320 pixels. Do not upscale a thumbnail just to satisfy dimensions.
3. Prepare a JSON record with `sourceUrl` (HTTPS), `creator`, `license` (one of the allowlisted values), `reviewedBy`, `reviewedOn` (YYYY-MM-DD), `altReviewed` (exactly `yes`), and `attribution` when the license requires it. The reviewer must actually inspect the image and the accessible description in `data/landmarks.json`.
4. Run `npm run import:landmark-photo -- liberty /path/to/reviewed.webp /path/to/review.json` (replace the ID and paths).
5. Review and commit `assets/landmark-photos/<id>.webp`, `data/landmark-photos.json`, and `sw.js` together. Run `npm run audit:media`, `npm run check`, and the browser tests.

The importer checks IDs, required provenance fields, accepted licenses, WebP headers and dimensions, duplicate protection and offline cache registration. It updates the photo allowlist and cache version. It does **not** authenticate the legal claims in the JSON, inspect the photograph visually, or verify that the source URL corresponds to the bytes. Those require a human reviewer. No third-party image requests occur during import.

Only committed, validated images become default offline photographs. Other landmarks retain the explicitly labeled illustration fallback.
