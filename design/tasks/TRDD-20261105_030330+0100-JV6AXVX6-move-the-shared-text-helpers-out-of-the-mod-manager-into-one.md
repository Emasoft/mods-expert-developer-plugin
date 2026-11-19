---
trdd-id: JV6AXVX6
title: Move the shared text helpers out of the mod-manager into one module the mods share
column: backburner
status: tasked
created: 2026-11-05T03:03:30+0100
updated: 2026-11-05T03:03:30+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-05T03:03:30+0100
---

# Move the shared text helpers out of the mod-manager into one module the mods share

Origin: M4c item 4 (orchestrator state 18), from the review of 5f3fb42 (layering); minted by the mods expert M11. printable, oneLine and fitLabel live in hooks/mod-manager/logic.ts (printable :119, oneLine :127, fitLabel :649), homeFolder in hooks/mod-manager/files.ts:51, and a second fitLabel in hooks/self-command/logic.ts:278. Other mods import them from the mod-manager: hooks/switches/register.ts, hooks/switches/logic.ts, hooks/debug-log/logic.ts, hooks/debug-log/register.ts on release main (872e6bd), and hooks/deck/** and hooks/tokensaver/** on the Deck branch (feat/deck-tokensaver). Scope: one shared module (for example hooks/shared/text.ts) holding printable, oneLine, one fitLabel (the two compared first) and homeFolder; every importer moved, the deck and tokensaver ones included; no behavior change, the kit and pytest green, jscpd TypeScript at most 280. Constraint: no move while the Deck branch is open; it starts after the Deck branch is merged into release main. Not in scope: the cell-width helper (fitLabel against Deck's textWidth and textCells) and moving world() to hooks/tests/mod-manager-world.ts, each its own card.

## Approval log

- 2026-11-05T03:03:30+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
