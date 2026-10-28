#!/usr/bin/env bash
set -euo pipefail

gitleaks_bin="${GITLEAKS_BIN:-gitleaks}"
if ! command -v "$gitleaks_bin" >/dev/null 2>&1; then
  printf 'Gitleaks executable not found: %s\n' "$gitleaks_bin" >&2
  exit 127
fi

scratch_root="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
test_dir="$(mktemp -d "${scratch_root%/}/wasteops-gitleaks-root.XXXXXX")"
trap 'rm -rf -- "$test_dir"' EXIT
repo="$test_dir/repo"
mkdir -p "$repo"
git -C "$repo" init --quiet
git -C "$repo" config user.name 'WasteOps Gitleaks Test'
git -C "$repo" config user.email 'ci@example.test'

# Construct a disposable fake token at runtime; never commit it to this repository.
token_prefix='ghp'
token_separator='_'
fake_token="${token_prefix}${token_separator}$(openssl rand -hex 18)"
printf 'synthetic_fixture_token=%s\n' "$fake_token" > "$repo/canary.txt"
git -C "$repo" add canary.txt
git -C "$repo" commit --quiet -m 'temporary root-history scanner canary'

if [[ "$(git -C "$repo" rev-list --all --count)" != '1' ]]; then
  printf 'Root-history scanner canary did not create exactly one commit.\n' >&2
  exit 1
fi

patch_file="$test_dir/root-history.patch"
scan_log="$test_dir/gitleaks.log"
git -C "$repo" log --all --full-history --root -m -p --no-ext-diff --no-color > "$patch_file"
if [[ ! -s "$patch_file" ]]; then
  printf 'Root-history canary produced an empty Git patch stream.\n' >&2
  exit 1
fi

if "$gitleaks_bin" stdin --redact --no-color --verbose < "$patch_file" > "$scan_log" 2>&1; then
  printf 'Gitleaks did not detect the generated root-commit canary.\n' >&2
  exit 1
fi
if ! grep --extended-regexp --ignore-case --quiet 'RuleID:[[:space:]]*github-pat|leaks found:[[:space:]]*1' "$scan_log"; then
  printf 'Gitleaks exited nonzero without reporting the expected root-canary rule.\n' >&2
  exit 1
fi

printf 'Gitleaks root-commit detection self-test passed.\n'
