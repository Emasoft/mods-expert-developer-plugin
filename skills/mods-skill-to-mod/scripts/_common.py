#!/usr/bin/env python3
"""Shared helpers of the mods-skill-to-mod scripts.

Adapted from skills/skill-to-mod/scripts/_common.py of arm-pz/skill-to-mod (MIT, see NOTICE).
The entry scripts import this file from ${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/scripts and
call require_same_install() first, so a path is never guessed from where a file happens to be.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

MIN_CLAUDE_CODE = (2, 1, 287)  # the release that introduced mods (chapter skill mods-doc-mods-development)
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,62}$")
# The shape of a skill or command name. Use fullmatch, not match: match checks only the start of the text, so a valid
# name followed by a line break and more text would pass.
SKILL_NAME_RE = re.compile(r"[a-z0-9][a-z0-9-]{0,63}")
SKILL_REL = Path("skills") / "mods-skill-to-mod"
RUN_HINT = (
    'Run it the way the mods-skill-to-mod skill shows, with CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" '
    "in front of python3."
)


def plugin_root() -> Path:
    """The install folder of mods-expert-developer-plugin, from CLAUDE_PLUGIN_ROOT (already checked by the entry script)."""
    return Path(os.environ["CLAUDE_PLUGIN_ROOT"]).resolve()


def skill_dir() -> Path:
    """This skill's own folder inside the install folder."""
    return plugin_root() / SKILL_REL


def require_same_install(script: str) -> None:
    """Exit 2 unless `script` is the copy under CLAUDE_PLUGIN_ROOT.

    The sibling files are read from CLAUDE_PLUGIN_ROOT; a script run from another install would mix the
    two versions without saying so.
    """
    here = Path(script).resolve().parent
    expected = (skill_dir() / "scripts").resolve()
    if here != expected:
        print(
            f"error: this script is in {here}, but CLAUDE_PLUGIN_ROOT points at {plugin_root()}, "
            f"whose copy is in {expected}. {RUN_HINT}",
            file=sys.stderr,
        )
        sys.exit(2)


def inside_plugin_root(path: Path) -> bool:
    """True when `path` is the install folder or inside it.

    CLAUDE_PLUGIN_ROOT is replaced on every plugin update, so nothing may be written there: no generated
    mod, no README rewrite, no state (chapter skill mods-doc-plugin-manifest-reference).
    """
    root = plugin_root()
    target = path.expanduser().resolve()
    return target == root or root in target.parents


def find_skill_md(path: str | Path) -> Path | None:
    """Accept a folder holding SKILL.md, or the SKILL.md file itself."""
    p = Path(path).expanduser()
    if p.is_file() and p.name == "SKILL.md":
        return p
    if p.is_dir() and (p / "SKILL.md").is_file():
        return p / "SKILL.md"
    return None


def parse_frontmatter(text: str) -> tuple[dict[str, str], str, list[str]]:
    """Return (frontmatter dict, body, problems). A small YAML subset: scalars and > | blocks."""
    problems: list[str] = []
    m = re.match(r"^---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|$)(.*)$", text, re.S)
    if not m:
        return {}, text, ["SKILL.md has no YAML frontmatter between --- lines"]
    block, body = m.group(1), m.group(2)
    fm: dict[str, str] = {}
    key: str | None = None
    style: str | None = None
    buf: list[str] = []

    def flush() -> None:
        nonlocal key, style, buf
        if key is None:
            return
        if style == "|":
            fm[key] = "\n".join(buf).strip()
        elif style == ">":
            fm[key] = " ".join(s.strip() for s in buf if s.strip()).strip()
        else:
            fm[key] = " ".join(s.strip() for s in buf).strip()
        key, style, buf = None, None, []

    for line in block.splitlines():
        top = re.match(r"^([A-Za-z0-9_.-]+):[ \t]*(.*)$", line)
        if top and not line.startswith((" ", "\t")):
            flush()
            key, value = top.group(1), top.group(2).strip()
            if re.match(r"^[>|][+-]?$", value):
                style = value[0]
                buf = []
            else:
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                style = None
                buf = [value]
        elif key is not None:
            buf.append(line)
    flush()
    return fm, body, problems


def claude_version() -> tuple[int, ...] | None:
    """The installed Claude Code version as a tuple, or None if it can't be read."""
    try:
        out = subprocess.run(["claude", "--version"], capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    m = re.search(r"(\d+)\.(\d+)\.(\d+)", out)
    return tuple(int(x) for x in m.groups()) if m else None


def plugin_name_problem(name: str) -> str | None:
    """Why a plugin name would be refused, or None."""
    # fullmatch, not match: the $ of NAME_RE also matches before a trailing newline, so match accepted "abc-mod\n".
    if not NAME_RE.fullmatch(name):
        return "use lowercase letters, digits and hyphens, 2-63 characters, starting with a letter or digit"
    if name.startswith("claude") or "anthropic" in name:
        return (
            "names that look like Anthropic's own (starting with claude, or containing anthropic) "
            "are refused by claude plugin validate"
        )
    return None


if __name__ == "__main__":
    # A helper module, not an entry point: it carries a shebang and the executable bit only because the plugin
    # validator holds every .py file of scripts/ to that rule. Run on its own it does nothing, so it says so and exits 2,
    # the code the entry scripts use for a command run the wrong way.
    print("error: _common.py holds the shared helpers of check_skill.py, scaffold_mod.py and verify_mod.py; run one of those. " + RUN_HINT, file=sys.stderr)
    sys.exit(2)
