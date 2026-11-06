#!/bin/sh
# Browser regression tests (Playwright + Chrome). Run from the repo folder:  sh tests/run.sh
# They open the app at http://localhost:8765 — this script starts a local server for them.
cd "$(dirname "$0")/.." && mkdir -p tests/out
python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!; sleep 1
FAILED=0
node tests/coverage-audit.js --check || FAILED=1
node tests/games-audit.js || FAILED=1
node tests/original-media-test.cjs || FAILED=1
node tests/landmark-photo-provenance-test.cjs || FAILED=1
node tests/curriculum-map-test.cjs || FAILED=1
node scripts/audit-content.cjs || FAILED=1
node tests/editorial-content-test.cjs || FAILED=1
for t in family-learning-test learning-framework-browser-test launch-device-test phase1-test phase2-math-test fraction-semantic-answer-test phase3-language-test phase4-world-test phase5-art-test phase6-levels-test phase7-editions-test placement-test question-integrity-test grade-ladder-test grade-fit-test variants-test onboarding-test family-first-run-test library-test three-little-pigs-browser-test c4-a11y-test build-test grade-progression-evidence-test objective-mastery-test spaced-objective-practice-test explorer-grade23-test explorer-grade-routing-test explorer-math-answer-audit grade-route-browser-test grade23-content-test phase4b-visual-content-test landmark-accessibility-test objective-coverage-dashboard-test generated-curriculum-audit grade-ux-and-media-test reading-text-hierarchy-test content-assets-test content-pack-test visual-library-test curriculum-depth-test grade-pinball-layout-test ipad-polish-test qa-navigation-test workbook-coverage-test workbook-test issue-audit-test g1readtest child-regressions learningtest brain-games-test kidtest lifetest pintest tracetest tracetest2 tracetest3 dashtest questtest badbackup reviewtest swtest voiceaudit; do
  echo "== $t"; node "tests/$t.js" || { echo "FAILED: $t" >&2; FAILED=1; }
done
node tests/story-drama-test.cjs || FAILED=1
node tests/anatomy-explorer-test.cjs || FAILED=1
node tests/landmark-preview-interaction-test.cjs || FAILED=1
kill $SERVER
exit "$FAILED"
