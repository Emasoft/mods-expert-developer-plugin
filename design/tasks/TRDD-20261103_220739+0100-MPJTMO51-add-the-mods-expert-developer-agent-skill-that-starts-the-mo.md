---
trdd-id: MPJTMO51
title: Add the mods-expert-developer-agent skill that starts the mods expert agent from a slash command
column: todo
status: tasked
created: 2026-11-03T22:07:39+0100
updated: 2026-11-04T04:39:07+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T22:07:39+0100
relevant-rules: [12, 13]
npt: [4Z36WCEV]
---

# Add the mods-expert-developer-agent skill that starts the mods expert agent from a slash command

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

CURRENT STATE 2026-11-03: designed, not built. NEXT ACTION: build after the skill-to-mod follow-ups in the release clone are committed.
## Spec: the /mods-expert-developer-agent skill (for the TRDD card and the build)

Owner request (2026-11-03, verbatim): "i currently cannot found a way to launch the mods expert developer agent from claude prompt. there should be an agent shown with /mods-expert-developer-agent . but there is not. how do i ask it to build a mod? I need to beable to spawn the agent like this: `/mods-expert-developer-agent <prompt>`, for example: `/mods-expert-developer-agent build me a mod that will show the costs of each agent turn under his messages. grill me about it to know the details.` fix this."

Rationale: agents never appear in the `/` list (inferred: the docs place them in the `@` typeahead and /agents, no line says they are in `/`), so the plugin needs a user-invocable skill that hands the prompt to the agent.

Verified facts (release clone R=<code-root>/mods-expert-developer-release):
- AskUserQuestion is removed from every subagent: skills/mods-doc-subagents-reference/references/chapter.md:447. The main session must relay questions.
- A finished subagent resumes with SendMessage and keeps its history (same chapter 1104, 1110, 1122); a `name` on the Agent call makes it addressable by name (944).
- $ARGUMENTS expands to the full text as typed; $0 splits shell-style (skills chapter 510).
- Agent frontmatter supports model and effort (subagents chapter 403, 436). agents/mods-expert-developer-agent.md sets neither today.
- Background subagents keep Agent per the first filter (chapter 455); unverified live.

Two increments, two commits:

A. G12 model and effort in the agent's own frontmatter (part of TRDD-4Z36WCEV): add `model: opus` and `effort: xhigh` to agents/mods-expert-developer-agent.md, so the slash route, the @-mention and `claude --agent` all run the same. One source; the skill passes no model or effort. Cite PRRD G12.1.

B. The skill, skills/mods-expert-developer-agent/:
- SKILL.md frontmatter: name mods-expert-developer-agent, user-invocable: true, disable-model-invocation: true (so neither Claude nor the agent can call it and spawn itself), inline (no context: fork: a skill fork gives the main session no id to resume). agents/openai.yaml with allow_implicit_invocation: false.
- Body:
  1. No arguments: ask the user what the agent should do.
  2. Use the Agent tool (never the Skill tool) with subagent_type mods-expert-developer-plugin:mods-expert-developer-agent, a name, run_in_background true. The prompt is the user's text inside a fence, unchanged, then one appended rule: if the text asks to be questioned ("grill me" and the like), return only a numbered QUESTIONS list first and build nothing until the answers arrive; otherwise, ask only if the task cannot be done without answers.
  3. Print one line on spawn: the agent is working; its questions or report will appear here.
  4. Questions: put them to the user in the agent's own words. Closed questions may use AskUserQuestion (at most 4 per call, options taken from the agent, none invented); open questions go as plain text. Only the user's reply to those questions is an answer; never forward an unrelated message. Send back each question paired with its answer, verbatim, via SendMessage to the same agent. Repeat until the agent reports.
  5. Lost agent (after /clear, a compaction, or a failed resume): spawn a fresh one with the original request plus every question and answer so far, verbatim, and tell the user.
  6. Relay the agent's final report.
- Not questioning by default: the agent decides, or the user asks for it.
- G13.1 does not apply: this is a skill, not a mod function. State it on the card in one line.
- README: one line for the command, and recommend `claude --agent mods-expert-developer-plugin:mods-expert-developer-agent` for interactive design work (the agent runs as the main session there: it questions the user directly and spawns its own subagents and forks; as a subagent it may hit the depth limit).

Files the build must touch (measured):
- tests/test_plugin_structure.py: SKILL_DIRS count 70 -> 71 (:125); add the skill to PLUGIN_TOOL_SKILLS (sets at :33-52; user-invocable check at :163 accepts only DRAFTS or PLUGIN_TOOL skills).
- tests/test_skills_menu.py: the same set edit (:216-235); menu entry under "Plugin Skills", not "Standalone Skills" (:1002).
- skills/mods-the-skills-menu/SKILL.md (around :239) and references/skills-catalog.md (around :921-939).
- agents/mods-expert-developer-agent.md (around :156, where it routes the install and uninstall skills).
- README.md, CHANGELOG.md.
- A new test asserting the frontmatter (including disable-model-invocation), the fenced $ARGUMENTS, the scoped subagent_type, "never the Skill tool", and that no model or effort is set in the skill.

Real test: a live probe with the plugin's probe tool. Step `/mods-expert-developer-agent reply with the single word ok`: the transcript must show an Agent call with that subagent_type, not a Skill call, and the arguments in its prompt. Second step with a "grill me" prompt: a QUESTIONS list comes back. The last probes returned "no transcript was written": check the probe harness first. The live probe also settles whether a skill may share the agent's name (no doc line says) and whether bare /mods-expert-developer-agent resolves. Desktop: unverified until live-checked; say so on the card.

Ordering: build only after the skill-to-mod follow-ups worker reports (it edits README and .cspell.json in the release clone). Add this card to the 0.6.4 hold lines on TRDD-YNWBA70L and TRDD-R2QYIN8O. Merge back to dev main after 0.6.4. (was 0.6.3; superseded 2026-11-03 by the owner's ruling)
Owner answer to the launcher question = "Skill launcher (Recommended)".
Owner messages, quoted byte for byte: "its an agent, not a skill" and "yes i forgot that the right way to invoke agents is with @ not / . but a skill to launch it would be useful for those users that don't know the syntax and forgot to use `@mods-expert-developer-plugin:mods-expert-developer-agent <prompt>`, as explained here: `https://code.claude.com/docs/en/sub-agents#invoke-subagents-explicitly`".
Design line: on spawn the skill also prints the typed mention form @agent-mods-expert-developer-plugin:mods-expert-developer-agent <prompt> (skills/mods-doc-subagents-reference/references/chapter.md:868: the manual form needs the agent- prefix), so the user learns the shortcut.
2026-11-03 owner ruling, verbatim: "and we only ship 0.6.4". No 0.6.3 is published: one release, 0.6.4, carries everything this card and the other release-hold cards list. Every earlier 0.6.3 on this card now reads 0.6.4.
2026-11-04, mods expert, M1: the build is committed as built as 4e9f8bf on feat/agent-launcher (worktree mods-expert-developer-wt-launcher, off fe753c8), review fixes 7fef8b6: each launch names its agent "mods-expert-" plus a few words of the task, because SendMessage delivers to the newest agent holding a name and a fixed name would send one launch's answers to another; recovery after /clear is no longer claimed, because /clear removes the skill's text. Increment A pins model claude-opus-5-5, not the opus alias this card names, per TRDD-4Z36WCEV, which names the full model ID: PRRD G12.1 requires Opus 5.5, and the opus alias can move to a newer Opus. Not merged into the release line yet. Not verified live: the answer round trip, the AskUserQuestion path, recovery, the subagent's effective model and effort, Desktop, and whether the literal @agent- text in the skill causes the injected agent-mention note.
2026-11-04, mods expert: checked the reason for the full model ID. PRRD G12.1 says the agent runs on Opus 5.5 at xhigh effort, and the models-configuration chapter says the opus alias resolves to the newest Opus on the Anthropic API and to an earlier one on some other providers, so the alias alone does not hold Opus 5.5.
2026-11-04, mods expert, correction of the two lines above: the first reason (the opus alias follows the Opus the parent runs) was right for a subagent, and ea8d708 replaced it on a review fork's wrong claim. The subagents chapter (lines 382-384) says that a family alias such as opus in a subagent's frontmatter resolves to the main conversation's exact model when that model is in the same family; the models-configuration lines cited in 0782153 describe the alias in the main session. Both reasons hold, each in its own case: when the parent runs an Opus, model: opus runs the agent on that exact Opus; otherwise the alias resolves to the version it points to, the newest Opus on the Anthropic API (models chapter lines 54-60), which can move past 5.5. Either way only claude-opus-5-5 holds the agent on Opus 5.5 (PRRD G12.1); ea8d708 was wrong only to call the first reason false. The launcher no longer passes a name to the Agent tool (c84c8e4): the tool in some sessions has no name field.
2026-11-04, mods expert, M2: the launcher passes no name (c84c8e4, reason corrected in d95df76: with agent teams on, a named Agent call from the main conversation starts a teammate) and relays to the agentId the Agent result returns; run_in_background is passed only where the Agent tool lists it (d95df76); the request fence is ten backticks; step 5 neither resends nor starts a fresh agent without the user (0aca0e2, committed under TRDD-4LTNN7OC, belongs to this card). Measured in the mods expert session: a SendMessage to an unnamed subagent's agentId resumed it. Not measured from a main session.
2026-11-04, mods expert (second M2 agent): release clone (main) 5ed17a6. Step 2 cites the subagents chapter for its two claims (section Run subagents in foreground or background: background by default, except with CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1 or a subagent an in-process teammate starts; section Subagent names: with agent teams on, a named call from the main conversation starts a teammate), and a test checks the chapter still says both. For M6 live checks: both behaviours in this plugin's launcher.
2026-11-04, mods expert, recorded: owner rulings relayed by the orchestrator in reports_dev/goal/20261104_000251+0100-owner-rulings-070.md: release version, verbatim choice "Ship 0.7.0 (Recommended)" (option text: Use --minor. The release adds new features (the launcher skill and /mods-validate-mod), so semantic versioning calls for a minor bump. No change to the pipeline is needed.), superseding the earlier ruling "and we only ship 0.6.4"; release contents, verbatim choice "Everything" (option text: Merge dev main in first: 219 more commits, including the PRRD-extraction work. Its blockers must be fixed before publishing.). The choices in quotes are the owner's, the option texts the orchestrator's. Effect (the mods expert's reading): every 0.6.4 on this card now reads 0.7.0, published with publish.py --minor.
2026-11-04, mods expert, correction of the 0.7.0 Effect line above, from its review fork: every 0.6.4 that names the planned release now means 0.7.0; lines recording what happened (the 0.6.4 publish attempt, commit subjects) stay as history.

## Approval log

- 2026-11-03T22:07:39+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
