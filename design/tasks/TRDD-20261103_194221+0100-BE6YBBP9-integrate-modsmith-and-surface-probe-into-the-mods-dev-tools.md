---
trdd-id: BE6YBBP9
title: Integrate modsmith and surface-probe into the mods-dev-tools skill without upfront tools
column: design
status: tasked
created: 2026-11-03T19:42:21+0100
updated: 2026-11-03T19:42:37+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T19:42:21+0100
npt: [UYD6T358]
---

# Integrate modsmith and surface-probe into the mods-dev-tools skill without upfront tools

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03
Column design, no code yet. The owner answered the first two questions (verbatim below). One question is now open: which mechanism replaces the registered tools. Prerequisite TRDD-UYD6T358 needs the derived change below before anything builds on it. NEXT ACTION: the owner picks the mechanism; then a build plan in increments.

## User directive (verbatim, 2026-11-03)
"also integrte the functionality of this mod `https://github.com/barmoshe/bar-mods/tree/main/modsmith` into the /mods-dev-tools skill of the plugin. be sure to convert the mcp to cli tools or scripts."

## Source
modsmith 0.1.0, folder modsmith/ of https://github.com/barmoshe/bar-mods at commit 05a5c7b340295122255bb34cddd79bb83ae297c6, MIT, Copyright (c) 2026 Bar Moshe. Credit it in NOTICE when code is adapted.

## What modsmith does
- Mods roster: every mod the session saw load (plugin.register), its hooks and \$ calls, reload count; installed plugins and dev mods on disk; pick one as gate target.
- Tape: the last 150 engine events with their real payloads (tool calls, prompts, turns, commands, subagents, compaction, plugin loads, ui presses/inputs/selects), secrets scrubbed, kept only in session memory; pause, clear, filter, copy.
- Gates: claude plugin validate (green only with no warnings), tsc against the generated types (zero errors outside tests/), claude plugin test, and three manual eyes checkboxes (terminal, desktop, narrow width); warns on an older claude CLI than the engine, a README footprint missing a hook or call, and an installed copy with the same version.
- Band after a dev mod reloads; /modsmith pane; /gates command; options tools, autoValidate, recordAppends, cliPath, npxPath.
- Three registered tools: events, gates, mods.

## Second user directive (verbatim, 2026-11-03)
"this could also be very useful mod for debugging mods ui: `https://github.com/barmoshe/bar-mods/tree/main/surface-probe`. add this to /mods-dev-tools too."

## surface-probe
Source: surface-probe/ of https://github.com/barmoshe/bar-mods at commit 2568b016527c1a0398a093113c7eac04ba1b70c5, MIT, Copyright (c) 2026 Bar Moshe. Credit it in NOTICE.
What it does: a pane that reports what a surface really does before you design a UI for it. It shows:
- the surface, its placement (docked or above the prompt), body width in cells and viewport;
- right-to-left text samples (Hebrew, mixed text, a row-reverse row, a right-aligned box);
- an SVG banner on surfaces that draw Svg;
- a button that sends Claude one short prompt and logs how many milliseconds it waited to enter the conversation, and one that only fills the prompt box.
It is built around two behaviours seen on 2026-10-04: one press can fire twice, and a pane that holds the keyboard can keep a queued prompt from entering the conversation. It has no tools, so the mechanism question does not apply to it. It needs only the shared switch: nothing runs or draws while it is off.

## Outline (draft, not approved)
- Port the roster, tape, gates, band and pane as hooks/modsmith/ behind the shared dev-tools switch (TRDD-UYD6T358).
- Replace the three registered tools with scripts the agent runs through Bash: a gates script (validate, types, tests on a folder, pass/fail with trimmed output; reuse or merge the quickstart skill's check-mod.sh), an events script and a roster script that read files the mod writes.
- Document the scripts in skills/mods-dev-tools/SKILL.md.

## Owner answers (verbatim, 2026-11-03)
Q1 (should this plugin's own registered tools become scripts too): "if you can integrate them into claude as native ts libraries it is better of course. the fastest the better. the only thing to avoid absolutely is the mcp, since the consume too much context memory. a skill with a cli or a custom tool would be much better. this is what mods are for. but be creful with cpu usage and ram usage if too many mods ae active at the same time. make sure that when they are not active, they will not use cpu or ram."
Q2 (how the event tape is saved): "write only minimal debug logs, optionally, and never write secrets down except when you are sure neither the model nor the transcript records them."

## Rulings drawn from the answers
- No upfront tool definitions in every request. A mod's $.tool.register tool shows up as mcp__<plugin>__<name>. This plugin's four (probe, run, list_commands, dev_tools) are registered with isDeferred: false, so their full schemas ride in every request.
- The tape stays in memory only, scrubbed with the secret-shield-style redaction, and is visible in the pane. The optional debug log holds event names, timestamps and payload keys and types, never values. Anything the model reads lands in the transcript, so a model-facing events answer returns payload shapes plus values already passed through redact(), nothing else.
- When the switch is off, the dev tools use no CPU or RAM: no tape buffer, no timers, no pane work, nothing registered upfront. The only always-on work is reading the switch at startup.

## Derived change to TRDD-UYD6T358 (an NPT of this card)
Its scope says "Register worker tools and their commands at session startup regardless of activation". That conflicts with the zero-cost ruling. When the switch is off, register nothing, or only deferred tools.

## Open question for the owner
Which mechanism replaces the upfront registered tools:
1. Deferred registration (isDeferred: true, Claude Code 2.1.293+). Only the tool name sits in context until Claude searches for it. It runs in-session, is fast and works on Desktop. This is the cheapest fix for the existing four tools.
2. A skill plus real CLI scripts. It costs nothing in context beyond the skill line, but a script cannot reach session state. Only the gates (validate, types, tests; check-mod.sh and scripts/probe.py exist) fit. Listing commands, queuing a slash command, the switch, event payloads and the mod roster do not.
3. A mod answering a reserved Bash command through tool.call returning { result }. It has no tool definition at all, but needs a spike first. Unverified: whether tool.check and the permission and auto-mode checks still run, whether PreToolUse guards that read Bash commands are affected, and whether Desktop behaves the same.

## Approval log

- 2026-11-03T19:42:21+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
