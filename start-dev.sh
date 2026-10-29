#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LIBRETRANSLATE_DIR="$ROOT_DIR/backend/LibreTranslate"
libretranslate_pid=""

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$libretranslate_pid" ]]; then
    kill -INT "$libretranslate_pid" 2>/dev/null || true
    wait "$libretranslate_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ ! -f "$LIBRETRANSLATE_DIR/run.sh" ]]; then
  printf 'LibreTranslate run script not found: %s/run.sh\n' "$LIBRETRANSLATE_DIR" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  printf 'Docker is required by LibreTranslate run.sh. Install/start Docker, then try again.\n' >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'npm is required to run the frontend. Install Node.js, then try again.\n' >&2
  exit 1
fi

bash "$LIBRETRANSLATE_DIR/run.sh" --load-only en,es &
libretranslate_pid=$!

printf 'Starting LibreTranslate with English and Spanish models on http://localhost:5000\n'
printf 'Starting the frontend from %s/frontend\n' "$ROOT_DIR"
cd "$ROOT_DIR/frontend"
npm run dev
