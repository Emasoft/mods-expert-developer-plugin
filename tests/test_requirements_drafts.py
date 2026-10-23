"""Tests for the requirements-drafts list and search script, run on real files in tmp_path."""

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "skills/mods-requirements-drafts-list/scripts/drafts.py"
END = "<!-- requirements-drafts:end -->"


def _draft(folder: Path, stamp: str, text: str, project: str = "/proj/a", complete: bool = True) -> Path:
    path = folder / f"{stamp}-abcdef123456.md"
    tail = f"\n{END}\n" if complete else "\n"
    path.write_text(f"---\nid: id-{stamp}\nproject-root: {project}\n---\n{text}{tail}", encoding="utf-8")
    return path


def _run(folder: Path, *args: str) -> subprocess.CompletedProcess[str]:
    env = {**os.environ, "REQUIREMENTS_DRAFTS_DIR": str(folder)}
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=env, check=False)


def test_newest_first(tmp_path: Path) -> None:
    """Drafts are listed newest first."""
    _draft(tmp_path, "20260101_100000+0200", "old one")
    _draft(tmp_path, "20260301_100000+0200", "new one")
    out = _run(tmp_path, "list", "--all").stdout
    assert out.index("new one") < out.index("old one")


def test_project_filter(tmp_path: Path) -> None:
    """--project keeps only the drafts of that project root."""
    _draft(tmp_path, "20260101_100000+0200", "in a", "/proj/a")
    _draft(tmp_path, "20260102_100000+0200", "in b", "/proj/b")
    out = _run(tmp_path, "list", "--project", "/proj/a").stdout
    assert "in a" in out and "in b" not in out


def test_all_ignores_project(tmp_path: Path) -> None:
    """--all lists drafts of every project."""
    _draft(tmp_path, "20260101_100000+0200", "in a", "/proj/a")
    _draft(tmp_path, "20260102_100000+0200", "in b", "/proj/b")
    out = _run(tmp_path, "list", "--all").stdout
    assert "in a" in out and "in b" in out


def test_since(tmp_path: Path) -> None:
    """--since drops drafts older than the date."""
    _draft(tmp_path, "20260101_100000+0200", "january")
    _draft(tmp_path, "20260301_100000+0200", "march")
    out = _run(tmp_path, "list", "--all", "--since", "2026-02-01").stdout
    assert "march" in out and "january" not in out


def test_all_keywords_must_match(tmp_path: Path) -> None:
    """Search returns only drafts that contain every keyword."""
    _draft(tmp_path, "20260101_100000+0200", "login and token")
    _draft(tmp_path, "20260102_100000+0200", "login only")
    out = _run(tmp_path, "search", "login", "token", "--all").stdout
    assert "login and token" in out and "login only" not in out


def test_search_is_case_insensitive(tmp_path: Path) -> None:
    """Search matches regardless of letter case."""
    _draft(tmp_path, "20260101_100000+0200", "Needs OAuth Support")
    out = _run(tmp_path, "search", "oauth", "SUPPORT", "--all").stdout
    assert "Needs OAuth Support" in out


def test_incomplete_file_is_reported_not_listed(tmp_path: Path) -> None:
    """A file without the end line is reported as incomplete and never as a draft."""
    partial = _draft(tmp_path, "20260101_100000+0200", "half written", complete=False)
    out = _run(tmp_path, "list", "--all").stdout
    assert "0 of 0" in out and "Incomplete files" in out
    assert f"- {partial}" in out and "| half written" not in out


def test_missing_folder_is_an_error(tmp_path: Path) -> None:
    """A missing drafts folder exits non-zero with a clear message."""
    result = _run(tmp_path / "nope", "list")
    assert result.returncode != 0
    assert "folder not found" in result.stderr


SESSION = "11111111-2222-3333-4444-555555555555"


def _mod_draft(folder: Path, draft_id: str, project: str, message_id: str, via: str, surface: str, text: str) -> Path:
    """Hand copy of renderDraft in hooks/requirements-drafts/logic.ts; test_mod_copy_matches_logic_ts checks only its field keys, their order and the end line, not the rest of the layout."""
    q = json.dumps
    created = f"{draft_id[0:4]}-{draft_id[4:6]}-{draft_id[6:8]}T{draft_id[9:11]}:{draft_id[11:13]}:{draft_id[13:15]}{draft_id[15:20]}"
    lines = [
        "---",
        f"id: {q(draft_id)}",
        f"created: {q(created)}",
        f"project-root: {q(project)}",
        f"repo: {q(str())}",
        f"session: {q(SESSION)}",
        f"message-id: {q(message_id)}",
        f"via: {q(via)}",
        f"surface: {q(surface)}",
        "---",
        "",
        text.rstrip(),
        "",
        END,
        "",
    ]
    path = folder / f"{draft_id}.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def test_mod_format_row_and_command_paths(tmp_path: Path) -> None:
    """Drafts in the mod exact format (JSON-quoted values, empty surface on the command path) decode cleanly."""
    _mod_draft(
        tmp_path,
        "20261023_101010+0200-aaaaaaaaaaaa",
        "/home/user/project",
        "msg-1",
        "row",
        "terminal",
        "row path message",
    )
    _mod_draft(
        tmp_path, "20261023_111111+0200-bbbbbbbbbbbb", "/home/user/project", "", "command", "", "command path message"
    )
    out = _run(tmp_path, "list", "--project", "/home/user/project").stdout
    assert "| 20261023_101010+0200-aaaaaaaaaaaa | 20261023_101010+0200 | /home/user/project |" in out
    assert "| 20261023_111111+0200-bbbbbbbbbbbb | 20261023_111111+0200 | /home/user/project |" in out
    assert "2 of 2" in out


def test_quoted_values_are_json_decoded(tmp_path: Path) -> None:
    """A project root holding a quote is decoded by json.loads, not stripped of its quote."""
    project = "/home/user/" + chr(34) + "name"
    _mod_draft(tmp_path, "20261023_101010+0200-aaaaaaaaaaaa", project, "", "command", "", "quoted")
    out = _run(tmp_path, "list", "--project", project).stdout
    assert "quoted" in out and project in out


def test_end_line_inside_message_does_not_cut_it(tmp_path: Path) -> None:
    """A message that contains the end line keeps its text; only the last non-empty line marks completeness."""
    text = f"before\n{END}\nafter the marker"
    _mod_draft(tmp_path, "20261023_101010+0200-aaaaaaaaaaaa", "/home/user/project", "", "command", "", text)
    out = _run(tmp_path, "search", "after", "the", "marker", "--all").stdout
    assert "1 of 1" in out and "Incomplete" not in out


def test_text_after_the_end_line_means_incomplete(tmp_path: Path) -> None:
    """A file whose last non-empty line is not the end line is incomplete."""
    path = _mod_draft(tmp_path, "20261023_101010+0200-aaaaaaaaaaaa", "/home/user/project", "", "command", "", "cut off")
    path.write_text(path.read_text(encoding="utf-8") + "partial tail\n", encoding="utf-8")
    out = _run(tmp_path, "list", "--all").stdout
    assert "0 of 0" in out and f"- {path}" in out


def test_project_match_uses_real_paths(tmp_path: Path) -> None:
    """A draft saved under a symlinked folder matches --project given as the real folder, and the reverse."""
    real = tmp_path / "real"
    real.mkdir()
    link = tmp_path / "link"
    link.symlink_to(real)
    drafts = tmp_path / "drafts"
    drafts.mkdir()
    _draft(drafts, "20260101_100000+0200", "via link", str(link))
    _draft(drafts, "20260102_100000+0200", "via real", str(real))
    out = _run(drafts, "list", "--project", str(real)).stdout
    assert "via link" in out and "via real" in out
    out = _run(drafts, "list", "--project", str(link)).stdout
    assert "via link" in out and "via real" in out


def test_limit_must_be_positive(tmp_path: Path) -> None:
    """--limit 0 and a negative --limit are argument errors."""
    for value in ("0", "-3"):
        result = _run(tmp_path, "list", "--all", "--limit", value)
        assert result.returncode == 2
        assert "must be >= 1" in result.stderr


def test_limit_caps_rows(tmp_path: Path) -> None:
    """--limit 1 shows one row and counts the rest."""
    _draft(tmp_path, "20260101_100000+0200", "one")
    _draft(tmp_path, "20260102_100000+0200", "two")
    assert "1 of 2" in _run(tmp_path, "list", "--all", "--limit", "1").stdout


def test_negative_offset_date_survives(tmp_path: Path) -> None:
    """A stamp with a negative offset keeps the whole timestamp in the date column."""
    _draft(tmp_path, "20260101_100000-0500", "west")
    out = _run(tmp_path, "list", "--all").stdout
    assert "| 20260101_100000-0500 |" in out


def test_pipes_are_escaped_in_every_cell(tmp_path: Path) -> None:
    """A pipe in the message, the project root or the path is escaped so the table keeps five columns."""
    folder = tmp_path / "a|b"
    folder.mkdir()
    _draft(folder, "20260101_100000+0200", "left | right", "/proj/x|y")
    row = next(ln for ln in _run(folder, "list", "--all").stdout.split("\n") if "left" in ln)
    assert "left \\| right" in row and "/proj/x\\|y" in row and "a\\|b" in row
    assert len(row.replace("\\|", "").split("|")) == 7


def test_table_headers(tmp_path: Path) -> None:
    """List says `first line`; search says `first line // first line with a keyword`."""
    _draft(tmp_path, "20260101_100000+0200", "hello")
    assert "| first line |" in _run(tmp_path, "list", "--all").stdout
    assert "| first line // first line with a keyword |" in _run(tmp_path, "search", "hello", "--all").stdout


def test_empty_project_root_never_matches_a_project_filter(tmp_path: Path) -> None:
    """A draft with an empty project-root is not matched by the cwd, only listed with --all."""
    _draft(tmp_path, "20260101_100000+0200", "no project", "")
    here = os.path.realpath(os.getcwd())
    assert "no project" not in _run(tmp_path, "list", "--project", here).stdout
    assert "no project" in _run(tmp_path, "list", "--all").stdout


def test_project_filter_includes_subfolders_not_prefix_siblings(tmp_path: Path) -> None:
    """A draft saved from a subfolder matches the repo; /x/proj2 does not match /x/proj."""
    proj = tmp_path / "proj"
    (proj / "sub").mkdir(parents=True)
    (tmp_path / "proj2").mkdir()
    drafts = tmp_path / "drafts"
    drafts.mkdir()
    _draft(drafts, "20260101_100000+0200", "at root", str(proj))
    _draft(drafts, "20260102_100000+0200", "in subfolder", str(proj / "sub"))
    _draft(drafts, "20260103_100000+0200", "in sibling", str(tmp_path / "proj2"))
    out = _run(drafts, "list", "--project", str(proj)).stdout
    assert "at root" in out and "in subfolder" in out and "in sibling" not in out


def test_default_outside_git_matches_only_the_exact_cwd(tmp_path: Path) -> None:
    """Without git and without --project, only drafts of the cwd itself match, not those of its subfolders."""
    cwd = tmp_path / "work"
    (cwd / "sub").mkdir(parents=True)
    drafts = tmp_path / "drafts"
    drafts.mkdir()
    _draft(drafts, "20260101_100000+0200", "at cwd", str(cwd))
    _draft(drafts, "20260102_100000+0200", "in subfolder", str(cwd / "sub"))
    # HOME and GIT_CEILING_DIRECTORIES keep git from finding a repository above tmp_path.
    env = {
        **os.environ,
        "REQUIREMENTS_DRAFTS_DIR": str(drafts),
        "HOME": str(tmp_path),
        "GIT_CEILING_DIRECTORIES": str(tmp_path),
    }
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "list"], capture_output=True, text=True, env=env, cwd=cwd, check=False
    ).stdout
    assert "at cwd" in out and "in subfolder" not in out


def test_mod_copy_matches_logic_ts() -> None:
    """The field keys of renderDraft in logic.ts, in order, equal those _mod_draft writes; END_LINE equals END."""
    source = (Path(__file__).resolve().parent.parent / "hooks/requirements-drafts/logic.ts").read_text(encoding="utf-8")
    body = source.split("export function renderDraft", 1)[1].split("\n}\n", 1)[0]
    ts_keys = re.findall(r"field\('([^']+)'", body)
    end_line = re.search(r"export const END_LINE = '([^']+)'", source)
    assert end_line is not None and end_line.group(1) == END
    probe = Path(os.environ.get("TMPDIR", "/tmp"))
    with tempfile.TemporaryDirectory(dir=probe) as folder:
        written = _mod_draft(Path(folder), "20261023_101010+0200-aaaaaaaaaaaa", "/p", "m", "row", "terminal", "t")
        py_keys = [ln.split(":", 1)[0] for ln in written.read_text(encoding="utf-8").split("\n")[1:9]]
    assert ts_keys == py_keys and len(ts_keys) == 8


def test_search_skill_script_path_exists_and_is_executable() -> None:
    """The path the search skill runs resolves to drafts.py, which is executable."""
    root = Path(__file__).resolve().parent.parent
    script = root / "skills/mods-requirements-drafts-search/../mods-requirements-drafts-list/scripts/drafts.py"
    assert script.is_file()
    assert os.access(script, os.X_OK)
