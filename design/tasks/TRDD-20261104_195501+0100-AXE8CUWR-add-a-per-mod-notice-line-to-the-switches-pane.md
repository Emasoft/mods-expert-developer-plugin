---
trdd-id: AXE8CUWR
title: Add a per-mod notice line to the switches pane
column: dev
status: tasked
created: 2026-11-04T19:55:01+0100
updated: 2026-11-05T06:00:30+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T19:55:01+0100
implementation-commits: [72d3969, d419729, 42d988d, 11a741e, 3354881, 3ea2500]
---

# Add a per-mod notice line to the switches pane

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

Column design, no implementation. Minted by the tenth mods expert (DT) as a derived card of the Deck and Tokensaver ports
(TRDD-RD1ISPMN, TRDD-71KVH9PA), after the review of card commit 219cfba found that no card owns this change. NEXT ACTION: the
orchestrator decides who builds it: the owner of TRDD-5IK59SQ2 (M4c), whose file set hooks/switches/ it changes, or a later
writer once that card closes. No second writer edits hooks/switches/ while TRDD-5IK59SQ2 is open.
CURRENT STATE 2026-11-04 (supersedes the lines above): column dev. The orchestrator assigned it to the M4c owner (ninth mods expert), who owns hooks/switches/ under TRDD-5IK59SQ2; built in the release clone (a sibling checkout of release main), after C6a (34f5c20). NEXT ACTION: build the Scope and the Acceptance checklist, commit with TRDD-AXE8CUWR in the subject, record the SHA here and in implementation-commits.
CURRENT STATE 2026-11-04 (supersedes the lines above): column dev; built in 72d3969 on release main (after acc8742). trddgrep accepted the design to dev move directly (89560a1), with no refusal and no intermediate step. Met: through the pure rules the pane and the tool use (switches/logic.ts noticeOf, modSection, statusText), with a fake mod and a getter map of the test's own, the notice shows under the mod's heading and above its rows and beside the mod in the listing; no getter, undefined or '' shows nothing; a changed answer shows at the next drawing or listing (the getter is never cached); a throwing getter gives a plain notice without the error text and the rows stay. Not met literally: the kit cannot register a fake mod in the loaded hooks module (a test file's import is a separate module instance, measured), so no kit test reaches the redraw or the glue in switches/register.ts. 8 mutations of the rules turn the suite red; 6 of the glue survive (the pane and the tool passing the notice, the notice Text, noticeChanged, defineNotice, the masking of the logged error). The boxes stay unticked until a kit test reaches that glue. NEXT ACTION: the REVIEW fork of 72d3969; then DT's first real defineNotice (Deck) ships with a kit test that kills those 6 mutations (mutc7.py G1 to G6 in the M4c raw logs).
CURRENT STATE 2026-11-04 (supersedes the lines above, including their Met line and their pointer to raw logs): column dev; built in 72d3969 and its review fix d419729 on release main. Met by the pure rules only (switches/logic.ts noticeText, noticeOf, noticeErrorLine, modSection, statusText), tested in the kit with a fake mod and a getter map of the test's own: a notice is one printable line of at most 200 characters, whatever the getter answers (line breaks, control and direction marks, over-long text, white space alone as none); it is placed under the mod's heading and above its rows, fitted to the pane's width, and beside the mod in the listing; a changed answer is read at the next call; a throwing getter gives a plain notice without the error text, the rows kept, and its debug line is masked (tokens, keys, the home folder); defineNotice refuses a mod with no switch. 16 mutations of these turn the suite red. Not met: no kit test reaches the glue in switches/register.ts. Measured in the review of 72d3969: a mod defined and a pane registered from a test file are not the ones that answer (the loaded module answers the pane and the tool), and an inline test plugin may not call this plugin's functions (the loader refuses it). 7 mutations of that glue survive (the pane and the tool passing the notice, drawing it, noticeChanged, defineNotice keeping the getter, logging a getter's error, reading the home folder at the start). The boxes stay unticked, and the open item in the Acceptance checklist holds the card open until Deck's kit test (TRDD-RD1ISPMN) reaches them. NEXT ACTION: DT wires Deck's notice with defineNotice after its defineSwitches, and its kit test kills those 7 mutations.
CURRENT STATE 2026-11-04 (supersedes the lines above where they differ): review fixes 42d988d (the home folder read in its own try at the start, its failure said once, masked and printable), 11a741e (a notice cut by code points; the test feeds C1 controls, U+0085 and every direction mark), 3354881 (fitLabel counts and cuts code points, so the pane never draws a lone surrogate) on release main. Glue-mutant count reconciled: 72d3969's message says 6 survivors, G1 to G6 (G4 was then the error logged unmasked); d419729 changed G4 to the error not logged once the masking had a pure test, killed the new G7 (defineNotice taking a mod with no switch) and added G8 (the home folder not read at the start), which survived, so 89c4ef4 says 7. On e2c256f the test of 42d988d kills G8 (mutc7, mut-axe-r2): 6 survive, G1 to G6 (the pane and the tool passing the notice, noticeChanged, the getter's error logged, the notice item drawn, defineNotice keeping the getter). NEXT ACTION unchanged: Deck's kit test (TRDD-RD1ISPMN) reaches those 6.
2026-11-05: item S is DROPPED by the owner (owner ruling 1 in the Approval log), not done. M11 removes it on release main as a forward change; the drop commit id goes here when it lands.
2026-11-05 M11, owner ruling 1 applied: item S (the person-only refusal of an agent on) is removed in 3ea2500 on release main; Claude may turn any switch on and the toast is the only notice. M12 drops the person-only TODO of Deck weather.

## Need

The orchestrator's rulings of 2026-11-04 (quoted on TRDD-RD1ISPMN and TRDD-71KVH9PA) require text that the switches pane of
TRDD-5IK59SQ2 cannot show today, because it draws only switch rows (hooks/switches/logic.ts:27-42: SwitchDef holds id, mod,
label, defaultOn, key, legacyKey and nextSession; hooks/switches/register.ts:207 draws the rows):
- Deck's visible count of swallowed errors, in Deck's section of the settings pane (correction 3, point 3);
- each integrated mod's pause notice while its standalone plugin is enabled, in plain words (correction 3, point 1);
- each integrated mod's detection errors, in its own section, never only in the debug log (correction 6, point 2).
The debug log is off by default (TRDD-RWD5PW76), so none of these may live only there.

## Scope

A per-mod notice line in the switches pane, under the mod's heading: a mod registers a getter for its current notice (text or
nothing), the pane draws it above that mod's rows, the typed switches tool lists it beside the mod, and a change redraws the
pane. Nothing else of the pane changes.

## Acceptance checklist

- [ ] A kit test registers a fake mod with a notice getter and finds the text under that mod's heading in the pane model and
  in the tool's listing; with no notice, nothing is drawn.
- [ ] A notice change redraws the pane: a kit test changes the getter's answer and finds the new text after the redraw.
- [ ] A getter that throws draws a plain error notice for that mod and never hides its rows (fail visible, not silent).
- [ ] Every new guard is mutation-checked; all repo checks clean.
- [ ] Open item (orchestrator, review of 72d3969): the register.ts glue (the pane and the tool passing the notice, drawing it, noticeChanged, defineNotice keeping the getter, logging a getter's error masked with the home folder) is mutation-checked by Deck's kit test, TRDD-RD1ISPMN. The card does not close before this item.

## Related

TRDD-5IK59SQ2 (owner of hooks/switches/), TRDD-RD1ISPMN and TRDD-71KVH9PA (the needs), TRDD-J7X3ZN7B (the global panel,
whose readiness column overlaps the pause notice), TRDD-RWD5PW76 (the debug log).
<!-- cspell:ignore mutc -->

## Approval log

- 2026-11-04T19:55:01+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-11-04T21:27:29+0100 — column → dev. Orchestrator directive 2026-11-04: the M4c owner builds it next in the release clone (one writer for hooks/switches/)
2026-11-05, owner ruling 1, verbatim (AskUserQuestion, relayed by the orchestrator). Question: "Golden rule G13.1 says: "Every mod function can be switched on and off, so the user or the agent activates only the functions it needs." The security fix (item S) lets only you, not Claude, turn ON five switches [...] How should G13.1 apply?" Answer chosen: "Drop item S" — "Follow G13.1 literally: Claude may turn any switch on, and a toast is the only notice you get."
2026-11-05, owner ruling 2, verbatim (AskUserQuestion, relayed by the orchestrator). Question: two wip commits appear in the 0.7.0 changelog. Answer chosen: "Skip wip in changelog (Recommended)" — "Add one cliff.toml rule that skips commits whose subject starts with wip. No history rewrite."

## Orchestrator rulings during M4c (verbatim)

- 2026-11-04, security item S: "Finding, checked in release main: the switches MCP tool calls setSwitch($, request.set, request.on, 'agent') for any registered switch (hooks/switches/register.ts:276). setSwitch only shows a toast for an agent's change (register.ts:155). So Claude can turn on mods-manager.auto-update (Q10, off by default), self-command.run, self-command.list-commands, self-command.pane and probe-runner.probe (each gives Claude a new tool at the next session start), and later deck.weather (an outward send). Each was set off by default so that only the person turns it on. Ruling: 1. SwitchDef gains a person-only-on mark. Mark every switch whose default is off under correction 4 or 7, and every switch whose on gives Claude a tool or the power to run commands or sessions. Debug-log switches are not marked: they write a local file only (G14.1), with no outward effect and no new power. 2. Refuse an 'agent' write that turns a marked switch on. The refusal names the switch and says the person turns it on in /mods-switches or by typing the mod's command. Turning any switch off stays allowed for the agent. A mod's own command writing with byOf(...) === 'agent' (the setSwitches path) is refused the same way. 3. The per-plugin Auto opt-in of Q10: report whether Claude can set it, by tool or by command. If it can, apply the same refusal. 4. self-command.run queues slash commands that may read as the person's (origin not yet measured for the queue). Check that its label or README says plainly that turning it on lets Claude act as the person for slash commands, person-only switches included. Add that line if it is missing. 5. Tests, each with a mutation that must turn it red: an agent's on is refused for each marked switch; an agent's off is allowed; a person's on is allowed (the pane, a composer-origin command); the setSwitches path is refused too. Mutation: drop the check. 6. In your report: the marked switches, each with its reason; the Q10 answer; the refusal text."
