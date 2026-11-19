"""Tests for the third-party mod excerpts in skills/mods-example-*/references/*.md.

An excerpt is a heading "### <mod> <version>, <file>:<start>-<end>, <licence>" followed by the next fenced
block. Four checks need no plugin cache and always run: no fenced block outside an excerpt heading, no excerpt of
a mod whose licence forbids copying, every heading names a known mod with the licence that mod really has, and
every heading has a block. Two checks compare the block with the installed mod file or the pinned clone file: they are
skipped, loudly, when the plugin cache root (cache excerpts) or the whole clone root (clone excerpts) is absent (CI),
and a pinned mod version folder, or a clone or its .git inside an existing clone root, that is missing fails instead.
The cache and the clones are untrusted data: they are only read, and nothing in them is ever run.
The parsing and checks live in scripts/excerpt_lock.py (standard library only).
"""

from __future__ import annotations

import importlib.util
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from types import ModuleType

import pytest

ROOT = Path(__file__).resolve().parent.parent
_SPEC = importlib.util.spec_from_file_location("excerpt_lock", ROOT / "scripts" / "excerpt_lock.py")
assert _SPEC is not None and _SPEC.loader is not None
excerpt_lock: ModuleType = importlib.util.module_from_spec(_SPEC)
# Registered under its import name so scripts/update_excerpt_lock.py, which does `import excerpt_lock`,
# gets this same object if a test ever imports it: the tests monkeypatch CACHE and MOD_DIRS on it, and a
# second copy would silently verify against the real cache.
sys.modules["excerpt_lock"] = excerpt_lock
_SPEC.loader.exec_module(excerpt_lock)


def _require_clone(mod: str) -> None:
    """Skip only when the whole clone root is absent (CI); fail, naming the path, when the root exists but the clone or its .git does not."""
    clone = excerpt_lock.MOD_DIRS[mod]
    if not excerpt_lock.CLONES.is_dir():
        # Clones are optional on CI; the gate of record is the developer tree, where the skip count must be 0.
        pytest.skip(f"SKIPPED, NOT VERIFIED: clone {clone} is absent (no {excerpt_lock.CLONES}), its excerpts were not compared")
    if not excerpt_lock.clone_present(mod):
        pytest.fail(f"clone {clone} or its .git is missing although {excerpt_lock.CLONES} exists; restore the clone at its pin")


def _require_cache(root: Path) -> None:
    """Skip only when the cache root or the whole clone root is absent; fail, naming the path, when a pinned source folder is gone."""
    for _, m, _, _ in excerpt_lock.all_excerpts(root):
        mod_dir = excerpt_lock.MOD_DIRS.get(m.group(1))
        if mod_dir is None or m.group(1) in excerpt_lock.FORBIDDEN:
            continue
        if m.group(1) in excerpt_lock.CLONE_PINS:
            _require_clone(m.group(1))
        elif not excerpt_lock.CACHE.is_dir():
            pytest.skip(
                f"SKIPPED, NOT VERIFIED: plugin cache folder {excerpt_lock.CACHE} is absent, excerpts were not compared"
            )
        elif not (mod_dir / m.group(2)).is_dir():
            # Installed mods auto-update: a skip here would silently drop the excerpt guarantee.
            pytest.fail(
                f"mod {m.group(1)} updated: {mod_dir / m.group(2)} is absent; "
                f"re-verify the excerpts against the new version and re-pin the headings; {excerpt_lock.RERUN}"
            )

def _lock_problems(root: Path) -> list[str]:
    lock = json.loads(excerpt_lock.LOCK.read_text(encoding="utf-8"))
    now = excerpt_lock.current_lock(root)
    bad = [f"NOT LOCKED {k}" for k in now if k not in lock]
    bad += [f"STALE LOCK ENTRY {k}" for k in lock if k not in now]
    bad += [f"HASH DIFFERS {k}" for k in now if k in lock and lock[k]["sha256"] != now[k]["sha256"]]
    bad += [
        f"COMMIT DIFFERS {k}"
        for k in now
        if k in lock and lock[k].get("upstream_commit") != now[k].get("upstream_commit")
    ]
    # Cross-check the source range the lock recorded for each block, when this machine has the cache or the clone
    # (source_range is None for an absent source, so that excerpt is not compared here).
    for ref, m, _, _ in excerpt_lock.all_excerpts(root):
        key = excerpt_lock.lock_key(root, ref, m)
        want = excerpt_lock.source_range(m)
        if key in lock and want is not None and lock[key].get("source_sha256") != excerpt_lock.lines_sha256(want):
            bad.append(f"SOURCE HASH DIFFERS {key}")
    return bad


def test_excerpt_references_exist() -> None:
    """The example skills ship excerpt references, so the other checks in this file are not vacuous."""
    assert excerpt_lock.references(ROOT), "no skills/mods-example-*/references/*.md files found"
    assert list(excerpt_lock.all_excerpts(ROOT)), "no excerpt headings found in the example references"


def test_no_unclaimed_fenced_blocks() -> None:
    """Every fenced block sits under a valid excerpt heading, so no copied text escapes the comparison."""
    bad = excerpt_lock.unclaimed(ROOT)
    assert not bad, "\n".join(bad)


def test_no_forbidden_mod_is_excerpted() -> None:
    """No excerpt comes from a mod whose licence forbids copying (excerpt_lock.FORBIDDEN, such as token-optimizer)."""
    bad = excerpt_lock.forbidden(ROOT)
    assert not bad, "\n".join(bad)


def test_excerpt_mods_are_known_and_have_a_block() -> None:
    """Every excerpt heading names a mod this file knows how to locate, and is followed by a fenced block."""
    bad = excerpt_lock.unknown(ROOT)
    assert not bad, "\n".join(bad)


def test_excerpt_licences_match_the_mods() -> None:
    """The licence in each excerpt heading is the licence the mod really has."""
    bad = excerpt_lock.licences(ROOT)
    assert not bad, "\n".join(bad)


def test_clone_excerpts_use_the_pinned_commit() -> None:
    """Every excerpt of a community clone repo names the full pinned upstream commit in its version slot."""
    bad = excerpt_lock.pins(ROOT)
    assert not bad, "\n".join(bad)


def test_excerpt_source_files_exist_in_the_cache() -> None:
    """Every excerpted file exists in the installed mod cache; skipped when the cache folder is absent."""
    _require_cache(ROOT)
    bad = excerpt_lock.missing(ROOT)
    assert not bad, "\n".join(bad)


def test_excerpts_equal_the_cache_lines() -> None:
    """Every excerpt block equals the cache file lines it cites; skipped when the cache folder is absent."""
    _require_cache(ROOT)
    bad = excerpt_lock.differing(ROOT)
    assert not bad, "\n".join(bad)


def test_differs_check_detects_one_changed_character(tmp_path: Path) -> None:
    """A copy of one reference with one character changed inside an excerpt is reported as DIFFERS."""
    _require_cache(ROOT)
    ref, _, block, _ = next(iter(excerpt_lock.all_excerpts(ROOT)))
    dest = tmp_path / "skills/mods-example-copy/references" / ref.name
    dest.parent.mkdir(parents=True)
    shutil.copy(ref, dest)
    text = dest.read_text(encoding="utf-8")
    # The first non-blank block line occurs inside the copy, and replace(.., 1) hits its first occurrence.
    assert block, "first excerpt has no block lines"
    target = next(line for line in block if line.strip())
    dest.write_text(text.replace(target, target[:-1] + ("x" if target[-1] != "x" else "y"), 1), encoding="utf-8")
    assert excerpt_lock.differing(tmp_path), "a changed character inside an excerpt was not detected"


def test_excerpts_match_the_committed_lock() -> None:
    """Every excerpt has a lock entry with an equal sha256 (and source_sha256 when the cache exists), no entry is stale."""
    bad = _lock_problems(ROOT)
    assert not bad, "\n".join(bad) + f"\n{excerpt_lock.RERUN}"


def test_lock_check_detects_one_changed_character(tmp_path: Path) -> None:
    """A copy of the references with one character changed inside an excerpt fails the lock comparison."""
    shutil.copytree(ROOT / "skills", tmp_path / "skills")
    ref, _, block, _ = next(e for e in excerpt_lock.all_excerpts(tmp_path) if e[2])
    target = next(line for line in block if line.strip())
    ref.write_text(
        ref.read_text(encoding="utf-8").replace(target, target[:-1] + ("x" if target[-1] != "x" else "y"), 1),
        encoding="utf-8",
    )
    assert any(p.startswith("HASH DIFFERS") for p in _lock_problems(tmp_path))


def test_missing_version_folder_fails_instead_of_skipping(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """With the cache root present but one pinned version folder absent, _require_cache fails, not skips."""
    cache = tmp_path / "cache"
    # Only cache-kind mods live under CACHE; a clone mod keeps its clone path (relative_to(CACHE) would raise on it).
    cache_dirs = {n: p for n, p in excerpt_lock.MOD_DIRS.items() if n not in excerpt_lock.CLONE_PINS}
    mod_dirs = {name: cache / path.relative_to(excerpt_lock.CACHE) for name, path in cache_dirs.items()}
    pins = {(m.group(1), m.group(2)) for _, m, _, _ in excerpt_lock.all_excerpts(ROOT) if m.group(1) in mod_dirs}
    for mod, version in pins:
        (mod_dirs[mod] / version).mkdir(parents=True)
    victim = sorted(pins)[0]
    (mod_dirs[victim[0]] / victim[1]).rmdir()
    monkeypatch.setattr(excerpt_lock, "CACHE", cache)
    monkeypatch.setattr(excerpt_lock, "MOD_DIRS", mod_dirs)
    rerun = re.escape(excerpt_lock.RERUN)
    with pytest.raises(pytest.fail.Exception, match=f"mod {victim[0]} updated: .* is absent; re-verify.*{rerun}$"):
        _require_cache(ROOT)


def test_update_script_shares_the_patched_module() -> None:
    """update_excerpt_lock.py imports the same excerpt_lock object the tests patch, not a second copy."""
    spec = importlib.util.spec_from_file_location("update_excerpt_lock", ROOT / "scripts" / "update_excerpt_lock.py")
    assert spec is not None and spec.loader is not None
    update = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(update)
    assert update.excerpt_lock is excerpt_lock


# --- Excerpts read from pinned git clones (TRDD-3I5MBOL2). The plugin redistributes these excerpts, so the lock must
# prove they equal the upstream file at one fixed commit; the tests use the real clones, never mocks.
CLONE_MOD = "Amnesiac9__claude-mods"


def _real_clone_excerpt(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, version: str | None = None) -> Path:
    """Build, under tmp_path, a reference with one excerpt of a real MIT clone file; return the tmp root."""
    clone = excerpt_lock.MOD_DIRS[CLONE_MOD]
    pin = excerpt_lock.CLONE_PINS[CLONE_MOD]
    _require_clone(CLONE_MOD)
    names = subprocess.run(
        ["git", "-C", str(clone), "ls-tree", "-r", "--name-only", pin], capture_output=True, check=True, text=True
    ).stdout.split("\n")
    for name in filter(None, names):
        lines = excerpt_lock.read_source(CLONE_MOD, pin, name)
        if lines is not None and len(lines) >= 3 and not any(line.startswith("```") for line in lines[:3]):
            break
    else:
        pytest.fail(f"no file with 3 plain lines at {pin} in {clone}")
    (tmp_path / "cache").mkdir()
    monkeypatch.setattr(excerpt_lock, "CACHE", tmp_path / "cache")
    ref = tmp_path / "skills/mods-example-clone/references/clone.md"
    ref.parent.mkdir(parents=True)
    heading = f"### {CLONE_MOD} {version or pin}, {name}:1-3, MIT"
    ref.write_text("\n".join([heading, "", "```", *lines[:3], "```", ""]), encoding="utf-8")
    return tmp_path


def test_registered_clone_repos_and_licences() -> None:
    """The 15 clone repos are pinned to 40-hex commits and all have a licence (14 MIT, 1 Apache-2.0); no forbidden repo is a clone pin."""
    pins = excerpt_lock.CLONE_PINS
    assert len(pins) == 15 and all(re.fullmatch(r"[0-9a-f]{40}", h) for h in pins.values())
    cache_mods = {"tokensaver", "deck", "ponytail", "context-harness", "token-weather-usage"}
    assert set(pins) == set(excerpt_lock.MOD_DIRS) - cache_mods
    unlicensed = {
        "IlyaPryzhykau__claude-keep-sessions",
        "raoofaltaher__claude-code-mods",
        "qodfathr__ccwhoami",
    }
    assert unlicensed <= excerpt_lock.FORBIDDEN and not excerpt_lock.FORBIDDEN & set(pins)
    assert set(pins) <= set(excerpt_lock.LICENCES)
    assert sorted(excerpt_lock.LICENCES[mod] for mod in pins).count("MIT") == 14
    assert excerpt_lock.LICENCES["manuacl__claude-mods"] == "Apache-2.0"
    assert not set(excerpt_lock.LICENCES) & excerpt_lock.FORBIDDEN


def test_clone_excerpt_at_the_pinned_commit_verifies(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """An excerpt of a real MIT clone file at its pinned commit passes every check and is hashed with upstream_commit."""
    root = _real_clone_excerpt(tmp_path, monkeypatch)
    assert excerpt_lock.verification_failures(root) == []
    entry = next(iter(excerpt_lock.current_lock(root).values()))
    assert entry["upstream_commit"] == excerpt_lock.CLONE_PINS[CLONE_MOD]


def test_clone_excerpt_with_a_wrong_hash_fails(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A clone excerpt whose version slot is not the pinned commit is reported as PIN and fails verification."""
    root = _real_clone_excerpt(tmp_path, monkeypatch, version="0" * 40)
    assert any(p.startswith("PIN ") for p in excerpt_lock.pins(root))
    assert excerpt_lock.verification_failures(root)


def test_clone_excerpt_that_differs_from_upstream_fails(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A clone excerpt with one changed character is reported as DIFFERS against git show at the pinned commit."""
    root = _real_clone_excerpt(tmp_path, monkeypatch)
    ref = excerpt_lock.references(root)[0]
    text = ref.read_text(encoding="utf-8").splitlines()
    text[3] = text[3] + "x"
    ref.write_text("\n".join(text) + "\n", encoding="utf-8")
    assert any(p.startswith("DIFFERS") for p in excerpt_lock.differing(root))


def test_excerpt_of_a_forbidden_repo_fails(tmp_path: Path) -> None:
    """An excerpt headed with an unlicensed corpus repo is reported as FORBIDDEN."""
    ref = tmp_path / "skills/mods-example-x/references/x.md"
    ref.parent.mkdir(parents=True)
    heading = f"### IlyaPryzhykau__claude-keep-sessions {'a' * 40}, README.md:1-2, MIT"
    ref.write_text(f"{heading}\n\n```\nx\ny\n```\n", encoding="utf-8")
    assert any(p.startswith("FORBIDDEN") for p in excerpt_lock.forbidden(tmp_path))


def test_excerpt_of_an_unregistered_clone_mod_is_unknown(tmp_path: Path) -> None:
    """An excerpt headed with a repo directory that is not registered is reported as UNKNOWN."""
    ref = tmp_path / "skills/mods-example-x/references/x.md"
    ref.parent.mkdir(parents=True)
    heading = f"### nobody__not-registered {'a' * 40}, README.md:1-2, MIT"
    ref.write_text(f"{heading}\n\n```\nx\ny\n```\n", encoding="utf-8")
    assert any(p.startswith("UNKNOWN") for p in excerpt_lock.unknown(tmp_path))


def test_absent_clone_skips_loudly_naming_the_clone(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """With the whole clone root absent, the source checks skip naming the clone, and missing/differing say CLONE ABSENT."""
    (tmp_path / "cache").mkdir()
    monkeypatch.setattr(excerpt_lock, "CACHE", tmp_path / "cache")
    monkeypatch.setattr(excerpt_lock, "CLONES", tmp_path / "no-corpus")
    absent = tmp_path / "no-corpus" / CLONE_MOD
    monkeypatch.setitem(excerpt_lock.MOD_DIRS, CLONE_MOD, absent)
    ref = tmp_path / "skills/mods-example-x/references/x.md"
    ref.parent.mkdir(parents=True)
    heading = f"### {CLONE_MOD} {excerpt_lock.CLONE_PINS[CLONE_MOD]}, README.md:1-2, MIT"
    ref.write_text(f"{heading}\n\n```\nx\ny\n```\n", encoding="utf-8")
    with pytest.raises(pytest.skip.Exception, match=re.escape(str(absent))):
        _require_cache(tmp_path)
    # An absent clone is CLONE ABSENT, never MISSING (MISSING means the clone is there and lacks the file).
    want = [f"CLONE ABSENT skills/mods-example-x/references/x.md:1: {absent}"]
    assert excerpt_lock.missing(tmp_path) == want
    assert excerpt_lock.differing(tmp_path) == want
    assert excerpt_lock.verification_failures(tmp_path) == want
    # The self-consistency checks that need no clone still run and pass.
    assert excerpt_lock.pins(tmp_path) == []


def test_clone_root_present_but_clone_missing_fails(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """With the clone root present but the pinned clone, or its .git, missing, the source checks fail naming the path."""
    (tmp_path / "cache").mkdir()
    (tmp_path / "corpus").mkdir()
    monkeypatch.setattr(excerpt_lock, "CACHE", tmp_path / "cache")
    monkeypatch.setattr(excerpt_lock, "CLONES", tmp_path / "corpus")
    clone = tmp_path / "corpus" / CLONE_MOD
    monkeypatch.setitem(excerpt_lock.MOD_DIRS, CLONE_MOD, clone)
    ref = tmp_path / "skills/mods-example-x/references/x.md"
    ref.parent.mkdir(parents=True)
    heading = f"### {CLONE_MOD} {excerpt_lock.CLONE_PINS[CLONE_MOD]}, README.md:1-2, MIT"
    ref.write_text(f"{heading}\n\n```\nx\ny\n```\n", encoding="utf-8")
    with pytest.raises(pytest.fail.Exception, match=re.escape(str(clone))):
        _require_cache(tmp_path)
    clone.mkdir()  # the folder exists but holds no .git
    with pytest.raises(pytest.fail.Exception, match=re.escape(str(clone))):
        _require_cache(tmp_path)


def test_forbidden_repo_excerpt_reports_forbidden_only(tmp_path: Path) -> None:
    """An excerpt of a no-licence repo is reported as FORBIDDEN and nothing else: not UNKNOWN, PIN, LICENCE or an absent source."""
    ref = tmp_path / "skills/mods-example-x/references/x.md"
    ref.parent.mkdir(parents=True)
    heading = f"### qodfathr__ccwhoami {'a' * 40}, README.md:1-2, MIT"
    ref.write_text(f"{heading}\n\n```\nx\ny\n```\n", encoding="utf-8")
    assert excerpt_lock.licences(tmp_path) == []
    assert excerpt_lock.verification_failures(tmp_path) == ["FORBIDDEN skills/mods-example-x/references/x.md:1: qodfathr__ccwhoami"]
