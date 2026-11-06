# Famous Places: real-photo preview (partial fix)

**Root cause:** the offline photo allowlist remains empty, so all 39 landmark cards currently render local schematic SVG illustrations. No actual photographs were bundled in earlier phases.

This PR provides **two opt-in real-photo previews** for the Statue of Liberty and the Eiffel Tower. Each has a Commons source page, named photographer and CC0 listing. Children must explicitly select **View real photo (internet required)**. No external image request occurs on page load. The local illustration stays visible offline, and returns on image load failure. These are **online previews, not bundled offline photos**, and do not enter the offline photo allowlist.

Sources:
- Statue of Liberty — L E X commons, CC0: https://commons.wikimedia.org/wiki/File:Statue_of_Liberty_front_shot.JPG
- Eiffel Tower (daytime) — Phivospharconides, CC0: https://commons.wikimedia.org/wiki/File:Eiffel_tower_in_the_morning.jpg

## Remaining release work

1. Download and review the actual image bytes, convert to optimized WebP, and commit to `assets/landmark-photos/`.
2. Add photo IDs and completed human-reviewed provenance records to `data/landmark-photos.json`; run `npm run audit:media`.
3. Expand to all 39 landmarks, ensuring correct identity, licensing and visual accessibility.
4. Verify offline airplane-mode loading and actual iPad/VoiceOver behavior. These are **not completed** by this PR.

The online preview is deliberately not used as the answer image by default because that would make offline gameplay depend on third-party network access.
