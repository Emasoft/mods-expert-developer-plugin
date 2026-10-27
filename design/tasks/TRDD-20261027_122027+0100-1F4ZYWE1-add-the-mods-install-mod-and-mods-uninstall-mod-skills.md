---
trdd-id: 1F4ZYWE1
title: Add the mods-install-mod and mods-uninstall-mod skills
column: dev
status: tasked
created: 2026-10-27T12:20:27+0100
updated: 2026-10-27T12:20:27+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T12:20:27+0100
---

# Add the mods-install-mod and mods-uninstall-mod skills

## User words (verbatim)

> create a skill called install-mod and another skill called uninstall-mod. those two skills must accept as argument the approximate or incomplete name of mod plugin, with or without the marketplace name, and identify from that the exact plugin name and marketplace name. in case asking the user for confirmation or listing the installed plugins with the most similar names, and asking the user to pick the one to uninstall. once the user pick the plugin to uninstall, it must uninstall it using the cli claude with `claude plugin uninstall <plugin name>@<marketplace name> ` (or with the owner/repo form of the marketplace, see `claude plugin uninstall --help`), and after the uninstall it must execute the `/reload-plugins --force` command using the skill to send commands via mods. the install skill should do the opposite, that is it should accept the exact plugin name and marketplace or the plugin github repo and marketplace repo, and install first the marketplace (or updating it if lready installed) and then the plugin. all via clude cli (`claude plugin marketplace --help` and `claude plugin install --help` for details) and then execute `/reload-plugins --force` again.
> the mods prefix could be useful to easily recognize the skills of the plugin

<!-- cspell:ignore lready clude -->

## Design summary

- Two user-invocable tool skills of mods-expert-developer-plugin: skills/mods-install-mod and skills/mods-uninstall-mod, each with SKILL.md and agents/openai.yaml. The mods prefix follows the second user message.
- Uninstall: claude plugin list --json, a shortlist by normalized containment (lowercase, without spaces, hyphens, underscores and dots) of at most 10 rows, scope checks (user; local only for the current folder; synced refused), the user confirms or picks one, a keep-data answer, then claude plugin uninstall with the id, the scope and --json, then the reload.
- Install: exact forms only; the marketplace is matched by name or repo, updated when present and added otherwise; the plugin is found in claude plugin list --available --json; claude plugin install runs with --json and no -y; a shownCommand is shown with its sha256 and needs a yes before -y; then the reload.
- Reload: the run tool with command reload-plugins and args --force, as the last call of the turn. When the tool is absent, the last line is FAILED: reload not run (reason; turn the developer tools on with /mods-dev-tools on, then start a new session).
- Step A is done: the run tool is gated by /mods-dev-tools and refuses send and mods-dev-tools.
- Routing: mods-expert-developer-agent gets one body bullet. The preload list and the chapter index are not changed. The menu gets a Mod install and uninstall group in SKILL.md and in the catalog.
- Tests: PLUGIN_TOOL_SKILLS in tests/test_plugin_structure.py and tests/test_skills_menu.py, excluded from DOC_SKILLS and CHAPTER_DIRS, user-invocable, with a copies-agree test; the skill directory count goes from 67 to 69.

## Disclosed additions (not in the user words)

- The keep-data question on uninstall: keep the plugin data (recommended), delete it, or cancel.
- Never -y without asking: install passes -y only after the user confirms the shownCommand and its sha256; uninstall never passes -y.
- Refusals: a synced-scope candidate is refused; a local-scope candidate counts only for the current folder; an install needs both the plugin and the marketplace, so a plugin repo alone is not accepted.
- The id check accepts capitals, because real marketplace names contain them (for example GhostScientist-skills).
- allow_implicit_invocation is false in both agents/openai.yaml files: a judgment that installing and uninstalling plugins follows an explicit user request, not a model choice. Flip it if the owner wants the model to invoke them.
- jq is a hard prerequisite.

## Owner-run checks (not run by the agent)

- [ ] Terminal, live reload: with /mods-dev-tools on and a new session, run mods-install-mod on a test plugin; confirm that /reload-plugins --force runs when the turn ends and that the plugin list changes.
- [ ] Terminal, live uninstall: run mods-uninstall-mod on the same plugin with keep-data; confirm the reload afterwards.
- [ ] Claude Code Desktop: repeat both checks there.
- [ ] Turn /mods-dev-tools off and confirm that the FAILED line appears instead of a reload.
- [ ] The run tool belongs to TRDD-GF5UDFWI (Step A); this card does not set blocked-by.

## Approval log

- 2026-10-27T12:20:27+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
