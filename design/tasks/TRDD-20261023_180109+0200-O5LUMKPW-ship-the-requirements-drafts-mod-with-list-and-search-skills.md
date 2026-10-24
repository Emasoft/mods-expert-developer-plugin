---
trdd-id: O5LUMKPW
title: Ship the requirements-drafts mod with list and search skills
column: human_review
status: tasked
created: 2026-10-23T18:01:09+0200
updated: 2026-10-24T05:19:50+0200
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
implementation-commits: [b17e4b5, be732a4, 1bfccce, 94d1778, 58fc002, ac621e6, 96fac93, 4de69c6, 1f3c768, 9c0a68e, 87f9560, a1d4648, ef2558c]
---

# Ship the requirements-drafts mod with list and search skills

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-24

- Approved by the user on 2026-10-23: "Approve the outline, but put the mod in this repo as a tutorial example and create the TRDD card here." Then, mid-turn: "the requirements-drafts mod must be part of this plugin."
- Reading of the two: the mod ships LIVE as part of mods-expert-developer-plugin (its hooks module in the plugin's own `hooks/`, its two skills in `skills/`), and the interface tutorial points to it as a worked example. It is NOT an unloaded copy under `examples/`.
- NEXT ACTION: owner-run only. (1) The Desktop click test: install the plugin version that ships the mod (none is published yet; a release needs the user's go-ahead to push), type a message, click the dim '+ save as requirement draft' line. (2) Settled 2026-10-24: the mod stays ON by default (see Approval log). (3) Rule on the secret-check trade-offs listed under Build decisions. (4) Say whether to delete the four test drafts in ~/.claude/requirements-drafts/: 20261023_211419+0200-68790fd39323.md, 20261023_211558+0200-d215e455a838.md, 20261023_231950+0200-14c4b806242c.md and 20261023_232124+0200-b0da7aba0411.md. (5) Settled 2026-10-24: installing and enabling the plugin is the whole setup (see Approval log). (6) Say whether to add an allow rule for subagents reading the drafts folder. The terminal live check passed at a1d4648. Observed: row clicks reach the mod one click per placement; the classic-renderer placement is unconfirmed.
- STANDING AGREEMENT: tell the TRDD-H26OG8AP session before editing skills/mods-tutorial-quickstart/SKILL.md or references/house-conventions.md.
- Defaults taken from the approved outline's recommendations (all unconfirmed by the user except the ON default, confirmed 2026-10-24; each can still change): drafts folder `~/.claude/requirements-drafts/`; a secret-looking message is refused with a toast; the slash commands and the row button both ship (the spike showed a fullscreen-terminal click fires); the mod starts ON and `/requirements-drafts off` turns it off.
- Open with the user (owner-run): see NEXT ACTION in STATE.
- Do not touch TRDD-H26OG8AP or its files (unrelated work in flight).
- Built and committed 2026-10-23: mod ac621e6 plus fixes 87f9560 (per-session state keyed by $.session.id, which may matter when one process hosts several sessions — unverified; save-error toasts; a narrower linear secret check; CPV gate fixes); skills 96fac93, 4de69c6, 1f3c768; menu TOC 9c0a68e. Gates at 87f9560: claude plugin validate 0, pytest 334, check-mod on a staging copy == PASS 35/35, CPV 5.22.3 strict exit 0 (no CRITICAL/MAJOR/MINOR/NIT, 27 WARNINGs), CPV 5.23.0 strict exit 2 only on five pre-existing chapter MAJORs.

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
- Spike run 2 (terminal only, 2.1.309, 2026-10-23 20:27, log kept as reports_dev/requirements-drafts-spike/rdprobe-log-run2.json): run 1 drew nothing because the probe passed pressableLinks: true and Claude Code skipped the hook (pressableLinks must be a list of hrefs). Fixed and relaunched with CLAUDE_CODE_NO_FLICKER=1 (fullscreen rendering): the row line drew under the message, and ONE real mouse click on the Button fired onPress, logged as kind button with the real message id and surface terminal. Two clicks on the Markdown link logged nothing (cause not established). The generated types say a link press is a plain click where the surface reports clicks (the fullscreen terminal); a background accessibility click only moved Terminal's text cursor and fired nothing. Scope: one click, Terminal.app, fullscreen, first row; the link misses may be click placement (UNVERIFIED). Design consequence: the row control is a Button. Note: the run-2 probe source overwrote the run-1 source in reports_dev (run 1's log survives as rdprobe-log.json).
- Spike run 3 (terminal, classic renderer CLAUDE_CODE_NO_FLICKER=0, 2.1.309, 2026-10-23 20:29, log rdprobe-log-run3-classic.json): the row line drew, but one real click on the Button and one on the link (3 s apart) logged nothing. So on this machine a row click reached the mod in fullscreen rendering and not in the classic renderer (one click each). The README states this as observed on 2.1.309, and the commands remain the way to save in the classic renderer.

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
- 2026-10-23T23:23:01+0200 — column → human_review. terminal live check passed at a1d4648; Desktop test and three rulings are owner-run
- 2026-10-24 user ruling on the on/off default: "Keep the requirements-drafts mod on by default for other installers." No code change: the mod already starts ON, pinned by a test.
- 2026-10-24 user ruling on how the plugin is loaded: "you only need to install the plugin, and the option/link/button to import a message as a requirement-draft should appear on all messages as long the plugin is installed and enabled ." Read as: no extra loading step (no CLAUDE_CODE_PLUGIN_DIRS), and the button shows on every message the person typed while the plugin is enabled, which is what register.ts already does (rowIsSaveable: origin kind composer). Known gap told to the user: in the classic (non-fullscreen) terminal view the row click was not delivered on 2.1.309; the slash commands are the path there.

## Build decisions

- 2026-10-23 (orchestrator, after the forge agent's BLOCKED report reports/mods-forge-agent/20261023_210455+0200-requirements-drafts-mod.md): (1) claude plugin test on the plugin root sweeps every *.test.ts in the repo (12 tutorial example tests plus gitignored downloads_dev), so the mod's gate is check-mod.sh on a fresh scratch staging copy holding only .claude-plugin/plugin.json and hooks/; mod tests live in hooks/tests/; tutorial tests are not renamed. (2) $.state needs a manifest types contract, so the recent typed messages live in a module variable with $.ui.invalidate (resets on /clear and on a module reload); the switch stays in $.store. Recording rule measured from the 2.1.309 types: next.origin.plugin engine, e.origin.kind composer, no e.command, not isMeta, not starting with '/'.
- Done: b17e4b5 (user ruling: live check driven with the Anthropic computer-use skill, folded into quickstart step 8 and the house conventions). Skills worker output uncommitted pending fixes. Open follow-ups from reviews: drafts.py realpath project match with a symlink test, --limit >= 1, negative-offset date, path cell escaping, search header, a contract test on a mod-written draft, README and CHANGELOG rows, ruff/mypy and CPV on the new skills; live-check wording: human runs it by hand and an agent uses computer use, mark the renderer finding as observed, tool names as examples, align agents/mods-expert-developer-agent.md line 161.
- Live-check docs commits under this card: b17e4b5 (section and step 8 sentence), be732a4 (embedded TOC line, raised by the TRDD-H26OG8AP session), 1bfccce (reworded as scoped observations), 94d1778 (two wording fixes made by the TRDD-H26OG8AP session at this card's request). house-conventions.md and the quickstart SKILL.md are edited only after telling that session (agreed 2026-10-23).
- 2026-10-23 secret-check trade-offs left to the user: ordinary text after a credential name with 16+ characters, and slash lists after 'basic', are refused with no save-anyway path; accepted gaps: a lowercase dotted passphrase, an all-caps $PASSWORD, a quoted JSON Basic header with a letters-only token, passphrase= and aws_credentials= names, short passwords under 8 characters.
- 2026-10-23 hooks.json carries an empty settings 'hooks' object beside 'modules' only to satisfy CPV's required-hooks check; the mods reference allows both keys.
- 2026-10-23: all follow-ups in the "Done: b17e4b5 ... Open follow-ups from reviews" bullet are done in 96fac93, 4de69c6 and 1f3c768; the CHANGELOG row was dropped because publish.py regenerates CHANGELOG.md with git-cliff.
- 2026-10-23: superseded — the recent typed messages and saved rows no longer live in one module variable; since 87f9560 they are maps keyed by $.session.id().
- 2026-10-23 accepted gaps, added after review: a value with a / that ends in a file extension is exempt (password=S3cr3t/pass.word); a raw / inside a URL password ends the authority early (postgres://admin:ab/cd@db); the UserMessage render awaits $.session.id() with no catch.
- 2026-10-23 live check at a1d4648 (terminal, fullscreen CLAUDE_CODE_NO_FLICKER=1, tmux SGR click): with the empty 'hooks' object in hooks.json the mod loaded and drew '+ save as requirement draft' under the typed message; one click saved it and the row turned into '✓ saved as requirement draft 20261023_231950+0200-14c4b806242c'; /requirements-drafts-save saved a second message (20261023_232124+0200-b0da7aba0411); drafts.py list --all showed both. Observed: a command save marks no row, because the command path has no message id. Report: reports/mods-forge-agent/20261023_232145+0200-requirements-drafts-live-check-a1d4648.md.
- 2026-10-23 AI review: the implementation commits from ac621e6 on went through adversarial review forks in rounds, not one fork per commit (not verified commit by commit); findings were applied or recorded as accepted gaps where noted on the card; worker reports are in reports/requirements-drafts/ and reports/mods-forge-agent/ (local, gitignored), and review findings were returned inline. The card commits 3161a9b and 62d4517 were reviewed too; their follow-ups were applied in the next card commit.
