# Driver Tests

Stub tests for both drivers in the PR. Each test puts a fake `copilot` first on `PATH`, runs the driver unchanged, and uses no Copilot credits.

- [Bash: loop-copilot.sh](#bash-loop-copilotsh)
- [CMD: loop-copilot.bat](#cmd-loop-copilotbat)

## Bash: loop-copilot.sh

[tests/test-loop-copilot.sh](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/tests/test-loop-copilot.sh) runs the committed `loop-copilot.sh` against a stub `copilot` placed first on `PATH`. The stub records each call's arguments and prints scripted responses. The test checks the driver's exit codes, the copilot arguments it passes, its log file, and temp file cleanup. It uses no Copilot credits.

The driver under test, `.github/skills/handle-big-tasks/scripts/loop-copilot.sh`, is byte-for-byte the file in the PR (same git blob).

### Command

Run from the repository root:

```bash
tests/test-loop-copilot.sh .github/skills/handle-big-tasks/scripts/loop-copilot.sh
```

### Results

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

### Output

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

## CMD: loop-copilot.bat

[tests/test-loop-copilot.ps1](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/tests/test-loop-copilot.ps1) runs `loop-copilot.bat` through `cmd.exe` against a stub `copilot.cmd`. It checks the same things as the bash test, plus cases that are risky in CMD:

- `LOOP_COPILOT_ARGS` with parentheses, such as `--allow-tool=shell(git:*)`
- a blocker line full of CMD special characters: `% " & < > ^ ( ) !`
- UTF-8 response text
- a plan path with spaces, parentheses, and `&`
- a trailing whitespace-only line after the marker
- restoring the console code page the driver switches to UTF-8

It runs in Windows PowerShell 5.1 and PowerShell 7.

awesome-copilot stores `loop-copilot.bat` with LF line endings, and its `.gitattributes` (`*.bat text eol=crlf`) converts the file to CRLF on checkout. Both forms have the same content (`git hash-object` gives the PR's blob, `e11c468`), so the test ran on each.

### Command

Run from the repository root:

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File tests\test-loop-copilot.ps1 <path-to-loop-copilot.bat>
```

### Results

| Copy of `loop-copilot.bat` | Where it comes from | PowerShell 7.6 | Windows PowerShell 5.1 |
| --- | --- | --- | --- |
| CRLF | `git clone` or checkout, GitHub ZIP download | 45 of 45 | 45 of 45 |
| LF | the skill page's per-file download, `raw.githubusercontent.com`, or any copy of the git blob | 37 of 45 | 37 of 45 |

This repo's `.github/skills/handle-big-tasks/scripts/loop-copilot.bat` is the LF form, because it was written from the git blob, so the [CMD live run](live-run-bat-log.md) used the CRLF checkout instead.

### LF Line Endings Break the Stop Paths

CMD finds `goto` and `call` labels by scanning the batch file, and the scan misfires when the file has LF-only line endings. The run that ends with `TASK COMPLETE!` still works, but the paths that stop the loop early do not:

| Scenario | CRLF | LF |
| --- | --- | --- |
| `copilot` exits 7 on run 2 | Exit 1 | Prints the right message, then exits 0, the code for `TASK COMPLETE!` |
| Safety cap reached | Exit 1 | Prints the right message, then exits 0 |
| Blocker on the last line | Exit 1, prints the last line and the resume command | `The system cannot find the batch label specified - stop_no_marker`, no resume command, and 3 temp files left in `%TEMP%` |
| `copilot` not on `PATH` | Exit 2 with usage | `The system cannot find the batch label specified - start_error`, exit 1 |

A script that checks for exit code 0 would treat the first two LF cases as a finished task.

### Output

CRLF copy, PowerShell 7.6:

```text
> powershell -NoProfile -ExecutionPolicy Bypass -File tests\test-loop-copilot.ps1 loop-copilot.bat

Three phases, markers on the last line
  pass  exits 0
  pass  makes 3 copilot calls
  pass  run 1 sets a UUID with --session-id
  pass  run 1 prompt names the plan file and skill
  pass  run 1 passes -s --no-color
  pass  runs 2-3 answer Y in the same session
  pass  no run uses --continue or --allow-all
  pass  LOOP_COPILOT_ARGS, parentheses included, reach every run
  pass  prints UTF-8 responses intact
  pass  log has a separator for each run
  pass  log ends with the completion line
  pass  removes its temp files

Whitespace-only line after the marker
  pass  exits 0
  pass  makes 2 copilot calls

Marker quoted mid-response, blocker on the last line
  pass  exits 1
  pass  stops after 1 call
  pass  reports the last line
  pass  prints the resume command
  pass  removes its temp files

Blocker line with CMD special characters
  pass  exits 1
  pass  stops after 1 call
  pass  reports the last line unchanged
  pass  logs the last line unchanged

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

Plan path with spaces, parentheses, and an ampersand
  pass  exits 0
  pass  makes 1 copilot call
  pass  prompt names the full plan path
  pass  writes the log next to the plan

Console code page
  pass  restores the code page it changed

Start errors
  pass  --help exits 0
  pass  missing plan file exits 2
  pass  plan file not found exits 2
  pass  folder as plan file exits 2
  pass  third argument exits 2
  pass  non-integer interval exits 2
  pass  LOOP_MAX_ITERATIONS=0 exits 2
  pass  copilot not on PATH exits 2
  pass  copilot never called

45 of 45 checks passed.
> echo %ERRORLEVEL%
0
```

LF copy, PowerShell 7.6, failing checks only:

```text
> powershell -NoProfile -ExecutionPolicy Bypass -File tests\test-loop-copilot.ps1 .github\skills\handle-big-tasks\scripts\loop-copilot.bat
Three phases, markers on the last line
Whitespace-only line after the marker
Marker quoted mid-response, blocker on the last line
  FAIL  reports the last line
  FAIL  prints the resume command
  FAIL  removes its temp files
Blocker line with CMD special characters
  FAIL  reports the last line unchanged
  FAIL  logs the last line unchanged
Marker wrapped in markdown
copilot fails on run 2
  FAIL  exits 1
Safety cap reached
  FAIL  exits 1
Plan path with spaces, parentheses, and an ampersand
Console code page
Start errors
  FAIL  copilot not on PATH exits 2
37 of 45 checks passed.
> echo %ERRORLEVEL%
1
```
