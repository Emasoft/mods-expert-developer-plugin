#!/usr/bin/env bash
# check-mod.sh <mod-dir>: one gate for a mod. Type-checks it, validates it, runs its tests.
# Prints one final line, "== PASS" or "== FAIL: <step>", and exits 0 or 1. Usage errors exit 64.
# The first run needs network access to npm (npx -y -p typescript@5 fetches typescript).
# Hook-file path comparison assumes macOS or Linux style absolute paths.
set -euo pipefail

if [ "$#" -ne 1 ]; then
	echo "usage: check-mod.sh <mod-dir>" >&2
	exit 64
fi
if [ ! -d "$1" ]; then
	echo "check-mod.sh: not a directory: $1" >&2
	exit 64
fi
mod_dir="$(cd "$1" && pwd -P)"

fail() {
	echo "== FAIL: $1"
	exit 1
}

# The generated types folder exists only after Claude Code has loaded the mod once (chapter
# mods-doc-mods-development, "Get type definitions for your version"); no command writes it without a load.
# Prints the missing path and returns 0 when the tsconfig extends a string path that starts at
# .claude-plugin/types/ (with or without ./) and the file is absent. An array-form extends or a
# look-alike path is not matched here and falls through to tsc.
types_missing() {
	local extends
	extends="$(grep -oE "\"extends\"[[:space:]]*:[[:space:]]*\"(\./)?\.claude-plugin/types/[^\"]*\"" "$mod_dir/tsconfig.json" | sed "s/.*:[[:space:]]*\"//; s/\"\$//" || true)"
	[ -n "$extends" ] || return 1
	[ -e "$mod_dir/$extends" ] && return 1
	echo "$mod_dir/$extends"
}

# Step 1: type-check. Same form the mods-doc-mods-development chapter documents:
# npx -p typescript@5 tsc. --listFiles lets us prove the hooks were actually checked,
# because a tsconfig that matches no hook file makes tsc pass on zero files.
if [ -f "$mod_dir/tsconfig.json" ]; then
	if missing="$(types_missing)"; then
		echo "missing: $missing"
		fail "tsc (types not generated yet: load the mod once with claude --plugin-dir $mod_dir so Claude Code writes .claude-plugin/types/, then re-run)"
	fi
	tsc_out="$(mktemp)"
	trap 'rm -f "$tsc_out"' EXIT
	tsc_rc=0
	npx -y -p typescript@5 tsc --noEmit --listFiles -p "$mod_dir" >"$tsc_out" 2>&1 || tsc_rc=$?
	if [ "$tsc_rc" -ne 0 ]; then
		cat "$tsc_out"
		fail "tsc"
	fi
	hook_count=0
	checked_count=0
	for hook in "$mod_dir"/hooks/*.ts "$mod_dir"/hooks/*.tsx; do
		[ -f "$hook" ] || continue
		hook_count=$((hook_count + 1))
		# tsc prints physical paths, so compare against the pwd -P form of the mod dir.
		if grep -qxF -- "$hook" "$tsc_out"; then
			checked_count=$((checked_count + 1))
		fi
	done
	if [ "$hook_count" -eq 0 ]; then
		echo "tsc: no hooks/*.ts|tsx to prove; proof skipped"
	elif [ "$checked_count" -eq 0 ]; then
		echo "tsc checked none of the $hook_count hooks/*.ts|tsx files in $mod_dir"
		fail "tsc checked no hook files"
	else
		echo "tsc: $checked_count of $hook_count hook files checked"
	fi
else
	echo "tsc: skipped, no tsconfig.json in $mod_dir"
fi

# Step 2: the claude CLI steps.
if ! command -v claude >/dev/null 2>&1; then
	echo "== FAIL: claude not found"
	exit 1
fi
claude plugin validate "$mod_dir" || fail "claude plugin validate"
claude plugin test "$mod_dir" || fail "claude plugin test"

echo "== PASS"
