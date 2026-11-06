# Phase 5A — Accessible landmark images without answer leakage

## Why

Famous Places deliberately avoids using schematics as photographic
recognition tests. When authentic, properly licensed photographs are eventually
bundled, those visual identification modes become available. Previously the
photo's `alt` text included the landmark's proper name, which would directly
reveal the answer to screen-reader users.

## Change

All **39** locally supported landmark subjects now have short, authored
descriptions in `data/landmarks.json` (`MEDIA_DESCRIPTIONS`). Examples
describe shapes, structures and visible details instead of repeating the
landmark name. The shared `landmarkArt()` renderer uses these descriptions for
both illustrations and future allowlisted real photographs.

- Illustration labels begin with “Illustration showing ...”.
- Real-photo labels begin with “Photograph showing ...”.
- Text alternatives contain **visual evidence**, not the correct proper name.
- HTML escaping remains in place, with no remote content or dynamic execution.
- The renderer continues to show the visible **Illustration** status for
  schematic assets.
- Grade eligibility and which question modes are permitted remain unchanged
  and are not hard-coded here.

This ensures a future photograph-recognition item does not become a trivial
spoken-name quiz. It also gives a meaningful experience to children using a
screen reader.

## Media integrity and remaining gaps

The allowlist `data/landmark-photos.json` is **still empty**. All 39 current
schematic landmarks remain drawings, **not** real landmark photographs.
The application must not advertise photo-recognition readiness until the
appropriate public-domain or properly licensed **offline** images have been
independently reviewed and bundled.

Similarly, this PR does not solve the separate generic currency illustration
shortfall. Those should be curated with authoritative image rights and
educational accuracy checks, rather than pulled live from the internet.

## Regression

`tests/landmark-accessibility-test.js` validates that:
- all 39 subjects have distinct, meaningful authored descriptions;
- descriptions do not contain the correct landmark proper names;
- both schematic and simulated photo paths emit safe, descriptive alt text;
- schematic assets are never accidentally offered as photo-recognition
  exercises; and
- the change remains compatible with existing offline and mobile tests.

The test is part of `tests/run.sh`, with a syntax check in `npm run check`.
The offline cache version is bumped to ensure clients use the new descriptions.
