# _dump

Working folder for AI agent prompt and plan files used to develop the `reminder` batch app. Nothing in the app, its libraries, or its scheduled tasks reads from this folder, so files here can be added, edited, or archived without affecting how reminders run.

The full file list, with line counts, sizes, and references, is in [INVENTORY.md](INVENTORY.md). Each audit phase adds a line to [log.md](log.md).

## Active Files

| File | Description |
|---|---|
| [prompt.md](prompt.md) | Five-part implementation plan for pattern syntax qualifiers on `/U -p`, reply checks, `/A --check`, the daily `reminderCheck` scheduled task, and the matching help file updates. |

## Stale Files

- [archive/null-prompt-to-make-plan.md](archive/null-prompt-to-make-plan.md) is the original shorthand prompt that `prompt.md` was written from. The plan supersedes it: it settles the prompt's open questions, adds the `qualifier:` line that the check files now use, and corrects the `_2:month_` example dates. The file is kept for reference only, so use the plan instead.
