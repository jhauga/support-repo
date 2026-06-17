#!/usr/bin/env bash
# fix-broken-links — link-fix.sh
#
# Before each Copilot prompt: find changed web files, extract every http(s) URL,
# and check each with curl. For any URL that does not return 200, try spelling
# variations (http/https, www, trailing slash) then a DuckDuckGo lookup, and
# present an interactive menu to replace, remove (keep anchor text), or skip.
# Generic anchor text is flagged as an SEO note.
#
# Pure bash + grep/sed/curl. No other languages.
# Covers: HTML · Markdown · JS/TS · JSON · CSS · SQL · templates (all via URL scan)
# Requires: curl, grep, sed  |  Trigger: userPromptSubmitted
set -uo pipefail

LIMIT=50
TIMEOUT=10
UA='Mozilla/5.0 (compatible; fix-broken-links/1.0)'
WEB_RE='\.(html?|xhtml|md|markdown|mdx|js|jsx|ts|tsx|vue|svelte|json|jsonl|css|sql|erb|jinja|j2|twig|ejs|pug|hbs)$'

command -v curl >/dev/null 2>&1 || { printf 'fix-broken-links: curl not found\n' >&2; exit 0; }

# Interactive input comes from the terminal, since stdin may carry hook JSON.
# Probe by actually opening /dev/tty — a mere -r/-w test can pass where open fails.
TTY=/dev/tty
if { true >/dev/tty; } 2>/dev/null && { true </dev/tty; } 2>/dev/null; then
  TTY=/dev/tty
else
  TTY=""
fi
ask() {
  local p="$1" ans=""
  [ -z "$TTY" ] && { printf '%s' ""; return; }
  printf '%s' "$p" > "$TTY"
  IFS= read -r ans < "$TTY" || ans=""
  printf '%s' "$ans"
}

# ── Helpers ───────────────────────────────────────────────────────────────────

http_status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" --location -A "$UA" "$1" 2>/dev/null
}

# Escape ERE metacharacters so a literal string can be used safely inside a bash
# [[ =~ ]] pattern. Only true metacharacters are escaped — backslash-escaping an
# ordinary character (e.g. '\:') is undefined in ERE and would fail to match.
re_escape() {
  local s="$1" out="" c i bs='\' meta='.^$*+?()[]{}|\'
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    if [[ "$meta" == *"$c"* ]]; then out+="$bs$c"; else out+="$c"; fi
  done
  printf '%s' "$out"
}

# Read an entire file into a variable, preserving newlines.
read_file() { IFS= read -rd '' "$1" < "$2" || true; }

# Print every http(s) URL in a file, trailing punctuation trimmed, de-duplicated.
extract_urls() {
  grep -oiE 'https?://[^"'\''<> )]+' "$1" 2>/dev/null \
    | sed -E 's/[.,;:]+$//' \
    | sort -u
}

# Generic anchor text that weakens SEO.
seo_scan() {
  grep -oiE '<a[^>]*>[[:space:]]*(click here|click|here|read more|more|this page|this|learn more|see more|view|visit|details|info)[[:space:]]*</a>' "$1" 2>/dev/null
  grep -oiE '\[(click here|click|here|read more|more|this page|learn more|see more|details|info)\]\(' "$1" 2>/dev/null
}

# Try common URL variations; echo the first that returns 200, else nothing.
find_variation() {
  local url="$1" scheme rest host path cand
  scheme="${url%%://*}"
  rest="${url#*://}"
  host="${rest%%/*}"
  if [ "$rest" = "$host" ]; then path=""; else path="/${rest#*/}"; fi

  local cands=()
  case "$scheme" in
    http)  cands+=("https://${host}${path}") ;;
    https) cands+=("http://${host}${path}") ;;
  esac
  if [[ "$host" == www.* ]]; then
    cands+=("${scheme}://${host#www.}${path}")
  else
    cands+=("${scheme}://www.${host}${path}")
  fi
  if [ -n "$path" ] && [[ "$path" != */ ]] && [[ "${path##*/}" != *.* ]]; then
    cands+=("${url%/}/")
  fi

  for cand in "${cands[@]}"; do
    [ "$cand" = "$url" ] && continue
    [ "$(http_status "$cand")" = "200" ] && { printf '%s' "$cand"; return 0; }
  done
  return 1
}

# Query DuckDuckGo for a replacement; echo a URL or nothing.
ddg_search() {
  local url="$1" rest host slug q enc
  rest="${url#*://}"
  host="${rest%%/*}"; host="${host#www.}"
  slug="${rest#*/}"; [ "$slug" = "$rest" ] && slug=""
  q="${host%%.*} ${slug//\// }"
  enc="$(printf '%s' "$q" | sed -E 's/[^a-zA-Z0-9]+/+/g; s/^\+//; s/\+$//')"
  [ -z "$enc" ] && return 1
  curl -s --max-time 8 "https://api.duckduckgo.com/?q=${enc}&format=json&no_redirect=1&no_html=1" 2>/dev/null \
    | grep -oE '"AbstractURL":"[^"]+"' \
    | head -1 \
    | sed -E 's/.*:"([^"]+)"/\1/; s#\\/#/#g'
}

# Replace a literal URL everywhere in a file (pure bash, no regex).
replace_url() {
  local file="$1" old="$2" new="$3" content
  read_file content "$file"
  printf '%s' "${content//"$old"/"$new"}" > "$file"
}

# Remove the link wrapper but keep the visible text:
#   <a href="URL">text</a>  ->  text
#   [text](URL)             ->  text
# Each matched wrapper is swapped for its inner text via literal replacement.
remove_link() {
  local file="$1" url="$2" content esc re
  read_file content "$file"
  esc="$(re_escape "$url")"
  for re in \
    '<a[^>]*href="'"$esc"'"[^>]*>([^<]*)</a>' \
    "<a[^>]*href='${esc}'[^>]*>([^<]*)</a>" \
    '\[([^]]*)\]\('"$esc"'[^)]*\)'; do
    while [[ $content =~ $re ]]; do
      content="${content//"${BASH_REMATCH[0]}"/"${BASH_REMATCH[1]}"}"
    done
  done
  printf '%s' "$content" > "$file"
}

# ── File discovery ────────────────────────────────────────────────────────────

collect_input() {
  if [ "$#" -gt 0 ]; then printf '%s\n' "$@"; return; fi
  local out=""
  if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    out="$({ git diff --name-only HEAD; git diff --name-only --cached; } 2>/dev/null)"
  fi
  if [ -n "$out" ]; then printf '%s\n' "$out"; return; fi
  find . -type d \( -name .git -o -name node_modules -o -name dist -o -name build \
    -o -name .next -o -name .venv -o -name __pycache__ \) -prune \
    -o -type f -print 2>/dev/null
}

declare -A SEEN
FILES=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  case "$f" in */node_modules/*|*/.git/*|*/dist/*|*/build/*) continue ;; esac
  printf '%s\n' "$f" | grep -qiE "$WEB_RE" || continue
  [ -n "${SEEN[$f]:-}" ] && continue
  SEEN[$f]=1
  FILES+=("$f")
done < <(collect_input "$@")

[ "${#FILES[@]}" -eq 0 ] && exit 0

# ── Scan ──────────────────────────────────────────────────────────────────────

B_FILE=(); B_URL=(); B_STATUS=(); B_ALT=()
SEO_LINES=()

for file in "${FILES[@]}"; do
  while IFS= read -r line; do
    [ -n "$line" ] && SEO_LINES+=("$file: $line")
  done < <(seo_scan "$file")

  mapfile -t urls < <(extract_urls "$file")
  [ "${#urls[@]}" -eq 0 ] && continue

  if [ "${#urls[@]}" -gt "$LIMIT" ]; then
    ans="$(ask "  ${file} has ${#urls[@]} links (limit ${LIMIT}). Continue? [Y/n] ")"
    case "$ans" in n|N|no|NO) continue ;; esac
  fi

  printf '\n  Checking %d link(s) in %s ...\n' "${#urls[@]}" "$file"
  for url in "${urls[@]}"; do
    status="$(http_status "$url")"
    [ "$status" = "200" ] && continue
    printf '    BROKEN (%s) %s\n' "$status" "$url"
    alt="$(find_variation "$url")" || alt=""
    [ -z "$alt" ] && alt="$(ddg_search "$url")"
    B_FILE+=("$file"); B_URL+=("$url"); B_STATUS+=("$status"); B_ALT+=("$alt")
  done
done

# ── SEO report ────────────────────────────────────────────────────────────────

if [ "${#SEO_LINES[@]}" -gt 0 ]; then
  printf '\n%s\n  SEO anchor issues (consider descriptive link text)\n' "------------------------------------------------------------"
  for s in "${SEO_LINES[@]}"; do printf '    %s\n' "$s"; done
fi

if [ "${#B_URL[@]}" -eq 0 ]; then
  printf '\n  No broken links found.\n\n'
  exit 0
fi

# ── Interactive fix ───────────────────────────────────────────────────────────

printf '\n%s\n  fix-broken-links report\n%s\n' "============================================================" "============================================================"

declare -A CHANGED
n="${#B_URL[@]}"
for ((i=0; i<n; i++)); do
  file="${B_FILE[$i]}"; url="${B_URL[$i]}"; status="${B_STATUS[$i]}"; alt="${B_ALT[$i]}"
  printf '\n  [%d] %s\n' "$((i+1))" "$file"
  printf '    URL : %s\n' "$url"
  note=""; case "$status" in ERR|000|TIMEOUT) note="  (unreachable)" ;; esac
  printf '    HTTP: %s%s\n' "$status" "$note"
  [ -n "$alt" ] && printf '    Alt : %s\n' "$alt"
  printf '\n'
  [ -n "$alt" ] && printf '    r  Replace -> %s\n' "$alt"
  printf '    d  Remove link, keep text\n'
  printf '    c  Custom replacement URL\n'
  printf '    s  Skip\n'

  if [ -z "$TTY" ]; then
    printf '    (no terminal — reporting only)\n'
    continue
  fi

  while true; do
    ch="$(ask '  > ')"
    case "$ch" in
      s|"") break ;;
      d) remove_link "$file" "$url"; CHANGED[$file]=1; printf '    removed\n'; break ;;
      r) if [ -n "$alt" ]; then replace_url "$file" "$url" "$alt"; CHANGED[$file]=1; printf '    replaced\n'; break; fi
         printf '    no suggestion available\n' ;;
      c) u="$(ask '  URL: ')"
         if [ -n "$u" ]; then replace_url "$file" "$url" "$u"; CHANGED[$file]=1; printf '    replaced\n'; break; fi ;;
      *) printf '    invalid choice\n' ;;
    esac
  done
done

if [ "${CHANGED[*]+x}" = x ] && [ "${#CHANGED[@]}" -gt 0 ]; then
  printf '\n  %d file(s) updated:\n' "${#CHANGED[@]}"
  for f in "${!CHANGED[@]}"; do printf '    %s\n' "$f"; done
  printf '\n'
fi
exit 0
