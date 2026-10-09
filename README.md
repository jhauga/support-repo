# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request 4744](https://github.com/github/awesome-copilot/pull/4744)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!--
IMPORTANT - mind description, and change first line for 1 to sentence description.
## Description
-->
<!-- formatter_1 -->
Skill to automate verbose tasks that should be completed in phases and not just from a response to 1 prompt.

Emits `CONTINUE? Y or N` as the final line of each completed phase and `TASK COMPLETE!` as the final line when the whole task is done, so a driver script can carry a multi-phase job through to completion with no manual input after the initial prompt.

## Test Conditions

> [!NOTE]
> Apart from test conditions, I have been using this tool several weeks now; improving on it bit by bit, and will say it produces better results than just completing one long complex prompt in one response.

Full [test results](https://github.com/jhauga/support-repo/tree/skill-handle-big-tasks) (*ctrl + click*) at support repo.

Both drivers in this PR, `loop-copilot.sh` and `loop-copilot.bat`, were tested two ways, and both can be rerun from the support repo:

1. **Live runs**: real Copilot CLI runs of each driver through the same three-phase plan, [bash](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/data/live-run-log.md) on Ubuntu (WSL) and [CMD](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/data/live-run-bat-log.md) on Windows.
2. **Stub tests** ([driver-tests](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/data/driver-tests.md)): `tests/test-loop-copilot.sh` and `tests/test-loop-copilot.ps1` run each driver against a fake `copilot` and check its exit codes, the arguments it passes, its log, and temp file cleanup.

The support repo's copy of the skill is byte-for-byte the PR's (same git blobs).

<details>

<summary>Show Details</summary>

| Field | Value |
|---|---|
| **Agent** | GitHub Copilot CLI, non-interactive (`-p`, `--session-id` then `--resume`, `-s`), driven by the PR's `loop-copilot.sh` (CLI 1.0.94) and `loop-copilot.bat` (CLI 1.0.80) |
| **Model** | CLI defaults, Claude Sonnet 5.5 for bash and Claude Sonnet 5 for CMD |
| **Shell** | bash 5.1.16 on Ubuntu 22.04.5 (WSL), and CMD on Windows 11 |
| **Number of Prompts** | 1, the driver's first prompt; each later run is the driver answering `Y` |
| **Post Edits** | 0 |
| **AI Credits** | 13.06 for the completing bash run and 37.86 for the CMD run |
| **Date** | 2026-10-08 |

### Test Task

Three-phase pass over three small batch files in `data/live-run/fixture`: `inventory → commented copies → summary and check`. Each phase writes files the next phase reads, and phase 3 checks that each commented copy repeats its original exactly.

</details>

### Evaluation Context

- **Session Target**: Copilot Terminal
- **Agent**: Copilot CLI
- **Model**: CLI defaults, Sonnet 5.5 for bash and Sonnet 5 for CMD
- **Number of Prompts**: 1
- **Post Edits**: 0

### Copilot Pro+ Plan Credit Usage

- **AI Credits**: 13.06 for the completing bash run and 37.86 for the CMD run, from the sessions' usage records

### Prompt

Run from the support repo root. In bash:

```bash
LOOP_COPILOT_ARGS="--allow-tool=write --allow-tool=shell(mkdir:*)" \
  .github/skills/handle-big-tasks/scripts/loop-copilot.sh data/live-run-plan.md 0
```

In CMD, with the driver from an awesome-copilot checkout:

```bat
set "LOOP_COPILOT_ARGS=--allow-tool=write --allow-tool=shell(mkdir:*)"
<awesome-copilot checkout>\skills\handle-big-tasks\scripts\loop-copilot.bat data\live-run-bat-plan.md 0
```

### Results

- **Pass**: The skill loaded from the driver's first prompt. Phases 1 and 2 ended with `CONTINUE? Y or N` as the last line, the driver answered `Y` in the same session, and phase 3 ended with `TASK COMPLETE!`. The driver exited 0 after three runs with no manual input.
- **Pass**: Two earlier loops with `--allow-tool=write` alone hit a real blocker: Copilot's file-create tool cannot make folders, and `mkdir` was denied. Each time the agent explained the blocker and ended without a marker, and the driver stopped and printed the `copilot --resume` command instead of answering `Y`. SKILL.md now notes that new folders need `--allow-tool=shell(mkdir:*)` or must exist before the loop starts.
- **Pass**: Stub tests, 31 of 31 checks on bash 5.2 (Git Bash) and bash 5.1 (Ubuntu). They caught a bug, fixed in this PR, where the driver exited 0 after every early stop on bash 5.1.
- **Pass**: The CMD driver, run in Windows CMD with Copilot CLI 1.0.80 (default model `claude-sonnet-5`), finished the same plan in three runs with `CONTINUE? Y or N`, `CONTINUE? Y or N`, `TASK COMPLETE!`, and exit 0. This run used the CRLF form that a git checkout gives, before the LF fix below.
- **Fixed**: The repo stores `loop-copilot.bat` with LF line endings, which is what the skill page's per-file download and `raw.githubusercontent.com` serve. With LF endings, CMD's label lookups misfired, and the driver exited 0 when copilot failed or the safety cap was reached. The driver now runs a CRLF copy of itself when it has LF endings. Stub tests pass 47 of 47 in both LF and CRLF form, in PowerShell 7.6 and Windows PowerShell 5.1. See [driver-tests](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/data/driver-tests.md#cmd-loop-copilotbat).

An earlier test used a prototype driver on a larger batch-file audit. It is kept in the support repo as [loop-copilot.sh](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/data/loop-copilot.sh.md) and [loop-log](https://github.com/jhauga/support-repo/blob/skill-handle-big-tasks/data/loop-log.md), but it is not the driver in this PR.

### Notes

- Marker placement is the contract. Both strings must be the final line of the response, unquoted and unwrapped, or the driver stops instead of answering `Y`.
- The skill's own context cost is negligible.
- Driver scripts ship with the skill: `loop-copilot.sh` (bash) and `loop-copilot.bat` (Windows CMD). They are optional - the skill works unassisted with manual `Y` input.

The skills' script is new, but since I've been using and improving upon this tool, I have not had an issue or a need to clarify, prompting like `No that didn't work, who is on first, that is on second, this needs to be there, etc..." in response to the model's edits.
<!-- formatter_2 -->