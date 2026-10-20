#!/usr/bin/env python3
"""Measure which of the spec self-check script's guards have a test behind them.

The script embedded in `design/specs/specs/cpv-nit-rules-adjudicated.md` is
the instrument that certifies the document's own numbers. This measures the
instrument's own coverage: each refusing condition in the script is replaced,
in turn, with a condition that cannot refuse, and the suite is run. A guard
with a test behind it shows up as a condition whose removal makes the suite
fail; a guard with none shows up as a condition whose removal changes nothing.

This is EXPENSIVE - a suite run per guard - so it is a reviewer's tool, not a
test. The cheap direction (the ledger's stated figure checked against the
script's own count) is `tests/test_spec_selfcheck_coverage.py`, which runs on
every change.

    python3 scripts/measure_guard_coverage.py            # the summary
    python3 scripts/measure_guard_coverage.py --detail   # per guard

It works in a sandbox under /tmp and never touches the working tree.

It lives in `scripts/` because CPV rejects a non-standard root directory: a
`tools/` directory raised MAJOR=1 ("Non-standard directory 'tools/' - not part
of the plugin spec and not recognised by CPV"), and `scripts_dev/` is
gitignored, which made the first version of this tool unreachable from the
repository. `scripts/` is the standard directory, and the file is not part of
the plugin's declared components.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC_REL = "design/specs/specs/cpv-nit-rules-adjudicated.md"
SIBLING_REL = "design/specs/specs/cpv-nit-bucketA-sites.md"
SUITE_REL = "tests/test_spec_selfcheck.py"
SCRIPT_RE = re.compile(r"```python\n(.*?)```", re.S)

def guard_indices(script: str) -> list[int]:
    """The lines of the script's guard conditions.

    The scan itself lives in `tests/test_spec_selfcheck_coverage.py`, so the
    script and the routine check that guards the ledger CANNOT disagree about
    what a guard is. That module is imported, not copied: a second
    implementation of the same rule is exactly the drift this work exists to
    remove, and the plugin's own copy-paste gate is right to flag it.
    """
    sys.path.insert(0, str(ROOT / "tests"))
    try:
        from test_spec_selfcheck_coverage import guard_conditions, is_guard  # noqa: E402
    except ImportError as exc:  # pragma: no cover - the tree is always complete here
        raise SystemExit(
            "The shared guard scanner is missing: {0} does not hold "
            "test_spec_selfcheck_coverage.py. The scanner lives there so this "
            "tool and the routine test cannot disagree about what a guard is, "
            "so this tool cannot run without it.".format(ROOT / "tests")
        ) from exc

    return [index for index, condition in guard_conditions(script) if is_guard(condition)]

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--detail", action="store_true", help="list every guard")
    args = parser.parse_args()

    spec = (ROOT / SPEC_REL).read_text(encoding="utf-8")
    script = SCRIPT_RE.findall(spec)[-1]
    lines = script.split("\n")
    guards = guard_indices(script)
    if not guards:
        print("no refusing conditions found - the script changed shape")
        return 1

    with tempfile.TemporaryDirectory(prefix="guard-coverage-") as tmp:
        work = Path(tmp) / "work"
        work.mkdir()
        for rel in (SPEC_REL, SIBLING_REL):
            target = work / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text((ROOT / rel).read_text(encoding="utf-8"), encoding="utf-8")
        shutil.copytree(ROOT / "skills", work / "skills")
        (work / "tests").mkdir(exist_ok=True)
        shutil.copy(ROOT / SUITE_REL, work / "tests" / Path(SUITE_REL).name)

        uncovered = []
        for index in guards:
            indent = len(lines[index]) - len(lines[index].lstrip())
            patched = "\n".join(
                lines[:index] + [" " * indent + "if False:"] + lines[index + 1 :]
            )
            (work / SPEC_REL).write_text(spec.replace(script, patched, 1), encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    "tests/" + Path(SUITE_REL).name,
                    "-q",
                    "--no-header",
                    "-p",
                    "no:cacheprovider",
                ],
                capture_output=True,
                text=True,
                cwd=str(work),
            )
            (work / SPEC_REL).write_text(spec, encoding="utf-8")
            covered = result.returncode != 0
            if not covered:
                uncovered.append(lines[index].strip())
            if args.detail:
                print("{0}  {1}".format("COVERED  " if covered else "UNCOVERED", lines[index].strip()))

    print()
    print("GUARD COVERAGE: {0} guards, {1} covered, {2} uncovered".format(
        len(guards), len(guards) - len(uncovered), len(uncovered)))
    for condition in uncovered:
        print("  uncovered: {0}".format(condition))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
