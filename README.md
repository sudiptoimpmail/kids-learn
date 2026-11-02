# Learn & Play ⭐

A flash-card learning game for Pre-K through 2nd grade, built as an installable iPhone/iPad web app (no App Store needed).

**Grade setting:** ⚙️ → Grade (Pre-K, Kindergarten, 1st, 2nd). Each grade only shows the games that fit it (e.g. Multiply/Divide only in 2nd, Clock from 1st) and keeps every game inside that grade's level range — auto level-up stops at the grade's top level. Turn on **Show all games** to unlock everything. The ranges live in `GRADES` in `content.js`.

## Games
| Game | What it practices |
|---|---|
| 🐱 Little Words | 3-letter words (cat, ant, bee, key, owl…) — read the word → tap the picture, listen → tap the word, missing vowel |
| 🐸 Big Words | Levels 1–3: 4-letter words (crab, lamp, wolf, coin…) · 4: 5-letter (truck, tiger, puppy, brick…) · 5: long words (alligator, anchor, orange, mother…) |
| 👀 Sight Words | he, she, like, went, from, take, make, over, under, write… Listen → tap the word, fill the missing word in a sentence, and opposites (up/down, hot/cold) from level 3 |
| 🔤 Spell It | See the picture, hear the word, then drag (or tap) letter tiles into the blanks. Extra decoy letters. Level 1: 1–2 missing letters in 3-letter words · Level 2: whole 3-letter words or 2 blanks in 4-letter words · Level 3: whole 4-letter words with look-alike decoys (b/d, m/n) · Level 4: 5-letter words, listen-and-spell sight words (no picture), spell the missing word in a sentence · Level 5: whole 5-letter and long words. Tap a placed letter to send it back; wrong letters bounce out and one correct letter is given |
| 🌟 Word Wonders | 55 new vocabulary words (enormous, curious, fragile, nocturnal…). **Learn** cards: picture + the voice reads the word, a kid-friendly meaning and an example; tap any line to hear it again; swipe or ◀ ▶ to move; a **Talk together** question for parent and child. **🎯 Quiz**: pick the picture for a word, or the word for a meaning. Level 1 = first 20 words, 2 = 40, 3 = all |
| 📖 Sentences | 60 sentences in 3 levels by length: read it, then answer a question |
| 👏 Clap It! | Syllable counting |
| ➕ Adding / ➖ Take Away | 5 levels: within 5 → within 10 → within 20 → two-digit ± one-digit → with regrouping (38 + 7, 52 − 6). Hints use base-ten blocks and "make a ten" steps |
| 📝 Word Problems | 5 levels: within 10 → within 20 → two-digit → "how many more?" → two-step stories |
| 🐊 Compare | > < = : which group has more/fewer, and picture vs picture with the sign box between (counts shown under each group) → pictures and numbers to 10 → to 20 → two-digit → sums and differences |
| ✖️ Multiply | Equal groups with pictures → ×2 ×5 ×10 → up to 5×5 → up to 10×10 → missing factor and story problems. Dot-array hints |
| ➗ Divide | Share equally with pictures → ÷2 ÷5 ÷10 → within 25 → within 100 → story problems |
| 🕐 Clock | Read an analog clock or pick the clock for a time: o'clock → half past → quarter past/to → 5 minutes |
| 🔺 Shapes | 2D shapes, finding shapes, counting sides |
| 🧊 3D Shapes | Cube, sphere, cylinder, cone, pyramid, prism; flat vs solid; real-life objects |
| 🧑‍🚒 Jobs | Who does what |
| 🚩 Flags | Country ↔ flag |
| 🗺️ World Map | Name the highlighted continent, tap a continent, where animals live |
| 🎲 Mix It Up | A bit of everything |

**How it plays:** 10 cards per round. Pictures/clues stay hidden behind **💡 Hint** and appear only when she taps it or after a wrong answer. Right answers get a spoken "Excellent!" / "Awesome job!", confetti and a bouncing emoji; 3 in a row shows a streak. Each finished round earns stars and a new sticker. Each game has 3 levels (math games have 5) and moves up automatically after a great round (grown-ups can change levels in ⚙️).

## Turn on hosting (one time)
Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
After a minute the app is live at https://sudiptoimpmail.github.io/kids-learn/

## Install on iPhone / iPad
1. Open https://sudiptoimpmail.github.io/kids-learn/ in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Open it from the home screen — it runs full-screen and works offline.

## Voice
Every word, question and praise is pre-recorded in a natural voice (`audio/`, made with the open-source Kokoro TTS model, voice `af_heart`), so it sounds the same on every device and works offline.
If a phrase has no recording, the app falls back to the best voice installed on the device. For a better fallback on iPhone/iPad: **Settings → Accessibility → Spoken Content → Voices → English → download "Ava (Premium)" or "Zoe (Premium)"**.

## Edit content
All words, sentences, vocabulary (`VOCAB`), jobs, flags, etc. live in `content.js` — add rows to the arrays. After changing files, bump `VERSION` in `sw.js` so installed copies update.

Progress is stored only on the device (localStorage). No accounts, ads or tracking.
