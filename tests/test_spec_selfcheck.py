"""Tests for the self-check script embedded in the CPV NIT adjudication spec.

`design/specs/specs/cpv-nit-rules-adjudicated.md` carries a Python script that
re-measures its own per-site table against the installed CPV catalogue and
compares the result against external baselines (the sibling bucket-A spec, the
chapter-text digest, and a captured validator scan). The script is the only
thing that says the document's own numbers are right, so a defect in it is a
defect in the document.

The script has no coverage outside itself, and that is not a hypothetical: two
defects survived several review rounds because nothing exercised the failure
paths. A duplicate per-rule prose block passed clean (the block dict kept the
LAST match per rule id, so a forged copy placed BEFORE the real one was never
seen, and one placed after it won with its own figures); a row repointed at a
chapter with too few lines raised a bare IndexError instead of the script's own
message.

These tests are the perturbation matrix: they perturb the document in a sandbox
and assert the script REFUSES to certify it. Each perturbation is one a reader
or an editor could plausibly make by hand.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SPEC_REL = "design/specs/specs/cpv-nit-rules-adjudicated.md"
SIBLING_REL = "design/specs/specs/cpv-nit-bucketA-sites.md"
SCRIPT_RE = re.compile(r"```python\n(.*?)```", re.S)

# The TRACKED BASELINE INPUTS. Both are committed fixtures under tests/fixtures/.
#
# FIXTURE_CAPTURE is the 72 `[NIT]` lines of a real strict scan over this tree.
# The spec's script measures every row against the validator's own output, so a
# capture is a REQUIRED input; leaving it to a scratch file made the suite's
# baseline depend on a machine-local accident rather than on the repository.
#
# FIXTURE_CATALOGUE is the subset of CPV's own pattern catalogue the spec's script
# re-measures its rows against. The script globs it out of the installed CPV
# plugin cache (`~/.claude/plugins/cache/...`), which exists on a maintainer's
# machine and does NOT exist on a fresh CI runner, so the script refused to
# certify anything there. The vendored subset is the same catalogue content for
# the fourteen rules the spec tabulates, tracked so the measurement is
# reproducible everywhere.
FIXTURE_CAPTURE = ROOT / "tests/fixtures/cpv-scan-capture.txt"
FIXTURE_CATALOGUE = ROOT / "tests/fixtures/skillaudit_patterns.json"

# Where the spec's script looks for the catalogue: the glob is
# `~/.claude/plugins/cache/emasoft-plugins/claude-plugins-validation/*/scripts/rules/`.
CATALOGUE_HOME_DIR = Path(".claude/plugins/cache/emasoft-plugins/claude-plugins-validation/5.22.0/scripts/rules")


def test_the_vendored_catalogue_matches_the_installed_one() -> None:
    """The vendored catalogue is byte-identical to CPV's own, for its 13 rules.

    The vendored file is a SNAPSHOT of CPV 5.22.0's `skillaudit_patterns.json`,
    restricted to the thirteen pattern-file rules the spec's per-site table
    tabulates (the fourteenth rule in that table, `INTENT_DESTRUCTIVE_INTENT`,
    comes from `cpv_skillaudit_native.py`, not from this file). The snapshot
    exists so the suite's measurement is reproducible on a machine with no CPV
    installed — but a snapshot that silently drifts from its source measures
    against patterns CPV no longer uses, and the spec would keep certifying.

    This test compares the two where CPV IS installed, and SKIPS where it is
    not, so a fresh CI runner is not failed by the absence of the thing this
    test is comparing against. A mismatch FAILS, which is the point: a CPV
    release that edits one of these thirteen rule sets must be caught here
    rather than silently changing what the spec certifies.
    """
    import glob

    installed = glob.glob(
        os.path.expanduser(
            "~/.claude/plugins/cache/emasoft-plugins/claude-plugins-validation/"
            "*/scripts/rules/skillaudit_patterns.json"
        )
    )
    if not installed:
        pytest.skip("CPV's own catalogue is not installed on this machine")

    def by_id(doc: dict) -> dict:
        rules = doc["rules"] if isinstance(doc, dict) else doc
        out = {}
        for rule in rules:
            patterns = rule.get("patterns", rule) if isinstance(rule, dict) else rule
            out[rule["id"] if isinstance(rule, dict) else rule] = patterns
        return out

    real = by_id(json.loads(Path(sorted(installed)[-1]).read_text(encoding="utf-8")))
    vendored = by_id(json.loads(FIXTURE_CATALOGUE.read_text(encoding="utf-8")))

    for rule_id, patterns in vendored.items():
        assert rule_id in real, (
            f"the vendored catalogue holds rule {rule_id}, which CPV's own catalogue "
            f"no longer defines — the snapshot has drifted from its source"
        )
        assert patterns == real[rule_id], (
            f"the vendored patterns for {rule_id} differ from CPV's own: the snapshot "
            f"has {len(patterns)} pattern(s), CPV has {len(real[rule_id])}. The spec's "
            f"per-site table is measured against these patterns, so a divergence means "
            f"the spec certifies against patterns the validator no longer applies."
        )


def _catalogue_home(base: Path) -> Path:
    """A HOME directory carrying the vendored catalogue where the script looks.

    The script's glob is under `~`, so pointing HOME at a directory that holds
    the catalogue at the expected path is what makes the script find it. The
    catalogue itself is the tracked fixture, copied here verbatim — the copy is
    what the script reads, and the fixture stays the single source of truth.
    """
    home = base / "_catalogue_home"
    target = home / CATALOGUE_HOME_DIR
    target.mkdir(parents=True, exist_ok=True)
    (target / "skillaudit_patterns.json").write_text(
        FIXTURE_CATALOGUE.read_text(encoding="utf-8"), encoding="utf-8"
    )
    return home

def _extract_script(spec_text: str) -> str:
    blocks = SCRIPT_RE.findall(spec_text)
    assert blocks, "the spec carries no embedded python script"
    # Annotated as str explicitly: `re.findall` on a pattern with one group
    # returns list[Any] to mypy, and `warn_return_any` rejects returning it
    # from a function declared to return `str`.
    script: str = blocks[-1]
    return script


def _find_capture() -> str:
    """A captured validator scan, or "" when none is available.

    THE TRACKED FIXTURE IS THE SOURCE, and it is consulted FIRST. It is TRACKED,
    so a fresh CI checkout has it: the suite's baseline is a property of the
    repository, not of whatever happened to be lying in /tmp on the machine that
    ran it last.

    WHY THE FALLBACK IS NOT A FALLBACK IN EFFECT. A capture whose (rule, file,
    line) set disagrees with the spec's table is REJECTED and the search moves on.
    That rejection is what makes a stale fixture SILENTLY REPLACED rather than
    loudly reported: a developer whose tracked fixture has gone stale (a chapter
    edit moved a flagged line) and who happens to have an older matching capture
    in /tmp gets a PASSING module that certified against the scratch file, while
    the tracked fixture — the thing the docstring calls the source — says
    something else. MEASURED: corrupting one line number in the tracked fixture
    left all 28 tests passing, because a /tmp capture shadowed it; the same
    corruption failed 26 of 28 once the scratch files were moved aside.

    So the scratch locations are consulted ONLY when the tracked fixture is
    ABSENT (a partial clone, a source tarball, a checkout before the fixture
    was added). A tracked fixture that is present but STALE returns "" and the
    module fails loudly, instead of being shadowed — which is the property a
    reproducible baseline needs. To re-check against a newer CPV without
    editing the fixture, REPLACE the fixture deliberately.

    A STALE FIXTURE IS A TOTAL FAILURE OF THIS MODULE, and it is meant to be:
    every test below depends on this one file, the fixture's line numbers are
    tied to the chapter files as they stand, and a chapter edit that moves a
    flagged line invalidates it. The failure reads "no validator capture
    matching the spec's own table was found" — which names the cause, unlike the
    older message that read like a missing file. Re-capture the fixture after
    any edit under `skills/*/references/`.
    """
    spec = (ROOT / SPEC_REL).read_text(encoding="utf-8")
    expected = _expected_pairs(spec)

    # THE TRACKED FIXTURE FIRST, AND ONLY IT, WHEN IT IS PRESENT. A tracked
    # fixture that has gone stale must make this module FAIL LOUDLY rather than
    # be shadowed by a scratch capture that happens to match: a passing module
    # that certified against an untracked file is a baseline that does not
    # describe the repository. The scratch locations are consulted only when
    # the tracked fixture is ABSENT or UNREADABLE, so a checkout without it
    # (a partial clone, a source tarball) still finds a capture.
    if FIXTURE_CAPTURE.is_file():
        try:
            tracked = FIXTURE_CAPTURE.read_text(encoding="utf-8", errors="replace")
        except OSError:
            tracked = ""
        if "[NIT]" in tracked:
            # PRESENT BUT STALE RETURNS "" AND THE MODULE FAILS LOUDLY. It
            # does NOT fall through to a scratch capture: a passing module that
            # certified against an untracked file is a baseline that does not
            # describe the repository, and the whole point of tracking the
            # fixture is that a stale one is a VISIBLE failure. To re-check
            # against a newer CPV without editing the fixture, replace the
            # fixture deliberately.
            if _pairs_in(tracked) == expected:
                return tracked
            return ""

    return _find_scratch_capture(expected)


def _find_scratch_capture(expected: set[tuple[str, str, str]]) -> str:
    """A matching capture from the scratch locations, or "" when there is none."""
    for directory in (Path("/tmp"), ROOT / "reports_dev"):
        if not directory.is_dir():
            continue
        for candidate in sorted(directory.glob("cpv-*.txt")):
            try:
                text = candidate.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if "[NIT]" not in text:
                continue
            if _pairs_in(text) == expected:
                return text
    return ""
def _expected_pairs(spec_text: str) -> set[tuple[str, str, str]]:
    """The (rule, file, line) triples the spec's per-site table asserts."""
    section = spec_text[spec_text.rindex("## THE PER-SITE TABLE, RULE BY RULE") :]
    pairs: set[tuple[str, str, str]] = set()
    # The same block-slice shape the spec's own script uses, spelled with a
    # character class rather than a negated group so a markdown linter does not
    # read the pattern as a reversed link.
    block_re = re.compile(
        r"### `([A-Z0-9_]+)`[^\n]*\n((?:(?!\n### |\n## ).)*?)(?=\n### |\n## |$)", re.S
    )
    for rule, body in block_re.findall(section):
        table = re.search(r"\n\|([^\n]*)\|\n\|[-|]+\|\n((?:\|[^\n]*(?:\n|$))*)", body)
        if not table:
            continue
        for chapter, lineno in re.findall(r"\| `([a-z0-9-]+)` line (\d+) \|", table.group(2)):
            pairs.add((rule, "skills/mods-doc-" + chapter + "/references/chapter.md", lineno))
    return pairs

def _pairs_in(capture: str) -> set[tuple[str, str, str]]:
    """The (rule, file, line) triples a captured scan reports."""
    pairs: set[tuple[str, str, str]] = set()
    for m in re.finditer(
        r"\[skillaudit:[a-z_]+ ([A-Z0-9_]+)\].*\((skills/[^)]*chapter\.md)\):(\d+)", capture
    ):
        pairs.add((m.group(1), m.group(2), m.group(3)))
    return pairs

@pytest.fixture(scope="module")
def pristine() -> tuple[str, str, str]:
    """The spec, the sibling spec, and a matching captured validator scan."""
    spec = (ROOT / SPEC_REL).read_text(encoding="utf-8")
    sibling = (ROOT / SIBLING_REL).read_text(encoding="utf-8")
    return spec, sibling, _find_capture()

def _run(sandbox: Path, capture: str) -> tuple[int, str]:
    """Run the spec's script inside the sandbox and return its exit code.

    HOME points at a directory carrying the vendored catalogue, because the
    script globs it out of `~/.claude/plugins/cache/...` and refuses to certify
    anything when it is absent. On a maintainer's machine the real installed CPV
    plugin supplies it; on a fresh CI runner nothing does, which is why the
    catalogue is vendored as a tracked fixture and staged here.
    """
    import os

    script = _extract_script((sandbox / SPEC_REL).read_text(encoding="utf-8"))
    script_path = sandbox / "_script.py"
    script_path.write_text(script, encoding="utf-8")
    if capture:
        (sandbox / "_scan.txt").write_text(capture, encoding="utf-8")
    env = dict(os.environ)
    env["CPV_SCAN_OUTPUT"] = str(sandbox / "_scan.txt")
    env["HOME"] = str(_catalogue_home(sandbox))
    result = subprocess.run(
        [sys.executable, "-I", str(script_path)],
        cwd=str(sandbox),
        capture_output=True,
        text=True,
        env=env,
    )
    return result.returncode, result.stdout + result.stderr
@pytest.fixture()
def sandbox(tmp_path: Path, pristine: tuple[str, str, str]) -> Path:
    """A writable copy of the tree the script reads."""
    spec, sibling, capture = pristine
    for rel in (SPEC_REL, SIBLING_REL):
        target = tmp_path / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text((ROOT / rel).read_text(encoding="utf-8"), encoding="utf-8")
    skills = tmp_path / "skills"
    shutil.copytree(ROOT / "skills", skills)
    return tmp_path

def _mutate_chapter(sandbox: Path, chapter: str, extra: str) -> None:
    """Append text to a chapter, as a re-sync would."""
    path = sandbox / "skills" / ("mods-doc-" + chapter) / "references" / "chapter.md"
    path.write_text(path.read_text(encoding="utf-8") + extra, encoding="utf-8")

def _prose_block(text: str, rule: str) -> str:
    start = text.index("### `" + rule + "`")
    end = text.index("### `", start + 10)
    return text[start:end]

def _table_section_start(text: str) -> int:
    return text.rindex("## THE PER-SITE TABLE, RULE BY RULE")

# Each perturbation is (name, mutation, expected message). The message is what
# makes the test discriminating: the script's ABSENT-SCAN branch also exits
# non-zero, so a test that asserts only the exit code would pass whenever the
# capture went missing - the perturbation would not be detected at all. Each
# expected string is a fragment the script prints for THAT perturbation.
PERTURBATIONS: list[tuple[str, str, str]] = [
    ("delete a per-rule prose block", "delete_prose_block", "per-rule prose blocks differs"),
    ("delete a per-site table", "delete_site_table", "the written chapter list and the chapters the table names differ"),
    ("duplicate a per-rule prose block", "duplicate_prose_block", "appears more than once"),
    ("duplicate a prose block with wrong figures, copy first", "duplicate_forged_first", "appears more than once"),
    ("duplicate a prose block with wrong figures, copy last", "duplicate_forged_last", "appears more than once"),
    ("duplicate a heading without its figures", "duplicate_heading_only", "appears more than once"),
    ("rename a rule heading in the prose section", "rename_rule", "differs from the validator"),
    ("change a row's stated gap", "change_row_gap", "DISAGREES"),
    ("change a prose block's stated widest gap", "change_block_gap", "DISAGREES"),
    ("delete a row from a per-site table", "delete_row", "bucket-A (site, rule) pairs differ"),
    ("repoint a row at a chapter with fewer lines", "repoint_row", "names line 382, but that chapter has"),
    ("repoint a row at a chapter that does not exist", "repoint_missing_chapter", "does not exist"),
    ("change a stance in this file", "change_own_stance", "the stance at"),
    ("change a stance in the sibling spec", "change_sibling_stance", "the stance at"),
    ("empty the per-site table section", "empty_table_section", "COVERAGE ERROR"),
    ("append to a chapter that holds no cited line", "append_to_chapter", "the chapters have changed"),
    ("duplicate a per-site table", "duplicate_site_table", "a rule id was read more than once"),
    ("delete a row that is not a bucket-A site", "delete_non_bucket_row", "(rule, site) set differs from the validator"),
    ("strip a prose block's figures lines", "strip_block_figures", "per-rule prose heading but no measured"),
]

def _mutate(sandbox: Path, kind: str) -> None:
    spec_path = sandbox / SPEC_REL
    sib_path = sandbox / SIBLING_REL
    text = spec_path.read_text(encoding="utf-8")

    if kind == "delete_prose_block":
        i = text.index("### `SHELL_EXEC`")
        j = text.index("### `", i + 10)
        text = text[:i] + text[j:]
    elif kind == "delete_site_table":
        s = _table_section_start(text)
        i = text.index("### `SHELL_EXEC`", s)
        j = text.index("### `", i + 10)
        text = text[:i] + text[j:]
    elif kind == "duplicate_prose_block":
        block = _prose_block(text, "SUPPLY_CHAIN")
        text = text.replace(block, block + block, 1)
    elif kind in ("duplicate_forged_first", "duplicate_forged_last"):
        block = _prose_block(text, "SUPPLY_CHAIN")
        forged = block.replace("**widest token gap:** 73 characters", "**widest token gap:** 999 characters")
        text = text.replace(block, forged + block if kind.endswith("first") else block + forged, 1)
    elif kind == "strip_block_figures":
        # The rule's heading survives, its figures do not. The block then parses
        # to nothing, so a rule set built from the PARSED BLOCKS would not see
        # that the analysis had been emptied.
        i = text.index("### `SUPPLY_CHAIN`")
        j = text.index("### `", i + 10)
        block = text[i:j]
        stripped = "\n".join(
            line for line in block.split("\n") if not line.startswith("- **widest")
        )
        text = text[:i] + stripped + text[j:]
    elif kind == "delete_non_bucket_row":
        # A row at a site the sibling spec does NOT carry. The bucket-A
        # comparison cannot see it, the rule set is unchanged, and every row
        # still measures correctly - so the TOTAL comparison against the
        # validator's own output is the only thing that can catch it.
        line = next(
            candidate
            for candidate in text.split("\n")
            if candidate.startswith("| `status-line-customization` line 598 |")
        )
        text = text.replace(line + "\n", "", 1)
    elif kind == "duplicate_site_table":
        s = _table_section_start(text)
        i = text.index("### `SHELL_EXEC`", s)
        j = text.index("### `", i + 10)
        block = text[i:j]
        text = text[:i] + block + block + text[j:]
    elif kind == "append_to_chapter":
        # A corpus change that leaves every CITED line intact. Nothing else can
        # see it: the row re-measurement reads the cited lines, which did not
        # move. The chapter-text digest is the only guard that watches it.
        _mutate_chapter(sandbox, "cc-github-actions", "\n\nA paragraph appended by a re-sync.\n")
    elif kind == "duplicate_heading_only":
        # The heading line alone, repeated. The block that follows it stays intact,
        # so the block's FIGURES are still matched and still checked - the point is
        # that a repeated heading is a second copy the reader will read.
        i = text.index("### `SUPPLY_CHAIN`")
        end = text.index("\n", i) + 1
        text = text[:end] + text[i:end] + text[end:]
    elif kind == "repoint_missing_chapter":
        text = text.replace("| `cc-permissions-modes` line 382 |", "| `no-such-chapter` line 382 |", 1)
    elif kind == "rename_rule":
        block = _prose_block(text, "SUPPLY_CHAIN")
        text = text.replace(block, block.replace("### `SUPPLY_CHAIN`", "### `SUPPLY_CHAINX`", 1), 1)
    elif kind == "change_row_gap":
        text = text.replace(
            "| `cc-permissions-modes` line 382 | 11 | 3 |",
            "| `cc-permissions-modes` line 382 | 11 | 7 |",
            1,
        )
    elif kind == "change_block_gap":
        block = _prose_block(text, "SUPPLY_CHAIN")
        text = text.replace(
            block,
            block.replace("**widest token gap:** 73 characters", "**widest token gap:** 999 characters", 1),
            1,
        )
    elif kind == "delete_row":
        line = next(candidate for candidate in text.split("\n") if "`cc-permissions-modes` line 382 |" in candidate)
        text = text.replace(line + "\n", "", 1)
    elif kind == "repoint_row":
        text = text.replace("| `cc-permissions-modes` line 382 |", "| `sessions-reference` line 382 |", 1)
    elif kind == "change_own_stance":
        text = text.replace(
            "| `cc-permissions-modes` line 382 | 11 | 3 | NAMES |",
            "| `cc-permissions-modes` line 382 | 11 | 3 | WARNS |",
            1,
        )
    elif kind == "change_sibling_stance":
        sib = sib_path.read_text(encoding="utf-8")
        sib = sib.replace("rule: SUPPLY_CHAIN — **NAMES**", "rule: SUPPLY_CHAIN — **TEACHES**", 1)
        sib_path.write_text(sib, encoding="utf-8")
    elif kind == "empty_table_section":
        text = text[: _table_section_start(text)] + "## THE PER-SITE TABLE, RULE BY RULE\n\n"
    else:  # pragma: no cover - the table above is the only caller
        raise AssertionError("unknown perturbation: " + kind)
    spec_path.write_text(text, encoding="utf-8")

def test_a_chapter_whose_raw_and_collapsed_lines_disagree_is_refused(
    sandbox: Path, pristine: tuple[str, str, str]
) -> None:
    """The raw line and the whitespace-collapsed line must select the SAME text.

    That is what justifies the two columns having two different references: the
    raw span is measured on the line as it stands, the gap on the collapsed
    line, and the check proves they are looking at the same construct. The
    perturbation splits a cited line in two at a point INSIDE a multi-word
    trigger, so the raw line no longer carries the trigger whole while the
    collapsed line still does - the two then select different text, and the
    script must refuse rather than measure a construct that is not there.
    """
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    chapter = sandbox / "skills/mods-doc-cc-github-actions/references/chapter.md"
    lines = chapter.read_text(encoding="utf-8").split("\n")
    for index, line in enumerate(lines):
        if "claude setup-token" in line:
            # Break the line right between the two words of the trigger.
            lines[index] = line.replace("claude setup-token", "claude setup\n-token", 1)
            break
    else:  # pragma: no cover - the chapter is part of the corpus
        pytest.skip("the cited chapter no longer carries the line this test needs")
    chapter.write_text("\n".join(lines), encoding="utf-8")
    code, output = _run(sandbox, capture)
    assert code != 0, (
        "the script certified a document whose raw and collapsed lines select "
        "different text: " + output
    )
    # The check that fires is the REFS one: after the split, the RAW line no
    # longer carries the trigger whole, so one side matches nothing at all.
    assert "one side matched NOTHING" in output or "match DIFFERENT text" in output, output

def test_a_line_whose_raw_and_collapsed_forms_match_different_text_is_refused(
    sandbox: Path, pristine: tuple[str, str, str]
) -> None:
    """Both sides must match the SAME text, not merely both match something.

    This is the other half of the check: the row re-measurement measures on the
    COLLAPSED line, so a chapter that puts two spaces where the trigger's words
    meet leaves every stated figure still correct while the RAW line's match is
    a different string. The check is what notices, and it must be exercised
    separately from the case where one side matches nothing at all.
    """
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    chapter = sandbox / "skills/mods-doc-cc-github-actions/references/chapter.md"
    text = chapter.read_text(encoding="utf-8")
    if "claude setup-token" not in text:  # pragma: no cover - the chapter is in the corpus
        pytest.skip("the cited chapter no longer carries the line this test needs")
    chapter.write_text(text.replace("claude setup-token", "claude  setup-token", 1), encoding="utf-8")
    code, output = _run(sandbox, capture)
    assert code != 0, "the script certified a document whose raw and collapsed forms disagree"
    assert "match DIFFERENT text" in output, output

def test_a_sibling_site_with_no_row_here_is_refused(
    sandbox: Path, pristine: tuple[str, str, str]
) -> None:
    """A bucket-A site the sibling carries and this file does not must fail.

    The sibling is the OUTSIDE baseline: it was adjudicated independently, so a
    site it names that this file's table has no row for is a missing row, not a
    disagreement to be smoothed over.
    """
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    sibling = sandbox / SIBLING_REL
    sibling.write_text(
        sibling.read_text(encoding="utf-8")
        + "- **mods-doc-cc-permissions-modes** line 999 — rule: SUPPLY_CHAIN — **NAMES**\n",
        encoding="utf-8",
    )
    code, output = _run(sandbox, capture)
    assert code != 0, "the script certified a document missing a site the sibling names"
    assert "bucket-A (site, rule) pairs differ" in output, output

def test_a_missing_catalogue_is_refused(sandbox: Path, pristine: tuple[str, str, str]) -> None:
    """Without the CPV catalogue there is nothing to measure against.

    The script measures every row against the INSTALLED catalogue, so a machine
    without it cannot certify anything - and must say that, rather than dying
    on an empty glob.
    """
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    empty_home = sandbox / "_empty_home"
    empty_home.mkdir(exist_ok=True)
    script = _extract_script((sandbox / SPEC_REL).read_text(encoding="utf-8"))
    script_path = sandbox / "_script.py"
    script_path.write_text(script, encoding="utf-8")
    import os

    env = dict(os.environ)
    env["HOME"] = str(empty_home)
    env["CPV_SCAN_OUTPUT"] = str(sandbox / "_scan.txt")
    (sandbox / "_scan.txt").write_text(capture, encoding="utf-8")
    result = subprocess.run(
        [sys.executable, "-I", str(script_path)],
        cwd=str(sandbox),
        capture_output=True,
        text=True,
        env=env,
    )
    assert result.returncode != 0, "the script certified the document with no catalogue to measure against"
    assert "catalogue was not found" in result.stdout + result.stderr, result.stdout

def test_a_missing_sibling_spec_is_refused(sandbox: Path, pristine: tuple[str, str, str]) -> None:
    """The sibling spec is the bucket-A baseline; without it there is no baseline."""
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    (sandbox / SIBLING_REL).unlink()
    code, output = _run(sandbox, capture)
    assert code != 0, "the script certified the document with no sibling spec to check against"
    assert "sibling spec is missing" in output, output

def test_an_unreadable_sibling_spec_is_refused(sandbox: Path, pristine: tuple[str, str, str]) -> None:
    """A sibling spec whose format changed must fail, not read as an empty set.

    An empty read would mean "no bucket-A sites", which would let a truncated
    table pass - the format change has to be visible.
    """
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    (sandbox / SIBLING_REL).write_text("# the format changed\n", encoding="utf-8")
    code, output = _run(sandbox, capture)
    assert code != 0, "the script certified the document against an unreadable sibling spec"
    assert "no bucket-A sites were read" in output, output

def test_an_absent_capture_is_refused(sandbox: Path, pristine: tuple[str, str, str]) -> None:
    """The total baseline is required: without a capture the script must refuse."""
    _spec, _sibling, _capture = pristine
    code, output = _run(sandbox, "")
    assert code != 0, "the script certified the document with no capture to check it against"
    assert "the validator output is not present" in output, output

def test_a_capture_in_an_unknown_format_is_refused(
    sandbox: Path, pristine: tuple[str, str, str]
) -> None:
    """A capture the script cannot read is a FORMAT CHANGE, not an empty result.

    An empty result would let a truncated table pass, so the script must refuse
    rather than treat "nothing to compare" as agreement.

    HOME carries the vendored catalogue, exactly as `_run` does: the script globs
    it out of `~`, so without it the script refuses on the MISSING CATALOGUE and
    the format check below is never reached — the test would then assert a
    message the script never prints.
    """
    _spec, _sibling, _capture = pristine
    bogus = "totally different output format\nno findings here\n"
    (sandbox / "_bogus.txt").write_text(bogus, encoding="utf-8")
    script = _extract_script((sandbox / SPEC_REL).read_text(encoding="utf-8"))
    script_path = sandbox / "_script.py"
    script_path.write_text(script, encoding="utf-8")
    import os

    env = dict(os.environ)
    env["CPV_SCAN_OUTPUT"] = str(sandbox / "_bogus.txt")
    env["HOME"] = str(_catalogue_home(sandbox))
    result = subprocess.run(
        [sys.executable, "-I", str(script_path)],
        cwd=str(sandbox),
        capture_output=True,
        text=True,
        env=env,
    )
    assert result.returncode != 0, "the script accepted a capture it could not read"
    assert "no [NIT] line" in result.stdout + result.stderr, result.stdout

def test_the_untouched_document_is_certified(sandbox: Path, pristine: tuple[str, str, str]) -> None:
    """The script passes on the document as it stands - otherwise the rest proves nothing."""
    _spec, _sibling, capture = pristine
    assert capture, (
        "no validator capture matching the spec's own table was found, so the script "
        "cannot be certified at all. Run the strict scan and leave its output where "
        "this test can find it."
    )
    code, output = _run(sandbox, capture)
    assert code == 0, output

@pytest.mark.parametrize("name,kind,expected_message", PERTURBATIONS)
def test_a_perturbed_document_is_not_certified(
    sandbox: Path, pristine: tuple[str, str, str], name: str, kind: str, expected_message: str
) -> None:
    """Each perturbation must make the script refuse, AND say why in its own words.

    The message is the load-bearing assertion: the script's absent-scan branch
    also exits non-zero, so a test that checked only the exit code would pass
    whenever the capture went missing - the perturbation would go undetected
    while the test stayed green.
    """
    _spec, _sibling, capture = pristine
    assert capture, "no validator capture matching the spec's own table was found"
    _mutate(sandbox, kind)
    code, output = _run(sandbox, capture)
    assert code != 0, "the script certified a document that was perturbed: " + name
    assert expected_message in output, (
        "the script refused, but not for the reason this perturbation implies: " + name
    )
