---
trdd-id: 5188AMFQ
title: Fuse token-optimizer's measured behaviour into the plugin as the third mod
column: dev
status: tasked
created: 2026-11-10T05:33:38+0100
updated: 2026-11-10T07:33:30+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-10T05:33:38+0100
parent-trdd: 71KVH9PA

---

# Fuse token-optimizer's measured behaviour into the plugin as the third mod

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-10

CURRENT STATE 2026-11-10: NOT STARTED in code. The card records the source, the 12-event hook matrix and the licence firewall; nothing of the measurement layer is written in the release worktree. NEXT ACTION: implement the in-scope measurement layer (tool-call accounting, compaction count and tokens freed, cache warmth, compact-ceiling fill, quality and effort grades, session cost) from documented behaviour only, behind switches, cost-incurring ones off by default.

Owner directive 2026-11-10: 'a third mod called token-optimizer ... integrate them all'. Source located at ~/.claude/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.13.69 (hook matrix: PreToolUse Read/Agent/mcp, PreCompact x3, SessionStart, Stop, SessionEnd, StopFailure, UserPromptSubmit, PostToolUse, PostToolUseFailure, PostCompact, CwdChanged; skills token-optimizer, token-dashboard, token-coach, resume-checkpoint, fleet-auditor; commands health, quick; a desktop TSX module with a Clawd mascot).

LICENCE FIREWALL (binding): token-optimizer is PolyForm-Noncommercial-1.0.0 and is listed in excerpt_lock.FORBIDDEN, with ten pinned public commits in NO_COPY_SOURCES (5.13.58 to 5.13.69). Its behaviour may only be RE-IMPLEMENTED from documented behaviour; no code, string, layout or copy may be excerpted. tests/test_no_copy_unlicensed.py is the enforcement (8+ shared consecutive words, or 3+ identical non-blank lines) and it states plainly that copied code STRUCTURE is not detected by text runs, so review must catch it.

Scope: the measurement layer only, as behaviour this plugin implements itself in TypeScript: per-session tool-call accounting, compaction count and tokens freed, cache warmth (warm / about to drop / cold / refreshing / warming), context fill measured against the auto-compact ceiling rather than the model window, quality and effort grades, and a session-cost command. Out of scope: the Clawd mascot, any Python subprocess, any browser dashboard, any settings.json statusLine command (hooks/status-line.ts is the one writer of the status line), and the five upstream skills as shipped files.

Every function is a switch in the shared registry (TRDD-5IK59SQ2), cost-incurring ones off by default, and every measurement is read at the moment of use, never cached in a copy (rule B4). Delivered through the one panel TRDD-<UI card>, not a fourth band.
WORKED BY mods-expert-developer-agent (session e7bc3f40-36b7-420f-b6dc-d673f6ec5deb): the mods expert implements this card. The owner fields stay main-agent@emasoft-mods-expert-developer because trddgrep set refuses any identity outside user | main-agent@<project-id> | <agent-name>#<agent-uuid> (ai-maestro#168) and this agent is not in the agent registry.

## Approval log

- 2026-11-10T05:33:38+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
