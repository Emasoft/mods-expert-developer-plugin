---
trdd-id: 04UMTQGW
title: Owner decision on refusing package installs while a session holds outside text
column: backburner
status: tasked
created: 2026-10-31T17:23:09+0100
updated: 2026-10-31T17:39:04+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:23:09+0100
eht: [TRDD-EJ6AQYXY]
unblock-when: []
---

# Owner decision on refusing package installs while a session holds outside text

Follow-up of TRDD-R2GILGKU (prose link only: this card has derived cards of its own, so it is not a derived card of R2GILGKU). npm install, npm ci, yarn add, pnpm add, bun add (lifecycle scripts), pip install of a source package, go run module@version, cargo install, gem install and pipx install run fetched code, yet pass the security-guards egress gate as no class. Adding them to the package-runner class (deny) would refuse installs once the session has read outside text. The owner decides; record the decision verbatim here and the change, either way, is TRDD-EJ6AQYXY.

## Approval log

- 2026-10-31T17:23:09+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-31T17:30:04+0100 — column → todo by main-agent@emasoft-mods-expert-developer. an owner decision that was asked; keep it visible
- 2026-10-31T17:34:52+0100 — column → design by main-agent@emasoft-mods-expert-developer. an owner decision, not workable yet; design comes before todo in 3.0.0
- 2026-10-31T17:39:04+0100 — column → backburner by main-agent@emasoft-mods-expert-developer. an owner decision not yet given: blocked needs a blocker card, design_human_review is skipped for min-approval none, and design would claim work nobody is doing

## Derived tasks

EHT TRDD-EJ6AQYXY (apply the decision to the egress gate, its tests and Traps).
