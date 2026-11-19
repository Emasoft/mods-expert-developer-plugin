---
trdd-id: D5MP762X
title: Make the secret shapes of the firewall reference module run in linear time
column: dev
status: tasked
created: 2026-11-01T11:17:13+0100
updated: 2026-11-04T00:51:17+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-01T11:17:13+0100
---

# Make the secret shapes of the firewall reference module run in linear time

## Approval log

- 2026-11-01T11:17:13+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-01

Found 2026-11-01 by the review of the N6 plan of TRDD-R2GILGKU, and measured by the orchestrator. In skills/mods-example-security-guards/references/peer-message-firewall.md, the signed-web-token entry of SECRET_SHAPES, /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,}/, takes time that grows with the square of the input: 30, 119 and 470 ms at 12.5, 25 and 50 KB of "-eyJ" repeated, because \b holds after every "-" and "-" is in the class. The session.send handler runs secretShape with no length cap, so a long outgoing message stalls the hook. The other five shapes took under 1 ms at 50 KB. Fix on a new branch from main, not on wt/r2gilgku-n3468: make every shape linear, add one adversarial test per shape (inputs of at least 50 KB, sized in bytes as in commit af224b7, the median of several runs, compared as a time ratio between n and 2n), keep every existing firewall test passing, and merge onto main after its own review; then merge main into wt/r2gilgku-n3468. Related: TRDD-R2GILGKU (step 1 of its N6 plan moved here), TRDD-O5LUMKPW (the same pattern is quadratic in the requirements-drafts mod).
2026-11-04, mods expert: reviewed and committed in dev main as 9dfa817 (the firewall reference and its test). The match now starts at the first dot, which changes nothing here because the module only calls .test() and blocks by shape name. The mods expert re-ran the mutation: the old pattern restored on a scratch copy turns "a signed web token: the time grows linearly with the input" red (35 s), and nothing else. Not verified: strict tsc, because the generated types are absent in dev main.
