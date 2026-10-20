"""The guard count the ledger states, checked against the script that owns it.

The ledger states how many guard conditions the spec self-check script has.
That number is a fact about the SCRIPT, and it changes whenever the script
changes - so a number written in a document is a snapshot that goes stale
the moment a guard is added, and a stale snapshot is worse than no figure:
a reader trusts it and does not look.

This test closes that loop in the cheap direction. It computes the guard
count from the script itself and requires the ledger to state that count, so
the two cannot drift apart silently: add a guard and this test fails, telling
the next editor that the ledger's figure needs re-deriving.

The ledger also NAMES the two conditions that are not guards, and names the
script's backstop condition. Those names are read here and bound to the
code, so the prose cannot drift from the script: rename a condition in the
script without updating the ledger and this test fails.

The ledger does NOT state how many guards have a test behind them. That
figure was removed because no routine check can enforce it - the
measurement that derives it is a full suite run per guard, so it lives in
`scripts/measure_guard_coverage.py` and is run by a reviewer rather than on
every change, and a number in prose about it would drift silently in every
checkout that had not run it. A figure no check can enforce is worse than no
figure, because a reader trusts it.
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
    match = re.search(r"the script has (\d+) GUARD CONDITIONS", ledger)
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
    # The COUNT of the exclusions is not enough on its own: the ledger NAMES
    # them, and prose that names code identifiers no check binds to the code is
    # the pattern this series exists to remove. So the ledger's backticked
    # conditions are read and required to be exactly the ones the code excludes.
    named = _ledger_named_conditions(ledger)
    expected = list(NOT_GUARDS) + [_ledger_named_backstop(ledger)]
    assert sorted(named) == sorted(expected), (
        "the guard-coverage bullet names the conditions {0}, but it may name "
        "only {1} - the two conditions that are not guards, and the backstop. "
        "One place owns the fact - say it in the code and point at it.".format(
            named, expected
        )
    )
    # The ledger names the uncovered BACKSTOP's condition, so the reader has a
    # pointer they can check rather than a prose description. That name must
    # be a condition the script actually has: if the guard is renamed and the
    # ledger is not, this fails. This is cheap - it needs no measurement run.
    backstop = _ledger_named_backstop(ledger)
    assert backstop, "the ledger no longer names the uncovered backstop's condition"
    script_conditions = [condition for _, condition in guard_conditions(script)]
    assert backstop in script_conditions, (
        "the ledger names the uncovered backstop as {0!r}, which is not a "
        "condition of the script. The script's refusing conditions are: "
        "{1}".format(backstop, script_conditions)
    )
    assert is_guard(backstop), (
        "the ledger calls {0!r} a guard, but the code excludes it as one of "
        "the conditions that are not guards.".format(backstop)
    )
    # The COVERED count is deliberately NOT checked here, and NOT stated in the
    # ledger either. The measurement that derives it is expensive (a suite run
    # per guard) and produces NO PERSISTED ARTEFACT, so a number in prose
    # about it would drift silently in every checkout that had not run it -
    # which is every fresh clone. A figure no check can enforce is worse than
    # no figure, so the ledger states the TOTAL, which IS enforced here, and
    # points at the measurement for the rest.
    #
    # The regex is anchored on "the script has ", not on "has N GUARD
    # CONDITIONS": the shorter form matches any occurrence in the file, and
    # re.search takes the FIRST one, so an unrelated sentence elsewhere could
    # supply the number this assert is about.


def _ledger_named_conditions(ledger: str) -> list[str]:
    """The conditions the ledger's guard-coverage bullet names, in order.

    The scope is the BULLET, not the whole document and not a fixed number
    of characters. A character count over prose a human rewrites is a future
    false alarm, because a reworded sentence can push a name out of the
    window; and the whole document is too wide, because an unrelated section
    that mentions a condition in passing would break the suite. The bullet is
    the passage that owns the figure, and it is found by a phrase that
    identifies it, so the scope survives a reword of the prose.
    """
    return re.findall(r"`(if [^`]+:)`", _guard_coverage_bullet(ledger))


def _guard_coverage_bullet(ledger: str) -> str:
    """The ledger's bullet that states the guard figure.

    Located by the phrase that bullet is about, so it is found by what it
    SAYS rather than by a line number, which a reword or an inserted bullet
    would move. The bullet is a single markdown list item; the text of the
    line is the passage.
    """
    marker = "GUARD CONDITIONS"
    index = ledger.find(marker)
    if index == -1:
        return ""
    start = ledger.rfind("\n- ", 0, index)
    if start == -1:
        start = ledger.rfind("\n", 0, index)
    # The bullet runs to the end of its LINE, and the names this reads can come
    # after the marker on that same line, so the line's end is the bound - not
    # the marker's position.
    end = ledger.find("\n", index)
    if start == -1 or end == -1:
        return ledger[index:]
    return ledger[start:end]


def _ledger_named_backstop(ledger: str) -> str:
    """The condition the ledger names as the uncovered BACKSTOP.

    The ledger points at that guard by name so a reader can check it against
    the script, rather than describing it in prose that no check can verify.
    """
    bullet = _guard_coverage_bullet(ledger)
    marker = "ends in a BACKSTOP (`"
    index = bullet.find(marker)
    if index == -1:
        return ""
    rest = bullet[index + len(marker) :]
    end = rest.find("`")
    return rest[:end] if end != -1 else ""
