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
    # The ledger states the TOTAL, and only the total: the covered count is
    # derived by the measurement and is deliberately not asserted in prose,
    # because no routine check can enforce it.
    match = re.search(r"has (\d+) GUARD CONDITIONS", ledger)
    assert match, "the ledger no longer states the guard count in the expected form"
    stated_total = int(match.group(1))
    # The TOTAL is checked against the script's own count, so a guard added or
    # removed cannot go unnoticed.
    assert stated_total == guards, (
        "the ledger says the script has {0} guard conditions; it has {1}. "
        "Re-derive the figure and update the ledger.".format(stated_total, guards)
    )
    assert raw - guards == len(NOT_GUARDS), (
        "the exclusions no longer account for the difference: {0} refusing "
        "conditions, {1} guards, {2} exclusions".format(raw, guards, len(NOT_GUARDS))
    )
    # The COVERED count is deliberately NOT checked here, and NOT stated in the
    # ledger either. The measurement that derives it is expensive (a suite run
    # per guard) and its report is a local artefact, so a number in prose
    # about it would drift silently in every checkout that had not run it -
    # which is every fresh clone. A figure no check can enforce is worse than
    # no figure, so the ledger states the TOTAL, which IS enforced here, and
    # points at the measurement for the rest.
