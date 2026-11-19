---
trdd-id: EJ6AQYXY
title: Apply the owner's package-install decision to the egress gate
column: backburner
status: tasked
created: 2026-10-31T17:28:59+0100
updated: 2026-10-31T17:28:59+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:59+0100
---

# Apply the owner's package-install decision to the egress gate

Effect handled for TRDD-04UMTQGW. If the owner decides installs are refused while a session holds outside text, add npm install and ci, yarn add, pnpm add, bun add, pip install of a source package, go run of a module version, cargo install, gem install and pipx install to the package-runner class with one test each and a pinned cost; if the owner decides against it, the decision is recorded on TRDD-04UMTQGW and the reference stays as it is, since it already leaves installs to the mod author. Done when egress-classes.md, its tests and the Traps match the decision and the kit and pytest pass.

## Approval log

- 2026-10-31T17:28:59+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
