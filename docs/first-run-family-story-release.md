# First-run family journey, navigation fix and dramatic Story Time

Based on *Learn & Play — Parent Review*, November 6, 2026, especially first-ten-minutes, siblings, and read-aloud recommendations.

## New behavior

- Fresh real-user profile: tapping Play opens a setup modal immediately, before an ungraded Home catalog. The parent must provide a name and grade. Existing completed profiles are preserved.
- The first setup screen explains that up to six children can be added. After saving a first profile the parent can start learning, take the optional eight-card placement check, or set up another child. An unfinished second profile can be cancelled.
- Each sibling has separate grade, name, rewards, books and progress. The Home avatar opens sibling selection; its Add another child action requires a grown-up PIN.
- Service-worker upgrades no longer silently reload just after Play. A visible Update ready button requests restart explicitly; no automatic update interval interrupts children.
- Little Red Riding Hood retains 11 illustrations, all original recorded sentences, comprehension questions and gentle ending. Dramatic punctuation, dialogue styling, subtle scene-sound effects and cancellable suspense delays add atmosphere. Reduced-motion users do not receive zoom animation.

## Regression evidence

- tests/onboarding-test.js covers first setup and placement.
- tests/family-first-run-test.js covers required child name, siblings, separate progress, partial-child cancellation and no unexpected Play navigation.
- tests/library-test.js checks book art, narration and reading interactions.
- tests/story-drama-test.cjs checks recording keys and story integrity.
- tests/run.sh and package.json wire them into the existing CI.

## Physical acceptance

Clean-install and existing-child scenarios must still be checked in real iPad Safari and installed PWA. Confirm service-worker update behavior on slow networks, iPad foreground/background navigation, portrait/landscape, VoiceOver, sibling switching and audio pacing.
