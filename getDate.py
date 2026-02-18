#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
from pathlib import Path

STATE_DIR = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local" / "state")) / "getDate"
STATE_FILE = STATE_DIR / "vars.env"

MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
SEASONS = ["Winter", "Spring", "Summer", "Fall"]


def ensure_state() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.touch(exist_ok=True)


def load_vars() -> dict[str, str]:
    ensure_state()
    out: dict[str, str] = {}
    for line in STATE_FILE.read_text(encoding="utf-8").splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            out[key.strip()] = value.strip()
    return out


def save_vars(values: dict[str, str]) -> None:
    ensure_state()
    lines = [f"{key}={value}" for key, value in sorted(values.items())]
    STATE_FILE.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def upsert_var(key: str, value: str) -> None:
    data = load_vars()
    data[key] = value
    save_vars(data)


def clear_vars() -> None:
    ensure_state()
    STATE_FILE.write_text("", encoding="utf-8")


def is_leap(year: int) -> int:
    return int((year % 400 == 0) or (year % 4 == 0 and year % 100 != 0))


def show_help() -> None:
    print(
        """getDate - get formatted date values and persist named variables

Usage:
  getDate.py [options] [0|1]

Date options:
  /D   Day of month (two digits)
  /DM  Month as two digits (only valid with /D)
  /LM  Last month name
  /LQ  Last quarter (must be used alone)
  /LY  Last year (4-digit)
  /M   Current month name
  /NY  Next year (must be used alone)
  /Q   Current quarter
  /T   Terminal date format MM/DD/YYYY (must be used alone)
  /Y   Current year (4-digit, or 2-digit with -t/--two-digit)

Flags:
  --full        Default format uses YYYY (MM-DD-YYYY)
  --slash       Default format uses / instead of -
  --leap        Store leap check result in _checkLeapYear
  --clear-var   Clear persisted getDate variables
  -abbrv        Abbreviate month name (for /M)
  -t, --two-digit  Two-digit year when used with /Y
  --season      Use season name with /Q
  -v [var]      With --slash default mode, use _getSlashDate or custom var name
  /?            Show help
  -e            With /? display edit hint"""
    )


def parse_date_options(argv: list[str]) -> list[str]:
    opts: list[str] = []
    for arg in argv:
        if arg.startswith("/") and arg not in {"/?"}:
            if arg.count("/") > 1:
                parts = [p for p in arg.split("/") if p]
                opts.extend([f"/{p}" for p in parts])
            else:
                opts.append(arg)
    return opts


def main(argv: list[str]) -> int:
    if "/?" in argv:
        show_help()
        if "-e" in argv:
            print("Edit hint: open getDate.py to edit help text")
        return 0

    if "--edit-all" in argv:
        print("Edit hint: edit getDate.py and your root documentation markdown.")
        return 0

    output_mode = "1"
    for arg in argv:
        if arg in {"0", "1"}:
            output_mode = arg

    if "--clear-var" in argv:
        clear_vars()
        if output_mode == "1":
            print("Cleared getDate variables")
        return 0

    today = dt.date.today()
    dd = f"{today.day:02d}"
    mm = f"{today.month:02d}"
    yyyy = f"{today.year:04d}"
    yy = f"{today.year % 100:02d}"
    month_name = MONTHS[today.month - 1]
    month_abbr = month_name[:3]
    quarter = (today.month - 1) // 3 + 1
    season = SEASONS[quarter - 1]

    if today.month == 1:
        last_month = MONTHS[11]
    else:
        last_month = MONTHS[today.month - 2]

    last_year = str(today.year - 1)
    next_year = str(today.year + 1)
    last_quarter = f"Q{4 if quarter == 1 else quarter - 1}"

    if "--leap" in argv:
        value = str(is_leap(today.year))
        upsert_var("_checkLeapYear", value)
        if output_mode == "1":
            print(value)
        return 0

    opts = parse_date_options(argv)

    slash_var = ""
    if "-v" in argv:
        for i, arg in enumerate(argv):
            if arg == "-v" and i + 1 < len(argv):
                nxt = argv[i + 1]
                if not nxt.startswith("-") and not nxt.startswith("/") and nxt not in {"0", "1"}:
                    slash_var = nxt

    if not opts:
        sep = "/" if "--slash" in argv else "-"
        year = yyyy if "--full" in argv else yy
        var_name = "_getFullDate" if "--full" in argv else "_getDate"

        if "--slash" in argv:
            if "-v" in argv and not slash_var:
                var_name = "_getSlashDate"
            elif slash_var:
                var_name = slash_var

        default_date = f"{mm}{sep}{dd}{sep}{year}"
        upsert_var(var_name, default_date)
        if output_mode == "1":
            print(default_date)
        return 0

    count_day = sum(1 for o in opts if o in {"/D", "/DM"})
    count_month = sum(1 for o in opts if o in {"/M", "/LM"})
    count_quarter = sum(1 for o in opts if o in {"/Q", "/LQ"})
    count_year = sum(1 for o in opts if o in {"/Y", "/LY", "/NY"})
    if any(c > 1 for c in (count_day, count_month, count_quarter, count_year)):
        allow_day_pair = count_day == 2 and "/D" in opts and "/DM" in opts
        if not (allow_day_pair and count_month <= 1 and count_quarter <= 1 and count_year <= 1):
            print("Error: only one option per date type is allowed", file=sys.stderr)
            return 1

    if len(opts) > 1 and any(o in {"/LQ", "/NY", "/T"} for o in opts):
        print("Error: /LQ, /NY, and /T must be used by themselves", file=sys.stderr)
        return 1

    if "/DM" in opts and "/D" not in opts:
        print("Error: /DM only works with /D", file=sys.stderr)
        return 1

    order_flag = next((arg for arg in argv if arg.startswith("-") and arg.count("-") == 3 and set(arg.replace("-", "")) <= {"d", "m", "y"}), "")

    outputs: list[str] = []
    for opt in opts:
        if opt == "/D":
            upsert_var("_theTwoDigitDate", dd)
            outputs.append(dd)
        elif opt == "/DM":
            upsert_var("_theMonth", mm)
            outputs.append(mm)
        elif opt == "/LM":
            upsert_var("_lastMonth", last_month)
            outputs.append(last_month)
        elif opt == "/LQ":
            upsert_var("_theQuarter", last_quarter)
            outputs.append(last_quarter)
        elif opt == "/LY":
            upsert_var("_theYear", last_year)
            outputs.append(last_year)
        elif opt == "/M":
            value = month_abbr if "-abbrv" in argv else month_name
            upsert_var("_theMonth", value)
            outputs.append(value)
        elif opt == "/NY":
            upsert_var("_theYear", next_year)
            outputs.append(next_year)
        elif opt == "/Q":
            qval = season if "--season" in argv else f"Q{quarter}"
            upsert_var("_theQuarter", qval)
            outputs.append(qval)
        elif opt == "/T":
            parts = {"d": dd, "m": mm, "y": yyyy}
            if order_flag:
                order = order_flag[1:].split("-")
            else:
                order = ["m", "d", "y"]
            outputs.append("/".join(parts.get(k, mm) for k in order))
        elif opt == "/Y":
            yval = yy if ("-t" in argv or "--two-digit" in argv) else yyyy
            upsert_var("_theYear", yval)
            outputs.append(yval)
        else:
            print(f"Error: unknown option {opt}", file=sys.stderr)
            return 1

    if output_mode == "1" and outputs:
        print(" ".join(outputs))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
