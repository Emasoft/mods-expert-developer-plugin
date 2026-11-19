"""Tests of the mods-uninstall-mod skill (TRDD-7YXW2QZC, owner question Q3 "Yes, scope it").

allowed-tools names exact rules instead of a bare Bash, no rule grants an uninstall, and the shortlist script keeps
the rows the jq pipeline it replaces kept. The grant checks use the matcher of tests/test_skill_to_mod.py, which holds
what Claude Code 2.1.317 measured about Bash rules, and render ${CLAUDE_PLUGIN_ROOT} as Claude Code does, in the rules
and in the body alike.
"""

from __future__ import annotations

import importlib.util
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "mods-uninstall-mod" / "SKILL.md"
SCRIPT = ROOT / "skills" / "mods-uninstall-mod" / "scripts" / "shortlist.py"
SHORTLIST_RULE = 'Bash(python3 -I "${CLAUDE_PLUGIN_ROOT}/skills/mods-uninstall-mod/scripts/shortlist.py" *)'


def _module(path: Path, name: str):
    """The module in `path`, loaded without collecting its tests."""
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


HELPERS = _module(ROOT / "tests" / "test_skill_to_mod.py", "_skill_to_mod")
SHORTLIST = _module(SCRIPT, "_shortlist")


def _split() -> tuple[list[str], str]:
    """(the allowed-tools entries as written, the body after the frontmatter)."""
    text = SKILL.read_text(encoding="utf-8")
    end = text.index("\n---\n", 4)
    tools = [tool.strip() for tool in yaml.safe_load(text[4:end])["allowed-tools"].split(",")]
    return tools, text[end + 5 :]


def _rules_and_commands() -> tuple[list[str], list[str]]:
    """(the rendered Bash rules, the rendered commands of the body: each bash-block line and each inline code span
    that starts with claude or python3, with every <placeholder> as a sample argument)."""
    tools, body = _split()
    lines = [line.strip() for block in re.findall(r"```bash\n(.*?)```", body, re.S) for line in block.splitlines() if line.strip()]
    spans = re.findall(r"`([^`\n]+)`", re.sub(r"```.*?```", "", body, flags=re.S))
    commands = [*lines, *(span for span in spans if span.startswith(("claude ", "python3 ")))]
    rules = [HELPERS._substitute(tool) for tool in tools if tool.startswith("Bash(")]
    return rules, [re.sub(r"<[^>]+>", "sample-arg", HELPERS._substitute(command)) for command in commands]


def test_allowed_tools_are_three_exact_rules_and_no_bare_bash() -> None:
    """allowed-tools holds the marketplace list, the shortlist script and the run tool, and nothing that grants every command."""
    tools, _ = _split()
    assert tools == ["Bash(claude plugin marketplace list --json)", SHORTLIST_RULE, "mcp__mods-expert-developer-plugin__run"]
    assert "Bash" not in tools and "Bash(*)" not in tools


def test_each_read_command_is_granted_and_a_chained_one_is_not() -> None:
    """The marketplace list and the shortlist run match a rule; a chained command, or another script in the same folder, does not."""
    rules, commands = _rules_and_commands()
    reads = [command for command in commands if command.startswith(("claude plugin marketplace list", "python3 -I "))]
    assert any(command.startswith("python3 -I ") for command in reads), commands
    for command in reads:
        assert any(HELPERS._grants(rule, command) for rule in rules), f"no allowed-tools rule matches: {command}"
    script = HELPERS._substitute('"${CLAUDE_PLUGIN_ROOT}/skills/mods-uninstall-mod/scripts/')
    for command in [
        f"python3 -I {script}shortlist.py\" 'x' && rm -rf /tmp/sample-arg",
        "claude plugin marketplace list --json; claude plugin uninstall 'x' -s user --json",
        f"python3 -I {script}other.py\" 'x'",
        "claude plugin list --json",
    ]:
        assert not any(HELPERS._grants(rule, command) for rule in rules), f"a rule grants: {command}"


def test_no_rule_grants_an_uninstall() -> None:
    """The two uninstalls of step 6, and one with -y added, need the permission mode, the user's rules or a prompt."""
    rules, commands = _rules_and_commands()
    # The --help spans of step 5 and Resources name the flags; they are not commands the skill runs.
    uninstalls = [command for command in commands if command.startswith("claude plugin uninstall ") and not command.endswith(" --help")]
    assert uninstalls == [
        "claude plugin uninstall 'sample-arg' -s 'sample-arg' --keep-data --json",
        "claude plugin uninstall 'sample-arg' -s 'sample-arg' --json",
    ], commands
    for command in [*uninstalls, "claude plugin uninstall 'sample-arg' -s 'sample-arg' -y --json"]:
        assert not any(HELPERS._grants(rule, command) for rule in rules), f"a rule grants: {command}"
    _, body = _split()
    assert "No rule in this skill's `allowed-tools` covers `claude plugin uninstall`" in body


def test_the_body_runs_the_script_and_no_pipeline() -> None:
    """Step 3 runs the shortlist script, names its exits 1 and 2, and no jq, pipe or $(...) is left for a rule to miss."""
    _, body = _split()
    assert not re.search(r"\bjq\b", body)
    _, commands = _rules_and_commands()
    assert not any(chain in command for command in commands for chain in HELPERS.CHAINS), commands
    assert "Exit 1:" in body and "Exit 2:" in body


ENTRIES = [
    {"id": "dev-tools@m1", "scope": "user"},
    {"id": "dev-tools@m1", "scope": "user"},
    {"id": "Dev_Tools.Extra@m2", "scope": "synced"},
    {"id": "dev-tools@m3", "scope": "local", "projectPath": "/work/here"},
    {"id": "dev-tools@m3", "scope": "local", "projectPath": "/real/here"},
    {"id": "dev-tools@m4", "scope": "project", "projectPath": "/real/here"},
    {"id": "dev-tools@m5", "scope": "local", "projectPath": "/work/other"},
    {"id": "dev-tools@m6", "scope": "managed"},
    {"id": "dev-tools@m7", "scope": "user", "projectPath": ""},
    {"id": "unrelated@m1", "scope": "user"},
]


def test_the_shortlist_keeps_the_rows_the_jq_filter_kept() -> None:
    """One row per id and scope, the first entry's, sorted; user and synced kept; local and project only for this folder,
    by either path; a missing projectPath shown as -, an empty one kept empty, as `.projectPath // "-"` did."""
    assert SHORTLIST.shortlist(ENTRIES, "Dev Tools", "/work/here", "/real/here") == [
        ("Dev_Tools.Extra@m2", "synced", "-"),
        ("dev-tools@m1", "user", "-"),
        ("dev-tools@m3", "local", "/work/here"),
        ("dev-tools@m4", "project", "/real/here"),
        ("dev-tools@m7", "user", ""),
    ]


def test_the_scope_filter_runs_before_the_cut_at_ten() -> None:
    """Local entries of other folders listed first never take the ten rows from the user entries."""
    others = [{"id": f"aa-tool{n:02d}@m", "scope": "local", "projectPath": f"/elsewhere/{n}"} for n in range(12)]
    users = [{"id": f"zz-tool{n:02d}@m", "scope": "user"} for n in range(12)]
    rows = SHORTLIST.shortlist([*others, *users], "tool", "/work/here", "/real/here")
    assert rows == [(f"zz-tool{n:02d}@m", "user", "-") for n in range(10)]



# cspell:ignore delenv  (pytest's monkeypatch.delenv)
def test_the_current_folder_is_named_both_ways(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Reached through a symlink, the folder is the shell's PWD and its resolved path; a PWD naming another folder, or none, gives the resolved path twice."""
    real = tmp_path / "real"
    real.mkdir()
    link = tmp_path / "link"
    link.symlink_to(real)
    resolved = os.path.realpath(real)
    monkeypatch.chdir(link)
    monkeypatch.setenv("PWD", str(link))
    assert SHORTLIST.current_folder() == (str(link), resolved)
    monkeypatch.setenv("PWD", str(tmp_path))
    assert SHORTLIST.current_folder() == (resolved, resolved)
    monkeypatch.delenv("PWD")
    assert SHORTLIST.current_folder() == (resolved, resolved)



def test_a_project_path_that_resolves_to_this_folder_matches(tmp_path: Path) -> None:
    """A local entry whose projectPath names this folder through a symlink is kept, as one naming another folder is not."""
    real = tmp_path / "real"
    real.mkdir()
    link = tmp_path / "link"
    link.symlink_to(real)
    resolved = os.path.realpath(real)
    entries = [
        {"id": "dev-tools@m1", "scope": "local", "projectPath": str(link)},
        {"id": "dev-tools@m2", "scope": "local", "projectPath": str(tmp_path)},
    ]
    assert SHORTLIST.shortlist(entries, "dev tools", resolved, resolved) == [("dev-tools@m1", "local", str(link))]


def test_a_field_is_escaped_as_jq_tsv_escaped_it() -> None:
    """A tab, a line break, a carriage return or a backslash in a field cannot split or shift a row."""
    assert SHORTLIST.tsv("a\tb\nc\\d\re") == "a\\tb\\nc\\\\d\\re"
    assert SHORTLIST.tsv("/plain/path") == "/plain/path"


def _script(tmp_path: Path, *args: str, path: str) -> subprocess.CompletedProcess[str]:
    """The script run as the skill runs it, python3 -I, in a fresh claude config under tmp_path, with PATH set to `path`."""
    home = tmp_path / "home"
    (home / ".claude").mkdir(parents=True, exist_ok=True)
    env = {"PATH": path, "HOME": str(home), "CLAUDE_CONFIG_DIR": str(home / ".claude"), "DISABLE_AUTOUPDATER": "1"}
    return subprocess.run([sys.executable, "-I", str(SCRIPT), *args], cwd=tmp_path, env=env, stdin=subprocess.DEVNULL,
                          capture_output=True, text=True, timeout=300, check=False)


def test_a_refused_text_exits_2_before_claude_runs(tmp_path: Path) -> None:
    """A text outside the pattern, with no letter or digit, two texts or none exits 2 even with no claude on PATH: the check runs first."""
    empty = tmp_path / "no-bin"
    empty.mkdir()
    for args in (("a;b",), ("$(id)",), ("a'b",), ("a", "b"), (), ("...",), ("-",), (" ",), ("@",), ("/",)):
        run = _script(tmp_path, *args, path=str(empty))
        assert run.returncode == 2, (args, run.stdout, run.stderr)
        assert run.stderr.startswith("refused:") and run.stdout == ""


def test_a_missing_claude_exits_1_with_its_reason(tmp_path: Path) -> None:
    """With no claude on PATH the script exits 1 and says the list did not run."""
    empty = tmp_path / "no-bin"
    empty.mkdir()
    run = _script(tmp_path, "dev tools", path=str(empty))
    assert run.returncode == 1 and run.stdout == ""
    assert run.stderr.startswith("claude plugin list --json did not run:")



def test_output_the_script_cannot_read_exits_1_on_one_line(tmp_path: Path) -> None:
    """A claude that prints something other than the plugin list, or bytes that are not UTF-8, gives exit 1 and one line, not a traceback.

    The real CLI cannot be made to print a broken list, so a stand-in named claude prints one; nothing else is replaced.
    """
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    stand_in = bin_dir / "claude"
    for body in ("echo 'not a plugin list'", "printf '\\377\\376'"):
        stand_in.write_text(f"#!/bin/sh\n{body}\n", encoding="utf-8")
        stand_in.chmod(0o755)
        run = _script(tmp_path, "dev tools", path=f"{bin_dir}:/usr/bin:/bin")
        assert run.returncode == 1 and run.stdout == "", (body, run.stderr)
        assert run.stderr.startswith("claude plugin list --json gave output this script cannot read:"), (body, run.stderr)
        assert len(run.stderr.strip().splitlines()) == 1, (body, run.stderr)



def test_a_claude_that_fails_exits_1_with_its_exit_code(tmp_path: Path) -> None:
    """A claude that exits non-zero gives exit 1 and names its exit code; a stand-in fails, as the real CLI cannot be made to."""
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    stand_in = bin_dir / "claude"
    stand_in.write_text("#!/bin/sh\necho 'no session' >&2\nexit 3\n", encoding="utf-8")
    stand_in.chmod(0o755)
    run = _script(tmp_path, "dev tools", path=f"{bin_dir}:/usr/bin:/bin")
    assert run.returncode == 1 and run.stdout == ""
    assert run.stderr.strip() == "claude plugin list --json exited 3: no session"


def test_installed_rows_are_printed_for_this_folder_only(tmp_path: Path) -> None:
    """With the real CLI: a user install and a local install made through a symlink are both listed from the link and
    from the folder, and only the user install from another folder; each row is id, scope and projectPath or -."""
    if shutil.which("claude") is None:
        pytest.fail("the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run these tests")
    install = _module(ROOT / "tests" / "test_install_mod_skill.py", "_install_mod_skill")
    folder = install._marketplace(tmp_path / "mkt", "probe-mkt", "1.0.0").resolve()
    real = tmp_path / "real"
    real.mkdir()
    link = tmp_path / "link"
    link.symlink_to(real)
    home = tmp_path / "home"
    (home / ".claude").mkdir(parents=True)
    env = {"PATH": os.environ["PATH"], "HOME": str(home), "CLAUDE_CONFIG_DIR": str(home / ".claude"), "DISABLE_AUTOUPDATER": "1"}

    def run(args: list[str], folder_now: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(args, cwd=folder_now, env={**env, "PWD": str(folder_now)}, stdin=subprocess.DEVNULL,
                              capture_output=True, text=True, timeout=300, check=False)

    for args, where in (
        (["claude", "plugin", "install", "probe-plugin", "--marketplace", str(folder), "--json"], tmp_path),
        (["claude", "plugin", "install", "probe-plugin@probe-mkt", "-s", "local", "--json"], link),
    ):
        done = run(args, where)
        assert done.returncode == 0, done.stdout + done.stderr
    resolved = os.path.realpath(real)
    both = f"probe-plugin@probe-mkt\tlocal\t{resolved}\nprobe-plugin@probe-mkt\tuser\t-\n"
    for where, expected in ((link, both), (real, both), (tmp_path, "probe-plugin@probe-mkt\tuser\t-\n")):
        listed = run([sys.executable, "-I", str(SCRIPT), "probe plugin"], where)
        assert (listed.returncode, listed.stdout) == (0, expected), (where, listed.stdout, listed.stderr)


def test_a_fresh_config_lists_no_candidate(tmp_path: Path) -> None:
    """With the real claude CLI and no plugin installed, the script prints no row and exits 0."""
    if shutil.which("claude") is None:
        pytest.fail("the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run these tests")
    run = _script(tmp_path, "dev tools", path=os.environ["PATH"])
    assert run.returncode == 0, run.stderr
    assert run.stdout == ""
