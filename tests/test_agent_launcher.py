"""Tests for the mods-expert-developer-agent launcher skill and the expert agent's model and effort (TRDD-MPJTMO51).

The launcher is a user-invocable skill that starts the mods expert agent with the Agent tool. Its behaviour is the
text of its SKILL.md, so these tests pin the lines that make it work: the frontmatter that keeps every agent from
loading it, the single fenced $ARGUMENTS that carries the user's prompt unchanged, the scoped subagent type, and the
relay rules. The agent's own frontmatter carries the model and effort (PRRD G12.1), so the skill passes neither.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
AGENT = ROOT / "agents/mods-expert-developer-agent.md"
LAUNCHER = ROOT / "skills/mods-expert-developer-agent"
README = ROOT / "README.md"
# Every argument placeholder Claude Code substitutes in a skill body: $ARGUMENTS, $ARGUMENTS[N] and $N.
PLACEHOLDER = re.compile(r"(?<!\\)\$(ARGUMENTS|\d)")


def _split(path: Path) -> tuple[dict, str]:
    """(parsed frontmatter, body) of a markdown file."""
    text = path.read_text(encoding="utf-8")
    assert text.startswith("---\n"), f"{path.name} has no frontmatter"
    end = text.index("\n---\n", 4)
    return yaml.safe_load(text[4:end]), text[end + 5 :]


def _agent_type() -> str:
    """The scoped subagent type of the expert agent: the plugin.json name, a colon, the agent's own name field."""
    plugin = json.loads((ROOT / ".claude-plugin/plugin.json").read_text(encoding="utf-8"))["name"]
    fields, _ = _split(AGENT)
    return f"{plugin}:{fields['name']}"


def test_expert_agent_runs_on_opus_5_5_at_xhigh_effort() -> None:
    """PRRD G12.1: the expert agent's frontmatter pins Opus 5.5 by its full model ID and sets xhigh effort."""
    fields, _ = _split(AGENT)
    assert fields["model"] == "claude-opus-5-5"
    assert fields["effort"] == "xhigh"


def test_launcher_frontmatter_keeps_every_agent_from_loading_it() -> None:
    """The user can start the launcher; no model can, so neither Claude nor the agent starts a second copy of the agent."""
    fields, _ = _split(LAUNCHER / "SKILL.md")
    assert fields["name"] == "mods-expert-developer-agent"
    assert fields["user-invocable"] is True
    assert fields["disable-model-invocation"] is True
    # Inline on purpose: a context fork gives the main session no agent to resume, and the agent's own frontmatter
    # sets the model and effort, so the skill overrides neither.
    for key in ("context", "agent", "model", "effort"):
        assert key not in fields, f"the launcher frontmatter sets {key}"
    policy = yaml.safe_load((LAUNCHER / "agents/openai.yaml").read_text(encoding="utf-8"))
    assert policy == {"policy": {"allow_implicit_invocation": False}}


def test_launcher_carries_the_prompt_in_one_fenced_arguments_placeholder() -> None:
    """$ARGUMENTS appears once, alone between two fence lines; no other placeholder would expand inside the prose."""
    _, body = _split(LAUNCHER / "SKILL.md")
    lines = body.split("\n")
    hits = [i for i, line in enumerate(lines) if PLACEHOLDER.search(line)]
    assert len(hits) == 1, f"argument placeholders on body lines {hits}"
    (index,) = hits
    assert lines[index].strip() == "$ARGUMENTS"
    # Ten backticks, so a request holding a shorter run of backticks cannot close the fence early.
    assert lines[index - 1].strip() == "``````````text" and lines[index + 1].strip() == "``````````"


def test_launcher_starts_the_agent_with_the_agent_tool() -> None:
    """The agent starts through the Agent tool, by its scoped type and in the background, with no name, never through the Skill tool."""
    _, body = _split(LAUNCHER / "SKILL.md")
    assert f"- `subagent_type`: `{_agent_type()}`" in body
    # With agent teams on, a named Agent call starts a teammate, so no name is passed and the relay sends to the agent id.
    assert "- `name`:" not in body
    assert "Pass no `name` either: in an interactive session with agent teams enabled, an Agent call with a `name` starts a teammate" in body
    assert "The result of the Agent call carries the agent's id (its agentId). Keep it: steps 4 and 5 send to it." in body
    assert "one backtick longer than the longest run of backticks in the request" in body
    # Not every session's Agent tool lists the parameter; where it is missing, background is already the default.
    assert "- `run_in_background`: `true`, when the Agent tool offers that parameter. When it does not, pass nothing for it" in body
    assert "Start the agent with the Agent tool, never with the Skill tool" in body
    assert "Pass no `model` and no `effort`" in body
    assert f"type @agent-{_agent_type()} <prompt> to start it directly" in body


def test_launcher_cites_the_subagents_chapter_for_background_and_names() -> None:
    """The two Claude Code behaviours step 2 relies on are cited to the subagents chapter, and the chapter still says them."""
    _, body = _split(LAUNCHER / "SKILL.md")
    assert "starts it (the subagents chapter, section Run subagents in foreground or background, in the chapter skill `mods-doc-subagents-reference`)" in body
    assert "starts a teammate instead of the subagent (the subagents chapter, section Subagent names, in the chapter skill `mods-doc-subagents-reference`)" in body
    chapter = (ROOT / "skills/mods-doc-subagents-reference/references/chapter.md").read_text(encoding="utf-8")
    background = chapter.split("##### Run subagents in foreground or background", 1)[1].split("\n##### ", 1)[0]
    assert "Claude runs the subagent in the background by default" in background
    assert "runs the subagent in the background, forks and non-fork subagents alike" in background
    assert "`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`" in background and "teammate spawned the subagent, Claude Code runs it in the foreground" in background
    names = chapter.split("##### Subagent names", 1)[1].split("\n##### ", 1)[0]
    assert "a subagent that Claude spawns from the main conversation with a `name` launches as a teammate instead" in names


def test_launcher_relays_questions_without_inventing_answers() -> None:
    """Questions first only on request, choices only from the agent, answers only from the user, and no resend or fresh agent unless the user asks."""
    _, body = _split(LAUNCHER / "SKILL.md")
    assert "reply with only a numbered list under the heading QUESTIONS, and build nothing until the answers arrive" in body
    assert "Otherwise ask only when the task cannot be done without the answers" in body
    assert "at most 4 questions per call, with the choices exactly as the agent wrote them. Never invent a choice." in body
    assert "Never forward an unrelated message as one." in body
    assert "with SendMessage to the agent id kept in step 2" in body
    assert "because the user dismissed it or it timed out, put that question to the user as plain text instead" in body
    assert "After `/clear` this skill's text is no longer in the conversation" in body
    assert "Start a fresh one only when the user says so, as in step 2" in body and "every question and answer so far, verbatim" in body
    # A failed send may have been delivered and the agent may still run: a resend or a fresh agent would do the work twice.
    assert "do not send it again on your own and do not start another agent" in body


def test_expert_agent_never_loads_its_own_launcher() -> None:
    """The agent body names the launcher as the user's and tells the agent never to load it."""
    _, body = _split(AGENT)
    assert "The skill `mods-expert-developer-plugin:mods-expert-developer-agent` is the user's launcher for this agent" in body
    assert "Never load it: it sets `disable-model-invocation: true`, and you are already the agent it starts." in body


def test_readme_names_the_command_and_recommends_the_main_session_agent() -> None:
    """README gives the command and the @agent- form, and recommends claude --agent for interactive design work."""
    readme = README.read_text(encoding="utf-8")
    assert "type `/mods-expert-developer-agent <prompt>`" in readme
    assert f"`@agent-{_agent_type()} <prompt>`" in readme
    assert f"start the agent as the main session instead, with `claude --agent {_agent_type()}`" in readme
