# getDate Linux Command-line Tools

This repo root contains four equivalent implementations of `getDate`:

- `getDate.sh`
- `getDate.py`
- `getDate.c`
- `getDate.pl`

All tools follow the same behavior contract derived from `getDate.md`, including:

- default date output (`MM-DD-YY`)
- optional slash/full formatting
- day/month/quarter/year options
- leap year check
- silent output mode (`0` or `1`)
- persisted variable storage in `XDG_STATE_HOME/getDate/vars.env` (or `~/.local/state/getDate/vars.env`)

## Quick Install (GitHub Codespaces)

Run from repository root:

```bash
chmod +x getDate.sh getDate.py getDate.pl test_getDate_tools.sh
sudo apt-get update
sudo apt-get install -y build-essential perl python3
gcc -O2 -Wall -Wextra -std=c11 getDate.c -o getDate_c
```

Optional: add simple command aliases for this shell session:

```bash
alias getDate-sh='./getDate.sh'
alias getDate-py='./getDate.py'
alias getDate-c='./getDate_c'
alias getDate-pl='./getDate.pl'
```

## Usage

General form:

```bash
<tool> [1] [2] [3]
```

Where `<tool>` is one of:

```bash
./getDate.sh
./getDate.py
./getDate_c
./getDate.pl
```

### Core Date Options

- `/D` day of month (`DD`)
- `/DM` month digits (`MM`) - only valid with `/D`
- `/LM` last month full name
- `/LQ` last quarter (`Q1..Q4`) - standalone only
- `/LY` last year (`YYYY`)
- `/M` current month full name
- `/NY` next year (`YYYY`) - standalone only
- `/Q` current quarter (`Q1..Q4`)
- `/T` terminal format (`MM/DD/YYYY`) - standalone only
- `/Y` current year (`YYYY`)

### Flags

- `--full` default format becomes `MM-DD-YYYY`
- `--slash` default format uses `/` (`MM/DD/YY`)
- `--leap` stores leap-year check (`0` or `1`) to `_checkLeapYear`
- `--clear-var` clears all persisted getDate variables
- `-abbrv` abbreviates month name with `/M`
- `-t` or `--two-digit` makes `/Y` output `YY`
- `--season` makes `/Q` output season name
- `0` or `1` silent/output mode (default `1`)
- `/?` prints help
- `-e` with `/?` prints edit hint

### Slash Variable Selection

With `--slash` in default mode:

- no extra arg: stores `_getDate`
- `-v`: stores `_getSlashDate`
- custom name: stores custom variable

Examples:

```bash
./getDate.sh --slash
./getDate.sh --slash -v
./getDate.sh --slash _customVar
```

## Example Commands

```bash
./getDate.sh
./getDate.py --full
./getDate_c /M/D
./getDate.pl /M/Q/Y 1
./getDate.sh /LM 0
./getDate.py /T
./getDate_c /Y -t
./getDate.pl /Q --season
```

## Variable Persistence Model

Linux CLI processes cannot directly modify parent shell environment variables unless sourced. To keep behavior consistent across all languages, these tools persist values to:

- `${XDG_STATE_HOME}/getDate/vars.env`, or
- `~/.local/state/getDate/vars.env`

You can inspect values with:

```bash
cat "${XDG_STATE_HOME:-$HOME/.local/state}/getDate/vars.env"
```

## Test Suite

Run cross-tool tests from repo root:

```bash
./test_getDate_tools.sh
```

The test script:

- builds `getDate.c` to `getDate_c`
- executes each tool with shared assertions
- validates output formats and error cases
- verifies persisted state file creation
