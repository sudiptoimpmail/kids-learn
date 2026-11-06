# Final release gap closure: media and device acceptance

## What is implemented
- 39 Famous Places entries, **2** real offline WebP photos (Eiffel Tower and Statue of Liberty), 37 pending.
- Eight-organ interactive Inside My Body explorer, but the 3D anatomy GLB is not bundled.
- Automated browser and offline tests. These are **not** equivalent to physical iPad acceptance.

Run `npm run audit:release` to get the current machine-readable status. For a hard release gate run `node scripts/release-readiness.cjs --require-complete` (expected to fail until photos and the 3D model are bundled).

## Finish the remaining 37 real photos
1. Merge this PR after required CI passes.
2. Run **Actions → Prepare remaining landmark photo review batch → Run workflow** with 5, 15, or 37 candidates.
3. Download the `remaining-landmark-photos-human-review-required` artifact. Each WebP is a **candidate**, not an approved image. Search results can depict the wrong place, use incorrect metadata, or be unsuitable for children.
4. For each file, open the Commons source URL and verify that the pictured subject matches the landmark; inspect the full source-page license, photographer, recognizable framing, child suitability, and an alt description that does not reveal the answer in quiz mode.
5. Create a reviewed JSON record containing `sourceUrl`, `creator`, an exact accepted `license`, `reviewedBy` (real reviewer), `reviewedOn` (actual review date), `altReviewed: "yes"`, and appropriate attribution. Use `npm run import:landmark-photo -- <id> <candidate.webp> <record.json>`.
6. Commit each reviewed WebP, manifest, and cache update in a PR; require media provenance, offline and browser tests on final head. Repeat for the rest. A landmark without a trustworthy licensed image must remain an illustration.

## Finish Inside My Body
- Source the licensed anatomical GLB specified in `vendor/body-ATTRIBUTION.md`, run the documented build in `scripts/body/`, verify credits and model accuracy, and include the actual optimized binary in `vendor/body.glb`. Test offline model loading and child-appropriate visibility on physical iPad. Do not claim the 3D model exists until it is committed.

## Physical device acceptance
- iPad Safari: install to home screen, airplane-mode restart, navigate all grade routes, use audio, images, progress, and quizzes.
- Screen sizes: portrait and landscape; check touch targets, labels, reduced motion, VoiceOver, keyboard navigation where applicable.
- Restore from a backup and verify profile isolation; check cache upgrades and data persistence.
- Manually inspect all 39 photos, the anatomy visual, and all quiz alt text. Record reviewer/date/device/OS in a separate signed release checklist.

**Release is not complete until these steps are done.** The photo-discovery workflow deliberately does not auto-approve or publish media.
