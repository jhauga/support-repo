#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

assert_match() {
  local value="$1"
  local regex="$2"
  local label="$3"
  if [[ ! "$value" =~ $regex ]]; then
    fail "$label (got: '$value')"
  fi
  pass "$label"
}

assert_eq() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    fail "$label (expected '$expected', got '$actual')"
  fi
  pass "$label"
}

run_case() {
  local cmd="$1"
  local label="$2"
  local out
  out="$(eval "$cmd")"
  echo "$out"
}

echo "==> Preparing executables"
chmod +x getDate.sh getDate.py getDate.pl test_getDate_tools.sh

echo "==> Building C tool"
gcc -O2 -Wall -Wextra -std=c11 getDate.c -o getDate_c

# Use isolated state for test repeatability
export XDG_STATE_HOME="$ROOT_DIR/.tmp/state"
rm -rf "$XDG_STATE_HOME"
mkdir -p "$XDG_STATE_HOME"

declare -A tools
tools[sh]="./getDate.sh"
tools[py]="./getDate.py"
tools[pl]="./getDate.pl"
tools[c]="./getDate_c"

for key in sh py pl c; do
  tool="${tools[$key]}"
  echo "==> Testing $tool"

  out="$(run_case "$tool" "default")"
  assert_match "$out" '^[0-9]{2}-[0-9]{2}-[0-9]{2}$' "$key default date"

  out="$(run_case "$tool --full" "full")"
  assert_match "$out" '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' "$key full date"

  out="$(run_case "$tool --slash" "slash")"
  assert_match "$out" '^[0-9]{2}/[0-9]{2}/[0-9]{2}$' "$key slash date"

  out="$(run_case "$tool /Y -t" "year two digit")"
  assert_match "$out" '^[0-9]{2}$' "$key two digit year"

  out="$(run_case "$tool /T" "terminal format")"
  assert_match "$out" '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' "$key terminal format"

  out="$(run_case "$tool /Q --season" "quarter season")"
  assert_match "$out" '^(Winter|Spring|Summer|Fall)$' "$key quarter season"

  out="$(run_case "$tool --leap" "leap")"
  assert_match "$out" '^[01]$' "$key leap value"

  out="$(run_case "$tool /D/DM" "day month digits")"
  assert_match "$out" '^[0-9]{2} [0-9]{2}$' "$key day month digits"

  out="$(run_case "$tool /LM" "last month")"
  assert_match "$out" '^[A-Za-z]+$' "$key last month text"

  out="$(run_case "$tool /DM 2>&1 || true" "invalid dm only")"
  assert_match "$out" 'Error: /DM only works with /D' "$key invalid dm check"

done

STATE_FILE="$XDG_STATE_HOME/getDate/vars.env"
if [[ ! -f "$STATE_FILE" ]]; then
  fail "state file not created"
fi
pass "state file created"

grep -q '_checkLeapYear=' "$STATE_FILE" || fail "state contains leap variable"
pass "state contains leap variable"

echo "All tests passed."
