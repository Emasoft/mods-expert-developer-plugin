---
trdd-id: 0XUQDQLB
title: Test that update_excerpt_lock.py imports only the standard library
column: backburner
status: tasked
created: 2026-10-27T16:36:33+0100
updated: 2026-10-27T16:36:33+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T16:36:33+0100
---

# Test that update_excerpt_lock.py imports only the standard library

Follow-up of TRDD-04ZJ9E90. scripts/update_excerpt_lock.py and scripts/excerpt_lock.py promise to run without the dev extra (no pytest). That was checked once by hand in a venv without pytest (b698eac). Add a test that fails if either file imports anything outside the standard library and excerpt_lock: parse both with ast and compare every imported top-level name with sys.stdlib_module_names plus excerpt_lock, or run the script with python3 -I --check in a subprocess with no site-packages. Mutation check: add 'import pytest' to update_excerpt_lock.py on a tmp copy and see the test fail.

## Approval log

- 2026-10-27T16:36:33+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
