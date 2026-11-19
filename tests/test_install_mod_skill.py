"""The mods-install-mod skill and the CLI behaviour it is built on (TRDD-4LTNN7OC).

The skill installs through `claude plugin install <plugin> --marketplace <source>` and never runs
`claude plugin marketplace add`, because of what Claude Code 2.1.317 measured in an isolated config
(2026-11-03): the install refuses a marketplace whose name another source already holds and changes
nothing, while `marketplace add` silently points that name at the new source. The CLI tests below pin
those facts, so a CLI that changes them turns this file red before the skill acts on a wrong premise.
Every CLI call runs with a fresh HOME and config dir, so no login is used and the developer's own
~/.claude is never touched.
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "mods-install-mod" / "SKILL.md"


def _claude() -> str:
    """The claude CLI on PATH, or a failure that names how to get it."""
    claude = shutil.which("claude")
    if claude is None:
        pytest.fail("the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run these tests")
    return claude


def _cli(tmp_path: Path, *args: str) -> subprocess.CompletedProcess[str]:
    """Run `claude <args>` in the isolated config under tmp_path/home."""
    home = tmp_path / "home"
    (home / ".claude").mkdir(parents=True, exist_ok=True)
    env = {"PATH": os.environ["PATH"], "HOME": str(home), "CLAUDE_CONFIG_DIR": str(home / ".claude"), "DISABLE_AUTOUPDATER": "1"}
    return subprocess.run([_claude(), *args], env=env, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=300, check=False)


def _result(run: subprocess.CompletedProcess[str]) -> dict:
    """The JSON result: the last line of stdout (plain text lines come before it when a command is shown)."""
    lines = run.stdout.strip().splitlines()
    assert lines, run.stdout + run.stderr
    return json.loads(lines[-1])


def _marketplace(folder: Path, name: str, plugin_version: str) -> Path:
    """A local marketplace named `name` with one plugin, probe-plugin, and one command-source plugin, probe-cmd."""
    plugin = folder / "plugins" / "probe-plugin"
    (plugin / ".claude-plugin").mkdir(parents=True)
    (plugin / ".claude-plugin" / "plugin.json").write_text(json.dumps({"name": "probe-plugin", "version": plugin_version}), encoding="utf-8")
    skill = plugin / "skills" / "hello"
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text("---\nname: hello\ndescription: say hello\n---\nSay hello.\n", encoding="utf-8")
    command_plugin = folder / "command-plugin"
    (command_plugin / ".claude-plugin").mkdir(parents=True)
    (command_plugin / ".claude-plugin" / "plugin.json").write_text(json.dumps({"name": "probe-cmd", "version": "1.0.0"}), encoding="utf-8")
    (folder / ".claude-plugin").mkdir(parents=True)
    catalog = {
        "name": name,
        "owner": {"name": "probe"},
        "plugins": [
            {"name": "probe-plugin", "source": "./plugins/probe-plugin"},
            {"name": "probe-cmd", "source": {"source": "command", "command": f"echo {command_plugin}"}},
        ],
    }
    (folder / ".claude-plugin" / "marketplace.json").write_text(json.dumps(catalog), encoding="utf-8")
    return folder


def _listed(tmp_path: Path) -> dict[str, str]:
    """Marketplace name to path, from `claude plugin marketplace list --json` (local entries only)."""
    run = _cli(tmp_path, "plugin", "marketplace", "list", "--json")
    assert run.returncode == 0, run.stdout + run.stderr
    return {entry["name"]: entry["path"] for entry in json.loads(run.stdout)}


def _body() -> str:
    """SKILL.md after its frontmatter."""
    text = SKILL.read_text(encoding="utf-8")
    return text[text.index("\n---\n", 4) + 5 :]


def test_install_with_marketplace_refuses_a_name_another_source_holds(tmp_path: Path) -> None:
    """With a marketplace added from folder A, installing with --marketplace folder B of the same name fails with name_taken and changes nothing."""
    first = _marketplace(tmp_path / "a", "probe-mkt", "1.0.0").resolve()
    second = _marketplace(tmp_path / "b", "probe-mkt", "2.0.0").resolve()
    assert _cli(tmp_path, "plugin", "marketplace", "add", str(first), "--json").returncode == 0
    run = _cli(tmp_path, "plugin", "install", "probe-plugin", "--marketplace", str(second), "--json")
    assert run.returncode == 1, run.stdout + run.stderr
    assert _result(run)["failureCode"] == "name_taken"
    assert _listed(tmp_path) == {"probe-mkt": str(first)}


def test_install_with_marketplace_adds_a_new_one_and_reuses_the_same_source(tmp_path: Path) -> None:
    """--marketplace adds a marketplace not added yet, and a second install from the same folder reuses it."""
    folder = _marketplace(tmp_path / "a", "probe-mkt", "1.0.0").resolve()
    run = _cli(tmp_path, "plugin", "install", "probe-plugin", "--marketplace", str(folder), "--json")
    assert run.returncode == 0, run.stdout + run.stderr
    assert _result(run)["pluginId"] == "probe-plugin@probe-mkt"
    again = _cli(tmp_path, "plugin", "install", "probe-plugin", "--marketplace", str(folder), "--json")
    assert again.returncode == 0, again.stdout + again.stderr
    assert _listed(tmp_path) == {"probe-mkt": str(folder)}


def test_a_symlink_or_the_catalog_file_is_a_different_source(tmp_path: Path) -> None:
    """A link to an added folder, or its marketplace.json, gives name_taken: why the skill passes the real folder path."""
    folder = _marketplace(tmp_path / "a", "probe-mkt", "1.0.0").resolve()
    link = tmp_path / "link"
    link.symlink_to(folder, target_is_directory=True)
    assert _cli(tmp_path, "plugin", "marketplace", "add", str(folder), "--json").returncode == 0
    for source in (link, folder / ".claude-plugin" / "marketplace.json"):
        run = _cli(tmp_path, "plugin", "install", "probe-plugin", "--marketplace", str(source), "--json")
        assert run.returncode == 1, run.stdout + run.stderr
        assert _result(run)["failureCode"] == "name_taken", source


def test_a_declared_command_is_shown_then_accepted_by_plugin_id(tmp_path: Path) -> None:
    """Without -y, --marketplace --json shows the command with its sha256 and installs nothing; -y before the id then installs it."""
    folder = _marketplace(tmp_path / "a", "probe-mkt", "1.0.0").resolve()
    run = _cli(tmp_path, "plugin", "install", "probe-cmd", "--marketplace", str(folder), "--json")
    assert run.returncode == 1, run.stdout + run.stderr
    shown = _result(run)["shownCommand"]
    assert shown["pluginId"] == "probe-cmd@probe-mkt"
    assert len(shown["sha256"]) == 64
    accepted = _cli(tmp_path, "plugin", "install", "-y", shown["pluginId"], "--json")
    assert accepted.returncode == 0, accepted.stdout + accepted.stderr
    assert _result(accepted)["outcome"] == "ok"


def test_marketplace_add_repoints_a_name_another_source_holds(tmp_path: Path) -> None:
    """`marketplace add` of folder B points the name held by folder A at B and exits 0: why the skill never runs it."""
    first = _marketplace(tmp_path / "a", "probe-mkt", "1.0.0").resolve()
    second = _marketplace(tmp_path / "b", "probe-mkt", "2.0.0").resolve()
    assert _cli(tmp_path, "plugin", "marketplace", "add", str(first), "--json").returncode == 0
    run = _cli(tmp_path, "plugin", "marketplace", "add", str(second), "--json")
    assert run.returncode == 0, run.stdout + run.stderr
    assert _listed(tmp_path) == {"probe-mkt": str(second)}


def test_the_skill_installs_through_marketplace_and_never_adds_one() -> None:
    """The body installs with --marketplace, stops on name_taken, and runs neither marketplace add nor the full available list."""
    body = _body()
    assert "claude plugin install '<plugin>' --marketplace '<source>' --json" in body
    assert "`\"failureCode\":\"name_taken\"`" in body
    assert "Do not remove, replace or update that marketplace" in body
    assert "claude plugin install -y '<pluginId>' --json" in body
    assert not re.search(r"`claude plugin marketplace add [^`]", body), "the skill must not run marketplace add with a source"
    assert body.count("`claude plugin list --available") == body.count("Do not run `claude plugin list --available")
    assert "realpath '<path>'" in body


def test_the_skill_keeps_model_invocation() -> None:
    """The owner ruled (2026-11-03) that the skill stays invocable by the model and by the user."""
    text = SKILL.read_text(encoding="utf-8")
    fields = yaml.safe_load(text[4 : text.index("\n---\n", 4)])
    assert fields["user-invocable"] is True
    assert "disable-model-invocation" not in fields


# Part 2 of TRDD-4LTNN7OC: allowed-tools names exact rules instead of a bare Bash. The rules are read with the matcher
# of tests/test_skill_to_mod.py, which holds what Claude Code 2.1.317 measured about Bash rules.
def _grants_matcher():
    """The _grants function of tests/test_skill_to_mod.py, loaded without collecting its tests."""
    spec = importlib.util.spec_from_file_location("_skill_to_mod", ROOT / "tests" / "test_skill_to_mod.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._grants


def _rules_and_spans() -> tuple[list[str], list[str]]:
    """(the Bash rules of allowed-tools, every inline code span of the body with each <placeholder> as a sample word)."""
    text = SKILL.read_text(encoding="utf-8")
    fields = yaml.safe_load(text[4 : text.index("\n---\n", 4)])
    tools = [tool.strip() for tool in fields["allowed-tools"].split(",")]
    assert "Bash" not in tools, "a bare Bash grant allows every command, -y included"
    assert "mcp__mods-expert-developer-plugin__run" in tools
    spans = [re.sub(r"<[^>]+>", "sample-arg", span) for span in re.findall(r"`([^`\n]+)`", _body())]
    return [tool for tool in tools if tool.startswith("Bash(")], spans


def test_each_read_only_command_of_the_skill_is_granted() -> None:
    """The list, printenv, realpath and test commands the body runs match a rule, a chained one does not, and a marketplace update matches none."""
    grants = _grants_matcher()
    rules, spans = _rules_and_spans()
    commands = [span for span in spans if span.startswith(("claude plugin marketplace list", "printenv ", "realpath ", "test -f "))]
    assert len(commands) >= 4, commands
    for command in commands:
        assert any(grants(rule, command) for rule in rules), f"no allowed-tools rule matches: {command}"
    assert not any(grants(rule, "claude plugin marketplace list --json && rm -rf /tmp/sample-arg") for rule in rules)
    # An update fetches the marketplace and rewrites its local copy, so it is not read-only and must ask.
    updates = [span for span in spans if span.startswith("claude plugin marketplace update")]
    assert updates, spans
    for command in updates:
        assert not any(grants(rule, command) for rule in rules), f"a rule grants: {command}"


def test_no_rule_grants_an_install() -> None:
    """Every install the body runs, the -y one included, and an install with -y added after the plugin, needs a prompt."""
    grants = _grants_matcher()
    rules, spans = _rules_and_spans()
    installs = [span for span in spans if span.startswith("claude plugin install ")]
    assert "claude plugin install -y 'sample-arg' --json" in installs
    for command in [*installs, "claude plugin install 'sample-arg' -y --json"]:
        assert not any(grants(rule, command) for rule in rules), f"a rule grants: {command}"
    assert not any(rule.startswith("Bash(claude plugin install") for rule in rules)


def test_install_takes_y_and_an_extra_word_after_the_plugin(tmp_path: Path) -> None:
    """`install <id> extra-word -y --json` runs and installs: why no wildcard rule may grant `claude plugin install`."""
    folder = _marketplace(tmp_path / "a", "probe-mkt", "1.0.0").resolve()
    assert _cli(tmp_path, "plugin", "marketplace", "add", str(folder), "--json").returncode == 0
    run = _cli(tmp_path, "plugin", "install", "probe-cmd@probe-mkt", "extra-word", "-y", "--json")
    assert run.returncode == 0, run.stdout + run.stderr
    assert _result(run)["outcome"] == "ok"


def test_the_first_step_checks_the_claude_version_and_its_grant_allows_it() -> None:
    """Step 1 runs claude --version and stops below 2.1.317, the version the refusal was measured on, and allowed-tools grants exactly that command."""
    grants = _grants_matcher()
    rules, _ = _rules_and_spans()
    instructions = _body().split("## Instructions", 1)[1]
    # Read step 1 as its own line, so a missing step 2 cannot stretch the slice over the whole body.
    step_one = re.search(r"^1\. (.+)$", instructions, re.MULTILINE)
    assert step_one is not None, instructions[:200]
    assert re.search(r"^2\. Read the request\.", instructions, re.MULTILINE) is not None
    assert "`claude --version`" in step_one.group(1)
    assert "below 2.1.317" in step_one.group(1)
    assert "older than 2.1.317" in step_one.group(1)
    # The prerequisites name the same floor as step 1, so the two cannot drift apart.
    assert "version 2.1.317 or later" in _body()
    assert step_one.group(1).endswith("and stop.")
    assert any(grants(rule, "claude --version") for rule in rules)


def test_each_command_runs_when_allowed_a_refused_one_is_handed_back_and_a_tilde_reads_one_way() -> None:
    """Steps 5 and 6 run wherever the permission mode, the user's rules or the user's answer allow; a refused command returns it and the rest; a question the skill cannot ask is returned with the rest; ~ and ~/ expand, ~user is refused."""
    body = _body()
    instructions = body.split("## Instructions", 1)[1]
    rule = instructions.split("\n1. ", 1)[0]
    # Owner question 11, answered "Yes, when allowed" (2026-11-04): an install runs inside a subagent, a fork included,
    # when the permission mode or the user's rules allow it. This replaces the default of 0aca0e2 and aeb46f4, under
    # which every subagent, every fork and a main session without AskUserQuestion changed nothing and handed each
    # install back.
    assert rule.strip().startswith("Each command of step 5 and step 6 runs when the permission mode, the user's rules or the user's answer to a permission prompt allows it, in the main session and inside a subagent alike; a fork is a subagent too")
    assert "the skill changes nothing and hands the work back" not in rule
    # The option the owner chose said "under bypassPermissions no human sees the install". The skill names every case
    # where nothing asks, and keeps the reason the old rule gave for caution.
    assert "Under `bypassPermissions`, in auto mode when its classifier allows a command, and where the user's rules allow it, nothing is asked, so an install can run without the user seeing it" in rule
    assert "in a subagent the request comes from the model that started it and an install puts in place code that runs from the next load" in rule
    # A question needs AskUserQuestion, which per the subagents chapter every subagent but a fork lacks; in dontAsk mode
    # it is listed but denied, so a denied or unanswered question is returned too.
    assert "Where a step would ask the user and the AskUserQuestion tool is not available to you, or the question is denied or gets no answer, the skill stops there, runs no further command, and returns the question" in rule
    assert "Claude Code removes that tool from every subagent except a fork, which keeps the main conversation's tools (the subagents chapter, section Available tools, in the chapter skill `mods-doc-subagents-reference`)" in rule
    assert "Inside a subagent" not in rule and "So " not in rule
    # A refused command is handed back with every command after it, step 6's included, then the step-7 reload.
    assert re.search(r"When a command is refused, the skill does not try it another way: it stops and returns that command and every command that remains, in order, exactly as step 5 and step 6 would run them \(the real path of step 4, the single quotes of step 3\), then `/reload-plugins --force`, the reload of step 7, for the user to type once those commands have run\.", rule)
    # A question met after a command ran (a shown command, after step 5 added the marketplace) must not strand a
    # half-done install: the rest comes back with it, the -y install only for the user who read and accepted the command.
    assert "A question returned after a command has run comes with the same hand-back of the commands that remain; for a shown command, that is `claude plugin install -y '<pluginId>' --json`, for the user to run only after reading the `shownCommand` and its `sha256` exactly as the JSON gives them and accepting it." in rule
    # One source for reading a result: the hand-back returns step 6 itself, so the rule restates none of its cases.
    assert "the text of step 6 word for word" in rule
    step_six = re.search(r"^6\. Read the result\..*?(?=^7\. )", instructions, re.MULTILINE | re.DOTALL)
    assert step_six is not None and "name_taken" in step_six.group(0) and "sha256" in step_six.group(0)
    assert "name_taken" not in rule and "not_found" not in rule
    # A user typing the commands by hand stops at a failure step 6 does not handle (not_found gets one update and one
    # retry there), and must not answer name_taken with marketplace add.
    assert "stop at the first command that exits non-zero unless step 6 says what to do with that result, and never run `claude plugin marketplace add`" in rule
    # What the run tool does when a subagent calls it has not been measured, so a subagent that ran a command returns
    # the reload line for the user instead, as d95df76 did, and only once.
    assert "When you run as a subagent and ran any command of step 5 or step 6, in place of step 7 the skill ends its result with `/reload-plugins --force`, the reload of step 7, for the user to type once every command has run, unless a hand-back already ends with it." in rule
    step_seven = re.search(r"^7\. (.+)$", instructions, re.MULTILINE)
    assert step_seven is not None
    assert "`command` set to `reload-plugins` and `args` set to `--force`" in step_seven.group(1)
    # A prompt is not always asked: bypassPermissions, auto and dontAsk modes decide without one.
    assert "Claude Code asks for permission" not in body and "is denied, not shown" not in body
    assert "no user can be asked" not in body and "Wherever a step says to ask the user" not in body
    # Output and Error Handling name the subagent reload line and the hand-back too, so a reader of either section
    # finds them.
    assert "or, from a subagent that ran a command, the `/reload-plugins --force` line for the user;" in body.split("## Output", 1)[1]
    assert "- A command is refused, or a question cannot be asked: stop, run no further command, and hand back what remains, as the rule at the head of the Instructions says." in body.split("## Error Handling", 1)[1]
    assert "Replace a path that is `~` alone with the home folder" in body
    assert "refuse a path that starts with `~` followed by anything other than `/`." in body


def test_the_hand_back_cites_steps_3_to_7_by_their_titles() -> None:
    """Every step number the skill cites names the step it means, the hand-back rule's 3 to 7 included, so a renumbering cannot point anyone at the wrong step."""
    body = _body()
    instructions = body.split("## Instructions", 1)[1]
    rule = instructions.split("\n1. ", 1)[0]
    titles = {
        1: "Check the Claude Code version.",
        2: "Read the request.",
        3: "Check every value before any command runs.",
        4: "Resolve a local path before it is used.",
        5: "Install, by the form of the request.",
        6: "Read the result.",
        7: "Reload, as the last step of the turn.",
    }
    # The rule cites exactly 3 to 7 (orchestrator review, 2026-11-04); every other citation in the body, in the
    # prerequisites, step 6, Output and Error Handling, must name a step of this map, so a new one is checked like these.
    cited = {int(number) for number in re.findall(r"\bstep (\d+)\b", rule)}
    assert cited == {3, 4, 5, 6, 7}, cited
    cited_anywhere = {int(number) for number in re.findall(r"\bstep (\d+)\b", body, re.IGNORECASE)}
    assert cited_anywhere <= set(titles), cited_anywhere
    for number, title in titles.items():
        assert re.search(rf"^{number}\. {re.escape(title)}", instructions, re.MULTILINE), number


def test_the_cited_chapter_removes_ask_user_question_from_every_subagent_but_a_fork() -> None:
    """The rule's condition rests on the subagents chapter it cites: AskUserQuestion is filtered out of subagents, and forks keep the main tools."""
    chapter = (ROOT / "skills" / "mods-doc-subagents-reference" / "references" / "chapter.md").read_text(encoding="utf-8")
    section = chapter.split("###### Available tools", 1)[1].split("\n###### ", 1)[0]
    assert "\n* `AskUserQuestion`\n" in section
    assert "[Forks](https://code.claude.com/docs/en/sub-agents#fork-the-current-conversation) skip both filters and receive the main conversation's exact tool pool" in section


def test_step_six_can_be_followed_by_the_person_who_types_the_commands() -> None:
    """The hand-back returns step 6 word for word, so step 6 says what to do with each result to whoever runs the commands."""
    instructions = _body().split("## Instructions", 1)[1]
    step_six = re.search(r"^6\. Read the result\..*?(?=^7\. )", instructions, re.MULTILINE | re.DOTALL)
    assert step_six is not None
    text = step_six.group(0)
    assert "This step is written for whoever runs the commands: the skill, or the user who types the commands that the skill returned." in text
    # Each pattern is also said in words, and the user, not the skill, decides on a shown command.
    assert "made only of letters, digits, `.`, `_` and `-`" in text
    assert "The user reads that command and its `sha256` exactly as the JSON gives them, and decides whether it runs" in text
    assert "Check its `pluginId` against" not in text and "refuse otherwise" not in text
    # A marketplace update that fails still stops with nothing installed: M1 review finding 5 was refuted on this line.
    assert "If a marketplace update exits non-zero, stop and report its JSON result verbatim, and install nothing." in text
    # A denied or unanswered question is a no: in dontAsk mode AskUserQuestion is listed but auto-denied (subagents chapter,
    # Permission modes), so a missing answer must never let the shown command run.
    assert "When the user declines, or the question is denied or gets no answer, stop and install nothing." in text
