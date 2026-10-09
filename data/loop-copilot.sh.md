# Loop Copilot Script

> [!NOTE]
> Prototype driver from the first test run. The PR ships a different `loop-copilot.sh`. See [Driver Tests](driver-tests.md) and [Live Run Log](live-run-log.md).

For the test I dropped this script adjacent to the `SKILL.md` file.

```bash
#!/usr/bin/env bash
# loop-copilot.sh - drive Copilot CLI through a multi-phase task with no manual input.
#
# Watches each phase's output for the handle-big-tasks markers and auto-answers
# the continue prompt, so one invocation carries the whole task to completion.
#
# Usage:   ./loop-copilot.sh <plan-file> [interval-seconds] [max-phases]
# Example: ./loop-copilot.sh plan.md 5 20
#
# Exit codes:
#   0  TASK COMPLETE! seen - finished cleanly
#   1  usage error, missing plan file, or copilot not on PATH
#   2  unexpected output - neither marker found, loop stopped
#   3  max-phase cap reached before TASK COMPLETE!

set -uo pipefail

PLAN="${1:-}"
INTERVAL="${2:-5}"
MAX="${3:-20}"

DONE_MARK='TASK COMPLETE!'
CONT_MARK='CONTINUE? Y or N'

if [ -z "$PLAN" ]; then
  printf 'usage: %s <plan-file> [interval-seconds] [max-phases]\n' "$(basename "$0")" >&2
  exit 1
fi
if [ ! -f "$PLAN" ]; then
  printf 'plan file not found: %s\n' "$PLAN" >&2
  exit 1
fi
if ! command -v copilot >/dev/null 2>&1; then
  printf 'copilot not found in PATH\n' >&2
  exit 1
fi

LOG="${PLAN}.loop.log"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

stamp()  { date '+%Y-%m-%d %H:%M:%S'; }
banner() { printf '\n===== %s | %s =====\n' "$1" "$(stamp)" | tee -a "$LOG"; }

: > "$LOG"

banner "phase 1 starting"
copilot --allow-all -p "Read the plan file at ${PLAN} and begin executing it from the first incomplete phase." 2>&1 \
  | tee "$TMP" | tee -a "$LOG"

phase=1
while :; do
  if grep -qF "$DONE_MARK" "$TMP"; then
    banner "TASK COMPLETE after ${phase} phase(s)"
    printf '  log: %s\n' "$LOG"
    exit 0
  fi

  if ! grep -qF "$CONT_MARK" "$TMP"; then
    banner "unexpected output at phase ${phase} - neither marker found, stopping"
    printf '  the skill did not emit a marker. check %s\n' "$LOG"
    exit 2
  fi

  if [ "$phase" -ge "$MAX" ]; then
    banner "max-phase cap (${MAX}) reached without TASK COMPLETE"
    exit 3
  fi

  phase=$((phase + 1))
  sleep "$INTERVAL"
  banner "phase ${phase} starting (auto-Y)"
  copilot --continue --allow-all -p "Y" 2>&1 | tee "$TMP" | tee -a "$LOG"
done
```
