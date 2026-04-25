#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/artifacts"
ZIP_NAME="CodeSensei-web.zip"
ZIP_PATH="$OUT_DIR/$ZIP_NAME"

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -r "$ZIP_PATH" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "artifacts/*" \
  -x "*.DS_Store"

echo "ZIP created: $ZIP_PATH"
