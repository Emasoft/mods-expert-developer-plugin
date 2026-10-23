#!/usr/bin/env bash
# plan-diff.sh: compare what `claude plugin validate` says a mod can touch with a plan file.
#
# usage: plan-diff.sh <mod-dir> <plan-file>
#        plan-diff.sh --from-file <validate-output> <plan-file>
#
# The first form runs `claude plugin validate <mod-dir>` (text output only). The second reads output that
# was saved earlier, so no claude binary is needed.
#
# Footprint lines are read from the output. A line counts when, after the module name, it carries one of
# these kinds as a whole label followed by a colon: calls, env reads, env writes, hooks, state reads,
# state writes (chapter mods-doc-mods-development, "Change and test a mod"). A module path with a space still
# parses. Lines labelled "gating hook ..." and "answers its own command" are ignored; any other label on a
# footprint line is an error (exit 2), so a new validate label cannot pass quietly. Lines from several
# modules are merged: the module name is not part of what gets compared.
# cspell:ignore RSTART RLENGTH
#
# Plan file: plain text, one entry per line, written as "<kind>: <item>[, <item>...]".
#   - Blank lines, and lines starting with # , are ignored.
#   - A kind outside the six above is an error (exit 2), so a misspelt kind cannot pass quietly.
#   - Items are compared one by one after the commas are split, so order does not matter. An item is
#     copied as validate prints it, for example tool.call{tool=Edit|Write} or $.store.get.
# Example:
#   hooks: session.start, tool.call{tool=Edit|Write}
#   calls: $.store.get, $.store.set
#   env reads: HOME
#
# Output: "+ <kind>: <item>" for something validate reports that the plan does not list, and
# "- <kind>: <item>" for something the plan lists that validate does not report.
# Exit codes: 0 the two agree, 1 they differ, 2 an unreadable path or plan, a validate failure, an unknown
# footprint label, or validate output with no footprint line at all (the format may have changed), 64 a usage error.
set -euo pipefail

kinds='|calls|env reads|env writes|hooks|state reads|state writes|'

usage() {
	echo "usage: plan-diff.sh <mod-dir> <plan-file>" >&2
	echo "       plan-diff.sh --from-file <validate-output> <plan-file>" >&2
	exit 64
}

die() {
	echo "plan-diff.sh: $1" >&2
	exit 2
}

from_file=""
mod_dir=""
if [ "${1:-}" = "--from-file" ]; then
	[ "$#" -eq 3 ] || usage
	from_file="$2"
	plan="$3"
	[ -f "$from_file" ] || die "not a file: $from_file"
else
	[ "$#" -eq 2 ] || usage
	mod_dir="$1"
	plan="$2"
	[ -d "$mod_dir" ] || die "not a directory: $mod_dir"
fi
[ -f "$plan" ] || die "not a file: $plan"

tmp="$(mktemp -d)"
trap 'rm -f "$tmp/validate.txt" "$tmp/got.txt" "$tmp/want.txt"; rmdir "$tmp"' EXIT

if [ -n "$from_file" ]; then
	validate_out="$from_file"
else
	command -v claude >/dev/null 2>&1 || die "claude not found on PATH"
	validate_out="$tmp/validate.txt"
	if ! claude plugin validate "$mod_dir" >"$validate_out" 2>&1; then
		cat "$validate_out" >&2
		die "claude plugin validate failed for $mod_dir"
	fi
fi

# Shared by both inputs: print one "<kind>: <item>" per item. Awk exits 2 on a bad plan line.
awk_items='
function emit(kind, rest,   n, i, parts, item) {
	n = split(rest, parts, ", ")
	for (i = 1; i <= n; i++) {
		item = parts[i]
		gsub(/^[ \t]+|[ \t\r]+$/, "", item)
		if (item != "") print kind ": " item
	}
}
'

# Only footprint-shaped lines count: optional spaces, the ❯ glyph, then the module token.
# The kind is found as a whole label ("<space>kind: ") so a module path with a space still parses.
# A footprint-shaped line whose label is neither a known kind nor an ignored label is an error.
LC_ALL=C awk -v kinds="$kinds" "$awk_items"'
BEGIN {
	kind_re = "[ \t](" substr(kinds, 2, length(kinds) - 2) "): "
	n_ign = split("gating hook with .catch|gating hook without .catch|answers its own command", ignored, "|")
}
/^[ \t]*❯[ \t]/ {
	for (j = 1; j <= n_ign; j++) if (index($0, " " ignored[j] ": ")) next
	if (match($0, kind_re)) {
		emit(substr($0, RSTART + 1, RLENGTH - 3), substr($0, RSTART + RLENGTH))
		next
	}
	line = $0
	if (sub(/^[ \t]*❯[ \t]+[^ \t]+[ \t]+/, "", line) && (i = index(line, ": ")) > 0) {
		print "plan-diff.sh: unknown footprint label: " substr(line, 1, i - 1) > "/dev/stderr"
		exit 2
	}
}
' "$validate_out" | LC_ALL=C sort -u >"$tmp/got.txt" || exit 2
[ -s "$tmp/got.txt" ] || die "no footprint line (hooks, calls, env or state) in the validate output; has its format changed?"

awk -v kinds="$kinds" "$awk_items"'
/^[ \t]*(#|$)/ { next }
{
	i = index($0, ": ")
	kind = (i == 0) ? "" : substr($0, 1, i - 1)
	if (index(kinds, "|" kind "|") == 0 || kind == "") {
		print "plan-diff.sh: plan line " NR " does not start with a known kind and a colon: " $0 > "/dev/stderr"
		exit 2
	}
	emit(kind, substr($0, i + 2))
}
' "$plan" | LC_ALL=C sort -u >"$tmp/want.txt" || die "the plan file $plan is not valid"

extra="$(LC_ALL=C comm -23 "$tmp/got.txt" "$tmp/want.txt")"
missing="$(LC_ALL=C comm -13 "$tmp/got.txt" "$tmp/want.txt")"

if [ -z "$extra" ] && [ -z "$missing" ]; then
	echo "plan-diff: the footprint matches the plan ($(wc -l <"$tmp/got.txt" | tr -d ' ') items)"
	exit 0
fi
if [ -n "$extra" ]; then
	echo "in the validate output but not in the plan:"
	printf '%s\n' "$extra" | sed 's/^/+ /'
fi
if [ -n "$missing" ]; then
	echo "in the plan but not in the validate output:"
	printf '%s\n' "$missing" | sed 's/^/- /'
fi
exit 1
