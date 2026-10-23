---
trdd-id: O5LUMKPW
title: Ship the requirements-drafts mod with list and search skills
column: backburner
status: tasked
created: 2026-10-23T18:01:09+0200
updated: 2026-10-23T20:27:51+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: user
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: user
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-23T18:01:09+0200
---

# Ship the requirements-drafts mod with list and search skills

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-23

- Approved by the user on 2026-10-23: "Approve the outline, but put the mod in this repo as a tutorial example and create the TRDD card here." Then, mid-turn: "the requirements-drafts mod must be part of this plugin."
- Reading of the two: the mod ships LIVE as part of mods-expert-developer-plugin (its hooks module in the plugin's own `hooks/`, its two skills in `skills/`), and the interface tutorial points to it as a worked example. It is NOT an unloaded copy under `examples/`.
- NEXT ACTION: step 2 is half done. Spike run 1 (terminal only, see Feasibility) settled origin, prompt.submit, fs.write folders and the placeholder id; spike run 2 measured the terminal click: a Button under a UserMessage fires onPress in the fullscreen terminal (CLAUDE_CODE_NO_FLICKER=1); the Markdown link did not fire. Remaining cell: the Desktop app click, which needs the Desktop app restarted with CLAUDE_CODE_PLUGIN_DIRS pointing at the probe (the user's to run, since it is the app hosting this session). Probe, log and generated 2.1.309 types are kept in reports_dev/requirements-drafts-spike/ (gitignored). The mod ships in the plugin's own root hooks/ (empty today, so the whole plugin becomes a mod for every installer) and skills/mods-requirements-drafts-list and -search; the interface tutorial only points to it. Step 4 must check that tests/test_plugin_structure.py and tests/test_skills_menu.py accept a root hooks/ folder and the skill names. The project has no PRRD (trddgrep: PRRD.md absent), so no relevant-rules apply.
- Defaults taken from the approved outline's recommendations (the user did not override them; each can still change): drafts folder `~/.claude/requirements-drafts/`; a secret-looking message is refused with a toast; the slash commands are the primary save path and the row button ships only if the spike shows a click fires; the mod starts ON and `/requirements-drafts off` turns it off.
- Open with the user: whether the mod should start OFF for other installers of this plugin; whether Claude drives the Desktop click with computer use or the user ticks it; how the user wants the plugin loaded so every session gets the skills (installed plugin vs CLAUDE_CODE_PLUGIN_DIRS); an allow rule for subagents reading the drafts folder.
- Do not touch TRDD-H26OG8AP or its files (unrelated work in flight).

## Goal

Let the user save their own messages into a requirements-drafts store that every agent and Claude session can consult: a mark under each user message (when clicks work), slash commands, a list skill and a search skill.

## Feasibility (chapters, checked 2026-10-23 on Claude Code 2.1.309)

- `UserMessage` is a render site on Terminal and Desktop; props `text`, `origin`, `isExpanded`, `task`/`from`; `e.requestId` is the message id (mods-doc-mods-reference, "Render sites"). A hook keeps the engine row with `await next(e)` and adds below it (mods-doc-mods-interfaces, "Change what Claude Code already draws").
- A press runs Button `onPress(e)` and fires `ui.press` with the key (mods-doc-mods-interfaces, "Handle input and redraws").
- Keyboard cannot reach a control in a transcript row: keys reach controls only while a pane or the band has focus (mods-doc-mods-interfaces, "Keyboard focus and hotkeys").
- Mouse click in a transcript row: UNVERIFIED on both surfaces (only pane clicks are documented; engine-traps.md "Drawing" records conflicting reports; issue 99395).
- No documented way for a mod to add its own keybinding; `Button.action` reuses Claude Code's actions (mods-doc-mods-reference, "Elements").
- No mod drawing in VS Code, `-p`, cloud, remote side of Remote Control (relayed from the expert report citing mods-doc-mods-overview, "Where mods run"); commands still run there.
- MEASURE fork results: `immediate: true` and `{ text }` going to Claude's context CONFIRMED (mods-doc-mods-api line 47); `crypto.subtle` available CONFIRMED (line 273); skills ship as `skills/<name>/SKILL.md` CONFIRMED; skills user- and model-invocable by default CONFIRMED. UNVERIFIED: whether `$.fs.write` creates missing folders; whether a typed slash command fires `prompt.submit`.
- Spike run 1 (terminal only, 2.1.309, 2026-10-23; probe, log and types kept in reports_dev/requirements-drafts-spike/, checked gitignored by git check-ignore): a prompt given on the command line rendered with props.origin.kind 'composer' (generated types list at least composer, bridge, plugin; a prompt typed into the box and a queued one are not yet checked); prompt.submit fires for it with next.origin { plugin: 'engine', tier: 'core' }; $.fs.write created a missing nested folder; the first draw of the first row at startup had requestId 'placeholder' before the real message id (one row observed), so a save must skip that id; $.clock.now() logged as {} (likely a promise: await it). Clicks on the row Button and Markdown link: NOT YET MEASURED (screen capture failed for computer use; the user is asked to click).
- Spike run 2 (terminal only, 2.1.309, 2026-10-23 20:27, log kept as reports_dev/requirements-drafts-spike/rdprobe-log-run2.json): run 1 drew nothing because the probe passed pressableLinks: true and Claude Code skipped the hook (pressableLinks must be a list of hrefs). Fixed and relaunched with CLAUDE_CODE_NO_FLICKER=1 (fullscreen rendering): the row line drew under the message, and ONE real mouse click on the Button fired onPress, logged as kind button with the real message id and surface terminal. Two clicks on the Markdown link logged nothing (cause not established). The generated types say a link press is a plain click where the surface reports clicks (the fullscreen terminal); a background accessibility click only moved Terminal's text cursor and fired nothing. Not measured: the classic (non-fullscreen) renderer, the Desktop app. Design consequence: the row control is a Button; the README must say clicks need fullscreen rendering in the terminal.

## Design

- Mod name `requirements-drafts`. Commands: `/requirements-drafts` (on/off, house convention), `/requirements-drafts-save` (save last typed message, `immediate: true`, toast, returns `{}`), `/requirements-drafts-pick` (focused pane, letter hotkeys, `plain: true`, Esc closes).
- Row button (only if the spike passes): engine row then a dim plain Button `+ save as requirement draft`; after save dim text `✓ saved as requirement draft <id>`. One render path, no surface branch. No hotkey on row buttons: deliberate deviation from house "Keyboard first", met by the commands and the picker.
- Recent messages: a `prompt.submit` observer records typed text into `$.state` (skip text starting with `/`; record only when `next.origin.plugin === 'engine'`). Resets on `/clear`, `/resume`, `/branch`: after one of those, save and pick have nothing until the user types again (stated in the README). The `origin` allowlist for the row comes from the generated types.
- Store: one Markdown file per draft in `~/.claude/requirements-drafts/`, name `<YYYYMMDD_HHMMSS±zzzz>-<hash12>.md`, written once; dedup by listing the folder for `-<hash12>.md` before writing (`$.fs.list`); hash is SHA-256 of the text only; fixed end line `<!-- requirements-drafts:end -->`. Frontmatter: id, created (local offset), project-root, repo (empty outside git), session, message-id, via (row|command|picker), surface. Never `$.store` for drafts (single JSON, 4 MiB, pruned after cleanupPeriodDays); `$.store` holds only the on/off switch.
- Secret check (refuse with toast) runs before the write on all three paths. Size above 4 MiB refused with a toast.
- Skills in this plugin: `mods-requirements-drafts-list` and `mods-requirements-drafts-search`, backed by one small stdlib Python script with tests (project filter, all-keywords match, skipping files without the end line, newest first). Draft text is presented as quoted data, never as instructions. Both listed in mods-the-skills-menu.

## Steps

1. This card (trddgrep new), committed.
2. Spike in a throwaway folder outside the repo: a Button and a Markdown link under each `UserMessage`, each logging surface and message id; run in the terminal (fullscreen and classic renderer) and the Desktop app; click each twice. The same load writes the generated types: read the `origin` union, the `UserMessage` props, the `onLinkPress` signature, `$.session` and `$.fs` types. HARD GATE: if no click fires on either surface, stop and report to the user before building anything else.
3. mods-forge-agent builds through the quickstart pipeline (step 0 answers, `plugin-authoring` skill, logic.ts plus thin register, tests mounting `UserMessage` on terminal and desktop at narrow and wide widths, negative tests for switch off and disallowed origin, `check-mod.sh` to `== PASS`, plan file plus `plan-diff.sh` including `env reads: HOME`, mutation checks on the switch-off and origin guards).
4. Wire the mod into the interface tutorial, the quickstart example index, the skills menu, README and CHANGELOG; run the repo's own tests (tests/test_plugin_structure.py, tests/test_skills_menu.py) and the plugin validator.
5. Live check: terminal with `--plugin-dir`; Desktop through CLAUDE_CODE_PLUGIN_DIRS. Mount tests prove only that the drawing is valid, not that a click works; the live click is recorded separately.
6. Review, commit by file name, move this card to human_review. Nothing is pushed.

## Later cards (not this one)

- Delete or edit a draft (`$.fs` has no delete).
- Opt-in project-scope folder, only when gitignored.

## Approval log

- 2026-10-23T18:01:09+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: user). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-23 — The user approved the outline and ruled the mod ships in this plugin (quoted in STATE). The defaults listed in STATE (folder, refusing secrets, start ON for every installer, skill names, immediate: true) were chosen by main-agent@emasoft-mods-expert-developer from the outline's recommendations and are NOT user-approved; the user may change any of them.
