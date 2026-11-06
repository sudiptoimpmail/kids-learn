# Phase 16 — Bulk real-photo review PR

This branch runs a GitHub-hosted batch to **commit actual candidate WebP binaries** for the 37 landmarks not yet photographed. The generated `assets/landmark-candidates/` directory and `docs/landmark-candidate-review.json` are strictly for reviewer inspection. These are **not yet approved assets** and never enter the app's photo allowlist or offline cache.

## Reviewer checklist
For each candidate, open its source page, confirm the landmark is correctly pictured and the rights are genuinely CC0/public domain, record creator, write accurate alt text, and reject unsuitable photos. Import approved images with `node scripts/import-landmark-photo.cjs <id> <webp> <record.json>`, then run `npm run check`, `npm run audit:media`, and both browser CI workflows. Each accepted image must appear in `assets/landmark-photos/`, `data/landmark-photos.json` and `sw.js`.

The source search is not a substitute for review: a filename can describe the wrong subject or contain misleading license information. If no safe candidate is available, the illustration remains.

## Inside My Body and release
`vendor/body.glb` remains absent; the existing original anatomical SVG and eight-organ explorer remain the offline fallback. The sourced GLB must be obtained and built according to `vendor/body-ATTRIBUTION.md`, then tested in iPad Safari before the 3D feature is claimed complete. Physical iPad acceptance and media review must be recorded, not inferred from browser CI.

**No claim of complete release until the full 39-photo manifest, real model, and physical-device signoff exist.**

## Automated acquisition result (2026-11-06)

The staging run committed **24 actual WebP candidate files** into `assets/landmark-candidates/` and a source/hash report at `docs/landmark-candidate-review.json`. **13 landmarks still have no eligible candidate from this search.** None of the 24 is published to children; the PR must not be described as 39/39 real-photo completion. Review and import them individually after source verification.
