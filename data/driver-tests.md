# Driver Tests

Stub tests for both drivers in the PR. Each test puts a fake `copilot` first on `PATH`, runs the driver unchanged, and uses no Copilot credits.

- [Bash: loop-copilot.sh](#bash-loop-copilotsh)
- [CMD: loop-copilot.bat](#cmd-loop-copilotbat)

## Bash: loop-copilot.sh

[tests/test-loop-copilot.sh](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/tests/test-loop-copilot.sh) runs the committed `loop-copilot.sh` against a stub `copilot` placed first on `PATH`. The stub records each call's arguments and prints scripted responses, and a stub `tee` can fail its file write the way a full disk would. The test checks the driver's exit codes, the copilot arguments it passes, its log file, temp file cleanup, and what it does when the response file or the log cannot be written. It uses no Copilot credits.

The driver under test, `.github/skills/handle-big-tasks/scripts/loop-copilot.sh`, is byte-for-byte the file in the PR (same git blob).

### Command

Run from the repository root:

```bash
tests/test-loop-copilot.sh .github/skills/handle-big-tasks/scripts/loop-copilot.sh
```

### Results

| Driver | bash 5.2.26 (Git Bash) | bash 5.1.16 (Ubuntu 22.04.5, WSL) |
| --- | --- | --- |
| PR driver now ([d3c7fc2](https://github.com/jhauga/awesome-copilot/blob/d3c7fc2701d22e799418ff5c6f8bdccaedcaf019/skills/handle-big-tasks/scripts/loop-copilot.sh)) | 37 of 37 | 37 of 37 |
| PR driver before the write-failure fixes ([3a84074](https://github.com/jhauga/awesome-copilot/blob/3a840744e91b0c5488343022540d5a2563a29313/skills/handle-big-tasks/scripts/loop-copilot.sh)) | 33 of 37 | 33 of 37 |
| PR driver before the first review fixes ([7ec8a2c](https://github.com/github/awesome-copilot/blob/7ec8a2ca07a5258c1a88c8fd5f092512324b512b/skills/handle-big-tasks/scripts/loop-copilot.sh)) | 33 of 37 | 28 of 37 |
| Prototype driver from the first test ([loop-copilot.sh](loop-copilot.sh.md)) | 8 of 37 | 8 of 37 |

**Write failures.** Before d3c7fc2, the driver kept only copilot's status from `copilot | tee`, so a failed write to the response file went unnoticed, and the last line of a cut-short file decided what happened next. In the test, the file keeps `CONTINUE? Y or N` from a response that goes on to report a blocker, and the earlier drivers answer `Y`. The driver now stops when `tee` fails. A failed write to the log let the driver exit 0, and it now exits 1 with an error. A failed log write does not stop the bash loop early, because `tee` keeps passing output through, but the exit code reports it.

The fix was also checked against real `No space left on device` errors in bash 5.1, with `/dev/full` in place of the log and then of the response file. The driver exited 1 both times, and in the response case it stopped after one run and removed its temp file.

**bash 5.1 exit codes.** 7ec8a2c set its temp file's `EXIT` trap inside `run_loop`, which runs on the left of a pipe. Bash 5.1 lets that trap's own status replace the subshell's, so every early stop exited 0, the code for `TASK COMPLETE!`. The fix moved the temp file and trap into `main`.

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

Response file write fails after the marker line
  pass  exits 1
  pass  stops after 1 call
  pass  reports the failed save
  pass  removes its temp file

Log write fails on a run that completes
  pass  exits 1
  pass  reports the log failure

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

37 of 37 checks passed.
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
- the usage message naming the script itself
- a log that turns read-only during the run
- a log that opens but rejects every write, through a byte-range lock that stands in for a full disk
- a temporary file that cannot be written

It runs in Windows PowerShell 5.1 and PowerShell 7.

awesome-copilot stores `loop-copilot.bat` with LF line endings, and its `.gitattributes` (`*.bat text eol=crlf`) converts the file to CRLF on checkout. Both forms have the same content (`git hash-object` gives the same blob), so the test runs on each:

- **CRLF**: `git clone` or checkout, GitHub ZIP download
- **LF**: the skill page's per-file download, `raw.githubusercontent.com`, or any copy of the git blob, such as this repo's `.github/skills` copy

### Command

Run from the repository root:

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File tests\test-loop-copilot.ps1 <path-to-loop-copilot.bat>
```

### Results

| Driver | Line endings | PowerShell 7.6 | Windows PowerShell 5.1 |
| --- | --- | --- | --- |
| PR driver now ([d3c7fc2](https://github.com/jhauga/awesome-copilot/blob/d3c7fc2701d22e799418ff5c6f8bdccaedcaf019/skills/handle-big-tasks/scripts/loop-copilot.bat)) | LF | 58 of 58 | 58 of 58 |
| PR driver now | CRLF | 58 of 58 | 58 of 58 |
| PR driver with the LF fix ([3a84074](https://github.com/jhauga/awesome-copilot/blob/3a840744e91b0c5488343022540d5a2563a29313/skills/handle-big-tasks/scripts/loop-copilot.bat)) | LF | 51 of 58 | 51 of 58 |
| PR driver with the LF fix | CRLF | 51 of 58 | 51 of 58 |
| PR driver before the LF fix ([bd80185](https://github.com/jhauga/awesome-copilot/blob/bd80185580215c2d4e8fe1feda0e103fadb9682e/skills/handle-big-tasks/scripts/loop-copilot.bat)) | LF | 43 of 58 | 43 of 58 |
| PR driver before the LF fix | CRLF | 51 of 58 | 51 of 58 |

The current driver in LF form also passes 58 of 58 when run from a folder named `R&D tools (v2)`.

### Write Failures

Before d3c7fc2, the log appends were unchecked. When the log turned read-only during a run that ended with `TASK COMPLETE!`, the driver still reported the task complete and exited 0. When the log opened but every write failed, it ran copilot anyway and exited 0. ECHO reports success even when its write fails, so the driver's `:say` now checks that the log grew, and the response is appended with TYPE, which does report a failed write. The driver stops with exit 1 and an error as soon as a log write fails.

CMD also leaves ERRORLEVEL at 0 when a redirect cannot open its file, and it leaves the old file in place. A run whose output could not be written would then be judged by the previous run's output. The driver now deletes the previous run's files first, checks that the new ones were written, and stops otherwise.

### LF Line Endings and the Fix

CMD finds `goto` and `call` labels by scanning the batch file, and the scan misfires when the file has LF-only line endings. Before the LF fix, a run that ended with `TASK COMPLETE!` still worked, but the paths that stop the loop early did not:

| Scenario | CRLF | LF, before the LF fix |
| --- | --- | --- |
| `copilot` exits 7 on run 2 | Exit 1 | Prints the right message, then exits 0, the code for `TASK COMPLETE!` |
| Safety cap reached | Exit 1 | Prints the right message, then exits 0 |
| Blocker on the last line | Exit 1, prints the last line and the resume command | `The system cannot find the batch label specified - stop_no_marker`, no resume command, and 3 temp files left in `%TEMP%` |
| `copilot` not on `PATH` | Exit 2 with usage | `The system cannot find the batch label specified - start_error`, exit 1 |

A script that checks for exit code 0 would have treated the first two LF cases as a finished task.

The driver now checks itself before it uses any label. It writes a CRLF copy of itself to `%TEMP%` with `type | find /v ""`, and when the copy is exactly one byte per line larger than the original, it runs the copy, passes on its exit code, and deletes it. A copy of any other size, such as one cut short by a full disk, is not run.

### Output

Current driver, LF form, PowerShell 7.6:

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

Log turns read-only on run 2, which ends with TASK COMPLETE!
  pass  exits 1
  pass  stops after 2 calls
  pass  does not report the task complete
  pass  reports the log failure
  pass  removes its temp files

Log opens but every write fails
  pass  exits 1
  pass  stops before running copilot
  pass  reports the log failure

Temporary file cannot be written
  pass  exits 1
  pass  stops after 1 call
  pass  reports the temporary file failure

Safety cap reached
  pass  exits 1
  pass  stops after 2 calls
  pass  reports the cap
  pass  removes its temp files

Plan path with spaces, parentheses, and an ampersand
  pass  exits 0
  pass  makes 1 copilot call
  pass  prompt names the full plan path
  pass  writes the log next to the plan

Console code page
  pass  restores the code page it changed

Start errors
  pass  --help exits 0
  pass  --help names the script itself
  pass  missing plan file exits 2
  pass  plan file not found exits 2
  pass  folder as plan file exits 2
  pass  third argument exits 2
  pass  non-integer interval exits 2
  pass  LOOP_MAX_ITERATIONS=0 exits 2
  pass  copilot not on PATH exits 2
  pass  copilot never called

58 of 58 checks passed.
> echo %ERRORLEVEL%
0
```

PR driver before the LF fix (bd80185), LF form, PowerShell 7.6, without the passing checks:

```text
> powershell -NoProfile -ExecutionPolicy Bypass -File tests\test-loop-copilot.ps1 loop-copilot.bat
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
Log turns read-only on run 2, which ends with TASK COMPLETE!
  FAIL  exits 1
  FAIL  does not report the task complete
  FAIL  reports the log failure
Log opens but every write fails
  FAIL  exits 1
  FAIL  stops before running copilot
  FAIL  reports the log failure
Temporary file cannot be written
  FAIL  reports the temporary file failure
Safety cap reached
  FAIL  exits 1
Plan path with spaces, parentheses, and an ampersand
Console code page
Start errors
  FAIL  copilot not on PATH exits 2
43 of 58 checks passed.
> echo %ERRORLEVEL%
1
```
