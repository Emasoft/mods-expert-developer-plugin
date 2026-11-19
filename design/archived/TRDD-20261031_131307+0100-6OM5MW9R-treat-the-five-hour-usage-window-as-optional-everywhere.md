---
trdd-id: 6OM5MW9R
title: Treat the five-hour usage window as optional everywhere
column: complete
status: archived
created: 2026-10-31T13:13:07+0100
updated: 2026-10-31T13:54:03+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T13:13:07+0100
implementation-commits: [9ae40d0]
---

# Treat the five-hour usage window as optional everywhere

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-31

CURRENT STATE 2026-10-31: new. Files that mention the five-hour window (first grep, outside the vendored chapters): skills/mods-example-state-and-settings/references/store-or-state.md, skills/mods-example-cost-and-metrics/SKILL.md, skills/mods-example-pane-and-chart/references/pane.md, skills/mods-example-call-intercept/references/call-intercept.md, skills/mods-the-skills-menu/references/skills-catalog.md, and three token-weather-usage-NOTICE.txt files. NEXT ACTION: a read-only sweep lists every place (code, tests, docs, reference modules, agents, the additional notes) that reads, shows or assumes the five-hour window, and the field names the types and the status-line chapter give for the weekly and Fable windows; then one writer updates them after the TRDD-2XFV601A round-4 merge (shared skills).
SWEEP 2026-10-31 (reports_dev/five-hour/20261031_131707+0100-sweep.md, read-only): no executable code in the plugin reads the usage windows; the hits are plugin-authored text in mods-example-cost-and-metrics (SKILL.md:3,15 and references/cost-or-limits-math.md:29,58), mods-example-pane-and-chart/references/pane.md:58, mods-example-call-intercept/references/call-intercept.md:59, mods-example-state-and-settings/references/store-or-state.md:53-54 and skills-catalog.md (the cost-and-metrics entry, kept in sync with the SKILL.md description). The status-line chapter :361 already says each window may be absent, while :869 says the object contains both; the generated types give rateLimits as a list of {kind, percentUsed, resetsAt?} with kind five_hour, seven_day or spend_limit. No source documents a Fable window field: readers must look windows up by kind and show an unknown kind under its raw label, never guess a name. The third-party NOTICE files stay unchanged. Box 3 has no plugin reader to feed: it becomes a text test that no plugin-authored file claims the five-hour window always exists, plus the runOutOf excerpt check with a list lacking five_hour. NEXT ACTION: one writer edits these files after the TRDD-2XFV601A round-4 merge (skills-catalog.md differs on that branch).
VERIFIED 2026-10-31 by the orchestrator: status-line chapter :361 says each window may be independently absent, :869 says the object contains both; index.d.ts:11911-11927 SessionRateLimit kind five_hour, seven_day or spend_limit, resetsAt optional; no five_hour, rateLimits or rate_limits in hooks/ or skills/*/examples. Absence of a Fable window field rests on the sweep's grep (? INFERRED). Box 3 is changed below because the plugin has no reader to feed.
CORRECTION 2026-10-31: resetsAt is optional per index.d.ts:11929 (resetsAt?: string), re-read by the orchestrator; the earlier VERIFIED line read only to :11927. token-optimizer's data.ts merges a reported fiveHour value, but the plugin's prose about token-optimizer does not mention the five-hour window (sweep terms found nothing there), so it has nothing to update. The reference module in box 3 is an addition by the agent (the plugin has no reader to update); the owner may drop it.
DONE 2026-10-31 in 9ae40d0, reviewed (reports_dev/five-hour/20261031_134534+0100-review.md, 0 blockers; the 3 should-fix applied). Box evidence: the only reader in the plugin is the new usage-windows-by-kind module, whose behaviour test feeds lists with and without five_hour and with an unknown kind (mutation: removing the absent-window guard turns 3 tests red); tests/test_five_hour_window_optional.py flags six old sentences when run against the previous text and passes now; cost-or-limits-math.md notes the status-line chapter's :869 against :361 and the owner's statement; no vendored chapter or NOTICE file changed. pytest 648 passed. NEXT ACTION: none; the owner may move the card to complete or ask for more.

## Owner directive (verbatim, 2026-10-31)

"also anthropic just made the 5h window limit optional, so in some subscriptions it will not exist. only the week and the fable usage window will be present. so all components and skills/mods in the plugin that uses the 5h interval must be updated."

## Acceptance

- [x] Every component, reference module, example mod and test that reads the usage windows treats the five-hour window as optional: when it is absent nothing breaks, nothing is guessed, and the weekly and Fable windows are shown.
- [x] Every text that says the five-hour window always exists says it may be absent on some subscriptions.
- [x] A reference module that reads the usage windows by kind (the plugin has no reader of its own, sweep 2026-10-31) has a behaviour test fed a list with no five-hour window, and a text test checks that no plugin-authored file says the five-hour window always exists. (Reworded 2026-10-31 from: a test feeds a usage payload with no five-hour window to every reader.)
- [x] The vendored Anthropic chapters are not rewritten; where they disagree with the owner's statement, the plugin's own text says so.

## Approval log

- 2026-10-31T13:13:07+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-31T13:54:03+0100 — COMPLETE by main-agent@emasoft-mods-expert-developer. all four acceptance boxes ticked with evidence in 9ae40d0, adversarial review applied.
