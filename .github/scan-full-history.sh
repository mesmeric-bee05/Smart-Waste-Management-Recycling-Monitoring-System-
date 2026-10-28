#!/usr/bin/env bash
set -euo pipefail

gitleaks_bin="${GITLEAKS_BIN:-gitleaks}"
if ! command -v "$gitleaks_bin" >/dev/null 2>&1; then
  printf 'Gitleaks executable not found: %s\n' "$gitleaks_bin" >&2
  exit 127
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'Full-history secret scan must run inside a Git worktree.\n' >&2
  exit 2
fi

commit_count="$(git rev-list --all --count)"
if [[ ! "$commit_count" =~ ^[1-9][0-9]*$ ]]; then
  printf 'Refusing to report a clean scan: no reachable Git commits were found.\n' >&2
  exit 1
fi

printf 'Scanning all %s reachable Git commits, including roots and merge diffs.\n' "$commit_count"
git log --all --full-history --root -m -p --no-ext-diff --no-color |
  "$gitleaks_bin" stdin --redact --no-color --verbose
