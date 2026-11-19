---
trdd-id: 7YXW2QZC
title: Scope the bare Bash grants of mods-uninstall-mod, mods-requirements-drafts-list and mods-requirements-drafts-search
column: backburner
status: tasked
created: 2026-11-03T22:26:47+0100
updated: 2026-11-04T12:48:36+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: security
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T22:26:47+0100
implementation-commits: [292344b, 319cdc0]
---

# Scope the bare Bash grants of mods-uninstall-mod, mods-requirements-drafts-list and mods-requirements-drafts-search

Each skill's allowed-tools grants bare Bash (SKILL.md:5 of each), so it can run any shell command without a prompt. Scope to exact rules as in 814cb8e. Keep the comma string (tests/test_skills_menu.py:737-746 splits on commas).

## Approval log

- 2026-11-03T22:26:47+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Owner rulings

Owner question 3 (mods-uninstall-mod's grants), 2026-11-04, verbatim choice: "Yes, scope it" (option text: Narrow mods-uninstall-mod's grants like the install skill's.) (owner answers relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_035250+0100-owner-answers-q3-q4-q5-q7-q8-q11.md; the choice in quotes is the owner's, the option text in parentheses is the orchestrator's)

## Implementation

2026-11-04, mods expert, M4a (release clone main, not pushed): 292344b replaces the bare Bash grant of mods-uninstall-mod with two exact rules, `claude plugin marketplace list --json` and the shortlist script run with `python3 -I`, beside the run tool; no rule covers `claude plugin uninstall`, so each uninstall runs only when the permission mode, the user's rules or the user's answer to a prompt allows it, and a refused one is returned for the user to run. 319cdc0 fixes the orchestrator review's findings on the shortlist script: a search text with no letter or digit is refused, a projectPath reached through a symlink matches, the CLI call times out at 90 s, and undecodable output exits 1. Live check on Claude Code 2.1.318: a headless run in manual mode with project settings only ran the shortlist with no denial, and a control copy without the rule was denied. Owner question 3 ("Yes, scope it") named this skill only: mods-requirements-drafts-list and mods-requirements-drafts-search still grant bare Bash, so the card stays open for them and its column is not moved. Parity gap for a later card: mods-uninstall-mod has no rule for a missing AskUserQuestion, although its step 5 asks two questions.
