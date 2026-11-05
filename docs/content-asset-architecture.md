# External curriculum and media architecture (offline-first)

## Principle

**Questions and media are not authored as executable JavaScript.** JSON documents under `data/` hold the shipped word lists, educational facts, fixed questions, texts, story answers, handwriting targets, media metadata, and coloring geometry. Assets under `assets/` hold pictures and scene illustrations as files. JavaScript under the repository root contains the activity engines, generators, input handling, and UI rendering.

The existing math, phonics, sorting and comprehension engines still construct question *instances* dynamically at runtime, from the JSON banks and their question templates. Short prompt strings such as "Which word fits?" remain part of engine-level presentation logic; they are not standalone fixed question banks.

## Bundled file layout

| Directory/file | Responsibility |
|---|---|
| `data/content.json` | Base reading, math story material, general knowledge, flags, country lists, grades, vocabulary |
| `data/stories.json`, `data/reading-patterns.json` | Reading passages, questions, choices and patterned sentences |
| `data/words.json`, `data/grade1words.json`, `data/early-words.json`, `data/phonics.json` | Vocabulary and phonics banks |
| `data/science.json`, `data/grammar.json`, `data/thinking.json`, `data/grade1.json` | Subject questions and activity banks |
| `data/country.json`, `data/geo.json`, `data/landmarks.json` | Country facts, currency denominations, real country-map boundaries, landmarks and animal habitats |
| `data/visuals.json`, `data/game-themes.json` | Named image inventories, maze story themes and mole sprite identities |
| `data/trace.json`, `data/workbook.json` | Tracing/handwriting word banks, illustrated exercise hotspots and pathways |
| `data/scenes.json`, `data/coloring-*.json`, `data/coloring-landmarks.json` | Coloring art path geometry and scene markup, serialized as data |
| `assets/photos`, `assets/illustrations` | Existing 16 photos and 84 illustrations |
| `assets/currencies` | 41 coin and 28 banknote learning illustrations for US, UK, Canada, Australia, New Zealand, India and euro in Ireland |
| `assets/landmarks` | 39 standalone SVG famous-place scenes |
| `assets/maze`, `assets/games`, `assets/workbook` | Original 6 maze sprites, 5 Mole Meadow textures/characters, and 8 illustrated workbook scenes |
| `audio/`, `vendor/` | Original offline recorded voices and 3D runtime/model files |

All currency note/coin illustrations are original **teaching graphics, not photographic replicas or official banknote images**. Their nominal values are accurate to the lesson data; the art must not be marketed as legal-tender reproductions. Underlying OpenMoji/Twemoji/3D artwork retains its original attribution and license requirements in the project.

## Runtime loading

1. `index.html` loads only `content-loader.js` as a module and disables Play until setup completes.
2. The loader fetches the `data/` JSON namespaces. Each must have `{ "schema":1, "namespace":"...", "datasets":{...} }`.
3. The loader checks the schema/namespace, builds `ContentData.get(namespace,key)`, then loads the original classic JS game engines in dependency order.
4. Existing synchronous game generators use `ContentData.get` for their authored rows. All UI and gameplay continue offline from the bundled snapshot.
5. `sw.js` precaches required JSON, art and engine files. It changes cache version on each binary/PWA release. An incomplete download does not activate the new cache.

**Note:** The web/PWA loader still uses `fetch` for its own local files. This is normal for the browser's offline cache. For the native app, the same files are bundled in the application package; remote access is not necessary for free content.

## Future paid content without app reinstall

Optional updates must contain **data/media only**, not JavaScript or CSS that changes functionality:

- Parent-only purchase/restore in settings, protected by the grown-up PIN.
- StoreKit/Google Billing entitlements verified by a trusted backend. Do not rely on a client-side `isPremium` toggle.
- Manifest per pack: schema, pack ID, version, engine compatibility, entitlement, grade/activity scopes, file names and SHA-256 hashes.
- Media stored in the native app's persistent private storage, downloaded and verified atomically; old content stays usable if an update fails.
- The question pack adapter already validates plain multiple-choice questions in `content-packs.js`, saving to IndexedDB. It does **not** yet provide live billing, signed native downloads, or rich interactive pack rendering. Those remain pre-release work.
- Bundled lessons never require login, internet, subscriptions, ads or child-facing purchase prompts.

Apple's current App Review Guidelines, especially Kids Category rules, IAP restrictions and the prohibition on remotely downloaded executable code, must be checked before native release. Content-only JSON/media updates are the safer path; no approval is guaranteed.

## Release checks

Run `npm run check` and `sh tests/run.sh`. The first calls `tests/content-assets-test.js`, which asserts:
- Every referenced JSON file parses and matches its schema/namespace.
- Every external JS engine in the boot sequence is present and precached.
- All 127 newly authored SVG media items exist, parse as SVG-ish markup, and are included in the offline manifest.
- Existing 100-subject visual library is still represented in JSON.
- Story, science, Grade 1, grammar, word, tracing and workbook banks remain available as external JSON.

The entire Playwright browser and device visual regression suite must pass before merging. Verify iPad Safari, Android Chrome, native airplane mode, smaller mobile viewport, no missing narration, offline cache upgrades and copyright/attribution review.

## Migration guardrails

Do not reintroduce static question arrays or embedded image SVG strings into runtime JS. Instead:
1. Add or revise `data/<domain>.json` or `assets/<domain>/<id>.<format>`.
2. Add that file to the offline `sw.js` manifest and bump the cache `VERSION`.
3. Add its namespace to `content-loader.js` when needed.
4. Validate one correct answer, age range, stable IDs and accessible/media fallback labels.
5. For new game mechanics, ship a normal App Store update; do not download executable code.
