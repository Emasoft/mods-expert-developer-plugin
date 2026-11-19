---
trdd-id: J4HRAQF0
title: Port mod-manager as a universal plugin manager
column: human_review
status: tasked
created: 2026-10-22T20:10:35+0200
updated: 2026-11-03T17:25:22+0100
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
implementation-commits: [56764d5, 6c1fe3e, bf34f6d, f19588d]
eht: [R2QYIN8O]
---

# Port mod-manager as a universal plugin manager

## Approval log

- 2026-10-22T20:10:35+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — authority: the user's verbatim directives quoted under User directive (this session); the MANDATE line above was filled by trddgrep new.
- 2026-10-27T16:47:36+0100 — column → human_review. increment 1 shipped; increment 2 split to TRDD-R2QYIN8O; owner live checks left

## STATE

CURRENT STATE 2026-10-27: increment 1 (core) is built in hooks/mod-manager/ with hooks/tests/mod-manager.test.ts; 13 kit tests pass in a staged tree wired as the Integration block says; not yet applied to hooks/index.ts, so the same tests fail in the real tree until it is. NEXT ACTION: the orchestrator applies the Integration block, then increment 2 (the card's Increment 2 list).
2026-10-27 manifest hooks fix: isMod read only hooks/hooks.json, so a plugin whose modules sit in a file its .claude-plugin/plugin.json declares under hooks was listed as a plain plugin. hookFilesOf in logic.ts now returns the default file plus each declared path, and isMod in cli.ts checks them all. Kit 148 pass, pytest 357 pass, and the mutant that reads only the default file turns the new pane test red.
CURRENT STATE 2026-10-27 (supersedes the lines above): column human_review. Increment 1 and the manifest-hooks fix are committed (56764d5, 6c1fe3e), wired in hooks/index.ts, and shipped in 0.6.0 and 0.6.1. Verified in code: Windows absolute and .. paths are refused (hooks/mod-manager/logic.ts:116, logged at cli.ts:39); an unreadable manifest is logged at debug level (cli.ts:35), an unreadable declared hooks file at default level (cli.ts:48). Increment 2 (available plugins, update arrows, Update all, presets, collapsible marketplace sections, filter Input, file-read fallback) is its own card, TRDD-R2QYIN8O; the resolve-bin candidates are TRDD-9Q52M2TA. NEXT ACTION: the owner checks Turn off, Enable and Disable live (confirm once, then Keep; the argv runs once and the list refreshes; a dismissed ask runs nothing) on the terminal and Desktop, then the card moves to complete.
Correction 2026-10-27 (review of ea39045, supersedes the line above where they differ): splitting increment 2 into TRDD-R2QYIN8O was the agent's decision, not the owner's; to keep the full universal-manager goal in force, R2QYIN8O and TRDD-9Q52M2TA are EHTs of this card, so it cannot reach complete before both do. The unreadable manifest stays logged at debug level (cli.ts:35) by the agent's judgement. Windows-path refusal: logic.ts:116 refuses it, but the kit test at hooks/tests/mod-manager.test.ts:388 covers only .. and a leading slash; a Windows-drive and a backslash case are being added.
Note 2026-10-27 (review of e38fd69): the hookFilesOf test now covers a leading slash, a Windows drive (C:\...) and a backslash root (\\server\...); mutation-checked. Not tested but refused by the same drive alternative: C:/x and C:file.json. Known limitation: the .. check matches anywhere in the string, so a legitimate name such as my..file.json is refused too. A claude plugin test run from the repo root fails 171 tests under the gitignored *_dev folders and skills/; that is the wrong invocation: in a clean clone each of the 8 example mods under skills/*/examples passes its own claude plugin test (68 tests, 0 fail), and hooks/ passes through tests/test_mod_tests.py.
Correction 2026-10-27: a card may have only one parent (lint GRAPH-TWO-PARENTS), so TRDD-9Q52M2TA (the resolve-bin candidates, now in human_review) is an EHT of TRDD-GF5UDFWI only, whose card introduced hooks/resolve-bin.ts. This card's only EHT is TRDD-R2QYIN8O; before moving this card to complete, also check that TRDD-9Q52M2TA is complete, since mod-manager uses resolve-bin.
2026-10-27: measured the size of 'claude plugin list --json' (increment 1's listing): 236788 bytes for 515 entries, 5.6% of the 4 MiB (4194304 bytes) $.process.run stdout cap (cap per generated types; not observed live).
UPDATE 2026-10-31: the owner's error 'entry 525 of the plugin list has an unexpected shape' (an entry at scope synced) is fixed in bf34f6d (all documented scopes: user, project, local, managed, session as name@inline, synced as name@synced, skills-dir; a bad entry is shown on its own line instead of blanking the pane) and f19588d (review fixes: readFromFolder checked first, no Uninstall on skills-dir rows, a failed refresh clears the rejected list, rejected reasons cut to about 80 characters with an 'and N more' line, no buttons for a malformed id). The pane still shows the rejected lines (hooks/mod-manager/pane.ts:57); the cli.ts manifest-path notices go to $.ui.log. Not released: the publish is blocked by the CPV strict gate (see TRDD-5LPSG7AV).
REVIEW 2026-10-31: of the five f19588d fixes the orchestrator checked two in code (the pane renders the rejected lines, pane.ts:57; the manifest-path notices go to $.ui.log, cli.ts:43); the other three (readFromFolder first, the 80-character cut with 'and N more', no buttons for a malformed id) rest on the worker's report and its tests. pytest on main after f19588d: 579 passed (reports_dev/gates/). The card stays in human_review: both commits fix the owner's reported error and wait on the same live check. $.process is CLI only (index.d.ts:3582), so on Desktop the list and the buttons cannot run as written; the owner's Desktop check should expect that, and TRDD-GSR975M8 plans the Desktop path through the user-scope settings.json.
OWNER DIRECTIVE 2026-11-03 (verbatim): «either you complete the mod-manager integration in this plugin and you publish and install it, or you fix a fork of the mod-manager and you install it from local marketplace. but i need to use the working mod-manager now.» Then: «once you integrate the mod-manager into this plugin, of course you must uninstall the original mod-manager» and «but you must complete the integration first!». MEASURED 2026-11-03: the installed 0.6.1 throws 'entry 534 of the plugin list has an unexpected shape' on the live list of 535 entries; main's parser reads all 535 with 0 rejected. /mod-manager is owned by the installed 0.6.1; the standalone mod-manager@claude-mod-manager 0.2.2 (netgfx/claude-mod-manager, MIT, Michael Dobekidis) holds /mods. PLAN: phase 1 ships the parser fix as 0.6.2 = v0.6.1 plus main's mod-manager file set (option B of TRDD-5LPSG7AV), built in the fresh clone builds_dev/release-0.6.2 whose main equals origin/main, so the held merge 903e182 and the CPV false positives stay out. Phase 2 ports the standalone's features (update and outdated check, update all, status-line badge, reload, open folder and homepage, details view, add marketplace with install, auto-update) so it can be uninstalled; uninstall happens only after phase 2. Afterwards origin/main is merged back into dev main.
CURRENT STATE 2026-11-03 (release 0.6.2 in progress): the release is built in a clone of origin/main at the session scratchpad, not under builds_dev, because .cspell.json ignorePaths has **/builds_dev/** and matches the absolute path. It carries 7d2552d (v0.6.1 plus the v0.6.1..f19588d diff over hooks/mod-manager, hooks/tests/mod-manager.test.ts, hooks/resolve-bin.ts, hooks/tests/self-command.test.ts, hooks/index.ts, plugin.json, plus two README paragraphs) and 926401c (five words added to .cspell.json: enabl, modword, nolist, onechar, pressfilter). Both commits are backed up as branch release/0.6.2 in the dev repo. NEXT ACTION after publish: merge origin/main into dev main, keeping dev's side for all of hooks/ (the profile work) and the union of both .cspell.json word lists; then run cspell over dev main's whole tree; then install 0.6.2 and check /mod-manager live; then phase 2 (port the standalone mod-manager's features), and only after that uninstall mod-manager@claude-mod-manager.
CURRENT STATE 2026-11-03 evening: 0.6.2 published (6b5ab73; GitHub CI, Release and Notify Marketplace green), installed, and a live probe shows the 0.6.1 read error gone. Phase 2, the port of the standalone mod-manager features, ships from the origin/main release line, because dev main carries two publish blockers: the O5LUMKPW hold on merge 903e182, which needs the owner's redacting-save live check, and jscpd G2b at 5.78%. Build it in a fresh CLONE whose local main is origin/main, at a sibling path outside the repo and outside any _dev folder, never in a worktree, because publish.py pushes HEAD by branch name. NEXT ACTION: a worker reads ~/.claude/plugins/cache/claude-mod-manager/mod-manager/0.2.2/hooks/register.js and tables, for each standalone feature, the host APIs and the exact claude plugin argv it uses. That answers R2QYIN8O's open question of whether $.fs.read can read ~/.claude/plugins/marketplaces/**.

## User directive

- "Also extract this mod and improve it. It is called mod manager, but it has some limits and does not work on both cli and desktop. fix that. make it universal, and make it aestetically pleasing."
<!-- cspell:ignore aestetically seamlessy -->

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
- [ ] Owner, live in the terminal and on Desktop: with claudePath set (TRDD-9Q52M2TA, owned by TRDD-GF5UDFWI) the pane uses that claude; with a wrong one it shows the rejection naming the setting. TRDD-9Q52M2TA is complete.

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

Scope (core, built): list the installed plugins from claude plugin list --json, scope-aware; mark each mod (hooks/hooks.json lists one or more modules); enable, disable and uninstall per row, each behind a confirmation question. Deferred to increment 2: available-not-installed entries, marketplace versions and update arrows, Update all, presets, per-marketplace collapsible sections, filter Input, the file-read fallback when claude is not found, the Desktop manual check.
Requirement (orchestrator, 2026-10-27, the user's words): "detect and show the list of all installed mods, and showing the active ones on top". Ordering rule (orchestrator directive, 2026-10-27, mods first): the enabled mods, then the disabled mods, then the other plugins, enabled first and then disabled; each of the four groups sorted by name, then id, then scope. Tests: the test named lists mods first pins the full order on both surfaces at both widths; the test named an enabled mod is above a disabled mod fails when a disabled mod is listed above an enabled one, or a plugin above a mod. Mutations: dropping the enabled term and dropping the mod term each fail the kit.
Confirmation (how it is enforced): no tool is registered, so a model cannot call a change. The command takes no arguments and only opens the pane. A change is a pane button press: confirmAndAct($, row, action, ask) hands the question and the run to confirmThenRun in logic.ts, a pure function that asks once and runs only on the action's own confirm label (isConfirmed). The pane passes the ask as engineAsk($), a wrapper over $.ui.ask; the tests pass plain answer functions. The ask is a seam, not a mock of the engine. A declined, dismissed or other answer runs nothing. The busy guard refuses a press while claude reads the list or runs an action, with a toast and before any question; the test named a press while claude reads the list is refused fails when that guard is removed. Mutation check: removing isConfirmed's use in confirmThenRun fails the decline and other-label tests (red); the rejected-ask test stays green, as it should.
PROVEN in the kit, with plain answer functions (the test group named the confirm guard, with plain answer functions): confirmThenRun runs the action exactly once on its confirm label and reports ran; a decline, a rejected ask (dismissed) and any other label run nothing and report declined or dismissed. M3 (the guard neutralised) turns the decline and other-label tests red. STILL NEEDS THE LIVE CHECK: the engine dialog itself. The kit cannot answer AskUserQuestion (earlier attempts: a drawn dialog found no engine node, and a tool.call stub returning a result did not answer it), so the live check must press Turn off on each pane, answer the dialog with the confirm label once, then with Keep, and confirm the argv runs once and the list refreshes. Still to check live: that a dismissed engine question runs nothing (confirmAndAct logs it at debug level), and the question text and option labels as the real dialog shows them.
Dropped as the card says: CATALOG, PRESETS, MARKETPLACE, the add-marketplace message, the star toast. Open item: hooks/resolve-bin.ts has only the PATH-free candidates for claude (no cliPath userConfig, no ~/.local/share/claude/versions, no Windows); this mod uses it as it is. Unverified live: Desktop surface behaviour (kit mount on both surfaces only; the manual Desktop check is still owed); the enable and disable argv is from claude plugin enable/disable --help, not run; the plugin list JSON was read from claude 2.1.311.
Live example (manifest hooks fix, 2026-10-27): ponytail@ponytail 5.3.2 declares its hooks as an array, ./hooks/claude-codex-hooks.json and ./hooks/claude-band.json. claude-band.json lists modules, so ponytail is a mod. Before the fix it was listed as a plain plugin, because only hooks/hooks.json was read.
