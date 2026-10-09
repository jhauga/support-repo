#!/usr/bin/env bash
#
# test-loop-copilot.sh - run loop-copilot.sh against a stub copilot CLI.
#
# Puts a fake `copilot` first on PATH that records its arguments and prints
# scripted responses, then runs the driver unchanged through each scenario
# and checks its exit code, the copilot calls it made, and its log file.
# No Copilot credits are used.
#
# Usage:
#   ./test-loop-copilot.sh <path-to-loop-copilot.sh>
#
# Exits 0 when every check passes, 1 when any check fails.

set -uo pipefail
# Scenarios set these when they need them, so the driver's defaults apply
# otherwise.
unset LOOP_MAX_ITERATIONS LOOP_COPILOT_ARGS

[[ $# -eq 1 && -f $1 ]] || {
  printf 'Usage: %s <path-to-loop-copilot.sh>\n' "${0##*/}" >&2
  exit 2
}

_driver=$(cd "$(dirname "$1")" && pwd)/${1##*/}
_work=$(mktemp -d)
trap 'rm -rf -- "$_work"' EXIT
_fails=0
_checks=0

mkdir -p "$_work/bin"
cat > "$_work/bin/copilot" <<'STUB'
#!/usr/bin/env bash
# Stub copilot: records one line of arguments per call, prints
# response-<n>.txt (or response-default.txt), exits with status-<n> (or 0).
_n=$(( $(cat "$STUB_DIR/count" 2> /dev/null || echo 0) + 1 ))
echo "$_n" > "$STUB_DIR/count"
printf '%s\x1f' "$@" > "$STUB_DIR/args-$_n"
_f=$STUB_DIR/response-$_n.txt
[[ -f $_f ]] || _f=$STUB_DIR/response-default.txt
cat "$_f"
exit "$(cat "$STUB_DIR/status-$_n" 2> /dev/null || echo 0)"
STUB
chmod +x "$_work/bin/copilot"

_real_tee=$(command -v tee)
cat > "$_work/bin/tee" <<'STUB'
#!/usr/bin/env bash
# Stub tee: runs the real tee unless STUB_TEE_FAIL names this call. Then it
# passes the input through but fails the file write the way a full disk
# would: "response" keeps only the first two lines of the response file, and
# "log" writes nothing to the log.
if [[ ${STUB_TEE_FAIL:-} == response && $1 != -a ]]; then
  _data=$(cat; printf x)
  printf '%s' "${_data%x}"
  printf '%s' "${_data%x}" | head -n 2 > "$1"
  exit 1
fi
if [[ ${STUB_TEE_FAIL:-} == log && $1 == -a ]]; then
  cat
  exit 1
fi
exec "$REAL_TEE" "$@"
STUB
chmod +x "$_work/bin/tee"

# Runs check $2 in a subshell, so an exit inside it fails only that check.
check() {
  _checks=$((_checks + 1))
  if (eval "$2"); then
    printf '  pass  %s\n' "$1"
  else
    printf '  FAIL  %s\n' "$1"
    _fails=$((_fails + 1))
  fi
}

# Prints the arguments of call $1 one per line.
args_of() {
  tr '\037' '\n' < "$_stub/args-$1"
}

has_arg() {
  args_of "$1" | grep -qxF -- "$2"
}

calls() {
  cat "$_stub/count" 2> /dev/null || echo 0
}

# Sets up a fresh scenario folder with a plan file.
scenario() {
  printf '\n%s\n' "$1"
  _stub=$_work/$2
  mkdir -p "$_stub"
  _plan=$_stub/plan.md
  printf '# Plan\n\n1. One\n2. Two\n3. Three\n' > "$_plan"
}

# Runs the driver with the stub first on PATH and a private TMPDIR; extra env
# assignments go first.
run_driver() {
  mkdir -p "$_stub/tmp"
  env PATH="$_work/bin:$PATH" STUB_DIR="$_stub" TMPDIR="$_stub/tmp" \
    REAL_TEE="$_real_tee" "$@" > "$_stub/out.txt" 2>&1
  _rc=$?
}

tmp_is_empty() {
  [[ -z $(ls -A "$_stub/tmp") ]]
}

session_of_first_call() {
  args_of 1 | sed -n 's/^--session-id=//p'
}

scenario 'Three phases, markers on the last line' happy
printf 'Phase plan: one, two, three.\nPhase 1 done.\n\nCONTINUE? Y or N\n' > "$_stub/response-1.txt"
printf 'Phase 2 done.\r\nCONTINUE? Y or N  \r\n\r\n\n' > "$_stub/response-2.txt"
printf 'Phase 3 done.\nTASK COMPLETE!' > "$_stub/response-3.txt"
run_driver LOOP_COPILOT_ARGS='--allow-tool=write --model test-model' \
  "$_driver" "$_plan" 0
_sid=$(session_of_first_call)
check 'exits 0' '[[ $_rc -eq 0 ]]'
check 'makes 3 copilot calls' '[[ $(calls) -eq 3 ]]'
check 'run 1 sets a UUID with --session-id' \
  '[[ $_sid =~ ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ ]]'
check 'run 1 prompt names the plan file and skill' \
  'args_of 1 | sed -n 2p | grep -qF -- "$_plan" && args_of 1 | sed -n 2p | grep -qF handle-big-tasks'
check 'run 1 prompt names the decisions file' \
  'args_of 1 | sed -n 2p | grep -qF -- "$_plan.decisions.md"'
check 'run 1 passes -s --no-color' 'has_arg 1 -s && has_arg 1 --no-color'
check 'runs 2-3 answer Y in the same session' \
  'for i in 2 3; do args_of $i | sed -n 2p | grep -qx Y && has_arg $i "--resume=$_sid" || exit 1; done'
check 'no run uses --continue or --allow-all' \
  '! cat "$_stub"/args-* | tr "\037" "\n" | grep -qxE -- "--continue|--allow-all"'
check 'LOOP_COPILOT_ARGS reach every run' \
  'for i in 1 2 3; do has_arg $i --allow-tool=write && has_arg $i --model && has_arg $i test-model || exit 1; done'
check 'log has a separator for each run' \
  '[[ $(grep -c "| run [0-9]* of 10 -----" "$_plan.loop.log") -eq 3 ]]'
check 'log ends with the completion line' \
  'grep -qx "Task complete after 3 run(s)." "$_plan.loop.log"'
check 'removes its temp file' tmp_is_empty

scenario 'Marker quoted mid-response, blocker on the last line' midline
printf 'The plan says to end with CONTINUE? Y or N\nCONTINUE? Y or N\nBlocked: the API key is missing.\n' \
  > "$_stub/response-1.txt"
run_driver "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 1 call' '[[ $(calls) -eq 1 ]]'
check 'reports the last line' 'grep -qF "Last line: Blocked: the API key is missing." "$_stub/out.txt"'
check 'prints the resume command' \
  'grep -qF "copilot --resume=$(session_of_first_call)" "$_stub/out.txt"'
check 'removes its temp file' tmp_is_empty

scenario 'Marker wrapped in markdown' wrapped
printf 'Phase 1 done.\n**CONTINUE? Y or N**\n' > "$_stub/response-1.txt"
run_driver "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 1 call' '[[ $(calls) -eq 1 ]]'

scenario 'copilot fails on run 2' clifail
printf 'Phase 1 done.\nCONTINUE? Y or N\n' > "$_stub/response-default.txt"
echo 7 > "$_stub/status-2"
run_driver "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 2 calls' '[[ $(calls) -eq 2 ]]'
check 'reports the copilot status' 'grep -qF "copilot exited with status 7." "$_stub/out.txt"'

scenario 'Response file write fails after the marker line' teeresponse
printf 'Phase 1 done.\nCONTINUE? Y or N\nBlocked: the API key is missing.\n' > "$_stub/response-default.txt"
run_driver STUB_TEE_FAIL=response LOOP_MAX_ITERATIONS=3 "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 1 call' '[[ $(calls) -eq 1 ]]'
check 'reports the failed save' 'grep -qF "Stopping: could not save the response" "$_stub/out.txt"'
check 'removes its temp file' tmp_is_empty

scenario 'Log write fails on a run that completes' teelog
printf 'All done.\nTASK COMPLETE!\n' > "$_stub/response-default.txt"
run_driver STUB_TEE_FAIL=log "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'reports the log failure' 'grep -qF "could not write all output to the log file" "$_stub/out.txt"'

scenario 'Safety cap reached' cap
printf 'Phase done.\nCONTINUE? Y or N\n' > "$_stub/response-default.txt"
run_driver LOOP_MAX_ITERATIONS=2 "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 2 calls' '[[ $(calls) -eq 2 ]]'
check 'reports the cap' 'grep -qF "safety cap of 2 runs" "$_stub/out.txt"'

scenario 'Default safety cap' defaultcap
printf 'Phase done.\nCONTINUE? Y or N\n' > "$_stub/response-default.txt"
run_driver "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 10 calls' '[[ $(calls) -eq 10 ]]'
check 'reports the cap' 'grep -qF "safety cap of 10 runs" "$_stub/out.txt"'
check 'prints the resume command' \
  'grep -qF "copilot --resume=$(session_of_first_call)" "$_stub/out.txt"'

scenario 'Decision pending, guard line last' guard
printf 'Phase 3 waits on D1 in plan.md.decisions.md.\n\nREVISED SCRIPT - Unique user response is required\n' \
  > "$_stub/response-1.txt"
run_driver "$_driver" "$_plan" 0
check 'exits 1' '[[ $_rc -eq 1 ]]'
check 'stops after 1 call' '[[ $(calls) -eq 1 ]]'
check 'reports the guard line' \
  'grep -qF "Last line: REVISED SCRIPT - Unique user response is required" "$_stub/out.txt"'
check 'prints the resume command' \
  'grep -qF "copilot --resume=$(session_of_first_call)" "$_stub/out.txt"'

scenario 'Flags after -- keep their spaces' passthrough
printf 'Phase 1 done.\nCONTINUE? Y or N\n' > "$_stub/response-1.txt"
printf 'Phase 2 done.\nTASK COMPLETE!\n' > "$_stub/response-2.txt"
run_driver "$_driver" "$_plan" 0 -- --add-dir '/work/shared plans'
check 'exits 0' '[[ $_rc -eq 0 ]]'
check 'the flag reaches both runs as one argument each' \
  'for i in 1 2; do has_arg $i --add-dir && has_arg $i "/work/shared plans" || exit 1; done'

scenario 'Start errors' starterr
printf 'unused\n' > "$_stub/response-default.txt"
run_driver "$_driver"
check 'missing plan file exits 2' '[[ $_rc -eq 2 ]]'
run_driver "$_driver" "$_stub/no-such-plan.md"
check 'plan file not found exits 2' '[[ $_rc -eq 2 ]]'
run_driver "$_driver" "$_stub"
check 'folder as plan file exits 2' '[[ $_rc -eq 2 ]]'
run_driver "$_driver" "$_plan" 5 20
check 'third argument exits 2' '[[ $_rc -eq 2 ]]'
run_driver "$_driver" "$_plan" 1.5
check 'non-integer interval exits 2' '[[ $_rc -eq 2 ]]'
run_driver LOOP_MAX_ITERATIONS=0 "$_driver" "$_plan" 0
check 'LOOP_MAX_ITERATIONS=0 exits 2' '[[ $_rc -eq 2 ]]'
check 'copilot never called' '[[ $(calls) -eq 0 ]]'

printf '\n%d of %d checks passed.\n' "$((_checks - _fails))" "$_checks"
(( _fails == 0 ))
