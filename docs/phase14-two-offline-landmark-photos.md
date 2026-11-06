# Phase 14 — Ship two real offline landmark photos

This PR includes an automated branch-only GitHub Actions job that downloads the source-identified CC0 Statue of Liberty and Eiffel Tower photographs, converts them to WebP, and **commits the actual image binaries** to this same PR branch. It updates the photo allowlist and offline precache through the existing fail-closed importer.

The source pages and visible subjects were checked on 2026-11-06: Statue of Liberty by L E X commons and Eiffel Tower by Phivospharconides, both marked CC0 on Wikimedia Commons. The final committed binary images **must be visually inspected by the repository maintainer before merge**; automated metadata records explicitly say that approval is pending. No other 37 landmarks are changed.

**Merge gate:** Wait for the staging workflow to commit `assets/landmark-photos/liberty.webp` and `assets/landmark-photos/eiffel.webp`. Inspect both files in the PR. Confirm that `data/landmark-photos.json` contains exactly those two IDs and `sw.js` lists both WebPs. Verify the required Browser regression and Kids-Learn Offline Content & UI workflows on the **final photo commit SHA**, and no conflicts. Do not merge a code-only branch without the images.

## Verified staged assets

The staging job committed `assets/landmark-photos/liberty.webp` and `assets/landmark-photos/eiffel.webp`; the offline allowlist contains both IDs and service worker version `v97` precaches both files. The final merge still requires visual approval and green CI checks on the PR head.
