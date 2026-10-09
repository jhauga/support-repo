# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/skill-handle-big-tasks/index.html)
-->

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

Full [test results](https://github.com/jhauga/support-repo/tree/BRANCH_NAME) (*ctrl + click*) at support repo.

<details>

<summary>Show Details</summary>

| Field | Value |
|---|---|
| **Agent** | GitHub Copilot CLI — non-interactive (`-p`, `--continue`, `--allow-all`), driven by `loop-copilot.sh` |
| **Model** | Claude Opus 5.5 |
| **Reasoning Effort** | High |
| **Number of Prompts** | 1 manual — all phase continues auto-answered by the driver |
| **Post Edits** | 0 |
| **Context Consumed** | 1% ? 4% (3% across the full run) |
| **Date** | 2026-10-08 |

### Test Task

Multi-phase audit of a Windows batch-file library: `inventory → classify → header standardization → index → verify`. Each phase writes a file the next phase reads, so a dropped marker halts the run visibly rather than degrading quietly. The task prompt described the work without naming the skill.

</details>

### Evaluation Context

- **Session Target**: Copilot Terminal
- **Agent**: Copilot
- **Model**: Opus 5.5
  - **Thinking Effort**: high
- **Number of Prompts**: 1
- **Post Edits**: Changed data in `docs`; file names and stuff for clarity

### Copilot Pro+ Plan Credit Usage

- **Start Credits**: 1%
- **End Credits**: 4%

### Prompt

```bash
/handle-big-tasks/loop-copilot.sh prompt.md 5 20
```

### Results

- **Pass**: The skill triggered on the task description alone. Both markers were emitted verbatim and in the correct positions - `CONTINUE? Y or N` closing each incomplete phase, `TASK COMPLETE!` closing the run. The marker contract held across every phase without re-priming, and the run finished unattended from a single prompt.

### Notes

- Marker placement is the contract. Both strings must be the final line of the response, unquoted and unwrapped, or a driver's string match will miss them.
- The skill's own context cost is negligible. The 3% consumed is almost entirely the task's file reads, not the skill definition.
- Driver scripts ship with the skill: `loop-copilot.sh` (Copilot CLI) and `loop-claude.sh` / `loop-claude.bat` (Claude Code). They are optional — the skill works unassisted with manual `Y` input.

The skills' script is new, but since I've been using and improving upon this tool, I have not had an issue or a need to clarify, prompting like `No that didn't work, who is on first, that is on second, this needs to be there, etc..." in response to the model's edits.
<!-- formatter_2 -->