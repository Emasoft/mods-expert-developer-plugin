---
trdd-id: BDY6ZNDZ
title: Add mods tutorial skills from BeLazy167 claude-mods-skill
column: todo
status: tasked
created: 2026-10-22T20:24:37+0200
updated: 2026-10-22T20:28:56+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-22T20:24:37+0200
---

# Add mods tutorial skills from BeLazy167 claude-mods-skill

## User directive (verbatim, 2026-10-22)
"you must also add this skills, adding them to the skills corpus to learn the mods. call it tutorials skills, since they include examples projects and quickstart skills to create mods (but you must make it clear that is not something that can replace the main mods skills of the plugin.. they are just a sort of tutorial for the agents or am reference examples. strip them of things that are already in the plugin skills, and make them s kills with the name tutorial in them. use subfolders of the skills to put the code of the examples, to make clear that those examples are to be read, not to be installed as part of the plugin. https://github.com/BeLazy167/claude-mods-skill"

## Source
github.com/BeLazy167/claude-mods-skill at 396f0d4 (MIT), cloned to downloads_dev/claude-mods-skill (untrusted data). Contents: skills/creating-mods/SKILL.md (workflow, example table, quick reference, loader rules, sharing), references/gotchas.md (Loading, Semantics, Rendering, Testing, Distribution), references/examples.md (public mods to read), examples/{hello-mod, redact-output, branch-band, notes-pane, dice-tool} (each a full mod with tests), scripts/check.sh.

## Design
- Provisional skill names (see the provisional rule below), every name contains "tutorial": mods-tutorial-quickstart (the copy-validate-test-typecheck-prove-ship workflow, quick reference and loader rules, minus anything the chapters already state), mods-tutorial-common-traps (gotchas not already in mods-doc-mods-troubleshooting / mods-doc-mods-reference), and one per example: mods-tutorial-block-a-tool-call (hello-mod), mods-tutorial-rewrite-tool-output (redact-output), mods-tutorial-band-above-the-prompt (branch-band), mods-tutorial-command-and-pane (notes-pane), mods-tutorial-model-callable-tool (dice-tool). Only Anthropic's own sources from the public-mods reading list fold into the quickstart's references (see the reading-list rule below).
- Each tutorial SKILL.md opens with a fixed notice: tutorial and reference example only; the mods-doc-* chapter skills are the authoritative source and win on any disagreement; the example code is to be read, never installed or loaded.
- Example code lives in a subfolder of its tutorial skill: skills/<tutorial>/examples/<example>/... . Before choosing the exact layout, MEASURE whether a nested .claude-plugin/plugin.json or hooks/hooks.json under skills/ is picked up by Claude Code, `claude plugin validate .`, `claude plugin test .`, CPV strict, or CI (MegaLinter jscpd/cspell); if any of them treats the copy as live, neutralise it (for example store the manifest and hooks.json under a name with an .example suffix) and say so in the skill.
- Strip overlap: compare every section against mods-doc-mods-basic-examples, mods-doc-mods-development, mods-doc-mods-testing, mods-doc-mods-troubleshooting, mods-doc-mods-api, mods-doc-mods-reference; keep only what they lack and link the chapter for the rest. Version claims (2.1.287, 2.1.290) are checked against the chapters; a claim the chapters contradict is dropped.
- Drop the source's install/marketplace instructions and references to other external plugins; the built-in plugin-authoring skill may be mentioned as Claude Code's own.
- NOTICE gets the source's MIT copyright line and permission text.
- The skills menu (cpv-the-skills-menu) lists the tutorials in their own group labelled reference-only; tests exclude tutorials from the chapter-enumeration checks through one named set and pin: every tutorial name contains "tutorial", each opens with the notice, examples live only under examples/ subfolders.
- Sequencing: starts after the mods-forge-agent build is committed (both edit skills/, the menu and the same tests); ships in the same 0.3.0 release.
The seven skill names are provisional: after the overlap check, a tutorial with less than about one screen of unique prose is merged into another tutorial, keeping its example code, which is the unique value.
If the measurement forces renaming the nested manifest or hooks.json, each tutorial states in one line which files to rename back after copying the example, so a copied example is runnable.
Reading list: keep only Anthropic's own sources (the mods docs and the built-in mods source); drop the community catalogue and third-party mod links, per the earlier directive to remove references to other external mods or plugins.
API claims from the source (for example $.command.run({command:'compact'}), atom/read/update from 'claude-code', one plain hook per event per module, types laid under .claude-plugin/types/) are checked against the mods-doc chapters; a claim the chapters do not confirm is marked UNVERIFIED or dropped, never stated as fact.
Executor: the plugin's own agents - mods-forge-agent once installed, mods-expert-developer-agent until then; the orchestrator commits a checkpoint before each dispatch.

## Acceptance checklist
- [ ] Measurement report on nested manifests saved under reports/measure/.
- [ ] Each tutorial skill in the final (post-merge) list exists, its name contains "tutorial", and its SKILL.md opens with the reference-only notice.
- [ ] Example code only under skills/<tutorial>/examples/, inert per the measurement.
- [ ] Overlap stripped; each removed topic links its chapter skill.
- [ ] NOTICE carries the MIT text for BeLazy167/claude-mods-skill.
- [ ] Menu and README list the tutorials as reference-only.
- [ ] uv run pytest, claude plugin validate ., CI-parity linters and cpv-remote-validate plugin . --strict at v5.22.3 pass with no waiver.
- [ ] claude plugin test . at the plugin root does not collect the example tests (measured).
- [ ] tests/test_plugin_structure.py's skill-folder count is updated deliberately to the final number.

## Approval log

- 2026-10-22T20:24:37+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22T20:24:41+0200 — column → todo by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22 - authority: the user's directive quoted verbatim under User directive; mandated-by stays none because trddgrep set refuses that field.
