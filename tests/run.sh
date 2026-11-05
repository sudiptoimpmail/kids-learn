#!/bin/sh
# Browser regression tests (Playwright + Chrome). Run from the repo folder:  sh tests/run.sh
# They open the app at http://localhost:8765 — this script starts a local server for them.
cd "$(dirname "$0")/.." && mkdir -p tests/out
python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!; sleep 1
FAILED=0
node tests/original-media-test.cjs || FAILED=1
node tests/curriculum-map-test.cjs || FAILED=1
node scripts/audit-content.cjs || FAILED=1
for t in phase1-test phase2-math-test phase3-language-test explorer-grade23-test grade-route-browser-test grade23-content-test generated-curriculum-audit grade-ux-and-media-test content-assets-test content-pack-test visual-library-test curriculum-depth-test grade-pinball-layout-test ipad-polish-test qa-navigation-test workbook-coverage-test workbook-test issue-audit-test g1readtest child-regressions learningtest brain-games-test kidtest lifetest pintest tracetest tracetest2 tracetest3 dashtest questtest badbackup reviewtest swtest voiceaudit; do
  echo "== $t"; node "tests/$t.js" || { echo "FAILED: $t" >&2; FAILED=1; }
done
kill $SERVER
exit "$FAILED"
