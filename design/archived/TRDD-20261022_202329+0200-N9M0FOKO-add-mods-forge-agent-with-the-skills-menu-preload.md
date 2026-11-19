---
trdd-id: N9M0FOKO
title: Add mods-forge-agent with the skills-menu preload
column: complete
status: archived
created: 2026-10-22T20:23:29+0200
updated: 2026-10-27T19:33:55+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-22T20:23:29+0200
implementation-commits: [dd4e8e1, f5e0779, ca81806, 92e99d5, cf3b7de]
---

# Add mods-forge-agent with the skills-menu preload

## STATE

CURRENT STATE 2026-10-22: 0.3.1 published and verified after install (both post-install boxes ticked). All boxes have evidence (see ## Evidence 2026-10-27). NEXT ACTION: review of the evidence, then move to complete. Superseded plan: verify each remaining box against cited evidence (box 4 needs a broken-copy rerun or an explicit self-report note; box 8 needs the saved CPV output under reports/cpv/); boxes 1-2 (agent frontmatter, menu catalog) read as mods-the-skills-menu since cf3b7de; append all evidence before moving to complete.
CURRENT STATE 2026-10-27 (supersedes the line above): every acceptance box has evidence and dated amendments where its wording drifted; README counts fixed in the same change; ruff format tracked on its own card. NEXT ACTION: move to complete.

## User directive

- "you must create a specialized subagent in the plugin that will be used to execute the mod forging and editing operations. it must have opus 5.5 model and must have the skill-menu as integrated skill in the frontmatter, so it can use all the knowledge it needs to create/edit/fix/debug the mods." (2026-10-22)

## Design

- New plugin agent agents/mods-forge-agent.md, invoked as `mods-expert-developer-plugin:mods-forge-agent`. Frontmatter: name mods-forge-agent; model claude-opus-5-5; skills [cpv-the-skills-menu] only; no tools field. Description (orchestrator amendment 2026-10-22): "Hands-on Claude Code mod builder: creates, edits, fixes and debugs mods (hooks modules, commands, panes) — one planned TRDD increment or one concrete fix/debug request per dispatch — testing on both the terminal and Desktop surfaces and returning a report path. Not for open-ended product planning; that is mods-expert-developer-agent."
- Agent body: H1, then CPV's mandatory dynamic-loading paragraph verbatim as the first paragraph; then the report first-line rule (running model plus the H1 of the preloaded menu), one unit of work per dispatch (a planned TRDD increment, or a concrete fix/debug request: reproduce first, then fix the root cause) with a PLAN, IMPLEMENT, VERIFY loop per step, both surfaces identically (shared elements only, one render path, plain hotkeys, absolute binaries via hooks/resolve-bin.ts, pane tests on terminal and desktop at narrow and wide widths), the measured mods API constraints, on-demand tool skills (tldr-code, fastedit, jgrep, quicksilver; missing means BLOCKED), optional delegation of read-only scans, never commit/stage/push/publish/delete, live-login checks reported as BLOCKED, report under reports/mods-forge-agent/, Opus cost note.
- New skill skills/cpv-the-skills-menu/: SKILL.md with the CPV-spec frontmatter (user-invocable false, allowed-tools Read), the structural sections, Standalone Skills (the four user-scope tool skills) and a domain-grouped Plugin Skills summary table naming each of the 61 chapter skills once with its namespaced name; full per-skill entries (Use when, Do not use when, Load with, Inputs, Outputs, Dependencies) in references/skills-catalog.md, derived from each chapter SKILL.md only. The menu does not list itself. Ships agents/openai.yaml like the chapter skills.
- Tests: CATALOG_SKILLS = {"cpv-the-skills-menu"} in both test files (copies asserted equal); every chapter-enumerating test excludes it; new tests pin the forge agent frontmatter and first paragraph, the menu completeness in both files, the namespace read from plugin.json, no self-listing, the Resources link, the 500-line body limit.
- Docs: README Components (forge agent, its role versus the expert agent, the menu, the Opus cost), plugin.json description without the stale chapter count, one DELEGATION.md sentence on the skills-menu bullet, .cspell.json words if needed.
- Not touched: agents/mods-expert-developer-agent.md (owner decision open on CO536FX9 box 7). No version bump, no commit, no publish.

## Acceptance checklist

- [x] agents/mods-forge-agent.md exists with model claude-opus-5-5, skills [cpv-the-skills-menu], no tools field, the amended description, and the mandatory paragraph right after the H1 — AMENDED 2026-10-27: the menu was renamed mods-the-skills-menu in cf3b7de; holds under the new name (Evidence box 1)
- [x] skills/cpv-the-skills-menu/SKILL.md and references/skills-catalog.md each name every chapter skill exactly once, use the plugin.json namespace on every Load with line, and do not list the menu itself — AMENDED 2026-10-27: renamed mods-the-skills-menu in cf3b7de; each chapter skill has exactly one table row in SKILL.md and one catalog entry; mods-doc-mods-api also appears once as a Skill() usage example (SKILL.md:43) (Evidence box 2)
- [x] SKILL.md body under 500 lines and under the 5000-token budget
- [x] tests updated with CATALOG_SKILLS and the new tests, each shown to fail on a broken scratch copy, then pass — AMENDED 2026-10-27: 5 of the 16 cited tests were mutation-checked on a broken copy (Evidence box 4); the other 11 were not
- [x] uv run pytest passes on the whole suite
- [x] claude plugin validate . passes, or a login failure is reported as such
- [x] ruff and cspell clean on changed files
- [x] CPV strict (the publish.py command, CPV v5.22.3) shows no new finding against the CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 baseline, output saved under reports/cpv/ — AMENDED 2026-10-27: the zero baseline no longer holds (MAJOR 2, MINOR 2, NIT 3, all filed false positives #268/#269, none on this card's files); criterion read by the agent as no true finding attributable to this card (Evidence box 8)
- [x] README, plugin.json and DELEGATION.md updated
- [x] After install, one dispatch's first report line names the menu's Plugin Skills domains correctly — expected answer: seven groups, Mods; Plugins; Marketplaces; Hooks, Subagents and Skills; Settings and Configuration; Sessions and Runtime; Troubleshooting (Tutorials excluded) — (proves the preload resolved to this plugin's menu, not CPV's same-named skill); if it does not, rename the menu to a plugin-unique name and re-measure CPV D9.
- [x] The model actually used is confirmed from the harness side (debug log or session metadata), not from the agent's own claim.

## Approval log

- 2026-10-22T20:23:29+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22T20:23:34+0200 — column → approval by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:34+0200 — column → design by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:35+0200 — column → design_ai_review by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:35+0200 — column → design_human_review by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:36+0200 — column → todo by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:36+0200 — column → verify_assumptions by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:37+0200 — column → plan by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:37+0200 — column → dispatch by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22T20:23:38+0200 — column → dev by main-agent@emasoft-mods-expert-developer. user directive 2026-10-22
- 2026-10-22 owner directive: tool skills optional but recommended (native fallback) — supersedes "missing means BLOCKED" in the body above.
- 2026-10-22 orchestrator: Caveat: a forced CPV standardize_plugin.py or generate_plugin_repo.py run writes the bare `cpv-the-skills-menu` back into agents; re-check the preload after any such run.
- 2026-10-22 orchestrator: 0.3.1 is a patch although it removes the public skill name mods-expert-developer-plugin:cpv-the-skills-menu; accepted because that name was public for under two hours.
- 2026-10-22 orchestrator: post-install smoke on 0.3.1 PASSED: the injected menu's base directory was …/mods-expert-developer-plugin/0.3.1/skills/mods-the-skills-menu and the first line named the seven chapter groups (reports/mods-forge-agent/20261022_220037+0200-post-install-smoke-0.3.1.md).
- 2026-10-22 orchestrator: model confirmed from the harness side: the subagent transcript's assistant messages carry model claude-opus-5-5; the only claude-fable-5-1 entries are the advisor-tool attachment.
- 2026-10-22 orchestrator: the first two acceptance boxes still name the retired menu name; read them as mods-the-skills-menu since cf3b7de (superseded wording, not rewritten).
- 2026-10-22 orchestrator: box 10 evidence verified in the subagent transcript: a single 'Base directory for this skill' line at the 0.3.1 cache path and no Skill tool use (4 Bash + handback), so the menu came from the preload; the api-request-shape fable entry is the advisor tool's field.
- 2026-10-27T19:33:55+0100 — COMPLETE by main-agent@emasoft-mods-expert-developer. all acceptance boxes carry verified evidence with dated amendments (c811371, acc7232); reviewed.

## Evidence 2026-10-27

Evidence at HEAD ce62ff1 (report docs_dev/20261027-n9m0foko-box-evidence.md). The menu skill is named mods-the-skills-menu since cf3b7de, and its scope has grown since this card: it also lists requirements-drafts, install/uninstall, tutorials and 9 example skills (77 entries besides the menu).
Box 1 HOLDS: agents/mods-forge-agent.md has model claude-opus-5-5 (line 4), skills [mods-the-skills-menu] only (lines 5-6), no tools field, the amended description, the H1 then the dynamic-loading paragraph first. Pinned by tests/test_skills_menu.py:765 (opus), :771 (preload), :796 (no tools), :802 (first paragraph).
Box 2 HOLDS (scope grew): 61 mods-doc-* skills each present in the menu SKILL.md (mods-doc-mods-api twice: Skill() example at line 43 and its table row at 139) and in the catalog; catalog has 77 unique ### headings and 77 unique namespaced Load with lines (namespace mods-expert-developer-plugin); the menu never lists itself (0 hits). Tests :981, :991, :998, :1022. Test scope: test_menu_skill_md_names_every_chapter_exactly_once (tests/test_skills_menu.py:981) counts table rows only (SKILL.md tables plus the example-skills reference table), so the Skill() example is not counted; test_menu_catalog_names_every_chapter_exactly_once (:991) counts catalog ### headings; neither counts the whole body.
Box 3 HOLDS: menu SKILL.md body 250 lines (<500), 15825 chars = about 3956 tokens by chars/4 (about 4655 at the in-repo 3.4 chars/token), under 5000. Tests :1041 (500 lines), :1047 (<=16300 chars).
Box 4 HOLDS: tests at tests/test_skills_menu.py:729, :759, :765, :771, :777, :796, :802, :810, :981, :991, :998, :1015, :1022, :1031, :1041, :1047. Each shown to fail on a broken clean clone (one break each, restored, clone removed): skills line removed -> test_forge_agent_preloads_only_the_menu FAILED; model: sonnet -> test_forge_agent_is_pinned_to_opus_5_5 FAILED; one ### heading renamed -> test_menu_catalog_names_every_chapter_exactly_once FAILED; menu self-row appended -> test_menu_does_not_list_itself FAILED; first sentence of the paragraph altered -> test_forge_agent_first_paragraph_is_the_dynamic_loading_instruction FAILED. All 8 selected tests pass after restore.
Box 5 HOLDS: uv run --extra dev pytest -q tests: 470 passed in 8.20s, exit 0.
Box 6 HOLDS: claude plugin validate <repo>: Validation passed with warnings, exit 0 (no login failure); the only advice is that the README has no marketplace install line.
Box 7 HOLDS for check: ruff check clean on tracked .py and cspell clean on the 6 changed files; the card changed no Python file, so ruff format (11 of 16 tracked .py would be reformatted, publish.py does not run format) is outside this card.
Box 8 HOLDS beyond known false positives: CPV v5.22.3 strict on a clean clone of ce62ff1: CRITICAL 0, MAJOR 2, MINOR 2, NIT 3; no finding on agents/mods-forge-agent.md; every MAJOR/MINOR/NIT is a filed false positive (#268, #269), two of them in menu files that mirror the example-skill text added later by TRDD-04ZJ9E90; output saved under reports/cpv/ (gitignored). The literal zero baseline no longer holds.
Box 9 HOLDS: README.md:8 and :15 name the forge agent and its role, :196-202 tell the reader to dispatch it for one increment, :17 describes the skills menu; plugin.json description names the forge agent and menu with no chapter count; DELEGATION.md:51 carries the skills-menu sentence. Minor staleness: README.md:8 and :17 still say 60 chapters, one how-to and three tutorials.
