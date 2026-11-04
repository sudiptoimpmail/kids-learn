# Learn & Play — grade plan and launch architecture

This is the plan for growing Learn & Play into an App Store / Google Play app without redesigning it at launch.
Part 1 is what each grade sees (and ideas to add). Part 2 is how data is stored now, and how it will be stored in the native app and the cloud.

---

## Part 1 — What each grade sees

The grade chosen in ⚙️ decides which games appear on the home screen and the level each one starts at (`GRADES` in `content.js`).
Levels then move up and down with the child's progress. ✅ = in the app today, ➕ = idea to add next.

### Pre-K (ages 3–5)
- ✅ Letters & Numbers: trace A–Z, a–z, 1–20 ("A is for apple" with a picture)
- ✅ Little Words (3-letter words with pictures), first sight words, syllable clapping
- ✅ Counting and adding/taking away within 5 with pictures, more / fewer with pictures
- ✅ Shapes (circle, square, triangle…), colors in questions, body parts, animal homes, jobs
- ➕ **Letter sounds (phonics)**: "Which picture starts with /b/?" — tap the bee, not the cat
- ➕ **Rhyming pairs**: cat–hat, sun–bun (match game)
- ➕ **Patterns**: 🔴🔵🔴🔵 … what comes next?
- ➕ **Sorting**: big/small, same/different, odd one out
- ➕ **Feelings**: name the feeling from a face (happy, sad, scared, proud)

### Kindergarten (ages 5–6)
- ✅ Tracing, CVC and 4-letter words, sight words, Spell It, short sentences, syllables
- ✅ Adding/taking away within 10, compare with > < =, word problems within 10, 2D/3D shapes, maps, flags
- ➕ **Beginning / middle / end sounds**, blending (c-a-t → cat)
- ➕ **Count to 100**: missing number on a hundreds chart, count by 10s
- ➕ **Teen numbers** as 10 + ones with ten-frames
- ➕ **Positional words**: above, below, beside, between (tap the picture)
- ➕ **Weather & seasons**, days of the week song

### 1st Grade (ages 6–7)
- ✅ Read & Answer (1–3 sentences), Big Words, Spell It, Word Wonders vocabulary
- ✅ Add/subtract within 20, two-digit ± one-digit, word problems, compare, clock (optional)
- ✅ Body Parts 3D, Inside My Body (optional), animals of the world, famous places
- ➕ **Digraphs & blends**: sh, ch, th, bl, st — pick the right start
- ➕ **Place value**: tens and ones with base-ten blocks
- ➕ **Money**: name coins, count small amounts (US coins)
- ➕ **Measure**: longer/shorter, measure with paper clips
- ➕ **Sentence builder**: drag words into order, add the period / question mark

### 2nd Grade (ages 7–8)
- ✅ Short stories (3–4 sentences, several questions each), multiply/divide basics, regrouping, capitals of big countries
- ➕ **Fact families & fluency race** (beat your own time, no pressure)
- ➕ **Money word problems**, telling time to 5 minutes, reading bar graphs
- ➕ **Grammar**: nouns/verbs/adjectives, plural -s/-es, past tense
- ➕ **Contractions & compound words** (can + not = can't, sun + flower)
- ➕ **Science**: life cycles (frog, butterfly), states of matter, plants need…

### 3rd Grade (ages 8–9)
- ✅ Passages (5–8 sentences) with "why" and "what will happen" questions, ×÷ to 100, landmark/geography level 3
- ➕ **Fractions**: halves/thirds/quarters with pizza and bars, compare fractions
- ➕ **Area & perimeter** on a grid, rounding to 10 and 100
- ➕ **Main idea & character traits** questions, synonyms/antonyms, prefixes (un-, re-)
- ➕ **Multiplication tables trainer** (one table at a time, then mixed)
- ➕ **US states & regions**, solar system, simple machines

Each new game is one generator in `content.js` (questions + hint + voice text), one line in `CATEGORIES`, and one range per grade in `GRADES`. The voice script records every new line.

---

## Part 2 — Storage and accounts

### Today (web app)
- All progress and settings live in one JSON object (`state`) saved by **`storage.js`** to the browser's localStorage under `learnplay.v1`.
- The data carries a `schema` number. `Store.migrate()` upgrades older saved data, so updates never lose progress.
- ⚙️ has **Save a backup / Load a backup** (a JSON file) so a parent can move progress between devices.
- The grown-up **PIN** is stored as a hash, not as the 4 numbers.
- No accounts, no network calls except loading the app itself. Nothing about the child leaves the device.

### Native app (Capacitor wrapper — same code, no rewrite)
- Wrap the existing web app with **Capacitor** for iOS and Android. All screens, games, the voice clips and the 3D files ship inside the app, so it works offline.
- **Local storage:** keep localStorage for speed, and mirror every save to **Capacitor Preferences** (already wired in `storage.js`: `Store.native()` and `Store.restoreIfNeeded()`), because iOS can clear web storage under low space.
  When saved data grows (drawings, many profiles), move to **SQLite** (`@capacitor-community/sqlite`) with these tables:

  | Table | What it holds |
  |---|---|
  | `device` | PIN hash, theme, voice on/off, play-time rules, purchase status cache |
  | `profiles` | one row per child: display name or nickname, avatar, grade |
  | `progress` | profile id, game id, level, stars, best, last played |
  | `recent` | profile id, game id, recently asked question keys |
  | `artwork` | profile id, drawing / coloring file path (images saved as files, not inside the database) |

- **Several children on one device:** ✅ done. Saved data is `{ device: {...}, profiles: { p1: {...}, p2: {...} }, active, order }` (schema 3, `storage.js`). Device-wide: voice, PIN, play-time rules, test mode. Everything else is per child. The app keeps one flat `state` (device + active child) and `Store.switchTo()` swaps the child in place.

### Cloud (only when we add sync or subscriptions)
- **Accounts are for the parent only.** Children never sign in, type an email, or create a username. This keeps the app inside the App Store Kids rules and COPPA.
- **Do not store passwords or payment details ourselves.**
  - Sign-in: use a managed auth service with **Sign in with Apple** (required on iOS if any other social login is offered), Google sign-in, and email magic link. The service stores password hashes, not us.
  - Payments: Apple / Google handle cards. We store only the **entitlement**: which plan, valid until when, which store. A service like **RevenueCat** checks receipts from both stores and gives one "is premium?" answer.
- **Suggested stack** (any of these works; pick one):
  - AWS: Cognito (auth) + DynamoDB or Aurora Serverless (data) + Lambda / API Gateway; S3 for backups
  - Supabase: auth + Postgres with row-level security
  - Firebase: auth + Firestore
- **Cloud data model** (minimal):

  | Table | Fields |
  |---|---|
  | `parent_accounts` | id from the auth service, country, created date (no child data here) |
  | `entitlements` | parent id, plan (free / premium / family), store, expires at, last verified |
  | `profiles` | parent id, profile id, nickname, avatar, grade — a nickname, never a full name or birth date |
  | `progress_snapshots` | profile id, schema version, JSON blob of progress, updated at (for sync and restore) |

- **Sync model:** local-first. The app always reads and writes the device; when online and signed in, it uploads a progress snapshot and pulls a newer one if another device saved later (last-write-wins per profile is fine for this kind of data).

### Paying (how the app checks it)
- Free tier: a few games in each subject. Premium unlocks everything. One-time unlock or yearly family plan; decide before launch.
- In code, every locked game asks one function: `isPremium()` → cached entitlement on the device (works offline), refreshed from the store at app start.
- Purchases and any link that leaves the app sit behind the **grown-up gate** (the PIN screen, or a grown-up math question).

### Done since
- ✅ Grade start in the middle of each game's range; one hard round (half wrong) moves a level down, great rounds move up (`gradeStart`, `GRADES` in `content.js`).
- ✅ Brain Teasers on the home screen: Pattern Puzzle, Odd One Out, What Comes Next, plus Finger Maze, Memory, Picture Puzzle, Sudoku, Connect Four (untimed).
- ✅ Science (`science.js`, grades 1–3), Word Detective grammar (`grammar.js`), Number Sense with place value, fractions and local coins (`numsense.js`).
- ✅ Country setting (`country.js`): My Country questions, local coins and spelling (colour, maths) for US, UK, Canada, Australia, New Zealand, India, Ireland.
- ✅ 2D and 3D shapes are one Shapes game; Jobs is Pre-K–1st; Body Parts is Pre-K–K; Clap It hides once a child reads and spells well.
- ✅ Today's Quest (daily guided path) — `progress.js` (`questFor()`), per child per day.
- ✅ Progress dashboard and per-skill tracking (game + level = skill) — `progress.js`.
- ✅ Letter sounds recorded from phonemes (`LETTER_SOUNDS` in `phonics.js`); worth checking by ear.

### What to do now so launch is easy
1. ✅ All saving goes through `storage.js` (one place to change).
2. ✅ Data has a schema version with migrations.
3. ✅ Grown-up PIN in front of Settings (needed for the Kids category anyway).
4. ✅ Profiles (several children). ➕ Before launch: images saved as files, `isPremium()` gate, privacy policy, Capacitor project.
5. ➕ Only when needed: cloud accounts and sync.

### Licenses to keep in mind
Everything bundled allows commercial use. The anatomy model needs a credit (CC BY 4.0, shown). OpenMoji art is CC BY-SA 4.0 (credit, share-alike for pictures made from it) — replace with original art before a paid launch if you want no share-alike.
