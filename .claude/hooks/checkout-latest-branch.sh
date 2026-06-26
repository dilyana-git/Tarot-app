#!/usr/bin/env bash
cd "$CLAUDE_PROJECT_DIR" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes present; staying on $(git branch --show-current)."
  exit 0
fi
latest=$(git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short)' | head -n1)
current=$(git branch --show-current)
if [ "$latest" != "$current" ]; then
  git switch "$latest" >/dev/null 2>&1 && echo "Switched to most recently committed branch: $latest"
else
  echo "Already on most recently committed branch: $latest"
fi
