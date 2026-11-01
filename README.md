# Learn & Play ⭐

A flash-card learning game for a 5-year-old, built as an installable iPhone web app (no App Store needed).

## Games
| Game | What it practices |
|---|---|
| 🐱 Little Words | CVC words — read the word → tap the picture, listen → tap the word, missing vowel |
| 🐸 Big Words | 4-letter words, same three card types |
| 📖 Sentences | Read a short sentence, answer a question |
| 👏 Clap It! | Syllable counting |
| ➕ Adding / ➖ Take Away | Sums and differences, plus little story problems |
| 🔺 Shapes | 2D shapes, finding shapes, counting sides |
| 🧊 3D Shapes | Cube, sphere, cylinder, cone, pyramid, prism; flat vs solid; real-life objects |
| 🧑‍🚒 Jobs | Who does what |
| 🚩 Flags | Country ↔ flag |
| 🗺️ World Map | Name the highlighted continent, tap a continent, where animals live |
| 🎲 Mix It Up | A bit of everything |

**How it plays:** 10 cards per round. Pictures/clues stay hidden behind **💡 Hint** and appear only when she taps it or after a wrong answer. Right answers get a spoken "Excellent!" / "Awesome job!", confetti and a bouncing emoji; 3 in a row shows a streak. Each finished round earns stars and a new sticker. Each game has 3 levels and moves up automatically after a great round (grown-ups can change levels in ⚙️).

## Turn on hosting (one time)
Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
After a minute the app is live at https://sudiptoimpmail.github.io/kids-learn/

## Install on iPhone / iPad
1. Open https://sudiptoimpmail.github.io/kids-learn/ in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Open it from the home screen — it runs full-screen and works offline.

Make sure the ringer/silent switch is off so the voice can be heard.

## Edit content
All words, sentences, jobs, flags, etc. live in `content.js` — add rows to the arrays. After changing files, bump `VERSION` in `sw.js` so installed copies update.

Progress is stored only on the device (localStorage). No accounts, ads or tracking.
