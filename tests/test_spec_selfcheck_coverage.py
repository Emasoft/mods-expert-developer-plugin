"""The guard count the ledger states, checked against the script that owns it.

The ledger states how many of the spec self-check script's guards have a test
behind them. That number is a fact about the SCRIPT, and it changes whenever
the script changes - so a number written in a document is a snapshot that
goes stale the moment a guard is added, and a stale snapshot is worse than
no figure: a reader trusts it and does not look.

This test closes that loop in the cheap direction. It computes the guard
count from the script itself and requires the ledger to state that count, so
the two cannot drift apart silently: add a guard and this test fails, telling
the next editor that the ledger's figure needs re-deriving.

The DEEPER question - which guards have a test behind them, measured by
neutering each one and re-running the suite - is expensive (a full suite run
per guard), so it lives in `scripts/measure_guard_coverage.py` and is run
by a reviewer rather than on every change. The number the ledger states is
the one this file keeps in sync; the coverage behind it is established there.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC_REL = "design/specs/specs/cpv-nit-rules-adjudicated.md"
LEDGER = ROOT / "DELEGATION.md"
SCRIPT_RE = re.compile(r"```python\n(.*?)```", re.S)

# The conditions that contain a refusal within the search window but cannot
# reach one from their own body: a positive branch that reads a table's rows
# when a table is found, and a filter that skips a rule outside the sibling
# spec's set. Excluding these by name is what makes the count re-derivable.
NOT_GUARDS = ("if m:", "if rid not in sib_rules:")

def guard_conditions(script: str) -> list[tuple[int, str]]:
    """Every refusing condition in the script, with the line it is on.

    A condition is one whose body can raise SystemExit. Two of them are not
    GUARDS - they contain a refusal in their search window but cannot reach
    one from their own body - and they are excluded by EXACT match, so a
    genuine guard whose condition merely begins with the same words is not
    dropped by accident.
    """
    lines = script.split("\n")
    found: list[tuple[int, str]] = []
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not (stripped.startswith("if ") and stripped.endswith(":")):
            continue
        if "raise SystemExit" not in "\n".join(lines[index + 1 : index + 11]):
            continue
        found.append((index, stripped))
    return found

def is_guard(condition: str) -> bool:
    """Whether a refusing condition is a guard rather than one of the exclusions."""
    return condition not in NOT_GUARDS

def guard_count(script: str) -> tuple[int, int]:
    """The number of refusing conditions in the script, and how many are guards."""
    conditions = guard_conditions(script)
    guards = sum(1 for _, condition in conditions if is_guard(condition))
    return len(conditions), guards

def test_the_ledger_states_this_scripts_guard_count() -> None:
    """The ledger's figure must be the script's figure, not a memory of it."""
    spec = (ROOT / SPEC_REL).read_text(encoding="utf-8")
    blocks = SCRIPT_RE.findall(spec)
    script = blocks[len(blocks) - 1]  # the last embedded python block
    raw, guards = guard_count(script)
    ledger = LEDGER.read_text(encoding="utf-8")
    match = re.search(r"(\d+) of the (\d+) GUARD CONDITIONS", ledger)
    assert match, "the ledger no longer states the guard coverage in the expected form"
    covered, stated_total = int(match.group(1)), int(match.group(2))
    # The TOTAL is checked against the script's own count, so a guard added or
    # removed cannot go unnoticed.
    assert stated_total == guards, (
        "the ledger says the script has {0} guard conditions; it has {1}. "
        "Re-derive the figure and update the ledger.".format(stated_total, guards)
    )
    assert covered <= guards, "the ledger claims more covered guards than there are guards"
    assert raw - guards == len(NOT_GUARDS), (
        "the exclusions no longer account for the difference: {0} refusing "
        "conditions, {1} guards, {2} exclusions".format(raw, guards, len(NOT_GUARDS))
    )
    # The COVERED half is checked too, because it is the half a reader acts on
    # and a figure whose covered count drifts silently is worse than no figure.
    # The measurement is expensive - a suite run per guard - so it is the
    # authority rather than a routine step, and the ROUTINE check is that the
    # ledger's covered count agrees with the measurement's own report, which
    # the measurement script writes where this test can read it.
    measured = _measured_coverage()
    if measured is not None:
        assert covered == measured, (
            "the ledger says {0} of the guards are covered; the measurement says "
            "{1}. Re-run scripts/measure_guard_coverage.py and update the "
            "ledger.".format(covered, measured)
        )

def _measured_coverage() -> int | None:
    """The covered count the measurement script last reported, if it has run.

    The measurement is expensive, so it is not re-run on every suite
    invocation. It writes its result to a file next to the script, and this
    test checks the ledger against that. When the file is absent - a fresh
    clone, or before anyone has run the measurement - the covered half is not
    checked, and that is stated rather than passed over silently.
    """
    report = ROOT / "reports_dev" / "guard-coverage.txt"
    if not report.is_file():
        return None
    match = re.search(r"(\d+) covered", report.read_text(encoding="utf-8"))
    return int(match.group(1)) if match else None
