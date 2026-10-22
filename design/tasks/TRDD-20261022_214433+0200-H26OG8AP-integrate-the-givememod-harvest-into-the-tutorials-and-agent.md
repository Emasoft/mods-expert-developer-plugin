---
trdd-id: H26OG8AP
title: Integrate the givememod harvest into the tutorials and agents
column: todo
status: tasked
created: 2026-10-22T21:44:33+0200
updated: 2026-10-22T23:46:58+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: user
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: user
approval-datetime: 2026-10-22T21:44:33+0200
---

# Integrate the givememod harvest into the tutorials and agents

## STATE
CURRENT STATE 2026-10-22: harvest done (report: reports/givememod-harvest/20261022_213641+0200-harvest.md); not started. Sequenced AFTER TRDD-BNBDNR2V (mod-builder adoption, 0.4.0) and TRDD-JFB5E98B (lint exclusions), because the increments add files to the same tutorial folders. NEXT ACTION (after TRDD-71SH1V5W): increment I-1 (engine-traps.md). Order: TRDD-JFB5E98B, then TRDD-BNBDNR2V, then TRDD-71SH1V5W, then this card. Before I-1, extend tests/test_plugin_structure.py so the quickstart tutorial may hold references/. Line references FORGE:nn/QS:nn date from the harvest; re-locate by text (the menu is now skills/mods-the-skills-menu). Identity fields created-by/approval-judge read `user` only because trddgrep cannot change them; the main agent minted this card.

## User directive (verbatim)
> here is another plugin with a treasure trove of techniues, ideas, skills, informations, tricks, etc. I'm not interested in the skill per se (the ability to automatically create a custom mod based on the analysis of the session , to improve the workflow next time the same issues are encountered). Instead i'm interested in all the ideas that are included  and used to achieve such feat. there are many precius things scattered all across all the files and scripts and skills/reference/templates/examples/etc. I want you to harvest the best ones and to integrate those into our plugin.
> https://github.com/timoncool/givememod
<!-- cspell:ignore techniues precius -->

## Decisions
- Licence: givememod is MIT (timoncool); its official samples are Apache-2.0 and community examples MIT per folder. Facts and techniques are rewritten in our own words and code; no code or template is copied. A no-copy proof per increment (identifier grep, jscpd, 8-word prose check) against downloads_dev/givememod-src/repo, as in BNBDNR2V. At most one idea-credit line in NOTICE.
- Every row we add is tagged CHAPTER (with the chapter cite), UPSTREAM (with the URL) or UNVERIFIED. Nothing UNVERIFIED is stated as fact.
- Rejected W6 (the 7 s streaming workaround around the hook time limit): a bypass of a documented limit.
- Rejected W7 (session authorize + undocumented endpoints): credential handles and undocumented endpoints are wrong for a tutorial.
- Rejected W5 headline counts: author counts, not reproduced, never quoted.
- Rejected W10 workflow (star-history): broad contents write, unpinned action, not for us.
- Rejected, the "not recommended" list at the end of report section 7: H06 (unasked offers), H07 as a table, H49 to H52 as examples, H29, H48, any copy of a template or helper kit, the FAVORITES.md file, the star-history workflow, the site generator.
- W1: issue 99423 is closed; never import it as open. W2/W8: keep FORGE's "Button has no variant" until a types file proves otherwise.
- No-copy proof per increment goes to reports/givememod-harvest/<timestamp>-I-n-no-copy.md; its one-line result is recorded in the approval log when the box is ticked.
- The W2 rule (Button has no variant until a types file proves otherwise) applies to I-6 too.
- No PRRD exists (design/requirements/PRRD.md absent), so no relevant-rules.

## Increments
- [ ] I-1 — New skills/mods-tutorial-quickstart/references/engine-traps.md (symptom, cause, fix table in five sections, rows tagged; stale claims and open issues tables with a checked-on date; QS link row) — files: skills/mods-tutorial-quickstart/references/engine-traps.md (new), skills/mods-tutorial-quickstart/SKILL.md — covers: H08, H09, H10, H11, H13, H14, H15, H16, H16b, H19, H20, H21, H22, H23, H24, H25, H26, H27, H28, H33, H35, H39, H58, H59
- [ ] I-2 — Preflight and built-in-guard section (sec-default skip list with upstream URL, restore-on-turn.start pattern, preflight checklist), first section of engine-traps.md, plus a 6-line Preflight paragraph in FORGE and EXPERT — files: engine-traps.md, agents/mods-forge-agent.md, agents/mods-expert-developer-agent.md — covers: H04, H18, H19, H20, H44
- [ ] I-3 — Guard craft and how-to-tell-the-model notes in the call-intercept tutorial (ten guard moves, realPath allow-list kept UNVERIFIED, refusal that teaches, note-on-result channel, wait-inside-$ idiom); apply in protect-files if BNBDNR2V B is open — files: skills/mods-tutorial-call-intercept-mods/SKILL.md (and the protect-files example) — covers: H11, H12, H17, H40, H41, H42, H44
- [ ] I-4 — New skills/mods-tutorial-quickstart/references/mod-review.md (our wording and level names, calls-and-hooks tables, report format) and a review-a-mod mode in EXPERT — files: skills/mods-tutorial-quickstart/references/mod-review.md (new), agents/mods-expert-developer-agent.md — covers: H61, H62, parts of H45
- [ ] I-5 — New skills/mods-tutorial-quickstart/references/cost-and-cache.md (cache-prefix changes, where model calls multiply and the gates, fork versus complete, how to measure); Tokens per turn / Cache impact / Off switch lines join the hand-over text — files: skills/mods-tutorial-quickstart/references/cost-and-cache.md (new), FORGE report contract line — covers: H45, H46, H47
- [ ] I-6 — Interface tutorial notes (share the band with a stack test, fit width by dropping, restyle built-in rows, cheap redraw rules, surface fallback first, the glyph set); coordinate with BNBDNR2V D, same file — files: skills/mods-tutorial-interface-mods/SKILL.md — covers: H03, H05, H30, H31, H32, H34, H36, H37, H38, H67
- [ ] I-7 — New skills/mods-tutorial-quickstart/references/testing-recipes.md (spawn generator stub, anchored find, one-string captions, turn.step driving, world helper, pure-core rule); link from QS step 6 — files: skills/mods-tutorial-quickstart/references/testing-recipes.md (new), skills/mods-tutorial-quickstart/SKILL.md — covers: H53, H54, H55, H56
- [ ] I-8 — API-index script: read the types file written after a load, print one-line tables, exit non-zero when a pattern matches nothing; one fixture-based pytest — files: 1 script, 1 test, README row, menu/catalog row (same area as BNBDNR2V A and F) — covers: H63
- [ ] I-9 — Agent text corrections after the owner-run checks: FORGE:48 and FORGE:62 wording about /plugin-types, FORGE:44 Button note, QS:43 and QS:45 rows — files: agents/mods-forge-agent.md, skills/mods-tutorial-quickstart/SKILL.md — covers: H01, H10, H16b, H41, W2
- [ ] I-10 — Small additions: README where-to-find-more-mods line; favorites route with disable commands in keep-mod.sh hand-over text (BNBDNR2V A); rename-surface list as new-mod.sh checklist (BNBDNR2V A) — files: README, BNBDNR2V A scripts — covers: H57, H65, H66

## Owner-run checks
- [ ] Read the types file written after an interactive load (.claude-plugin/types/claude-code/index.d.ts, line 1 is the version) and confirm: $.fs.stat resolve:true and realPath (H41, QS:45); Button props variant and role (W2); Raster limits (W8); ui.render prop names suffix, modes, tail (H32, H05); session.surfaces (H36); the context field on a tool.call result (H44). Owner: I-3, I-6, I-9.
- [ ] Run claude plugin validate --help and note whether --json exists (H61). Owner: I-4.
- [ ] In a real session, test $.command.run({command:'compact'}) and $.prompt.submit({text:'/compact'}) from a command hook and from a turn-waited hook (H16, H16b). Owner: I-1, I-9.
- [ ] Re-check the open issues with gh api repos/anthropics/claude-code/issues/<n> --jq .state before quoting any status (H19). Owner: I-1, I-2.
- [ ] On a machine with managed settings or a Team or Enterprise sign-in, install a mod that hooks prompt.context and classic.SessionStart and confirm they do not run (H18). Owner: I-2.

## Acceptance checklist
- [ ] Each increment committed separately, reviewed, with its no-copy proof saved under reports/.
- [ ] tests/test_plugin_structure.py allows references/ (and scripts/ per BNBDNR2V) inside the quickstart tutorial, deliberately.
- [ ] uv run pytest, CPV strict (cpv-remote-validate plugin . --strict) and CI pass with no exclusion and no waiver.
- [ ] README, menu and catalog list any new reference file.

## Approval log

- 2026-10-22T21:44:33+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 orchestrator: identity fields corrected from `user`; the card was minted by the main agent under the owner's directive quoted above and the owner's 'decide yourself' instruction; the owner has not reviewed this plan and may veto.
- 2026-10-22 orchestrator: created-by and approval-judge still read `user`: trddgrep refuses to change them (write-once / create-path only); current-owner and assignee were changed.
- 2026-10-22 orchestrator: follow-up from TRDD-JFB5E98B — CI lints changed files only, so the first increment here that adds or edits a file under skills/mods-tutorial-*/examples is the first CI run of SPELL_CSPELL, MARKDOWN_MARKDOWNLINT and BASH_SHFMT on the examples; read that run's MegaLinter log and confirm those three ran and passed.
- 2026-10-22 orchestrator: the pre-I-1 extension of tests/test_plugin_structure.py also applies the two pre-existing ruff format hunks in test_load_guard_detects_references_and_stray_manifests.
- 2026-10-22 orchestrator: correction. The CI-parity follow-up for new example files moved to TRDD-BNBDNR2V increment 2. What stays here: the verbatim BeLazy167 copies (hello-mod, redact-output, dice-tool, branch-band, notes-pane) are linted in CI only when one of them is edited. The first increment here that edits one must confirm SPELL_CSPELL, MARKDOWN_MARKDOWNLINT and BASH_SHFMT ran on it.
- 2026-10-22 orchestrator: the two ruff format hunks are already applied in 7c3a79e; nothing left to do.
- 2026-10-22 — queue order: this card now waits for TRDD-71SH1V5W (karanb192 mod-builder harvest), which waits for TRDD-BNBDNR2V; the order is the main agent's reading of the user's directive, offered to the user for veto.
