"""Tests for the skills menus and the agent's preload budget.

Three artifacts describe the same 60 skills: the agent's `skills:` frontmatter (what
the harness preloads), the agent body's "Chapter skill index" table (what a reader
follows), and the README's Components table (the catalogue). They are edited by
hand, so they drift. These tests pin the invariants that make the three agree.

The load-bearing one is the preload budget. Claude Code injects the full content of
"the first 32 distinct names in the list" (sub-agents docs), so with 64 names
listed, the LIST ORDER selects which 32 skills have their content injected. Order is
therefore not cosmetic: it selects the preload set.

What happens to the skills past that window is narrower than "they do not exist":
the `skills` field controls what is PRELOADED, not what is accessible — "without
it, the subagent can still discover and invoke project, user, and plugin skills
through the Skill tool during execution" (same page). A skill past the 32-name
window gets no content injected and stays invocable. The cost is context, not
capability.

The README is the plugin's public catalogue and ships to users, so its heading
column and row order are enforced: a stale heading there is a defect a reader sees.
The order is alphabetical by heading, case-insensitively.

WHICH 32 skills are preloaded is a product decision. The frontmatter is where that
decision lives — the first 32 names of its `skills:` list are the ones Claude Code
injects in full. This file MIRRORS that window (PINNED_PRELOAD_SKILLS) the way
PINNED_CSPELL_IGNORE_PATHS mirrors .cspell.json's ignorePaths: the artifact decides,
the mirror checks. The mirror exists because the selection is otherwise invisible —
a skill demoted out of the window simply stops having its content injected, and
nothing errors. So a change to the window must be acknowledged here, deliberately,
by updating the mirror to match.
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

# Claude Code preloads the full content of at most this many distinct skills from an
# agent's `skills:` list, taking them in list order. See
# https://code.claude.com/docs/en/sub-agents ("up to the first 32 distinct names").
PRELOAD_LIMIT = 32

# A MIRROR of the agent frontmatter's first PRELOAD_LIMIT entries — the skills whose
# full content is injected into the agent's context. The frontmatter is authoritative;
# this list only checks it.
#
# The mirror exists because the preload window is a property of the LIST'S HEAD, and
# every other check stays green when the head changes: a coordinated edit that adds a
# skill to the frontmatter, the body index and the README in the same place shifts the
# window by one, and the frontmatter/body agreement check cannot see it — both copies
# agree. This mirror is the only check that catches that, because it records what the
# window WAS.
#
# To change WHICH skills are preloaded: edit the frontmatter's first 32 entries, then
# update this list to match. To reorder the frontmatter's TAIL, edit only the
# frontmatter — the tail is not preloaded and is not mirrored here.
PINNED_PRELOAD_SKILLS = [
    "tldr-code",
    "fastedit",
    "jgrep",
    "quicksilver",
    "mods-doc-mods-overview",
    "mods-doc-mods-development",
    "mods-doc-mods-interfaces",
    "mods-doc-mods-basic-examples",
    "mods-doc-mods-and-events",
    "mods-doc-mods-api",
    "mods-doc-mods-testing",
    "mods-doc-mods-troubleshooting",
    "mods-doc-mods-reference",
    "mods-doc-plugins-creation",
    "mods-doc-add-components-to-a-plugin",
    "mods-doc-plugins-depending-on-other-plugins",
    "mods-doc-test-plugins-with-evals",
    "mods-doc-publish-a-plugin",
    "mods-doc-manage-costs-of-a-plugin",
    "mods-doc-manage-plugins-from-cli",
    "mods-doc-install-and-manage-plugins",
    "mods-doc-official-marketplaces",
    "mods-doc-code-intelligence-components-in-plugins",
    "mods-doc-plugins-security-and-trust",
    "mods-doc-create-a-marketplace",
    "mods-doc-how-to-host-a-marketplace",
    "mods-doc-plugin-recomendations",
    "mods-doc-manage-plugins-in-organizations",
    "mods-doc-manage-mods-for-organizations",
    "mods-doc-troubleshooting-plugins",
    "mods-doc-tracing-the-origin-of-a-plugin",
    "mods-doc-plugin-manifest-reference",
]

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


def _headings(skills: list[Path]) -> list[str]:
    return [_h1(skill) for skill in skills]


def _duplicate_headings(headings: list[str]) -> list[str]:
    """The H1 values that appear more than once. A duplicate makes label matching ambiguous."""
    return sorted({h for h in headings if headings.count(h) > 1})


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


def test_preload_window_is_exactly_the_pinned_roster() -> None:
    """The first PRELOAD_LIMIT entries are exactly PINNED_PRELOAD_SKILLS.

    The frontmatter is authoritative; this list records what the window WAS, so a
    change to it has to be acknowledged. Without the mirror, a coordinated edit — one
    that adds a skill to the frontmatter, the body index and the README in the same
    place — shifts the preload window by one and leaves every other check green,
    because both hand-edited copies of the routing order still agree with each other.

    To change the window deliberately: edit the frontmatter's first 32 entries, then
    update PINNED_PRELOAD_SKILLS to match.
    """
    listed = _frontmatter_skills()
    assert listed[:PRELOAD_LIMIT] == PINNED_PRELOAD_SKILLS, (
        "the preloaded window changed; if that was intended, update PINNED_PRELOAD_SKILLS "
        "in this file to match the frontmatter's first 32 entries"
    )


def test_preloaded_skills_are_the_first_entries_in_frontmatter_order() -> None:
    """The skills whose content reaches the context are exactly the first PRELOAD_LIMIT entries.

    Claude Code injects the full content of the first 32 distinct names in the list,
    so position decides which skills are preloaded. This asserts that the window
    itself is well-formed: no duplicates (a duplicate would silently consume a slot)
    and every name in it resolves to a real skill.
    """
    listed = _frontmatter_skills()
    preloaded = listed[:PRELOAD_LIMIT]
    assert len(set(preloaded)) == len(preloaded), "duplicate skill in the preloaded prefix"
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

    PRECONDITION for this check, stated so its cost is not a surprise: the body index
    is the human-facing copy of the routing order, and the frontmatter is the copy the
    harness reads. Changing the routing order therefore means editing BOTH. This test
    exists to catch a one-sided edit — the case where the preload set and the
    navigation aid end up describing different orders. A one-sided edit that only
    touches the body table for readability will fail here, and the fix is to bring the
    frontmatter with it, not to relax the check.
    """
    listed = [name for name in _frontmatter_skills() if name not in TOOL_SKILLS]
    body = [skill for _, skill in _body_index()]
    assert listed == body, (
        "agent frontmatter and body index list different skills or orders; the frontmatter "
        "order selects the preload set, so the two must be changed together"
    )


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
    """The README is the public catalogue: a stale heading is a defect a reader sees."""
    rows = _readme_table()
    names = [skill for skill, _ in rows]
    assert len(names) == len(set(names)), "duplicate skill in the README table"
    stale = [(skill, heading, _h1(SKILLS / skill)) for skill, heading in rows if _h1(SKILLS / skill) != heading]
    assert not stale, f"README headings are stale: {stale}"
    assert set(names) == set(DOC_SKILLS), (
        f"only in README={sorted(set(names) - set(DOC_SKILLS))}, only on disk={sorted(set(DOC_SKILLS) - set(names))}"
    )


def test_readme_table_is_ordered_by_heading() -> None:
    """The catalogue is alphabetical by heading, case-insensitively.

    "Create a marketplace" precedes "CROSS SESSION MESSAGING REFERENCE" because
    "create" < "cross" once case is folded.
    """
    rows = _readme_table()
    headings = [heading for _, heading in rows]
    assert headings == sorted(headings, key=str.lower), "README table is not in heading order"


def test_h1_headings_are_unique_so_menus_can_be_matched_by_heading() -> None:
    """Two skills sharing an H1 would make the label-based checks ambiguous."""
    duplicates = _duplicate_headings(_headings(SKILL_DIRS))
    assert not duplicates, f"duplicate H1 headings: {duplicates}"


@pytest.mark.parametrize(
    ("headings", "expected"),
    [
        (["ALPHA", "BETA", "ALPHA"], ["ALPHA"]),
        (["ALPHA", "BETA"], []),
        (["SAME", "SAME", "SAME"], ["SAME"]),
    ],
)
def test_duplicate_heading_detection(headings: list[str], expected: list[str]) -> None:
    """Counter-example for the uniqueness rule the label checks depend on.

    A synthetic colliding pair shows the detection actually reports the collision,
    rather than the corpus simply happening to be unique today. Without this, the
    uniqueness test would only ever say "the corpus is fine now" and would not
    pin what happens when it is not.
    """
    assert _duplicate_headings(headings) == expected
