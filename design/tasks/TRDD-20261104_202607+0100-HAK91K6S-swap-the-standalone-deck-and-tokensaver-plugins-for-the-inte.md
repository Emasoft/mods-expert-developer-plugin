---
trdd-id: HAK91K6S
title: Swap the standalone Deck and Tokensaver plugins for the integrated mods on this machine
column: blocked
status: tasked
created: 2026-11-04T20:26:07+0100
updated: 2026-11-12T14:08:57+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T20:26:07+0100
relevant-rules: [4, 6, 7]
blocked-by: [RZBQIM54]
pre-block-column: todo
unblock-when: [trdd:RZBQIM54]
blocker-probe: t=$(trddgrep --design-dir design show RZBQIM54 --porcelain | cut -f3); case $t in complete|completed|published|live) echo CLOSED;; *) echo OPEN;; esac
blocker-probe-canary: match:^(OPEN|CLOSED)$
blocker-holds-if: match:^OPEN$
---

# Swap the standalone Deck and Tokensaver plugins for the integrated mods on this machine

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

Column blocked (pre-block-column todo), nothing done. Blocked on TRDD-RZBQIM54, the pre-publish behavior audit
(orchestrator ruling 2026-11-04). For the gap after that audit closes: do not start before publish.py --minor 0.7.0 has succeeded (0.7.0 published by publish.py
--minor and served by the marketplace). Minted 2026-11-04 by the eleventh mods expert on the orchestrator's review of
state 13 (reports_dev/goal/20261104_201814+0100-orchestrator-state-13.md, local to the developer machine): none of
TRDD-O5LUMKPW, TRDD-RD1ISPMN, TRDD-71KVH9PA and TRDD-0M2WY8KD owns the M6 steps (the RD1ISPMN and 71KVH9PA STATE blocks put publishing out of their scope and give the publish and
install step to the orchestrator; their Owner directive 2 sections give the uninstall to the orchestrator as M6), so
this card owns them. The owner's 'enable the integrated version' is met by the on-by-default master switches (orchestrator
correction 2 of ruling 4); no separate enable step.

Who works it: only the M6 agent the orchestrator dispatches. The install and the reload need the owner present (the owner
types /reload-plugins, or the run tool does it if ON). No agent starts this card by draining the board.

Why the publish itself is not a blocker: the orchestrator first preferred column blocked with one unblock-when decision predicate and no
blocked-by. trddgrep lint refuses a blocked card whose blocked-by is empty (BLOCKED-WITHOUT-BLOCKER, measured on a scratch
corpus on 2026-11-04), and no open card closes when the publish happens: TRDD-O5LUMKPW can close on the owner's ruling
before the publish runs, and TRDD-5LPSG7AV, whose GOAL LEDGER step 14 holds the publish, carries the owner goal "complete all
TRDDs" and has no acceptance checklist (inferred from a grep miss on its shown text, not measured otherwise), so it would likely close well after the publish (inferred from its goal, not measured; corrected after review: the commit 5df0343 body called this a deadlock, which overstated it, since trddgrep move --clear-blocker exists). NEXT ACTION: once TRDD-RZBQIM54 is closed and 0.7.0 is published and served, step 0.

Scope trade-off: this is one machine's work (the owner's own installs and settings), which the TRDD scope rule routes to
LOCAL. It is kept in PROJECT because TRDD-W02X8PYG, a PROJECT card, cites it, and a PROJECT card must not cite a LOCAL one.
No home path, username or secret is written on this card.
ORCHESTRATOR 2026-11-04, as amended by ruling 7 point 9: "Orchestrator must-fix items 4a to 4g (section below) supersede M6 steps 1, 2, 3, 5, 7 and 8 where they differ".
PUBLISH UNBLOCKED 2026-11-10 (measured by the coordinator on the release worktree, and recorded on RZBQIM54's STATE): the strict CPV gate returns CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=34, exit 0, so publish.py's blocker is gone. Not acted on here: the coordinator owns the publish step and the standalone-plugin uninstall; this card does not move until it does.
UPDATE 2026-11-12: release 1.0.0 ships Tokensaver with its master switch off by default (TRDD-71KVH9PA, commit 5ee6ab5), so the swap needs two extra steps. Before the swap: read the stored tokensaver.master value on this machine, because a stored on beats the default and would run beside the standalone plugin. After the standalone tokensaver plugin is uninstalled: switch tokensaver.master on (the /mods-switches pane or the switches tool). Deck has no standalone detection either; the standalone Deck plugin was not found enabled on this machine on 2026-11-12.

## Owner authorization (verbatim, 2026-11-04 evening, typos kept)

> "once the Deck mod and the tokensaver mod have been fully integrated into the mods-expert-developer-plugin, you can uninstall the Dock plugin and the tokensaver plugin, and you will publish/install the mods-expert-developer-plugin and enable the integrated version of the two instead. I also want to remove the animation of the clawd mascotte from the integrated version, since that animation waste space and cpu time."

<!-- cspell:ignore mascotte standalones -->

- "Dock plugin" is read as the Deck plugin (deck@deck), as on TRDD-RD1ISPMN; the standalone Tokensaver is
  tokensaver@claude-tokensaver.
- The mascot removal is the work of the port cards (TRDD-RD1ISPMN, TRDD-71KVH9PA), not of this card.

## Why this card holds the merge-back

Step 9 keeps the merge-back inside this card on purpose: the agent-update card (TRDD-W02X8PYG) edits sources on the merged
main, so it is blocked on this card, and its blocker clears only after the merge-back.

## M6 order

0. Record the owner's standalone deck and tokensaver settings (names and values, for step 8). Copy their plugin data folders
   to reports_dev/goal/m6-backup/ (never committed) and record each copied path and its size. Measure whether uninstall removes
   a plugin's data folder from the CLI help, the docs or a scratch config directory, never by uninstalling for real.
1. Install the integrated plugin.
2. The owner reloads: the owner types /reload-plugins, or the run tool does it if ON.
3. Observe, with the standalones still enabled, that the
   integrated Deck and Tokensaver mods show paused, with the pane notice, logged once. Read each mod's debug-log switch value
   first; tell the owner before switching it on for the check; record the log file's path; after the check, restore each
   switch to the value read before the check. If a switch was off before the check, move its log file into
   reports_dev/goal/m6-backup/, so restoring the switch leaves nothing behind; if it was on, leave the owner's file in place
   and record the lines the check added.
4. Disable the standalones; do not uninstall them yet.
5. The owner reloads again: the owner types /reload-plugins, or the run tool does it if ON. If the integrated mods do not load after it, a full restart by the owner is the fallback (inferred from a memory note, not measured; measure at M6 step 5). The TRDD-5LPSG7AV ledger, verbatim: "0.6.4 is installed and loaded by a full restart, not /reload-plugins (inferred from a memory note, not measured)".
6. Observe the integrated mods active. As a precaution only, look at the double-running guard's pane notice before AND after
   the next turn. Then run the live checks (acceptance boxes 3 and 4).
7. Uninstall the standalones. Before running it, record the RULE 0 audit trail on this card: the owner text authorizing it
   (quoted under Owner authorization), the exact command, and the time.
8. Settings migration: apply the settings recorded in step 0 to the integrated mods wherever an equivalent switch or option
   exists, and list on this card every setting that has no equivalent. No port card owns this mapping: TRDD-RD1ISPMN says
   "Stored upstream prefs do not carry over: the integrated store is this plugin's own and re-keyed", and a grep of
   TRDD-71KVH9PA found no mapping.
9. Merge back to dev main and to requirements/integrated-mod-controls, then close TRDD-0M2WY8KD (its STATE: it closes in the
   merge-back that follows the 0.7.0 publish, once its two test files pass on each branch).

## Acceptance checklist

- [ ] `claude plugin list --json` shows the integrated plugin enabled with no errors, and both standalones absent.
- [ ] Both integrated mods' master switches read ON after the uninstall.
- [ ] Both integrated mods work live: the Deck band and panel draw; the Tokensaver status reports on and a noisy shell
  output reaches the model trimmed with the trim switch on; the trim switch's value is read before the check and exactly that value is restored after it.
- [ ] The guard shows no double running: one band and one trim, before and after the next turn.
- [ ] The backup exists in reports_dev/goal/m6-backup/ (never committed), and this card lists what was copied: each path and its size.
- [ ] The step 3 check is recorded: both integrated mods paused, the pane notice shown, one debug-log line each; the owner was told before any debug-log switch went on, each log file's path is recorded, each switch is restored to the value read before the check, and each log file the check created is moved into reports_dev/goal/m6-backup/.
- [ ] The RULE 0 audit trail of the uninstall is on this card: the owner text authorizing it, the exact command, and the time.
- [ ] The settings migration is recorded: each setting applied, and every setting with no equivalent listed.
- [ ] The merge-back is done on dev main and on requirements/integrated-mod-controls, and TRDD-0M2WY8KD is closed.
- [ ] Item 4j's live loader check is recorded: in a new session with the owner present, Deck loads, its switches list in /mods-switches, and the status line draws.

## Related

TRDD-RD1ISPMN and TRDD-71KVH9PA (the ports and their double-running guard), TRDD-AXE8CUWR (the pane notice line),
TRDD-5LPSG7AV (GOAL LEDGER: the publish), TRDD-0M2WY8KD (closed in step 9), TRDD-RZBQIM54 (the pre-publish audit, this card's blocker), TRDD-W02X8PYG (the agent update, blocked on
this card).

## Approval log

- 2026-11-04T20:26:07+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-11-04T20:51:44+0100 — column → blocked. orchestrator ruling 2026-11-04: blocked on the pre-publish audit TRDD-RZBQIM54
- 2026-11-04T20:51:44+0100 — Owner (user) approval for the uninstall of step 7, on record: the owner's text quoted verbatim under Owner authorization ("you can uninstall the Dock plugin and the tokensaver plugin"). Recorded by the eleventh mods expert on the orchestrator's ruling. min-approval-requirement stays none: with user, trddgrep validate reports MANDATE-FORGED and APPROVAL-NO-TOKEN on this self-issued mandate, which has no server-minted token (measured on a scratch corpus 2026-11-04).
2026-11-09T16:05:00+0100 — M6 step 0 done (measure only, nothing removed): the three standalone stores are copied to reports_dev/goal/m6-backup/store/ (deck_deck 24908 B, tokensaver 42681 B, mods-expert-developer-plugin 24 B) with README.md recording every setting value and the prepared step-8 mapping. Both standalone data folders (~/.claude/plugins/data/deck-deck, tokensaver-claude-tokensaver) do not exist, measured with ls, so nothing was copied from them. Next: step 0's remaining half is the uninstall-behavior measurement (does uninstall remove a plugin's data folder), which the CLI help answers (--keep-data preserves it), so no plugin is uninstalled to find out.
(duplicate of the entry above)

## Orchestrator must-fix items for the M6 brief (verbatim, 2026-11-04)

4a. Step-3 "logged once" check:
    - after the step-2 reload, read the debug-log switch and tell the owner its value;
    - switch it on;
    - the owner reloads once more, or a measured re-trigger is used;
    - count exactly one guard line across that reload and 2 turns;
    - then ask the owner whether to switch the debug log back off.
    The ported guard's logging rate (once per load or once per install) is measured in the DT probe run; if it is once per install, use the pane notice only.
4b. Step 7, RULE 0:
    - verify the backup;
    - restate the exact uninstall command;
    - list what it removes;
    - wait for the owner's live confirmation;
    - record the owner's words, the command and the time.
4c. Migration:
    - tell the owner every switch flipped;
    - never turn a master switch off, or a rule-1 or rule-3 switch on, without the owner's go-ahead;
    - re-check the master-switch box after step 8.
4d. Step 1 is "update to 0.7.0", not install: 0.6.x is loaded.
4e. One joint RULE 0 confirmation covering the standalone uninstalls and the mod-manager@claude-mod-manager uninstall (ledger step 14).
4f. Before M6, read the master-switch defaults of the merged tree. reports_dev/mods-expert/20261104_175928+0100-DT.md:186 [orchestrator correction of its verbatim text, 2026-11-04; it read "Your report section"] says "Defaults stay off for every other user", while card C says "the owner's enable is met by the on-by-default master switches". If the defaults are off, M6 needs an explicit enable step, cited to directive 2: "enable the integrated version of the two instead".
DT reading of 4f, PROVISIONAL (2026-11-04): in code, the merged tree supports neither statement: feat/deck-tokensaver at fba28a7 (release main 01cc4d8 merged) defines no Deck or Tokensaver switch yet (no hooks/*.ts file names either mod), and a switch takes its defaultOn when nothing is stored (hooks/switches/logic.ts:137 at fba28a7). By ruling (correction 2 of ruling 4, recorded in the TRDD-RD1ISPMN and TRDD-71KVH9PA STATE blocks), this card's statement holds once the ports define their master switches with defaultOn true. 4f stays OPEN until the ports define the switches, and is re-read on the release tree after the DT merge. reports_dev/mods-expert/20261104_175928+0100-DT.md:186 ("Defaults stay off for every other user") is STALE: it predates correction 2.
4g. (Ruling 7 point 9, 2026-11-04.) M6 steps 2 and 5 are a new session: claude without -c or --resume (a full restart) [orchestrator amendment 2026-11-04], not /reload-plugins: a disable of the standalones does not rebuild our plugin (measured) [orchestrator correction 2026-11-04: measured for another plugin's hot reload only; a disable, enable or install mid-session and a /reload-plugins after a change are inferred, not measured], and a partial load gives no verdict.
8b. (Ruling 7b part B point 4, 2026-11-04.) Carry the owner's standalone Deck and Tokensaver preferences (Deck style, city, sections, and every Tokensaver preference) into the integrated mods:
    - read them from the step-0 backup;
    - the M6 agent lists each value; the owner sets it in the integrated mod's pane, guided, or the agent uses the mod's own command where one exists; nothing writes a store file [orchestrator rewrite 2026-11-04: signed values written outside the plugin count as none (A1), so a store write would fail anyway];
    - tell the owner every value carried;
    - list for the owner every value that has no integrated equivalent.
    The owner's weather location carries over with the owner's consent from the standalone Deck; a new user's default follows the switch rules (orchestrator, 2026-11-04, item E). Order (orchestrator, 2026-11-04, final review round, item 2): first the owner turns deck.weather on (only the person can turn it on), then the city is set; the M6 agent cannot turn weather on. Done before step 7 (uninstall).
4h. (Orchestrator, 2026-11-04.) Live check on Desktop as well: each integrated mod's notice line shows in the switches pane on Desktop. Deck's Desktop styles render on Desktop is part of the live check (orchestrator, 2026-11-04, item E). (Orchestrator, 2026-11-04, rulings on DT's report, verbatim excerpt.) Add to card C 4h: measure isInteractive on Desktop; if it is true there, I may rule a gate for -p and SDK later.
4i. (Orchestrator, 2026-11-04, amendments to the D1b rulings, verbatim excerpt.) Your two live measurements go onto card C (TRDD-HAK91K6S) as item 4i: the per-read cost on the real host, and how many sessions one module serves on Desktop (R1's one-clock-per-module rests on it). (Orchestrator, 2026-11-04, rulings on DT's report, verbatim excerpts.) (b) stays documented, not measured; the live check goes onto card C 4i as an optional item. Do not run a probe against the real store.
4j. (Orchestrator ruling 2026-11-05 on DT's D1b-1 step 4, verbatim.) "After the install, in a new session (claude without -c or --resume), with the owner present: Deck loads, its switches list in /mods-switches, and the status line draws." The wired Deck's loader was not live-tested before publish (no probe against the real store; a scratch configuration folder has no login, and probe.py's typed steps could start an OAuth flow at the login selector). On the veto list of TRDD-RD1ISPMN as "loader not live-tested before publish".
