# Driver Tests

[tests/test-loop-copilot.sh](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/tests/test-loop-copilot.sh) runs the committed `loop-copilot.sh` against a stub `copilot` placed first on `PATH`. The stub records each call's arguments and prints scripted responses. The test checks the driver's exit codes, the copilot arguments it passes, its log file, and temp file cleanup. It uses no Copilot credits.

The driver under test, `.github/skills/handle-big-tasks/scripts/loop-copilot.sh`, is byte-for-byte the file in the PR (same git blob).

## Command

Run from the repository root:

```bash
tests/test-loop-copilot.sh .github/skills/handle-big-tasks/scripts/loop-copilot.sh
```

## Results

| Driver | bash 5.2.26 (Git Bash) | bash 5.1.16 (Ubuntu 22.04.5, WSL) |
| --- | --- | --- |
| PR driver, after the review fixes | 31 of 31 | 31 of 31 |
| PR driver before the fixes ([7ec8a2c](https://github.com/github/awesome-copilot/blob/7ec8a2ca07a5258c1a88c8fd5f092512324b512b/skills/handle-big-tasks/scripts/loop-copilot.sh)) | 31 of 31 | 27 of 31 |
| Prototype driver from the first test ([loop-copilot.sh](loop-copilot.sh.md)) | 7 of 31 | not run |

The four checks the earlier PR driver fails on bash 5.1 are the `exits 1` checks. It set its temp file's `EXIT` trap inside `run_loop`, which runs on the left of a pipe. Bash 5.1 lets that trap's own status replace the subshell's, so every early stop exited 0, the code for `TASK COMPLETE!`. The fix moves the temp file and trap into `main`.

The prototype driver fails because it:

- uses `--continue`, which resumes the most recent Copilot session anywhere, instead of a pinned `--session-id`
- matches a marker anywhere in the output, so a response that quotes the marker and then reports a blocker still gets `Y`
- accepts a marker wrapped in markdown, such as `**CONTINUE? Y or N**`
- ignores a failed `copilot` run
- takes a third `max-phases` argument and an interval in seconds

## Output

Both bash versions print the same checks.

```text
$ bash --version | head -1
GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)
$ tests/test-loop-copilot.sh .github/skills/handle-big-tasks/scripts/loop-copilot.sh

Three phases, markers on the last line
  pass  exits 0
  pass  makes 3 copilot calls
  pass  run 1 sets a UUID with --session-id
  pass  run 1 prompt names the plan file and skill
  pass  run 1 passes -s --no-color
  pass  runs 2-3 answer Y in the same session
  pass  no run uses --continue or --allow-all
  pass  LOOP_COPILOT_ARGS reach every run
  pass  log has a separator for each run
  pass  log ends with the completion line
  pass  removes its temp file

Marker quoted mid-response, blocker on the last line
  pass  exits 1
  pass  stops after 1 call
  pass  reports the last line
  pass  prints the resume command
  pass  removes its temp file

Marker wrapped in markdown
  pass  exits 1
  pass  stops after 1 call

copilot fails on run 2
  pass  exits 1
  pass  stops after 2 calls
  pass  reports the copilot status

Safety cap reached
  pass  exits 1
  pass  stops after 2 calls
  pass  reports the cap

Start errors
  pass  missing plan file exits 2
  pass  plan file not found exits 2
  pass  folder as plan file exits 2
  pass  third argument exits 2
  pass  non-integer interval exits 2
  pass  LOOP_MAX_ITERATIONS=0 exits 2
  pass  copilot never called

31 of 31 checks passed.
$ echo $?
0
```
