---
trdd-id: 9W9XNNWK
title: probe.py leaves a project entry in the global config and its typed steps in the prompt history
column: backburner
status: tasked
created: 2026-11-04T21:46:32+0100
updated: 2026-11-05T05:03:40+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T21:46:32+0100
---

# probe.py leaves a project entry in the global config and its typed steps in the prompt history

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

ORCHESTRATOR 2026-11-04: "Option 2 is a destructive edit of the owner's untracked files and needs the owner's approval before dev". min-approval-requirement stays as minted: changing it on a self-issued mandate lints as MANDATE-FORGED.
2026-11-05 (M12): a third trace is recorded under Problem: this plugin's inline store file is shared by every --plugin-dir load, a probe's included; a store may already hold this file from an earlier --plugin-dir load; probe.py then leaves its writes in it.

## Problem

scripts/probe.py (TRDD-03IIDGPP) runs claude in a fresh scratch folder (system temp) against the real configuration folder
(CLAUDE_CONFIG_DIR, or ~/.claude when it is unset; scripts/probe.py:27). When the session ends it removes the scratch
folder, the session transcripts under projects/ and the new <plugin>_inline-*.json store files
(scripts/probe.py:223-240). Measured on 2026-11-04 over four runs, two things stay behind:

- ~/.claude.json gains one probe-runner-* project entry per run (the entry Claude Code writes for the scratch folder);
  probe.py does not remove it. Over three counted runs the count of such entries rose by three.
- ~/.claude/history.jsonl gains one line per typed step: 3, 4 and 8 lines for runs of 3, 4 and 8 steps.

settings.json and plugins/installed_plugins.json kept the same hash in every run.
- 2026-11-05, a third trace (the twelfth mods expert, M12, at the orchestrator's request; measured from the store's file names only, no file read or changed): a plugin's store file is named <name>_<marketplace or inline>-<hash>.json, where <hash> is the first 12 hex digits of the SHA-256 of the plugin id (<name>@<marketplace>, or <name>@inline for a --plugin-dir load), matched on all 4 files checked. So it does not depend on the folder a plugin loads from: every --plugin-dir load of this plugin, a probe's included, shares one file; a store may already hold this file from an earlier --plugin-dir load; probe.py then leaves its writes in it. probe.py lists the store's inline files before the session (scripts/probe.py:267, inline_files :199-201) and deletes only a file that was absent then and whose name starts with <name>_inline- (:237-240), so a probe of this plugin reads and writes that file, if the store already holds it, and leaves its writes in it; a probe of a plugin with another manifest name gets a new file, which the cleanup removes.

## Options for the owner

1. A scratch CLAUDE_CONFIG_DIR for each run, so nothing lands in the real configuration. Open point: the session needs a
   login there, and no credential may be copied by hand.
2. Self-cleanup under a lock: after the session ends, remove the run's own project entry and history lines. Risk: live
   sessions write ~/.claude.json and history.jsonl at the same time, so an edit races with them and can lose another
   session's write unless it holds a lock Claude Code also honours.

No cleanup code is written until the owner chooses (orchestrator ruling 7, point 10, 2026-11-04). Removing lines from
those files is a destructive edit of untracked files. TRDD-03IIDGPP (column human_review) is left untouched.

## Evidence

The counts and their before and after files are in the DT report, section 9.5, local to the developer machine
(reports_dev/mods-expert/).

## Approval log

- 2026-11-04T21:46:32+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
