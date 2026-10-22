---
trdd-id: N9M0FOKO
title: Add mods-forge-agent with the skills-menu preload
column: dev
status: tasked
created: 2026-10-22T20:23:29+0200
updated: 2026-10-22T22:09:13+0200
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

CURRENT STATE 2026-10-22: 0.3.1 published and verified after install (both post-install boxes ticked). NEXT ACTION: verify each remaining box against cited evidence (box 4 needs a broken-copy rerun or an explicit self-report note; box 8 needs the saved CPV output under reports/cpv/); boxes 1-2 (agent frontmatter, menu catalog) read as mods-the-skills-menu since cf3b7de; append all evidence before moving to complete.

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

- [ ] agents/mods-forge-agent.md exists with model claude-opus-5-5, skills [cpv-the-skills-menu], no tools field, the amended description, and the mandatory paragraph right after the H1
- [ ] skills/cpv-the-skills-menu/SKILL.md and references/skills-catalog.md each name every chapter skill exactly once, use the plugin.json namespace on every Load with line, and do not list the menu itself
- [ ] SKILL.md body under 500 lines and under the 5000-token budget
- [ ] tests updated with CATALOG_SKILLS and the new tests, each shown to fail on a broken scratch copy, then pass
- [ ] uv run pytest passes on the whole suite
- [ ] claude plugin validate . passes, or a login failure is reported as such
- [ ] ruff and cspell clean on changed files
- [ ] CPV strict (the publish.py command, CPV v5.22.3) shows no new finding against the CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 baseline, output saved under reports/cpv/
- [ ] README, plugin.json and DELEGATION.md updated
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
