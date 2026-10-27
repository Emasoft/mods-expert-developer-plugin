"""Tests of scripts/probe.py (TRDD-03IIDGPP, increment 1): the pane and transcript readers, and remove(), which deletes only what one probe wrote.

The functions run for real on temp folders. No test starts tmux or the claude CLI.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from types import ModuleType

import pytest

ROOT = Path(__file__).resolve().parent.parent
_SPEC = importlib.util.spec_from_file_location("probe", ROOT / "scripts" / "probe.py")
assert _SPEC is not None and _SPEC.loader is not None
probe: ModuleType = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(probe)


def test_prompt_box_reads_the_text_of_the_box_above_its_rule() -> None:
    """The prompt box is the line that starts with the prompt mark and has a rule under it; its text is returned trimmed."""
    assert probe.prompt_box("output\n❯ hello there   \n────\n") == "hello there"


def test_prompt_box_takes_the_last_box_on_the_pane() -> None:
    """When two boxes show, the one lower on the pane is the one that counts."""
    assert probe.prompt_box("❯ first\n────\nmore\n❯ second\n────\n") == "second"


def test_prompt_box_is_none_while_no_box_shows() -> None:
    """A pane without a prompt box, or with a prompt line that has no rule under it, has no box."""
    assert probe.prompt_box("just output\nno box here") is None
    assert probe.prompt_box("❯ typed but no rule\nplain line") is None


def test_pane_text_cuts_the_docked_sidebar_and_drops_blank_lines() -> None:
    """Each pane line is cut at its sidebar border, trailing blanks go, and lines that are blank after the cut are dropped."""
    assert probe.pane_text("left text   │ side\n\n  row two │x\n   │ only side") == "left text\n  row two"


def test_entry_lines_reads_user_assistant_and_tool_blocks() -> None:
    """A user string, an assistant text block and a tool call each become one labelled line."""
    assert probe.entry_lines({"type": "user", "message": {"content": "hi"}}) == ["user: hi"]
    assert probe.entry_lines({"type": "assistant", "message": {"content": [{"type": "text", "text": "ok"}]}}) == ["assistant: ok"]
    tool = {"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash", "input": {"command": "ls"}}]}}
    assert probe.entry_lines(tool) == ['tool_use Bash: {"command": "ls"}']


def test_entry_lines_keeps_hook_context_and_drops_engine_attachments() -> None:
    """Only what a hook added is kept; the engine's own attachments are the same in every probe and are dropped."""
    hook = {"type": "attachment", "attachment": {"type": "hook_additional_context", "hookName": "h", "content": ["a", "b"]}}
    assert probe.entry_lines(hook) == ["hook context (h): a\nb"]
    assert probe.entry_lines({"type": "attachment", "attachment": {"type": "tools"}}) == []


def test_entry_lines_cuts_a_long_text_at_its_limit() -> None:
    """A text longer than the limit is cut to it and marked with an ellipsis."""
    line = probe.entry_lines({"type": "user", "message": {"content": "x" * (probe.MAX_TEXT + 5)}})[0]
    assert line == f"user: {'x' * probe.MAX_TEXT}…"


def test_plugin_name_comes_from_the_manifest_and_an_empty_one_is_refused(tmp_path: Path) -> None:
    """The plugin's name is read from its manifest; a manifest without a name is refused rather than guessed."""
    (tmp_path / ".claude-plugin").mkdir()
    manifest = tmp_path / ".claude-plugin" / "plugin.json"
    manifest.write_text(json.dumps({"name": "demo"}), encoding="utf-8")
    assert probe.plugin_name(tmp_path) == "demo"
    manifest.write_text(json.dumps({"version": "1"}), encoding="utf-8")
    with pytest.raises(ValueError, match="has no name in its manifest"):
        probe.plugin_name(tmp_path)


def _probe_dirs(tmp_path: Path) -> tuple[Path, Path, Path]:
    """The plugin store, the transcript folder and the probe's own folder, all under tmp_path."""
    store = tmp_path / "store"
    projects = tmp_path / "projects"
    workdir = tmp_path / "probe-runner-abc"
    for d in (store, projects, workdir):
        d.mkdir()
    return store, projects, workdir


def test_remove_keeps_an_inline_file_that_existed_before_the_probe(tmp_path: Path) -> None:
    """An inline store file of a plugin under test is kept when it was already in the store before the probe started."""
    store, projects, workdir = _probe_dirs(tmp_path)
    (store / "demo_inline-old.json").write_text("{}", encoding="utf-8")
    before = probe.inline_files(store)
    removed, _ = probe.remove(workdir, "enc", ["demo"], before, projects, store)
    assert (store / "demo_inline-old.json").is_file()
    assert str(store / "demo_inline-old.json") not in removed


def test_remove_keeps_a_file_another_plugin_created_during_the_probe(tmp_path: Path) -> None:
    """A file written during the probe under another plugin's name is kept: only the plugins under test own what the probe deletes."""
    store, projects, workdir = _probe_dirs(tmp_path)
    before = probe.inline_files(store)
    (store / "other_inline-new.json").write_text("{}", encoding="utf-8")
    removed, _ = probe.remove(workdir, "enc", ["demo"], before, projects, store)
    assert (store / "other_inline-new.json").is_file()
    assert str(store / "other_inline-new.json") not in removed


def test_remove_deletes_the_inline_file_the_probe_wrote_for_its_plugin(tmp_path: Path) -> None:
    """A file that was absent before and carries a plugin under test's prefix is the probe's own and is deleted."""
    store, projects, workdir = _probe_dirs(tmp_path)
    before = probe.inline_files(store)
    (store / "demo_inline-new.json").write_text("{}", encoding="utf-8")
    removed, _ = probe.remove(workdir, "enc", ["demo"], before, projects, store)
    assert not (store / "demo_inline-new.json").exists()
    assert str(store / "demo_inline-new.json") in removed


def test_remove_does_not_claim_a_plugin_whose_name_only_begins_the_same_way(tmp_path: Path) -> None:
    """The prefix ends at `_inline-`: a plugin named demo-two does not own a file of the plugin demo, and the reverse."""
    store, projects, workdir = _probe_dirs(tmp_path)
    before = probe.inline_files(store)
    (store / "demo-two_inline-new.json").write_text("{}", encoding="utf-8")
    probe.remove(workdir, "enc", ["demo"], before, projects, store)
    assert (store / "demo-two_inline-new.json").is_file()


def test_remove_deletes_the_probe_folder_and_its_transcripts(tmp_path: Path) -> None:
    """The probe's own folder and every transcript folder named after it are deleted, and both are listed as removed."""
    store, projects, workdir = _probe_dirs(tmp_path)
    transcripts = projects / "enc-probe-abc"
    transcripts.mkdir()
    removed, _ = probe.remove(workdir, "enc", ["demo"], probe.inline_files(store), projects, store)
    assert not workdir.exists()
    assert not transcripts.exists()
    assert removed[0] == str(workdir)
    assert str(transcripts) in removed


def test_remove_reports_a_removal_that_failed_as_left_behind(tmp_path: Path) -> None:
    """A removal that fails is named as left behind with its path, is not listed as deleted, and does not raise."""
    store, projects, workdir = _probe_dirs(tmp_path)
    real = tmp_path / "real"
    real.mkdir()
    workdir.rmdir()
    # shutil.rmtree refuses a symbolic link for any uid, so this removal fails whoever runs the tests.
    workdir.symlink_to(real, target_is_directory=True)
    removed, left_behind = probe.remove(workdir, "enc", ["demo"], probe.inline_files(store), projects, store)
    assert str(workdir) not in removed
    assert len(left_behind) == 1
    assert left_behind[0].startswith(f"cleanup left {workdir} behind: ")
    assert real.is_dir()
