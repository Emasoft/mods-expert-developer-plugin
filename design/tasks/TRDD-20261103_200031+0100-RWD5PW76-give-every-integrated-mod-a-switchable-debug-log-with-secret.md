---
trdd-id: RWD5PW76
title: Give every integrated mod a switchable debug log with secrets redacted
column: todo
status: tasked
created: 2026-11-03T20:00:31+0100
updated: 2026-11-04T20:31:42+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T20:00:31+0100
relevant-rules: [14]
implementation-commits: [9d4ca09, ff6949d, b2971db, 01cc4d8]
---

# Give every integrated mod a switchable debug log with secrets redacted

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

Column todo, no implementation yet. Governed by PRRD G14.1 (every mod can switch on a debug log that tracks errors, warnings and similar events, with secrets redacted). NEXT ACTION: plan the log module and its redaction call before any mod writes a log line.
2026-11-04, mods expert, M2: the mod-manager functions M2 adds (2f Copy install line and catalog reads on expand, 2j Add marketplace with its before-and-after list check, 2l command arguments) add more events that G14.1 debug logging must cover; whether G13.1 and G14.1 gate the 0.7.0 publish is an open owner question in the M2 report.
Owner question 9 (G13.1 and G14.1 before 0.7.0), 2026-11-04, verbatim choice: "Build before 0.7.0" (option text: TRDD-5IK59SQ2 and TRDD-RWD5PW76 become release work; publishing waits for them.) (owner answers, relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_034449+0100-owner-answers-q1-q2-q9-q10.md; the choice in quotes is the owner's, the option text is the orchestrator's)
2026-11-04, mods expert, open note from M2 review round 2 (m7) on the mod-manager, for this card's debug-log work: refusedLogged (acba45d) is per module load, so a Reload logs each refused name once more; and a marketplace name that isMarketplaceName refuses gets every entry logged (since be38c32).
2026-11-04, mods expert, M4c: the Open conflict below is resolved (orchestrator, accepted 2026-11-04): PRRD G14.1 governs ("with secrets redacted"), with the owner's verbatim Q2 answer on BE6YBBP9 ("never write secrets down"). The log holds only events the mods raise (errors, warnings, refusals), each passed through redaction; never hook payloads, prompts, tool inputs, env values or the raw store. BE6YBBP9's "never values" does not apply here: it is a ruling drawn from that answer for the event tape that card plans, which logs event payloads and is not built. Plan: hooks/debug-log.ts, one switch per mod (off by default) in the switch registry of TRDD-5IK59SQ2; the file in the plugin's data folder, never the project or the working folder; a size cap with one rotation; the mask is requirements-drafts' redact() (imported, not copied) plus emails and home paths; the lines the mods send to the debug log today get the same mask.
2026-11-04, mods expert, M4c C3 built on release main as 9d4ca09: hooks/debug-log/ (one off-by-default switch per mod in the TRDD-5IK59SQ2 registry; logEvent masks a line, sends it to $.ui.log as before, and while the switch is on adds it to <config>/plugins/data/<data folder>/debug/<mod>.log with a 256 KiB cap and one rotation to .log.1; the mask is requirements-drafts' redact() imported, plus e-mail addresses, the session's home as ~, and other users' home names). requirements-drafts routes its six log lines through logEvent; hooks/index.ts masks every mod's start failure. Tests: hooks/tests/debug-log.test.ts 14, 24 mutants all red. UNVERIFIED, settled by the M6 live check: the data folder name dataFolderId derives from the plugin root (<name>-<marketplace> for an install under plugins/cache, <name>-inline otherwise, after the plugin manifest reference); M6 checks that Claude Code itself creates and uses ~/.claude/plugins/data/<name>-<marketplace>/ for this plugin. Until then nothing else is built on that name. Still open on this card: the other mods' lines (self-command, probe-runner, mod-manager) go through logEvent in C4 to C6, including mod-manager's raw claude error text noted in Scope.
2026-11-04, mods expert, M4c review of 9d4ca09 applied on release main as ff6949d, then b2971db: each mod's lines are written one after another (one queue per mod), since $.fs has no append and two events close together in one session lost a line; the session's home is masked only where a path segment ends, in any case, with either Windows slash and a trailing slash dropped; a configuration folder that is not absolute is refused; a line is masked once, and a carriage return breaks it; b2971db keeps home paths of unknown users out of the sources (the repository's path guards had failed on ff6949d). 32 mutants all red. Not changed, with the reasons: /Users/<alice> stays an allowed test token (the guard is a token list by design, like /home/<tester>); the requirements-drafts 'Not saved' toast is not masked (a toast to the person whose data it is, not a log); a nonstandard home is in clear in $.ui.log after a reload until the next start (the standard homes are still masked); the time of a line is the time of its write; a failure of $.ui.log inside the write's catch cannot be reported; startDebugLog without HOME fails the start (fail fast); the data folder name stays unverified until the M6 live check. C4 (01cc4d8, with its review round) adds the self-command and probe-runner logs; self-command's line for each run, built from the command and its output, is masked in Claude Code's log and never written to the file (review of 01cc4d8).

## Scope

- Each mod has its own debug log, off by default.
- The log records errors, warnings and similar events.
- Every value passes through the requirements-drafts redaction (secret-shield labels) before it is written.
- Nothing is written while the log is off.
2026-11-03: the mod-manager debug log already writes claude's error text raw (hooks/mod-manager/state.ts, $.ui.log with messageOf(error)); it needs the redaction when this lands.

## Open conflict

TRDD-BE6YBBP9 holds a ruling drawn from the owner answer of 2026-11-03: the debug log holds event names, timestamps and payload keys and types, never values. This card says values pass through redaction before writing. Resolve the two before building.

## Approval log

- 2026-11-03T20:00:31+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
