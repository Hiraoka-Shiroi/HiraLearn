#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: bash scripts/push-to-github.sh <repo_url> [branch]"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git branch -M "$BRANCH"
git push -u origin "$BRANCH"

echo "Pushed to $REPO_URL on branch $BRANCH"
