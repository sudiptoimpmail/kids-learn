# Phase 6B — Authored objective-depth baseline

Run `npm run audit:objective-depth` to enumerate grade/section/skill groups from the existing curriculum route map, using configured grade eligibility and level ranges rather than hard-coded grade rules.

Each row reports authored route count, authored levels, source bank and a **planning flag** for fewer than 12 authored routes. The flag is not a failing test or a claim of insufficient pedagogy; 12 is the roadmap's provisional planning target, not a verified standard.

The audit is intentionally limited to explicitly routed content. Generated questions and Explorer domain missions are not included in these route counts, and one route does not necessarily equal one unique question or interaction. The tool does not claim standards alignment, answer correctness, mastery, or a comprehensive content audit.

The command is wired into `npm run check` to catch invalid grade/level routes and duplicate route identifiers. No child-facing behavior is changed. The service-worker cache version is incremented for release consistency.

## Next incremental implementation

1. Use the report to prioritize Grade 2/3 skills with shallow authored banks.
2. Add real interaction diversity (models, manipulatives, written evidence) and verify each new answer.
3. Measure repeated-card rates across seeded sessions before claiming improved variety.
4. Complete authentic media review and real-device iPad/VoiceOver testing.
