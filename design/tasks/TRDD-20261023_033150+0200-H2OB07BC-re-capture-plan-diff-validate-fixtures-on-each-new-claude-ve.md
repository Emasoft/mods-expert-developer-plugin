---
trdd-id: H2OB07BC
title: Re-capture plan-diff validate fixtures on each new claude version
column: backburner
status: tasked
created: 2026-10-23T03:31:50+0200
updated: 2026-10-23T03:31:50+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-23T03:31:50+0200
---

# Re-capture plan-diff validate fixtures on each new claude version

plan-diff.sh (skills/mods-tutorial-quickstart/scripts) parses the text output of `claude plugin validate`, captured as fixtures in tests/fixtures/validate-*.txt and labelled with the claude version in tests/fixtures/validate-fixtures.version (2.1.307 at creation). When a newer claude version is installed, re-run validate on the fixture mods, compare with the committed fixtures, and if the footprint format changed, update the fixtures and plan-diff.sh with tests. Owner-run: needs a logged-in build. Spun off from TRDD-71SH1V5W I-6.

## Approval log

- 2026-10-23T03:31:50+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
