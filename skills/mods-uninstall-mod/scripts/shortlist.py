#!/usr/bin/env python3
"""Print the installed plugins whose id matches a search text, for the mods-uninstall-mod skill (TRDD-7YXW2QZC).

Usage: python3 -I "${CLAUDE_PLUGIN_ROOT}/skills/mods-uninstall-mod/scripts/shortlist.py" '<search text>'

One script instead of a shell pipeline, so that one exact allowed-tools rule covers the whole read: a pipeline with
$(...) and | jq needs every one of its parts allowed, and the skill must not grant Bash wholesale (owner question Q3,
"Yes, scope it"). `claude plugin list --json` lists every installed plugin, over 500 entries on a busy machine, so
the filter runs here and the model sees only the shortlist.

Output: one line per candidate, id, scope and projectPath (or -) separated by tabs and escaped as jq's @tsv escapes,
at most 10, sorted by id and scope. No line means no installed plugin matches. Exit 2: the search text is refused
(outside the pattern, or with no letter or digit), and claude is not run. Exit 1: claude could not list the plugins,
or its output could not be read.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys

SEARCH_TEXT = re.compile(r"^[A-Za-z0-9 ._@/-]+$")
LIMIT = 10


def normalize(text: str) -> str:
    """Lowercase, without spaces, -, _ and . (the same rule for the search text and for each id)."""
    return re.sub(r"[ ._-]", "", text.lower())


def shortlist(entries: list[dict], text: str, here: str, real: str) -> list[tuple[str, str, str]]:
    """The candidates among `entries`, the parsed `claude plugin list --json`.

    An id matches when it contains the search text, both normalized. user and synced entries are kept (the skill
    stops on synced and says why); local and project entries only when their projectPath is the current folder:
    `here` (the path as the shell names it), `real` (symlinks resolved), or a projectPath that resolves to `real`,
    because the repository can be reached through a symlink and the list may hold either spelling. The scope filter
    runs before the cut at LIMIT: the list also holds local entries of other folders, which would otherwise take the
    rows. One row per id and scope, the first entry's, as the uninstall acts on an id and a scope. A missing
    projectPath is shown as -, and an empty one stays empty, as the jq filter this replaces did with
    `.projectPath // "-"`.
    """
    query = normalize(text)
    kept: dict[tuple[str, str], str] = {}
    for entry in entries:
        scope = entry.get("scope")
        if query not in normalize(entry["id"]):
            continue
        path = entry.get("projectPath")
        here_too = isinstance(path, str) and path != "" and (path in (here, real) or os.path.realpath(path) == real)
        if scope in ("user", "synced") or (scope in ("local", "project") and here_too):
            kept.setdefault((entry["id"], scope), "-" if path is None else path)
    return [(plugin, scope, path) for (plugin, scope), path in sorted(kept.items())][:LIMIT]


def current_folder() -> tuple[str, str]:
    """(the current folder as the shell names it, the same folder with symlinks resolved)."""
    real = os.path.realpath(os.getcwd())
    logical = os.environ.get("PWD", "")
    here = logical if logical and os.path.isdir(logical) and os.path.samefile(logical, real) else real
    return here, real



def tsv(field: str) -> str:
    """The field as jq's @tsv writes it, so a tab, a line break or a backslash in a path cannot split or shift a row."""
    return field.replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "\\r")


def main(argv: list[str]) -> int:
    # A text with no letter or digit normalizes to nothing, or to a lone @ or /, and would match every installed id.
    if len(argv) != 2 or not SEARCH_TEXT.match(argv[1]) or not re.search(r"[A-Za-z0-9]", argv[1]):
        print("refused: give one search text made of letters, digits, spaces and . _ @ / -, with a letter or a digit", file=sys.stderr)
        return 2
    try:
        # 90 s, under the 2-minute default of the Bash tool that runs this script, so the script reports a hang itself.
        listed = subprocess.run(["claude", "plugin", "list", "--json"], capture_output=True, text=True, timeout=90, check=False)
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"claude plugin list --json did not run: {error}", file=sys.stderr)
        return 1
    except ValueError as error:
        # text=True decodes the output: bytes that are not UTF-8 raise UnicodeDecodeError, a ValueError.
        print(f"claude plugin list --json gave output this script cannot read: {error!r}", file=sys.stderr)
        return 1
    if listed.returncode != 0:
        print(f"claude plugin list --json exited {listed.returncode}: {listed.stderr.strip() or listed.stdout.strip()}", file=sys.stderr)
        return 1
    here, real = current_folder()
    try:
        rows = shortlist(json.loads(listed.stdout), argv[1], here, real)
    except (ValueError, KeyError, TypeError, AttributeError) as error:
        # One line, as step 3 promises for exit 1, not a traceback: a list this script cannot read is reported, not guessed at.
        print(f"claude plugin list --json gave output this script cannot read: {error!r}", file=sys.stderr)
        return 1
    for row in rows:
        print("\t".join(tsv(field) for field in row))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
