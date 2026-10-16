"""Structural tests for emasoft-mods-development-plugin.

The plugin ships no executable code: its behaviour IS its file layout (one agent
that preloads 60 routing skills, each wrapping an adapted documentation chapter).
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

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
AGENT = ROOT / "agents/mods-expert-developer-agent.md"
SKILL_DIRS = sorted(d for d in SKILLS.iterdir() if d.is_dir())
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
        entries.append(match.groups())
    return entries


def test_sixty_skills_each_with_wrapper_chapter_and_policy() -> None:
    """Every skill directory ships SKILL.md, references/chapter.md and agents/openai.yaml."""
    assert len(SKILL_DIRS) == 60
    for skill in SKILL_DIRS:
        for rel in ("SKILL.md", "references/chapter.md", "agents/openai.yaml"):
            assert (skill / rel).is_file(), f"{skill.name} lacks {rel}"


@pytest.mark.parametrize("skill", SKILL_DIRS, ids=lambda d: d.name)
def test_skill_frontmatter_name_matches_directory(skill: Path) -> None:
    """SKILL.md name equals its directory, avoids reserved words, and is not user-invocable."""
    fields = _frontmatter((skill / "SKILL.md").read_text(encoding="utf-8"))
    assert fields["name"] == skill.name
    assert not any(word in skill.name for word in RESERVED), f"reserved word in {skill.name}"
    assert fields["user-invocable"] == "false"


@pytest.mark.parametrize("skill", SKILL_DIRS, ids=lambda d: d.name)
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
    """The agent skills list names each of the 60 doc skills exactly once and no missing one."""
    text = AGENT.read_text(encoding="utf-8")
    block = text[4 : text.index("\n---\n", 4)]
    listed = re.findall(r"^  - (mods-doc-[a-z0-9-]+)$", block, re.M)
    assert len(listed) == len(set(listed)), "duplicate skill in agent skills list"
    assert sorted(listed) == [d.name for d in SKILL_DIRS]


def test_readme_lists_every_skill() -> None:
    """README Components table has a row for every skill directory."""
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for skill in SKILL_DIRS:
        assert f"| {skill.name} |" in readme, f"README misses {skill.name}"


def test_manifest_and_pyproject_versions_agree() -> None:
    """plugin.json and pyproject.toml declare the same name and version."""
    manifest = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    project = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    assert manifest["name"] == project["name"]
    assert manifest["version"] == project["version"]


def test_cpv_exclude_paths_are_exactly_the_vendored_chapters() -> None:
    """cpv.exclude_paths lists every adapted chapter.md and nothing else.

    CPV matches exclude_paths by exact path or prefix, never by glob, so the 60
    chapters are listed one by one. This pins the list to the files on disk: a
    renamed or added skill must update it, and no Emasoft-authored file may be
    slipped into it (only the Anthropic chapters covered by NOTICE are vendored).
    """
    manifest = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    declared = manifest["cpv"]["exclude_paths"]
    on_disk = sorted(f"skills/{d.name}/references/chapter.md" for d in SKILL_DIRS)
    assert declared == on_disk
