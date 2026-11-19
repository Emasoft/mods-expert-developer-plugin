---
trdd-id: 1FLDZPXF
title: Track or retire the SKILL.md generator that rebuilds the chapter skills
column: backburner
status: tasked
created: 2026-10-27T21:40:48+0100
updated: 2026-10-27T21:41:21+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T21:40:48+0100
---

# Track or retire the SKILL.md generator that rebuilds the chapter skills

## Approval log

- 2026-10-27T21:40:48+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Problem

scripts_dev/gen_skill_toc.py rebuilds whole tracked mods-doc-*/SKILL.md bodies but is gitignored, so other contributors lack it.
Its dry run fails with "empty TOC" (die in extract_toc, scripts_dev/gen_skill_toc.py line 87).
Per-skill notes (SKILL_NOTES, TRDD-J1LYY59C) now live in the generator and are asserted by tests/test_plugin_structure.py.

## Decision

Choose: move it to scripts/ with a working dry run and a test, or declare SKILL.md bodies hand-maintained and retire it.

## Checklist

- [ ] Decision recorded (track in scripts/ or retire)
- [ ] Dry run fixed (and tested) or generator retired
- [ ] SKILL_NOTES preserved either way (in the generator or in the SKILL.md files and test)
