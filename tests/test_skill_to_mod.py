"""Tests of the mods-skill-to-mod skill (TRDD-YNWBA70L): its scripts find their files through CLAUDE_PLUGIN_ROOT alone,
refuse to write under it, and scaffold mods with a switch for every function, a masked debug log and no MCP server.

The scripts run as the skill runs them: `python3 -I <script>` with CLAUDE_PLUGIN_ROOT set to this checkout. The two
verify runs start the real claude CLI with a fresh HOME and config dir, as tests/test_mod_tests.py does, so no login
is used and the developer's own ~/.claude is never touched.
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
import yaml

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "mods-skill-to-mod"
SCRIPTS = SKILL / "scripts"
ENTRY_SCRIPTS = ["check_skill.py", "scaffold_mod.py", "verify_mod.py", "test_check_skill.py"]
GATE_SPEC = {
    "plugin": "release-check-mod",
    "gate": {"match": ["git push", "npm publish"], "mode": "ask"},
    "prime": {"match": ["ship it"]},
}
PRIME_SPEC = {"plugin": "tone-guide-mod", "prime": {"match": ["make it friendlier"]}, "command": {"name": "tone"}}


def _env(root: Path | None, home: Path | None = None) -> dict[str, str]:
    """The environment of a script run: CLAUDE_PLUGIN_ROOT set to `root` (absent when None), no GIT_ variable.

    A session that runs this suite may export CLAUDE_PLUGIN_ROOT itself, so it is always replaced or removed. With
    `home`, the run gets only PATH and a fresh HOME and config dir, so the claude CLI it starts never sees a login.
    """
    if home is not None:
        (home / ".claude").mkdir(parents=True, exist_ok=True)
        env = {"PATH": os.environ["PATH"], "HOME": str(home), "CLAUDE_CONFIG_DIR": str(home / ".claude"), "DISABLE_AUTOUPDATER": "1"}
    else:
        env = {k: v for k, v in os.environ.items() if not k.startswith("GIT_") and k != "CLAUDE_PLUGIN_ROOT"}
    if root is not None:
        env["CLAUDE_PLUGIN_ROOT"] = str(root)
    return env


def _run(script: Path, *args: str, root: Path | None = ROOT, home: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-I", str(script), *args],
        capture_output=True,
        text=True,
        env=_env(root, home),
        timeout=600,
        check=False,
    )


def _skill(folder: Path, name: str, body: str) -> Path:
    """A small source skill in its own folder."""
    path = folder / name
    path.mkdir(parents=True)
    (path / "SKILL.md").write_text(f'---\nname: {name}\ndescription: "{name} skill."\n---\n\n# {name}\n\n{body}\n', encoding="utf-8")
    return path


def _scaffold(tmp_path: Path, spec: dict[str, object]) -> Path:
    """Scaffold a mod from `spec` into tmp_path/out/<plugin> and return the plugin folder."""
    name = str(spec["plugin"]).removesuffix("-mod")
    source = _skill(tmp_path / "skills", name, 'Run the checklist before pushing. When the user says "ship it", run it.')
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps(spec), encoding="utf-8")
    out = tmp_path / "out" / str(spec["plugin"])
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
    assert result.returncode == 0, result.stdout + result.stderr
    return out


def _install_listing() -> list[str]:
    return sorted(p.relative_to(SKILL).as_posix() for p in SKILL.rglob("*"))


@pytest.mark.parametrize("script", ENTRY_SCRIPTS)
def test_each_script_refuses_to_run_without_claude_plugin_root(script: str) -> None:
    """With CLAUDE_PLUGIN_ROOT unset, every entry script exits 2 and says how to run it."""
    result = _run(SCRIPTS / script, root=None)
    assert result.returncode == 2, result.stdout + result.stderr
    assert "error: CLAUDE_PLUGIN_ROOT is not set" in result.stderr
    assert 'CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"' in result.stderr


@pytest.mark.parametrize("script", ENTRY_SCRIPTS)
def test_each_script_refuses_a_root_that_holds_no_skill(script: str, tmp_path: Path) -> None:
    """A CLAUDE_PLUGIN_ROOT with no skills/mods-skill-to-mod/scripts in it is refused, never searched around."""
    result = _run(SCRIPTS / script, root=tmp_path)
    assert result.returncode == 2, result.stdout + result.stderr
    assert "holds no skills/mods-skill-to-mod/scripts/" in result.stderr


def test_a_copy_outside_the_named_install_is_refused(tmp_path: Path) -> None:
    """A copy of the scripts run against this checkout's CLAUDE_PLUGIN_ROOT exits 2 instead of mixing two installs."""
    copy = tmp_path / "scripts"
    shutil.copytree(SCRIPTS, copy)
    result = _run(copy / "check_skill.py", str(SKILL))
    assert result.returncode == 2, result.stdout + result.stderr
    assert "but CLAUDE_PLUGIN_ROOT points at" in result.stderr


def test_the_checker_regression_suite_passes() -> None:
    """The skill's own unittest suite for check_skill.py passes when run as the skill runs it."""
    result = _run(SCRIPTS / "test_check_skill.py")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "OK" in result.stderr


@pytest.mark.parametrize("name", ["mods-install-mod", "mods-tutorial-quickstart"])
def test_the_checker_reads_this_plugins_own_skills(name: str) -> None:
    """check_skill.py gives a verdict on a skill of this plugin and writes no bytecode under the install folder."""
    before = _install_listing()
    result = _run(SCRIPTS / "check_skill.py", str(ROOT / "skills" / name))
    assert result.returncode == 0, result.stdout + result.stderr
    report = json.loads(result.stdout)
    assert report["ok"] is True
    assert report["verdict"] in {"KEEP_SKILL", "HYBRID", "MOD_FIRST"}
    assert str(SKILL / "references" / "suitability.md") in report["note"]
    assert _install_listing() == before


def test_the_scaffold_refuses_an_out_folder_inside_the_install(tmp_path: Path) -> None:
    """--out under CLAUDE_PLUGIN_ROOT is refused before anything is written, because an update replaces that folder."""
    source = _skill(tmp_path, "release-check", "Run the checklist before pushing.")
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps(GATE_SPEC), encoding="utf-8")
    target = ROOT / "skills" / "mods-skill-to-mod" / "release-check-mod"
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(target))
    assert result.returncode != 0
    assert "is inside CLAUDE_PLUGIN_ROOT" in result.stderr
    assert not target.exists()


@pytest.mark.parametrize(
    "name_line",
    ["name: ../x", "name: |\n  victim\n  x", "name: Upper"],
    ids=["path", "two-lines", "uppercase"],
)
def test_the_scaffold_refuses_a_skill_name_that_is_not_one_plain_folder_name(tmp_path: Path, name_line: str) -> None:
    """A skill name that is a path, two lines or not lowercase is refused before anything is written; a sibling folder keeps its file."""
    keep = tmp_path / "keep"
    keep.mkdir()
    (keep / "precious.txt").write_text("keep", encoding="utf-8")
    source = tmp_path / "source"
    source.mkdir()
    (source / "SKILL.md").write_text(f"---\n{name_line}\ndescription: \"skill.\"\n---\n\n# Skill\n\nRun the checklist before pushing.\n", encoding="utf-8")
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps(GATE_SPEC), encoding="utf-8")
    out = tmp_path / "out"
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
    assert result.returncode != 0, result.stdout + result.stderr
    assert "use lowercase letters, digits and hyphens, 1 to 64 characters, first character a letter or digit" in result.stderr
    assert not out.exists()
    assert (keep / "precious.txt").read_text(encoding="utf-8") == "keep"


def test_the_scaffold_refuses_a_skill_with_a_symlink_before_it_writes_anything(tmp_path: Path) -> None:
    """A symlink inside the source skill is refused before the first write, so the private folder it points at is never copied."""
    private = tmp_path / "private"
    private.mkdir()
    (private / "id_fake").write_text("SECRET-CONTENT", encoding="utf-8")
    source = _skill(tmp_path / "skills", "linky", "Run the checklist before pushing.")
    (source / "refs").symlink_to(private, target_is_directory=True)
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps(GATE_SPEC), encoding="utf-8")
    out = tmp_path / "out"
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
    assert result.returncode != 0, result.stdout + result.stderr
    assert str(source / "refs") + " is a symlink" in result.stderr
    assert not out.exists()

@pytest.mark.parametrize(
    ("command", "message"),
    [
        ({"name": "../x"}, "the command name '../x' in the spec: use lowercase letters, digits and hyphens"),
        ({"name": "Upper"}, "the command name 'Upper' in the spec: use lowercase letters, digits and hyphens"),
        (True, "spec.command must be an object"),
        ({"name": 7}, "spec.command.name must be a string"),
    ],
    ids=["path", "uppercase", "not-an-object", "not-a-string"],
)
def test_the_scaffold_refuses_a_command_name_that_is_not_one_plain_name(tmp_path: Path, command: object, message: str) -> None:
    """The command name lands raw in generated code and the README, so a path, capitals or a non-string value is refused before anything is written."""
    source = _skill(tmp_path / "skills", "release-check", "Run the checklist before pushing.")
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps({**GATE_SPEC, "command": command}), encoding="utf-8")
    out = tmp_path / "out"
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
    assert result.returncode != 0, result.stdout + result.stderr
    assert message in result.stderr
    assert not out.exists()


def test_the_scaffold_refuses_a_skill_with_a_folder_it_cannot_list(tmp_path: Path) -> None:
    """A folder the walk cannot list cannot be checked for symlinks, so the scaffold stops before it writes anything."""
    source = _skill(tmp_path / "skills", "locked", "Run the checklist before pushing.")
    locked = source / "refs"
    locked.mkdir()
    locked.chmod(0)
    try:
        if os.access(locked, os.R_OK):
            pytest.skip("this user can read a folder with no permissions (root), so the case cannot be made")
        spec_file = tmp_path / "spec.json"
        spec_file.write_text(json.dumps(GATE_SPEC), encoding="utf-8")
        out = tmp_path / "out"
        result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
        assert result.returncode != 0, result.stdout + result.stderr
        assert str(locked) + " cannot be read, so it cannot be checked for symlinks" in result.stderr
        assert not out.exists()
    finally:
        locked.chmod(0o755)


@pytest.mark.parametrize(
    ("change", "message"),
    [
        ({"mcpServers": {"x": {"command": "x"}}}, "PRRD G10"),
        ({"gate": {"match": ["git push"], "mode": "off"}}, "the gate has its own switch"),
    ],
    ids=["mcp", "mode-off"],
)
def test_the_scaffold_refuses_a_spec_against_the_house_rules(tmp_path: Path, change: dict[str, object], message: str) -> None:
    """A spec that asks for an MCP server, or for the retired gate mode off, is refused and nothing is written."""
    source = _skill(tmp_path, "release-check", "Run the checklist before pushing.")
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps({**GATE_SPEC, **change}), encoding="utf-8")
    out = tmp_path / "out"
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
    assert result.returncode != 0
    assert message in result.stderr
    assert not out.exists()


@pytest.mark.parametrize(
    "change",
    [{"gate": {"match": ["git push", "re:(unclosed"], "mode": "ask"}}, {"prime": {"match": ["ship it", "re:[unclosed"]}}],
    ids=["gate", "prime"],
)
def test_the_scaffold_refuses_a_regular_expression_that_node_cannot_compile(tmp_path: Path, change: dict[str, object]) -> None:
    """Node compiles every regular expression of the spec, read from stdin, and a bad one stops the scaffold before it writes anything."""
    if shutil.which("node") is None:
        pytest.fail("node is not on PATH: the scaffold needs it, install Node.js to run this test")
    source = _skill(tmp_path, "release-check", "Run the checklist before pushing.")
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps({**GATE_SPEC, **change}), encoding="utf-8")
    out = tmp_path / "out"
    result = _run(SCRIPTS / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out))
    assert result.returncode != 0
    assert "a regular expression in the spec does not compile: " in result.stderr
    assert "SyntaxError" in result.stderr, result.stderr
    assert not out.exists()


def test_the_scaffolded_mod_has_a_switch_for_every_function_and_a_masked_debug_log(tmp_path: Path) -> None:
    """The manifest carries a boolean per function, the debug log off by default, and no MCP server; the code masks the log."""
    plugin = _scaffold(tmp_path, GATE_SPEC)
    manifest = json.loads((plugin / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    config = manifest["userConfig"]
    switches = {key for key, field in config.items() if field["type"] == "boolean"}
    assert switches == {"gate", "staleOnEdit", "statusLine", "prime", "command", "debugLog"}
    assert config["debugLog"]["default"] is False
    assert all(config[key]["default"] is True for key in switches - {"debugLog"})
    assert "mcpServers" not in manifest and not (plugin / ".mcp.json").exists()
    code = (plugin / "hooks" / "register.js").read_text(encoding="utf-8")
    assert "redact(text), { to: 'debug' })" in code
    assert (plugin / "skills" / "release-check" / "SKILL.md").is_file()


@pytest.mark.parametrize("spec", [GATE_SPEC, PRIME_SPEC], ids=["gate-and-prime", "prime-only"])
def test_a_scaffolded_mod_passes_the_verify_step(tmp_path: Path, spec: dict[str, object]) -> None:
    """scaffold_mod.py then verify_mod.py: validation, the house rules and every generated test pass; the install folder is untouched."""
    if shutil.which("claude") is None:
        pytest.fail("the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run the verify step")
    before = _install_listing()
    plugin = _scaffold(tmp_path, spec)
    result = _run(SCRIPTS / "verify_mod.py", str(plugin), "--update-readme", home=tmp_path / "home")
    output = result.stdout + result.stderr
    assert result.returncode == 0, output
    assert "[house rules] passed" in output
    assert "RESULT: PASS" in output
    assert "<!-- trust:start -->\n```text\nhooks: ./register.js" in (plugin / "README.md").read_text(encoding="utf-8")
    assert _install_listing() == before


def test_the_verify_step_fails_a_mod_that_declares_an_mcp_server(tmp_path: Path) -> None:
    """A plugin.json with mcpServers fails the house rules (PRRD G10), so the verify step ends in RESULT: FAIL."""
    if shutil.which("claude") is None:
        pytest.fail("the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run the verify step")
    plugin = _scaffold(tmp_path, PRIME_SPEC)
    manifest_file = plugin / ".claude-plugin" / "plugin.json"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    manifest["mcpServers"] = {"x": {"command": "x"}}
    manifest_file.write_text(json.dumps(manifest), encoding="utf-8")
    result = _run(SCRIPTS / "verify_mod.py", str(plugin), home=tmp_path / "home")
    output = result.stdout + result.stderr
    assert result.returncode == 1, output
    assert "[house rules] FAILED" in output
    assert "G10: the plugin declares an MCP server" in output


def test_the_verify_step_refuses_a_plugin_inside_the_install() -> None:
    """A plugin folder under CLAUDE_PLUGIN_ROOT is refused with exit 2 before claude runs, because the test run writes there."""
    example = ROOT / "skills" / "mods-tutorial-call-intercept-mods" / "examples" / "hello-mod"
    assert (example / ".claude-plugin" / "plugin.json").is_file()
    result = _run(SCRIPTS / "verify_mod.py", str(example))
    assert result.returncode == 2, result.stdout + result.stderr
    assert "is inside CLAUDE_PLUGIN_ROOT" in result.stdout


# What a Bash rule in allowed-tools grants, as measured on Claude Code 2.1.317 (2026-11-03, claude -p in dontAsk
# mode with a scratch plugin, one run per variant): the rule is compared with the command as written, so the quotes
# and a leading CLAUDE_PLUGIN_ROOT= assignment must be spelled the same in both (an unquoted rule did not match a
# quoted command, and a rule without the assignment did not match a command with it); a trailing " *" takes the
# arguments; a command chained after the granted one with && was refused. A rule ending in " *" is held here to need
# at least one argument, because a bare command against such a rule was not measured.
# The matcher below models a single probe on Claude Code 2.1.317 in which only && was measured; its other CHAINS
# entries are not verified against Claude Code.
SAMPLE_ROOT = "/opt/claude/plugins/cache/emasoft-plugins/mods-expert-developer-plugin/9.9.9"
SAMPLE_DATA = "/opt/claude/plugins/data/mods-expert-developer-plugin-emasoft-plugins"
CHAINS = ("&&", "||", ";", "|", "`", "$(")


def _substitute(text: str) -> str:
    """The text as Claude Code renders it in a plugin skill: both variables replaced, in the rules and the body alike."""
    return text.replace("${CLAUDE_PLUGIN_ROOT}", SAMPLE_ROOT).replace("${CLAUDE_PLUGIN_DATA}", SAMPLE_DATA)


def _grants(rule: str, command: str) -> bool:
    """Whether one rendered Bash(...) rule lets `command` run without a prompt, per the measurement above."""
    assert rule.startswith("Bash(") and rule.endswith(")"), rule
    pattern = rule[len("Bash(") : -1]
    if any(chain in command for chain in CHAINS):
        return False
    if pattern.endswith(" *"):
        return command.startswith(pattern[:-1])
    return command == pattern


def _skill_grants_and_commands() -> tuple[list[str], list[str]]:
    """(rendered allowed-tools rules, rendered commands the skill tells Claude to run) of mods-skill-to-mod.

    The commands are every line of a ```bash block and every inline code span that starts with
    CLAUDE_PLUGIN_ROOT= and runs python3 (a whole command, not the prefix named in prose) or is `claude --version`;
    each <placeholder> becomes a sample argument.
    """
    text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    end = text.index("\n---\n", 4)
    rules = yaml.safe_load(text[4:end])["allowed-tools"]
    body = text[end + 5 :]
    commands = [line for block in re.findall(r"```bash\n(.*?)```", body, re.S) for line in block.splitlines() if line.strip()]
    spans = re.findall(r"`([^`\n]+)`", re.sub(r"```.*?```", "", body, flags=re.S))
    commands += [span for span in spans if span.startswith("CLAUDE_PLUGIN_ROOT=") and " python3 -I " in span]
    commands += [span for span in spans if span == "claude --version"]
    rendered = [re.sub(r"<[^>]+>", "/tmp/sample-arg", _substitute(command)) for command in commands]
    return [_substitute(rule) for rule in rules], rendered


def test_the_skill_grants_exact_commands_and_no_bare_bash() -> None:
    """allowed-tools is a list of Bash rules, none bare, each python rule naming a script of this skill that exists."""
    text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    rules = yaml.safe_load(text[4 : text.index("\n---\n", 4)])["allowed-tools"]
    assert isinstance(rules, list) and rules, rules
    assert not {"Bash", "Bash(*)", "Bash( *)"} & set(rules)
    scripts = re.compile(r'^Bash\(CLAUDE_PLUGIN_ROOT="\$\{CLAUDE_PLUGIN_ROOT\}" python3 -I "\$\{CLAUDE_PLUGIN_ROOT\}/skills/mods-skill-to-mod/scripts/([a-z_]+\.py)"( \*)?\)$')
    for rule in rules:
        if rule == "Bash(claude --version)":
            continue
        match = scripts.match(rule)
        assert match, f"not a rule for one script of this skill: {rule}"
        assert (SCRIPTS / match.group(1)).is_file(), rule
    assert sorted(scripts.match(rule).group(1) for rule in rules if rule != "Bash(claude --version)") == sorted(ENTRY_SCRIPTS)


def test_every_bash_command_of_the_skill_matches_its_grant() -> None:
    """Each command SKILL.md tells Claude to run is allowed by one of its allowed-tools rules."""
    rules, commands = _skill_grants_and_commands()
    assert len(commands) >= 6, commands  # check, check --text, scaffold, verify, the regression suite, claude --version
    for command in commands:
        assert any(_grants(rule, command) for rule in rules), f"no allowed-tools rule matches: {command}"


@pytest.mark.parametrize("script", ENTRY_SCRIPTS)
def test_each_script_stops_on_a_python_older_than_3_9(script: str) -> None:
    """Under a Python that reports 3.8, every entry script exits 2 with the version it needs, before reading any file."""
    older = "import runpy, sys; script = sys.argv[1]; sys.version_info = (3, 8, 18, 'final', 0); sys.argv = [script]; runpy.run_path(script, run_name='__main__')"
    result = subprocess.run([sys.executable, "-I", "-c", older, str(SCRIPTS / script)], capture_output=True, text=True, env=_env(ROOT), timeout=60, check=False)
    assert result.returncode == 2, result.stdout + result.stderr
    assert "error: the mods-skill-to-mod scripts need Python 3.9 or later" in result.stderr


def test_a_symlinked_install_runs_and_the_scaffold_hint_keeps_the_link(tmp_path: Path) -> None:
    """With CLAUDE_PLUGIN_ROOT naming a symlink to the install, the scripts run (both sides are resolved), and the
    scaffold prints its verify hint with the link as written, so the hint still matches the verify grant of SKILL.md."""
    link = tmp_path / "plugins-link"
    link.symlink_to(ROOT, target_is_directory=True)
    linked_scripts = link / "skills" / "mods-skill-to-mod" / "scripts"
    for script, root in ((linked_scripts / "check_skill.py", link), (SCRIPTS / "check_skill.py", link), (linked_scripts / "check_skill.py", ROOT)):
        result = _run(script, str(SKILL), root=root)
        assert result.returncode == 0, f"{script} with CLAUDE_PLUGIN_ROOT={root}: {result.stdout}{result.stderr}"
    source = _skill(tmp_path / "skills", "release-check", "Run the checklist before pushing.")
    spec_file = tmp_path / "spec.json"
    spec_file.write_text(json.dumps(GATE_SPEC), encoding="utf-8")
    out = tmp_path / "out" / "release-check-mod"
    result = _run(linked_scripts / "scaffold_mod.py", "--skill", str(source), "--spec", str(spec_file), "--out", str(out), root=link)
    assert result.returncode == 0, result.stdout + result.stderr
    hint = next(line.split("next: ", 1)[1] for line in result.stdout.splitlines() if "next: " in line)
    assert hint.startswith(f'CLAUDE_PLUGIN_ROOT="{link}" python3 -I "{link}/skills/mods-skill-to-mod/scripts/verify_mod.py" ')
    text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    rules = yaml.safe_load(text[4 : text.index("\n---\n", 4)])["allowed-tools"]
    assert any(_grants(rule.replace("${CLAUDE_PLUGIN_ROOT}", str(link)), hint) for rule in rules), hint


# A secret of each kind and the debug-log text it must become: a label naming its kind, [REDACTED:<kind>], the style of
# this plugin's debug-log masker, hooks/debug-log/redact.ts (owner ruling of 2026-11-03). Each sample matches one pattern of the template.
# cspell:ignore Nlcjpw xoxb  (pieces of the sample secrets below)
LABELLED = {
    "Bearer abc.def.ghi": "Bearer [REDACTED:bearer-token]",
    "Basic dXNlcjpwYXNzd29yZA==": "Basic [REDACTED:basic-credentials]",
    "api_key=hunter2": "api_key=[REDACTED:assignment]",
    "--password hunter2": "--password [REDACTED:cli-password]",
    # Built from parts so the secret scanner does not read the sample as a live credential (TRDD-5F1FO5WP).
    "https://user:" + "hunter2@example.com": "https://[REDACTED:url-password]@example.com",
    "sk-ant-" + "a" * 20: "[REDACTED:anthropic-key]",
    "sk-" + "b" * 20: "[REDACTED:openai-key]",
    "pk-" + "b" * 20: "[REDACTED:api-key]",
    "ghp_" + "c" * 24: "[REDACTED:github-token]",
    "github_pat_" + "c" * 24: "[REDACTED:github-token]",
    "glpat-" + "d" * 20: "[REDACTED:gitlab-token]",  # cspell:disable-line
    "xoxb-" + "1" * 12: "[REDACTED:slack-token]",
    "AKIA" + "Q" * 16: "[REDACTED:aws-access-key]",
    "f" * 40: "[REDACTED:hex-key]",
    "Zx9" * 14: "[REDACTED:random-string]",
}


def test_the_scaffolded_debug_log_labels_each_secret_by_kind(tmp_path: Path) -> None:
    """The generated redact(), run under node, replaces each sample secret with its [REDACTED:<kind>] label and nothing else."""
    if shutil.which("node") is None:
        pytest.fail("node is not on PATH: the scaffold needs it, install Node.js to run this test")
    code = (_scaffold(tmp_path, GATE_SPEC) / "hooks" / "register.js").read_text(encoding="utf-8")
    block = code[code.index("const SECRETS = [") : code.index("async function debugLog")]
    labels = re.findall(r"\[REDACTED[^\]]*\]", block)
    assert "[REDACTED]" not in code
    assert labels and all(re.fullmatch(r"\[REDACTED:[a-z0-9-]+\]", label) for label in labels), labels
    runner = tmp_path / "redact.js"
    runner.write_text(block + "\nprocess.stdout.write(JSON.stringify(JSON.parse(process.argv[2]).map(redact)))\n", encoding="utf-8")
    result = subprocess.run(["node", str(runner), json.dumps(list(LABELLED))], capture_output=True, text=True, timeout=60, check=False)
    assert result.returncode == 0, result.stderr
    assert dict(zip(LABELLED, json.loads(result.stdout))) == LABELLED


def test_the_readme_introduces_the_skill_and_its_run_form() -> None:
    """README.md names mods-skill-to-mod beside the tool skills and gives the command form its scripts run with."""
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "`mods-skill-to-mod` decides whether an existing skill should become a mod" in readme
    assert 'CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" python3 -I "${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/scripts/<script>.py"' in readme
