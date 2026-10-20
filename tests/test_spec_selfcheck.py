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

def _extract_script(spec_text: str) -> str:
    blocks = SCRIPT_RE.findall(spec_text)
    assert blocks, "the spec carries no embedded python script"
    return blocks[-1]

@pytest.fixture(scope="module")
def pristine() -> tuple[str, str, str]:
    """The spec, the sibling spec, and a captured validator scan, as they stand."""
    spec = (ROOT / SPEC_REL).read_text(encoding="utf-8")
    sibling = (ROOT / SIBLING_REL).read_text(encoding="utf-8")
    scans = sorted(Path("/tmp").glob("cpv-*.txt"))
    capture = ""
    for candidate in scans:
        text = candidate.read_text(encoding="utf-8", errors="replace")
        if "[NIT]" in text:
            capture = text
            break
    return spec, sibling, capture

def _run(sandbox: Path, capture: str) -> int:
    """Run the spec's script inside the sandbox and return its exit code."""
    script = _extract_script((sandbox / SPEC_REL).read_text(encoding="utf-8"))
    script_path = sandbox / "_script.py"
    script_path.write_text(script, encoding="utf-8")
    if capture:
        (sandbox / "_scan.txt").write_text(capture, encoding="utf-8")
    env = {"CPV_SCAN_OUTPUT": str(sandbox / "_scan.txt"), "PATH": "/usr/bin:/bin"}
    import os

    env = dict(os.environ)
    env["CPV_SCAN_OUTPUT"] = str(sandbox / "_scan.txt")
    result = subprocess.run(
        [sys.executable, "-I", str(script_path)],
        cwd=str(sandbox),
        capture_output=True,
        text=True,
        env=env,
    )
    return result.returncode

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

def _prose_block(text: str, rule: str) -> str:
    start = text.index("### `" + rule + "`")
    end = text.index("### `", start + 10)
    return text[start:end]

def _table_section_start(text: str) -> int:
    return text.rindex("## THE PER-SITE TABLE, RULE BY RULE")

# Each perturbation is (name, mutate, expect_clean). `expect_clean` is True when the
# perturbation is one the script is DOCUMENTED to tolerate; every other one must
# make the script refuse to certify the document.
PERTURBATIONS: list[tuple[str, str, bool]] = [
    ("delete a per-rule prose block", "delete_prose_block", False),
    ("delete a per-site table", "delete_site_table", False),
    ("duplicate a per-rule prose block", "duplicate_prose_block", False),
    ("duplicate a prose block with wrong figures, copy first", "duplicate_forged_first", False),
    ("duplicate a prose block with wrong figures, copy last", "duplicate_forged_last", False),
    ("rename a rule heading in the prose section", "rename_rule", False),
    ("change a row's stated gap", "change_row_gap", False),
    ("change a prose block's stated widest gap", "change_block_gap", False),
    ("delete a row from a per-site table", "delete_row", False),
    ("repoint a row at a chapter with fewer lines", "repoint_row", False),
    ("change a stance in this file", "change_own_stance", False),
    ("change a stance in the sibling spec", "change_sibling_stance", False),
    ("empty the per-site table section", "empty_table_section", False),
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
        line = next(l for l in text.split("\n") if "`cc-permissions-modes` line 382 |" in l)
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

def test_the_untouched_document_is_certified(sandbox: Path, pristine: tuple[str, str, str]) -> None:
    """The script passes on the document as it stands — otherwise the rest proves nothing."""
    _spec, _sibling, capture = pristine
    assert _run(sandbox, capture) == 0

@pytest.mark.parametrize("name,kind,expect_clean", PERTURBATIONS)
def test_a_perturbed_document_is_not_certified(
    sandbox: Path, pristine: tuple[str, str, str], name: str, kind: str, expect_clean: bool
) -> None:
    """Each perturbation must make the script refuse, and say why in its own words."""
    _spec, _sibling, capture = pristine
    _mutate(sandbox, kind)
    assert _run(sandbox, capture) != 0, (
        "the script certified a document that was perturbed: " + name
    )
