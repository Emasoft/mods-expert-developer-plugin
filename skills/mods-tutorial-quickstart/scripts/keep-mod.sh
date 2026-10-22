#!/usr/bin/env bash
# keep-mod.sh <session-mod-dir> <dest-root>: copy a mod out of the session mods folder
# (deleted after cleanupPeriodDays) into <dest-root>/<name>. Never deletes, never overwrites.
# Left out of the copy: .claude-plugin/types/ and the root tsconfig.json, which Claude Code
# writes on every load. Usage errors exit 64. A failed copy leaves .keep-mod.<pid> in <dest-root>
# (kept, never deleted) and the error message names it.
set -E
set -euo pipefail
shopt -s dotglob nullglob

if [ "$#" -ne 2 ]; then
	echo "usage: keep-mod.sh <session-mod-dir> <dest-root>" >&2
	exit 64
fi
if [ ! -d "$1" ]; then
	echo "keep-mod.sh: not a directory: $1" >&2
	exit 64
fi
src="$(cd "$1" && pwd -P)"
mkdir -p "$2"
dest_root="$(cd "$2" && pwd -P)"
dest="$dest_root/$(basename "$src")"

if [ -e "$dest" ]; then
	echo "keep-mod.sh: refusing to overwrite existing $dest" >&2
	exit 1
fi

# Copy into a temporary folder and move it into place last, so a failed copy never leaves a
# half-filled destination that would block a retry. On failure the folder is kept, not deleted.
tmp="$dest_root/.keep-mod.$$"
trap 'echo "keep-mod.sh: copy failed; partial copy left at $tmp" >&2' ERR
mkdir "$tmp"
for entry in "$src"/*; do
	name="$(basename "$entry")"
	case "$name" in
	tsconfig.json) continue ;;
	.claude-plugin)
		mkdir "$tmp/.claude-plugin"
		for inner in "$entry"/*; do
			[ "$(basename "$inner")" = "types" ] && continue
			cp -R "$inner" "$tmp/.claude-plugin/"
		done
		;;
	*) cp -R "$entry" "$tmp/" ;;
	esac
done
# Claim the destination atomically: mkdir fails if $dest appeared after the check above, so the
# move below can never nest $tmp inside an existing folder. The cause decides the message: an
# existing $dest is a refusal, anything else (permissions, full disk) is a creation failure.
if ! mkdir "$dest" 2>/dev/null; then
	trap - ERR
	if [ -e "$dest" ]; then
		echo "keep-mod.sh: refusing to overwrite existing $dest; the finished copy is kept at $tmp" >&2
	else
		echo "keep-mod.sh: cannot create $dest; the finished copy is kept at $tmp" >&2
	fi
	exit 1
fi
# From here a failure leaves files in both folders, so the copy-failed message would be false.
trap 'echo "keep-mod.sh: move failed; files are split between $tmp and $dest" >&2' ERR
for entry in "$tmp"/*; do mv "$entry" "$dest/"; done
rmdir "$tmp"
trap - ERR

echo "kept: $dest"
echo "left out: tsconfig.json, .claude-plugin/types/ (Claude Code regenerates them on load)"
links="$(find "$dest" -type l)"
if [ -n "$links" ]; then
	echo "warning: symlinks in the copy may point into the session folder:"
	echo "$links"
fi
echo "Add it to the colon-separated list of mod folders:"
echo "export CLAUDE_CODE_PLUGIN_DIRS=\"\${CLAUDE_CODE_PLUGIN_DIRS:+\$CLAUDE_CODE_PLUGIN_DIRS:}$dest\""
