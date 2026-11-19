---
trdd-id: 4Z36WCEV
title: Give the mods expert agent Opus xhigh, subagent spawning and runtime mod switches
column: todo
status: tasked
created: 2026-11-03T20:00:31+0100
updated: 2026-11-04T00:51:16+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T20:00:31+0100
relevant-rules: [12]
---

# Give the mods expert agent Opus xhigh, subagent spawning and runtime mod switches

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

Column todo, no implementation yet. Governed by PRRD G12.1 (the mods-expert-developer-agent designs and develops every mod). Verified 2026-11-03: agents/mods-expert-developer-agent.md frontmatter holds name, description and skills only; no model, effort or tools key exists. NEXT ACTION: add the fields below, each checked against skills/mods-doc-subagents-reference/references/chapter.md before writing.
2026-11-04, mods expert: model claude-opus-5-5 and effort xhigh on the expert agent are built by TRDD-MPJTMO51 increment A (4e9f8bf on feat/agent-launcher, not merged yet); the tools allowlist and the dev_tools tool remain open.

## Scope

- model: claude-opus-5-5 (a full model ID; the chapter accepts it in the model field).
- effort: xhigh (the chapter lists low, medium, high, xhigh and max; available levels depend on the model).
- tools: list the Agent tool so the agent can spawn subagents and forks of itself. The chapter says omitting Agent from tools blocks spawning. A fork cannot spawn further forks, so the agent itself is the forking party.
- tools: the plugin dev_tools tool, so the agent can switch mod functions on and off at runtime (see the per-function switch card).
- tools: once a tools field is added it becomes an allowlist and narrows the agent; while the field is absent the agent inherits every tool. List every tool the agent needs, not only Agent.
- skills: keep the existing skills list (frontmatter lines 4 to 65) and make it cover the plugin skills menu.

## Approval log

- 2026-11-03T20:00:31+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
