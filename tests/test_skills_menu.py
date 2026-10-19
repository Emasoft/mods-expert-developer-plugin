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
the mirror checks. The mirror exists because a coordinated edit that shifts the window
leaves every other check green — both hand-edited copies of the routing order still
agree with each other — so the mirror is the only check that sees the window move.
See the comment on PINNED_PRELOAD_SKILLS for why it records membership and not order,
and what that costs.
"""

from __future__ import annotations

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
}

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
_GENERIC_ACCOUNT_SEGMENTS = frozenset({"user", "username", "you", "example", "..."})

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

# Files that are NOT documentation a person reads: a lockfile, an ignore
# list, a version pin, a git hook. The rule's justification is that the
# plugin ships these files to people and a name in prose reads as a person
# — that justification does not reach a lockfile or a hook script, so
# scanning them would enforce a rule whose rationale is absent. A path
# segment in a machine artefact is a machine's business, and CPV's own
# absolute-path rule already covers the case that matters there.
_GUARD_NON_DOCUMENTATION = {
    ".gitignore",
    ".python-version",
    "uv.lock",
    "git-hooks/pre-push",
}

# A home path: a user segment under /Users, then anything.
_HOME_PATH = re.compile(r"/Users/([A-Za-z0-9_.-]+)")


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

    The rule this test enforces, exactly: a path segment under /Users that
    is NOT on the known-not-a-name list is treated as a name. A path under
    somebody's own name reads, to a person, as somebody's actual home
    directory; the plugin ships these files to users, so that reading is the
    one that counts — whether or not a validator objects.

    Two boundaries, both deliberate:
      - SCOPE is the shipped documentation (chapters, README, ledger,
        NOTICE, LICENSE). Machine artefacts — a lockfile, an ignore list, a
        version pin, a git hook — are excluded: a path segment in one of
        those is a machine's business, and the justification above does not
        reach them.
      - COVERAGE is every readable tracked file in that scope, not an
        extension allowlist. An earlier version skipped NOTICE and LICENSE,
        which the plugin ships, and both were hit in this series.
    """
    tracked = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    offending: list[str] = []
    for rel in tracked:
        if any(part in _GUARD_EXEMPT_DIRS for part in Path(rel).parts):
            continue
        if rel in _GUARD_NON_DOCUMENTATION:
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
