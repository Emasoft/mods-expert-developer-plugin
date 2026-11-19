---
trdd-id: ZM7W5LIA
title: Add the mods-validate-mod skill built on verify_mod.py
column: todo
status: tasked
created: 2026-11-03T20:59:17+0100
updated: 2026-11-04T03:45:59+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T20:59:17+0100
relevant-rules: [10, 11, 12, 13, 14]
npt: [YNWBA70L]
---

# Add the mods-validate-mod skill built on verify_mod.py

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

Queued. It starts when the skill-to-mod integration lands in the release clone (card titled 'Integrate skill-to-mod as a skill of the mods expert agent'), because it uses that skill's adapted verify_mod.py. NEXT ACTION: the mods-expert-developer-agent builds it in the release clone.
2026-11-04, mods expert, M1: committed on feat/validate-mod (worktree mods-expert-developer-wt-validate, off fe753c8): 3316b8b (as built) and a1cb83d (a path that starts with - is refused, because verify_mod.py reads an argument that starts with -- as one of its flags). Owner decision open: the verify_mod.py "*" grant, shared with mods-skill-to-mod, lets Claude run a mod's own test code without a prompt, and this skill is model-invocable and offers to validate another author's mod. Options: (a) drop the grant here, so every run asks; (b) keep it and make the skill user-only; (c) keep it as is.
Owner question 2 (the verify_mod.py * grant), 2026-11-04, verbatim choice: "(c) Keep as is" (option text: No change.) (owner answers, relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_034449+0100-owner-answers-q1-q2-q9-q10.md; the choice in quotes is the owner's, the option text is the orchestrator's)

## User directive

"add also a validation skill to validate mods, using this handy script: `https://github.com/arm-pz/skill-to-mod/blob/main/skills/skill-to-mod/scripts/verify_mod.py`. call it `/mods-validate-mod <plugin folder path>`" (2026-11-03, verbatim)

## What the script does

Source: docstring of verify_mod.py at commit e7cb2d8 of arm-pz/skill-to-mod. It checks the Claude Code version, runs `claude plugin validate` (it passes only on "Validation passed") and `claude plugin test`, and gives a plain-language read of what the mod can reach. With --update-readme it writes that read into README.md between trust markers. With --directory it also checks the marketplace directory rules (README, LICENSE, icon). It exits 0 only when validation and every test pass.

## Scope

- A skill skills/mods-validate-mod/ that takes one argument, the plugin folder path, and runs verify_mod.py through "${CLAUDE_PLUGIN_ROOT}".
- The script has one source: the skill uses the adapted copy from the skill-to-mod integration, or that copy moves to a shared place both skills point at, never a second copy.
- Decide whether it also runs the type check (the quickstart skill's check-mod.sh runs tsc and the kit, which overlaps with plugin test).
- Add it to the skills menu and the catalog, mention it in agents/mods-expert-developer-agent.md, credit it in NOTICE, add tests, and test a run against a real mod folder.
The owner asked for this skill plus script by name, which overrides PRRD G11.1's preference for native mod code for this skill.
Check whether the bare /mods-validate-mod resolves, or only /mods-expert-developer-plugin:mods-validate-mod.

## Approval log

- 2026-11-03T20:59:17+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
