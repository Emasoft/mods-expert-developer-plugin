---
trdd-id: GF5UDFWI
title: Port self-command with the command-hub features into the plugin
column: todo
status: tasked
created: 2026-10-22T20:10:35+0200
updated: 2026-10-22T20:14:20+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-22T20:10:35+0200
---

# Port self-command with the command-hub features into the plugin

## Approval log

- 2026-10-22T20:10:35+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — authority: the user's verbatim directives quoted under User directive (this session); the MANDATE line above was filled by trddgrep new.

## STATE

CURRENT STATE 2026-10-22: planned, not started; NEXT ACTION: strict CPV gate measurement on probe.py and self-command code, then implement.

## User directive

- "extract the following two skills from this project, and add them to our plugin (adapt them, with the correct paths and scripts and removing references to other external mods or plugins)" (self-command)
- "also examine this mod and see if it has some better features than the self-command mod you already integrated. pick the best features that self-command is missing, combining the best of the two in a better version of the self-command mod." (command-hub)

## Shared decisions

- hooks/hooks.json lists ONE module (docs: one path). hooks/index.ts statically imports each mod (dynamic import() is refused) and owns the ONLY session.start hook (a second session.start hook makes the module fail to load). That hook calls each mod's start function in its own try/catch, logging a failure and continuing. Each mod adds only non-colliding hooks (tool.call, command.run, ui.render with its own requestId).
- Every tool or command name follows the plugin: tools are mcp__mods-expert-developer-plugin__<tool>; the one shared report command is commands/send.md (mods-expert-developer-plugin:send, disable-model-invocation, body $ARGUMENTS).
- Dev-tools gate: the flag lives in $.store (not $.state, which resets on /clear). /mods-dev-tools on|off saves the flag and says it applies from the next session. Tools register only at session.start and only when the flag is on; there is no mid-session registration (undocumented, and it rebuilds the prompt cache). Every gated tool.call also checks the flag and refuses while it is off, because turning it off cannot unregister a tool mid-session. self-command (run, list_commands, the /self-command pane and its command) and probe-runner (tool and command) are gated; mod-manager is always on.
- NOTICE: MIT attribution for Kerem Gok (self-command, probe-runner) and Michael Goldenberg (mod-manager, command-hub), with the MIT permission text.
- Before porting all three: run the strict CPV gate (cpv-remote-validate --strict, pinned v5.22.3) on the tree with probe.py and the self-command code added. MAJOR or CRITICAL, or a blocking NIT on load-bearing code, means stop and report to the user; no obfuscation.
- Typecheck blocked: /plugin-types needs a fresh login ("OAuth session expired"). Done carries "typecheck not run" until the user fixes auth.

## Design

- Keep tool `run`: queue a slash command, run after the turn ends ($.clock.after), report output as the next prompt through the send command; the seven blocked commands (clear, exit, quit, logout, login, resume, rewind).
- New tool `list_commands`: names only by default; with `query`, matching entries with description, argument hint (if $.command.list returns one) and source (built-in, user, project, plugin name); blocked commands marked; built-ins carry a short when-to-use line (reworded command-hub essentials, no other-mod references).
- New pane `/self-command`: queue and history (each run also $.ui.log'd); search box plus command list grouped by source, click puts the command in the prompt box ($.prompt.fill); blocked commands dim; create-command form (name validation ^[a-z0-9][a-z0-9-]{0,40}$, clash check, project or user scope, writes .claude/commands/<name>.md).
- Dropped: command-hub prompt tips, welcome and star toasts.
- Tests that can fail: requestOf refusals, list grouping, blocked marking, query filter, history row after a run, prompt.fill on press.
- Sources (MIT): KilimcininKorOglu/claude-code-mods @ 887502f, plugins/self-command; mishgoldenberg/claude-mods @ 0954c97, plugins/command-hub. Copies in gitignored downloads_dev/.
- History in $.store keyed by session id, bounded to 50 entries per session and to the 20 most recent sessions (older keys pruned).

## Acceptance checklist

- [ ] tests/self-command.test.ts passes under claude plugin test . (needs a fresh login): requestOf refusals, list grouping, blocked marking, query filter, history row after a run, prompt.fill on press, and the gated tool.call refusing while the flag is off.
- [ ] cpv-remote-validate plugin . --strict at v5.22.3 passes with no waiver; report saved under reports/cpv/.
- [ ] NOTICE carries the authors' copyright lines and the full MIT permission text.
- [ ] README documents the tool and the dev-tools switch.
- [ ] Typecheck run, or explicitly reported as not run.
- [ ] Pane tests pass identically on surface terminal and surface desktop; manual Desktop check by the user recorded (mount tests alone do not tick this).
- [ ] claude plugin validate . passes.
- [ ] The CI-parity preflight passes (ruff, mypy, bandit on Python; cspell and jscpd on all files).

## Both environments

"also ensure the mods/hooks will have both the TUI interface and the desktop interface for claude desktop. they must work in both environments seamlessy and identically."
- Every pane, button, input and message uses only elements both the terminal and the Desktop app draw (Box, Text, Button, Link, Code, Markdown, Input, Select). No Raster or Image (terminal only), no Svg (Desktop only), no ToolProgress, TurnDuration or InfoNotice render sites (terminal only).
- One render path for both surfaces: no e.surface branch unless an element is missing on one side, and then the other side draws the same content with the shared elements.
- Hotkeys use plain: true so the terminal shows the key the same way the Desktop app shows it. Link href follows the Desktop Link rules.
- Every external program (claude, tmux, python3, git) is resolved to an absolute path from a candidate list, because the Desktop app does not inherit the shell PATH. The resolved paths are cached per session and shown in the pane or the error text when none is found.
- Tests mount every pane on both surface terminal and surface desktop, at a narrow and a wide width, with the SAME assertions (rows, sections, button presses and the calls they make), so a difference between the two fails a test.
- Acceptance includes a manual check by the user in the Desktop app Code tab; until then Desktop behaviour is reported as tested by mount only.

## Measured API constraints

- isDeferred: false goes in $.tool.register (needs Claude Code 2.1.293+; Desktop's bundled copy may be older); no tool.describe hooks.
- Button has no documented variant prop; use plain and dimColor.
- $.command.register throws on a taken name and skips the rest of the hook; register commands last and wrap each in try/catch; use names unlikely to collide.
- $.ui.ask takes positional arguments: $.ui.ask(question, [options]).
- UNVERIFIED until /plugin-types runs: the fields $.command.list returns (plugin, source, argument hint), the $.prompt.fill argument shape, what $.settings.read returns.
- Shared helper hooks/resolve-bin.ts, built in the first card implemented (A), resolves claude, tmux, python3 and git to absolute paths from candidate lists, cached per session; B and C use it, no second resolver.
- Evidence: reports/measure/20261022_200806+0200-mod-port-assumptions.md, reports/measure/20261022_200938+0200-command-hub-merge.md.
