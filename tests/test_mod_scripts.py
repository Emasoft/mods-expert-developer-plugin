"""Tests for the three shell tools under skills/mods-tutorial-quickstart/scripts/ (TRDD-BNBDNR2V).

Every test runs the real script with bash on tmp dirs. No PATH shim and no stub is used, and no test
invokes the claude CLI: CI has none, so only the branches that never reach it are covered here.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "skills/mods-tutorial-quickstart/scripts"
EXAMPLE = "hello-mod"
BASH = shutil.which("bash") or sys.exit("bash not found")


def _run(script: str, *args: str | Path, path: str | None = None) -> subprocess.CompletedProcess[str]:
    """Run one script with bash, optionally under a replacement PATH, and capture its output."""
    env = None
    if path is not None:
        env = {"PATH": path}
    return subprocess.run(
        [BASH, str(SCRIPTS / script), *map(str, args)],
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )


def _make_mod(root: Path, name: str = "demo-mod") -> Path:
    """Create a small mod folder with the files keep-mod.sh must copy and the ones it must leave out."""
    mod = root / name
    (mod / ".claude-plugin/types").mkdir(parents=True)
    (mod / ".claude-plugin/plugin.json").write_text(json.dumps({"name": name}), encoding="utf-8")
    (mod / ".claude-plugin/types/tsconfig.json").write_text("{}", encoding="utf-8")
    (mod / "tsconfig.json").write_text("{}", encoding="utf-8")
    (mod / "hooks").mkdir()
    (mod / "hooks/register.ts").write_text("export {};\n", encoding="utf-8")
    (mod / "README.md").write_text(f"# {name}\n", encoding="utf-8")
    return mod


@pytest.mark.parametrize("bad", ["A", "a", "1abc", "has_underscore", "Upper", "x" * 42, "-lead", "a b"])
def test_new_mod_rejects_an_invalid_mod_name(tmp_path: Path, bad: str) -> None:
    """A mod name outside ^[a-z][a-z0-9-]{1,40}$ is refused with exit 64 and nothing is created."""
    result = _run("new-mod.sh", EXAMPLE, tmp_path, bad)
    assert result.returncode == 64
    assert list(tmp_path.iterdir()) == []


def test_new_mod_copies_and_renames_exact_tokens_only(tmp_path: Path) -> None:
    """The copy gets the new plugin name in plugin.json and README; every other file holding the old name is listed, exactly."""
    result = _run("new-mod.sh", EXAMPLE, tmp_path, "my-guard")
    assert result.returncode == 0, result.stderr
    target = tmp_path.resolve() / "my-guard"
    assert json.loads((target / ".claude-plugin/plugin.json").read_text(encoding="utf-8"))["name"] == "my-guard"
    readme = (target / "README.md").read_text(encoding="utf-8")
    assert "my-guard" in readme
    assert not re.search(r"(?<![\w-])hello-mod(?![\w-])", readme)
    # hello-mod names itself in these files too; they are reported, not rewritten.
    listed = {ln.split(":", 1)[0] for ln in result.stdout.splitlines() if ln.startswith(str(target) + "/")}
    assert listed == {str(target / p) for p in ("hooks/register.ts", "smoke.sh", "tests/register.test.ts")}
    assert "Rename any command or tool names" in result.stdout


def test_new_mod_refuses_an_existing_target_and_keeps_it(tmp_path: Path) -> None:
    """An existing target folder makes new-mod.sh exit 1 and its files stay exactly as they were."""
    target = tmp_path / "taken"
    target.mkdir()
    (target / "keep.txt").write_text("mine", encoding="utf-8")
    result = _run("new-mod.sh", EXAMPLE, tmp_path, "taken")
    assert result.returncode == 1
    assert "refusing to overwrite" in result.stderr
    assert (target / "keep.txt").read_text(encoding="utf-8") == "mine"
    assert [p.name for p in target.iterdir()] == ["keep.txt"]


def test_new_mod_rejects_an_unknown_example(tmp_path: Path) -> None:
    """An example name that no tutorial ships exits 1 and creates nothing."""
    result = _run("new-mod.sh", "no-such-example", tmp_path, "my-guard")
    assert result.returncode == 1
    assert list(tmp_path.iterdir()) == []


def test_keep_mod_copies_without_engine_files_and_deletes_nothing(tmp_path: Path) -> None:
    """keep-mod.sh leaves out types/ and the root tsconfig.json, never touches the source, and prints the plugin dirs line."""
    src = _make_mod(tmp_path / "session")
    dest_root = tmp_path / "kept"
    dest_root.mkdir()
    (dest_root / "other.txt").write_text("sibling", encoding="utf-8")
    before = sorted(p.relative_to(src).as_posix() for p in src.rglob("*"))
    result = _run("keep-mod.sh", src, dest_root)
    assert result.returncode == 0, result.stderr
    dest = dest_root / "demo-mod"
    assert (dest / ".claude-plugin/plugin.json").is_file()
    assert (dest / "hooks/register.ts").is_file()
    assert (dest / "README.md").is_file()
    assert not (dest / ".claude-plugin/types").exists()
    assert not (dest / "tsconfig.json").exists()
    assert (dest_root / "other.txt").read_text(encoding="utf-8") == "sibling"
    assert sorted(p.relative_to(src).as_posix() for p in src.rglob("*")) == before
    assert "CLAUDE_CODE_PLUGIN_DIRS" in result.stdout
    assert str(dest.resolve()) in result.stdout


def test_keep_mod_refuses_an_existing_destination(tmp_path: Path) -> None:
    """An existing destination makes keep-mod.sh exit 1 and its contents stay unchanged."""
    src = _make_mod(tmp_path / "session")
    dest = tmp_path / "kept/demo-mod"
    dest.mkdir(parents=True)
    (dest / "old.txt").write_text("old", encoding="utf-8")
    result = _run("keep-mod.sh", src, tmp_path / "kept")
    assert result.returncode == 1
    assert "refusing to overwrite" in result.stderr
    assert [p.name for p in dest.iterdir()] == ["old.txt"]


def test_check_mod_reports_claude_missing(tmp_path: Path) -> None:
    """Without claude on PATH, check-mod.sh prints "== FAIL: claude not found" and exits 1; env drops HOME, so the tsconfig must stay removed (npx needs HOME)."""
    restricted = "/usr/bin:/bin"
    assert shutil.which("claude", path=restricted) is None
    mod = _make_mod(tmp_path)
    (mod / "tsconfig.json").unlink()
    result = _run("check-mod.sh", mod, path=restricted)
    assert result.returncode == 1
    assert result.stdout.strip().splitlines()[-1] == "== FAIL: claude not found"


@pytest.mark.parametrize("args", [(), ("a", "b")])
def test_check_mod_usage_error(args: tuple[str, ...]) -> None:
    """check-mod.sh with a wrong argument count exits 64."""
    assert _run("check-mod.sh", *args).returncode == 64


@pytest.mark.slow
def test_check_mod_fails_when_tsc_checks_no_hook_file(tmp_path: Path) -> None:
    """🐌 Slow: real npx fetches typescript@5. A tsconfig that includes no hooks/*.ts makes check-mod.sh print "== FAIL: tsc checked no hook files"."""
    mod = _make_mod(tmp_path)
    (mod / "other").mkdir()
    (mod / "other/a.ts").write_text("export const a: number = 1;\n", encoding="utf-8")
    (mod / "tsconfig.json").write_text(
        json.dumps({"compilerOptions": {"noEmit": True, "target": "es2020"}, "include": ["other/*.ts"]}),
        encoding="utf-8",
    )
    result = _run("check-mod.sh", mod)
    assert result.returncode == 1, result.stdout + result.stderr
    assert result.stdout.strip().splitlines()[-1] == "== FAIL: tsc checked no hook files"


def test_check_mod_reports_types_not_generated(tmp_path: Path) -> None:
    """A tsconfig extending an absent .claude-plugin/types file fails with the load-once hint before any claude step (no claude needed)."""
    mod = tmp_path / "fresh-mod"
    mod.mkdir()
    (mod / "tsconfig.json").write_text(
        json.dumps({"extends": "./.claude-plugin/types/tsconfig.json"}), encoding="utf-8"
    )
    result = _run("check-mod.sh", mod, path="/usr/bin:/bin")
    assert result.returncode == 1
    last = result.stdout.strip().splitlines()[-1]
    assert last.startswith("== FAIL: tsc (types not generated yet: load the mod once with claude --plugin-dir ")
    assert last.endswith("so Claude Code writes .claude-plugin/types/, then re-run)")


def test_new_mod_leaves_longer_tokens_containing_the_old_name_unchanged(tmp_path: Path) -> None:
    """Only the exact plugin-name token is replaced: hello-extra, my-hello and hello_x in the README stay as written."""
    tree = tmp_path / "tree"
    scripts = tree / "mods-tutorial-quickstart/scripts"
    example = tree / "mods-tutorial-x/examples/hello"
    (example / ".claude-plugin").mkdir(parents=True)
    scripts.mkdir(parents=True)
    shutil.copy(SCRIPTS / "new-mod.sh", scripts / "new-mod.sh")
    (example / ".claude-plugin/plugin.json").write_text(json.dumps({"name": "hello"}), encoding="utf-8")
    (example / "README.md").write_text("hello / hello-extra / my-hello / hello_x / (hello)\n", encoding="utf-8")
    result = subprocess.run(
        [BASH, str(scripts / "new-mod.sh"), "hello", str(tmp_path / "out"), "renamed"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    readme = (tmp_path / "out/renamed/README.md").read_text(encoding="utf-8")
    assert readme == "renamed / hello-extra / my-hello / hello_x / (renamed)\n"


@pytest.mark.slow
def test_check_mod_skips_the_hook_proof_for_a_mod_without_ts_hooks(tmp_path: Path) -> None:
    """🐌 Slow: real npx tsc. A JavaScript-only mod (hooks/register.js plus a tsconfig) is not failed for having no hook files."""
    mod = tmp_path / "js-mod"
    (mod / "hooks").mkdir(parents=True)
    (mod / "hooks/register.js").write_text("export function register() {}\n", encoding="utf-8")
    (mod / "tsconfig.json").write_text(
        json.dumps({"compilerOptions": {"noEmit": True, "allowJs": True}, "include": ["hooks/*.js"]}), encoding="utf-8"
    )
    result = _run("check-mod.sh", mod)
    assert "checked no hook files" not in result.stdout
    assert "tsc: no hooks/*.ts|tsx to prove; proof skipped" in result.stdout


def test_new_mod_finds_its_example_when_the_path_has_a_space(tmp_path: Path) -> None:
    """The script copied into a tree whose path holds a space still resolves the example next to it."""
    tree = tmp_path / "my tree"
    scripts = tree / "mods-tutorial-quickstart/scripts"
    example = tree / "mods-tutorial-x/examples/hello"
    (example / ".claude-plugin").mkdir(parents=True)
    scripts.mkdir(parents=True)
    shutil.copy(SCRIPTS / "new-mod.sh", scripts / "new-mod.sh")
    (example / ".claude-plugin/plugin.json").write_text(json.dumps({"name": "hello"}), encoding="utf-8")
    result = subprocess.run(
        [BASH, str(scripts / "new-mod.sh"), "hello", str(tmp_path / "out"), "renamed"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert (tmp_path / "out/renamed/.claude-plugin/plugin.json").is_file()


def test_keep_mod_warns_about_symlinks_and_states_what_it_left_out(tmp_path: Path) -> None:
    """A symlink in the kept copy is listed with a warning, and the left-out line is printed."""
    src = _make_mod(tmp_path / "session")
    (src / "link").symlink_to(tmp_path)
    result = _run("keep-mod.sh", src, tmp_path / "kept")
    assert result.returncode == 0, result.stderr
    assert "left out: tsconfig.json, .claude-plugin/types/" in result.stdout
    assert "warning: symlinks" in result.stdout
    assert str((tmp_path / "kept").resolve() / "demo-mod/link") in result.stdout
    assert not list((tmp_path / "kept").glob(".keep-mod.*"))


@pytest.mark.parametrize("script", ["keep-mod.sh", "new-mod.sh"])
def test_other_scripts_exit_64_on_a_usage_error(script: str) -> None:
    """keep-mod.sh and new-mod.sh with no arguments exit 64, leaving 2 free."""
    assert _run(script).returncode == 64


def test_keep_mod_failed_copy_leaves_partial_folder_and_no_destination(tmp_path: Path) -> None:
    """An unreadable source file makes keep-mod.sh exit non-zero, name the partial folder, create no destination and leave the source as it was (as root the copy succeeds, since root ignores the mode)."""
    src = _make_mod(tmp_path / "session")
    locked = src / "secret.txt"
    locked.write_text("s", encoding="utf-8")
    before = sorted(p.relative_to(src).as_posix() for p in src.rglob("*"))
    dest_root = tmp_path / "kept"
    locked.chmod(0o000)
    try:
        result = _run("keep-mod.sh", src, dest_root)
        dest = dest_root / "demo-mod"
        if os.access(locked, os.R_OK):  # still readable after chmod 000: running as root
            assert result.returncode == 0, result.stderr
            assert dest.is_dir()
        else:
            assert result.returncode != 0
            assert not dest.exists()
            partial = list(dest_root.glob(".keep-mod.*"))
            assert len(partial) == 1
            assert f"partial copy left at {partial[0].resolve()}" in result.stderr
    finally:
        locked.chmod(0o644)
    assert sorted(p.relative_to(src).as_posix() for p in src.rglob("*")) == before


def test_keep_mod_refusal_leaves_no_nested_folder(tmp_path: Path) -> None:
    """A destination that already exists is refused with exit 1 and no folder is nested inside it (the check-then-move race is simulated by creating the destination first)."""
    src = _make_mod(tmp_path / "session")
    dest = tmp_path / "kept/demo-mod"
    dest.mkdir(parents=True)
    result = _run("keep-mod.sh", src, tmp_path / "kept")
    assert result.returncode == 1
    assert list(dest.iterdir()) == []


def test_keep_mod_refuses_a_dangling_symlink_destination(tmp_path: Path) -> None:
    """A destination that is a symlink to a missing path counts as existing: refused before any copy, exit 1, 'refusing to overwrite', symlink untouched."""
    src = _make_mod(tmp_path / "session")
    dest = tmp_path / "kept/demo-mod"
    dest.parent.mkdir()
    dest.symlink_to(tmp_path / "missing-target")
    result = _run("keep-mod.sh", src, tmp_path / "kept")
    assert result.returncode == 1
    assert "refusing to overwrite" in result.stderr
    assert dest.is_symlink()
    assert not list((tmp_path / "kept").glob(".keep-mod.*"))
    assert os.readlink(dest) == str(tmp_path / "missing-target")
    assert not dest.exists()


@pytest.mark.parametrize(
    "extends",
    [["./.claude-plugin/types/tsconfig.json"], "./vendor/.claude-plugin/types/tsconfig.json"],
    ids=["array-form", "look-alike-path"],
)
def test_check_mod_types_check_ignores_array_and_look_alike_extends(tmp_path: Path, extends: object) -> None:
    """An array-form extends or a path that only contains .claude-plugin/types/ is not reported as types-not-generated; it falls through to tsc."""
    mod = tmp_path / "odd-mod"
    mod.mkdir()
    (mod / "tsconfig.json").write_text(json.dumps({"extends": extends}), encoding="utf-8")
    result = _run("check-mod.sh", mod, path="/usr/bin:/bin")
    assert "types not generated yet" not in result.stdout
    assert "missing:" not in result.stdout


def test_check_mod_types_check_accepts_the_bare_generated_form(tmp_path: Path) -> None:
    """The extends form without ./ is also reported as types-not-generated when the file is absent."""
    mod = tmp_path / "bare-mod"
    mod.mkdir()
    (mod / "tsconfig.json").write_text(json.dumps({"extends": ".claude-plugin/types/tsconfig.json"}), encoding="utf-8")
    result = _run("check-mod.sh", mod, path="/usr/bin:/bin")
    assert result.returncode == 1
    assert "types not generated yet" in result.stdout.splitlines()[-1]
