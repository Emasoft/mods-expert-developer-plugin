---
trdd-id: FGWQ5EGT
title: Verify how a Fable usage window arrives in rateLimits
column: backburner
status: tasked
created: 2026-10-31T14:04:32+0100
updated: 2026-10-31T14:04:32+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T14:04:32+0100
---

# Verify how a Fable usage window arrives in rateLimits

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-31

CURRENT STATE 2026-10-31: new, waits on the owner. NEXT ACTION: on a subscription without the five-hour window, capture one $.session.usage().rateLimits list (or the status-line rate_limits object) and record every kind it carries.

## Why

Owner, 2026-10-31 (verbatim): "anthropic just made the 5h window limit optional, so in some subscriptions it will not exist. only the week and the fable usage window will be present." No source in the plugin documents a field or kind for a Fable window (sweep reports_dev/five-hour/20261031_131707+0100-sweep.md). TRDD-6OM5MW9R (archived) made every reader look windows up by kind and show an unknown kind under its raw label; whether a Fable window actually arrives as a rateLimits entry, and under which kind, is UNVERIFIED.

## Acceptance

- [ ] A captured rateLimits list (or rate_limits object) from a subscription without the five-hour window is recorded here with its kinds, values redacted where personal.
- [ ] If a Fable window is present, its kind is named in the cost-and-metrics references and the usage-windows-by-kind module shows it with a readable label, with a behaviour test; if absent, the references say so.

## Approval log

- 2026-10-31T14:04:32+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
