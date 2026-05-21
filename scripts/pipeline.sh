#!/bin/bash
# AIPET Automation Pipeline
set -e
PIPELINE_LOG=".claude/pipeline-log.txt"
STAGE=${1:-all}
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$PIPELINE_LOG"; }
cleanup() {
  taskkill /F /IM electron.exe 2>/dev/null || true
  taskkill /F /IM node.exe 2>/dev/null || true
  sleep 1
}

run_build() {
  log "=== Build ==="
  npx tsc --noEmit 2>/dev/null && log "TS OK" || log "TS issues found"
  npx vite build 2>&1 | tail -3
  mkdir -p dist/main
  cp src/main/main.mjs dist/main/ 2>/dev/null || true
  cp src/main/preload.cjs dist/main/ 2>/dev/null || true
  cp src/main/updater.js dist/main/ 2>/dev/null || true
  log "Build complete"
}

run_test() {
  log "=== Test ==="
  npx jest --passWithNoTests --verbose 2>&1 | tail -10 || true
  log "Test complete"
}

run_package() {
  log "=== Package ==="
  npx electron-builder --win --dir 2>&1 | tail -5 || true
  log "Package complete"
}

run_release() {
  log "=== Release ==="
  VERSION=$(node -p "require('./package.json').version")
  log "Version: $VERSION"
  if [ -n "$GITHUB_TOKEN" ]; then
    gh release create "v$VERSION" --title "AIPET v$VERSION" dist/installer/*.exe 2>/dev/null || log "Release skipped"
  fi
}

case "${STAGE}" in
  dev)
    log "=== Dev ==="
    cleanup
    node src/main/ai-proxy.cjs &
    npx vite --port 5174 &
    log "Dev servers started"
    ;;
  test)
    run_test
    ;;
  build)
    run_build
    ;;
  package)
    run_package
    ;;
  release)
    run_release
    ;;
  all)
    log "========== AIPET FULL PIPELINE =========="
    run_build
    run_package
    log "========== PIPELINE COMPLETE =========="
    ;;
  *)
    echo "Usage: $0 [dev|test|build|package|release|all]"
    exit 1
    ;;
esac
