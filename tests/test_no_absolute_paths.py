"""No tracked file may hold a machine-specific absolute path (user instruction 2026-10-24: no absolute path in the plugin)."""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The prefixes are assembled from parts so this file never matches its own
# pattern: a literal prefix written here would be a hit on this very line.
_SLASH = "/"
_POSIX_ROOTS = [
    _SLASH + "Users" + _SLASH,  # macOS home folders
    _SLASH + "home" + _SLASH,  # Linux home folders
    _SLASH + "Volumes" + _SLASH,  # macOS mounted volumes
    _SLASH + "private" + _SLASH + "tmp" + _SLASH,  # macOS real path of the temp folder
    _SLASH + "private" + _SLASH + "var" + _SLASH,  # macOS real path of /var, home of the per-user temp root
    _SLASH + "var" + _SLASH + "folders" + _SLASH,  # macOS per-user temp root
]
_WINDOWS_ROOT = r"[A-Za-z]:[\\/]" + "Users" + r"[\\/]"  # a Windows home folder, either slash direction

# A hit is one of those roots followed by a CONCRETE first segment: letters,
# digits, dot, underscore, tilde or hyphen, ending at anything that is not a
# placeholder opener. So an elided `...` segment is a hit, while a template
# segment such as `claude-<uid>` or `<segment>` is not: it names a shape, not
# a machine. A bare root (the Windows users folder itself, `/Users` alone)
# names the system folder, not the home of any account, and is not a hit.
_SEGMENT = r"[A-Za-z0-9._~-]+(?![A-Za-z0-9._~<{$-])"
# A POSIX root counts only where a path starts: not after a word character,
# a dot, a tilde or `$`, so a relative `fixtures/home/x` or a `~/Users` is
# not a hit.
_PATTERN = re.compile(
    "(?:"
    + "|".join(r"(?<![A-Za-z0-9._~$-])" + re.escape(root) for root in _POSIX_ROOTS)
    + "|"
    + r"(?<![A-Za-z0-9])"
    + _WINDOWS_ROOT
    + ")"
    + _SEGMENT
)


# Generic fixture paths that match a shape but name no machine, each with its reason.
_ALLOWED = frozenset(
    {
        "/home/tester",  # the stubbed HOME of the mod tests (hooks/tests/switch-world.ts), not a machine path
        "/Users/alice",  # the other user whose home the debug-log masking tests mask (hooks/tests/debug-log.test.ts), not a machine path
        "/Users/ann",  # the store path the mod-manager masking test throws (hooks/tests/mod-manager.test.ts:6051), not a machine path
        "/Users/a",  # the home folder with a run of spaces the mod-manager masking test uses (hooks/tests/mod-manager.test.ts:6069), not a machine path
    }
)


# The guard proper: scan every tracked file.
def find_absolute_paths(root: Path) -> list[str]:
    """Return `file:line: match` for every machine-specific absolute path in the files git tracks under `root`."""
    tracked = subprocess.run(
        ["git", "ls-files", "-z"], cwd=root, capture_output=True, text=True, check=True
    ).stdout.split("\0")
    hits: list[str] = []
    for rel in filter(None, tracked):
        try:
            text = (root / rel).read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            # A binary file, or one tracked but deleted from the working tree, has no text to scan.
            continue
        for lineno, line in enumerate(text.splitlines(), 1):
            for match in _PATTERN.finditer(line):
                if match.group(0) not in _ALLOWED:
                    hits.append(f"{rel}:{lineno}: {match.group(0)}")
                    break
    return hits


def test_no_tracked_file_holds_a_machine_specific_absolute_path() -> None:
    """Every tracked text file is free of home, volume and macOS temp paths; each hit is listed as file:line."""
    hits = find_absolute_paths(ROOT)
    assert not hits, "machine-specific absolute paths:\n" + "\n".join(hits)


def test_pattern_flags_each_shape_and_spares_placeholders() -> None:
    """The pattern catches every machine-specific shape and leaves placeholders, system roots and ~ paths alone."""
    flagged = [
        _SLASH + "Users" + "/you/.zshrc",
        _SLASH + "Users" + "/.../.claude/projects/x.jsonl",
        _SLASH + "home" + "/user/project",
        _SLASH + "Volumes" + "/shared/plugins",
        _SLASH + "private" + "/tmp/claude-501/x",
        _SLASH + "private" + _SLASH + "var" + "/folders/ab/T",
        _SLASH + "var" + _SLASH + "folders" + "/ab/T",
        "C:" + "\\" + "Users" + "\\you\\.local\\bin",
        "C:" + "/" + "Users" + "/you/...",
        "cwd: " + chr(34) + _SLASH + "Users" + "/my-project" + chr(34),
    ]
    spared = [
        "~/.claude/settings.json",
        "<project-dir>/CLAUDE.md",
        "%USERPROFILE%\\.local\\bin",
        _SLASH + "private" + "/tmp/claude-<uid>/<project>/scratchpad/",
        "rd /s /q C:" + "\\" + "Users",
        "/usr/bin/env python3",
        "/tmp/claude-<uid>/x",
        "fixtures" + _SLASH + "home" + "/x",
        "under `/Users` on macOS",
    ]
    assert [s for s in flagged if not _PATTERN.search(s)] == []
    assert [s for s in spared if _PATTERN.search(s)] == []
