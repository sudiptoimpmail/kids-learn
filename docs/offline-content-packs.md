# Offline-first content and parent-only paid learning packs

## Product promise

1. **Free stays genuinely free.** The install includes all existing games, grade-level questions, visuals and offline practice. No ads, locked tiles in the child's catalog, purchase interruptions, timed trial, or "ask a grown-up" purchase prompt.
2. **Additional educational content is optional.** A parent opens the protected Settings screen, uses Apple In-App Purchase / StoreKit (or Google Play Billing on Android), and explicitly downloads owned data packs. Paying never affects access to free lessons.
3. **The child keeps playing offline.** Downloaded questions remain on the device. Never require sign-in, internet, or entitlement refresh to start bundled content. For one-time-purchased packs, leave existing installed lessons playable offline indefinitely; only subsequent downloads need a current authorization. If offering subscriptions, define/communicate a defensible offline grace period and restoration behavior first.
4. **No promotional friction.** No upsell cards in quizzes, game results, quest flow, home catalog, or child PIN dialogs. Do not show ads to either tier.

## Existing implementation

- The web app currently ships question generators and some fixed banks in `content.js`, `thinking.js`, `grade1.js`, `science.js`, `grammar.js`, and other scripts. Game cards are generated locally and work offline.
- The new `content-packs.js` provides an IndexedDB-backed **schema-validated, data-only** install and selection path for *optional* multiple-choice learning questions. Bundled questions are always the fallback.
- The parent Settings panel lists installed packs. A `Download purchased lessons` control is shown **only if the native app implements** `window.KidsLearnPurchases.downloadOwnedPacks()`. There is deliberately no fake store, payment switch, subscription flag, or child-facing premium tab.
- This code is a foundation, **not an operational billing integration**. A release must not advertise paid packs until the StoreKit/Play Billing connector, backend verification, media handling, and App Review testing are complete.

### Data-only question pack format (schema 1)

```json
{
  "schema": 1,
  "id": "garden-math-k",
  "entitlement": "kidslearn.gardenmath.k",
  "version": 2,
  "title": "Garden Math — Kindergarten",
  "questions": [
    {
      "id": "count-apples-01",
      "category": "add",
      "level": 1,
      "grades": ["k"],
      "prompt": "Two red apples and one green apple. How many apples?",
      "image": "assets/illustrations/apple.svg",
      "choices": ["2", "3", "4"],
      "answer": "3",
      "explanation": "Count two, then one more."
    }
  ]
}
```

- `id` is stable; `version` increases per content release; question IDs never change meaning. The `pack:<id>:<question-id>` key enables the existing recent-question avoidance and progress logic.
- `category` must be a bundled question engine, not downloadable JavaScript; `level` is an existing level; `grades` are explicit per-item restrictions.
- `choices` contains the correct `answer` exactly once, always 3–4 unique options. Plain-text fields are HTML-escaped at display time.
- For now, `image` can reference only bundled, offline `assets/photos/*.jpg` or `assets/illustrations/*.svg`. It cannot be an external URL, script or arbitrary HTML.
- The client rejects malformed packs, oversized payloads, duplicate question IDs, invalid answer sets, and downgrades. Failed writes leave earlier versions available.

### Full downloadable art/audio: required native extension

For **new** art/recordings, add a separate native content downloader:
- A signed manifest contains schema, app compatibility version, entitlement product ID, resource names, file sizes and SHA-256 hashes (e.g. `pictures/canadian-quarter.webp`, `voice/garden-math-q12.m4a`).
- Server returns the manifest/media URLs only after verifying a StoreKit/Play purchase. Use short-lived authenticated URLs, HTTPS, size limits, and content-type allowlist.
- Download to the app's private data directory, verify hashes, and **atomically switch** the active pack only after every required file is present. Keep the previous working version on network or storage failure.
- Render trusted local file URLs only. Never eval JSON, use dynamic imports from downloads, or ship downloaded JavaScript/CSS/HTML to change the app's features.
- Downloaded media should have offline alt text, spoken hints, and child-friendly artwork; when an audio clip is missing, keep a visible textual version rather than relying on internet TTS.
- For iOS, use the native filesystem or appropriately configured persistent storage for large media. Current IndexedDB is only the small question-data proof of concept.

### Parent-only native contract

`window.KidsLearnPurchases.downloadOwnedPacks()` is an integration seam: it must resolve to an array of **already verified** data-only pack objects. A native adapter should:
1. Require the parent gate before purchase management; the current Settings screen is PIN-protected.
2. Query owned IAP products using StoreKit 2 / Google Play Billing.
3. Send signed transaction evidence to a controlled server. Validate ownership and expiration/revocation, and authorize only the requested premium pack.
4. Download and verify the pack before invoking the web layer. Never trust a user-editable `isPremium=true` localStorage flag as purchase authorization.
5. Expose restore purchases, download progress, clear offline pack storage, and retry without interfering with free use.
6. Provide App Review a working in-app purchase flow and demo access, and explain content downloads in review notes.

## Free/paid content matrix

| Capability | Free install | Purchased |
|---|---|---|
| Core reading, spelling, math, geography, games | Included and offline | Same |
| Existing offline asset library | Included | Same |
| Recent-question avoidance, progress, stars, stickers | Included | Same |
| New optional curriculum question sets | Not downloaded | Parent-authorized download |
| New pictures and recorded narration | Existing included assets | Download to local native storage once supported |
| Offline gameplay after download | Yes | Yes |
| Ads or child's purchase prompts | Never | Never |

## Apple review considerations

See Apple's current [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) sections 1.3 (Kids), 2.5.2 (no downloaded executable code), 2.5.19 (no hidden features), 3.1.1 (in-app purchase for digital content), and Apple's [Kids guidance](https://developer.apple.com/kids/). Approval is decided by Apple; this design reduces avoidable risks but is not a guarantee.

### Rollout / release checklist

- [x] Keep free bundled curriculum, no ad or paywall insertion.
- [x] Offline multiple-choice pack schema and local persistence.
- [x] Parent-only optional update integration point.
- [x] Reject arbitrary HTML and invalid option sets.
- [ ] Build StoreKit 2 / Google Billing adapter and authenticated entitlement backend.
- [ ] Implement persistent native media downloads with atomic install and checksum verification.
- [ ] Record/curate audio for all new questions and inspect artwork licenses.
- [ ] Validate full Kids Category review, parental gates, App Privacy, StoreKit sandbox, restore purchases.
- [ ] Run iOS/Android airplane-mode, interrupted-download, storage-quota, corrupted-pack, subscription-expiry tests.
