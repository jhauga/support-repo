<!--
---
# Purpose: Implementation plan for the reminder batch app. Part 1 adds pattern
#   syntax qualifiers to /U -p, Part 2 adds reply checks, Part 3 adds
#   /A --check, Part 4 adds the daily reminderCheck cronjob and scheduled task,
#   and Part 5 updates docs\HELP-reminder.txt.
# Usage: Run from the Batch Files folder, one part per agent run.
#   Interactive prompt:
#     Read the plan file at reminder\_dump\prompt.md and begin executing it from the first incomplete part.
#   Unattended loop (CMD):
#     %USERPROFILE%\.claude\skills\handle-big-tasks\scripts\loop-claude.bat reminder\_dump\prompt.md 15
# Dependencies:
#   Skills: batch-files, use-cliche-data-in-docs, handle-big-tasks
#   Tools: node (built-in modules only), sed, schtasks, extractEmail CLI
#     (extract-email npm package)
#   Workspace files: reminder\reminder.bat, reminder\lib\updateReminder.bat,
#     reminder\config\accnts.bat, reminder\patternSyntax\*.txt,
#     reminder\templates\*.txt, reminder\checks\*.txt,
#     reminder\docs\HELP-reminder.txt, config\accntVars.bat,
#     cronjobs\reminderPattern.bat
# Last reviewed: 2026-10-08
---
-->

# Plan: reminder pattern syntax updates and reply checks

Implement three changes to the `reminder` batch app in `C:\Users\userName\Batch Files\reminder`:

1. **Pattern syntax update.** `reminder /U -p "<name>" "<MM-DD> _<n>:<unit>_" [--template:<type>[,values] | "<text>"]` rewrites a pattern reminder's date line with a computed list of dates, and can also rebuild its message from a template.
2. **Reply checks.** A daily job reads replies to reminders. When a reply names a pattern reminder that has a check file in `reminder\checks\`, the job runs the update from item 1 with the reply's date and values, then moves the reply to Trash.
3. **Help file.** `reminder\docs\HELP-reminder.txt` documents both.

Work one part at a time (Parts 1 to 5 below), and run each part's tests before starting the next. Load the `batch-files` skill for the batch work, `use-cliche-data-in-docs` for the help file, and `handle-big-tasks` to run the parts as phases.

## 1. How the app works today

Only the parts these changes touch.

- **Entry chain.** `bin\reminder.bat` runs `batapp reminder %*`, and batapp calls `reminder\reminder.bat` with each argument re-quoted. cmd splits unquoted arguments on spaces, commas, semicolons, and equals signs, so `--template:appointment,10:45 AM` reaches reminder.bat as three arguments: `--template:appointment`, `10:45`, and `AM`. When reminder.bat would get 8 or more arguments, batapp passes the raw string instead, with every occurrence of the word `reminder` removed.
- **reminder.bat** reads `%1` to `%9` into `_parOneReminder` ... `_parNineReminder`, plus `_checkPar...Reminder` (`-value-`). It calls `config\accntVars.bat` at startup (line 135), so every `_...User` and `_...Password` accnt variable is in the environment of anything it calls. Routing:
  - `/U`: `:_runTempDirReminder 1` (line 1080) calls `lib\updateReminder.bat`, which only sets variables. The `/u` block in `:_runReminderWithOptions` then edits the file with sed. A library that does all of its own work sets `_gotoRemoveBatchVariablesReminder=1`, which sends reminder.bat straight to cleanup. `lib\addScript.bat` does this at line 13.
  - `/A`: `:_runTempDirReminder 1` (line 981) sends `--script` to `lib\addScript.bat` and everything else to `lib\addReminder.bat`.
  - `/P`: sends every pattern reminder whose line 1 matches today, through `sendSMS.js` (nodemailer, Gmail), with the subject `<name>.txt`.
- **Pattern reminder file** `reminders\pattern\<name>.txt` (CRLF). Line 1 is the pattern:

```
09-23,09-30,10-01,10-03
 :
renew:

10-07 at 10:45.
```

- Line 1 can end with routing suffixes: ` --:- <recipient> -:--` and ` --f- <profile> -f--`. `<profile>` is a sender profile in `config\accnts.bat`: `reminder` (the default) or `AccntName`. A plain `MM-DD` entry matches that date every year, because `lib\patternChecks.bat` turns it into `MM-DD--all`.
- **Recipient** of a pattern reminder: its `--:-` suffix, else the `/P` argument. `cronjobs\reminderPattern.bat` passes the same value as `_defaulteSendToReminder` (reminder.bat line 6).
- **Sender:** the accnts.bat profile from the `--f-` suffix, else `reminder` (`_smsReminderDefaultUser` and `_smsReminderDefaultPassword`). `sendSMS.js` hardcodes `from` and `replyTo` to the default reminder address.
- **Schedule.** The task `\User - Batch Files\reminderPattern` runs `cronjobs\reminderPattern.bat` daily at 09:30 with an S4U logon (runs whether or not the user is logged on, no stored password). The script runs `cd /D "%__BF__%\reminder\"`, then `call reminder.bat /P "<recipient>"`.
- **Email reading:** the global `extractEmail` CLI. It's the npm package `extract-email`, the user's own project, linked at `%APPDATA%\npm\node_modules\extract-email`. `cronjobs\cleanAccntNameGmail.bat` already runs it under S4U. Read its source if needed, but don't modify it. This plan relies on the following behavior:
  - Without `--config`, it reads `configEmailExtraction.mjs` from the current directory first.
  - `--index from=<text> [count]` prints the comma-separated positions of matching emails among the newest `count` (default 100). Position 1 is the newest.
  - `--json -n <N>` prints the full email as `{"Email #N": {From, To, Date, Subject, Attachment, Body}}`.
  - `-a -n <N> -o <dir>` saves that email's attachments in `<dir>`. With `-o <dir>`, the other output goes to `<dir>\extractEmal.response.txt` (that spelling).
  - `--move <folder> -n <N> <filters>` moves email N only if it still matches the filters. `Trash` resolves by name or by the `\Trash` special-use flag (`[Gmail]/Trash` on Gmail). On success it prints `Moved email #N to "<folder>"`.

## 2. Inputs already in the workspace

- `reminder\patternSyntax\week.txt`, `month.txt`, and `year.txt` define the units. `month.txt` and `year.txt` still contain `()->` shorthand lines; Part 1 gives the resolved contents.
- `reminder\templates\appointment.txt`:

```
PATTERN_SYNTAX
 :
FILE_NAME:

DATE at OPTIONAL-A OPTIONAL-B.
```

- `reminder\checks\renew.txt` and `visit.txt`:

```
appointment
qualifier: 2 weeks
email: _responseReminderCheckUser
DATE: 0
OPTINAL-A: 1
OPTIONAL-B: 2
```

  `OPTINAL-A` is a typo. Change it to `OPTIONAL-A` in both files.
- `config\accntVars.bat` sets `_responseReminderCheckUser` and `_responseReminderCheckPassword`, the 4th `...User` variable in `:_runBatchFilesAccntVars`. That accnt isn't on Gmail, so its IMAP host can't be assumed.

## 3. Decisions (settled)

| Topic | Decision |
|---|---|
| Qualifier for automated updates | The check file's `qualifier: <n> <unit>` line. A missing line means `2 weeks`. |
| Line 2 of `month.txt`, `DATE - ((property * counter)/2)` | Kept, in `year.txt` too. `_2:month_` from 01-07 includes 12-07. |
| `()->` lines | Resolved as `DATE - (counter/2)`, `DATE - (counter/6)`, and `DATE - (counter/12)`. As written, they land before the halfway date, but the `_2:month_` example shows the 15-day mark (12-23). |
| Line 3 and `_while` in `week.txt` | As written, `_2:week_` would add 12-27, 01-01, and 01-02, which the example list doesn't have. Line 3 becomes `DATE - (counter/2)`, and the daily run starts at `DATE - (counter/2)`. |
| Comma in `--template:` | Accept the split form (cmd splits on the comma) and the quoted single-argument form. |
| Who a reply must come from | The reminder's recipient. For SMS gateway recipients, the same number at any domain in that carrier's family (Verizon: `vtext.com` and `vzwpix.com`). MMS replies come from `vzwpix.com`, with the text in an attached `text_0.txt`. |
| Deleting a processed reply | Move it to Trash, as `cleanAccntNameGmail.bat` does. |
| Duplicate protection | A processed-reply log, so a failed move can't cause a second update. |
| Flag | `--check`, with `--checks` accepted as an alias. |
| Number of optional values | 0 to 9 (`OPTIONAL-A` to `OPTIONAL-I`). |
| Template when `/A --check` skips its prompts | `appointment`. |
| IMAP host for non-Gmail accnts | A new variable `<prefix>Host`, for example `_responseReminderCheckHost`. Ask the user for its value. |
| Language split | Node (CommonJS, built-in modules only) handles date math, templates, reply parsing, and extractEmail calls. Batch handles option routing, prompts, accnts.bat, and the cronjob. JSON, attachments, date arithmetic, and free text aren't safe to handle in batch. |

## Part 1: Pattern syntax update

### Command

```
reminder /U -p "<name>" "<MM-DD> _<n>:<unit>_" [--template:<type>[,<value>...] [<value>...] | "<text>"]
```

- `--pattern` also works in place of `-p`.
- `<MM-DD>` also accepts `M-D`, `MM/DD`, and `M/D`. DATE means the next occurrence of that day on or after today.
- `<n>` is a whole number of 1 or more. `<unit>` is the basename of a file in `patternSyntax\`. The plurals `weeks`, `months`, and `years` work too.
- `--template:<type>` uses `templates\<type>.txt`. The values are everything after the first comma in that argument, plus every later argument, split on spaces and commas. They fill `OPTIONAL-A`, `OPTIONAL-B`, and so on, in order. Unquoted, reminder.bat only sees 4 values after the template argument (`%6` to `%9`). For more, quote the whole argument: `"--template:appointment,10:45 AM,..."`.
- `"<text>"` replaces the message, as today's `/U -p` does.
- With nothing after the qualifier, only line 1 changes.

### Unit files

Replace the three files with exactly this content.

`patternSyntax\week.txt`:

```
counter: 7
type: days
unit: week
---
DATE - (property * counter)
DATE - ((property * counter)/2)
DATE - (counter/2)
_while: DATE - (counter/2) every 1 day
```

`patternSyntax\month.txt`:

```
counter: 30
type: days
unit: month
while-out: 7 days
---
DATE - (property * counter)
DATE - ((property * counter)/2)
DATE - (counter/2)
DATE - (counter/6)
_while: out
```

`patternSyntax\year.txt`:

```
counter: 365
type: days
unit: year
while-out: 14 days
---
DATE - (property * counter)
DATE - ((property * counter)/2)
DATE - (counter/2)
DATE - (counter/6)
DATE - (counter/12)
_while: out
```

File grammar:

- Header lines are `key: value` up to `---`:
  - `counter`: days in one unit.
  - `type`: only `days` is supported.
  - `unit`: `week`, `month`, or `year`, the calendar step for offsets that are whole units.
  - `while-out: <N> days`: optional. N must be a multiple of 7.
- Mark lines have the form `DATE - (<expr>)`. `<expr>` can use `property`, `counter`, numbers, `+ - * /`, and parentheses. After the numbers are substituted, the text must match `^[0-9+\-*/(). ]+$` before it's evaluated.
- `_while: DATE - (<expr>) every <s> day` adds every s-th day from that date through DATE.
- `_while: out` hands the last `while-out` days to `week.txt`, with property N / 7.
- A line that starts with `()->` or `()=>` is an error, because it's unresolved shorthand.

### Date rules

1. DATE is the next occurrence of MM-DD on or after today, by local date.
2. Each mark line gives an offset of D days.
   - If D is a whole multiple k of `counter` (k of 1 or more), step back k calendar units: 7k days for `week`, k months for `month`, 12k months for `year`. Clamp the day to the end of the month, so 03-31 minus one month is 02-28 (02-29 in a leap year).
   - Otherwise, subtract D rounded up to whole days (3.5 becomes 4).
3. With `while-out: N days`, skip marks with D under N, and add everything `week.txt` produces with property N / 7.
4. DATE itself is always in the list.
5. Drop dates before today, remove duplicates, sort by date, and join them as `MM-DD` with commas and no spaces. Because DATE is never more than a year away, this rule also drops any offset of a year or more, which keeps an `MM-DD` from landing on the wrong year.

This reference sketch (not final code) reproduces every row of the table that follows it:

```js
function resolveDates(mmdd, property, unitName, today) {
  const date = nextOccurrence(mmdd, today);              // on or after today
  const found = new Map();                               // 'yyyymmdd' -> Date
  const keep = (d) => { if (sameOrAfter(d, today) && sameOrAfter(date, d)) found.set(ymd(d), d); };
  (function run(name, prop) {
    const unit = loadUnit(name);                         // header, marks, daily, whileOut
    for (const expr of unit.marks) {
      const days = evaluate(expr, prop, unit.counter);
      if (unit.whileOut && days < unit.whileOut) continue;
      const k = days / unit.counter;
      keep(Number.isInteger(k) && k >= 1 ? stepBack(date, k, unit.unit) : addDays(date, -Math.ceil(days)));
    }
    if (unit.daily) {
      const start = Math.ceil(evaluate(unit.daily.expr, prop, unit.counter));
      for (let i = start; i >= 0; i -= unit.daily.step) keep(addDays(date, -i));
    }
    if (unit.whileOut) run('week', unit.whileOut / 7);
  })(unitName, property);
  keep(date);
  return [...found.keys()].sort().map((key) => toMMDD(found.get(key)));
}
```

Expected results for `node lib\patternSyntax.js resolve "<input>" --today 2026-10-08`. The first three rows are the examples this feature was specified with:

| Input | Output |
|---|---|
| `01-07 _2:week_` | `12-24,12-31,01-03,01-04,01-05,01-06,01-07` |
| `01-07 _1:week_` | `12-31,01-03,01-04,01-05,01-06,01-07` |
| `01-07 _2:month_` | `11-07,12-07,12-23,12-31,01-03,01-04,01-05,01-06,01-07` |
| `01-07 _1:year_` | `11-07,12-07,12-24,12-31,01-03,01-04,01-05,01-06,01-07` |
| `11-19 _2:week_` | `11-05,11-12,11-15,11-16,11-17,11-18,11-19` |
| `10-08 _1:week_` | `10-08` |
| `03-31 _1:month_` with `--today 2027-01-10` | `02-28,03-16,03-24,03-27,03-28,03-29,03-30,03-31` |
| `01-07 _0:week_`, `01-07 _2:day_`, `13-01 _1:week_`, `02-30 _1:week_` | an error message and exit code 1 |

### Writing the reminder file

- The new line 1 is the date list, plus any routing suffixes from the current line 1 (everything from the first ` --:-` or ` --f-` to the end of the line). Today's `/U -p` drops these suffixes; this path must keep them.
- If the current line 1 starts with `__START__`, refuse with a message that points to `/U --start`.
- **Template form.** The rendered template becomes the whole file. Replace whole-word placeholders in a single regex pass, so inserted text is never scanned again:
  - `PATTERN_SYNTAX`: the new line 1.
  - `FILE_NAME`: the reminder's file name without `.txt`, with the capitalization it has on disk.
  - `DATE`: the normalized MM-DD.
  - `OPTIONAL-A` to `OPTIONAL-I`: the values. Remove a placeholder that has no value. On each line that held an optional placeholder, collapse repeated spaces, remove spaces before `. , ; ! ?`, and trim the end of the line. Leave all other lines exactly as they are; line 2 (` :`) keeps its leading space.
- **Text form.** Write the new line 1, keep lines 2 and 3, leave line 4 blank, put the text on line 5, and drop the rest. That's the same shape today's `/U -p` writes.
- **No message argument.** Change line 1 only.
- Read templates and reminders with either line ending, and strip a UTF-8 BOM. Write CRLF line endings, including a final CRLF.

`reminder /U -p "renew" "01-07 _2:week_" --template:appointment,10:45` writes:

```
12-24,12-31,01-03,01-04,01-05,01-06,01-07
 :
renew:

01-07 at 10:45.
```

`reminder /U -p "renew" "01-07 _2:month_" --template:appointment,10:45 AM` writes:

```
11-07,12-07,12-23,12-31,01-03,01-04,01-05,01-06,01-07
 :
renew:

01-07 at 10:45 AM.
```

### Code changes

1. **New `reminder\lib\patternSyntax.js`.** Its CLI:
   - `resolve "<MM-DD> _<n>:<unit>_" [--today YYYY-MM-DD]` prints the date list.
   - `update <name> "<MM-DD> _<n>:<unit>_" [<rest>...] [--today YYYY-MM-DD] [--dry-run] [--pattern-dir <dir>]` writes the file. `<rest>` is the raw par5 to par9, and empty strings are ignored. `--dry-run` prints the new content without writing it. `--pattern-dir` defaults to `reminders\pattern` and exists for tests.
   - `test` runs the date table above and the two file examples against a scratch copy, and exits with code 0 when everything passes.
   - It exports `parseQualifier`, `resolveDates`, `renderTemplate`, and `updatePatternReminder` for Part 2. `updatePatternReminder` takes the optional values as a map, for example `{A: '10:45', B: 'AM'}`.
   - Errors go to stderr with exit code 1: an unknown unit (list the files in `patternSyntax\`), a property under 1, an invalid date, a missing reminder or template, a `__START__` reminder, more than 9 values, or an unresolved shorthand line.
2. **`reminder\lib\updateReminder.bat`.** In `:_startUpdateReminder 1`, in the branch for 4 or more parameters and before the `-p` handlers, check whether par2 is `-p` or `--pattern` and par4 holds a qualifier (it contains ` _` and ends with `_`). If so, run:

```bat
node "%_reminderLibrary%\patternSyntax.js" update "%_parThreeReminder%" "%_parFourReminder%" "%_parFiveReminder%" "%_parSixReminder%" "%_parSevenReminder%" "%_parEightReminder%" "%_parNineReminder%"
```

   On exit code 0, print `Reminder Updated:` and `type` the file. Either way, set `_gotoRemoveBatchVariablesReminder=1` and `goto:eof`. Every other `/U` form keeps its current behavior.

## Part 2: Reply checks

### Check file `checks\<name>.txt`

`<name>` must match a pattern reminder, `reminders\pattern\<name>.txt`.

| Line | Meaning |
|---|---|
| line 1 | The template type: a file in `templates\`, without `.txt`. |
| `qualifier: <n> <unit>` | For example `1 week`, `2 weeks`, `3 months`, or `1 year`. The `_<n>:<unit>_` form works too. Default: `2 weeks`. |
| `email: <variable>` | A `...User` variable from `config\accntVars.bat`. Without this line, the check uses sender mode. |
| `DATE: <index>` | The position of the date among the reply's tokens. `/A --check` always writes 0. |
| `OPTIONAL-A: <index>` to `OPTIONAL-I: <index>` | The position of each template value among the reply's tokens. |

Line 1 is positional. The keyed lines can appear in any order, and keys are case-insensitive. Log a warning for an unknown key, so a typo like `OPTINAL-A` shows up. Only `checks\*.txt` files count; subfolders such as `checks\tests\` are never checked live.

### Mailbox and credentials

| Mode | Mailbox | Credentials |
|---|---|---|
| `email: <prefix>User` | That accnt. | Node reads `<prefix>User`, `<prefix>Password`, and the optional `<prefix>Host` from its environment, where accntVars.bat already put them. |
| Sender (no `email:` line) | The accnt that sends this reminder. | The profile from the line-1 `--f- <profile> -f--` suffix, else `reminder`. Batch runs `call "%_callRootConfigReminder%\accnts.bat" "<profile>"` and passes `_userReminder` and `_passwordReminder` to Node as `REMINDER_CHECK_USER` and `REMINDER_CHECK_PASSWORD`. |

- **Host.** Use `<prefix>Host` when it's set, and `imap.gmail.com` for `gmail.com` and `googlemail.com` addresses. For anything else, stop that check with an error that names the variable to add. Use port 993 with TLS, and leave certificate checks on. If the host fails TLS, tell the user rather than turning the checks off.
- **New variable.** Add `_responseReminderCheckHost` to `config\accntVars.bat`: a `set` line next to the user and password, an entry in the header comment list, and a line in `:_removeBatchVariablesBatchFilesAccntVars`. Ask the user for the value.
- **Secrets.** Never print or log accnt values. Logs name the variable (`_responseReminderCheckUser`) or `sender:<profile>`.
- **Sender mode caveat.** `sendSMS.js` always sets `from` and `replyTo` to the default reminder address, so replies to reminders sent with a `--f-` profile may arrive in the default accnt. If sender mode misses them, add an `email:` line.

### Which replies count

An INBOX email counts for check `<name>` when all of these hold:

1. **Sender.** From must be the reminder's recipient: the line-1 `--:- <address> -:--` suffix, or else `REMINDER_CHECK_DEFAULT_RECIPIENT`, which batch sets from `_defaulteSendToReminder`. Compare case-insensitively. The local part can also match with both domains in one gateway family. Start the family table with Verizon (`vtext.com`, `vzwpix.com`) and keep it in one constant.
2. **Name.**
   - Candidate lines are the first non-empty line of each `.txt` attachment (in file-name order), then the first non-empty line of the body. Strip a BOM and zero-width characters, decode UTF-16 when an attachment starts with a UTF-16 BOM, and collapse whitespace.
   - Subject form: the subject equals `<name>`, case-insensitively, after removing repeated `Re:`, `Fw:`, and `Fwd:` prefixes and a trailing `.txt`. The tokens are the whole line. Pattern reminders go out with the subject `<name>.txt`, so a reply that keeps the subject still matches.
   - Prefix form: the line reads `<name>: <rest>`, with the name case-insensitive. The tokens are `<rest>`.
   - For each candidate line, try the subject form first, then the prefix form. The first one that yields a valid date wins.
3. **Values.** Split the tokens on whitespace. The `DATE` index gives the date. Normalize `M-D`, `MM/DD`, and `M/D` to `MM-DD`; the result must be a real date at its next occurrence. Each `OPTIONAL-x` index gives that value when the token exists.

The two example replies:

| Reminder | Reply | Result |
|---|---|---|
| renew | No subject; attachment `renew: 01-07 10:45 AM` | DATE 01-07, A 10:45, B AM |
| visit | Subject `visit`; attachment `11-19 10:30 AM` | DATE 11-19, A 10:30, B AM |

An email that matches no check stays untouched and isn't logged. A reply that names a check but fails to parse gets a warning in the log and stays in the inbox, so the next run tries it again.

### Processing one check

1. If `reminders\pattern\<name>.txt` is missing, log it and stop.
2. Run `--index from=<local part>@ <count>` (count 100) to get the positions.
3. Work through the positions highest first, which is oldest first. That way the newest reply wins. Since positions count from the newest email, moving an older email doesn't renumber the ones still to process.
4. For each valid reply, compute its key: the sha1 of `From|Date|Subject|chosen line`. If the key is already in the processed log, skip the update. Otherwise, call `updatePatternReminder` in-process with the check's template and qualifier, the DATE, and the values as a map (so a missing A never shifts B into A's place). Then append the key.
5. Move the reply with `--move Trash -n <N> from=<local part>@`. The move succeeded if stdout contains `Moved email #<N>`. If it failed, log that. The processed log prevents a second update, and the next run retries the move.

### Calling extractEmail from Node

- Run `process.execPath` with `%APPDATA%\npm\node_modules\extract-email\dist\extractEmail.js`, falling back to `<npm root -g>\extract-email\dist\extractEmail.js`. Pass the arguments as an array with no shell, use cwd `reminder\temp\checkResponse\`, and set a 120-second timeout. `/P` only deletes its own files in `temp\`, so this subfolder is safe there.
- Keep credentials off the disk and off the command line. Write a static `configEmailExtraction.mjs` into that cwd that reads them from the environment, and set the three variables only in the child process's environment:

```js
export const configEmail = {
  imap: {
    user: process.env.REMINDER_CHECK_IMAP_USER,
    password: process.env.REMINDER_CHECK_IMAP_PASSWORD,
    host: process.env.REMINDER_CHECK_IMAP_HOST,
    port: 993,
    tls: true,
    authTimeout: 10000
  }
};
```

- Read one email and its attachments with `--json -a -n <N> -o <cwd>\msg`. The JSON lands in `msg\extractEmal.response.txt`, with the attachments beside it. Empty `msg\` before each read. On the first live read, confirm that `--json` and `-a` work together on the `-n` path; if they don't, use two calls.
- For `--index`, take the last line of stdout that matches `^\d+(,\d+)*$`. An empty line means no matches.
- Keep the Trash folder name and the default count in constants at the top of the file.
- If the `--index` call fails (for example a login error or a missing host), stop that check. If one email fails, skip it and continue with the next.

### Logs

- `reminder\_logs\checkResponse.txt` gets a header with the date and time for each run. Under it, for each check: the mailbox (the variable name or `sender:<profile>`), the replies found, each update (`renew: 01-07, 2 weeks, appointment`), warnings, and errors.
- `reminder\_logs\checkResponse.processed.txt` gets one line per applied reply: `<key> <ISO time> <name> <MM-DD>`.

### Code changes

1. **New `reminder\lib\checkResponse.js`.** Usage: `node checkResponse.js <name> [--dry-run] [--today YYYY-MM-DD] [--count N] [--fixture <dir>] [--recipient <address>] [--pattern-dir <dir>] [--log-dir <dir>]`.
   - `--dry-run` parses the replies and prints each planned update, without writing the reminder, adding processed keys, or moving any email.
   - `--fixture <dir>` reads emails from `<dir>\<case>\email.json` (`{"From", "Subject", "Date", "Body"}`) plus any `*.txt` files beside it, instead of IMAP. Order the cases by `Date`.
   - `--recipient`, `--pattern-dir`, and `--log-dir` override the defaults for tests.
2. **New `reminder\lib\checkResponse.bat`**, called for `/U --check`. For each `checks\*.txt`:
   - If the pattern reminder is missing, skip it and log a line.
   - If there's no `email:` line, read the `--f-` profile from line 1 of the pattern reminder (with the same sed as `lib\patternChecks.bat`), call accnts.bat, and set `REMINDER_CHECK_USER` and `REMINDER_CHECK_PASSWORD`.
   - Set `REMINDER_CHECK_DEFAULT_RECIPIENT=%_defaulteSendToReminder%`.
   - Run `node "%_reminderLibrary%\checkResponse.js" "<name>"`, adding `--dry-run` when `_dryRunCheckResponse=1`.
   - Clear the exported variables after each check, and again in the cleanup label.
   - Put the debug flag at the top: `set "_dryRunCheckResponse=0" & rem 0 (default), 1 parse and log only`.
   - Never prompt. This path runs from Task Scheduler with no console.
3. **`reminder\lib\updateReminder.bat`.** At the top, before the `%_checkParThreeReminder%` test, check whether par2 is `--check` or `--checks`. If so, `call "%_reminderLibrary%\checkResponse.bat"`, set `_gotoRemoveBatchVariablesReminder=1`, and `goto:eof`. Any argument after `--check` is ignored. `reminder /U --check` and the cronjob both run this path.
4. Fix `OPTINAL-A` in both check files.

## Part 3: `reminder /A --check`

| Command | Prompts |
|---|---|
| `reminder /A --check` | Name, template, qualifier, mailbox, value count |
| `reminder /A --check <name>` | Template, qualifier, mailbox, value count |
| `reminder /A --check <name> <variable or number>` | Template, qualifier, value count |
| `reminder /A --check <name> sender` | Template, qualifier, value count |
| `reminder /A --check <name> <variable, number, or sender> <count>` | None. Uses the default template and qualifier, then opens the file. |
| `reminder /A --check <name> <variable, number, or sender> <count> fi` | None. Prints the file instead of opening it. |

The prompts:

- **Name.** It must match `reminders\pattern\<name>.txt`. If `checks\<name>.txt` already exists, say so and stop, as `/A` does for reminders.
- **Template.** Show a numbered list of `templates\*.txt`. Accept the number or the name. Enter means `appointment`.
- **Qualifier.** `<n> <unit>`, with the unit `week`, `month`, or `year` (plurals accepted). Enter means `2 weeks`. Write the singular for 1 (`1 week`) and the plural otherwise.
- **Mailbox.** Show a numbered list: `0` is sender mode (the accnt that sends the reminder), then each `...User` variable in `:_runBatchFilesAccntVars`, in file order starting at 1. Today `_responseReminderCheckUser` is number 4. Accept the number or the variable name. Show names only, never values. Build the list with sed, using `.` to match the `"` after `set` so the batch-quoted script has no quote inside it:

```bat
sed -n "/^:_runBatchFilesAccntVars/,/exit \/b/s/^ *set .\(_[A-Za-z0-9]*User\)=.*/\1/p" "%_callRootConfigBatchFiles%\accntVars.bat"
```

- **Value count.** 0 to 9. Writes `OPTIONAL-A: 1` and so on, up to that count.

The written file (batch `echo` writes CRLF; the `email:` line is left out in sender mode):

```
appointment
qualifier: 2 weeks
email: _responseReminderCheckUser
DATE: 0
OPTIONAL-A: 1
OPTIONAL-B: 2
```

Put the redirection first on every write, as in `>>"%_fileAddCheck%" echo DATE: 0`. Written as `echo DATE: 0>>file`, cmd reads `0>>` as a stream handle.

Unless the last argument is `fi`, open the file with `open notepad++` and then `notepad++ "<file>"`, the same way new pattern reminders are opened.

### Code changes

1. **New `reminder\lib\addCheck.bat`.** It sets `_gotoRemoveBatchVariablesReminder=1`, as `addScript.bat` does, and has config variables at the top: `_defaultTemplateAddCheck=appointment` and `_defaultQualifierAddCheck=2 weeks`.
2. **`reminder\reminder.bat`.** In the `/a` branch of `:_runTempDirReminder 1`, before the `--script` test, route `--check` and `--checks` to `call "%_reminderPath%\lib\addCheck.bat" & goto:eof`.

## Part 4: Cronjob and scheduled task

Create `cronjobs\reminderCheck.bat`, modeled on `cronjobs\reminderPattern.bat`:

```bat
@echo off
REM reminderCheck
:: Call reminder Batch App with option /U --check to apply replies to checked reminders.

:: Define path and variables to current batch.
if not defined __BF__ for %%I in ("%~dp0..") do set "__BF__=%%~fI"
set "_batchFilesRootReminderCheck=%__BF__%"

:: Change to root of app.
cd /D "%_batchFilesRootReminderCheck%\reminder\"

:: Call app from that directory.
call reminder.bat /U --check

REM Done.
goto _removeBatchVariablesReminderCheck
goto:eof

:: Remove batch variables.
:_removeBatchVariablesReminderCheck
 set _batchFilesRootReminderCheck=

 exit /b
goto:eof
```

Register `\User - Batch Files\reminderCheck` to run daily at 09:15, 15 minutes before reminderPattern, with the same S4U logon and limited rights:

```bat
schtasks /Create /TN "\User - Batch Files\reminderCheck" /TR "\"C:\Users\userName\Batch Files\cronjobs\reminderCheck.bat\"" /SC DAILY /ST 09:15 /RU "%USERNAME%" /NP /RL LIMITED
```

- `/NP` gives the S4U logon. If the command is refused, run it from an elevated prompt.
- reminderPattern's start-in folder (`reminder\temp`) doesn't need to be copied, because the script changes directory itself.
- Confirm the task with `schtasks /Query /TN "\User - Batch Files\reminderCheck" /V /FO LIST`.
- Ask the user before creating the task.

Nothing on the `/U --check` path may wait for input: no `set /P`, `pause`, `callLibrary waitOne`, `TIMEOUT`, or notepad++.

## Part 5: Help file

Update `reminder\docs\HELP-reminder.txt`, keeping its current layout (1-space indent, aligned description column, star borders):

- Usage block: `--check` under [2] for `/A` and `/U`, the qualifier form under [4], and `--template:` under [5].
- Parameter List: `--check`, `--template:<type>[,values]` (including the quoting rule for more than 4 values), and `Pattern Syntax Qualifier`.
- New sections:
  - Pattern Syntax Qualifiers: the units, a short version of the date rules, and the `patternSyntax` folder.
  - Templates: the placeholders.
  - Response Checks: the check file lines, the reply forms, the two mailbox modes, Trash, the log files, and the daily reminderCheck task at 09:15.
- A Use Example for each new form.
- Placeholder data only: `fileName`, `templateName`, `_accntNameUser`, `1234567890@example.com`, and made-up dates and times such as `03-14` and `2:00 PM`. No real reminder names, accnt variable names, phone numbers, or domains. No em dashes or en dashes.

## Conventions

- Follow the batch house style:
  - Start each file with `@echo off`, `REM <name>`, and `:: <description>`.
  - Suffix variables with the capitalized file name (`_checkNameCheckResponse`), and name subroutines `:_<name><Suffix>`.
  - Use numbered-phase subroutines (`call :_sub 1` ... `call :_sub N+1 & goto:eof`) wherever a step reads a value that an earlier step set.
  - End with a `:_removeBatchVariables<Name>` label that clears every variable the file set, then `exit /b`.
  - Add variables that must survive back into reminder.bat to its "START APPEND NEW VARIABLES" cleanup list.
- Every `.bat` must use CRLF. The Write tool writes LF, so convert afterward, then check that `tr -cd '\r' < file | wc -c` equals the line count. Never run `sed -i` on a `.bat` from Git Bash.
- Help lines that start with `/` use `echo(`.
- Node files are CommonJS `.js`, like `sendSMS.js`, using built-in modules only (fs, path, child_process, crypto). No npm installs.
- Treat the extractEmail project as read-only.

## Tests

Pin today with `--today 2026-10-08` unless a test says otherwise. Use `--dry-run`, `--pattern-dir`, and `--log-dir` so tests don't touch real reminders. Don't add files to `reminders\pattern\tests\`: the `/P` debug runs use that folder and expect a fixed count (`_alwaysRunTestFilesReminder`).

**Part 1**

1. `node lib\patternSyntax.js test` passes. It covers every row of the date table.
2. Both renew file examples match exactly. So do `_1:week_` (line 1 `12-31,01-03,01-04,01-05,01-06,01-07`) and the quoted form `"--template:appointment,10:45 AM"`.
3. A copy of a reminder with ` --:- 1234567890@example.com -:--` on line 1 keeps that suffix after an update.
4. The text form and the no-message form produce the file shapes described above, and a `__START__` reminder is refused.
5. Regression: `/U -p <name> "09-25--all"` and `/U --start` behave as before.

**Part 2**

Put the fixtures in `reminder\checks\tests\responses\`, use placeholder numbers only, and use the recipient `1234567890@vtext.com`:

| Case | Email | Expected |
|---|---|---|
| renew-mms | From `1234567890@vzwpix.com`, no subject, `text_0.txt` = `renew: 01-07 10:45 AM` | renew line 1 `12-24,12-31,01-03,01-04,01-05,01-06,01-07`, message `01-07 at 10:45 AM.` |
| visit-subject | From `1234567890@vtext.com`, subject `visit`, `text_0.txt` = `11-19 10:30 AM` | visit line 1 `11-05,11-12,11-15,11-16,11-17,11-18,11-19`, message `11-19 at 10:30 AM.` |
| body-form | From `1234567890@vtext.com`, body `renew: 1/7 10:45 AM` | DATE normalized to 01-07 |
| wrong-sender | From `5555550100@vtext.com`, body `renew: 01-07 10:45 AM` | Ignored |
| unknown-name | Body `dentist: 02-03 9:00 AM` | Ignored |
| bad-date | Body `renew: 13-45 10:45 AM` | Warning, not applied |

Then run the renew fixtures once without `--dry-run`, into a scratch `--pattern-dir` and `--log-dir`, and run them again. The second run must report the replies as already processed and change nothing.

**Part 3**

- `reminder /A --check itWorked sender 2 fi` writes the expected file in CRLF, with no `email:` line.
- `reminder /A --check itWorked _responseReminderCheckUser 0 fi` writes an `email:` line and no `OPTIONAL` lines.
- A full interactive run works.
- An existing check, or a name with no pattern reminder, is refused.
- Delete `checks\itWorked.txt` after testing, so the live job never checks it.

**Live steps.** These read and move real email, so ask the user before each one.

1. With `_dryRunCheckResponse=1`, `reminder /U --check` logs what it parsed and changes nothing.
2. The user sends a test reply from the phone. `reminder /U --check` updates the reminder, the reply is in Trash, and the log shows the update. A second run changes nothing.
3. `schtasks /Run /TN "\User - Batch Files\reminderCheck"` finishes with Last Result 0 and adds a log entry.

## Out of scope

- The older `/U` forms, including how they drop the `--:-` and `--f-` suffixes.
- A confirmation text after an automatic update.
- `/L`, `/E`, and `/D` support for check files.
- Qualifiers with `-s`/`--switch` or `--start`.
- Year-specific dates. A plain `MM-DD` repeats every year, so an updated reminder fires again on the same dates next year unless it's updated again.
