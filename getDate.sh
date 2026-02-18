#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/getDate"
STATE_FILE="$STATE_DIR/vars.env"
mkdir -p "$STATE_DIR"
touch "$STATE_FILE"

show_help() {
  cat <<'EOF'
getDate - get formatted date values and persist named variables

Usage:
  getDate.sh [options] [0|1]

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
  -e            With /? display edit hint
EOF
}

escape_value() {
  local v="$1"
  printf '%s' "$v" | sed "s/'/'\\''/g"
}

upsert_var() {
  local key="$1"
  local val="$2"
  local tmp
  tmp="$(mktemp)"
  if [[ -f "$STATE_FILE" ]]; then
    grep -v "^${key}=" "$STATE_FILE" > "$tmp" || true
  fi
  printf '%s=%s\n' "$key" "$val" >> "$tmp"
  mv "$tmp" "$STATE_FILE"
}

clear_vars() {
  : > "$STATE_FILE"
}

is_leap() {
  local y="$1"
  if (( (y % 400 == 0) || (y % 4 == 0 && y % 100 != 0) )); then
    echo 1
  else
    echo 0
  fi
}

MONTHS=(January February March April May June July August September October November December)
SEASONS=(Winter Spring Summer Fall)

args=("$@")
output_mode=1
flags=()
raw_opts=()
order_flag=""
slash_var=""

for arg in "${args[@]}"; do
  case "$arg" in
    0|1)
      output_mode="$arg"
      ;;
    --full|--slash|--leap|--clear-var|-abbrv|-t|--two-digit|--season|-e|/\?|--edit-all|-v)
      flags+=("$arg")
      ;;
    /*)
      raw_opts+=("$arg")
      ;;
    -[dmy]-[dmy]-[dmy])
      order_flag="$arg"
      ;;
    *)
      # Candidate custom variable for --slash flow
      slash_var="$arg"
      ;;
  esac
done

has_flag() {
  local f="$1"
  for item in "${flags[@]}"; do
    [[ "$item" == "$f" ]] && return 0
  done
  return 1
}

if has_flag "/?"; then
  show_help
  if has_flag "-e"; then
    echo "Edit hint: open this file to edit help text: getDate.sh"
  fi
  exit 0
fi

if has_flag "--edit-all"; then
  echo "Edit hint: edit getDate.sh and your root documentation markdown."
  exit 0
fi

if has_flag "--clear-var"; then
  clear_vars
  [[ "$output_mode" == "1" ]] && echo "Cleared getDate variables"
  exit 0
fi

now_epoch="$(date +%s)"
dd="$(date +%d)"
mm="$(date +%m)"
yyyy="$(date +%Y)"
yy="$(date +%y)"
month_idx=$((10#$mm - 1))
month_name="${MONTHS[$month_idx]}"
month_abbr="${month_name:0:3}"
quarter=$(( (10#$mm - 1) / 3 + 1 ))
season="${SEASONS[$((quarter-1))]}"

last_month_name="$(date -d "$(date +%Y-%m-01) -1 month" +%B)"
last_year="$((10#$yyyy - 1))"
next_year="$((10#$yyyy + 1))"
last_quarter="$(( quarter == 1 ? 4 : quarter - 1 ))"

if has_flag "--leap"; then
  leap="$(is_leap "$yyyy")"
  upsert_var "_checkLeapYear" "$leap"
  [[ "$output_mode" == "1" ]] && echo "$leap"
  exit 0
fi

# Expand slash-packed options like /M/D to [/M, /D]
opts=()
for ro in "${raw_opts[@]}"; do
  if [[ "$ro" == "/"*"/"* ]]; then
    IFS='/' read -r -a parts <<< "$ro"
    for p in "${parts[@]}"; do
      [[ -n "$p" ]] && opts+=("/$p")
    done
  else
    opts+=("$ro")
  fi
done

if [[ ${#opts[@]} -eq 0 ]]; then
  sep="-"
  has_flag "--slash" && sep="/"
  year="$yy"
  var_name="_getDate"

  if has_flag "--full"; then
    year="$yyyy"
    var_name="_getFullDate"
  fi

  if has_flag "--slash"; then
    if has_flag "-v" && [[ -z "$slash_var" ]]; then
      var_name="_getSlashDate"
    elif [[ -n "$slash_var" ]]; then
      var_name="$slash_var"
    fi
  fi

  default_date="${mm}${sep}${dd}${sep}${year}"
  upsert_var "$var_name" "$default_date"
  [[ "$output_mode" == "1" ]] && echo "$default_date"
  exit 0
fi

# Validate category uniqueness
count_day=0
count_month=0
count_quarter=0
count_year=0
for o in "${opts[@]}"; do
  case "$o" in
    /D|/DM) ((count_day+=1)) ;;
    /M|/LM) ((count_month+=1)) ;;
    /Q|/LQ) ((count_quarter+=1)) ;;
    /Y|/LY|/NY) ((count_year+=1)) ;;
  esac
done

if (( count_day > 1 || count_month > 1 || count_quarter > 1 || count_year > 1 )); then
  if ! (( count_day == 2 )) || [[ ! " ${opts[*]} " =~ " /D " ]] || [[ ! " ${opts[*]} " =~ " /DM " ]] || (( count_month > 1 || count_quarter > 1 || count_year > 1 )); then
    echo "Error: only one option per date type is allowed" >&2
    exit 1
  fi
fi

only_one_opt=$(( ${#opts[@]} == 1 ? 1 : 0 ))
if (( only_one_opt == 0 )); then
  for o in "${opts[@]}"; do
    if [[ "$o" == "/LQ" || "$o" == "/NY" || "$o" == "/T" ]]; then
      echo "Error: $o must be used by itself" >&2
      exit 1
    fi
  done
fi

has_D=0
has_DM=0
for o in "${opts[@]}"; do
  [[ "$o" == "/D" ]] && has_D=1
  [[ "$o" == "/DM" ]] && has_DM=1
done
if (( has_DM == 1 && has_D == 0 )); then
  echo "Error: /DM only works with /D" >&2
  exit 1
fi

outputs=()
for o in "${opts[@]}"; do
  case "$o" in
    /D)
      upsert_var "_theTwoDigitDate" "$dd"
      outputs+=("$dd")
      ;;
    /DM)
      upsert_var "_theMonth" "$mm"
      outputs+=("$mm")
      ;;
    /LM)
      upsert_var "_lastMonth" "$last_month_name"
      outputs+=("$last_month_name")
      ;;
    /LQ)
      upsert_var "_theQuarter" "Q$last_quarter"
      outputs+=("Q$last_quarter")
      ;;
    /LY)
      upsert_var "_theYear" "$last_year"
      outputs+=("$last_year")
      ;;
    /M)
      mval="$month_name"
      has_flag "-abbrv" && mval="$month_abbr"
      upsert_var "_theMonth" "$mval"
      outputs+=("$mval")
      ;;
    /NY)
      upsert_var "_theYear" "$next_year"
      outputs+=("$next_year")
      ;;
    /Q)
      qval="Q$quarter"
      if has_flag "--season"; then
        qval="$season"
      fi
      upsert_var "_theQuarter" "$qval"
      outputs+=("$qval")
      ;;
    /T)
      d="$dd"; m="$mm"; y="$yyyy"
      if [[ -n "$order_flag" ]]; then
        IFS='-' read -r a b c <<< "${order_flag#-}"
      else
        a="m"; b="d"; c="y"
      fi
      piece() {
        case "$1" in d) echo "$d" ;; m) echo "$m" ;; y) echo "$y" ;; *) echo "$m" ;; esac
      }
      tval="$(piece "$a")/$(piece "$b")/$(piece "$c")"
      outputs+=("$tval")
      ;;
    /Y)
      yval="$yyyy"
      if has_flag "-t" || has_flag "--two-digit"; then
        yval="$yy"
      fi
      upsert_var "_theYear" "$yval"
      outputs+=("$yval")
      ;;
    *)
      echo "Error: unknown option $o" >&2
      exit 1
      ;;
  esac
done

if [[ "$output_mode" == "1" && ${#outputs[@]} -gt 0 ]]; then
  (IFS=' '; echo "${outputs[*]}")
fi
