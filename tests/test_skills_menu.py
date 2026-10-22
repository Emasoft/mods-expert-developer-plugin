"""Tests for the skills menus and the agent's preload budget.

Three artifacts describe the same 61 skills: the agent's `skills:` frontmatter (what
the harness preloads), the agent body's "Chapter skill index" table (what a reader
follows), and the README's Components table (the catalogue). They are edited by
hand, so they drift. These tests pin the invariants that make the three agree.

The load-bearing one is the preload budget. Claude Code injects the full content of
"the first 32 distinct names in the list" (sub-agents docs), so with more than 32
names listed, the LIST ORDER selects which 32 skills have their content injected.
Order is therefore not cosmetic: it selects the preload set.

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
the mirror checks. The mirror exists because a coordinated edit that shifts the window
leaves every other check green — both hand-edited copies of the routing order still
agree with each other — so the mirror is the only check that sees the window move.
See the comment on PINNED_PRELOAD_SKILLS for why it records membership and not order,
and what that costs.
"""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
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
# this set only checks it.
#
# The mirror exists because the preload window is a property of the LIST'S HEAD, and
# every other check stays green when the head changes: a coordinated edit that adds a
# skill to the frontmatter, the body index and the README in the same place shifts the
# window by one, and the frontmatter/body agreement check cannot see it — both copies
# agree. This mirror is the only check that catches that, because it records what the
# window WAS.
#
# It is mirrored as a SET, not a sequence, and that reduction is deliberate. The
# documentation does not give order WITHIN the window any meaning: it says the first
# 32 distinct names are preloaded, and all 32 of them get their full content, so the
# membership is the whole of what it specifies. That is an argument from silence, not
# a documented guarantee: if a future Claude Code release makes order within the
# window meaningful (a most-relevant-first preload policy, or a context budget that
# trims by position), this mirror would silently stop protecting the property it
# guards, and nothing in the repo would flag it. Re-check the docs if the harness
# changes.
#
# So a set is the right instrument for what is specified: it survives a reordering
# of the window, so acknowledging a change is a one-line edit, while a promotion
# across the boundary or a demotion out of it still fails. Mirroring the sequence
# would make every acknowledged change a full re-list of 32 names, since one
# insertion shifts all the entries after it — a cost paid on every routing change to
# guard a property the documentation does not give.
#
# The cost of the set form: a diff of it shows that a member left and another joined,
# but not which member left. Read the frontmatter's own diff when changing the
# window, to see who was displaced.
#
# To change WHICH skills are preloaded: edit the frontmatter's first 32 entries, then
# update this set to match. To reorder the frontmatter's TAIL, edit only the
# frontmatter — the tail is not preloaded and is not mirrored here.
PINNED_PRELOAD_SKILLS = {
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
    "mods-doc-marketplace-manifest-reference",
    "mods-doc-plugin-commands-reference",
    "mods-doc-hooks-reference",
    "mods-doc-automate-actions-with-hooks",
}

# The four USER-SCOPE tool skills the agent uses but the plugin does NOT ship.
# They are deliberately ABSENT from the frontmatter's `skills:` list: a preload of a
# skill that resolves in no skill search root of THIS plugin is a MAJOR finding
# (Claude Code skips a missing preload and only logs a warning, so the agent silently
# runs without it), and these four resolve only in a developer's own `~/.claude/skills`.
# The agent loads them on demand instead; they are optional but recommended, with a native fallback.
#
# Pinned so that a fifth tool skill is caught and a dropped one is not silently
# tolerated. This constant is now a NEGATIVE list - the tool skills are what must NOT
# be preloaded - so the tests below assert their ABSENCE.
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
# Identical copy of CATALOG_SKILLS in tests/test_plugin_structure.py; test_catalog_skills_copies_agree
# fails if the two drift. A catalog skill indexes the chapters instead of wrapping one, so it is not
# routed by the expert agent and is not a row of the README Components table.
CATALOG_SKILLS = {"mods-the-skills-menu"}
# Identical copy of TUTORIAL_SKILLS in tests/test_plugin_structure.py; test_tutorial_skills_copies_agree fails if the
# two drift. A tutorial is reference-only (TRDD-BDY6ZNDZ): it is listed by the menu in its own group, but it is not a
# chapter, so it is not routed by the expert agent and is not a row of the README Components table.
TUTORIAL_SKILLS = {"mods-tutorial-quickstart", "mods-tutorial-call-intercept-mods", "mods-tutorial-interface-mods"}
DOC_SKILLS = [d.name for d in SKILL_DIRS if d.name not in CATALOG_SKILLS | TUTORIAL_SKILLS]


def test_preload_window_is_exactly_the_pinned_roster() -> None:
    """The first PRELOAD_LIMIT entries are exactly the pinned set.

    The frontmatter is authoritative; this set records what the window WAS, so a
    change to it has to be acknowledged. Without the mirror, a coordinated edit — one
    that adds a skill to the frontmatter, the body index and the README in the same
    place — shifts the preload window by one and leaves every other check green,
    because both hand-edited copies of the routing order still agree with each other.

    Compared as a SET, so a reordering of the window does not require re-listing it:
    acknowledging a change is a one-line edit. A promotion across the boundary or a
    demotion out of it still fails, because the membership differs.

    To change the window deliberately: edit the frontmatter's first 32 entries, then
    update PINNED_PRELOAD_SKILLS to match.
    """
    listed = _frontmatter_skills()
    assert set(listed[:PRELOAD_LIMIT]) == PINNED_PRELOAD_SKILLS, (
        "the preloaded window changed; if that was intended, update PINNED_PRELOAD_SKILLS "
        "in this file to match the frontmatter's first 32 entries"
    )


def test_preloaded_skills_are_the_first_entries_in_frontmatter_order() -> None:
    """The skills whose content reaches the context are exactly the first PRELOAD_LIMIT entries.

    Claude Code injects the full content of the first 32 distinct names in the list,
    so position decides which skills are preloaded. This asserts that the window
    itself is well-formed: no duplicates (a duplicate would silently consume a slot)
    and every name in it resolves to a real skill that THIS plugin ships.

    The `name not in TOOL_SKILLS` escape used to exist because the tool skills were
    preloaded and are not shipped here. They are no longer preloaded at all, so the
    escape is gone: every name in the window must now resolve to a shipped skill.
    """
    listed = _frontmatter_skills()
    preloaded = listed[:PRELOAD_LIMIT]
    assert len(set(preloaded)) == len(preloaded), "duplicate skill in the preloaded prefix"
    for name in preloaded:
        assert (SKILLS / name / "SKILL.md").exists(), f"preloaded skill {name} does not exist"


def test_every_declared_skill_resolves_to_a_shipped_skill() -> None:
    """Every name in the frontmatter resolves to a skill this plugin ships.

    This is the WHOLE-LIST property, and it is what the removed
    `test_tool_skills_precede_the_documentation_wrappers` asserted: the only
    names anywhere in the list lacking a shipped `SKILL.md` were exactly the
    four tool skills. The new `test_the_tool_skills_are_not_preloaded` pins
    those four's absence, and `test_preloaded_skills_are_the_first_entries_in
    _frontmatter_order` covers only the first 32 — so without this test the
    29 TAIL entries (positions 33-61) have no resolvability check at all,
    even though CPV's validator checks EVERY `skills:` entry, not just the
    preload window.

    `SKILL_DIRS` filters on `d.is_dir()` alone, so a directory with no
    `SKILL.md` counts as a shipped skill here and would NOT be caught by
    `DOC_SKILLS`. This test is what catches it.
    """
    listed = _frontmatter_skills()
    unresolved = [name for name in listed if not (SKILLS / name / "SKILL.md").exists()]
    assert not unresolved, (
        f"the frontmatter declares these names, which resolve to no shipped SKILL.md: "
        f"{unresolved}. CPV's strict validation reports each as a MAJOR "
        f"('skills' preloads '<name>' but no such skill exists in any skill search root), "
        f"and a preload that resolves nowhere is SKIPPED by Claude Code at runtime."
    )


def test_the_tool_skills_are_not_preloaded() -> None:
    """The four tool skills are absent from the frontmatter's `skills:` list.

    THIS IS THE CONTRACT THAT KEEPS THE PLUGIN PORTABLE. `tldr-code`, `fastedit`,
    `jgrep` and `quicksilver` are USER-SCOPE skills: they live in a developer's own
    `~/.claude/skills`, not in this plugin. A preload of a skill that resolves in no
    skill search root of THIS plugin is a MAJOR finding in CPV's strict validation —
    and it is a real defect, not a lint quibble: Claude Code SKIPS a missing preload
    and only logs a warning to the debug log, so an installed user silently runs an
    agent that lacks four of its tools, while CI (where the user scope is empty)
    reports MAJOR=4 and turns the build red.

    The agent loads these four on demand instead (they are optional but recommended, and the
    agent falls back to native tools when one is not installed). That behaviour lives in the
    agent body, not here; this test pins the frontmatter side of it.
    """
    listed = _frontmatter_skills()
    present = [name for name in TOOL_SKILLS if name in listed]
    assert not present, (
        f"the user-scope tool skills {present} are preloaded; the plugin does not ship "
        "them, so a preload of them is a MAJOR finding and silently drops the skill "
        "at runtime. Remove them from the frontmatter's `skills:` list."
    )


def test_every_shipped_skill_is_still_declared() -> None:
    """All 61 skills remain declared in the frontmatter.

    The property that matters is not "which 32" but that no skill absent from the
    plugin is preloaded AND every shipped chapter is still declared. Dropping the
    declarations would not break the agent — the Skill tool discovers plugin skills
    at runtime regardless — but it would break the frontmatter↔body↔README
    agreement that the routing table is built on, and it would make the frontmatter
    stop describing what the agent can reach.
    """
    listed = _frontmatter_skills()
    missing = sorted(set(DOC_SKILLS) - set(listed))
    assert not missing, f"the frontmatter no longer declares these shipped chapters: {missing}"


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
    listed = _frontmatter_skills()
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


# --- home-path guard ----------------------------------------------------------
#
# ONE rule, over the whole tracked tree. It replaces three narrower rules
# because those missed a failure mode the plugin had already hit twice: a
# literal home path written into ANY tracked file — a chapter, the ledger,
# the README, or this very test file's own prose — is a CPV MAJOR finding.
# The chapters-only scope could not see the ledger; the ledger-only fix
# could not see this file.
#
# The property asserted is the PLUGIN'S, not a validator's: no file this
# plugin ships may contain a home path that reads as a real person's home
# directory. The plugin is read by people, and a name like "sarah" reads as
# a person, not as a placeholder. This survives any change to any validator;
# a rule stated as "no shape CPV dislikes" would not.
#
# WHAT THIS RULE ACTUALLY IS: a SHORT LIST OF SPELLINGS KNOWN NOT TO BE
# NAMES. "Reads as a real name" is a semantic property and is not decidable
# by a lookup table; the honest form of the rule is "a segment not on this
# list is treated as a name", and the list is deliberately short enough to
# read and check. It is NOT extended by shape: "my-project" is a project,
# but no shape test can tell a project from a person — one that accepts
# "my-project" also accepts "myra", which is exactly the case the rule
# exists to catch.
#
# The list is the corpus's own vocabulary: the account tokens the upstream
# text uses for "your account", plus the two project names it uses. A
# re-sync introducing a new spelling is FLAGGED, and the fix is to decide
# whether that spelling is a name — a judgement, made once, in one place.
#
# The list is NOT extended speculatively. A role account like `admin` or
# `root` reads as a role rather than as a person, so it would be a
# reasonable addition — but neither appears in the corpus today, and
# pre-adding spellings that nothing uses is how a list stops being a
# judgement and becomes a superstition. The rule is deliberately
# CONSERVATIVE: anything not on the list is treated as a name, so a
# re-sync introducing one is flagged and a human decides. The cost of a
# false positive is one line in one list; the cost of a false negative is
# shipping somebody's name.
#
# The guard exists because a re-sync of the chapters from Anthropic's
# upstream would restore the adapted form SILENTLY. Nothing else in the
# suite reads chapter prose, and CPV's own scan — the only other thing that
# would notice — is blocked by upstream issue #243, so it cannot be relied
# on as the guard.
#
# KNOWN LIMITS, both recorded in DELEGATION.md:
#   - The file list comes from the git INDEX, so a file that is present but
#     not yet `git add`ed is invisible to the rule. It is also not shipped
#     in that state, so the gap closes when it is staged.
#   - A tracked file that is unreadable (deleted from the working tree, or
#     binary) is skipped rather than reported.

# Generic account placeholders: the tokens the upstream text uses for
# "your account". A segment NOT in this set is treated as a name.
_GENERIC_ACCOUNT_SEGMENTS = frozenset(
    {
        "user",
        "username",
        "you",
        "example",
        "...",
        # A Windows 8.3 SHORT NAME is a machine-generated abbreviation of a
        # long path ("LONGNA~1"), not a person's name. The corpus carries
        # one such example, and the rule judges NAMES, so it is generic.
        "LONGNA~1",
    }
)

# Generic PROJECT names, by exact spelling. These name a directory, not an
# account. They are listed rather than pattern-matched on purpose: a shape
# test ("starts with my") would also accept a personal name that begins
# with "my", which is precisely the case this guard exists to catch.
_GENERIC_PROJECT_SEGMENTS = frozenset({"my-project", "my-other-repo"})

# Files whose content is a SPECIMEN rather than documentation the plugin
# ships. A test file may legitimately NAME the offending values in order to
# assert they are absent, so the whole `tests/` tree is exempt. The
# exemption is by DIRECTORY, not by an exact filename, so a future test file
# inherits it; the price is that a real home path added to the suite would
# not be caught, which is recorded in DELEGATION.md.
_GUARD_EXEMPT_DIRS = ("tests",)

# A home path: a user segment under a home directory, then anything.
#
# THREE home shapes, because the corpus uses three and a rule that only
# recognises one of them is blind to the other two:
#   macOS    /Users/<segment>
#   Linux    /home/<segment>
#   Windows  C:/Users/<segment>  or  C:\Users\<segment>
#
# The Windows form appears with either slash direction, so both are
# matched: a rule about NAMES must not depend on which way the path
# happens to be written.
# The judgement of whether a segment is a NAME is the plugin's own and does
# not depend on the shape; the shapes are what a home path LOOKS like, and
# the corpus demonstrates all three. The Linux shape additionally keeps
# upstream's own three `/home/user/` lines honest — `user` is on the
# generic list, so they are allowed, exactly as the macOS ones are.
_HOME_PATH = re.compile(
    r"(?:/Users/|/home/|C:[\\/]Users[\\/])([A-Za-z0-9_.~-]+)"
)


def _is_generic_account_segment(segment: str) -> bool:
    """True iff `segment` is a recognised generic placeholder, not a name.

    Two kinds count, and the plugin cares about both:

    - ACCOUNT placeholders: the tokens the upstream text uses for "your
      account" (`user`, `username`, `you`, `example`, `...`).
    - PROJECT names: a segment that names a directory rather than an
      account. The corpus's own upstream values are `my-project` and
      `my-other-repo`; they are recognised here BY EXACT SPELLING, not by
      shape, because a shape test would also accept a person's name that
      happens to start with "my" (`myra`, `myles`). Spelling them out is
      honest about what the rule can and cannot tell: a project name and a
      person are different things, and only a person's name is the defect.
    """
    if segment in _GENERIC_ACCOUNT_SEGMENTS:
        return True
    return segment in _GENERIC_PROJECT_SEGMENTS


def test_no_tracked_file_contains_a_home_path_that_reads_as_a_person() -> None:
    """No shipped DOCUMENT may contain a home path whose segment is a NAME.

    The rule this test enforces, exactly: a path segment UNDER A RECOGNISED
    HOME ROOT (a macOS user root, a Linux user root, a Windows user root,
    with either slash direction) that is NOT on the known-not-a-name list is
    treated as a name. A path under somebody's own name reads, to a person,
    as somebody's actual home directory; the plugin ships these files to
    users, so that reading is the one that counts — whether or not a
    validator objects.

    The property is deliberately narrower than "any path segment that names
    a person": a segment under some other root is not covered, and the rule
    says so rather than implying a coverage it does not have.

    Two boundaries, both deliberate:
      - COVERAGE is every readable tracked file, not an extension
        allowlist. An earlier version skipped NOTICE and LICENSE, which
        the plugin ships, and both were hit in this series.
      - The only exclusion is the `tests/` tree, where a file may
        legitimately NAME the values it asserts are absent. There is no
        file-type exclusion: an earlier version had one for four machine
        artefacts, and it defended nothing — none of the four contained a
        home path at all — while it excluded a git hook that a maintainer
        reads, which the rule's own justification includes.
    """
    tracked = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    offending: list[str] = []
    for rel in tracked:
        if any(part in _GUARD_EXEMPT_DIRS for part in Path(rel).parts):
            continue
        path = ROOT / rel
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            # A file that is tracked but unreadable (deleted from the working
            # tree, or binary) is skipped. Recorded as a known limit.
            continue
        for lineno, line in enumerate(text.splitlines(), 1):
            for match in _HOME_PATH.finditer(line):
                segment = match.group(1)
                if not _is_generic_account_segment(segment):
                    offending.append(f"{rel}:{lineno}: {line.strip()[:100]}")
                    break
    assert not offending, "home paths that read as a person's home:\n" + "\n".join(offending)


def test_adapted_payloads_keep_one_home_path_convention() -> None:
    """Each payload must use ONE home-path convention, not two.

    The hooks chapter's own convention is the macOS-shaped elision
    (`/Users/.../`), used on 60+ lines; a few upstream payloads use
    `/home/user/`. Mixing a `/home/user/` cwd with a `/Users/...` transcript
    path in the SAME JSON object reads as a Linux home beside a macOS
    transcript, which is incoherent — so each payload must pick one home
    shape and use it for every path in that payload.

    The Windows home shape (`C:/Users/...`) counts as a THIRD shape, and a
    payload that shows it is not incoherent on its own — the corpus
    documents Windows behaviour, and one payload legitimately shows a
    PowerShell command with a Windows path. What is incoherent is a payload
    that mixes two DIFFERENT unix home shapes. This check is about the unix
    shapes, which is where the incoherence this series actually found lived.
    """
    incoherent: list[str] = []
    for chapter in sorted(SKILLS.glob("*/references/chapter.md")):
        text = chapter.read_text(encoding="utf-8")
        for block in re.findall(r"```json[^\n]*\n(.*?)```", text, re.DOTALL):
            unix_shapes = {shape for shape in ("/Users/", "/home/") if shape in block}
            if len(unix_shapes) > 1:
                incoherent.append(f"{chapter.relative_to(ROOT)}: {sorted(unix_shapes)}")
    assert not incoherent, "payloads mixing home-path conventions:\n" + "\n".join(incoherent)


def test_readme_skill_relative_paths_are_qualified() -> None:
    """README paths into a skill directory must be qualified with `skills/<name>/`.

    `references/chapter.md` and `agents/openai.yaml` are SKILL-relative: they
    exist inside each skill directory, not at the plugin root. Written bare,
    they read as plugin-root paths that do not resolve — a reader following
    them lands on a file that is not there.
    """
    text = README.read_text(encoding="utf-8")
    bare = re.findall(r"`(references/chapter\.md|agents/openai\.yaml)`", text)
    assert not bare, f"unqualified skill-relative paths in README.md: {sorted(set(bare))}"



# --- forge agent and skills menu -----------------------------------------------
#
# The forge agent preloads ONE skill, the menu, and loads every chapter on demand
# through it. So the menu must name every chapter exactly once with a loadable
# namespaced name, and the agent frontmatter must keep the user's pins (Opus 5.5,
# the menu as its only preload). The namespace is read from plugin.json, never
# hardcoded, so renaming the plugin without regenerating the menu fails here.

FORGE_AGENT = ROOT / "agents/mods-forge-agent.md"
MENU = SKILLS / "mods-the-skills-menu"
MENU_CATALOG = MENU / "references/skills-catalog.md"

# CPV's mandatory dynamic-loading paragraph, verbatim (the-skills-menu spec, "Agent body instruction rule").
DYNAMIC_LOADING_PARAGRAPH = (
    "You must load the skills you need dynamically. Use the Skill() tool to load them. Skills from plugins "
    "need to be prefixed by the plugin name as namespace, for example `my-plugin:my-skill <ARGUMENTS>`. "
    "Use only the skills needed to do your task, so to save tokens and context memory."
)

SKILL_CALL = re.compile(r'Skill\(\{skill: "([^"]+)"')
LOAD_WITH = re.compile(r'^\*\*Load with:\*\* `Skill\(\{skill: "([^"]+)"', re.M)


def _namespace() -> str:
    """The plugin namespace, read from the manifest so no test hardcodes it."""
    name = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))["name"]
    assert isinstance(name, str)
    return name


def _split(path: Path) -> tuple[dict, str]:
    """(parsed frontmatter, body) of a markdown file."""
    text = path.read_text(encoding="utf-8")
    assert text.startswith("---\n"), f"{path.name} has no frontmatter"
    end = text.index("\n---\n", 4)
    return yaml.safe_load(text[4:end]), text[end + 5 :]


def _menu_table_skills(text: str) -> list[str]:
    """Skill cells of every table under the menu's `## Plugin Skills` section, in file order."""
    section = text.split("\n## Plugin Skills\n", 1)[1]
    rows: list[str] = []
    for line in section.splitlines():
        match = TABLE_ROW.match(line)
        if match and match.group(1) != "Skill":
            rows.append(match.group(1))
    return rows


def _expected_menu_names() -> list[str]:
    """Every name the menu tables and the catalog list: the chapters plus the reference-only tutorials."""
    return sorted(f"{_namespace()}:{name}" for name in [*DOC_SKILLS, *TUTORIAL_SKILLS])


def test_tutorial_skills_copies_agree() -> None:
    """TUTORIAL_SKILLS here equals the copy in test_plugin_structure.py, so the two files exclude the same skills."""
    spec = importlib.util.spec_from_file_location("_structure", ROOT / "tests" / "test_plugin_structure.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.TUTORIAL_SKILLS == TUTORIAL_SKILLS


def test_catalog_skills_copies_agree() -> None:
    """CATALOG_SKILLS here equals the copy in test_plugin_structure.py, so the two files exclude the same skills."""
    spec = importlib.util.spec_from_file_location("_structure", ROOT / "tests" / "test_plugin_structure.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.CATALOG_SKILLS == CATALOG_SKILLS


def test_every_catalog_skill_exists() -> None:
    """Every CATALOG_SKILLS member is a shipped skill; a stale exclusion would hide nothing and mislead."""
    missing = [name for name in sorted(CATALOG_SKILLS) if not (SKILLS / name / "SKILL.md").is_file()]
    assert not missing, f"CATALOG_SKILLS names skills that are not shipped: {missing}"


def test_forge_agent_is_pinned_to_opus_5_5() -> None:
    """The user's directive pins the forge agent to Opus 5.5, by its full model ID."""
    fields, _ = _split(FORGE_AGENT)
    assert fields["model"] == "claude-opus-5-5"


def test_forge_agent_preloads_only_the_menu() -> None:
    """The forge agent preloads exactly one skill, the menu, and reaches every chapter through it."""
    fields, _ = _split(FORGE_AGENT)
    assert fields["skills"] == ["mods-the-skills-menu"]


def test_every_agent_preload_is_mods_prefixed() -> None:
    """Every `skills:` entry of every agent starts with `mods-`.

    Naming rule, not collision detection; real collision coverage is the post-install smoke check.
    """
    for agent in sorted((ROOT / "agents").glob("*.md")):
        fields, _ = _split(agent)
        bad = [s for s in fields.get("skills", []) if not s.startswith("mods-")]
        assert not bad, f"{agent.name} preloads skills without the mods- prefix: {bad}"


def test_no_file_calls_the_old_bare_name_this_plugins_menu() -> None:
    """No agent, skill or README text refers to the retired bare name as this plugin's menu."""
    old = "cpv" + "-the-skills-menu"
    files = [ROOT / "README.md", *(ROOT / "agents").glob("*.md"), *SKILLS.rglob("*.md")]
    hits = [str(f.relative_to(ROOT)) for f in files if old in f.read_text(encoding="utf-8")]
    assert not hits, f"files still use the retired bare menu name: {hits}"


def test_forge_agent_declares_no_tools_field() -> None:
    """No `tools` field: the agent inherits every tool, including Skill, which it needs to load chapters."""
    fields, _ = _split(FORGE_AGENT)
    assert "tools" not in fields


def test_forge_agent_first_paragraph_is_the_dynamic_loading_instruction() -> None:
    """The body opens with one H1 line, then CPV's mandatory dynamic-loading paragraph verbatim."""
    _, body = _split(FORGE_AGENT)
    paragraphs = [p.strip() for p in body.strip().split("\n\n")]
    assert paragraphs[0].startswith("# ") and "\n" not in paragraphs[0], "the body does not open with an H1 line"
    assert paragraphs[1] == DYNAMIC_LOADING_PARAGRAPH


def test_forge_agent_names_the_menu_and_its_heading() -> None:
    """The report-first-line rule is checkable: the body names the preloaded skill but quotes none of the menu's own text.

    The agent must copy the Plugin Skills domain groups out of the menu it actually received. If the
    body already contained the menu H1 or a domain name, an agent that never got this plugin's menu
    (the preload resolved to another plugin's same-named skill) could still write a correct first line
    from the body alone. The model ID is likewise absent: an agent's claim about its own model proves
    nothing. "Mods" and "Plugins" are skipped: they are plain words the body legitimately uses.

    The check discriminates against CPV's same-named menu (whose Plugin Skills section has no domain
    groups, measured 2026-10-22 on claude-plugins-validation 5.22.5). It proves nothing more than that.
    The domain set is read from the menu file (every ### heading under "## Plugin Skills"), never pinned
    by hand. "Tutorials (reference only)" is OUT of the set: it is a reference-only section, not a
    chapter domain, so the body may say "tutorial" (a later increment adds a mods-tutorial-quickstart path).
    """
    fields, body = _split(FORGE_AGENT)
    prose = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
    assert "mods-the-skills-menu" in prose
    menu_text = (MENU / "SKILL.md").read_text(encoding="utf-8")
    domains = re.findall(r"^### (.+)$", menu_text.split("\n## Plugin Skills\n", 1)[1], re.M)
    domains = [d for d in domains if d != "Tutorials (reference only)"]  # Tutorials is OUT of the set
    assert len(domains) >= 7, "the menu's Plugin Skills chapter domains were not found"
    assert _h1(MENU) not in body, "the body quotes the menu H1, so the first-line check can be faked"
    leaked = [d for d in domains if d not in ("Mods", "Plugins") and d in body]
    assert not leaked, f"the body names the menu domain headings {leaked}, so the first-line check can be faked"
    assert fields["model"] not in body, "the body spells out the model ID"
    assert "Plugin Skills" in body and "not self-verifiable" in body


# The only sentences allowed to pair [BLOCKED] with a tool name: the expert agent's Node prerequisite
# (Node is not a tool skill) and the "Never report [BLOCKED] only because ..." prohibitions.
_BLOCKED_ALLOWED = (
    "a missing Node means `[BLOCKED]` naming it",
    "Never report `[BLOCKED]` only because",
)
_TOOL_NAME = re.compile(r"\btldr\b|tldr-code|fastedit|jgrep|quicksilver|qs\.mjs|safe-delete")


def _blocked_tool_sentences(text: str) -> list[str]:
    """Sentences naming a `[BLOCKED` marker (bare, or with a reason such as `[BLOCKED: tool missing]`) and a tool skill, split on line ends and sentence ends so two bullets never merge."""
    sentences = [s for line in text.splitlines() for s in re.split(r"(?<=[.!?])\s+", line)]
    return [
        s
        for s in sentences
        if "[BLOCKED" in s and _TOOL_NAME.search(s) and not any(ok in s for ok in _BLOCKED_ALLOWED)
    ]


def test_no_sentence_says_a_missing_tool_skill_means_blocked() -> None:
    """No agent, menu, catalog, ledger or README sentence makes a missing tool skill or CLI a [BLOCKED] cause."""
    files = [
        *sorted((ROOT / "agents").glob("*.md")),
        MENU / "SKILL.md",
        MENU_CATALOG,
        ROOT / "DELEGATION.md",
        ROOT / "README.md",
    ]
    found = {f.name: bad for f in files if (bad := _blocked_tool_sentences(f.read_text(encoding="utf-8")))}
    assert not found, f"a missing tool skill is called [BLOCKED]: {found}"


@pytest.mark.parametrize(
    "text, expected",
    [
        ("A missing `tldr-code` means `[BLOCKED]`.", 1),
        ("- keep going\n- `fastedit` absent: report `[BLOCKED]`", 1),
        ("Never report `[BLOCKED]` only because `jgrep` is absent.", 0),
        ("a missing Node means `[BLOCKED]` naming it. Then check `tldr-code`.", 0),
        ("`[BLOCKED]` on login. `quicksilver` is optional.", 0),
        ("A missing `tldr` CLI means `[BLOCKED]`.", 1),
        ("No `qs.mjs`: report `[BLOCKED: quicksilver missing]`.", 1),
        ("Without `fastedit` stop with `[BLOCKED: fastedit absent]`.", 1),
    ],
)
def test_blocked_tool_sentence_detection(text: str, expected: int) -> None:
    """The absence-test helper flags a [BLOCKED] tool sentence and spares the allowed ones and split bullets."""
    assert len(_blocked_tool_sentences(text)) == expected


def test_menu_frontmatter_follows_the_cpv_spec() -> None:
    """The menu is a reference skill: CPV's name, not user-invocable, read-only tools, an accurate description.

    The description deviates from the CPV spec's literal tail ("Used by every agent in this plugin via
    cpv-the-skills-menu method.") on purpose: it would be false here, because only mods-forge-agent
    preloads this menu; mods-expert-developer-agent keeps its own preload list. Every
    other word is the spec's.
    """
    fields, _ = _split(MENU / "SKILL.md")
    assert fields["name"] == "mods-the-skills-menu"
    assert fields["user-invocable"] is False
    assert fields["allowed-tools"] == "Read"
    assert fields["description"] == (
        "Dynamic skill menu for this plugin. Teaches agents which skills are available, when to use them, "
        "and how to load them with the Skill() tool. Use when an agent needs to pick a downstream skill at "
        "runtime. Used by mods-forge-agent as its preloaded menu; mods-expert-developer-agent "
        "keeps its own preload list."
    )


def test_tool_skills_are_optional_but_recommended_with_a_native_fallback() -> None:
    """Every place that names the four tool skills says optional-but-recommended and gives the native fallback.

    User directive 2026-10-22: the tool skills are optional but recommended. An agent that reports
    [BLOCKED] only because one is absent would stall a run the native tools can finish. Each pin below
    is a sentence whose removal would silently bring the stall back.
    """
    forge = FORGE_AGENT.read_text(encoding="utf-8")
    forge_tools = forge.split("\n## Tool skills\n", 1)[1].split("\n## ", 1)[0]
    assert "OPTIONAL BUT RECOMMENDED" in forge_tools
    assert "use the native equivalent: Read for reading" in forge_tools
    assert "Never report `[BLOCKED]` only because a tool skill is absent." in forge_tools
    assert "which recommended skills were missing" in forge_tools

    expert = (ROOT / "agents/mods-expert-developer-agent.md").read_text(encoding="utf-8")
    assert "OPTIONAL BUT RECOMMENDED" in expert
    assert "use the native equivalent (Read for reading" in expert
    assert "Never report `[BLOCKED]` only because an optional tool is absent." in expert
    assert "report `[BLOCKED]` naming the missing prerequisite" not in expert

    menu = (MENU / "SKILL.md").read_text(encoding="utf-8")
    errors = menu.split("\n## Error Handling\n", 1)[1].split("\n## ", 1)[0]
    assert "(optional, recommended) does not resolve: use the native tool for the job" in errors
    assert "never report `[BLOCKED]` only because it is absent" in errors
    standalone = menu.split("\n## Standalone Skills\n", 1)[1].split("\n## Plugin Skills\n", 1)[0]
    assert "optional, recommended" in standalone
    assert "optional, recommended" in menu.split("\n## Overview\n", 1)[1].split("\n## ", 1)[0]
    assert "optional, recommended" in MENU_CATALOG.read_text(encoding="utf-8")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    prerequisites = readme.split("\n## Prerequisites\n", 1)[1].split("\n## ", 1)[0]
    assert "optional but recommended" in prerequisites
    assert "the agents fall back to the native tools" in prerequisites
    assert "Every `mods-forge-agent` dispatch runs at Opus price." in prerequisites
    for name in (*TOOL_SKILLS, "safe-delete"):
        assert f"`{name}`" in prerequisites, f"README Prerequisites does not describe {name}"


def test_menu_skill_md_names_every_chapter_exactly_once() -> None:
    """The SKILL.md summary tables list each chapter skill and each tutorial once, by its namespaced name."""
    rows = _menu_table_skills((MENU / "SKILL.md").read_text(encoding="utf-8"))
    assert len(rows) == len(set(rows)), "a chapter appears twice in the menu tables"
    assert sorted(rows) == _expected_menu_names()


def test_menu_catalog_names_every_chapter_exactly_once() -> None:
    """The full catalog has exactly one `### <namespace>:<skill>` entry per chapter skill and per tutorial."""
    headings = re.findall(r"^### (.+)$", MENU_CATALOG.read_text(encoding="utf-8"), re.M)
    assert len(headings) == len(set(headings)), "a chapter has two catalog entries"
    assert sorted(headings) == _expected_menu_names()


def test_every_menu_skill_call_uses_the_manifest_namespace() -> None:
    """Every Skill() call loads a chapter or tutorial as <plugin.json name>:<skill>, or a tool skill by bare name."""
    namespace = _namespace()
    # The Instructions step shows the generic form with a `<skill>` placeholder; it must carry the namespace too.
    allowed = (
        {f"{namespace}:{name}" for name in [*DOC_SKILLS, *TUTORIAL_SKILLS]}
        | set(TOOL_SKILLS)
        | {f"{namespace}:<skill>"}
    )
    skill_text = (MENU / "SKILL.md").read_text(encoding="utf-8")
    catalog_text = MENU_CATALOG.read_text(encoding="utf-8")
    bad = sorted({target for text in (skill_text, catalog_text) for target in SKILL_CALL.findall(text)} - allowed)
    assert not bad, f"Skill() calls with an unknown or wrongly namespaced target: {bad}"
    assert sorted(LOAD_WITH.findall(catalog_text)) == _expected_menu_names(), "a catalog entry lacks its Load with line"
    assert sorted(LOAD_WITH.findall(skill_text)) == sorted(TOOL_SKILLS), "the standalone entries lack Load with lines"


def test_menu_standalone_section_lists_exactly_the_tool_skills() -> None:
    """The Standalone Skills section names the four user-scope tool skills, by bare name, and nothing else."""
    text = (MENU / "SKILL.md").read_text(encoding="utf-8")
    section = text.split("\n## Standalone Skills\n", 1)[1].split("\n## Plugin Skills\n", 1)[0]
    assert sorted(re.findall(r"^### (.+)$", section, re.M)) == sorted(TOOL_SKILLS)


def test_menu_does_not_list_itself() -> None:
    """The menu is not an entry of its own catalog: loading it from itself would be a no-op loop."""
    for path in (MENU / "SKILL.md", MENU_CATALOG):
        text = path.read_text(encoding="utf-8")
        assert f"{_namespace()}:mods-the-skills-menu" not in text, f"{path.name} lists the menu"
        assert not re.search(r"^### mods-the-skills-menu$", text, re.M), f"{path.name} lists the menu"
        assert not re.search(r'Skill\(\{skill: "mods-the-skills-menu"', text), f"{path.name} loads the menu"


def test_menu_resources_link_the_catalog_and_it_exists() -> None:
    """Resources links references/skills-catalog.md, and that file ships."""
    text = (MENU / "SKILL.md").read_text(encoding="utf-8")
    resources = text.split("\n## Resources\n", 1)[1].split("\n## ", 1)[0]
    assert "](references/skills-catalog.md)" in resources
    assert MENU_CATALOG.is_file()


def test_menu_skill_body_is_under_500_lines() -> None:
    """CPV rejects a SKILL.md over 500 lines (MAJOR); the full entries belong in the catalog reference."""
    _, body = _split(MENU / "SKILL.md")
    assert len(body.splitlines()) < 500


def test_menu_groups_the_tutorials_as_reference_only() -> None:
    """The tutorials, and only them, sit under a "Tutorials (reference only)" heading in SKILL.md and in the catalog."""
    expected = sorted(f"{_namespace()}:{name}" for name in TUTORIAL_SKILLS)
    skill_text = (MENU / "SKILL.md").read_text(encoding="utf-8")
    assert "\n### Tutorials (reference only)\n" in skill_text, "SKILL.md has no Tutorials (reference only) group"
    group = skill_text.split("\n### Tutorials (reference only)\n", 1)[1].split("\n#", 1)[0]
    rows = [m.group(1) for line in group.splitlines() if (m := TABLE_ROW.match(line)) and m.group(1) != "Skill"]
    assert sorted(rows) == expected, "the SKILL.md Tutorials group does not list exactly the tutorials"
    catalog = MENU_CATALOG.read_text(encoding="utf-8")
    assert "\n## Tutorials (reference only)\n" in catalog, "the catalog has no Tutorials (reference only) section"
    section = catalog.split("\n## Tutorials (reference only)\n", 1)[1].split("\n## ", 1)[0]
    assert sorted(re.findall(r"^### (.+)$", section, re.M)) == expected, "the catalog Tutorials section is wrong"
