"""Structural tests for mods-expert-developer-plugin.

The plugin ships no executable code: its behaviour IS its file layout (an expert agent
that declares 61 routing chapter skills, 60 wrapping an adapted documentation chapter and
one wrapping a community how-to; a forge agent that preloads only the skills menu,
skills/mods-the-skills-menu, which catalogues those 61 chapters and is not itself a chapter;
and three reference-only tutorial skills whose example mods live under their examples/
folders and are never loaded as part of the plugin).
These tests pin the invariants that make that layout work, so a later edit that
breaks routing or progressive discovery fails the publish gate instead of
shipping silently.
"""

from __future__ import annotations

import json
import re
import tomllib
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
AGENT = ROOT / "agents/mods-expert-developer-agent.md"
SKILL_DIRS = sorted(d for d in SKILLS.iterdir() if d.is_dir())
# Skills that CATALOGUE the chapters instead of wrapping one: they ship no references/chapter.md,
# are not routed by the expert agent and have no README Components row. Every chapter-enumerating
# test iterates CHAPTER_DIRS. tests/test_skills_menu.py keeps an identical copy and asserts the two agree.
CATALOG_SKILLS = {"mods-the-skills-menu"}
# Tutorial skills (TRDD-BDY6ZNDZ): reference-only walkthroughs adapted from BeLazy167/claude-mods-skill (MIT). They are
# not chapters: no references/chapter.md, not routed by the expert agent, no README Components row, so every
# chapter-enumerating test skips them through CHAPTER_DIRS. tests/test_skills_menu.py keeps an identical copy.
TUTORIAL_SKILLS = {"mods-tutorial-quickstart", "mods-tutorial-call-intercept-mods", "mods-tutorial-interface-mods"}
CHAPTER_DIRS = [d for d in SKILL_DIRS if d.name not in CATALOG_SKILLS | TUTORIAL_SKILLS]
TUTORIAL_DIRS = [d for d in SKILL_DIRS if d.name in TUTORIAL_SKILLS]
# The example mods each tutorial carries under its examples/ folder, by folder name.
TUTORIAL_EXAMPLES = {
    "mods-tutorial-quickstart": set(),
    "mods-tutorial-call-intercept-mods": {"hello-mod", "redact-output", "dice-tool"},
    "mods-tutorial-interface-mods": {"branch-band", "notes-pane"},
}
# The first body paragraph of every tutorial, verbatim: it tells an agent the chapters win and the examples never load.
TUTORIAL_NOTICE = (
    "Tutorial and reference example only. The mods-doc-* chapter skills of this plugin are authoritative and win on"
    " any disagreement. The example code under examples/ is for reading and copying into your own project; it is never"
    " installed or loaded as part of this plugin. Do not point --plugin-dir at a copy inside the plugin cache."
)
# File types that count as example code for the placement rule.
CODE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".sh", ".json"}
# The MIT permission text of BeLazy167/claude-mods-skill, whitespace-normalised, that NOTICE must reproduce in full.
MIT_PERMISSION_SENTENCES = (
    "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated"
    ' documentation files (the "Software"), to deal in the Software without restriction, including without limitation'
    " the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and"
    " to permit persons to whom the Software is furnished to do so, subject to the following conditions:",
    "The above copyright notice and this permission notice shall be included in all copies or substantial portions of"
    " the Software.",
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO'
    " THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE"
    " AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF"
    " CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER"
    " DEALINGS IN THE SOFTWARE.",
)
# Chapter TOCs use "* " (the marker of the Anthropic body, so markdownlint MD004 stays consistent);
# the SKILL.md copy keeps "- ". Entries are compared by indent, title and anchor, not by marker.
CHAPTER_TOC_ENTRY = re.compile(r"^( *)[-*] \[(.+)\]\(#([^)\s]+)\)$")
RESERVED = ("claude", "anthropic")


def _frontmatter(text: str) -> dict[str, str]:
    """Top-level `key: value` pairs of a markdown file frontmatter block."""
    assert text.startswith("---\n"), "file has no frontmatter"
    block = text[4 : text.index("\n---\n", 4)]
    pairs: dict[str, str] = {}
    for line in block.splitlines():
        if line and not line.startswith(" ") and ":" in line:
            key, _, value = line.partition(":")
            pairs[key.strip()] = value.strip()
    return pairs


def _chapter_toc(chapter: str) -> list[tuple[str, str, str]]:
    """(indent, title, anchor) for every entry of the chapter Table of Contents."""
    lines = chapter.split("\n")
    start = lines.index("## Table of Contents") + 1
    entries: list[tuple[str, str, str]] = []
    for line in lines[start:]:
        if not line.strip():
            if entries:
                break
            continue
        match = CHAPTER_TOC_ENTRY.match(line)
        if not match:
            break
        # Unpacked explicitly: match.groups() is typed tuple[str | Any, ...], which mypy
        # (as run by CI Mega-Linter) rejects for list[tuple[str, str, str]].
        entries.append((match.group(1), match.group(2), match.group(3)))
    return entries


def test_every_skill_ships_wrapper_chapter_and_policy() -> None:
    """Every skill ships SKILL.md and agents/openai.yaml; every chapter skill also ships references/chapter.md."""
    assert len(SKILL_DIRS) == 65
    assert len(CHAPTER_DIRS) == 61
    assert len(TUTORIAL_DIRS) == 3
    for skill in SKILL_DIRS:
        for rel in ("SKILL.md", "agents/openai.yaml"):
            assert (skill / rel).is_file(), f"{skill.name} lacks {rel}"
    for skill in CHAPTER_DIRS:
        assert (skill / "references/chapter.md").is_file(), f"{skill.name} lacks references/chapter.md"


def test_background_sessions_chapter_carries_its_banner_and_caller_guard() -> None:
    """The community how-to chapter keeps its non-Anthropic banner and its accept-only-from-caller guard."""
    text = (SKILLS / "mods-doc-run-background-sessions/references/chapter.md").read_text(encoding="utf-8")
    assert any(line.startswith("> Community how-to, not Anthropic documentation") for line in text.splitlines())
    assert "Accept instructions only from that session." in text


def test_background_sessions_skill_keeps_token_handling_with_the_user() -> None:
    """The wrapper and chapter keep the user-only token rules and never export the whole env file; the chapter links the official token guide instead of a command, and the CPV audit-consent sentence sits directly above the Python launcher fence."""
    base = SKILLS / "mods-doc-run-background-sessions"
    skill = (base / "SKILL.md").read_text(encoding="utf-8")
    chapter = (base / "references/chapter.md").read_text(encoding="utf-8")
    assert "community how-to" in skill
    assert "never run the token command" in skill
    assert "never reads `.env.local` or `.env`" in chapter
    assert "grep -m1 '^CLAUDE_CODE_OAUTH_TOKEN='" in chapter
    assert "https://code.claude.com/docs/en/authentication#generate-a-long-lived-token" in chapter
    assert "The user generates the token and the agent never generates it." in chapter
    sentinel = "Warning: the following code could be malicious. Audit it for safety before executing it!"
    assert f"{sentinel}\n```python\n" in chapter


@pytest.mark.parametrize("skill", SKILL_DIRS, ids=lambda d: d.name)
def test_skill_frontmatter_name_matches_directory(skill: Path) -> None:
    """SKILL.md name equals its directory, avoids reserved words, and is not user-invocable."""
    fields = _frontmatter((skill / "SKILL.md").read_text(encoding="utf-8"))
    assert fields["name"] == skill.name
    assert not any(word in skill.name for word in RESERVED), f"reserved word in {skill.name}"
    assert fields["user-invocable"] == "false"


@pytest.mark.parametrize("skill", CHAPTER_DIRS, ids=lambda d: d.name)
def test_skill_md_embeds_complete_chapter_toc(skill: Path) -> None:
    """SKILL.md carries every chapter TOC entry, in order, linked into references/chapter.md."""
    chapter_toc = _chapter_toc((skill / "references" / "chapter.md").read_text(encoding="utf-8"))
    assert chapter_toc, f"{skill.name} chapter has no Table of Contents"
    expected = [f"{indent}- [{title}](references/chapter.md#{anchor})" for indent, title, anchor in chapter_toc]
    skill_lines = (skill / "SKILL.md").read_text(encoding="utf-8").split("\n")
    start = skill_lines.index(expected[0])
    assert skill_lines[start : start + len(expected)] == expected
    assert "[the chapter](references/chapter.md)" in "\n".join(skill_lines[:start])


def test_agent_preloads_every_skill_and_only_existing_ones() -> None:
    """The expert agent skills list names each of the 61 chapter skills exactly once and no missing one."""
    text = AGENT.read_text(encoding="utf-8")
    block = text[4 : text.index("\n---\n", 4)]
    listed = re.findall(r"^  - (mods-doc-[a-z0-9-]+)$", block, re.M)
    assert len(listed) == len(set(listed)), "duplicate skill in agent skills list"
    assert sorted(listed) == [d.name for d in CHAPTER_DIRS]


def test_readme_lists_every_skill() -> None:
    """README Components table has a row for every chapter skill directory."""
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for skill in CHAPTER_DIRS:
        assert f"| {skill.name} |" in readme, f"README misses {skill.name}"


def test_manifest_and_pyproject_versions_agree() -> None:
    """plugin.json and pyproject.toml declare the same name and version."""
    manifest = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    project = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    assert manifest["name"] == project["name"]
    assert manifest["version"] == project["version"]


def _contains_key(node: object, key: str) -> bool:
    """Return True if `key` appears as a dict key at any depth of the parsed JSON."""
    if isinstance(node, dict):
        return key in node or any(_contains_key(v, key) for v in node.values())
    if isinstance(node, list):
        return any(_contains_key(v, key) for v in node)
    return False


# Pinned, not approved: adding or changing an entry needs the owner's approval because it keeps files out of the scan.
# The only entry that keeps authored tracked files out of the scan here is **/*.json (five tracked JSON files, plugin.json among them);
# it is reported to CPV (issue #257) and should go once CPV's template drops it. **/uv.lock and **/*.lock skip the tracked, uv-generated uv.lock, which Trivy scans separately.
# Equals CPV 5.22.0 generator output (_CSPELL_IGNORE_PATHS in standardize_plugin.py), verified by comparing the two lists.
PINNED_CSPELL_IGNORE_PATHS = [
    "**/*.json",
    "**/uv.lock",
    "**/package-lock.json",
    "**/*.lock",
    "**/.git/**",
    "**/node_modules/**",
    "**/.venv/**",
    "**/venv/**",
    "**/__pycache__/**",
    "**/tests_dev/**",
    "**/docs_dev/**",
    "**/scripts_dev/**",
    "**/samples_dev/**",
    "**/examples_dev/**",
    "**/builds_dev/**",
    "**/downloads_dev/**",
    "**/libs_dev/**",
    "**/reports/**",
    "**/reports_dev/**",
    "**/llm_externalizer_output/**",
    "**/.claude/**",
    "**/.tldr/**",
    "**/tests/fixtures/**",
    "**/test/fixtures/**",
    "**/spec/fixtures/**",
    "**/__fixtures__/**",
    "**/testdata/**",
    "**/fixtures/**",
]


# Pinned, not approved: adding or changing an entry needs the owner's approval because it keeps files out of the scan.
# None of these entries matches a tracked file in this repo today; **/.claude/** and the fixture globs are reported to CPV
# (issue #257) because repos that track those paths lose them from the scan.
# Equals CPV 5.22.0 generator output (the ignore list in gen_jscpd_json), verified by comparing the two lists.
PINNED_JSCPD_IGNORE = [
    "**/tests_dev/**",
    "**/docs_dev/**",
    "**/scripts_dev/**",
    "**/samples_dev/**",
    "**/examples_dev/**",
    "**/builds_dev/**",
    "**/downloads_dev/**",
    "**/libs_dev/**",
    "**/llm_externalizer_output/**",
    "**/.claude/**",
    "**/.tldr/**",
    "**/tests/fixtures/**",
    "**/test/fixtures/**",
    "**/spec/fixtures/**",
    "**/__fixtures__/**",
    "**/testdata/**",
    "**/fixtures/**",
    "**/node_modules/**",
    "**/.git/**",
]
# Adding or changing this requires the owner's approval: an exclusion keeps tracked files out of the Mega-Linter scan.
# CPV 5.22.0 canon output; its \.claude/ and fixtures exclusions are reported to CPV (issue #257) as tracked-path exclusions.
CANON_MEGALINTER_FILTER_REGEX_EXCLUDE = r"(tests_dev/|docs_dev/|scripts_dev/|samples_dev/|examples_dev/|builds_dev/|downloads_dev/|libs_dev/|llm_externalizer_output/|\.claude/|\.tldr/|tests?/fixtures/|spec/fixtures/|__fixtures__/|testdata/|fixtures/)"


def test_manifest_has_no_exclude_paths_at_any_depth() -> None:
    """plugin.json contains no exclude_paths key anywhere in its nesting.

    The chapters were once listed in cpv.exclude_paths, which made CPV skip them
    for its absolute-path and backtick-reference rules. A scan-exclusion list is
    exactly what a malicious author would use to ship unscanned content, so the
    plugin carries none: a chapter finding is fixed in the chapter instead.
    """
    manifest = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    assert not _contains_key(manifest, "exclude_paths")


def test_cspell_ignore_paths_match_pinned_list() -> None:
    """.cspell.json ignorePaths equals PINNED_CSPELL_IGNORE_PATHS exactly."""
    config = json.loads((ROOT / ".cspell.json").read_text(encoding="utf-8"))
    assert config["ignorePaths"] == PINNED_CSPELL_IGNORE_PATHS


def test_jscpd_ignore_matches_pinned_list() -> None:
    """.jscpd.json ignore equals PINNED_JSCPD_IGNORE exactly."""
    config = json.loads((ROOT / ".jscpd.json").read_text(encoding="utf-8"))
    assert config["ignore"] == PINNED_JSCPD_IGNORE


def test_mega_linter_filter_matches_pinned_regex() -> None:
    """.mega-linter.yml FILTER_REGEX_EXCLUDE equals the pinned CPV canon string exactly."""
    config = yaml.safe_load((ROOT / ".mega-linter.yml").read_text(encoding="utf-8"))
    assert config["FILTER_REGEX_EXCLUDE"] == CANON_MEGALINTER_FILTER_REGEX_EXCLUDE


# --- tutorial skills (TRDD-BDY6ZNDZ) --------------------------------------------
#
# The user's directive: the tutorials are reference examples for agents, never a replacement for the
# mods-doc-* chapters, every tutorial name contains "tutorial", and the example code lives in subfolders
# of its tutorial skill so it reads as code to read, not as part of the plugin. These tests pin each of
# those properties, so a later edit that blurs the line between a tutorial and a chapter fails here.


def _misplaced_example_code(skills_root: Path, tutorials: set[str]) -> list[str]:
    """Code files and nested .claude-plugin folders under `skills_root` that are not inside a tutorial's examples/<example>/."""
    misplaced: list[str] = []
    for path in sorted(skills_root.rglob("*")):
        is_code = path.is_file() and path.suffix in CODE_SUFFIXES
        is_manifest_dir = path.is_dir() and path.name == ".claude-plugin"
        if not (is_code or is_manifest_dir):
            continue
        parts = path.relative_to(skills_root).parts
        if not (len(parts) >= 4 and parts[0] in tutorials and parts[1] == "examples"):
            misplaced.append("/".join(parts))
    return misplaced


def test_every_tutorial_skill_ships_and_is_named_as_a_tutorial() -> None:
    """The shipped skills whose name contains "tutorial" are exactly TUTORIAL_SKILLS, and every member is shipped."""
    assert all("tutorial" in name for name in TUTORIAL_SKILLS)
    assert {d.name for d in SKILL_DIRS if "tutorial" in d.name} == TUTORIAL_SKILLS
    assert {d.name for d in TUTORIAL_DIRS} == TUTORIAL_SKILLS
    assert set(TUTORIAL_EXAMPLES) == TUTORIAL_SKILLS


@pytest.mark.parametrize("name", sorted(TUTORIAL_SKILLS))
def test_tutorial_opens_with_the_reference_only_notice(name: str) -> None:
    """The body is the H1 line, then the notice verbatim, then ## Overview: the notice is the first thing an agent reads."""
    text = (SKILLS / name / "SKILL.md").read_text(encoding="utf-8")
    body = text[text.index("\n---\n", 4) + 5 :]
    paragraphs = [p.strip() for p in body.strip().split("\n\n")]
    assert paragraphs[0].startswith("# ") and "\n" not in paragraphs[0], f"{name} does not open with an H1 line"
    assert paragraphs[1] == TUTORIAL_NOTICE, f"{name}: the first body paragraph is not the notice verbatim"
    assert paragraphs[2].split("\n", 1)[0] == "## Overview", f"{name}: ## Overview does not follow the notice"


def test_example_code_lives_only_under_a_tutorial_examples_folder() -> None:
    """Every code file and nested .claude-plugin folder under skills/ sits in skills/<tutorial>/examples/<example>/."""
    misplaced = _misplaced_example_code(SKILLS, TUTORIAL_SKILLS)
    assert not misplaced, f"example code outside a tutorial's examples/ folder: {misplaced}"


@pytest.mark.parametrize(
    ("rel", "expected"),
    [
        ("mods-tutorial-x/examples/demo/hooks/register.ts", []),
        ("mods-tutorial-x/examples/demo/.claude-plugin/plugin.json", []),
        ("mods-tutorial-x/register.ts", ["mods-tutorial-x/register.ts"]),
        ("mods-doc-x/examples/demo/hooks/register.ts", ["mods-doc-x/examples/demo/hooks/register.ts"]),
        ("mods-tutorial-x/references/demo.sh", ["mods-tutorial-x/references/demo.sh"]),
    ],
)
def test_misplaced_example_code_detection(tmp_path: Path, rel: str, expected: list[str]) -> None:
    """Counter-examples for the placement rule: code outside a tutorial's examples/ is reported, code inside is not."""
    target = tmp_path / rel
    target.parent.mkdir(parents=True)
    target.write_text("x", encoding="utf-8")
    assert _misplaced_example_code(tmp_path, {"mods-tutorial-x"}) == expected


def test_each_tutorial_carries_exactly_its_example_mods() -> None:
    """Each tutorial's examples/ holds exactly its pinned examples, each a complete mod under its original file names.

    The manifests keep their names by a measured decision recorded on TRDD-BDY6ZNDZ: Claude Code does not load a
    plugin.json or hooks.json nested under skills/, and renaming them changed nothing for CPV, so they keep the
    names that make a copied example runnable.
    """
    for name, expected in TUTORIAL_EXAMPLES.items():
        folder = SKILLS / name / "examples"
        found = {d.name for d in folder.iterdir() if d.is_dir()} if folder.is_dir() else set()
        assert found == expected, f"{name}: examples/ holds {sorted(found)}, expected {sorted(expected)}"
        for example in sorted(expected):
            root = folder / example
            for rel in (".claude-plugin/plugin.json", "hooks/hooks.json"):
                assert (root / rel).is_file(), f"{name}/examples/{example} lacks {rel}"
            assert sorted((root / "tests").glob("*.test.ts")), f"{name}/examples/{example} has no tests/*.test.ts"


def test_notice_carries_the_mit_text_of_the_tutorial_source() -> None:
    """NOTICE names BeLazy167/claude-mods-skill with its MIT copyright line and the full permission text."""
    text = " ".join((ROOT / "NOTICE").read_text(encoding="utf-8").split())
    assert "BeLazy167/claude-mods-skill" in text
    assert "Copyright (c) 2026 BeLazy167" in text
    for sentence in MIT_PERMISSION_SENTENCES:
        assert sentence in text, f"NOTICE lacks the MIT sentence starting {sentence[:40]!r}"


def test_readme_lists_the_tutorials_as_reference_only() -> None:
    """README has a Tutorials section that names every tutorial and says they are reference-only, never a replacement."""
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "\n## Tutorials\n" in readme, "README has no ## Tutorials section"
    section = readme.split("\n## Tutorials\n", 1)[1].split("\n## ", 1)[0]
    assert "reference only" in section
    assert "do not replace the chapter skills" in section
    for name in sorted(TUTORIAL_SKILLS):
        assert f"`{name}`" in section, f"README Tutorials section misses {name}"


# --- no lint exclusion for the tutorial examples (TRDD-JFB5E98B) ---------------
#
# The tutorial examples are linted like every other file; the licence must travel with the copies, and nothing the
# plugin loads may point into skills/*/examples/.

TUTORIAL_EXAMPLE_PROBE = "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/smoke.sh"
# Linters that read TypeScript or JavaScript would lint the examples.
TS_JS_LINTER_PREFIXES = ("TYPESCRIPT_", "JAVASCRIPT_", "JSX_", "TSX_")
TS_JS_DESCRIPTORS = ("TYPESCRIPT", "JAVASCRIPT", "JSX", "TSX")


def test_no_mega_linter_exclude_skips_the_tutorial_examples() -> None:
    """No FILTER_REGEX_EXCLUDE in .mega-linter.yml matches a tutorial example path."""
    config = yaml.safe_load((ROOT / ".mega-linter.yml").read_text(encoding="utf-8"))
    for key, value in config.items():
        if key.endswith("FILTER_REGEX_EXCLUDE"):
            assert not re.search(value, TUTORIAL_EXAMPLE_PROBE), f"{key} excludes the tutorial examples"


def test_cspell_and_jscpd_do_not_ignore_the_tutorial_examples() -> None:
    """Neither .cspell.json ignorePaths nor .jscpd.json ignore names a mods-tutorial path."""
    cspell = json.loads((ROOT / ".cspell.json").read_text(encoding="utf-8"))
    jscpd = json.loads((ROOT / ".jscpd.json").read_text(encoding="utf-8"))
    for pattern in cspell["ignorePaths"] + jscpd["ignore"]:
        assert "mods-tutorial" not in pattern, f"{pattern} ignores the tutorial examples"


def test_no_ts_or_js_linter_is_enabled() -> None:
    """No TypeScript/JavaScript linter is enabled for any file (examples included), so nothing is excluded for the examples."""
    config = yaml.safe_load((ROOT / ".mega-linter.yml").read_text(encoding="utf-8"))
    # Without ENABLE_LINTERS and ENABLE, MegaLinter runs every linter of the flavor, TypeScript and JavaScript included.
    assert "ENABLE_LINTERS" in config or "ENABLE" in config, "no ENABLE_LINTERS or ENABLE: every linter would run"
    enabled = [x for x in config.get("ENABLE_LINTERS", []) if x.startswith(TS_JS_LINTER_PREFIXES)]
    enabled += [x for x in config.get("ENABLE", []) if x in TS_JS_DESCRIPTORS]
    assert not enabled, f"TS/JS linters enabled: {enabled}"


@pytest.mark.parametrize("tutorial", ("mods-tutorial-call-intercept-mods", "mods-tutorial-interface-mods"))
def test_examples_folder_carries_the_source_licence(tutorial: str) -> None:
    """Each tutorial examples/ folder holds a LICENSE with the BeLazy167 MIT notice, so a copied example keeps it."""
    example_root = SKILLS / tutorial / "examples"
    assert example_root.is_dir(), f"{example_root} is missing"
    licence = example_root / "LICENSE"
    assert licence.is_file(), f"{licence} is missing"
    assert "Copyright (c) 2026 BeLazy167" in licence.read_text(encoding="utf-8")


def _root_plugin_files(root: Path) -> list[Path]:
    """The files Claude Code loads from the plugin root: the manifest, hooks/, agents/ and commands/ (skills/ is the discovery folder)."""
    files = [root / ".claude-plugin" / "plugin.json"]
    for folder in ("hooks", "agents", "commands"):
        base = root / folder
        if base.is_dir():
            files.extend(sorted(p for p in base.rglob("*") if p.is_file()))
    return [f for f in files if f.is_file()]


def _example_path_references(root: Path) -> list[str]:
    """Root plugin files that mention a path under skills/<anything>/examples/."""
    pattern = re.compile(r"skills/[^\s\"'`]*examples/")
    return [str(f.relative_to(root)) for f in _root_plugin_files(root) if pattern.search(f.read_text(encoding="utf-8"))]


def _stray_manifests(skills_root: Path) -> list[str]:
    """plugin.json files and .claude-plugin folders under skills/ not at skills/<tutorial>/examples/<name>/.claude-plugin/."""
    stray: list[str] = []
    for path in sorted(skills_root.rglob("*")):
        is_manifest = path.is_file() and path.name == "plugin.json"
        is_manifest_dir = path.is_dir() and path.name == ".claude-plugin"
        if not (is_manifest or is_manifest_dir):
            continue
        parts = path.relative_to(skills_root).parts
        ok = (
            len(parts) == (5 if is_manifest else 4)
            and parts[0].startswith("mods-tutorial-")
            and parts[1] == "examples"
            and parts[3] == ".claude-plugin"
            and (not is_manifest or parts[4] == "plugin.json")
        )
        if not ok:
            stray.append("/".join(parts))
    return stray


def test_root_plugin_does_not_reference_the_examples() -> None:
    """Nothing the plugin loads (manifest, hooks/, agents/, commands/) points at a path under skills/*/examples/."""
    assert _example_path_references(ROOT) == []


def test_example_manifests_live_only_at_the_copy_and_run_depth() -> None:
    """Every manifest under skills/ is skills/<tutorial>/examples/<name>/.claude-plugin/plugin.json; none sits elsewhere."""
    assert _stray_manifests(SKILLS) == []


def test_load_guard_detects_references_and_stray_manifests(tmp_path: Path) -> None:
    """Counter-examples: a root file naming an example path, and manifests at the wrong depth, are reported."""
    (tmp_path / ".claude-plugin").mkdir()
    (tmp_path / ".claude-plugin" / "plugin.json").write_text('{"hooks": "skills/mods-tutorial-x/examples/d/hooks.json"}', encoding="utf-8")
    (tmp_path / "agents").mkdir()
    (tmp_path / "agents" / "a.md").write_text("see skills/mods-tutorial-x/examples/d/", encoding="utf-8")
    assert _example_path_references(tmp_path) == [".claude-plugin/plugin.json", "agents/a.md"]
    good = tmp_path / "skills/mods-tutorial-x/examples/d/.claude-plugin"
    good.mkdir(parents=True)
    (good / "plugin.json").write_text("{}", encoding="utf-8")
    assert _stray_manifests(tmp_path / "skills") == []
    for bad in ("skills/mods-tutorial-x/.claude-plugin", "skills/mods-doc-y/examples/d/.claude-plugin", "skills/mods-tutorial-x/examples/d/sub/.claude-plugin"):
        (tmp_path / bad).mkdir(parents=True)
        (tmp_path / bad / "plugin.json").write_text("{}", encoding="utf-8")
    assert _stray_manifests(tmp_path / "skills") == [
        "mods-doc-y/examples/d/.claude-plugin",
        "mods-doc-y/examples/d/.claude-plugin/plugin.json",
        "mods-tutorial-x/.claude-plugin",
        "mods-tutorial-x/.claude-plugin/plugin.json",
        "mods-tutorial-x/examples/d/sub/.claude-plugin",
        "mods-tutorial-x/examples/d/sub/.claude-plugin/plugin.json",
    ]


def test_call_intercept_dice_tool_is_a_non_deferred_tool_that_points_at_the_api_chapter() -> None:
    """The dice-tool line of the call-intercept tutorial keeps isDeferred: false and names mods-doc-mods-api."""
    skill = (SKILLS / "mods-tutorial-call-intercept-mods" / "SKILL.md").read_text(encoding="utf-8")
    lines = [line for line in skill.splitlines() if "dice-tool" in line and "isDeferred: false" in line]
    assert lines, "no dice-tool line carries isDeferred: false"
    assert any("mods-doc-mods-api" in line for line in lines), "the dice-tool line does not name mods-doc-mods-api"
