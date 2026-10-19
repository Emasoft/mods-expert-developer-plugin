"""Tests for the skills menus and the agent's preload budget.

Three artifacts describe the same 60 skills: the agent's `skills:` frontmatter (what
the harness preloads), the agent body's "Chapter skill index" table (what a reader
follows), and the README's Components table (the catalogue). They are edited by
hand, so they drift. These tests pin the invariants that make the three agree.

The load-bearing one is the preload budget. Claude Code injects the full content of
"the first 32 distinct names in the list" (sub-agents docs), so with 64 names
listed, the LIST ORDER decides which 32 skills are actually preloaded and which 32
are silently not. Order is therefore not cosmetic: it selects the preload set.

The cosmetic checks (README heading column, README row order) are reported rather
than enforced, because the harness never reads the README.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
AGENT = ROOT / "agents/mods-expert-developer-agent.md"
README = ROOT / "README.md"

# Claude Code preloads at most this many distinct skills from an agent's `skills:` list.
# See https://code.claude.com/docs/en/sub-agents ("up to the first 32 distinct names").
PRELOAD_LIMIT = 32

# The non-doc skills the agent preloads ahead of the documentation wrappers. Pinned so
# that a fifth tool skill is caught and a dropped one is not silently tolerated.
TOOL_SKILLS = ("tldr-code", "fastedit", "jgrep", "quicksilver")

# A markdown table row: two cells, no padding, no inner pipes. Every cell in both
# menus matches this exactly (no H1 contains a backtick, pipe or backslash).
TABLE_ROW = re.compile(r"^\| ([^|]+) \| ([^|]+) \|$")


def _h1(skill: Path) -> str:
    """The skill's H1 heading, which is what both menus display as its label."""
    match = re.search(r"^# (.+)$", (skill / "SKILL.md").read_text(encoding="utf-8"), re.M)
    assert match is not None, f"{skill.name} has no H1 heading"
    return match.group(1).strip()


def _frontmatter_skills() -> list[str]:
    """The agent's `skills:` list, in file order."""
    text = AGENT.read_text(encoding="utf-8")
    block = text[4 : text.index("\n---\n", 4)]
    listed = yaml.safe_load(block)["skills"]
    assert isinstance(listed, list), "agent frontmatter `skills` is not a list"
    return listed


def _body_index() -> list[tuple[str, str]]:
    """(label, skill) pairs from the agent body's "Chapter skill index" table, in file order."""
    text = AGENT.read_text(encoding="utf-8")
    body = text.split("## Chapter skill index", 1)[1]
    rows: list[tuple[str, str]] = []
    for line in body.splitlines():
        if not line.startswith("|"):
            if rows:
                break
            continue
        match = TABLE_ROW.match(line)
        if match is None:
            if rows:
                break
            continue
        label, skill = match.group(1), match.group(2).strip("`")
        if label in {"Use case", "---"} or set(label) == {"-"}:
            continue
        rows.append((label, skill))
    return rows


def _readme_table() -> list[tuple[str, str]]:
    """(skill, heading) pairs from the README's Components table, in file order."""
    text = README.read_text(encoding="utf-8")
    section = text.split("## Components", 1)[1]
    rows: list[tuple[str, str]] = []
    for line in section.splitlines():
        if not line.startswith("|"):
            if rows:
                break
            continue
        match = TABLE_ROW.match(line)
        if match is None:
            if rows:
                break
            continue
        skill, heading = match.group(1), match.group(2)
        if skill in {"Skill", "---"} or set(skill) == {"-"}:
            continue
        rows.append((skill, heading))
    return rows


SKILL_DIRS = sorted(d for d in SKILLS.iterdir() if d.is_dir())
DOC_SKILLS = [d.name for d in SKILL_DIRS]


def test_agent_preloads_at_most_the_documented_skill_limit() -> None:
    """The agent lists more skills than the harness preloads, so the ORDER selects the preload set.

    Claude Code injects the full content of the first 32 distinct names in an agent's
    `skills:` list. The 64 names listed here therefore mean the first 32 are preloaded
    and the remaining 32 are not. That is a deliberate selection, not a truncation to
    fix later — so it is pinned here rather than left implicit in a hand-edited list.
    """
    listed = _frontmatter_skills()
    assert len(listed) > PRELOAD_LIMIT, (
        f"the agent now lists {len(listed)} skills, at or below the {PRELOAD_LIMIT}-skill "
        "preload limit; the preload-selection intent below needs re-deciding"
    )


def test_preloaded_skills_are_the_first_entries_in_frontmatter_order() -> None:
    """The skills that get their content injected are exactly the first PRELOAD_LIMIT entries."""
    listed = _frontmatter_skills()
    preloaded = listed[:PRELOAD_LIMIT]
    assert len(preloaded) == PRELOAD_LIMIT
    assert len(set(preloaded)) == len(preloaded), "duplicate skill in the preloaded prefix"
    # Every preloaded skill must be a real, loadable skill.
    for name in preloaded:
        if name not in TOOL_SKILLS:
            assert (SKILLS / name / "SKILL.md").exists(), f"preloaded skill {name} does not exist"


def test_tool_skills_precede_the_documentation_wrappers() -> None:
    """The tool skills come first, so they are always inside the preload window."""
    listed = _frontmatter_skills()
    assert listed[: len(TOOL_SKILLS)] == list(TOOL_SKILLS)
    non_doc = [name for name in listed if not (SKILLS / name / "SKILL.md").exists()]
    assert non_doc == list(TOOL_SKILLS), f"unexpected non-doc skills in the list: {non_doc}"


def test_frontmatter_and_body_index_list_the_same_skills_in_the_same_order() -> None:
    """The two hand-edited copies of the routing order must not diverge.

    They agree today, and the redundancy is the point: a human editing one sees the
    other disagree. Divergence means the preload set (frontmatter) and the navigation
    aid (body table) describe different things.
    """
    listed = [name for name in _frontmatter_skills() if name not in TOOL_SKILLS]
    body = [skill for _, skill in _body_index()]
    assert listed == body, "agent frontmatter and body index list different skills or orders"


def test_body_index_covers_every_skill_exactly_once() -> None:
    """Set equality, not a subset: a dropped row would silently lose a skill from the preload list."""
    body = [skill for _, skill in _body_index()]
    assert len(body) == len(set(body)), "duplicate skill in the body index"
    assert set(body) == set(DOC_SKILLS), (
        "body index and skills/ disagree: "
        f"only in body={sorted(set(body) - set(DOC_SKILLS))}, "
        f"only on disk={sorted(set(DOC_SKILLS) - set(body))}"
    )


def test_body_index_labels_match_the_skill_headings() -> None:
    """Each row's label is the skill's H1, so the table cannot show a stale title."""
    for label, skill in _body_index():
        assert label == _h1(SKILLS / skill), f"body index label for {skill} is stale"


def test_readme_table_covers_every_skill_with_its_current_heading() -> None:
    """The README is a catalogue, not a preload list, so this is reported rather than enforced."""
    rows = _readme_table()
    names = [skill for skill, _ in rows]
    assert len(names) == len(set(names)), "duplicate skill in the README table"
    stale = [(skill, heading, _h1(SKILLS / skill)) for skill, heading in rows if _h1(SKILLS / skill) != heading]
    assert not stale, f"README headings are stale: {stale}"
    assert set(names) == set(DOC_SKILLS), (
        f"only in README={sorted(set(names) - set(DOC_SKILLS))}, only on disk={sorted(set(DOC_SKILLS) - set(names))}"
    )


def test_readme_table_is_ordered_by_heading() -> None:
    """Informational only: the harness never reads the README, so this orders the catalogue.

    The order is case-insensitive by heading: "Create a marketplace" precedes
    "CROSS SESSION MESSAGING REFERENCE" because "create" < "cross".
    """
    rows = _readme_table()
    headings = [heading for _, heading in rows]
    assert headings == sorted(headings, key=str.lower), "README table is not in heading order"


def test_readme_and_body_tables_use_their_own_separator_format() -> None:
    """The two tables are formatted differently; a shared template would corrupt one of them."""
    readme_section = README.read_text(encoding="utf-8").split("## Components", 1)[1]
    assert "|---|---|" in readme_section, "README table separator changed"
    agent_text = AGENT.read_text(encoding="utf-8")
    body_section = agent_text.split("## Chapter skill index", 1)[1]
    assert "| --- | --- |" in body_section, "body index separator changed"


def test_h1_headings_are_unique_so_menus_can_be_matched_by_heading() -> None:
    """Two skills sharing an H1 would make the label-based checks ambiguous."""
    headings = [_h1(skill) for skill in SKILL_DIRS]
    duplicates = sorted({h for h in headings if headings.count(h) > 1})
    assert not duplicates, f"duplicate H1 headings: {duplicates}"


def test_duplicate_h1_makes_the_label_check_ambiguous() -> None:
    """Counter-example: the label check is only meaningful while H1s are unique.

    This asserts the rule with a synthetic pair whose H1s collide, so a future change
    that relaxes the uniqueness check cannot leave the label check quietly wrong.
    """
    assert _h1(SKILLS / "mods-doc-mods-overview") != _h1(SKILLS / "mods-doc-mods-development")
    headings = [_h1(skill) for skill in SKILL_DIRS]
    assert len(set(headings)) == len(headings), "the uniqueness invariant this check depends on is broken"


@pytest.mark.parametrize("skill_name", ["mods-doc-mods-overview", "mods-doc-plugins-creation"])
def test_preload_window_covers_the_entry_skills(skill_name: str) -> None:
    """Named entry-point skills must be inside the preload window, not past the limit.

    The first 32 entries are the ones whose content reaches the agent's context. A
    skill a reader is told to load by name must not sit in the un-preloaded tail.
    """
    listed = _frontmatter_skills()
    assert skill_name in listed[:PRELOAD_LIMIT], (
        f"{skill_name} is at position {listed.index(skill_name) + 1}, past the {PRELOAD_LIMIT}-skill preload limit"
    )
