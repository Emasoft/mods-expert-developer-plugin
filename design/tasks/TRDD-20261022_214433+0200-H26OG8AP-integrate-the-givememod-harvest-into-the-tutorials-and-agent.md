---
trdd-id: H26OG8AP
title: Integrate the givememod harvest into the tutorials and agents
column: dev
status: tasked
created: 2026-10-22T21:44:33+0200
updated: 2026-10-23T07:05:55+0200
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
CURRENT STATE 2026-10-23: TRDD-71SH1V5W is in human_review (only owner-run boxes left), so this card starts. A reconciliation of every harvest row against HEAD (reports_dev/20261023-h26-reconciliation.md, local, gitignored) replaced the harvest-time plan I-1..I-10 with R-1..R-9 below: one new file (references/engine-traps.md); the planned mod-review.md, cost-and-cache.md and testing-recipes.md are dropped because review-checklist.md, threat-model.md and house-conventions.md (added by TRDD-71SH1V5W) already cover them, and their gaps become extensions of those files; the api-index script is deferred. The old instruction to extend tests/test_plugin_structure.py first is void: the placement rule polices only code suffixes (CODE_SUFFIXES), so a quickstart references/*.md is already allowed (three ship). Harvest line references FORGE:nn/QS:nn are stale; re-locate by text. The dated checks ran 2026-10-23T04:14:28+0200 (gh api): issues 92533, 100837, 100797, 99395, 99217, 101089 and 101090 open, 99423 closed; mods/sec-default/hooks/register.ts fetched as blob 72e0324 (210 lines). R-1 done 2026-10-23 (ec28949, d10349d; evidence in the Approval log). NEXT ACTION: R-2. The quickstart SKILL.md body is about 4813 estimated tokens against CPV's 5000 limit (tiktoken o200k_base times 1.3, calibrated on one point): re-measure before R-5 and R-8 add text near it. Re-run the dated issue checks before quoting any issue status on a later day. Identity fields created-by/approval-judge read `user` only because trddgrep cannot change them; the main agent minted this card.

## User directive (verbatim)
> here is another plugin with a treasure trove of techniues, ideas, skills, informations, tricks, etc. I'm not interested in the skill per se (the ability to automatically create a custom mod based on the analysis of the session , to improve the workflow next time the same issues are encountered). Instead i'm interested in all the ideas that are included  and used to achieve such feat. there are many precius things scattered all across all the files and scripts and skills/reference/templates/examples/etc. I want you to harvest the best ones and to integrate those into our plugin.
> https://github.com/timoncool/givememod
<!-- cspell:ignore techniues precius -->

## Decisions
- Licence: givememod is MIT (timoncool); its official samples are Apache-2.0 and community examples MIT per folder. Facts and techniques are rewritten in our own words and code; no code or template is copied. A no-copy proof per increment against downloads_dev/givememod-src/repo (method superseded 2026-10-23, see the no-copy decision below). At most one idea-credit line in NOTICE.
- Every row we add is tagged CHAPTER (with the chapter cite), UPSTREAM (with the URL) or UNVERIFIED. Nothing UNVERIFIED is stated as fact.
- Rejected W6 (the 7 s streaming workaround around the hook time limit): a bypass of a documented limit.
- Rejected W7 (session authorize + undocumented endpoints): credential handles and undocumented endpoints are wrong for a tutorial.
- Rejected W5 headline counts: author counts, not reproduced, never quoted.
- Rejected W10 workflow (star-history): broad contents write, unpinned action, not for us.
- Rejected, the "not recommended" list at the end of report section 7: H06 (unasked offers), H07 as a table, H49 to H52 as examples, H29, H48, any copy of a template or helper kit, the FAVORITES.md file, the star-history workflow, the site generator.
- W1: issue 99423 is closed; never import it as open. W2/W8: keep FORGE's "Button has no variant" until a types file proves otherwise.
- No-copy proof per increment goes to reports/givememod-harvest/<timestamp>-R-n-no-copy.md; its one-line result is recorded in the approval log when the box is ticked.
- The W2 rule (Button has no variant until a types file proves otherwise) applies to R-6 too.
- No PRRD exists (design/requirements/PRRD.md absent), so no relevant-rules.
- 2026-10-23 decision: the no-copy proof is scripts_dev/nocopy_diff.py on each commit's added lines against every file of downloads_dev/givememod-src/repo (0 unexplained shared 8-word runs, every shared 6-word run judged, as in TRDD-71SH1V5W), plus a grep of the added lines for names givememod invented (its helper and constant names such as world(, once(, BAND, PANE; its template names; its reach level names), each hit judged; jscpd runs on any increment that adds a code file or a code block longer than 10 lines. It replaces the method of the Licence line because the increments are mostly prose: the run check compares code tokens verbatim but misses renamed near-clones and single invented names, which jscpd and the name grep cover.
- 2026-10-23 decision: TUI and Desktop parity (agents/mods-forge-agent.md: no Raster, Image or Svg, one render path) wins over H34, H35 and H36: the Svg and Raster desktop measurements and the branch-on-surface-first advice are dropped or reduced to one sentence saying why the plugin forbids them; what serves parity stays (Client placeholder caveat, empty session surfaces means headless, the redraw rules that need no surface-specific API).
- 2026-10-23 decision: R-1 adds the single NOTICE idea-credit line for givememod (MIT, timoncool), with no code or text copied.
- 2026-10-23 decision, coverage of rows in no R row (from the reconciliation, reports_dev/20261023-h26-reconciliation.md): H02 covered by the quickstart SKILL.md step that picks another tool; H41 covered by the quickstart realPath trap row, threat-model.md and review-checklist.md, still UNVERIFIED until owner-run check 1; H54 covered by the house-conventions.md section on pure logic in logic.ts; H51 dropped (harvest not-recommended); H48 dropped, keeping the not-recommended decision above. H20 and H59 are split: R-1 holds the fact rows, R-2 the Windows preflight line, R-4 the hygiene check.

## Increments
- [x] R-1 — New skills/mods-tutorial-quickstart/references/engine-traps.md, indexed by symptom (does not load, hook misbehaves, state and timers, drawing, platform), with an open-issues table carrying the date the check ran and a stale or conflicting claims list; rows already in the quickstart SKILL.md traps table or the house-conventions UNVERIFIED table are linked, not restated; rows follow the house-conventions format (claim, tag, settle by); one Resources entry with anchors in the quickstart SKILL.md; the one NOTICE idea-credit line — covers: H08 rest, H09, H10, H13, H14, H15, H16, H19, H20-H25, H26, H27, H28, H33, H35 (parity-safe part), H38, H39, H49 (as rows, not examples), H52 (as a row), H58, H59, W1, W2, W3, W8
- [ ] R-2 — Preflight and built-in guard facts: a Preflight bullet in house-conventions.md (before the mod exists), the sec-default skip list and the session.compact line in threat-model.md, one pointer line each in FORGE and EXPERT — covers: H03, H04, H18, H20, H47
- [ ] R-3 — Guard craft in skills/mods-tutorial-call-intercept-mods/SKILL.md (guard moves, refusal that teaches, wait inside a $ call, long-flag pattern tests, tool-result note) plus a channel row in house-conventions.md; W6 and W7 stay out; protect-files untouched (a shipped, tested example from TRDD-BNBDNR2V; changing it is outside this harvest) — covers: H11, H12, H17, H40, H42, H44
- [ ] R-4 — Review additions to review-checklist.md (verdict words and reach levels, hygiene check) and threat-model.md (chain-order exposure); replaces I-4 — covers: H59, H61, H62
- [ ] R-5 — Cost and cache gates as a house-conventions.md subsection, hand-over lines, and one FORGE report-contract line; replaces I-5 — covers: H45, H46
- [ ] R-6 — Interface tutorial notes in skills/mods-tutorial-interface-mods/SKILL.md (share the band, drop by priority to fit width, restyle built-in rows, cheap redraw rules, decide the fallback first, language rule, tune-it table) and house-conventions.md look rules — covers: H05, H30, H31, H32, H34 (parity-safe part), H36 (parity-safe part), H37, H67
- [ ] R-7 — Test recipes and live-check rows in the house-conventions.md UNVERIFIED table; ui.find and turn.step written without the $. prefix; replaces I-7 — covers: H53, H55, H56
- [ ] R-8 — Agent and quickstart corrections after the owner-run checks: FORGE /plugin-types wording, EXPERT, quickstart step 3, the opposing claim beside the compaction trap row (its Status wording stays: the reference chapter lists compact in the $.session row), the token-weather note; the quickstart notice paragraph pinned by tests/test_plugin_structure.py is not edited; FORGE "Button has no variant" stays (W2) — covers: H01, H16b, W4
- [ ] R-9 — Small additions: README where-to-find-more-mods line, rename surface and favorites route in house-conventions.md, git-poller note (--no-optional-locks, after checking) — covers: H50, H57, H65, H66
- Deferred, not part of this card: the api-index script (H63) is TRDD-JTX0H03Y (backburner); it needs a types file from a logged-in build.

## Owner-run checks
- [ ] Read the types file written after an interactive load (.claude-plugin/types/claude-code/index.d.ts, line 1 is the version) and confirm: $.fs.stat resolve:true and realPath (H41, QS:45); Button props variant and role (W2); Raster limits (W8); ui.render prop names suffix, modes, tail (H32, H05); session.surfaces (H36); the context field on a tool.call result (H44). Owner: R-3, R-6, R-8.
- [ ] Run claude plugin validate --help and note whether --json exists (H61). Owner: R-4.
- [ ] In a real session, test $.command.run({command:'compact'}) and $.prompt.submit({text:'/compact'}) from a command hook and from a turn-waited hook (H16, H16b). Owner: R-1, R-8.
- [x] Re-check the open issues with gh api repos/anthropics/claude-code/issues/<n> --jq .state before quoting any status (H19). Owner: R-1, R-2. Done 2026-10-23T04:14:28+0200 by the main agent with gh api: 92533, 100837, 100797, 99395, 99217, 101089, 101090 open; 99423 closed. Re-run before quoting on a later day.
- [ ] On a machine with managed settings or a Team or Enterprise sign-in, install a mod that hooks prompt.context and classic.SessionStart and confirm they do not run (H18). Owner: R-2.

## Acceptance checklist
- [ ] Each increment committed separately, reviewed, with its no-copy proof saved under reports/.
- [x] tests/test_plugin_structure.py allows references/ (and scripts/ per BNBDNR2V) inside the quickstart tutorial, deliberately. Done before this card started: the placement rule _misplaced_example_code polices only CODE_SUFFIXES, so references/*.md pass, and scripts/*.sh are exempted one level deep in the quickstart only (checked 2026-10-23 in the reconciliation).
- [ ] uv run pytest, CPV strict (cpv-remote-validate plugin . --strict) and CI pass with no exclusion and no waiver.
- [ ] Each new reference file is linked from the quickstart SKILL.md Resources with its complete heading TOC, as house-conventions.md, review-checklist.md and threat-model.md are (none of the three is listed in README, the menu or the catalog).

## Approval log

- 2026-10-22T21:44:33+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 orchestrator: identity fields corrected from `user`; the card was minted by the main agent under the owner's directive quoted above and the owner's 'decide yourself' instruction; the owner has not reviewed this plan and may veto.
- 2026-10-22 orchestrator: created-by and approval-judge still read `user`: trddgrep refuses to change them (write-once / create-path only); current-owner and assignee were changed.
- 2026-10-22 orchestrator: follow-up from TRDD-JFB5E98B — CI lints changed files only, so the first increment here that adds or edits a file under skills/mods-tutorial-*/examples is the first CI run of SPELL_CSPELL, MARKDOWN_MARKDOWNLINT and BASH_SHFMT on the examples; read that run's MegaLinter log and confirm those three ran and passed.
- 2026-10-22 orchestrator: the pre-I-1 extension of tests/test_plugin_structure.py also applies the two pre-existing ruff format hunks in test_load_guard_detects_references_and_stray_manifests.
- 2026-10-22 orchestrator: correction. The CI-parity follow-up for new example files moved to TRDD-BNBDNR2V increment 2. What stays here: the verbatim BeLazy167 copies (hello-mod, redact-output, dice-tool, branch-band, notes-pane) are linted in CI only when one of them is edited. The first increment here that edits one must confirm SPELL_CSPELL, MARKDOWN_MARKDOWNLINT and BASH_SHFMT ran on it.
- 2026-10-22 orchestrator: the two ruff format hunks are already applied in 7c3a79e; nothing left to do.
- 2026-10-22 — queue order: this card now waits for TRDD-71SH1V5W (karanb192 mod-builder harvest), which waits for TRDD-BNBDNR2V; the order is the main agent's reading of the user's directive, offered to the user for veto.
- 2026-10-23T04:16:06+0200 — column → dev. reconciled plan R-1..R-9 recorded; TRDD-71SH1V5W in human_review
- 2026-10-23 R-1 done: ec28949 (first cut) and d10349d (size and rewording fix). No-copy proof PASS in reports/givememod-harvest/20261023_065444+0200-R-1-no-copy.md (0 unexplained 8-word runs; every 6-word run judged; 0 givememod-invented names). Clean-clone CPV on d10349d: v5.22.3 strict CRITICAL/MAJOR/MINOR/NIT all 0 (exit 0); v5.23.0 has the 694d70d baseline's six findings (MAJOR=5, MINOR=1), no new one; its .sh-count WARNING reads 5 not 4 because of skills/mods-tutorial-quickstart/scripts/plan-diff.sh (56008d5, TRDD-71SH1V5W I-6), not R-1. The commit message's pytest, markdownlint and cspell results were measured on the working tree before commit.
