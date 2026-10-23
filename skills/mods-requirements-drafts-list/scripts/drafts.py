#!/usr/bin/env python3
"""List or search requirements drafts saved by the requirements-drafts mod.

Draft folder: ~/.claude/requirements-drafts/ (override: env REQUIREMENTS_DRAFTS_DIR).
Each draft is `<YYYYMMDD_HHMMSS+zzzz>-<hash12>.md`: YAML frontmatter, the verbatim message,
and a last line `<!-- requirements-drafts:end -->`. A file without that last line is still
being written and is reported separately, never as a draft.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

END_MARKER = "<!-- requirements-drafts:end -->"
FIRST_LINE_WIDTH = 80


@dataclass
class Draft:
    path: Path
    id: str
    date: str
    project: str
    body: str


def drafts_dir() -> Path:
    override = os.environ.get("REQUIREMENTS_DRAFTS_DIR")
    return Path(override) if override else Path.home() / ".claude" / "requirements-drafts"


def default_project() -> tuple[str, bool]:
    """Return (project, subfolders_count): the git top level, else the working directory.

    Outside git the cwd may be any folder (even the home folder); letting its subfolders count would
    list every project below it, so only an exact match is accepted in that case. A git top level that
    is the home folder (a dotfiles repo) is treated the same way, because it would otherwise match
    every project under home.
    """
    result = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=False)
    top = result.stdout.strip()
    if result.returncode == 0 and top and os.path.realpath(top) != os.path.realpath(Path.home()):
        return top, True
    return os.getcwd(), False


def split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Return the top-level `key: value` frontmatter pairs and the text after the closing fence.

    The mod writes every value JSON-quoted (logic.ts renderDraft), so a quoted value is decoded
    with json.loads; a value that is not quoted is kept raw.
    """
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, text
    fields: dict[str, str] = {}
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            return fields, "\n".join(lines[index + 1 :])
        key, sep, value = lines[index].partition(":")
        if sep and not key.startswith(" "):
            fields[key.strip()] = decode_value(value.strip())
    return {}, text


def decode_value(raw: str) -> str:
    """JSON-decode a quoted frontmatter value; anything else is returned as written."""
    if raw.startswith('"'):
        try:
            decoded = json.loads(raw)
        except json.JSONDecodeError:
            return raw
        if isinstance(decoded, str):
            return decoded
    return raw


def parse(path: Path) -> Draft | None:
    """Parse a complete draft; None unless the LAST non-empty line is the end marker."""
    text = path.read_text(encoding="utf-8", errors="replace")
    stripped = text.rstrip()
    if stripped.split("\n")[-1].strip() != END_MARKER:
        return None
    fields, rest = split_frontmatter(stripped)
    body = rest.rsplit(END_MARKER, 1)[0].strip("\n")
    # The name is `<stamp>-<hash12>.md`; the stamp itself may hold a `-` (offset -0500), so cut at the LAST one.
    stamp = path.name.removesuffix(".md").rsplit("-", 1)[0]
    return Draft(path, fields.get("id", path.stem), stamp, fields.get("project-root", ""), body)


def snippet(body: str, keywords: list[str]) -> str:
    """First body line that contains any keyword, cut to the table width."""
    for line in body.split("\n"):
        if any(word.lower() in line.lower() for word in keywords):
            return line.strip()[:FIRST_LINE_WIDTH]
    return ""


def cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")


def run(args: argparse.Namespace) -> int:
    folder = drafts_dir()
    if not folder.is_dir():
        print(f"error: requirements drafts folder not found: {folder}", file=sys.stderr)
        return 2
    keywords: list[str] = getattr(args, "keywords", [])
    project: str | None = None
    subfolders = True
    if not args.all:
        # realpath on both sides: a symlinked checkout and its target are the same project.
        if args.project:
            project = os.path.realpath(args.project)
        else:
            default, subfolders = default_project()
            project = os.path.realpath(default)
    since = args.since.replace("-", "") if args.since else None
    chosen: list[Draft] = []
    incomplete: list[Path] = []
    for path in sorted(folder.glob("*.md"), reverse=True):
        draft = parse(path)
        if draft is None:
            incomplete.append(path)
            continue
        # An empty project-root means unknown: realpath("") is the cwd and would match by accident, so such a draft is listed only with --all.
        # A draft saved from a subfolder of the repo belongs to the repo, hence is_relative_to (a path-component test: /x/proj2 is not inside /x/proj); the non-git cwd fallback matches exactly.
        if project is not None:
            if not draft.project:
                continue
            real = Path(os.path.realpath(draft.project))
            if not (real.is_relative_to(project) if subfolders else str(real) == project):
                continue
        if since and draft.date[:8] < since:
            continue
        haystack = draft.body.lower()
        if all(word.lower() in haystack for word in keywords):
            chosen.append(draft)
    shown = chosen[: args.limit]
    heading = "first line // first line with a keyword" if keywords else "first line"
    print(f"| id | date | project | {heading} | path |")
    print("| --- | --- | --- | --- | --- |")
    for draft in shown:
        first = next((ln for ln in draft.body.split("\n") if ln.strip()), "")[:FIRST_LINE_WIDTH]
        if keywords:
            first = f"{first} // {snippet(draft.body, keywords)}"
        print(
            f"| {cell(draft.id)} | {cell(draft.date)} | {cell(draft.project)} | {cell(first)} | {cell(str(draft.path))} |"
        )
    print(f"\n{len(shown)} of {len(chosen)} matching drafts shown.")
    if incomplete:
        print("\nIncomplete files (still being written, not drafts):")
        for path in incomplete:
            print(f"- {path}")
    return 0


def positive_int(raw: str) -> int:
    value = int(raw)
    if value < 1:
        raise argparse.ArgumentTypeError("must be >= 1")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("list", "search"):
        p = sub.add_parser(name)
        if name == "search":
            p.add_argument("keywords", nargs="+", metavar="KEYWORD")
        p.add_argument("--all", action="store_true", help="every project, not only the current one")
        p.add_argument("--project", help="project root to filter by (default: git root or cwd)")
        p.add_argument("--limit", type=positive_int, default=20)
        p.add_argument("--since", help="YYYY-MM-DD")
        p.set_defaults(func=run)
    args = parser.parse_args()
    code: int = args.func(args)
    return code


if __name__ == "__main__":
    sys.exit(main())
