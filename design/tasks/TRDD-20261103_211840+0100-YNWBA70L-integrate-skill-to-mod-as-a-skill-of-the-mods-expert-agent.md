---
trdd-id: YNWBA70L
title: Integrate skill-to-mod as a skill of the mods expert agent
column: dev
status: tasked
created: 2026-11-03T21:18:40+0100
updated: 2026-11-04T04:39:06+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:18:40+0100
relevant-rules: [10, 11, 12, 13, 14]
implementation-commits: [9c043ab]
---

# Integrate skill-to-mod as a skill of the mods expert agent

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

CURRENT STATE 2026-11-03: written in the release clone (mods-expert-developer-release, branch main), NOT committed: skills/mods-skill-to-mod/ (SKILL.md, agents/openai.yaml, five references, five scripts), tests/test_skill_to_mod.py (20 tests), the new MOD_BUILDER_SKILLS set and count 70 in tests/test_plugin_structure.py and tests/test_skills_menu.py, the Skill to mod group in the skills menu and its catalog, a section "Turn a skill into a mod" in agents/mods-expert-developer-agent.md (not in its frontmatter skills list), the NOTICE credit and MIT text, 12 cspell words. Checks green: pytest 379 passed, the skill suite 17 OK with CLAUDE_PLUGIN_ROOT set and exit 2 unset, claude plugin validate passed (pre-existing warnings only), cspell 0 issues, ruff clean on every touched path, 13 of 13 mutants red. Logs and report: reports_dev/skill-to-mod/. Not verified: a live session load of the skill, Desktop. NEXT ACTION: the orchestrator commits, adds the README lines the report gives, and moves the card on.
CURRENT STATE 2026-11-03 night (supersedes the line above): committed as 9c043ab in the release clone <code-root>/mods-expert-developer-release (branch main), not in this repo until 0.6.4 is pushed and merged back. DO NOT PUBLISH 0.6.4 until the review follow-ups are committed. SKILL.md grants a bare allowed-tools Bash, so any command runs without a prompt while the skill is active. The follow-ups scope it to the skill's scripts, move the 12 cspell words out of the shared .cspell.json, align the generated mods' masking with the [REDACTED:<kind>] labels, add the README lines, and check the Python version and symlinked paths. openai.yaml keeps allow_implicit_invocation true, like 68 of the plugin's 70 skills; only mods-install-mod and mods-uninstall-mod set false. NEXT ACTION: commit the follow-ups, then load the skill live on terminal and Desktop. (was 0.6.3; superseded 2026-11-03 by the owner's ruling)
2026-11-03: 0.6.4 also waits on TRDD-MPJTMO51 (the /mods-expert-developer-agent skill). (was 0.6.3; superseded 2026-11-03 by the owner's ruling)
Follow-ups committed as 814cb8e in the release clone (<code-root>/mods-expert-developer-release). Corrections to the commit message: only && was probed for chaining (not ;, |, redirects, or $()); the scaffold's claim that its labels follow the requirements-drafts mod depends on f2722c5, which is on dev main and not in the release tree; jscpd duplicated lines rose by 10 at the same 4.28%; the F2 mutant failed cspell, not a test; the check_skill text output label changed from "Scaffoldable:" to "The scaffold covers:".
The 0.6.3 hold for the follow-ups is lifted. 0.6.4 now waits on the strict CPV fixes (CRITICAL=2 MAJOR=4 MINOR=4 NIT=7 on 814cb8e, fixed in 05113e2 and fe753c8 (strict 0/0/0/0 at CPV 5.23.0)), TRDD-MPJTMO51 and the new install card (TRDD-4LTNN7OC). (was 0.6.3; superseded 2026-11-03 by the owner's ruling) (history: that 0.6.3 hold was lifted when 814cb8e landed)
2026-11-03: 0.6.4 also waits on TRDD-ZQ0S5X07 (rename /mod-manager to /mods-manager, owner ruling). (was 0.6.3; superseded 2026-11-03 by the owner's ruling)
2026-11-03 owner ruling, verbatim: "and we only ship 0.6.4". No 0.6.3 is published: one release, 0.6.4, carries everything this card and the other release-hold cards list. Every earlier 0.6.3 on this card now reads 0.6.4.
2026-11-04, mods expert, M1: reviewed 9c043ab, 814cb8e, 05113e2 and fe753c8; fixes in 7b6a25a (release clone). The scaffold used the source skill's frontmatter name unchecked as a folder under --out and as text in register.js comments: on scratch copies "name: ../../victim" wrote outside --out, a --force rerun removed a folder there, and a two-line name put code into register.js. The skill and command names must now be one plain name (checked with fullmatch), the source skill may hold no symlink, a folder the walk cannot list stops the run, and spec.command's types are checked. Review notes 1 and 2 are applied in references/command-paths.md (only && was probed; the permission modes are named). Note 3, the verify_mod.py and scaffold_mod.py "*" grants, is an owner question. Most of 05113e2 exists only to satisfy validator false positives (the reworded prose, the shebang and __main__ guard on _common.py, the stdin compile check, the pattern built in steps, the template literal), the shapes the 2026-10-31 decision on TRDD-5LPSG7AV rejected for dev main; one policy for both lines is an owner question. The masking-label claim in scaffold_mod.py rests on f2722c5 (dev main) and is checked after the dev-main merge.
Owner question 1 (validator false positives), 2026-11-04, verbatim choice: "(C) Accept rewording" (option text: Rewording is the release policy, and dev main's two MAJOR findings are cleared the same way. 0.7.0 can publish.) (owner answers, relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_034449+0100-owner-answers-q1-q2-q9-q10.md; the choice in quotes is the owner's, the option text is the orchestrator's) Effect: 05113e2's rewording stands; no longer held.
Owner question 2 (the verify_mod.py * grant), 2026-11-04, verbatim choice: "(c) Keep as is" (option text: No change.) (owner answers, relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_034449+0100-owner-answers-q1-q2-q9-q10.md; the choice in quotes is the owner's, the option text is the orchestrator's)
Owner question 8 (a CPV issue for the backtracking false positive on the mod-manager's version pattern), 2026-11-04, verbatim choice: "File the issue" (option text: Open the issue on Emasoft/claude-plugins-validation.) (owner answers relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_035250+0100-owner-answers-q3-q4-q5-q7-q8-q11.md; the choice in quotes is the owner's, the option text in parentheses is the orchestrator's) Done 2026-11-04 by the mods expert, as a comment, because open issue 264 already covers the same rule and shape (orchestrator: no duplicate): https://github.com/Emasoft/claude-plugins-validation/issues/264#issuecomment-6621289927 (the TypeScript instance at hooks/mod-manager/logic.ts:725 and a Node measurement: 40,000 to 200,000-character inputs, every test under 1.2 ms, same answers as the split on dots).
2026-11-04, mods expert, recorded: owner rulings relayed by the orchestrator in reports_dev/goal/20261104_000251+0100-owner-rulings-070.md: release version, verbatim choice "Ship 0.7.0 (Recommended)" (option text: Use --minor. The release adds new features (the launcher skill and /mods-validate-mod), so semantic versioning calls for a minor bump. No change to the pipeline is needed.), superseding the earlier ruling "and we only ship 0.6.4"; release contents, verbatim choice "Everything" (option text: Merge dev main in first: 219 more commits, including the PRRD-extraction work. Its blockers must be fixed before publishing.). The choices in quotes are the owner's, the option texts the orchestrator's. Effect (the mods expert's reading): every 0.6.4 on this card now reads 0.7.0, published with publish.py --minor.
2026-11-04, mods expert, correction of the 0.7.0 Effect line above, from its review fork: every 0.6.4 that names the planned release now means 0.7.0; lines recording what happened (the 0.6.4 publish attempt, commit subjects) stay as history.

## Approval log

- 2026-11-03T21:18:40+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## User directives (verbatim, 2026-11-03)

1. "here is another project you must integrate into the plugin. in particular it should become a skill used by the mods-expert-developer agent. add it to the skills-menu but also reference the skill and when to use it in the agent md file itself. https://github.com/arm-pz/skill-to-mod`"
2. "be sure to adapt the scripts and correct the paths to work with the CLAUDE_PLUGIN_ROOT env var."

## Scope

- Add arm-pz/skill-to-mod (commit e7cb2d8, MIT, copyright Abdul Rahman P Z) as the skill skills/mods-skill-to-mod/ of mods-expert-developer-plugin, used by the mods expert agent to decide whether a skill should become a mod, then scaffold and verify that mod.
- Every path to the skill’s own files goes through ${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/; the scripts read CLAUDE_PLUGIN_ROOT from the environment and exit 2 with a clear error when it is unset; nothing is written under CLAUDE_PLUGIN_ROOT; the spec of each mod is kept under ${CLAUDE_PLUGIN_DATA}/skill-to-mod/specs/; generated mods go to a folder the user names.
- Scaffolded mods follow PRRD G13 (a userConfig switch and a session switch for every function), G14 (an opt-in debug log written with $.ui.log(text, { to: debug }), every line masked) and G10 (no MCP server; the scaffold refuses a spec that asks for one, the verify step fails a plugin that declares one).
- The skill is listed in the skills menu and its catalog, and the agent file names it in its own section; it is not in the agent frontmatter skills list, which the tests pin to the 61 chapter skills.

## Review notes on fe753c8, not yet applied (2026-11-03)

Release-clone commits 814cb8e, 05113e2 and fe753c8 are committed but not pushed; they are plugin code (05113e2 also changes the mod-manager hooks module) coordinated by the main Claude, not the mods expert, so the mods expert reviews them before 0.6.4 is published (orchestrator's inference from the owner's iron rule of 2026-11-03).
Not applied: restore, in its narrow form, the removed probe fact that a command joined with && gets no grant.
Not applied: the phrase "asks for permission as usual" holds only in some permission modes; name the modes or reword.
Not applied, owner-visible risk: the allowed-tools grant for verify_mod.py with a * argument lets Claude run claude plugin test on any folder without a prompt; claude plugin test runs the target folder's test files, so this pre-approves running test code from any folder, including an untrusted downloaded mod (not verified: that verify_mod.py passes its argument through unchecked); the owner decides whether to narrow it.
