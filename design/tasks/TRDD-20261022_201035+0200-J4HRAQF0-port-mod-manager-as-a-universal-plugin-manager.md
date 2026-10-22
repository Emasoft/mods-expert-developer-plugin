---
trdd-id: J4HRAQF0
title: Port mod-manager as a universal plugin manager
column: todo
status: tasked
created: 2026-10-22T20:10:35+0200
updated: 2026-10-22T20:14:22+0200
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

# Port mod-manager as a universal plugin manager

## Approval log

- 2026-10-22T20:10:35+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — authority: the user's verbatim directives quoted under User directive (this session); the MANDATE line above was filled by trddgrep new.

## STATE

CURRENT STATE 2026-10-22: planned, not started; NEXT ACTION: strict CPV gate measurement on probe.py and self-command code, then implement.

## User directive

- "Also extract this mod and improve it. It is called mod manager, but it has some limits and does not work on both cli and desktop. fix that. make it universal, and make it aestetically pleasing."

## Shared decisions

- hooks/hooks.json lists ONE module (docs: one path). hooks/index.ts statically imports each mod (dynamic import() is refused) and owns the ONLY session.start hook (a second session.start hook makes the module fail to load). That hook calls each mod's start function in its own try/catch, logging a failure and continuing. Each mod adds only non-colliding hooks (tool.call, command.run, ui.render with its own requestId).
- Every tool or command name follows the plugin: tools are mcp__mods-expert-developer-plugin__<tool>; the one shared report command is commands/send.md (mods-expert-developer-plugin:send, disable-model-invocation, body $ARGUMENTS).
- Dev-tools gate: the flag lives in $.store (not $.state, which resets on /clear). /mods-dev-tools on|off saves the flag and says it applies from the next session. Tools register only at session.start and only when the flag is on; there is no mid-session registration (undocumented, and it rebuilds the prompt cache). Every gated tool.call also checks the flag and refuses while it is off, because turning it off cannot unregister a tool mid-session. self-command (run, list_commands, the /self-command pane and its command) and probe-runner (tool and command) are gated; mod-manager is always on.
- NOTICE: MIT attribution for Kerem Gok (self-command, probe-runner) and Michael Goldenberg (mod-manager, command-hub), with the MIT permission text.
- Before porting all three: run the strict CPV gate (cpv-remote-validate --strict, pinned v5.22.3) on the tree with probe.py and the self-command code added. MAJOR or CRITICAL, or a blocking NIT on load-bearing code, means stop and report to the user; no obfuscation.
- Typecheck blocked: /plugin-types needs a fresh login ("OAuth session expired"). Done carries "typecheck not run" until the user fixes auth.
- Implementation is executed by the plugin agent mods-forge-agent (built by TRDD-N9M0FOKO); the orchestrator commits a checkpoint before each dispatch, because the agent never commits.

## Design

- Remove CATALOG, PRESETS, MARKETPLACE, the add-marketplace message, the star toast.
- List every installed plugin of every marketplace (from installed_plugins.json + known_marketplaces.json + each marketplace.json) plus available-not-installed entries; badge plugins that ship mods. Prefer `claude plugin list --available --json` when the CLI resolves; file reads are the fallback, labelled possibly stale. Enabled state: CLI first.
- CLI resolution once per session, cached: cliPath userConfig, claude on PATH, ~/.local/bin/claude, newest ~/.local/share/claude/versions/* by version sort (skip *.tmp), /opt/homebrew/bin/claude, /usr/local/bin/claude, Windows %USERPROFILE%\.local\bin\claude.exe; each checked with --version; none found means a pane message naming the config field. Validate plugin ids ^[a-z0-9][a-z0-9._-]*@[a-z0-9._-]+$ before building argv; no cmd /c with user input.
- Pane: one round-bordered, collapsible section per marketplace; filter Input; rows with right-aligned version, update arrow toned by jump size, per-row buttons; Update all; presets: all on, all off, user-saved sets in $.store; a preset never disables this plugin itself. Only elements both surfaces draw. $.ui.ask uses positional arguments.
- Desktop fix is INFERRED (PATH); do not claim it works on Desktop until the user confirms.
- Tests that can fail: two marketplaces render two sections; an outdated row shows the arrow; "Turn off" calls process.run with the expected argv (mocked).
- Source (MIT): mishgoldenberg/claude-mods @ 0954c97, plugins/mod-manager. Copy in gitignored downloads_dev/.
- Collapsible sections are built from a toggle Button plus state (no collapse element is documented).
- Enabled state from the CLI; when the CLI is not found, the file fallback shows on/off as unknown, never guessed.
- Update all keeps the pane responsive with a busy state.
- Command name avoids collisions (not /mods).

## Acceptance checklist

- [ ] The pane mount tests pass on both surfaces: two marketplaces render two sections; an outdated row shows the arrow; Turn off calls process.run with the expected argv (mocked).
- [ ] cpv-remote-validate plugin . --strict at v5.22.3 passes with no waiver; report saved under reports/cpv/.
- [ ] NOTICE carries the authors' copyright lines and the full MIT permission text.
- [ ] README documents /mods-manager (or the chosen command name) and that it is always on.
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
