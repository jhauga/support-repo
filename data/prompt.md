# Prompt File Passed to Script [loop-copilot.sh](loop-copilot.sh.md)

Audit and document the reminder tool's dump folder.

## Target

`C:\Users\userName\Batch Files\reminder\_dump`

## Scope

This is a multi-phase job. Work through it in phases — do not attempt the whole
thing in one response.

### Phase 1 — Inventory

Read every file in the target folder. For each one record:

- filename and extension
- line count and rough size
- what it appears to do, in one sentence
- whether it is referenced by anything else in the reminder folder

Write this to `_dump\INVENTORY.md` as a table.

### Phase 2 — Classify

Using the inventory, sort every file into exactly one bucket:

- ACTIVE — referenced or clearly still in use
- STALE — superseded, duplicated, or orphaned
- UNKNOWN — cannot determine without the user

Append a Classification section to INVENTORY.md with the three lists.

### Phase 3 — Header standardization

For every file classified ACTIVE, add or normalize a header comment block
containing: purpose, usage example, dependencies, and last-reviewed date.
Use `::` comments for .bat/.cmd and `#` for anything else. Do not change
any executable logic — headers only.

### Phase 4 — Index

Write `_dump\summary.md` containing a short description of what the folder is,
the ACTIVE file list with one-line descriptions, and a note about what was
flagged STALE and why.

### Phase 5 — Verify

Re-read every file touched. Confirm no logic was altered, every ACTIVE file has
a valid header, and both INVENTORY.md and summary.md are accurate against what
is actually on disk. Report any discrepancy.

## Constraints

- Do not delete anything. STALE is a label, not an action.
- Do not modify files outside the target folder.
- Windows CMD syntax only, no PowerShell.

## Test logging

Maintain `_dump\log.md` and append one line at the end of every phase:
`Phase N | <timestamp> | <files touched> | <marker emitted>`
