---
trdd-id: RD1ISPMN
title: Integrate the Deck mod into this plugin with per-function switches, on by default
column: design
status: tasked
created: 2026-11-04T18:08:09+0100
updated: 2026-11-05T13:28:13+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T18:08:09+0100
npt: []
relevant-rules: [1.1, 2.1, 3.1, 7.1, 8.2, 9.2, 12.1, 13.1, 14.1]
implementation-commits: [f751a74, 56a2935, 8cacd31, 896a888, e9d6d1f, 9cd607f, ec62bd2, a8f98bb]
---

# Integrate the Deck mod into this plugin with per-function switches, on by default

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

CURRENT STATE 2026-11-04 evening (supersedes the gate and NEXT ACTION lines of the paragraph below): every phase-2 gate
has a ruling (the orchestrator rulings and their seven corrections, section Orchestrator rulings). In force: the master switch
is on by default and each function takes its upstream default, a cost-incurring function excepted (off by default, said
so in plain words; Deck has none, section Functions); no-copy markup idioms get one exemption entry per destination file (path,
normalized phrase, exact occurrence count); adapted files get a registry checked by a test; the whole mascot is removed.
Phase 2 started: one agent, the base commit (the no-copy and adapted-files test changes) first, then the Deck port, then
Tokensaver, on feat/deck-tokensaver.
NEXT ACTION (orchestrator, 2026-11-04): "measure detection (probe), port the parts that are neither the guard nor a notice, wire the notices
after merging release main at the TRDD-AXE8CUWR commit, port the guard after the measurement".
The detection measurement and its results: section Double-running guard and the DT NOTE lines below.

Column design. Phase 1 (decision, licences, cards) done by the tenth mods expert (DT); no feature code yet. Approach PORT,
measured (section Decision; reasons corrected after REVIEW rounds 1 and 2 on 2026-11-04, both applied here). Code goes in the
deck-tokensaver worktree of the release repository, branch feat/deck-tokensaver, fast-forwarded on 2026-11-04 to release main
150a6f6 (the G13 switch registry of TRDD-5IK59SQ2, hooks/switches/) and then to 0ec4570 (that registry's review round); that
card is still open and M4c may change the registry, so release main is merged again before phase 2 ends. Owner directive 2
(below) removes the mascot from the integrated Deck (section Mascot removed; the quote was compared as a string with the
directive file) and authorizes the later uninstall of the standalone copies. Phase 2 gates: (1) registry in the branch: MET; (2) the
no-copy finding below has a ruling; (3) the orchestrator answers the per-file excerpt-lock question (Open design points).
Publishing is out of scope for this card: the orchestrator owns the owner's "publidh and install the plugin" step and holds
publish.py; PRRD G7.1 keeps the release hold, and owner question 9 ("Build before 0.7.0") makes TRDD-5IK59SQ2 and
TRDD-RWD5PW76 release work, so this mod ships at the earliest in the release that carries them. Evidence and raw logs are
local to the developer machine, not in the repository: reports_dev/mods-expert/20261104_175928+0100-DT.md and
reports_dev/mods-expert/dt/. NEXT ACTION: wait for (2) and (3), then build in the order of the Plan section.
RULING 5 RELAXED 2026-11-04 (orchestrator, verbatim): "the notice is built in the same release by M4c (TRDD-AXE8CUWR); the port wires the three notice uses after merging release main at that commit; acceptance requires all three visible".
DT NOTE 2026-11-04 (the tenth mods expert's words, not the orchestrator's): the notice-independent parts are ported first; the detection guard is ported only after its live measurement (orchestrator corrections 1c and 1d). If candidate 1 (the plugins input of engine.create) proves unreliable, the port stops and reports to the orchestrator before porting the guard (correction 1e; correction 3 still holds) [superseded 2026-11-04: rulings 7 and 7b settle the detection]. A name measured under a --plugin-dir load is not generalized to the marketplace install M6 uses (deck@deck, tokensaver@claude-tokensaver): an exact-id match stays UNVERIFIED until it is measured under an installed, settings-enabled load, which card C (TRDD-HAK91K6S) step 3 confirms (correction 2). The dependency on TRDD-AXE8CUWR is a completion gate carried by the unticked notice boxes, not an npt entry (orchestrator card fix 1).
DT NOTE 2026-11-04, timers (orchestrator addendum; PRRD G13.1, the owner's: an off function runs nothing, its timer included): Deck's 150 ms clock starts only when its switch reads on, and each tick re-reads the switch and stops on an off, the pattern of hooks/mod-manager/auto-timer.ts at release main 34f5c20. hooks/switch-followers.ts is M4c's file: the lines it needs for Deck's switches go to the orchestrator in the DT report, never edited here.
RULING 7 2026-11-04 (orchestrator; verbatim in section Ruling 7): the guard is ported under it: candidate 1 only; a one-entry list is partial; verdicts in the store keyed by session id, last 20 sessions; unknown and every failure pause; the name before any @ matched exactly. It replaces the DT proposal of 2026-11-04 and rows 3 to 5 of section Double-running guard (re-marked there). One built-in plugin, the AGENTS.md reader, can be disabled with /plugin (skills/mods-doc-cc-native-memory-and-rules/references/chapter.md:430); whether all of them can is unverified. If they can, a session where this plugin is the only one reads partial at every load and stays paused: the notice says so.
RULING 7b 2026-11-04 (orchestrator; verbatim in section Ruling 7b): the verdict is monotonic within one session id (run may become pause, never the reverse; unknown is a pause that lifts only in a new session id); any list naming the standalone pauses; the one-entry partial test applies to a session's first list only; the cap of 20 sessions stays. The guard (D1c) is built under 7 and 7b.
REVIEW OF 7b, 2026-11-04 (orchestrator; verbatim in section Orchestrator amendments after the review of ruling 7b): the guard adds an LRU verdict cap, a once-per-session toast at the first pause, notices restored after a hot reload (noticeChanged), and, only if the built-in plugins can be disabled or the check is inconclusive, an off-by-default "run even when detection is unknown" switch; the notice says to start a new session: claude without -c or --resume; the guard box is rewritten to these cases. Timers wait for the fixed auto-timer SHA.
CURRENT STATE 2026-11-04 late (supersedes the NEXT ACTION lines above): D1a (f751a74) and the merge of release main 181daee (d6b882f) are on feat/deck-tokensaver. D1b is ruled: R1 to R12, the amendments, the answer to the five corrections, the final review round and the no-copy ruling, all verbatim in section D1b rulings, with a dated line under each original ruling a later one superseded. Baseline before wiring, measured on d6b882f: 60 kit tests fail in 27 files, none a Deck, switches, mod-manager, requirements-drafts, self-command or probe-runner test file; pytest 994 passed, 9 skipped. NEXT ACTION: D1b-1, the faithful port, as an unmerged intermediate commit; then D1b-2, D1c, D1d, then the Tokensaver port. Later the same night: R8 final, R6 revised and the benchmark ruling (no memo) were ruled, and the d6b882f baseline was accepted.
CURRENT STATE 2026-11-05 night, RESUME POINT (supersedes the NEXT ACTION lines above): feat/deck-tokensaver head 9cd607f (wip). D1b-1 step 3 is done (896a888, e9d6d1f) and its review fixes are committed in 9cd607f, but not finished: run the full kit and pytest (scratchpad kitfull.sh) and compare the failing set with the d6b882f baseline, then send the step report (reports_dev/mods-expert/20261105_013953+0100-DT-step3-review-fixes.md). Step 4 is ruled (option a, no live probe; section D1b-1 step 3, the review). Still open: m9 (Deck's start order) for the orchestrator; D1b-2 (the mascot and the fold timer removal, m1 session.end); D1c; D1d. The Tokensaver port is not started. The merge of release main is still due (release main at 839fd6a plus item S work in progress), after the orchestrator says M4c's C6b series has ended, with the placement rules recorded in section D1b-1 step 3.
CURRENT STATE 2026-11-05 02:25, M12 (the twelfth mods expert; supersedes the RESUME POINT line above): the step-3 review fixes' full kit and pytest are done (section D1b-1 test runs): the kit equals the d6b882f baseline; pytest has 2 failures in tests that read the ported deck.test.ts, each waiting on a ruling. The $.store question of state-22 is answered from the docs, no probe run (reports_dev/mods-expert/20261105_021627+0100-M12-step3-store-namespace.md, local). NEXT ACTION: merge release main (the orchestrator's M12 brief, step 2), then D1b-2, D1c, D1d, then the Tokensaver port. Still open: m9; the text of m1 (session.end), which no local report holds.
CURRENT STATE 2026-11-05 03:18, M12 (supersedes the 02:25 M12 line above): feat/deck-tokensaver head dcfee00 (release main merged at ed64cd0; 872e6bd not merged). Done: ruling A (ec62bd2), R1 (a8f98bb), C (00bd891, then dcfee00), D and R2 answered read-only, R3 measured (upstream 0.4.12 keeps working after a /clear, so ours, which stops, blocks any D1b merge), item S found revertible as the six commits a clean revert needs (ed64cd0, and possibly bd3c95b, are not item S), and the low-load full kit at dcfee00 equal to the baseline's 60. No D1b-2 code is written yet. NEXT ACTION: the round-2 review of the D1b-2 proposal r2 (reports_dev/mods-expert/20261105_031107+0100-M12-d1b2-proposal-r2.md, local), then the orchestrator's rulings on Q1, Q2, Q3, Q5 and Q6, then commits 1 to 4 in r2's order, the /clear carry first. The /clear measurement tests, ours and upstream's, are kept as reports_dev/mods-expert/m12/20261105_031900+0100-clear-measure-ours.test.ts and -upstream.test.ts (local); the scratch copies are removed.
CURRENT STATE 2026-11-05 03:20, M12 (updates the NEXT ACTION of the 03:18 M12 line above; its head and evidence paths stand): the D1b-2 proposal had its two review rounds. r2 is reports_dev/mods-expert/20261105_031107+0100-M12-d1b2-proposal-r2.md, and the round-2 dispositions and six questions are in reports_dev/mods-expert/20261105_031907+0100-M12-d1b2-r2-review2-dispositions.md (both local). One found fact changes the carry: per the docs (mods-and-events chapter.md:100, whose example is session.start; not run for classic.SessionStart), a second unmatched hook on an event stops the module from loading, and requirements-drafts already hooks classic.SessionStart with no matcher, so the carry is lazy adoption, a hook with its own matcher (allowed once per matcher, not run), or a dispatcher in index.ts after merging release main. No D1b-2 code is written. NEXT ACTION: the orchestrator's rulings on Q1, Q2, Q3 (P, L or A), Q5 (a, b or c), Q6 and Q7; then commit 1 (the carry), then commits 2 to 4.
CURRENT STATE 2026-11-05 04:38, M12 (updates the NEXT ACTION of the 03:20 M12 line): the orchestrator ruled Q1 (i), Q2 300 ms (correction 1, 04:42), Q3 L, Q5 (c), Q6 dropped, Q7 accepted, item S dropped by the owner, and the Tokensaver port moved to M13 (feat/tokensaver); M12 does Deck only. NEXT ACTION: D1b-2 commit 1 (the lazy-adoption carry), then commits 2 to 4, then D1c (its shared part kept apart from Deck's wiring for M13) and D1d; merge release main once M11 gives the item S removal commit, and drop the person-only TODO in hooks/deck/switches.ts then.
M12 checkpoint 2026-11-05: D1b-2 commit 1 is committed as 30792466005fc06cc1576517c8281b60a65c4ea7 on feat/deck-tokensaver. This is NOT clean verification or release readiness. Integration 71 pass/0 fail; final mutation run 19 executed, 18 red, turn.step green (unpinned; refused picker locator is not execution). Required gates remain failing: full kit 627 pass/61 fail versus recorded dcfee00 baseline 610 pass/60 fail; TypeScript exit 2 with 62 reference-module diagnostics (counts/folders alone do not prove exact equivalence); pytest 992 pass/9 skip/2 fail (absolute-path fixture failure and nested long-input logic timeout). Isolated logic.test.ts then passed 45/0, enclosed exit 0 in 167.59s; this does NOT establish load as the timeout cause. Countdown-shaped output is assertion evidence, not an established long-folder root cause. Checkpoint exit 0 and actual HEAD independently confirmed. Live checks remain: terminal and Desktop clear/resume followed by a prompt; clear with a running background agent; subagent turn.step passive gating; parent session id inside subagent events. Lazy carry can be consumed by a different new session; passive draws/measures/router lines do not adopt; stale presses before session.end can strand the successor; carried start drops failed-reload notice; measures before adoption are lost; old start ids and clock handle remain until commits 2/4. NEXT ACTION: separate observer-export/dispatcher increment for Tokensaver, then commits 2-4, D1c and D1d. No release-clone writes during M11 reservation, release blocked, no hook bypass, no further content-review round on commit 1.

## Owner directive (verbatim, 2026-11-04, typos kept)

> "you should integrate the Deck plugin mod and the Tokensaver plugin mod into this plugin. so the user only need to install the mods-expert-deeloper plugin and it has automatically the 2 other mods installed as well. of course both must have a on/off switch as a skill and as buttons on the general configuration panel of the mods-expert-developer plugin. and since we are on this, create a TRDDs to make a global setting panel that includes all the on/off switches of all mods integrated into the plugin. so the user has a unique panel to see the configuration of t   proceedlycomplete the integration asap and publidh and install the plugish and install the plugin. proceed autonomously now. decide by yourself. just base all your decisions on verified facts and tests. do not assume anything. ask the advisor."

<!-- cspell:ignore deeloper proceedlycomplete publidh plugish -->

Orchestrator addendum (binding, 2026-11-04): both integrated mods are off by default; port only if dependencies cannot meet
G9.2, G13.1 and G14.1; detect a standalone copy and yield or refuse; copy no node_modules; binary assets only with licence and
size on record; never reword third-party code to get past a check; buttons only on the registry-driven pane of TRDD-5IK59SQ2.
Superseded 2026-11-04 by correction 2 of the orchestrator rulings (ruling 4, re-ruled under PRRD G8.2; section
Orchestrator rulings): both master switches are on by default.

## Owner directive 2 (verbatim, 2026-11-04 evening, typos kept)

> "once the Deck mod and the tokensaver mod have been fully integrated into the mods-expert-developer-plugin, you can uninstall the Dock plugin and the tokensaver plugin, and you will publish/install the mods-expert-developer-plugin and enable the integrated version of the two instead. I also want to remove the animation of the clawd mascotte from the integrated version, since that animation waste space and cpu time."

<!-- cspell:ignore mascotte -->

- "Dock plugin" is read as the Deck plugin: installed_plugins.json lists deck@deck and tokensaver@claude-tokensaver, and no
  path under the plugin cache matches dock (checked 2026-11-04 with a case-insensitive find, depth 3).
- Order, as the orchestrator chose it (not the owner's sentence order, which names the uninstall first): integration complete
  and verified, publish 0.7.0, install it, then uninstall the standalone deck and tokensaver, then switch the integrated mods
  on for this owner. Installing before uninstalling means there is never a moment with neither copy installed. The
  orchestrator runs these steps (M6); this card changes no default for them: the integrated Deck stays off by default for
  every other user, and the coexistence guard keeps mattering until that uninstall.
- Superseded 2026-11-04 by correction 2 (ruling 4): the integrated Deck is on by default for every user, so no step
  switches it on for this owner, and the coexistence guard must yield to the standalone deck from the first session in
  which 0.7.0 is installed while the standalone copy is still enabled.

## Orchestrator rulings (verbatim, 2026-11-04; the orchestrator's decisions under the owner's autonomy grant of 2026-11-04,
the owner may veto them)

> Orchestrator rulings on your phase-1 gates. They are the orchestrator's decisions under the owner's autonomy grant of 2026-11-04, and the owner may veto them. Record each verbatim on the cards with that label. Phase 2 starts now.
> 1. Gate 2, no-copy markup idioms: a narrow scoping. I verified each phrase twice.
> - In token-optimizer 5.13.63, each phrase occurs only in docs-site markup: the font stack in docs-site/src/styles/theme.css; the stroke attributes in docs-site/public/images/*.svg; the opacity animate in docs-site/public/images/*.svg and skills/token-optimizer/assets/status-bar.svg.
> - Each also occurs in sources independent of both plugins:
>   - the font stack: [local project]/node_modules/@vitest/ui/dist/client/assets/index-DlhE0rqZ.css;
>   - the stroke attributes: [local project]/node_modules/@reown/appkit-ui/dist/esm/src/assets/visual/pencil.js;
>   - the opacity animate: [local path]/terminal-motherlode.svg.
> Change tests/test_no_copy_unlicensed.py as follows:
> - Add an exemption list of exactly these three normalized phrases. Each entry records its independent source as proof that it is an idiom.
> - Add a test that the list is closed: a fourth phrase still fails. Prove it with a mutant.
> - Record the ruling on TRDD-0M2WY8KD, which owns the 5.13.63 pin.
> 2. Gate 3, adapted files: a new registry checked by a test.
> - Each entry records the path, the upstream repository, the commit, the upstream path, and the license.
> - Every listed file carries a uniform header naming the same fields, plus a change notice, which Apache 2.0 section 4(b) requires for caveman.ts.
> - The test checks that each entry exists, carries its header, and has its NOTICE line, and that no file with an adapted-from header is missing from the registry.
> - Do not widen THIRD_PARTY_FILES, which stays for byte-verbatim copies. If excerpt_lock.py can host the registry as a second table, put it there; otherwise create a new module, and say which in your report.
> - Carry the Apache NOTICE text and the plan-progress MIT attribution into NOTICE.
> 3. Clawd: confirmed for both mods. Remove the whole figure (drawing and animation) from Tokensaver and Deck's pet, by your file:line plans. The owner named "clawd", and his reason ("waste space and cpu time") covers both mods. Removing the whole figure rather than only its animation is my reading, which the owner may veto.
> 4. G8.2 defaults: no second gate.
> - Tokensaver's master is off by default for every user.
> - Once it is on, each function takes its upstream default, because the owner's directive says to "enable the integrated version of the two instead": the integrated copy must reproduce what the standalone does today.
> - Before Plan step 3, read and record every function's upstream default on the card, with file:line. Name the cost-incurring ones explicitly: sub-agent model routing, escalation re-run (register.tsx:1049-1063), auto-compact. I will list them in the M5 veto list.
> - The same rule applies to Deck: master off by default; once on, upstream defaults; weather off unless /deck city is set.
> 5. Deck's 11 swallowed errors: route each one to the G14 debug log when M4c's debug log lands. Until then, add a TODO naming TRDD-RWD5PW76. Do not make them throw, so user-facing behaviour stays the same. A test must show that each logs. Record them on the card.
> 6. Apply the six unapplied review items in your next card commit; this is not a third review round:
> - the row-budget box: mount with a small maxRows;
> - the redraw box: read register.js:1575 and drop the guess;
> - the Tokensaver space box: pin against the figure's own box at clawd.ts:267 and :371;
> - the report: "compared as a string", record e79a59a, and state the Clawd gate as now met.
> 7. Order: one agent (you), Deck first, then Tokensaver, on feat/deck-tokensaver. The gate-2 and gate-3 test changes land first as one base commit. I chose sequential over two parallel agents because both would edit the no-copy test, excerpt_lock, NOTICE, hooks/index.ts and the skills menu, and two experts already stalled at the same moment at 18:37. After the Deck port lands, I may run Tokensaver as a separate agent from that base. Merge release main again before you finish, since M4c is still committing there.
> Every other rule in your brief and addenda still holds.

<!-- cspell:ignore appkit motherlode reown -->
<!-- cspell:ignore attributename openclaw opencode pathspec segoe -->

### Correction 1 (verbatim, 2026-11-04; replaces rulings 1, 4 and 5 of the message above)

> Corrections to rulings 1, 4 and 5 from the orchestrator, after an adversarial review of the rulings. They replace the earlier text of those three rulings; rulings 2, 3, 6 and 7 stand unchanged.
>
> Ruling 1 (no-copy markup idioms), corrected:
> - Limit each exemption entry to the exact files where the phrase occurs now: tokensaver src/ui/band.ts lines 95 and 174, tokensaver src/ui/clawd.ts line 85, deck hooks/styles-desktop.js lines 55-56. An exemption must not cover any other file. Since ruling 3 removes the whole Clawd figure, drop the clawd.ts entry if that file is not ported, and say so on the card.
> - My earlier claim "token-optimizer hits are docs-site markup only" was wrong. A full grep (no head) of token-optimizer 5.13.63 measured: the stroke-attribute phrase is in 18 files, and two of them sit outside docs-site and outside any .svg: desktop/token-optimizer-desktop/src/icons.ts and desktop/token-optimizer-desktop/src/clawd.ts. The font-stack phrase is in 1 file and the opacity-animate phrase in 12 files, all inside docs-site or .svg files. Re-run the grep yourself without head and record every hit on the card.
> - Provenance of the opacity-animate phrase: [local folder]/terminal-motherlode.svg is not in any git history and its origin is unknown (file date 2026-02-07). A 120-second search of the node_modules folders under the local volume found no third-party copy, which does not prove none exists. Either find a verifiable third-party source, or record its provenance as unknown on the card and carry it to the owner veto list. Do not cite that SVG as an independent source.
>
> Ruling 4 (G8.2 master switch and upstream defaults), now conditional:
> - Before Plan step 3, read every upstream default of both mods and record each with file:line. Read the cost-incurring ones first: sub-agent model routing, the escalation re-run (tokensaver register.tsx lines 1049-1063), and auto-compact.
> - If any cost-incurring function is on by default upstream, stop before Plan step 3 and report it to me. I rule again on that function before you port it. The rest of ruling 4 (master off by default, functions take their upstream default once the master is on) applies only to functions that incur no cost.
>
> Ruling 5 (Deck's 11 swallowed errors), extended:
> - Routing them to the G14 debug log is not enough on its own, because that log is off by default. Also give the person an always-visible signal, such as an error count in the settings pane. If you judge that not feasible in this increment, record it on the card as an accepted gap and name it in your report.
>
> Standing constraints unchanged: no environment values printed, commits by pathspec only, no push, no install into the real ~/.claude configuration.

### Correction 2 (verbatim, 2026-11-04; supersedes the ruling 1 and ruling 4 text of both earlier messages)

> Second correction from the orchestrator. A review of my previous message and a read of golden rule G8.2 verbatim changed rulings 1 and 4 again. This message supersedes the ruling 1 and ruling 4 text of both earlier messages. Ruling 5 stays as extended in my last message. Rulings 2, 3, 6 and 7 are unchanged.
>
> Ruling 4, re-ruled (decide nothing else on defaults; do not stop before Plan step 3 for this any more):
> - G8.2 verbatim (PRRD.md line 12): "Automatically install required dependencies and external tools and supply usable defaults without separate manual setup or configuration phases, with no unnecessarily restrictive default gates for ordinary authorized use; preserve required authorization boundaries and mandatory permissions, credentials, and platform and service limitations, and honestly disclose these constraints." A master switch that is off by default is a default gate, so the earlier "master off by default" reading is withdrawn.
> - New rule: the Deck master switch and the Tokensaver master switch are ON by default. Every function then takes its upstream default, except a cost-incurring function, which defaults OFF even where upstream has it on, and the pane says so in plain words (G8.2's "honestly disclose"). Cost-incurring means the function sends a model request, changes the model, or triggers compaction. Every function stays switchable by the person and the agent (G9.2, G13.1).
> - Record every upstream default with file:line on the card, and mark each cost-incurring function with what makes it cost-incurring and with its integrated default.
>
> Ruling 1, re-keyed:
> - No line numbers and no upstream paths. Each exemption entry is: the destination path inside this plugin, the normalized phrase, and the exact number of occurrences in that file. The no-copy test asserts all three, so a new occurrence or a new file fails it. The header from ruling 2 and the new paths no longer break it.
> - The whole-file copying question is settled by my measurement, record it on TRDD-0M2WY8KD as written here: after stripping leading whitespace, tokensaver 0.5.1 src/ui/clawd.ts and token-optimizer 5.13.63 desktop/token-optimizer-desktop/src/clawd.ts share zero identical lines of 25 or more characters; tokensaver src/ui/band.ts and token-optimizer src/icons.ts share zero as well. That rules out verbatim block copying; it does not rule out reformatted copying.
> - Opacity-animate provenance, measured: terminal-motherlode.svg is untracked in its [local folder] repository and has no history on any branch. Origin unknown. My node_modules search was bounded ([local volume]/*/node_modules, one level, .svg/.js/.css, 120 s) and its completion was not confirmed, so it proves nothing. Record the provenance as unknown.
>
> Card handling: if the old text of ruling 1 or 4 is already on a card, supersede it with a dated note naming this message; never overwrite or delete the earlier text.
>
> Facts you can cite: the debug log is off by default (release clone hooks/debug-log/logic.ts:15, defaultOn: false), which is why ruling 5 asks for a visible error count. Put that count in the global panel of TRDD-J7X3ZN7B if it fits this increment; otherwise record the gap as accepted. Your scratch script reports_dev/mods-expert/dt/scripts/idiom_hits.py has an unused variable at line 50 (Pyright); scratch only, no action needed.
>
> If you acted on my previous message before this one arrived, say which parts in your report.

### Correction 3 (verbatim, 2026-11-04; adds to correction 2 and replaces it where they conflict)

> Third correction from the orchestrator, from the final review round. It adds to the second correction and replaces it where they conflict.
>
> 1. Double-running guard, new and required for both ports. With both master switches on by default, a person who still has the standalone plugin (deck@deck or tokensaver@claude-tokensaver) would run every hook twice. Each integrated mod checks whether its standalone is enabled. If it is, the integrated mod stays inactive and the pane says why, in plain words (for example: "The standalone Deck plugin is enabled, so the built-in Deck is paused until you disable or uninstall it"). Test both states. Measure which detection method the mod runtime reliably offers, and name it in your report. If none is reliable, stop and report to me before porting.
>
> 2. Wider record of defaults. Besides the cost-incurring functions, record with file:line and the integrated default every function that:
>    - injects context into turns (the reply-voice rule, any UserPromptSubmit or SessionStart injection);
>    - runs a continuous timer or animation;
>    - plays a sound;
>    - makes a network request.
>    This changes no default: only the cost-incurring ones are forced off. The list goes to the owner before publishing.
>
> 3. Ruling 5, tightened. The visible error count is mandatory and belongs to the Deck card TRDD-RD1ISPMN, not the global panel card. Show it in Deck's section of the plugin's settings pane and test it. You may not accept the gap yourself. If it cannot be built in this increment, stop and report to me.
>
> 4. Ruling 1, details:
>    - The no-copy scan covers shipped code paths only. Exclude the exemption registry, its test, docs and design/ cards.
>    - Write the normalization rule into the test.
>    - The failure message says how to update an entry, and that a new entry needs a provenance note.
>    - The opacity-animate phrase sits in tokensaver src/ui/band.ts:174 (measured: a one-shot 0.35 s fade with fill="freeze"), not in Clawd. Keep it exempt, with its provenance recorded as unknown. It goes on the owner's list.
>
> 5. Replace my overlap sentence for TRDD-0M2WY8KD with this text: "No identical line of 25 or more characters after stripping leading spaces (sed 's/^ *//', sort -u, comm -12) in two file pairs: tokensaver 0.5.1 src/ui/clawd.ts versus token-optimizer 5.13.63 desktop/token-optimizer-desktop/src/clawd.ts, and tokensaver src/ui/band.ts versus desktop/token-optimizer-desktop/src/icons.ts. Tabs, CRLF and trailing whitespace were not normalized; lines under 25 characters and the other file pairs were not compared. This rules out verbatim copying of long lines in these two pairs only."
>
> 6. Wording fix: in the second correction, read "decide nothing else on defaults" as "make no other default decisions; every other function takes its upstream default". The idiom_hits.py note needs no action, whoever wrote it.
>
> 7. Each of my last two messages moved one of your running tool calls to the background. In your report, say which ruling text you had acted on before each message arrived.

### Correction 4 (verbatim, 2026-11-04; replaces only the cost-incurring definition)

> Orchestrator refinement of the cost-incurring exception in ruling 4. It is short and replaces only that definition.
>
> Cost-incurring now means a function that runs automatically (from a hook, a timer or every turn, with no explicit call) and sends a model request, changes the model, or triggers compaction. Only those default OFF.
>
> A slash command or tool that runs only when the person or the agent explicitly calls it takes its upstream default, even if it sends a model request. The host's permission system gates it.
>
> Any per-item opt-in that authorizes something on the person's behalf, such as installing or updating code, stays OFF by default. Record each such opt-in in your defaults list.
>
> Everything else in the three corrections stands.

### Correction 5 (verbatim, 2026-11-04; details of the double-running guard)

> Orchestrator: details for the double-running guard (point 1 of the third correction), from a review.
>
> Test matrix, all four rows required:
> - standalone absent: integrated mod active;
> - standalone installed but disabled: active;
> - standalone enabled at any settings scope (user, project or local): paused, with a notice in the pane, logged once;
> - detection error: stay active and record the error in Deck's visible error count or the debug log. Never pause silently.
>
> In your report, say whether the check reads the session's loaded-plugin list or matches fixed plugin ids, name every id it covers, and say what happens for a standalone installed from another marketplace or under a fork's id.
>
> Also state, in the report, the normalization rule your no-copy test uses.

### Correction 6 (verbatim, 2026-11-04; two refinements of the double-running guard)

> From the orchestrator: two refinements to the double-running guard, from a review.
>
> 1. The guard tests the effective, resolved enablement of the standalone plugin. Prefer the session's loaded-plugin list over raw settings files. Add one test row: standalone enabled at user scope but overridden false at project or local scope means the integrated mod stays active.
>
> 2. Each integrated mod shows its own detection errors in its own section of the settings pane. That applies to Deck and to Tokensaver, and the error must never sit only in the debug log, which is off by default. The direction stays the same: on a detection error, the mod stays active and the error is visible.

### Correction 7 (verbatim, 2026-11-04; the per-item opt-in rule, replacing that part of correction 4)

> From the orchestrator, so that both agents share one definition: the per-item opt-in rule now reads exactly as follows. A switch that grants permission for a specific item to act without the person's explicit action, where the host does not already gate that action (for example installing or updating code), defaults OFF. A button the person clicks is their own act and is not covered. Your other functions still take their upstream default, apart from the automatic cost functions, which default OFF.

Local paths in the quoted messages are replaced by bracketed placeholders, because this card is PROJECT scope; the
messages as received are kept in the gitignored reports_dev/mods-expert/dt/rulings-*.md (note 2026-11-04).

Note 2026-11-04: every earlier text is kept as issued. In force after the seven messages: the master switch is on by
default; each function takes its upstream default, except a cost-incurring one (it runs automatically, from a hook, a timer
or every turn, and sends a model request, changes the model or triggers compaction) and a switch that lets a specific item
act without the person's explicit action where the host does not gate it (correction 7), both off by default and said so; a command or tool the person or the
agent calls explicitly keeps its upstream default; the integrated mod pauses, with a notice in the pane, while its
standalone plugin is effectively enabled (five-row test matrix of corrections 5 and 6); one no-copy exemption entry per destination code file
(path, normalized phrase, exact occurrence count); Deck's swallowed errors get a visible count in Deck's section of the
settings pane, mandatory on this card (correction 3, point 3).

## Swallowed errors (ruling 5)

The 11 places in upstream hooks/register.js that swallow an error: empty catch blocks at :308, :1035, :1086, :1098, :1104,
:1544, :1561, :1589, and `.catch(() => {})` at :985 (audio play), :994 (prefs save) and :1563 (weather refresh). Each keeps
its behaviour (no throw) and gets a TODO naming TRDD-RWD5PW76 until the G14 debug log lands; then each routes there, and a
test shows that each one logs.

Correction 1 extends ruling 5: the debug log is off by default (release clone hooks/debug-log/logic.ts:15, `defaultOn:
false`, read 2026-11-04 in that clone's working tree; git cat-file finds the file on disk but not in 0ec4570), so the person also
needs an always-visible signal. Correction 3 makes it mandatory on this card: the count shows in Deck's section of the
plugin's settings pane, with a test, and the gap may not be accepted here. Blocker, stated in the DT report of
2026-11-04 for the orchestrator: that pane draws only switch rows (hooks/switches/logic.ts:27-42, SwitchDef holds no notice; register.ts:207
draws the rows), so the count, and the pause notice of the guard below, need a per-mod notice line in hooks/switches/,
the file set of TRDD-5IK59SQ2, which M4c is still changing; no second writer edits it. The notice line is the derived
card TRDD-AXE8CUWR (minted 2026-11-04).

## Double-running guard (corrections 3, 5 and 6)

Requirement: while the standalone plugin is effectively enabled, the integrated Deck stays inactive and its own section
of the settings pane says why in plain words. Five rows are tested: standalone absent, active; installed but disabled,
active; enabled at the user, project or local scope, paused with a notice in the pane and one line in its debug log; enabled at user
scope but overridden false at project or local scope, active (correction 6); detection error, active, with the error shown
in Deck's own section of the settings pane, never only in the debug log (correction 6).
- First candidate, the loaded-plugin list correction 6 prefers, read from the generated types 2026-11-04 and not
  yet measured live: an `engine.create` hook receives `plugins`, the modules built at a load, the whole set at a load and a
  part of it at a reload or refresh (.claude-plugin/types/claude-code/index.d.ts:4092-4110). Whether it names `deck` or
  `deck@<marketplace>` is unmeasured.
- Fallback: `$.settings.read({ key: 'enabledPlugins' })`, the engine's merge over every source, where a later source wins a
  key (:3700-3747; the Settings type at :12724-12731 names enabledPlugins), so a project or local false overrides a user
  true. It matches fixed ids by their name part: any key `deck@<marketplace>` set to true, so a standalone from another
  marketplace is covered; a fork under another plugin name is not, and a copy loaded with --plugin-dir is not in
  enabledPlugins.
- The live measurement (both candidates, with the standalone enabled, then disabled, then overridden at project scope)
  runs before the port; if neither is reliable, the port stops and the orchestrator is told (correction 3, point 1).
- Blocker: the pause notice and the detection errors need the per-mod notice line of TRDD-AXE8CUWR in hooks/switches/,
  the file set of TRDD-5IK59SQ2.
RE-MARKED 2026-11-04 by ruling 7 (section Ruling 7): rows 3 and 4 (enabled at a scope; enabled at user scope but overridden false) are not tested by scope. The engine's own merge decides what loads and the guard reads only the loaded list (candidate 1): a scope enable shows as the name in a whole list (paused), an override to false as its absence (active) [INFERRED, confirmed at card C step 3]. Row 5 (detection error) pauses instead of staying active. Candidate 2 (the fallback above) is not used; its rows stay UNVERIFIED live and are not built. Measured facts: DT report section 9.3.

## Decision: port Deck 0.4.12 into this plugin (PRRD G1.1, G2.1), not a plugin dependency

Measured 2026-11-04, Claude Code 2.1.318, `claude plugin` with HOME and CLAUDE_CONFIG_DIR in a scratch folder, throwaway local
marketplaces; the real installed_plugins.json and settings.json hashes were unchanged before and after.
- Dependencies do auto-install, from the same marketplace and from an allowlisted, already added one: "Successfully installed
  plugin: host@host-mkt (scope: user) (+ 2 dependencies: same-dep, cross-dep)".
- A dependency cannot be switched off while this plugin is on: "same-dep is still required by host. Disable that plugin first"
  (exit 1). Deck has no master off of its own: DEFAULT_PREFS (upstream hooks/register.js:15-26) holds no enabled field, and
  session.start starts the 150 ms clock with no preference gating it (register.js:1540-1565). Deck declares no userConfig field
  at all (its plugin.json), so `$.config.set`, which reaches another plugin's userConfig fields (types
  claude-code/index.d.ts:3236-3266), has nothing to change in Deck, and disabling the plugin, its only full off, is what the
  dependency rule refuses. That breaks PRRD G3.1 (no off) and the master switch of G13.1. Deck's sections, sound, weather and
  the other preferences can be switched by the person in Deck's own pane and /deck command, and this plugin might drive /deck
  through `$.command.run`, which returns the command's output text (types index.d.ts:1817-1908); that route is UNMEASURED and
  would not give this plugin one shared state with one validation.
- Deck keeps its preferences in its own store ("This plugin's own key-value store", types index.d.ts:3490-3497), which
  another plugin can neither read nor write, so typed tools sharing one state (PRRD G9.2) cannot reach Deck's settings; a
  debug log with redaction (PRRD G14.1) has to live in the module that meets the errors.
- Deck lives in the marketplace deck, not emasoft-plugins. For a user who never added it, the CLI warns: "Warning: dependency
  \"cross-dep@dep-mkt\" was not installed (no marketplace you have added lists it). \"host\" will not load without it" (the
  warning text; no session load was measured).
- Listing deck in the emasoft-plugins marketplace as a github source would make it a same-marketplace dependency, which
  auto-installs (case A measured that with a local-directory marketplace, not a github source). That removes only the install
  problem; G13.1, G3.1, G9.2 and G14.1 stay as above. Whether such a listing puts deck@emasoft-plugins beside a user's
  deck@deck (two decks drawing, two commands named deck) is UNMEASURED and not needed for the decision.
- The owner's literal words, "it has automatically the 2 other mods installed as well", describe exactly that dependency
  auto-install. The port meets the intent (one install brings both mods) by another route, because the orchestrator addendum
  makes the golden rules G13.1 and G14.1 the deciding test and the dependency route fails them; the owner may overrule this.

## Licence facts (read from the texts)

- deck 0.4.12, https://github.com/nvr0x5/claude-deck at 1ecf6deb9199d3b1fa570bf08a57e69772bbb5af, LICENSE MIT, "Copyright (c)
  2026 nvr0x5".
- THIRD_PARTY_NOTICES.md: parts of hooks/styles-desktop.js and hooks/register.js adapted from plan-progress
  (https://github.com/zycck/claude-mods), MIT, "Copyright (c) 2026 Kirill Serditov". NOTICE carries both.
- sounds/ (alert, chime, error, fanfare, tick .wav; 82,242 bytes in all; PCM 16-bit mono 22,050 Hz; no metadata chunk): added
  in commit 21eda9d506 (author nvr0x5, 2026-10-03, no parent, so the repository's first commit), the only commit that touches
  sounds/ (GitHub API); no other source or licence named anywhere; the repository MIT LICENSE is the only grant on record.
  assets/ are README images and their generators, not runtime: not ported.
- No package.json: no runtime dependency of any kind; every import in hooks/ is a relative ./ module (grepped for both quote
  styles, require(, dynamic import( and bare side-effect imports). jev-model-router is only read (its status and log line
  formats). Neither upstream ships an MCP server (no .mcp.json, no mcpServers in either plugin.json; PRRD G10.1 met).

## Scope

- Port hooks/register.js, styles-desktop.js, styles-terminal.js, theme.js to hooks/deck/ (pet.js is left out, section Mascot
  removed) and sounds/*.wav to sounds/deck/; a header in each ported file names the upstream file, commit, licence and what
  changed.
- Re-key every store key under a deck. prefix (upstream prefs, hist, spend, costSeen) and pane ids under deck-; never
  register the command name deck (the standalone owns it); proposed name mods-deck.
- Register Deck functions into the G13 registry of TRDD-5IK59SQ2; the registry is the single source of truth, read by the
  /mods-switches pane, the typed agent tool (which lets the mods expert agent switch functions, PRRD G12.1) and a Deck switch
  skill (on, off, status) that is listed in the skills menu and in tests/test_skills_menu.py (PRRD G9.2).
- Off costs nothing: no 150 ms clock, no command, no pane; every hook calls next(e) first and does nothing else.
- Coexistence: when the standalone deck is enabled, the integrated Deck stays inert and turning it on is refused with a
  message naming `claude plugin disable deck@deck`. Detection reads $.command.list() lazily at the first acting event,
  because the mods-and-events chapter orders installed mods only through `dependencies` ("a mod runs before the mods it lists
  under dependencies") and states no order between two that do not list each other. CommandInfo.plugin (types index.d.ts:1768-1786) is "Which
  plugin added it, when `source` is `plugin` and the engine knows: the one that registered it, or whose manifest carries it";
  whether the engine knows it for a runtime-registered command is UNVERIFIED: measure first; if not, read enabledPlugins and
  installed_plugins.json (hooks/mod-manager/installed.ts parses the latter). Both copies never draw.
- Live checks never touch the user's own settings, where deck@deck and tokensaver@claude-tokensaver are enabled: the plan is a
  session from a scratch project with `claude --plugin-dir <worktree> --setting-sources project,local`, so user-scope
  plugins are not loaded, and the coexistence case adds the standalone the same way with a second --plugin-dir. That the flag
  keeps user-scope plugins out is measured before it is relied on. The Desktop check needs a human.
- Debug log (PRRD G14.1) through the module of TRDD-RWD5PW76. Deck upstream swallows errors in 11 places in hooks/register.js
  (8 empty catch blocks and 3 `.catch(() => {})`, counted by grep; the one other catch, register.js:1723, turns a weather
  lookup error into its reply); each of the 11 becomes a redacted debug line.

## Mascot removed (owner directive 2)

What it is, read in upstream 0.4.12: "the pet", Claude's mascot drawn in Claude orange (#D97757 at hooks/pet.js:56, alt text
"Claude pet" at hooks/register.js:1240 and :1429). The owner's word is "clawd": Tokensaver names its own mascot Clawd
(TRDD-71KVH9PA), and Deck's pet is the same figure. The orchestrator scoped the removal to Deck; this card removes Deck's pet
on that scope, and the Tokensaver card applies the same reading to Clawd, pending the orchestrator's confirmation. The owner's
reason ("waste space and cpu time") covers the drawing as well as the animation, so the whole mascot goes, static and moving. Confirmed by the orchestrator (ruling 3).
- The anchor: the integrated Deck behaves as upstream does after `/deck pet off`, which upstream already tests
  (tests/deck.test.ts:283-293: no Svg with the walk keyframe `@keyframes mv` on Desktop, no Image in the terminal; also used
  at :513).
- hooks/pet.js (298 lines) is not ported: everything in it is the mascot. Its header says so (pet.js:1-2, "The pet: one
  design, drawn as animated SVG on the desktop and as RGBA frames ... in terminals"), and its exports are the pet's behaviour
  (PET_ACTS :4, createPet :10, petX :14, stepPet :24), its Desktop SVG (PET_CSS :55 with 14 keyframe animations, counted by
  grep, plus the per-scene walk keyframe of petLaneSvg; petSvgBody :75, petLaneSvg :121) and its terminal rasterizer
  (PET_RASTER :194, petFrame :196, a 96 x 76 RGBA frame drawn per redraw). No other Deck function lives there.
- In hooks/register.js the port leaves out or adjusts every line a grep for the word pet names, plus the pet-only constants:
  the comments (:4, :22, :1119, :1419), the import (:11), "pet" in SECTIONS and DEFAULT_PREFS.show (:13, :16), PET_COLS and
  PET_ROWS (:42-43), the pet state (:231-232), petMood (:797; its only caller is :1570), the pet in the status text (:1164),
  the pet lane above the rows (:1233-1253, Svg on Desktop, an Image re-rasterized per redraw in the terminal), the compact
  header lane (:1426-1429), the pet rows subtracted from maxRows (:1470), the pet step in the 150 ms clock (:1570), the pet
  term that keeps the terminal redrawing every other tick even with nothing animating (:1573), petMoved in the redraw test
  (:1575), and the words about it in the command description and replies (:1585, :1695). The band's empty check (:1227) then
  hides the band when there are no rows and no extras, as upstream does with the pet off. react() (it handles "the pet's
  cues", :1119) was not read: pet-only state set there, if any, is found and left out in phase 2.
- Kept: the 150 ms clock itself (it also drives the rows, the sounds and auto-expand) and all five sounds: no play call is
  tied to the pet (register.js:1133-1138 follow row states; :1707 plays a chime when prefs.sound). No runtime asset is used
  only by the pet; assets/ is not ported anyway (? INFERRED README images, not checked against the README).
- A `mods-deck pet ...` argument gets the unknown-section reply. Stored upstream prefs do not carry over: the integrated store
  is this plugin's own and re-keyed.
- Upstream tests that assert the pet (tests/deck.test.ts:95, :283, :295-305, :371, :513) are ported without those assertions.
- styles-desktop.js, styles-terminal.js and theme.js name no pet, sprite, clawd or mascot (grep), so they port whole.

## Functions to register (PRRD G13.1) and their defaults (ruling 4 as re-ruled by correction 2)

Master (default on). Band above the prompt; footer button; panel; style picker; sections plans, agents, context, limits,
route, clock, folder (on; the pet section is gone with the mascot); weather (off; the only network use, api.open-meteo.com after a city is set); sounds (on);
auto-expand when something needs you (on); hide the router own status and log lines (on; it changes another plugin output);
spend tracking (off); debug log (off). Values that are not switches (bar style, size, collapsed look, city) stay Deck
settings; whether the typed tool sets them too is open for the panel card. Upstream defaults, recorded 2026-11-04 from
hooks/register.js:15-26 (DEFAULT_PREFS; Deck's plugin.json declares no userConfig): sections plans, agents, context, limits,
route, pet, clock and folder on, weather off (:16); style terminal solid, desktop pixel (:17); panel open off (:18); auto
on (:19); sound on (:20); quiet on (:21); size compact (:22); collapsed chips (:23); spend tracking off (:24); city none
(:25). Cost-incurring functions: none. Deck sends no model request, changes no model and triggers no compaction; its only
network use is open-meteo (the weather fetch at :1082 and the city lookup at :1713), which is not a model request. So
every function takes its upstream default (the pet section goes with the mascot), and the debug log (PRRD G14.1) is off
by default as the registry defines it. Every function stays switchable by the person and the agent (G9.2, G13.1).

Wider record (correction 3, point 2; no default changes): context injection none (read 2026-11-04: prompt.submit :1733-1744
only reads the prompt; classic.Stop :1790-1801 and tool.call :1911-1962 return what next returned); continuous timer: the 150 ms clock started at session.start (:1540-1565) with no gate, which redraws every
other tick while a row animates and once a second for the clock, a meter or a strip (:1571-1575), on by default (the
port gates it on the master); sound: play() (:983-985), used at :1133-1138 and :1707, on by default (:20); network:
open-meteo at :1082 and :1713, off until a city is set (:16, :25). Per-item opt-ins (corrections 4 and 7): none;
DEFAULT_PREFS holds no switch that lets an item act without the person's explicit action, and no code installs anything. Deck changes another
plugin's output: the router's own status and log lines are hidden (ui.status :1764, ui.log :1772), on by default (:21).

Owner list (correction 3, point 2): this record of defaults goes to the owner through the orchestrator's M5 veto list
before publishing, with the 150 ms clock, which runs for every person once the master is on by default and wakes the
process even with the mascot gone (the owner's directive 2 names cpu time as a cost).

## Open finding (needs a ruling before phase 2)

The no-copy test (tests/test_no_copy_unlicensed.py) reports deck hooks/styles-desktop.js:55-56 against token-optimizer
(FORBIDDEN, PolyForm Noncommercial) SVG files: "stroke linecap round stroke linejoin round text x", an SVG attribute idiom.
The test has no markup exemption, and rewording third-party code to pass is forbidden. Reported, not changed.
Ruled (ruling 1 as re-keyed by correction 2): one exemption entry per destination file with the normalized phrase and its
exact number of occurrences in that file, all three asserted by the test; the phrase set is closed. Measured 2026-11-04 with
the test's own readers (reports_dev/mods-expert/dt/idiom-hits.log): the shared run is the 8 words "stroke linecap round
stroke linejoin round text x", against 8 source files at each of the five token-optimizer pins (5.13.58 to 5.13.63). Provenance (checked 2026-11-04):
the first 6 words are also in @reown/appkit-ui 1.8.9, dist/esm/src/assets/visual/pencil.js, where no text element follows,
so the 8-word run is not; on the owner's list.

## Open design points

- Language: deck is plain .js; the release tsconfig has no allowJs, so a .js import from index.ts needs allowJs in the root
  tsconfig.json or a declaration file, or the port moves to TypeScript. Decide in phase 2 with the reviewer.
- Per-file excerpt lock, a question for the orchestrator (addendum 6: "Every ported file needs its no-copy and excerpt-lock
  entry"): excerpt_lock.THIRD_PARTY_FILES (scripts/excerpt_lock.py) holds byte-verbatim copies only, and the ported files
  change. Options: a new registry of adapted files (path, upstream file, commit, licence) checked by a test, or NOTICE entries
  plus the header in each file. Ruled (ruling 2): the registry of adapted files, checked by a test.

## Plan (phase 2, each step PLAN, IMPLEMENT, VERIFY)

1. Merge release main (registry landed) into feat/deck-tokensaver.
2. Port the files unchanged in behaviour except the mascot, which is left out (section Mascot removed); then re-key store,
   panes and command; tsc, the kit tests, CPV strict.
3. Registry entries, zero-cost off, switch skill, pane buttons.
4. Coexistence guard and its test with the standalone enabled.
5. Debug log wiring; NOTICE; README section.
6. Tests: the ported tests/deck.test.ts plus the tests named in the checklist; mutation-check each guard.
7. check-mod.sh PASS, pytest, tsc, cspell, markdownlint, ruff, jscpd with design/ ignored under 5; live check per Scope.

## Acceptance checklist

- [ ] On the terminal (agent-checked, procedure in Scope), with the master on: the band draws above the prompt and the
  mods-deck status reports on. On Desktop (human-checked): the person disables the standalone deck for the check and
  re-enables it after, then sees the band and the panel.
- [ ] Master off (switched off by the person or the agent): a kit test registers the module with the master off and finds
  no command, no pane, no clock, and every hook passing its event through unchanged.
- [ ] On by default (correction 2): with the standalone deck absent, a kit test registers the module with no stored
  switch and finds the master on, the
  band drawn, and every function switch at the upstream default recorded in section Functions.
- [ ] Swallowed errors visible (ruling 5, corrections 1 and 3; needs TRDD-AXE8CUWR): a kit test makes the error at each
  ported catch site happen (11 upstream; the count follows the sites the port keeps) and finds the count in Deck's
  section of the settings pane risen by one each time, with no throw reaching the person.
- [ ] Double-running guard (rulings 7 and 7b and the orchestrator amendments, 2026-11-04; they replace the five rows of corrections 3, 5
  and 6): kit tests in hooks/tests/deck.test.ts feed engine.create lists and assert: a session's first whole list without deck runs, with deck or
  deck@<marketplace> (the part before any @, exact) pauses and the notice names the entry; a substring such as deck-extra runs; any
  later list, whole or partial, naming deck pauses; a paused verdict stays paused after a later whole list without deck
  (monotonic); the one-entry partial test applies only to a session's first list (partial first list: paused as unknown); a one-entry
  list whose entry is not our own name writes a debug note; a detection or verdict-store failure pauses with the detection error
  under Deck's heading of the switches pane (TRDD-AXE8CUWR); verdicts keyed by session id, LRU-capped at 20 (a read refreshes an
  entry's time, the least recently touched is evicted, and only keys with the exact deck.guard. prefix are touched); one toast per
  session at the first pause, its text the notice; the notice says to start a new session: claude without -c or --resume (not a resume); after a hot
  reload the load path re-reads the stored verdict, sets the notice and calls noticeChanged($); a paused mod writes one debug-log
  line (rate: card C 4a); the "run even when detection is unknown" switch, if built (amendment 7b), is off by default, signed,
  and never overrides a positive detection.
- [ ] Live check of the guard (agent-checked on the terminal, scratch configuration): with the standalone enabled the
  integrated Deck reports paused; with the standalone overridden false at project scope it reports active.
- [ ] With the master on and every other switch at its default, a kit test finds no `$.http.fetch` (weather is off: the
  only network use).
- [ ] No mascot: hooks/deck/ has no pet module; with the master on, the band expanded and one plan row running, a kit test
  finds the upstream pet-off result on both surfaces (no Svg with `@keyframes mv`, no Image); mounted with a small
  `maxRows` (for example 4) and more rows than that, the terminal band shows at most `maxRows - 1` rows (upstream :1470 takes
  PET_ROWS more off that budget while the lane shows); with no row animating, the clock section off and no meter or strip row,
  a kit-timer test sees no redraw across ten 150 ms ticks (register.js:1573-1575: `ticking` is the once-per-second redraw
  while the clock section is on or a meter or strip row shows; `terminalAnim` redraws every other tick while a row animates).
- [ ] Every function above is a registry entry; a kit test switches each one and checks its effect; one test writes a
  switch through the typed tool and reads it back through the pane model; a pytest checks that the switch skill names that
  typed tool for on, off and status. The round trip uses a switch that is not person-only (not deck.weather); once M4c's person-only flag is merged, a test asserts that the typed tool's on for deck.weather is refused.
- [ ] With the standalone deck present, a kit test shows the integrated Deck inert and the on request refused with the
  message naming `claude plugin disable deck@deck`.
- [ ] Live coexistence (agent-checked): a session loading both this plugin and the standalone by --plugin-dir shows the
  integrated Deck inert and the refusal message, and only one band draws.
- [ ] Debug log switch per PRRD G14.1, off by default; a test logs a secret-shaped value and finds it redacted.
- [ ] A pytest checks NOTICE for the deck MIT, plan-progress MIT and sounds entries, the sounds byte size, and that no
  node_modules or assets/ ships.
- [ ] The switch skill is in the skills menu: a test fails when it is not declared in the agent's skills menu
  (tests/test_skills_menu.py: its DOC_SKILLS list leaves out some skill categories, :251-254, so the test is extended
  when the new skill falls in one of them).
- [ ] Every new guard is mutation-checked (break the line, the named test goes red); check-mod.sh PASS; pytest, tsc, cspell,
  markdownlint, ruff and jscpd (design/ ignored, under 5) clean.
- [ ] Notice use, Deck's error count (ruling 5 as relaxed 2026-11-04; wired after merging release main at the TRDD-AXE8CUWR commit): the number of Deck's swallowed errors since the load is shown under Deck's heading of the switches pane (TRDD-AXE8CUWR); at zero no notice line is drawn (DT design choice: the pane stays quiet while nothing has failed, and the count appears with the first error). Kit test in hooks/tests/deck.test.ts, "deck error count shows under the Deck heading of the switches pane model and is absent at zero", finds the text under that heading in the pane model.
- [ ] Notice use, the pause notice (ruling 5 as relaxed 2026-11-04; wired after merging release main at the TRDD-AXE8CUWR commit): with the standalone Deck present, the pause notice of the double-running guard is shown under Deck's heading of the switches pane (TRDD-AXE8CUWR). Kit test in hooks/tests/deck.test.ts, "deck pause notice shows under the Deck heading of the switches pane model", finds the text under that heading in the pane model. Live confirmation under the installed, settings-enabled load: card C (TRDD-HAK91K6S) step 3.
- [ ] Notice use, the detection error (same): when detection fails, the error is shown under Deck's heading of the switches pane (TRDD-AXE8CUWR), never only in the debug log. Kit test in hooks/tests/deck.test.ts, "deck detection error shows under the Deck heading of the switches pane model", finds the text under that heading in the pane model.
- [ ] D1b-2 (R2 as amended: wake on work, HH:MM, no fold timer) lands before any merge of D1b; D1b-1 is an intermediate commit on feat/deck-tokensaver, never merged or published (the answer to the five corrections, item 1).
- [ ] D1b is neither merged to release main nor published before D1b-2, D1c (double-running guard) and D1d (visible error count) are complete (R12).
- [ ] /mods-deck city is accepted only from a person origin (byOf: composer, bridge, sdk) and there works as upstream (turns deck.weather on, geocodes, fetches); from 'plugin', a missing or an unknown origin it is refused, nothing is sent or stored, and the reply says the person sets the city. The person path turns deck.weather on through the registry's signed write with the person origin, never through deck.prefs. Kit tests: composer, sdk and bridge accepted, each with its own mutation (that kind dropped from the person set); plugin, no origin and a known non-person kind (peer) refused, each asserting no fetch, no deck.prefs write, deck.weather unchanged and the reply text, with the mutation ignore the origin (R8 final).
- [ ] deck.weather is person-only for on (M4c's flag on release main); until that flag is merged into this branch, a named TODO in hooks/deck/switches.ts (final review round, item 1). D1b is not published while that TODO stands.
- [ ] A command.run with no origin at all is treated as not the person's, and nothing throws: /mods-deck city with no origin is refused like a 'plugin' origin (no fetch, no store write, the refusal reply) (amendment to R1).
- [ ] No Deck-local copy of switch state: every draw reads the switches through the registry (the no-copy ruling). Kit test: a switch changed in the store between two Deck hooks is seen by the second; mutation: skip the refresh in one hook.
- [ ] The README discloses: what the weather sends and to whom (the typed city name, then latitude and longitude, to Open-Meteo); that /mods-deck city is refused from any origin but the person's; that Deck runs in claude -p and SDK sessions, as upstream; that /mods-deck stays registered while Deck is off; that an on made in another session takes effect at this session's next start (R7).

## Related

TRDD-5IK59SQ2 (switch registry, prerequisite), TRDD-RWD5PW76 (debug log), TRDD-AXE8CUWR (per-mod notice line, a blocker), TRDD-UYD6T358 (activation defaults), the Tokensaver
card (TRDD-71KVH9PA) and the global settings panel card (TRDD-J7X3ZN7B) minted with this one.

## Approval log

- 2026-11-04T18:08:09+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Ruling 7, detection (orchestrator, verbatim, 2026-11-04; list items joined to one line each)

Ruling 7 (detection), orchestrator, 2026-11-04, after an adversarial review. It replaces your proposal points 1 to 3. Port the guard under it.
1. Source: candidate 1, the plugins input of engine.create. Candidate 2 is not used. Strike or re-mark guard rows 3 and 4 on both cards.
2. Whole or partial list: if the engine.create input type (index.d.ts:4092-4110) declares a load-kind field, use it. If not, a list is partial when it has exactly one entry; log a debug note when that entry is not our own name. Any other list is whole. Do not test for the built-in names: they are specific to a Claude Code version.
3. Verdict store: keep the verdict in $.store, keyed by session id, because module state and globalThis are new after a hot reload (measured). Cap it at the last 20 sessions. Never use one shared record: concurrent sessions would overwrite it. A whole list always replaces this session's verdict. [superseded by ruling 7b A1: the verdict is monotonic within a session id] That also makes resumed sessions safe. A partial list keeps the stored verdict.
4. Unknown is paused: no stored verdict plus a partial list is "unknown", and the mod pauses. Its notice says: "start a new session to detect the standalone <Deck|Tokensaver>". A failure of detection or of the verdict store also pauses, and shows the detection error under the mod's heading. Every failure sits on the side that never double-runs.
5. Match: compare the name part before any "@", exactly, so that both "deck" and "deck@<any marketplace>" match. Never a substring. The pause notice names the entry it found.
6. The notice says that enabling or disabling the standalone takes effect at the next session load. It promises nothing about /reload-plugins, which is inferred, not measured.
7. Disclose, in the README and in the switches text: if the standalone is enabled mid-session after a "run" verdict, both copies run until the next session, because another plugin's load does not call our hook [orchestrator correction 2026-11-04: measured for another plugin's hot reload only; a disable, enable or install mid-session and a /reload-plugins after a change are inferred, not measured].
8. Lone-plugin case: check, in the types or the docs, whether the built-in plugins can be disabled. If they can, a session where ours is the only plugin reads partial at every load and stays paused. Disclose that in the notice text.
(Points 9 to 11 of the ruling concern card C, the probe-residue card and the DT report; they are recorded there.)
DT NOTE beside point 7 (2026-11-04, the tenth mods expert's words): measured (DT report 9.3, run 4): when another plugin's file changes and it hot-reloads, this plugin's engine.create hook is not called and this plugin is not rebuilt. Not measured: a disable, an enable or an install mid-session, and a /reload-plugins after a change.

## Ruling 7b, detection amended (orchestrator, verbatim, 2026-11-04; list items joined to one line each)

Ruling 7b (orchestrator, 2026-11-04). It amends ruling 7.
A. I take option (a): the verdict is monotonic within one session id.
1. Within a session id, a verdict may go from run to pause, never from pause back to run. "Unknown" is a pause too, and it lifts only in a new session id.
2. Any list that names the standalone, whether whole or partial, pauses: a partial list naming it means it was just added or changed.
3. The whole/partial test (exactly one entry, our own, means partial) now matters only for a session's FIRST list. First list partial: unknown, so pause. First list whole: run, or pause if the standalone is named.
4. A resumed session that is paused stays paused, and its notice says to start a new session. Whether the session id survives a resume is UNVERIFIED; the monotonic rule is safe either way.
5. Disclose this residual in the README and in the switches text: if our plugin is installed or updated mid-session at the same refresh as another plugin, its first list can be a two-entry partial list read as whole. Both copies then run until the next session. M6 avoids it, because step 2 is a new session (4g).
6. The verdict cap of 20 sessions stays.
(Part B of the ruling concerns the cards and the DT report; it is applied there.)

## Orchestrator amendments after the review of ruling 7b (2026-11-04, verbatim; list items joined to one line each)

7. Guard additions: a. LRU verdict cap: refresh an entry's time on every read, and evict the least recently touched. b. Lone-plugin case: only if the built-in plugins can be disabled, or your check is inconclusive, add per mod an off-by-default signed switch "run even when detection is unknown". It never overrides a positive detection. Report your finding either way. c. A one-time toast per session when a mod first pauses, whose text is its notice. This makes the pause visible without opening /mods-switches. d. The pause notice says "start a new session (not a resume)".
8. Pause notices restore after a hot reload: in each mod's load path, re-read the stored verdict, set the notice text, and call noticeChanged($). Add a kit test.
Notice wording (card C point 3 of the same review): a new session is "a new session: claude without -c or --resume".
Timers: copy the fixed auto-timer pattern the orchestrator will name by SHA, not the one at 34f5c20; until then keep timer code minimal (point 6).

## Rulings 8 and 9 (orchestrator, verbatim, 2026-11-04; list items joined to one line each)

> Orchestrator rulings 8 (F1) and 9 (F2), 2026-11-04.
> F1, ruling 8: option (a), one plain hook per shared event, owned by hooks/index.ts.
> 1. Condition 1 of my index.ts acceptance ("only three lines per mod, nothing else changes") is lifted for this dispatch, and only for it. Shared-event dispatch functions in index.ts are allowed. Nothing else in index.ts changes.
> 2. The dispatcher: calls each mod's exported, top-level, named handler in a fixed, written order, each in its own try/catch; then calls next(e) exactly once. Each mod's exported handler drops its own next call. State this in your proposal, and add a kit test proving next runs once.
> 3. Order for prompt.submit: requirements-drafts first, so its behaviour is unchanged; Deck second. For Tokensaver's event-changing hooks (turn.step and others), the order is ruled when that port starts.
> 4. Each catch routes to that mod's notice, or to its masked, printable debug line. It never swallows silently. Observers do no long awaited work, since a hung observer blocks the user's prompt.
> 5. requirements-drafts/register.ts: only its prompt.submit handler becomes an exported named function. Its behaviour and its tests stay as they are. I am telling M4c that this file is shared in your branch.
> 6. Rejected: (b) the catch-all matcher, a workaround of the engine's duplicate check; (c) separate modules, unmeasured, and they would split the one signed switch registry. A genuinely narrow matcher, with a real filter on the event, remains allowed, e.g. for Tokensaver's routing hooks.
> F2, ruling 9: fix the test harness, not the default.
> 1. Correction 2 (masters on by default) stands. Reversing it is the owner's call at M5, veto item (s). Record F2 on the Deck card as evidence about on-by-default: an always-ticking clock for every user who installs. Do not change the default.
> 2. One place, not eleven tests. Every test world seeds OFF the masters of mods other than the test file's own mod; each mod's test file seeds its own master on. Seeding a signed switch value is configuration, not a mock. If a shared world constructor exists (switch-world.ts or similar), change only that helper in your branch, so mod-manager.test.ts needs no edit. If none exists, add the helper plus one import line per file, after merging M4c's latest commit. I will ask M4c to commit its pending mod-manager.test.ts work first.
> 3. CPU cost, which belongs on the Deck card, not deferred: a switch read is a signed read with a SHA-256 digest, so re-reading the master every 150 ms is about 7 hashes a second in every session. That is the same kind of cost as the mascot animation the owner had removed. Report: what the 150 ms clock drives; whether it can tick only while it has work (Deck's pane open, or a turn active); whether the master re-read can move to your 1 s cadence once the follower lines land, with followSwitch handling changes within the session. Propose the change; do not apply it before I rule.
> F3 is accepted as you describe: origin { kind: 'composer' } in the adapted tests.
> The db69c67 subject naming 067ec02 while its parent is af28048 was disclosed correctly; no amend.
> Before D1b counts as green, give the three counts again on the real branch, with (a) applied: Deck tests passing out of 42; the mod-manager tests; the 60 earlier failures. The scratch-clone numbers were taken with the catch-all matcher.
Evidence F2 for ruling 9.1 (measured 2026-11-04 in a scratch clone of the branch with Deck wired ungated and a measurement-only catch-all matcher on its prompt.submit hook, a shape ruling 8 later rejected; kit log in the gitignored reports_dev/mods-expert/dt/20261104_224235+0100-d1b-plain-port-kit.log, local to the machine that ran it): with the master on by default, Deck's every(150) clock (hooks/deck/register.js:1511 at f751a74) ticks in every session of every user who installs, and in the kit it pushed 11 mod-manager auto-update tests past clock.advance's limit of 10000 firings. The default stays on (correction 2); reversing it is the owner's call at M5, veto item (s).

## M4c items for files in this branch (orchestrator, verbatim, 2026-11-04; list items joined to one line each)

> Orchestrator: two small items from M4c, for files you now own in your branch. Release main is clean at d623b53, and mod-manager.test.ts has no pending work, so merge it before you edit.
> 1. hooks/index.ts: every "start failed" line (index.ts:26-58) is masked but not printable. Wrap each line's text in printable (from ./mod-manager/logic) before maskedLog, including your new Deck line.
> 2. hooks/tests/switch-world.ts: add a field `storeRefused: string | undefined`. When it is set, the store.get handler returns `{ deny: storeRefused }`, mirroring envRefused. M4c needs it to test switches/register.ts's start catch. Add a test that uses it.
> 3. If mod-manager.test.ts builds its own world() rather than the shared helper, ruling 9 allows you one seeding line there (other mods' masters off). Nothing else in that file. M4c leaves it untouched while your branch is open.
Merged: release main d623b53 into feat/deck-tokensaver as 4c2e021 (2026-11-04).
Item 1 superseded 2026-11-04: release main 86a817b makes maskedLog apply cleanMasked (mask, then printable); no printable wrap in index.ts.
> (Orchestrator, 2026-11-04, the message that reported the 22:06Z sed edit, item 3, verbatim excerpt.) the import line plus one seeding call in mod-manager.test.ts world() is accepted (the import carries no behaviour).
The D1b base 4c2e021 is stale (2026-11-04): D1b merges release main before any wiring, once the orchestrator says M4c's import edit in mod-manager.test.ts has landed; release main was at 181daee when last read.
Note (DT, 2026-11-04, not verbatim): the orchestrator's review of 3a451b6, item 1(c), adds that per amendment D the seeding call in mod-manager.test.ts world() names its own mod, mods-manager (MOD in hooks/mod-manager/switches.ts), explicitly.
Note (DT, 2026-11-04, not verbatim): the stale-base line above is resolved: the orchestrator confirmed M4c's import edit landed in release main 181daee, and the worktree merged it as d6b882f.
Note (DT, 2026-11-04, not verbatim): the line "Item 1 superseded 2026-11-04: ..." above is the text the orchestrator dictated in its review of 3a451b6, item 1(b).
Note (DT, 2026-11-04, not verbatim): the worktree merge d6b882f's message body names startFailedLine among what release main brings; git grep at d6b882f finds it (hooks/switches/logic.ts:209, used at hooks/switches/register.ts:252), so the body is right; its subject names no function.

## Review findings on f751a74 and amendments to rulings 8 and 9 (orchestrator, verbatim, 2026-11-04; list items joined to one line each)

> Orchestrator: review findings on f751a74, and amendments to rulings 8 and 9. They bind D1b.
> A. The D1b proposal must contain these before any wiring:
> 1. The G13.1 switch list for Deck's functions: HUD band, each pane, the weather and network fetch, the sounds, spend and cost tracking, demo mode, and any other. Give each its default and the switch-default rule that justifies it. The weather fetch sends latitude and longitude, or a city name, to api.open-meteo.com and geocoding-api.open-meteo.com. That is an outward effect to a third party, so its own switch and default follow the rule for outward effects. State exactly when the first fetch happens on a fresh install. The README states what is sent, and to whom. The sounds get their own switch.
> 2. Timers: for each of every(33) fold, every(150), every(1400) demo and after(ASK_DELAY_MS), report: what it drives; when it starts; whether and where it is cancelled; the 33 ms timer must stop when its fold ends; whether it can run only while it has work. The timer part of D1b waits for my ruling on this report. The owner removed the mascot because its animation "waste space and cpu time", and a 30 Hz fold and an always-on 6.7 Hz clock that re-reads signed switches are the same cost class.
> 3. Trust: deck.prefs is unsigned. Say how lat, lon and city from it are validated before they go into a query string.
> B. Housekeeping on f751a74:
> 4. Reproducibility: commit the codemod under scripts/ with a header saying it is a port tool, if the plugin's packaging does not ship scripts/ to users (check the packaging config and say). Otherwise record its exact transformations on TRDD-RD1ISPMN.
> 5. The sounds' licence: check upstream's README and credits for where the five WAVs come from. If they come from a sound library, register that library's licence instead of assuming MIT.
> 6. Grep styles-desktop.js, styles-terminal.js and theme.js for pet remnants: the #D97757 figure, an SVG body, mood, blink. Report the result.
> 7. Report whether eslint's config covers hooks/deck/*.js. Append to card B (TRDD-RZBQIM54) one line: its audit tree includes hooks/deck/** and hooks/tokensaver/** (untyped JS that tsc does not read).
> 8. jscpd is at 4.29% against a threshold of 5. Report your plan before the Tokensaver port: dedupe, or a documented exclusion.
> C. Ruling 8, amended. The dispatcher is for observers only. A guard (deny) or a router (an event-changing hook) never goes into it. Each gets its own hook with a genuinely narrow matcher, or a separate dispatcher that: stops on the first deny; passes the changed event forward; turns a throw into a deny (fail closed). Kit tests for the observer dispatcher: one observer throws, and the other still runs, with next called once; one observer is slow (state the hook timeout budget, if the types document it). Any `.catch(...)` chained to requirements-drafts' current prompt.submit registration moves into its per-mod catch, unchanged in effect.
> D. Ruling 9, amended: The test-world helper takes the test file's own mod as an explicit argument. Add one integration test file with every master on. It covers: prompt.submit dispatch with both observers; a short clock advance, well under 10000 firings, with every timer running; the switches listing with every mod and its notices.
> E. Card C (TRDD-HAK91K6S): extend 4h: "Deck's Desktop styles render on Desktop" is part of the live check; add to 8b: "the owner's weather location carries over with the owner's consent from the standalone Deck; a new user's default follows the switch rules".

## D1b rulings R1 to R12 (orchestrator, verbatim, 2026-11-04; list items joined to one line each)

> Orchestrator: rulings on D1b (r2 plus final delta). Record them verbatim on TRDD-RD1ISPMN in one card commit, then start.
> R1. D1b-1, the faithful port: GO now. One clock per module (edcdb75 pattern). Nothing starts while the master is off; master off stops the clock, the fold and the demo; every other mod's world seeds the master off. No adapted test is rewritten except F3's origin field. Report "x of 42".

Widened since: besides F3's origin field, the rewrites ruled later are the 60 origin additions and the line-662 rewrite (the answer to the five corrections, item 2), the no-origin test (the amendments), the 3 header and 2 fold tests in D1b-2 (R2 amended) and the R8 final origin tests. (DT, 2026-11-04, not verbatim.)\n
> R2. D1b-2, wake on work: ruled now, on F2's evidence. The clock runs only while there is work (a turn, an agent running or waiting, a fold, the demo, an animating row), is woken by your listed hooks, and stops after a tick that found no work and no transition. Seconds versus HH:MM, and R, wait for one number. Micro-benchmark the signed read (readSigned with its SHA-256 digest, as switches/register.ts does it) in node, 10 000 reads on this machine; report microseconds per read and the load average while it ran. I rule HH:MM and R on that number. F-b: the fold stays as upstream has it (bounded, about 17 ticks; master off stops it). Count, corrected: under F-b, T-a and HH:MM, 3 header tests are rewritten, plus spark and amber at risk.

Superseded in part by the R2 amendment below: (a) HH:MM is ruled now; (b) F-a replaces F-b; only R waits for the benchmark. (Dated line dictated by the orchestrator, 2026-11-04.)

At R, superseded in turn by the no-copy ruling at the end of this section: no Deck-local sharing of reads; the benchmark now bears only on a shared per-render-pass memo inside the switches registry. (DT, 2026-11-04, not verbatim.) Decided since: no memo (the benchmark ruling below).

> R3. /mods-deck registers at every start, master on or off (the requirements-drafts pattern). With the master off it answers the off text and accepts on and status.
> R4. Sound: your reading is accepted (output on the person's own machine, not an act under correction 7). It stays on and goes on the veto list.
> R5. Quiet-router: the two narrow matchers are accepted. On a throw it passes the line unchanged and counts the error. That is fail-open, chosen on purpose, since a hider's only harm is lost output. Add a dated line on RD1ISPMN: "quiet-router is an exception to amendment C (routers fail closed): on a throw it changes nothing, because the only harm a hider can do is lose output."
> R6. Interactive only: accepted, on a condition. Cite the types file:line of isInteractive on session.start, and say whether it is true on Desktop (measured, or where documented). If Desktop reports false, Deck never starts there; report that and wait.

Superseded by R6 revised below: no interactive gate; Deck starts in every session, as upstream. (DT, 2026-11-04, not verbatim.)

> R7. Lazy start dropped. An on from another session takes effect at this session's next start, or through /mods-deck on or the pane here. Accepted; the README and the switch text say so.
> R8. Weather. Before I rule the agent's city path, measure e.origin.kind for /mods-deck city when it is (a) typed by the person, (b) queued by this plugin's self-command run tool, (c) run by Claude through any engine command path you can reach. Report each. My intended rule: with deck.weather off, an agent-run city sends nothing and stores nothing, and the reply says the person turns weather on; with deck.weather on, it geocodes and fetches. If (b) or (c) reads as the person, byOf cannot carry that rule: propose a discriminator and wait. Until I rule, D1b-1 sends nothing on any city command whose origin is not measured as the person's, while weather is off. That is a deliberate deviation from upstream; list it.

Superseded by the R8 interim rule below, and by the person-only weather switch. (Dated line dictated by the orchestrator, 2026-11-04.)

The interim rule is in turn replaced by R8 final below: /mods-deck city is accepted only from a person origin. (DT, 2026-11-04, not verbatim.)

> R9. The import plus one call in the requirements-drafts, self-command and probe-runner test worlds: accepted, for the same reason as mod-manager (an import carries no behaviour). Record it verbatim.
> R10. For each of the 16 Desktop renderer animations, report whether it loops forever or plays once, and when it runs (always while Deck shows, or only on an event). They go on the veto list; no change now.
> R11. Which rule is the "B4" you cite against R? My B4 was the codemod's reproducibility.
> R12. D1c (double-running guard) and D1d (visible error count): confirm they come after D1b-2 and before the Tokensaver port, and that you own them; or propose another order. Your delta K blocks merging and publishing on them, so they are on the path to publish.

quiet-router is an exception to amendment C (routers fail closed): on a throw it changes nothing, because the only harm a hider can do is lose output. (The sentence is R5's dictated text; this parenthesis is DT's, 2026-11-04.)

> Orchestrator: amendments to my rulings, from their review. Record them verbatim with R1 to R12.
> R2 amended. (a) HH:MM is ruled now, on the owner's own reason for removing the mascot (an animation that wastes space and CPU time). With seconds shown, the clock section is work every second, so wake-on-work would never let the clock idle. The 3 header tests are rewritten under this ruling. (b) F-a, not F-b: the fold opens and closes at once, with no 33 ms timer, on the same owner reason, as you recommended in r2 line 71. The 2 fold tests are rewritten under this ruling. Both go on the owner's veto list as "extends the owner's mascot reasoning; the owner can restore them". (c) R alone waits for the benchmark. Label the node number a lower bound, since it leaves out $.store.get's round trip through the engine. If the kit lets you time a store.get round trip, report that too.

Its (c) is decided: no Deck-local sharing of reads (the no-copy ruling) and no registry memo (the benchmark ruling below). (DT, 2026-11-04, not verbatim.)

> R8 amended, interim rule (until the origin measurements come back): while deck.weather is off, /mods-deck city sends nothing and stores nothing, whatever the origin. The reply tells the person to turn weather on first (/mods-deck weather on or the pane). With weather on, the city command geocodes and fetches. This needs no trust in origin.kind. List it as a deviation from upstream. Still report the three origin measurements; I rule the final form on them.

The interim rule is replaced by R8 final below: /mods-deck city is accepted only from a person origin. (DT, 2026-11-04, not verbatim.)

> New test (R1, since all 60 command.run calls now carry origin): one command.run with no origin at all. Assert that it is treated as not the person's and that nothing throws.
> Unruled items. Everything in r2 and the delta not named in R1 to R12 or here is accepted as proposed (seedMasters' design, the NOTICE credit for jev-model-router, the condition-5 prediction, the dispatcher catch line), with two exceptions. B8's jscpd exclusion is not approved in advance: if jscpd passes 5%, bring me the numbers. Your two live measurements go onto card C (TRDD-HAK91K6S) as item 4i: the per-read cost on the real host, and how many sessions one module serves on Desktop (R1's one-clock-per-module rests on it).
> R1 is confirmed in this order on purpose: the faithful clock is wired before the timer ruling, as an unmerged intermediate step. Say so on the card.

Note (DT, 2026-11-04, not verbatim): D1b-1 wires upstream's faithful 150 ms clock and fold as an unmerged intermediate commit on feat/deck-tokensaver, before the timer change of D1b-2 (R2 as amended: wake on work, HH:MM, no fold timer); D1b-1 is never merged or published, and D1b-2 lands before any merge of D1b.

(Orchestrator, 2026-11-04, the answer to DT's five corrections, verbatim; it arrived before the amendments above.)

> Orchestrator: our messages crossed; my rulings R1 to R12 stand, with these answers to your five corrections.
> 1. Wire the clock faithfully in D1b-1, 150 ms tick included. D1b-1 is an intermediate commit on your branch, never merged or published: about 84 signed reads a second idle matters only in what ships. D1b-2 (wake on work, R2) must land before any merge of D1b, and the acceptance box on the card says so. D1b-1 exists so the 42 tests measure a faithful port first.
> 2. Accepted as rewrites under a ruling: origin { kind: 'composer' } added by the codemod to all 60 command.run calls (F3 extended; record the codemod change on the card's transformations section), and the line-662 test reads the deck.folder switch instead of deck.prefs.show.folder (keptPrefs moves it). Report the count as "x of 42, of which y rewritten under a ruling" and list them.
> 3. The unreviewed delta sections are now reviewed through my rulings, and my own review fork reads both. The interactive gate on the veto list: agreed.
> 4. The ordering test, comparing requirements-drafts' switch reads with Deck's $.session.model call in a world that traces both: accepted.
> 5. Wording fixes noted. The d6b882f merge subject naming startFailedLine: check it with git show --stat d6b882f, and record any mismatch on the card. Do not amend the commit.
> Send me the sorted failing set on d6b882f before any wiring, as you planned.

Item 3's interactive gate is superseded by R6 revised below: no gate. (DT, 2026-11-04, not verbatim.)

(Orchestrator, 2026-11-04, the final review round on the rulings, verbatim.)

> Orchestrator: four items from the final review round on the rulings.
> 1. Security, ruled for M4c on release main: switches whose on is outward, install-class or grants Claude a tool become person-only for on. The switches tool and an agent-origin command are refused, and the agent may still turn any switch off. When you register Deck's switches, mark deck.weather with that flag. No other Deck switch qualifies: deck.spend reads $.session.usage locally. With that in place, R8's interim rule (no city while weather is off) closes the agent path completely. Until M4c's flag lands on release main and you merge it, keep the mark as a named TODO in deck/switches.ts.
> 2. Card C, TRDD-HAK91K6S, item 8b: correct the order for carrying the owner's weather location over. First the owner turns deck.weather on (only the person can), then the city is set. The M6 agent cannot turn weather on.
> 3. Veto-list wording on RD1ISPMN: for the instant fold and HH:MM, write "restoring them needs a code change; there is no switch", not "the owner can restore them".
> 4. List the adapted tests that run /mods-deck city with weather off and expect a fetch. They are rewrites under R8 and go into the "y rewritten under a ruling" count.
> 5. Confirm by list which of my messages you have received since 23:00: rulings R1 to R12; my answer to your five corrections; the report-name directive; the amendments (R2 HH:MM and F-a, R8 interim, the no-origin test, unruled items, 4i); the probe-origin relay; and this message.

(Orchestrator, 2026-11-04, card items from the review of cb8f95f and 79d29e1, verbatim; item 3 is the no-copy ruling.)

> Orchestrator: three card items, from the review of cb8f95f and 79d29e1. One commit, together with the 8b and veto-wording items from my last message.
> 1. RD1ISPMN now contradicts itself. Under the verbatim R2, add a dated line: "Superseded in part by the R2 amendment below: (a) HH:MM is ruled now; (b) F-a replaces F-b; only R waits for the benchmark." Under the verbatim R8, add: "Superseded by the R8 interim rule below, and by the person-only weather switch." An implementer checks the code against the card, so the current rule must be readable at each original ruling.
> 2. Confirm my reply to your five corrections is on the card verbatim: the faithful clock in D1b-1 as an unmerged step, the 60 origin additions and the line-662 rewrite under a ruling, the ordering test, and the d6b882f check. If it is not, add it.
> 3. A ruling to record verbatim: no mod keeps a copy of switch state. Every draw reads the switches through the registry. If your benchmark shows the reads matter, I will rule one shared per-render-pass memo inside the switches registry for all mods, never a Deck-only cache. That decides your R: no Deck-local sharing of reads.
> Your d6b882f merge is checked on my side: its first-parent diff equals release main's changes (15 files). Nothing more is needed there.

Note (DT, 2026-11-04, not verbatim): the startFailedLine claim in the d6b882f merge body holds, and the merge brought it: git grep finds startFailedLine in no file under hooks/ at 4c2e021 and in 3 at d6b882f.

Note (DT, 2026-11-04, not verbatim): "r2" in the amendments is the round-2 D1b proposal, reports_dev/mods-expert/dt/20261105_001500+0100-d1b-proposal-r2.md, a gitignored file local to the developer machine.

(Orchestrator, 2026-11-04, rulings on DT's report, verbatim.)

> Orchestrator: rulings on your report. Record them verbatim on RD1ISPMN, then go on with D1b-1.
> R8 final (replaces the interim rule): /mods-deck city is accepted only from a person origin (byOf(e.origin.kind) === 'person': composer, bridge, sdk). From a person, it works as upstream: it turns deck.weather on, geocodes and fetches. From any other origin ('plugin', which the self-command run tool gives per index.d.ts:1843 and register.ts:58, or anything unknown), it is refused: nothing is sent or stored, and the reply says the person sets the city. The reason, beyond consent: an agent-set city would give Claude a channel that sends any 100-character text to a third party with no permission prompt. With deck.weather person-only for on, the weather sends start only from the person. Tests: composer, sdk and bridge are accepted; plugin and a missing origin are refused, with no fetch; each test has a mutation (ignore origin). (b) stays documented, not measured; the live check goes onto card C 4i as an optional item. Do not run a probe against the real store.
> R6 revised: no interactive gate. Deck starts in every session, as upstream does. isInteractive is false for -p and the SDK, Desktop is undocumented, and a gate could keep Deck off Desktop entirely. With the clock woken only by work (R2), a -p run costs one turn's ticks. Add to card C 4h: measure isInteractive on Desktop; if it is true there, I may rule a gate for -p and SDK later. Veto list: "Deck runs in claude -p and SDK sessions, as upstream."
> Benchmark: 10.3 µs per signed read (lower bound). About 140 reads a second while animating is about 1.4 ms of CPU a second; idle under wake-on-work and HH:MM, 24 reads a minute. No registry memo is needed. Skip the kit store.get timing, since the kit's mock store is not the host's. The live per-read cost stays in 4i.
> R10: put on the veto list as you reported it: five loops run forever while drawn, among them the spark-style tip even when idle (spark is not the default style); the SVG animations ignore reduced motion, as upstream. No change now.
> [config-hash attribution: machine-specific, kept in reports_dev]

Redacted 2026-11-04 by orchestrator approval: owner machine install state does not belong on a pushed card.

> Baseline on d6b882f accepted: 60 failures, all outside our mods' test files (TR37CWQ7 territory).

## Owner veto list for Deck (orchestrator rulings under the owner's autonomy grant; the owner may reverse each)

- Masters on by default (correction 2): the owner's call at M5, veto item (s).
- The clock shows HH:MM, without seconds (R2 amended, a): extends the owner's mascot reasoning; restoring them needs a code change; there is no switch.
- The fold opens and closes at once, with no 33 ms fold timer (R2 amended, b; F-a): extends the owner's mascot reasoning; restoring them needs a code change; there is no switch.
- Sound stays on (R4): output on the person's own machine.
- Deck runs in claude -p and SDK sessions, as upstream (R6 revised).
- /mods-deck city is refused from any origin but the person's (R8 final): a deviation from upstream.
- The Desktop renderer animations stay as upstream (R10); 16 lines of hooks/deck/styles-desktop.js hold 14 animations and 2 definitions (:29, :312). Loop forever while drawn: the twinkle (:21-27; on the segments head cell, :133, and the dots current dot, :190, both only while a row animates, and on a running agent's strip, :263-267), the line-style pulse (:148) and the solid-style shine (:165) while a row animates, the spark-style tip (:222) whenever the spark style shows a history (idle included; spark is not the default style), and a running agent's spinner dot (:309). Play once on an event: the 0.45 s glides when a value moves (:63, :100, :144, :145, :162, :211), the 0.2 s strip colour change (:282), the 0.2 s enter and exit (:310, :311) of a strip's tool name when it changes (:296-297). The CSS ones honour reduced motion; the SVG ones do not, as upstream.
- Loader not live-tested before publish (orchestrator ruling 2026-11-05 on D1b-1 step 4, option a): no probe against the real store, and none with a scratch configuration folder, which has no login (probe.py types each step and Enter, which at the login selector could start an OAuth flow). Evidence before publish: the kit tests, claude plugin validate and check-mod.sh. The live check is item 4j of TRDD-HAK91K6S.

## Port codemod transformations (scripts_dev/deck-port/port.py, local to the developer machine, not in the repository)

- register.js (D1a): the header with the adaptation lines; the pet removed (its lane, the lane remnants, toBase64 and petMood, which served only the pet); register(on) split into startDeck($, e), called from hooks/index.ts, and registerDeck(on); store keys prefixed deck.; the command renamed mods-deck, the help lines re-spaced to keep their column; the sounds path moved to sounds/deck/.
- deck.test.ts, rewrites under a ruling (the answer to the five corrections, item 2; to apply in D1b-1): origin { kind: 'composer' } added to all 60 command.run calls (F3 extended); the line-662 test reads the deck.folder switch instead of deck.prefs.show.folder (keptPrefs moves it).
- deck.test.ts in D1b-2, by hand, not by the codemod (R2 amended): the 3 header tests ('a folder change event moves the header to the new folder', 'a move with no event shows after the next tool call', 'a shell cd alone leaves the header on the project folder') expect HH:MM; the 2 fold tests ('expanding unfolds the rows one after another, and the toggle folds them away', 'desktop rows fade in while they unfold') expect an instant fold.
- R8 (interim and final) rewrites no test: the adapted file has no test that runs /mods-deck city (no city, weather or geocoding test; its only network line is the world's http.fetch deny).

## D1b-1 test runs

> Orchestrator: accepted. Record the timing test on the card as a load-dependent flake: it failed at load average 116 and passes alone, 45 of 45. Run it again at the end of each D1b-1 step. If it ever fails at a normal load (under about 10), it is a defect: report it to me. Also put the load average next to each full-suite count you report, so a count taken under heavy load can be told apart.
- Step 1 (56a2935, the master seeding and storeRefused): kit 548 tests, 61 failing, at a 1-minute load average of 116.48 read just after the kit ended (5-minute 86.54): the d6b882f baseline's 60 plus the load-dependent flake 'redact and refusal > the quoted-value reader stays linear on long input' (hooks/tests/logic.test.ts, which imports none of the files the commit changed), which passed alone, 45 of 45, while the 1-minute load average fell from 114.80 to 33.76. masters.test.ts 5 of 5. pytest 994 passed, 9 skipped, as the baseline. (DT, 2026-11-05, not verbatim.)
- Open after step 1 (review of 56a2935): no file reads switch.deck.master before step 2, so the seed is not yet shown through a real read; a failing set equal to the baseline is expected whether or not it works. Step 3 adds the discriminating tests: in a switch-world file the unstored master read through a real hook reads off (the plain answer would give the default, on); with storeRefused set, Deck's start fails on the refused master read; one read in the mod-manager world covers its json path. From step 2 on, the failures are compared by their error lines as well as their titles. (DT, 2026-11-05, not verbatim.)
- Step 2 (8cacd31, Deck wired behind its switches, the prompt.submit dispatcher): kit 548 tests, 61 failing, 487 passing, at a 1-minute load average of 27.50 at the start and 45.53 at the end (5-minute 28.46 and 40.35). The failing set equals the d6b882f baseline by title and by first error line except the same load-dependent flake, which passed alone, 45 of 45, at a 1-minute load of 35.19 before and 20.17 after; the three reference-module load failures name a different first missing import from run to run (the loader's order), the same files. tsc: the 62 errors of d6b882f, the same set (all tests/reference-modules). claude plugin validate: passed, one warning (the README install line). pytest: 994 passed, 9 skipped. The kit log carries 29 engine lines 'hook was skipped: no implementation for session.id' (or store.get), all under tests that fail at the baseline (the skills examples tests that load this plugin's hooks module): with no seeded master there, Deck's master reads its default, on, and deckLive asks for the session id those worlds do not answer.
- Step 3 (896a888 source fixes, e9d6d1f tests): kit 633 tests across 45 files, 60 fail, the same 60 titles as the d6b882f baseline (two of them, reference-module files that do not load, now name a different missing import of the same file); load 19.23 at the start, 11.63 at the end; pytest 994 passed, 9 skipped. The timing-flake file alone (hooks/tests/logic.test.ts): 45 of 45 at load 7.05. Type-check: the baseline's 62 errors, all in tests/reference-modules. cspell 0 issues; jscpd 2.38% of lines (threshold 5).
- Step 3 review fixes (9cd607f), run by the twelfth mods expert (M12): kit 643 tests across 45 files, 583 pass, 60 fail, the same 60 titles as the d6b882f baseline; by first error line one differs, tests/reference-modules/security-hud.test.ts naming another missing import of the same file (the loader's order); load 8.69 at the start, 15.38 at the end. pytest 992 passed, 2 failed, 9 skipped (load 18.83 at its end): test_no_absolute_paths flags 15 upstream fixture paths in hooks/tests/deck.test.ts (/Users/<you>, /home/<you>, /Users/<Shared>), tracked since e9d6d1f, whose step-3 pytest ran before that commit; test_mod_tests's staged kit run failed once on upstream's 'a narrow terminal drops the clock and cuts rows instead of wrapping them', which passed in the direct run: the fold's row count follows Date.now() (register.js:215), which the kit's mock clock does not move, so a slow run unfolds the limit rows and their countdown matches the clock regex. Both wait on a ruling (reports_dev/mods-expert/20261105_022115+0100-M12-step1-kit-at-9cd607f.md, local). The timing-flake file alone: 45 of 45 at load 9.47 to 10.18.
- After the merge of release main at 8159a2c (00bd891), M12: kit 669 tests across 45 files, 608 pass, 61 fail (load 29.40 at the start, 26.15 at the end): the 60 of the baseline, by title, and 'the installed plugins pane > lists every enabled row first (mods, then the other plugins), then the disabled rows by marketplace, and marks each mod' (hooks/tests/mod-manager.test.ts, the file's first test, timed out after 5000 ms), which passes alone, 247 of 247 in that file, both at 00bd891 and at 8159a2c (load 16.88 to 12.35): a load-dependent timeout, not the merge's. tsc: the 62 errors of the baseline, all in tests/reference-modules. pytest 993 passed, 1 failed, 9 skipped (load 24.07 at its end): test_no_absolute_paths, with the 15 deck.test.ts paths (fixed in ec62bd2) and 2 of release main's own, hooks/tests/mod-manager.test.ts:6019 (/Users/<ann>, 7e98a77) and :6037 (/Users/<a>, 37c09d6), still present at 900bd40; reported to the orchestrator for M11. test_mod_tests passed this time.
- At dcfee00 (release main merged at ed64cd0), M12, at low load (14.65 at the kit's start, 18.23 at its end, 25.27 at pytest's end): kit 670 tests across 45 files, 610 pass, 60 fail, the 9cd607f baseline's 60 by title; the mod-manager timeout did not recur. tsc: the baseline's 62 errors. pytest 993 passed, 1 failed, 9 skipped: test_no_absolute_paths, on release main's hooks/tests/mod-manager.test.ts:6051 and :6069 (moved by the merge from :6019 and :6037). Deck's two files alone: 95 of 95. Logs: reports_dev/mods-expert/m12/20261105_025455+0100-dcfee00-lowload-* (local).

## D1b-1 step 3

- 2026-11-05, finding 1 (next exactly once): measured in the kit, a prompt.submit answer beneath the dispatcher that throws ran once although the old .catch called next(e) again (next is replay-safe, types Caught), the submit rejected, and the old .catch logged that failure as the dispatcher's. hooks/index.ts .catch now returns next(e) at once when next.called, and logs only a failure before next. Test: a hook beneath the dispatcher throws: the prompt went on exactly once, and the failure is not logged as the dispatcher's (mutant: the guard removed, red).
- Finding 2 (no copy of switch state): every reader of prefs.auto, show.*, sound, quiet and cost is reached from an entry that reads the switches first (a hook, the command, a draw, a press, a tick); the one gap was upstream's fold timer, which counted rows between ticks. foldFrame now reads the switches before it counts. Tests: an off stored from outside is seen by the next draw, and by the next tick, with nothing between; a fold frame reads the switches between two ticks.
- Finding 3 (a start in flight when the master goes off): stopAll clears the starts in flight and counts the stop; loadAndMark marks nothing and holds no clock when a stop came while Deck loaded; the tool.check ask timer checks the stop count too. Tests: a master off made while Deck loads wins; an on after an off made during a start starts Deck again.
- Finding 5: the start-failure lines (gate.ts deckStartFailed, both lines, and mod.ts's follower line) pass the raw message to maskedLog, which masks and then makes printable (debug-log/logic.ts cleanMasked). Test: a home folder with a control character in it is still masked.
- Finding 6: next.origin is Origin (types index.d.ts:6912) and Origin.plugin is string (:7697); requirements-drafts/logic.ts:18 raisedBy is string, and d6b882f passed next.origin.plugin there too, so its type did not change.
- Noted, no fix (orchestrator): the started set grows by one session id per session for the module's life.
- Upstream's swallowed failures kept as upstream wrote them: refreshWeather(...).catch(() => {}), store.set(...).catch(() => {}), audio.play(...).catch(() => {}), and the try/catch around the HOME and session.id reads in loadDeck.
- The ported test hooks/tests/deck.test.ts: 42 of 42 pass, 3 rewritten under a ruling: the hidden-folder test reads the deck.folder switch (no-copy), and the plan and task-tool tests answer the kit's permission request with allow, because Claude Code 2.1.318's kit denies an ask no test answers (upstream's own tests fail the same way on that kit). Every command run in it carries the person's origin.
- Review of 8cacd31, dispositions: B1 refuted (TERMINAL_STYLES and DESKTOP_STYLES are arrays); M1, M4, M5 fixed; M2 mostly refuted (every governed read is in an entry that reads the switches), its two presses fixed; M3 refuted (refreshWeather returns without a city or with the weather section off); M6 verified, the live loader probe is step 4; m1 deferred to D1b-2; m2, m3, m4, m7, m8, m10 fixed; m5 measured as finding 1; m6 refuted in part; finding 3 (a start at every session start) fixed.
- m9 (start Deck after the other mods) not taken in step 3: Deck's awaited start work is the registry and store reads, session.usage and the model; its weather request is not awaited (register.js loadDeck). No slow start was measured. Open for the orchestrator.
- M4c's idle mark (2f21ab4): neither hooks/tests/masters.ts nor deck-integration.test.ts keeps a signed-read mark or an idle helper. In mod-manager.test.ts the masters seed answers a master read before world()'s store.get, so those reads neither set nor clear the mark, yet run a digest; every Deck master read there happens inside an awaited call (session.start and the four tool calls), as Deck's Pane hooks return before the master for other panes and the file mounts no band or footer. No case today.
- Orchestrator, for the later merge of release main (verbatim): "Line 545 is world()'s on('store.get', ...); lines 546 to 552 are unchanged; 553 to 555 are a WHY comment; line 556 is the changed mark line. Outside world(): lines about 4890 to 4915 (isSignedKey, PANE_FUNCTION_KEYS) and 5758 to 5788 (a new kit-helper test). Your seeding call goes before line 545, as planned; keep it out of 546 to 556."
- Mutation checks of deck-integration.test.ts (43 tests) on scratch copies: 26 mutants applied, 25 red; one equivalent (deckLive's return false after stopDeck: stopDeck empties the started set and the next line returns false).
- Orchestrator, for the next merge of release main (at 39a7270): take 1e29e89 (hooks/switch-followers.ts imports followBadgeSwitch from ./mod-manager/state and adds a branch for FN.badge and FN.latest; hooks/mod-manager/state.ts renames paneReadsOn to functionReadsOn($, id) and adds withoutCatalogs), 39a7270 (tests only) and the coming badge-race fix to state.ts; check the switch-followers.ts branch list by hand. hooks/tests/mod-manager.test.ts changed at about 4969 (mountSwitchesPane), 4992, 5958 and 6047-6118; world() is untouched. downloads_dev is untracked on this branch, not ignored: never stage it.

## D1b-1 step 3, the review of 896a888, e9d6d1f and 771c510
- One REVIEW fork, no tool calls: 2 MAJOR, 8 MINOR, 8 NIT. Each finding and what was done: reports_dev/mods-expert/20261105_013953+0100-DT-step3-review-fixes.md (local).
- MAJOR 1 fixed: a master off made while a start loads stops the load at its next step (loadDeck takes its start's stop count). Before, the cancelled load set the module's state and sent the forecast request (PRRD G13.1). keptOf returns the city flag instead of writing it. The tick takes the count before its master read and stops the same way.
- MAJOR 2 fixed: a fold frame that cannot read the switches ends the fold (endFold); a run of failed ticks is logged once and counted each time.
- MINOR 3 fixed: a reload builds its settings and reads their switches into them (readPrefs takes a target) before it puts them in place. Not tested: the kit cannot order the two entries the window needs.
- MINOR 4 fixed: a city lookup that finds no usable place puts the weather switch back as it was.
- MINOR 5: e9d6d1f's message said each guard was broken; five were not (the ask timer, the band press, stopDemo, the cityRejected reset, anyStarted). Each has a test now. This round's mutants: 14, all red. The tick's checks after the agents and the usage are not mutated one by one: they guard ticks 14, 400 and 8000, and 8000 ticks pass the kit's 5 s limit.
- Not tested, disclosed: the dispatcher's budget-expiry path (the kit cannot make a hook's budget run out). The measured case threw from the engine's answer beneath; the engine skips a plugin hook that throws, so a plugin's failure never reaches the .catch.
- m6 of the review of 8cacd31 (a failure-logging call that throws), why refuted in part: logEvent (hooks/debug-log/register.ts:50) returns void and catches its own file write, so it never leaves a rejection unhandled; it can throw only when $.ui.log throws at once (sendLog), and then the dispatcher's .catch still passes the prompt on.
- R8's no-origin row is covered by reading the code only: the kit stamps an origin on every command run, so the byOf('') test pins switches/logic.ts, not register.js's `?? ''`.
- Ported tests: upstream 0.4.12 has 42, the port 42 in the same order. Titles: 4 changed for the pet ruling, 5 for the command's name only. Bodies: every command run gained an origin, and 3 were rewritten under other rulings. The step-3 line "3 rewritten" named only the last group.
- The 2f21ab4 check, now marked ? INFERRED: Deck hooks 17 events, each reading the master through deckLive or isOn inside its own awaited call; that this leaves mod-manager.test.ts's idle mark alone was not traced against that test's world.
- Disclosed: while the band folds, each 33 ms frame reads the 12 switches, and each redraw reads them again; D1b-2 removes the fold timer.
- 2026-11-05, D1b-1 step 4 (orchestrator ruling, option a): the live loader check of the wired Deck is not run before publish (reason: the veto-list line). Its evidence before publish: the kit tests, claude plugin validate (passed with 3 warnings, all already at the branch base 181daee, recorded on TRDD-RZBQIM54) and check-mod.sh (== FAIL: tsc, the same 62 errors, all in tests/reference-modules). The live check is item 4j of TRDD-HAK91K6S.
- The review fixes are in 9cd607f (wip): the full kit and pytest were not finished when the session had to end; the Deck test files alone pass 95 of 95, tsc shows the same 62 errors, 14 mutants are red.

## Rulings for M12 (orchestrator, verbatim, 2026-11-05; list items joined to one line each)

> Orchestrator rulings for M12 (reviewed):
> A. Fixture paths: rewrite the upstream fixture paths in hooks/tests/deck.test.ts to allowed ones (/home/<tester>, /Users/<alice>), keeping what each test checks. /Users/<Shared> may be a deliberate non-home case: if it is, keep that meaning with an allowed non-home path; if no allowed path keeps it, report it to me before any exemption. Do not mute the scanner. Record the change on the card and in ADAPTED_FILES.
> B. Verbatim from the 8cacd31 review: "**m1. Minor: sessions are never forgotten (diff lines 599-600).** session.end never removes its session from `started` or `notices`, so a module serving many sessions grows these sets. **m2. Minor: NOT_STARTED_TEXT is wrong when the start failed (diff line 616).** When this session's start failed (a notice is set), the command still answers NOT_STARTED_TEXT, "turned on in another session", which is wrong there. Answer START_FAILED_TEXT when `noticeOf(session)` is set. **m3. Minor: stops that never redraw the pane (diff lines 519, 563, 612).** The tick, `deckLive` and the command's off path all call `stopDeck()` and ignore its result, so a dropped start-failed notice never calls `noticeChanged`." Say which of m1-m3 are already fixed (file:line) and fix the rest, each with a test that can fail.
> C. Merge release main at committed HEAD 8159a2c now; never take the clone's working tree. 8159a2c had no full kit, CPV, pytest or jscpd run, so run the full kit and pytest right after the merge and attribute any new failure to 8159a2c or to the merge. Send any 8159a2c failure to me for M11. Note on the card: Deck weather's person-only mark depends on item S, which waits for the owner (G13.1).
> D. Live loader probe: ruling (a) stands. Read-only, report: (1) probe.py's cleanup code at file:line, and whether it removes only files it created or any inline file it finds; (2) where the 12-hex hash in <name>_inline-<hash>.json comes from (docs or code, cited; if not findable, say so). Do not touch the existing mods-expert-developer-plugin_inline-55574310adc7.json; record it on TRDD-9W9XNNWK. I decide on a probe after that.
> E. Under the instant fold, the two Date.now() tests (the narrow-terminal clock test and :669) fail every time. D1b-2 rewrites them under a ruling: add a card line, and count them in "rewritten under a ruling".
> Then proceed with your D1b-2 proposal.
- C, the note (M12, 2026-11-05): Deck weather's person-only mark depends on item S of TRDD-5IK59SQ2 (the personOnlyOn field of the switches registry, present in the wip commit 8159a2c), which waits for the owner (G13.1); until it lands, the mark stays the named TODO in hooks/deck/switches.ts. The merge of 8159a2c is 00bd891 on feat/deck-tokensaver.
- E, the card line (M12, 2026-11-05): D1b-2 rewrites under ruling E, besides the 3 header and 2 fold tests of R2 amended: 'a narrow terminal drops the clock and cuts rows instead of wrapping them' and 'a long folder is cut from the left, and a narrow terminal drops the clock before the folder', whose clock regex /\d\d:\d\d/ also matches a limit row's countdown once every row draws at once; their regex is aimed at the header clock instead. Both count in "rewritten under a ruling".
- A, done (M12, 2026-11-05, ec62bd2; its /Users/<Shared> part is superseded by R1, a8f98bb, which keeps the sibling-of-home case under /home/<tester> with no exemption, and whose own mutant was run): the stubs' default home is /Users/<alice> and the Linux home /home/<tester>; every fixture folder moves with its home (10 test bodies and the stubs' default, paths only), and the adapted-file header names the change (ADAPTED_FILES in scripts/excerpt_lock.py records only the upstream file, so the header line it checks carries the change). /Users/<Shared>: 'another user's folder is not shortened to ~' ran from a folder beside the home, under the same parent; no allowed path gives that, so it now runs from /home/<tester>/deck under the home /Users/<alice>, still a folder outside the home. A mutant that shortens any folder under any home turns it red. Reported to the orchestrator, with an exemption for /Users/<Shared> alone as the alternative only the orchestrator can grant. 42 of 42 pass.
- D, answered (M12, 2026-11-05, read-only): probe.py takes the store's inline file names before the session (scripts/probe.py:265-267, inline_files :199-201) and, in remove() (:223-241), deletes an inline file only when it was absent then AND its name starts with <name>_inline- of a plugin under test (:237-240): it removes only files its own run created. The 12 hex digits are the first 12 of the SHA-256 of the plugin id, <name>@<marketplace> or <name>@inline, matched on all 4 store file names checked (names only; no document states it). So the file does not depend on the folder a plugin loads from: every --plugin-dir load of this plugin, a probe's included, shares one store file; a store may already hold this file from an earlier --plugin-dir load; probe.py then leaves its writes in it (recorded on TRDD-9W9XNNWK); a probe of a copy with another manifest name would get, and then remove, a file of its own.
- B, status (M12, 2026-11-05): m2 fixed at 9cd607f (hooks/deck/register.js:1931; test deck-integration.test.ts:409-420, its status line at :417). m3 fixed for the tick (register.js:1806) and the command's off paths (:1925, setMaster :1890); not fixed in deckLive (:1868-1870), by its comment (:1865-1866) on purpose. m1 not fixed. The fixes of m1 and of deckLive's m3, and a defect found with them (after /clear, /resume or /branch the process goes on under a new session id with no session.start, so Deck acts nowhere in it until the next start; measured in the kit on a scratch copy), are in the D1b-2 proposal r1 (reports_dev/mods-expert/20261105_023407+0100-M12-d1b2-proposal.md, local).

## Rulings for M12, second set (orchestrator, verbatim, 2026-11-05; list items joined to one line each)

> Orchestrator rulings (reviewed):
> R1 /Users/<Shared>: no exemption. Keep the meaning "a folder beside the home, under the same parent" by setting the test's home to a folder under an allowed root, for example home /home/<tester>/alice and folder /home/<tester>/Shared. That works only if Deck's folder display takes the home as an argument and the scanner allows the /home/<tester> prefix. If Deck matches generic /home/<name> or /Users/<name> patterns, the sibling meaning cannot hold: keep ec62bd2's form and add a card line that the sibling case is no longer tested.
> R2 live loader probe of a renamed copy: not yet. Report first, read-only: (a) how scripts/probe.py limits which plugins load, file:line. Do the owner's installed plugins (the old mods-expert-developer-plugin, standalone Deck, Tokensaver) stay out of the probe session? If they load, they write their real store files and the two Decks run side by side before D1c. Then I rule no. (b) every place our code reads its own plugin name (ruling 7's match on the part before "@", mount props, store keys), file:line, so a renamed copy's failures and passes can be read. After (a) and (b), I rule. If it ever runs, a renamed inline file left by a crash or the 10-minute kill is recorded on TRDD-9W9XNNWK and never deleted by hand.
> R3 /clear, /resume and /branch defect: the D1b-2 proposal includes a fix and reports two things. (a) Does upstream Deck 0.4.12 behave the same? (b) Which of our other mods (mods-manager, switches, requirements-drafts, self-command, probe-runner) key their state on session.start and break the same way, with file:line? If upstream breaks the same way, it goes on the veto list as a known issue; otherwise it blocks any D1b merge. If (b) finds shipped mods broken, report it and I mint a separate card; do not fold that fix into D1b-2.
> Also:
> - 00bd891 carries the wip item S guard into your branch. Note on the card that it is revertible.
> - Before D1b-2 builds on 00bd891, rerun the full kit at a lower load. It must show exactly the baseline 60. Report the load.
> - Release main has moved on to ed64cd0 (cspell TRDD-id rule, README claude -p wording, label). Merge it before your next step that touches shared files.
> - Show me 15518c9's lines in your next message.
- R1, done (M12, 2026-11-05, a8f98bb): Deck reads the home from $.env.get('HOME') (hooks/deck/register.js:1695) and shortens a folder by prefix (folderText, :295), with no generic /home/<name> or /Users/<name> pattern, and the scanner's match stops at /home/<tester>. So 'another user's folder is not shortened to ~' runs from /home/<tester>/Shared/deck under the home /home/<tester>/alice: a folder beside the home under the same parent, as upstream's /Users/<Shared>/deck beside /Users/<you> was. A mutant that shortens any folder under the home's parent turns it red (ec62bd2's form misses it by construction, since /home/<tester>/deck is not under /Users; not run), and so does one that shortens any folder under any home. This supersedes the /Users/<Shared> half of the A line in the first set.
- R2, answered read-only (M12, 2026-11-05; reports_dev/mods-expert/20261105_030113+0100-M12-r2-probe-load-and-own-name.md, local). (a) scripts/probe.py:273 starts claude with --setting-sources project, :274-275 add one --plugin-dir each, :276 sets one variable. By the docs, a plugin a user setting turns on stays out of a session started with --setting-sources project, and synced plugins are documented as out; this is not measured (? INFERRED). The other ways a plugin could load were checked; the details are in the local report. (b) Four tool-call hooks match mcp__mods-expert-developer-plugin__<tool>: self-command/register.ts:91 and :107, switches/register.ts:283, probe-runner/register.ts:98. Ruling 7's isOwnCommand (self-command/logic.ts:43) matches the name before @. KEEP_SELF_ON's match (nameOf, mod-manager/profiles.ts:272-287) sits in applyPlan, which has no caller outside tests. No code compares a mount's plugin prop. No store key carries the name.
- R3 (a), measured (M12, 2026-11-05): upstream Deck 0.4.12 does not break. On a scratch copy of upstream 0.4.12, with its own test stubs, after session.end with clear and with resume, and in a control run with no session.end, its clock still asks for redraws and a new todo list draws its band and its bar: 3 of 3 pass. Upstream's session.end only empties its bars, agents and tasks on a clear (register.js:1593-1600 upstream), and nothing in it is keyed on the session id except the spend count (:192, :1047, :1063). The same sequence on ours, checked by the status text and the band's deck-toggle, draws no band (scratch copy clear-run-3, now removed; its test is kept as reports_dev/mods-expert/m12/20261105_031900+0100-clear-measure-ours.test.ts, and upstream's run as -upstream.test.ts, both local), so the defect blocks any D1b merge.
- R3 (b) (M12, 2026-11-05): no shipped mod gates a hook on a session id marked at session.start. mods-manager keys only its hourly auto-update timers on the start's id (hooks/mod-manager/auto-timer.ts:11, :18-22, :33-46), and makes its state on demand (state.ts:254-256). switches (register.ts:55, :333), requirements-drafts (register.ts:64-82, :309) and self-command (pane.ts:36, :47-55; queue.ts:6-21) also make theirs on demand; requirements-drafts also resets on classic.SessionStart clear, resume or fork (:324-331). probe-runner holds no session state. resolve-bin's cache is per session but filled on demand (resolve-bin.ts:54, :75-77, :99-101). Not measured: whether timers, tools and commands set at session.start live on after a /clear in the real engine. The types say session.start fires once per process (index.d.ts:4529-4530) and that a timer can outlive its hook (:2876). ? INFERRED: if a later session.start ran in the same module after a /clear, auto-timer.ts:20 would find no set under the new id and add a second set beside the old id's.
- Item S (M12, 2026-11-05): 00bd891 brought the wip item S commit 8159a2c into feat/deck-tokensaver. Deck's code does not use it (no personOnly in hooks/deck). It is revertible, measured on scratch clones of dcfee00. 8159a2c alone conflicts (README.md, hooks/tests/mod-manager.test.ts, hooks/tests/switches.test.ts), because release main's later item S commits build on it. Reverting ed64cd0, 1ab57de, 900bd40, 49c0287, bd3c95b and 8159a2c, newest first, applies cleanly (8 files, none of them Deck's); it is the smallest set that does, and ed64cd0 (the catalog-read label fix) and possibly bd3c95b are not item S, so this revert also undoes them and keeps f483c62's cspell rule. The kit was not run on the reverted tree.
- Merge (M12, 2026-11-05): release main at ed64cd0 merged as dcfee00, auto-merged; .cspell.json parses and keeps deck.test.ts's per-file words, and mod-manager.test.ts world() keeps the seedMasters call before its store.get hook. Release main has since moved to 872e6bd, which is not merged.
- B, m2 mutation-checked (M12, 2026-11-05): with the command's not-started answer forced to NOT_STARTED_TEXT, 'a refused /mods-deck registration fails the start...' (deck-integration.test.ts:409-420) goes red, 1 of 53.

## Rulings for M12, third set (orchestrator, verbatim, 2026-11-05; list items joined to one line each; one machine path shortened to its last folder)

> Orchestrator to M12. The OWNER is waiting for the animations to be gone: speed now matters. Rulings:
> OWNER RULING (2026-11-05, verbatim answer chosen): "Drop item S" — "Follow G13.1 literally: Claude may turn any switch on, and a toast is the only notice you get." M11 removes item S on release main and will give me the commit id. When you merge it, drop the person-only TODO in hooks/deck/switches.ts. Deck weather is then an ordinary switch. Do not build on personOnlyOn.
> Q1: (i). Drop the seconds in countdown (:263-272) and shortCountdown (:283-286) only; humanReset is unchanged.
> Q2: 150 ms while working, as upstream. [superseded by correction 1: 300 ms]
> Q3: L, lazy adoption. Disclose on the card the race where another session in the same module adopts the half first. Record option M (a Deck classic.SessionStart hook with its own matcher { source: ['clear','resume','fork'] }) as the alternative, untested. It is to be used only if L fails a test or the live check.
> Q5: (c). An animating row counts as work only within 60 s of the last hook event.
> Q6: drop the transition clause. Record why on the card: it is an equivalent mutant under F-a.
> Q7: accepted. One idle timer and one weather chain per module.
> Commit order accepted: 1 carry, 2 m1 with the start token and deckLive's m3, 3 instant fold and HH:MM, 4 wake on work. Then D1c and D1d.
> Speed ruling: do not wait for the load to fall below 15. Run the full kit and pytest at any load. Rerun every failing file alone. A failure that passes alone and is a timeout counts as load, and you list it. Only a failure that also fails alone counts. Keep mutants and per-commit tests as they are.
> Your corrections: noted, thank you. 8fd70b3 (owner machine details in local history) goes on the owner's veto list beside 187a578; no rewrite.
> Live loader probe: no decision now; it comes with the merge into release main.
> Unchanged: fastedit only; probes only via scripts/probe.py; mutants on scratch copies; cards by pathspec in the main checkout, one agent at a time; never stage downloads_dev.
> Orchestrator to M12, owner ruling 2026-11-05 ("Port it in parallel now"): the Tokensaver port (TRDD-71KVH9PA) moves to a new agent, M13, in its own worktree …/mods-expert-developer-wt-tokensaver, branch feat/tokensaver, branched from your dcfee00. You now do Deck only: D1b-2, D1c, D1d. Your D1c guard is the code M13 builds Tokensaver's guard on. Keep the shared part (detection, the verdict store and the notice) separate from Deck's own wiring, so M13 can take it without Deck's code. Tell me the commit id when D1c lands. Do not edit files under feat/tokensaver. The owner also ruled "Keep both until the swap": the standalone deck@deck and tokensaver stay enabled until install, so the guard is needed at install time.
- Q6, why (M12, 2026-11-05): under F-a the fold is instant, so react already acts on the tick that sees a state change; one more tick after a transition draws and plays nothing new, and a mutant that removes the clause cannot fail any test. The clause is dropped.
- Q3, the race L leaves (M12, 2026-11-05): the ended half sits in module memory until the first Deck call in a session with no Deck state of its own. When one module serves more than one session, another such session in the same module can make that call first and adopt the half meant for the cleared one; the cleared session then stays unstarted until /mods-deck on. Option M (a Deck classic.SessionStart hook with its own matcher { source: ['clear','resume','fork'] }) is the alternative, untested, to be used only if L fails a test or the live check.
> Orchestrator to M12, corrections after a review of my last rulings. 0. Authority: your D1b-2 design and commit order are yours. My Q1-Q7 answers stand as answers to your questions, with one change. 1. Q2 changes to 300 ms while working. Reason: the owner's complaint is CPU: "slowing down the system" and "that animation waste space and cpu time". 150 ms goes on the owner's veto list as the rejected alternative. 2. Q3 L: record on the card that after /clear the band does not draw until the first Deck call in the new session, while upstream redraws at once. I am putting it on the veto list. 3. Proposed merge order; tell me if you see a better one. M13 merges feat/deck-tokensaver into feat/tokensaver when your D1c lands, to get the guard. At the end you merge feat/tokensaver into feat/deck-tokensaver and resolve conflicts in the shared files: excerpt_lock ADAPTED_FILES, the no-copy exemptions, the README, the catalog, the menu and the mod registration. Then feat/deck-tokensaver goes into release main. In shared files each of you appends its own entries and never rewrites the other's. 4. Shared process, binding on all three agents: (a) Card commits in the main checkout: before staging, git -C <main checkout> diff --cached --name-only must be empty or list only your paths. Commit with git commit -- <paths>. On index.lock, wait and retry. (b) [superseded by the fixes after a second review, below] Full kit and full pytest: take the lock with mkdir /tmp/mods-kit.lock first and remove it when done (trap on exit). If it exists, wait and retry. Never remove a lock you did not take; one older than 45 minutes is reported to me. (c) [narrowed by the fixes after a second review, below] Timing tests use fake timers. A timeout in a test of a file your commit touched must pass in the kit run itself, not only alone. This narrows my earlier speed ruling, because Deck's work is timing work.
> Orchestrator to M12 (sent to M13 too): the per-mod notice line of TRDD-AXE8CUWR is built, per M11. It is on release main at 72d3969, with review fixes d419729, 11a741e, 42d988d and 25a1fd1. A mod gives its notice through a NoticeGetter registered by mod name: hooks/switches/register.ts:64, with the type in hooks/switches/logic.ts. Your branch has it through the ed64cd0 merge (check with git merge-base --is-ancestor 25a1fd1 HEAD). D1d and the guard's notice use it; do not build a second notice.
- Q3 L, what the person sees after a /clear (M12, 2026-11-05, recorded by the orchestrator's correction 2): nothing of Deck's draws in the new session until its first Deck call there, a hook or a draw of the band or footer (each draw hook passes deckLive, which adopts the half); upstream, with no session gate, redraws at once. While the clock still runs (until D1b-2 commit 4), its tick asks for redraws as upstream's does, so the first draw adopts; after commit 4, a /clear with no work going on waits for the next hook or the minute redraw. On the owner's veto list.
- Q2 changed (M12, 2026-11-05, orchestrator's correction 1): 300 ms while working; 150 ms is the rejected alternative on the owner's veto list. 25a1fd1 (the per-mod notice line's last review fix) is an ancestor of feat/deck-tokensaver's HEAD, checked.
> Orchestrator to M12, fixes after a second review. 1. Kit lock, revised, replaces rule (b): the lock covers only the full TypeScript kit run. Per-commit pytest and per-file test runs take no lock. To take it, run mkdir /tmp/mods-kit.lock and write holder.txt inside it with the agent name, the shell PID ($$) and the start time. If the lock exists and kill -0 on its PID fails, the holder is dead: remove the lock and take it. If the holder is alive, wait. Remove your own lock with trap on exit. 2. Fake timers, narrowed from rule (c): they apply to new tests and to tests your commit touches. Adapted upstream tests under the excerpt lock change only when they flake, and each change is recorded in ADAPTED_FILES with its reason. 3. Q2: 300 ms is my ruling on your own Q2, revised for the owner's CPU complaint. If any ported upstream test asserts the 150 ms cadence, record its change in ADAPTED_FILES. 4. You are the merger of feat/deck-tokensaver into release main, after feat/tokensaver is merged into your branch. Ask me for the window first; M11 will stop with its tree clean during the merge.
- Note (M12, 2026-11-05): besides the worktree path the heading names, the quote of the orchestrator's corrections (015bfa8) also shortens a second machine path, the main checkout's, to <main checkout>.
