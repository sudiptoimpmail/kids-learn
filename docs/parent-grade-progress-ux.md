# Parent progress — expected grade skills and honest evidence

## What a parent sees

The primary summary is now about **five expected skill areas for the selected grade**, from Pre-K through Grade 3. They describe what children generally work toward: reading and listening, writing, arithmetic, reasoning, science and community knowledge. These are broader educational expectations, not app section titles.

Each area shows one of:

- **Not observed yet**: the app has no eligible recorded answers. This is *not* a judgment that the child lacks the skill.
- **Getting started**: limited practice or practice on one day.
- **Making progress**: at least eight recent answers across at least two days, with independent success between 70% and 85%.
- **Doing well in practice**: at least eight recent answers on at least two days, with at least 85% independent success.
- **Needs more practice**: at least eight recent answers on at least two days, with below 70% independent success.

Recent answers are aggregated from only the available, grade-eligible content that provides relevant practice evidence. A grade change does not turn a lower-grade activity into higher-grade evidence. **No status is a certification of grade-level mastery, developmental delay or school readiness.** In particular, untested writing, conversation and hands-on skills require observation outside this app.

The parent also sees a short 7-day summary and one plain-language activity to try together.

## Details stay available, but collapsed

Weekly charts, authored objective coverage, granular activity history, three suggested app activities and daily-goal settings are individually expandable. This retains diagnostic capability without making it the first thing a parent sees.

**Current challenge levels** have two separate collapsed groups:

1. Learning activities: grade-eligible academic activities.
2. Brain Games: Finger Maze, Memory Match, Picture Puzzle, Sudoku and Connect Four when grade-eligible.

**Arcade/Play Zone levels are excluded** from the parent learning-level comparison.

Each group shows an overall 1–5 **difficulty setting**, computed as the average relative position within that grade's allowed difficulty range. The number is *not a score of proficiency*. Expanding a group reveals the individual activity levels and recent practice, when available.

Grown-up Settings now uses collapsed **Learning activity levels** and **Brain Game levels** controls. Brain Game changes use the game's actual progression store, including Sudoku's separate level; changing a level resets the win counter to avoid an immediate unintended promotion.

## Verification

The Playwright parent dashboard regression checks all five grades, missing-data honesty, independent practice, grade routing, collapsed sections, arcade exclusion, and Brain Game difficulty persistence. Existing objective-coverage tests still exercise the detailed authored-goal controls inside the collapsed panel.

Verify visually on phone and iPad; run VoiceOver and parent comprehension sessions before release. This is a parent-friendly interpretation of app practice, not an educational diagnosis.
