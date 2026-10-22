#!/usr/bin/env bash
# new-mod.sh <example-name> <target-dir> <mod-name>: copy one of this plugin's tutorial
# examples to <target-dir>/<mod-name> and give the copy its own plugin name.
# Never deletes anything. Only .claude-plugin/plugin.json and README.md are rewritten; every
# other place that still holds the old name is printed for you to review. Usage errors exit 64.
set -euo pipefail

if [ "$#" -ne 3 ]; then
	echo "usage: new-mod.sh <example-name> <target-dir> <mod-name>" >&2
	exit 64
fi
example="$1"
mod_name="$3"

if ! [[ "$mod_name" =~ ^[a-z][a-z0-9-]{1,40}$ ]]; then
	echo "new-mod.sh: invalid mod name \"$mod_name\" (must match ^[a-z][a-z0-9-]{1,40}\$)" >&2
	exit 64
fi
if ! [[ "$example" =~ ^[a-z][a-z0-9-]*$ ]]; then
	echo "new-mod.sh: invalid example name \"$example\"" >&2
	exit 64
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
skills_dir="$(dirname "$(dirname "$script_dir")")"
found=()
for candidate in "$skills_dir"/mods-tutorial-*/examples/"$example"; do
	[ -d "$candidate" ] && found+=("$candidate")
done
if [ "${#found[@]}" -ne 1 ]; then
	echo "new-mod.sh: expected exactly one example named $example, found ${#found[@]}" >&2
	exit 1
fi
src="${found[0]}"

mkdir -p "$2"
target_root="$(cd "$2" && pwd -P)"
target="$target_root/$mod_name"
if [ -e "$target" ]; then
	echo "new-mod.sh: refusing to overwrite existing $target" >&2
	exit 1
fi

cp -R "$src" "$target"

# Exact-token replace: the name must not touch another name character on either side.
for file in "$target/.claude-plugin/plugin.json" "$target/README.md"; do
	[ -f "$file" ] || continue
	OLD="$example" NEW="$mod_name" perl -pi -e 's/(?<![\w-])\Q$ENV{OLD}\E(?![\w-])/$ENV{NEW}/g' "$file"
done

echo "created: $target"
if grep -rnIF --exclude-dir=node_modules -- "$example" "$target"; then
	echo "The lines above still hold the old name \"$example\"; review them by hand."
	echo "Rename any command or tool names before loading the copy alongside the original."
fi
