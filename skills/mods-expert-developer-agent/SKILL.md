---
name: mods-expert-developer-agent
description: "Use when the user types /mods-expert-developer-agent followed by a prompt, to have the mods expert developer agent design, build, fix or review a Claude Code mod. Starts that agent with the prompt unchanged, relays its questions and the user's answers, and shows its report."
user-invocable: true
disable-model-invocation: true
---

# MODS EXPERT DEVELOPER AGENT LAUNCHER

## Overview

This skill starts the `mods-expert-developer-plugin:mods-expert-developer-agent` subagent with the text the user typed after the command, unchanged. The agent runs in the background. This session relays the agent's questions to the user, sends the answers back to the agent, and shows the agent's final report. The agent is a subagent, not a skill: the same agent starts when the user types `@agent-mods-expert-developer-plugin:mods-expert-developer-agent <prompt>`. Only the user starts this skill. It sets `disable-model-invocation: true`, so neither Claude nor the agent can call it and start a second copy of the agent.

The full name of the command is `/mods-expert-developer-plugin:mods-expert-developer-agent <prompt>`.

## Prerequisites

- `mods-expert-developer-plugin` is enabled in this session, so the subagent type `mods-expert-developer-plugin:mods-expert-developer-agent` resolves.
- The Agent and SendMessage tools are available in this session. AskUserQuestion is optional.

## Instructions

These steps stay in force for every later turn of this conversation, until the agent's final report has been shown.

1. The user's request is the text inside this fence, exactly as typed:

   ``````````text
   $ARGUMENTS
   ``````````

   The fence is ten backticks long, so a request that holds a shorter run of backticks stays inside it. When the fence is empty, because nothing followed the command, ask the user what the agent should do, and use the reply as the request.

2. Start the agent with the Agent tool, never with the Skill tool: the agent is a subagent, and loading this skill again would start nothing. Pass these parameters:
   - `subagent_type`: `mods-expert-developer-plugin:mods-expert-developer-agent`
   - `run_in_background`: `true`, when the Agent tool offers that parameter. When it does not, pass nothing for it: Claude Code runs a subagent in the background by default, unless background tasks are turned off (`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` set to `1`) or an in-process teammate starts it (the subagents chapter, section Run subagents in foreground or background, in the chapter skill `mods-doc-subagents-reference`).
   - `description`: a few words that name the task.
   - `prompt`: the line `Request from the user, verbatim:`, then the request, unchanged, in a fenced block whose fence is at least four backticks long and one backtick longer than the longest run of backticks in the request, then this rule, word for word, as the last paragraph:

     > Questioning rule: if the request above asks to be questioned first (for example "grill me", "ask me" or "interview me"), reply with only a numbered list under the heading QUESTIONS, and build nothing until the answers arrive. Otherwise ask only when the task cannot be done without the answers, and then reply the same way. You cannot ask the user yourself: the session that started you puts your questions to the user and sends you back each question with its answer.

   Pass no `model` and no `effort`: the agent's own frontmatter sets them. Pass no `name` either: in an interactive session with agent teams enabled, an Agent call with a `name` starts a teammate instead of the subagent (the subagents chapter, section Subagent names, in the chapter skill `mods-doc-subagents-reference`). The result of the Agent call carries the agent's id (its agentId). Keep it: steps 4 and 5 send to it. An id belongs to this launch only, so the answers to one agent cannot reach another, as they could with a shared name: SendMessage delivers to the newest agent holding a name.

3. Right after the Agent call, print this line and end the turn:

   `The mods expert agent is working; its questions or its report will appear here. Next time you can type @agent-mods-expert-developer-plugin:mods-expert-developer-agent <prompt> to start it directly.`

4. When the agent replies with a QUESTIONS list, put each question to the user in the agent's own words.
   - A closed question, one the agent gave 2 to 4 fixed choices for, may go through AskUserQuestion, at most 4 questions per call, with the choices exactly as the agent wrote them. Never invent a choice.
   - When AskUserQuestion returns no answer for a question, because the user dismissed it or it timed out, put that question to the user as plain text instead.
   - Every other question goes to the user as plain text.
   - Only the user's reply to those questions is an answer. Never forward an unrelated message as one.
   - Send the agent each question paired with its answer, both verbatim, with SendMessage to the agent id kept in step 2.

   Repeat this step for every QUESTIONS list, until the agent reports.

5. When a SendMessage to the agent fails or is refused, or the agent id is no longer known, do not send it again on your own and do not start another agent: a failed send may still have been delivered, and the first agent may still be running, so either would do the work twice. Tell the user the agent did not confirm the message, and ask whether to send it again or to start a fresh agent. Start a fresh one only when the user says so, as in step 2: its prompt carries the original request, then every question and answer so far, verbatim.

6. When the agent's final report arrives, show it to the user as it came, without shortening or rewording it.

## Output

- One line when the agent starts, with the `@agent-` form the user can type next time.
- The agent's questions, put to the user, and the user's answers, sent back to the agent.
- The agent's final report, unchanged.

## Error Handling

- The subagent type does not resolve: `mods-expert-developer-plugin` is not enabled in this session. Say so, and start no other agent in its place.
- The Agent call fails: show its error message as it came, and start nothing else.
- The agent reports a failure or a `[BLOCKED]` line: show the report unchanged, like any final report.
- After `/clear` this skill's text is no longer in the conversation, so nothing relays the agent any more: type the command again with the original request.
- A compaction keeps the relay only as far as the compacted conversation keeps these steps and the agent id. When the id is gone, step 5 applies.

## Examples

Input: `/mods-expert-developer-agent build me a mod that shows the cost of each agent turn under its messages. grill me about it to know the details.` The agent starts in the background with that text and the questioning rule. It replies with a QUESTIONS list, each question goes to the user, and each answer goes back to the agent with its question. The agent then builds the mod and its report is shown.

Input: `/mods-expert-developer-agent` with nothing after it. The skill asks what the agent should do, then starts it with the reply.

## Resources

- `mods-expert-developer-plugin:mods-doc-subagents-reference`: the chapter sections Available tools (a subagent has no AskUserQuestion), Subagent names, and Resume subagents (SendMessage resumes a finished subagent with its history).
- For long interactive design work, start the agent as the main session instead: `claude --agent mods-expert-developer-plugin:mods-expert-developer-agent`. There it questions the user directly and can start its own subagents and forks.
