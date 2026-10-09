# _dump Inventory

Every file in `reminder\_dump`, including subfolders, as of 2026-10-08. The audit files `INVENTORY.md`, `summary.md`, and `log.md` are not inventoried.

## Files

| File | Extension | Lines | Size | Modified | Purpose | Referenced by |
|---|---|---|---|---|---|---|
| `prompt.md` | `.md` (`.prompt.md`) | 544 | 35,907 bytes (about 35 KB) | 2026-10-08 | Five-part implementation plan for the `reminder` app that adds pattern syntax qualifiers to `/U -p`, automated reply checks run by a daily `reminderCheck` job, `/A --check` check file creation, and matching help file updates. | `archive\null-prompt-to-make-plan.md` (line 4) names it as the plan output path, and `summary.md` links to it. Nothing outside `_dump` references it. |
| `archive\null-prompt-to-make-plan.md` | `.md` (`.prompt.md`) | 124 | 7,341 bytes (about 7 KB) | 2026-10-08 | Original `/quasi-coder` shorthand prompt that specified the pattern syntax and reply check features and directed the plan to be written to `prompt.md`. | `summary.md` links to it. Nothing outside `_dump` references it. |

## File Details

- Both files are Markdown prompt documents for an AI coding agent. Neither is executable, and neither is called by a batch file, script, or scheduled task.
- Both files are ASCII text with LF line endings and no byte order mark.
- `archive\null-prompt-to-make-plan.md` has no final line break, so it has 124 lines and 123 line breaks.
- `prompt.md` starts with a YAML front matter header (lines 1 to 21) whose `#` comment lines give its purpose, usage, dependencies, and last-reviewed date. The plan body is organized into these sections: How the app works today, Inputs already in the workspace, Decisions, Parts 1 to 5, Conventions, Tests, and Out of scope.

## Reference Search

Every file under `reminder\`, `cronjobs\`, `bin\`, and `config\` was searched for `reminder-check.prompt`, `check-feature-init`, and `reminder\_dump`, case-insensitively. The search included hidden folders (`.Backups`, `.Support`, `.tmp`) and binary files such as shortcuts. The only matches are inside `_dump`:

- `archive\null-prompt-to-make-plan.md` line 4, listed above.
- The `summary.md` links, listed above.
- The usage lines in the `prompt.md` header, which name the file itself.
- The audit files `INVENTORY.md` and `log.md`, which describe the files rather than use them.

## Classification

Each file is in exactly one bucket: ACTIVE (1), STALE (1), UNKNOWN (0).

### ACTIVE

- `prompt.md`: the current implementation plan for the pattern syntax and reply check features, and none of it is implemented yet.
  - None of its new files exist: `lib\patternSyntax.js`, `lib\checkResponse.js`, `lib\checkResponse.bat`, `lib\addCheck.bat`, and `cronjobs\reminderCheck.bat` in the Batch Files root.
  - The workspace inputs it describes match what is on disk. The check files in `checks\` have the `qualifier:` line and the `OPTINAL-A` typo that Part 2 fixes, `templates\appointment.txt` matches the template it shows, and `patternSyntax\month.txt` and `year.txt` still have the `()->` shorthand lines that Part 1 resolves.
  - No newer plan for these features exists anywhere in the Batch Files folder.

### STALE

- `archive\null-prompt-to-make-plan.md`: superseded by `prompt.md`, the plan it was written to produce.
  - It sits in `archive\`, and only the audit files reference it.
  - Its specification is out of date where the plan settled open questions. Its `_2:month_` example leaves out the 12-07 date that the plan keeps, its check file format has no `qualifier:` line (the check files on disk have one), and it calls the flag both `--checks` and `--check`, which the plan settles as `--check` with `--checks` as an alias.

### UNKNOWN

- None.
