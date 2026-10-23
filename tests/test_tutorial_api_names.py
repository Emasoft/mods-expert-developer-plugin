"""Name lint over the tutorial skills: every `$.noun.method` they mention must be a method
the mods API reference lists.

The allowed set is parsed from the "Mods API methods" table of the mods-doc-mods-reference
chapter (one row per namespace, a leading run of backticked method names), never hard-coded,
so a chapter refresh moves the allowed set with it. Event names (`tool.call`, `prompt.submit`)
are parsed from the event tables of the same chapter; an event name is not an API method, so
`$.tool.call` is checked against the methods only.

Scanned: each tutorial skill's SKILL.md and references/*.md, plus the shipped example hook code
(examples/*/hooks/**/*.ts and *.tsx, and any register.ts under examples/). Skipped: files under a
tests/ folder (they call a test harness whose `$` is not the shipped API), files under types/
(declarations, not calls), .d.ts files and node_modules.

The scan checks noun.method only: a third segment (`$.ui.log.foo`) is not checked.
"""

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
REFERENCE = SKILLS / "mods-doc-mods-reference" / "references" / "chapter.md"

MENTION = re.compile(r"\$\.([a-z]+)\.([A-Za-z]+)")
NAMESPACE_ROW = re.compile(r"^\| (?:\[)?`\$\.(\w+)`[^|]*\| ([^|]*)\|", re.M)
LEADING_NAMES = re.compile(r"^(?:[A-Z][^`]*?: )?((?:`\w+`(?:, )?)+)")
EVENT_ROW = re.compile(r"^\| (?:\[)?`([a-z]+\.[a-zA-Z]+)`", re.M)

# Names the reference table does not list, each allowed for a stated reason.
ALLOWED_EXTRA = {
    "ui.mount": "test-harness method documented in mods-doc-mods-testing, chapter.md:269 and :317, not in the API table",
}


def section_of(text: str, heading: str) -> str:
    start = text.find(heading)
    assert start != -1, f"heading {heading!r} not found in {REFERENCE.relative_to(ROOT)}"
    end = text.find("\n### ", start + 5)
    return text[start:] if end == -1 else text[start:end]


def allowed_methods() -> set[str]:
    section = section_of(REFERENCE.read_text(encoding="utf-8"), "### Mods API methods")
    names: set[str] = set()
    for noun, cell in NAMESPACE_ROW.findall(section):
        match = LEADING_NAMES.match(cell.strip())
        if match:
            names.update(f"{noun}.{m}" for m in re.findall(r"`(\w+)`", match.group(1)))
    return names


def event_names() -> set[str]:
    section = section_of(REFERENCE.read_text(encoding="utf-8"), "### Events a mod can hook")
    return set(EVENT_ROW.findall(section))


def tutorial_files() -> list[Path]:
    files: list[Path] = []
    for skill in sorted(SKILLS.glob("mods-tutorial-*")):
        files.append(skill / "SKILL.md")
        files.extend(sorted((skill / "references").glob("*.md")))
        for code in sorted((skill / "examples").rglob("*.ts*")):
            parts = code.relative_to(skill).parts
            if code.suffix not in (".ts", ".tsx") or code.name.endswith(".d.ts"):
                continue
            if "node_modules" in parts or "tests" in parts or "types" in parts:
                continue
            if "hooks" in parts or code.name == "register.ts":
                files.append(code)
    return [f for f in files if f.is_file()]


def mentions(files: list[Path]) -> list[tuple[str, Path, int]]:
    found = []
    for file in files:
        for number, line in enumerate(file.read_text(encoding="utf-8").splitlines(), 1):
            for noun, method in MENTION.findall(line):
                found.append((f"{noun}.{method}", file, number))
    return found


def unknown_names(found: list[tuple[str, Path, int]], allowed: set[str]) -> list[str]:
    ok = allowed | set(ALLOWED_EXTRA)
    events = event_names()
    bad = []
    for name, file, number in found:
        if name in ok:
            continue
        kind = "is an event, not a method" if name in events else "is not a listed method"
        bad.append(f"$.{name} {kind} at {os.path.relpath(file, ROOT)}:{number}")
    return bad


def test_allowed_set_is_parsed_from_the_reference_table():
    """The allowed method set comes out of the chapter table, non-trivially and with known members."""
    allowed = allowed_methods()
    assert len(allowed) >= 60
    assert {"ui.log", "store.get", "tool.register", "fs.stat", "clock.every"} <= allowed
    assert "ui.fakeMethod" not in allowed


def test_no_namespace_row_is_silently_dropped():
    """Every namespace row of the table yields at least one name, and each tutorial namespace has its known member."""
    section = section_of(REFERENCE.read_text(encoding="utf-8"), "### Mods API methods")
    allowed = allowed_methods()
    rows = NAMESPACE_ROW.findall(section)
    assert len(rows) >= 15
    for noun, _ in rows:
        assert any(name.startswith(f"{noun}.") for name in allowed), f"row $.{noun} yielded no names"
    known = {
        "env.get", "process.run", "http.fetch", "session.send", "prompt.submit", "command.register",
        "model.complete", "store.get", "ui.log", "tool.register", "fs.stat",
    }
    assert known <= allowed, f"missing: {sorted(known - allowed)}"


def test_event_names_are_parsed_from_the_event_tables():
    """The event set is non-trivial and holds the events the tutorials rely on."""
    events = event_names()
    assert len(events) >= 30
    assert {"tool.call", "prompt.submit", "session.start", "turn.complete"} <= events


def test_tutorials_mention_enough_api_calls_to_mean_something():
    """The scan sees a sensible number of mentions, so an empty scan cannot pass."""
    assert len(tutorial_files()) >= 5
    assert len(mentions(tutorial_files())) >= 20


def test_checker_flags_a_fake_name_and_an_event_used_as_a_method(tmp_path):
    """Mutation proof: a probe file with an unknown name and an event name is reported with its line."""
    probe = tmp_path / "probe.md"
    probe.write_text("Call $.ui.log and $.ui.fakeMethod, then $.turn.complete.\n", encoding="utf-8")
    found = mentions([probe])
    assert [name for name, _, _ in found] == ["ui.log", "ui.fakeMethod", "turn.complete"]
    reported = unknown_names(found, allowed_methods())
    assert len(reported) == 2
    assert reported[0].startswith("$.ui.fakeMethod is not a listed method at ")
    assert reported[1].startswith("$.turn.complete is an event, not a method at ")
    assert all(r.endswith("probe.md:1") for r in reported)


def test_every_tutorial_api_name_is_in_the_reference():
    """Every `$.noun.method` in the tutorial skills is a method the reference table lists."""
    bad = unknown_names(mentions(tutorial_files()), allowed_methods())
    assert not bad, "unknown API names:\n" + "\n".join(bad)
