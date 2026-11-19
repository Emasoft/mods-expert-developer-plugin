"""No plugin-authored skill text may present the five-hour usage window as always available (TRDD-6OM5MW9R).

Anthropic made the five-hour window optional (owner, 2026-10-31): on some subscriptions only the weekly window and a
model window are reported. Vendored chapters (skills/mods-doc-*) and third-party NOTICE files are not ours to rewrite.

The rule: every prose line that mentions the five-hour window (5-hour, five-hour, five_hour, 5h) must also carry a
qualifier saying it may be absent or is conditional. Fenced code is skipped (the reference module names the kind in code).
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"

MENTION = re.compile(r"\b(5|five)[- _]?(hour|h)\b|five_hour", re.IGNORECASE)
QUALIFIER = re.compile(
    r"\bmay be absent\b|\bmay be independently absent\b|\bmay be missing\b|\boptional\b|\babsent\b|\bwhen (that|the) window is\b|"
    r"\bwhere the subscription\b|\bthat have one\b|\bthat has one\b|\bwith no (5|five)[- ]hour\b|\bwithout a (5|five)[- ]hour\b|"
    r"\bon some subscriptions\b|\bif (that|the) window is\b|\breported\b|\bnot verified\b|\bUNVERIFIED\b|\bno (5|five)[- ]hour\b",
    re.IGNORECASE,
)


def _plugin_authored() -> list[Path]:
    """Every Markdown file under skills/ that is not a vendored mods-doc chapter."""
    return sorted(p for p in SKILLS.rglob("*.md") if not p.relative_to(SKILLS).parts[0].startswith("mods-doc-"))


def flagged_lines(text: str) -> list[tuple[int, str]]:
    """Return (line number, line) for each prose line that mentions the five-hour window with no qualifier."""
    out: list[tuple[int, str]] = []
    in_fence = False
    for n, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence and MENTION.search(line) and not QUALIFIER.search(line):
            out.append((n, line.strip()[:160]))
    return out


def test_plugin_authored_text_is_found() -> None:
    """The scan covers the cost-and-metrics skill, so an empty scan cannot pass the next test."""
    assert SKILLS / "mods-example-cost-and-metrics/SKILL.md" in _plugin_authored()


def test_no_plugin_text_presents_the_five_hour_window_as_always_available() -> None:
    """Every plugin-authored prose line that mentions the five-hour window also says it may be absent or is conditional."""
    hits = [f"{p.relative_to(ROOT)}:{n}: {line}" for p in _plugin_authored() for n, line in flagged_lines(p.read_text(encoding="utf-8"))]
    assert not hits, "\n".join(hits)


def test_the_check_flags_the_old_always_available_wording() -> None:
    """The detector flags the pre-fix sentences: a share of the five-hour limit, the five-hour usage line, and the fixed pair."""
    assert flagged_lines("works out what the last prompt cost and its share of the five-hour limit, and saves the turns.")
    assert flagged_lines("a context bar, the five-hour usage, the agents")
    assert flagged_lines("pace against the 5-hour and 7-day limit, when the limit runs out")
    assert not flagged_lines("the five-hour window may be absent on some subscriptions")
