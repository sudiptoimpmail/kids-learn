#!/bin/sh
# Browser regression tests (Playwright + Chrome). Run from the repo folder:  sh tests/run.sh
# They open the app at http://localhost:8765 — this script starts a local server for them.
cd "$(dirname "$0")/.." && mkdir -p tests/out
python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!; sleep 1
FAILED=0
for t in learningtest brain-games-test kidtest lifetest pintest tracetest tracetest2 dashtest questtest badbackup reviewtest swtest voiceaudit; do
  echo "== $t"; node "tests/$t.js" || { echo "FAILED: $t" >&2; FAILED=1; }
done
kill $SERVER
exit "$FAILED"
