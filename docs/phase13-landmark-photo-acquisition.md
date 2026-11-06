# Phase 13 — Acquire actual landmark photographs for review

A manual GitHub Actions workflow named **Prepare landmark photo candidates** downloads two identified Wikimedia Commons photographs (Statue of Liberty and Eiffel Tower), verifies that the responses are images, converts them to optimized WebP and uploads them as a private-to-workflow review artifact for 14 days. The artifact includes `REVIEW.json` with source URLs, claimed CC0 licenses, creators, hashes, dimensions and a conspicuous **PENDING** review status.

The source pages currently identify the Statue of Liberty photograph by L E X commons and the Eiffel Tower photograph by Phivospharconides as CC0. Source pages must be rechecked before publication; the downloader cannot verify rights or visually inspect the subject. It does not modify the repository or enable any photograph in the app.

## Steps to publish

1. After this PR merges, open **Actions → Prepare landmark photo candidates → Run workflow**.
2. Download `landmark-photo-candidates-review-required` from the successful workflow run.
3. Open both WebP files and their Commons source pages. Check visual accuracy, child suitability, licensing and accessible descriptions; record the actual human reviewer and review date.
4. Use `npm run import:landmark-photo -- liberty /path/to/liberty.webp /path/to/liberty-review.json` (and similarly for `eiffel`) to commit the reviewed files with provenance and cache registration.
5. Run `npm run audit:media`, `npm run check` and browser regression before merging that photo-asset PR.

**Not yet done:** No photograph binaries are bundled in this PR. Until a reviewer approves and commits them, the app continues to show its labeled offline illustrations.
