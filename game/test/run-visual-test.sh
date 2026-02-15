#!/usr/bin/env bash
#
# run-visual-test.sh
#
# Starts the Vite dev server, runs the visual playtest, then cleans up.
# Screenshots are saved to test-results/visual-playtest/
#
# Usage:
#   ./test/run-visual-test.sh              # headless (default)
#   ./test/run-visual-test.sh --headed     # see the browser
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Configuration
VITE_PORT=5173
DEV_SERVER_URL="http://localhost:${VITE_PORT}"
SCREENSHOT_DIR="test-results/visual-playtest"

echo "=== Holy Hoops Visual Playtest ==="
echo ""

# 1. Start Vite dev server in background
echo "[1/4] Starting Vite dev server on port ${VITE_PORT}..."
npm run dev -- --port "${VITE_PORT}" > /dev/null 2>&1 &
DEV_PID=$!

# Ensure the dev server is killed on exit (normal or error)
cleanup() {
  echo ""
  echo "[cleanup] Stopping dev server (PID ${DEV_PID})..."
  kill "$DEV_PID" 2>/dev/null || true
  wait "$DEV_PID" 2>/dev/null || true
  echo "[cleanup] Done."
}
trap cleanup EXIT

# 2. Wait for the dev server to be ready
echo "[2/4] Waiting for dev server at ${DEV_SERVER_URL}..."
MAX_WAIT=30
WAITED=0
until curl -s -o /dev/null -w '' "${DEV_SERVER_URL}" 2>/dev/null; do
  sleep 1
  WAITED=$((WAITED + 1))
  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "ERROR: Dev server did not start within ${MAX_WAIT} seconds."
    exit 1
  fi
done
echo "       Dev server is ready (waited ${WAITED}s)."

# 3. Run the visual playtest
echo "[3/4] Running visual playtest..."
echo ""

# Pass any extra args (e.g. --headed) through to playwright
# Override baseURL to match the port we actually started on
# (playwright.config.js may reference a different port)
EXTRA_ARGS="${*:-}"
GAME_BASE_URL="${DEV_SERVER_URL}" npx playwright test test/visual-playtest.spec.js \
  --reporter=list \
  --config=playwright.config.js \
  ${EXTRA_ARGS} || true
# Note: "|| true" so we still get to the summary even if a test assertion fails.
# The visual playtest is observation-oriented, not strict pass/fail.

echo ""

# 4. Output results
echo "[4/4] Results"
echo ""

if [ -d "$SCREENSHOT_DIR" ]; then
  SCREENSHOT_COUNT=$(find "$SCREENSHOT_DIR" -name '*.png' 2>/dev/null | wc -l | tr -d ' ')
  echo "  Screenshots saved: ${SCREENSHOT_COUNT}"
  echo "  Directory: ${PROJECT_DIR}/${SCREENSHOT_DIR}/"
  echo ""
  echo "  Files:"
  find "$SCREENSHOT_DIR" -name '*.png' -o -name '*.json' | sort | while read -r f; do
    echo "    $f"
  done
else
  echo "  No screenshots were generated."
fi

echo ""
echo "=== Visual playtest complete ==="
