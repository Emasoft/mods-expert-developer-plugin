---
trdd-id: 03IIDGPP
title: Port probe-runner into the plugin
column: dev
status: tasked
created: 2026-10-22T20:10:35+0200
updated: 2026-10-27T12:29:57+0100
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

# Port probe-runner into the plugin

## Approval log

- 2026-10-22T20:10:35+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — authority: the user's verbatim directives quoted under User directive (this session); the MANDATE line above was filled by trddgrep new.

## STATE

CURRENT STATE 2026-10-27: increment 1 written in the tree, not committed (hooks/probe-runner, scripts/probe.py, tests). Checks and open items: see the Increment 1 section. NEXT ACTION: the orchestrator applies the Integration block (hooks/index.ts wiring, NOTICE, README) and updates the self-command test expectation, then commits; the CPV strict gate and the later increments follow.

## User directive

- "extract the following two skills from this project, and add them to our plugin (adapt them, with the correct paths and scripts and removing references to other external mods or plugins)" (probe-runner)
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

- Files: hooks/probe-runner.ts, hooks/probe.ts, scripts/probe.py (python3 stdlib); remove sage-memory, "this repository" and Turkish examples.
- pluginDir: a repo root that is itself a plugin resolves a bare name or "." to the root; else <root>/plugins/<name>.
- Bug fix: remove() deletes every *_inline-*.json modified since start, including other sessions' files. Snapshot the store first and delete only files that were absent before AND whose name starts with a plugin under test.
- claude, tmux and python3 come from the shared hooks/resolve-bin.ts (built in Card A); Windows or missing tmux refuses at once.
- pytest: prompt_box, pane_text, entry_lines, remove() keeps a pre-existing inline file.
- Sources (MIT): KilimcininKorOglu/claude-code-mods @ 887502f, plugins/probe-runner (mod-doctor used as reading reference). Copy in gitignored downloads_dev/.
- scripts/probe.py passes ruff, mypy and bandit in the CI-parity preflight.

## Acceptance checklist

- [ ] uv run pytest tests/test_probe.py passes: prompt_box, pane_text, entry_lines, remove() keeps a pre-existing inline file, and remove() keeps a file another plugin created during the probe.
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

## Increment 1

- Files: hooks/probe-runner/logic.ts (pure: arguments, plugin directories, script argument vector, texts), hooks/probe-runner/register.ts (thin: startProbeRunner, registerProbeRunner), scripts/probe.py, tests/test_probe.py, hooks/tests/probe-runner.test.ts. The card's hooks/probe-runner.ts and hooks/probe.ts are superseded by the house folder layout (hooks/<mod>/logic.ts and register.ts, as requirements-drafts and self-command).
- Deviations from the source: tool.describe hook replaced by isDeferred false at tool.register (Measured API constraints); the prompt.submit fallback for an undeliverable report is dropped (fail fast: a failed send is logged and toasted, as self-command does); the /private/tmp literal is the resolved system temp directory (the source's own fallback meaning; the absolute-path test forbids the literal); ps is replaced by os.kill(pid, 0) so no PATH lookup remains.
- Binaries: python3, claude, tmux and git come from hooks/resolve-bin.ts (absolute candidates, cached per session) and reach probe.py as --claude, --tmux, --git and the interpreter. Each script value is one --name=value argument, so a step that starts with a dash is never read as an option.
- Bug fix: remove() deletes an inline store file only when it was absent before the probe started AND its name starts with <plugin>_inline- for a plugin under test (the plugin name is read from its manifest). Without the snapshot, a pre-existing file or another session's file was deleted with the probe's own.
- UNVERIFIED live: the inline store naming (<plugin>_inline-*.json, inferred from the source glob) and the manifest name as its prefix. Not confirmed against Claude Code's plugin store; no in-repo document or type settles it.
- Gate: the tool and the command answer and register only while /mods-dev-tools is on; startProbeRunner registers the command last. hooks/index.ts must call startProbeRunner after the self-command start and before the dev-tools start (commands register last), and call registerProbeRunner after registerSelfCommand. The kit refuses engine calls from a hook that hooks/index.ts does not reach, so the tests need that wiring (verified in a scratch copy, not the repo).
- Raw check results, the Integration block (hooks/index.ts, NOTICE, README) and the open items: reports/probe-runner/20261027_122907+0100-increment1.md. The repo kit gate stays red until the index.ts wiring is applied.
