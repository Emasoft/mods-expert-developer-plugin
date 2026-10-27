---
trdd-id: GF5UDFWI
title: Port self-command with the command-hub features into the plugin
column: dev
status: tasked
created: 2026-10-22T20:10:35+0200
updated: 2026-10-27T11:19:38+0100
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
- 2026-10-27T11:19:38+0100 — column → dev. increment A1 implemented by mods-forge-agent; orchestrator brief of 2026-10-27

## STATE

CURRENT STATE 2026-10-22: planned, not started; NEXT ACTION: strict CPV gate measurement on probe.py and self-command code, then implement.
CURRENT STATE 2026-10-27 (supersedes the 2026-10-22 line above): column dev; increment A1 implemented and verified (claude plugin test 88 pass on the staged mod, check-mod.sh == PASS, pytest 339 pass, claude plugin validate passes), not committed. NEXT ACTION: the orchestrator reviews and commits A1, then dispatches A2 (the /self-command pane). Details under ## Increment A1.

## User directive

- "extract the following two skills from this project, and add them to our plugin (adapt them, with the correct paths and scripts and removing references to other external mods or plugins)" (self-command)
- "also examine this mod and see if it has some better features than the self-command mod you already integrated. pick the best features that self-command is missing, combining the best of the two in a better version of the self-command mod." (command-hub)
<!-- cspell:ignore seamlessy -->

## Shared decisions

- hooks/hooks.json lists ONE module (docs: one path). hooks/index.ts statically imports each mod (dynamic import() is refused) and owns the ONLY session.start hook (a second session.start hook makes the module fail to load). That hook calls each mod's start function in its own try/catch, logging a failure and continuing. Each mod adds only non-colliding hooks (tool.call, command.run, ui.render with its own requestId).
- Every tool or command name follows the plugin: tools are mcp__mods-expert-developer-plugin__<tool>; the one shared report command is commands/send.md (mods-expert-developer-plugin:send, disable-model-invocation, body $ARGUMENTS).
- Dev-tools gate: the flag lives in $.store (not $.state, which resets on /clear). /mods-dev-tools on|off saves the flag and says it applies from the next session. Tools register only at session.start and only when the flag is on; there is no mid-session registration (undocumented, and it rebuilds the prompt cache). Every gated tool.call also checks the flag and refuses while it is off, because turning it off cannot unregister a tool mid-session. self-command (run, list_commands, the /self-command pane and its command) and probe-runner (tool and command) are gated; mod-manager is always on.
- NOTICE: MIT attribution for Kerem Gok (self-command, probe-runner) and Michael Goldenberg (mod-manager, command-hub), with the MIT permission text.
- Before porting all three: run the strict CPV gate (cpv-remote-validate --strict, pinned v5.22.3) on the tree with probe.py and the self-command code added. MAJOR or CRITICAL, or a blocking NIT on load-bearing code, means stop and report to the user; no obfuscation.
- Typecheck blocked: /plugin-types needs a fresh login ("OAuth session expired"). Done carries "typecheck not run" until the user fixes auth.
- Implementation is executed by the plugin agent mods-forge-agent (built by TRDD-N9M0FOKO); the orchestrator commits a checkpoint before each dispatch, because the agent never commits.

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

## Increment A1

- 2026-10-27 — A1 implemented by mods-forge-agent (uncommitted; the orchestrator commits): hooks/resolve-bin.ts, hooks/dev-tools.ts, hooks/self-command/logic.ts and register.ts, hooks/index.ts wiring, commands/send.md, hooks/tests/self-command.test.ts (21 tests), NOTICE attribution for Kerem Gok and Michael Goldenberg with the MIT text. The /self-command pane is A2.
- Decision (orchestrator correction, 2026-10-27): run is gated by the dev-tools flag exactly like list_commands, with the same seven blocked commands. Reason: the blocked list does not stop /permissions, /config, /hooks, /mcp, /plugin, /add-dir, /model or /sandbox, so an always-on run would let the model loosen its own permissions or install code in every session. An earlier brief override to leave run ungated was dropped and is not in effect.
- Override of the card (orchestrator, 2026-10-24): Buttons follow the house convention of hooks/requirements-drafts/register.ts (bracketed, no plain prop, the label names its letter); the card line asking for plain: true is superseded. Reason: measured live on 2026-10-24, on the terminal only; Desktop parity is UNVERIFIED until the owner's Desktop check. A1 draws no button, so this applies from A2.
- Settled from the generated types (.claude-plugin/types/claude-code/index.d.ts, Claude Code 2.1.310): CommandInfo is name, description, source (builtin, plugin, user, mcp) and plugin; it has NO argument hint, so list_commands shows none; source user covers both the user's and the project's own commands, so they share the group 'user or project'. ToolSpec.isDeferred is passed false (no tool.describe hook). command.run runs a slash command as if typed, queued until the session is idle, and rejects inside a hook the turn waits on (hence clock.after). PromptFillArgs is text, mode (replace by default), decorations, cursor (for A2). settings.read resolves the merged settings, one source's, or one key's value. The Anthropic copy in the scratchpad (written by 2.1.277) agrees on command.run.
- Decision: the outcome reaches the model only through the send command (mods-expert-developer-plugin:send). The source's fallback to a plain plugin prompt was dropped (no fallbacks): a failed send is logged and toasted so the person sees it. That the namespaced send command resolves live is UNVERIFIED (the kit stubs command.run).
- Decision: the dev-tools flag and /mods-dev-tools live in the shared hooks/dev-tools.ts (probe-runner will use the same gate). The flag is read from $.store on every call, defaults to off, and /mods-dev-tools takes no argument (toggle), on or off, else answers usage. On takes effect at the next session start; off refuses the next call at once.
- Decision: history is one $.store key (self-command-history), an object keyed by session id, each with lastAt and at most 50 entries; only the 20 sessions with the latest lastAt are kept (ranked by stamp, not key order). Each row keeps the first 400 characters of the output. A stored value of another shape is reported in the log, never reset.
- Known gaps: resolve-bin candidate lists cover macOS and Linux only (no Windows); nothing in A1 calls resolveBin yet. The README section for the tools and the switch, the strict CPV gate run and the manual Desktop check remain open.
