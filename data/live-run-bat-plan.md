# Live Run Plan (CMD)

Plan file passed to the committed [loop-copilot.bat](https://github.com/github/awesome-copilot/blob/main/skills/handle-big-tasks/scripts/loop-copilot.bat) driver. Document the three batch files in `data/live-run/fixture`, one phase per run.

## Rules

- Take input only from `data/live-run/fixture` and the results of earlier phases, and write files only under `data/live-run-bat/results`.
- Never change the files in `data/live-run/fixture`.
- At the end of each phase, append one line to `data/live-run-bat/results/log.md` in the form `Phase <n> | <files written> | <marker that closes this response>`.

## Phase 1: Inventory

Read every file in `data/live-run/fixture`. Write `data/live-run-bat/results/inventory.md` with a table that lists each file's name, line count, and a one-sentence description of what it does.

## Phase 2: Headers

For each file in the inventory, write a copy to `data/live-run-bat/results/headers/<same name>` that starts with a `::` comment block giving its purpose, a usage example, and its dependencies. After the comment block, the copy must repeat the original file's lines exactly, with no changes.

## Phase 3: Summary and Check

Compare each copy in `data/live-run-bat/results/headers` with its original and confirm that the lines after the comment block match exactly. Write `data/live-run-bat/results/summary.md` with a one-line description of each file, links to its inventory row and its copy, and the result of that comparison.
