---
trdd-id: 2XFV601A
title: Digest the 18 listed community mod repos into the component palette
column: design
status: tasked
created: 2026-10-29T12:34:27+0100
updated: 2026-10-31T14:04:32+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-29T12:34:27+0100
npt: [3I5MBOL2, VZR8RDW5, K10C193B]
implementation-commits: [aa397dc, f0f2862, f4e8084, 5ab652a, 6bfbc97, f4e0f5f]
---

# Digest the 18 listed community mod repos into the component palette

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-29

CURRENT STATE 2026-10-29: design. I1 to I4 and I7a done and committed; cards 3I5MBOL2, VZR8RDW5, K10C193B committed (tooling). Phase 2 tree v4 recorded below. I7b committed (f4e8084). CPV strict gate measured 2026-10-29 in clean clones of f4e8084 and c4c308a with 5.22.3 and 5.23.0: identical findings at both commits (CRITICAL 0, MAJOR 2, MINOR 2, NIT 5). The probe adds none, and RC-TEST-COVERAGE untested components fell from 19 to 1. Every MAJOR and MINOR, and the 3 A2A NITs, are the open CPV issues 268 (exfiltration intent, vague name, A2A) and 269 (shebang). The 2 markdownlint NITs on this card are fixed. Outputs: reports_dev/mod-examples-2/cpv-i7b/. NEXT ACTION: I7c probe (mods-example-credentials-and-tokens) awaiting commit, then the CPV strict gate on it; then the code commit for corpus repo 19 (CLONE_PINS and LICENCES in scripts/excerpt_lock.py); then I8 from taxonomy v5 under the round-4 rules.

### User directive (verbatim, 2026-10-29)

"have you completed all tasks? have you created the mod components palette of skills and references that can be used as modules to build mods? I also need you to digest, breakdown and rewrite all their functionalities and ui elements styles as modules components the following projects:" followed by 23 URLs (18 distinct repos): anantraghunath/claude-code-usage-quota-mod, MarvelCollin/ClaudeDeck, simplecore-inc/claude-mods, sam-ruff/account-switcher-claude-code-mod, IlyaPryzhykau/claude-keep-sessions, raoofaltaher/claude-code-mods, Amnesiac9/claude-mods, plexxed/claude-desktop-account-switcher, manuacl/claude-mods, trongtaiz/account-swap, endavis/claude-code-usage-quota-mod, dionlima1/account-sync-for-claude, ivokund/claude-account-rotator, jrlprost/claude-code-mods, fanoisme/claude-mods, bully911210/claude-code-mods, moabualruz/rice-session-accounts, qodfathr/ccwhoami.

Second message, verbatim: "if you are asking to the cpv plugin to relax the validation rules, you cannot do it. but you can inform of the safety of certain mods code snippets to avoid false positives the cpv claude by opening an issue on the cpv github repo."

Third message, verbatim: "do as you think it is best. base your decisions on verified facts."

Fourth message, verbatim: "those are matters for the developer that will use the plugin to develop the mod, not for us. let the developer deal with the legal matters and the specifics. you just have to provide ready to assemble mod components, to develop anything. you are not actually developing a full mod or an installable mod."

Fifth message, verbatim: "you must break down the code in more specialized modules. those are too broad."

### Scope (user ruling 2026-10-29, supersedes the earlier scope decision)

- Everything in the 18 repos is IN scope, including account switching, credential handling, rotation, Desktop private-folder mods and unattended model calls. The deliverable is ready-to-assemble mod components, not a full or installable mod. Legal and policy fitness of the assembled mod is the developer's decision; a component may carry a one-line factual note naming the host data or files it touches; the note carries no legal or policy commentary, while technical-accuracy notes (UNVERIFIED host internals, as I8 requires) stay.
- Kept, because the plugin itself redistributes the text: MIT and Apache credits for every excerpt; no verbatim code from the three unlicensed repos (they are rewritten in our own code); CPV findings are never suppressed, and false positives are reported as CPV issues with evidence.
- Superseded (kept for the record): the 2026-10-29 OUT list (the earlier OUT list excluded credential copying, storing, swapping or injection, reading a stored token to call an endpoint, and automatic rotation between accounts) and the round-2 scope rules (data-source drops, no swap transcription, no private-folder procedure, automated-access flag).

### Licences and credits

Licences: MIT with a LICENSE file (15): Amnesiac9, anantraghunath, bully911210, dionlima1, endavis, fanoisme, florian101010 (Florian Grimmer), ivokund, jrlprost, MarvelCollin, moabualruz (plus LICENSES/simplecore-claude-mods.MIT.txt), plexxed, sam-ruff, simplecore-inc, trongtaiz. Apache-2.0 with a NOTICE file (1): manuacl. No licence file and no licence grant anywhere in the repo (3, measured with grep): IlyaPryzhykau, raoofaltaher, qodfathr; their content is rewritten in our own words and code, never excerpted.

Credits: endavis credits Anant Raghunath and Eric Davis (README:251, quoted "MIT (c) 2026 Anant Raghunath, (c) 2026 Eric Davis"); sam-ruff quotes its holder line "developer" plus the repo URL; moabualruz pieces taken from simplecore (THIRD_PARTY_NOTICES.md:8, upstream commit 722763cc) credit both; manuacl ships LICENSE and NOTICE beside any excerpt; IlyaPryzhykau, raoofaltaher, qodfathr: knowledge only, and their writer works from the verified inventory prose, never from the source file; their icons are redrawn, never copied.

### Corpus pins

Cloned 2026-10-29 with git clone --depth 1; re-fetch a pinned hash with git fetch --depth 1 origin <hash>.

| repo dir | upstream commit |
|---|---|
| Amnesiac9__claude-mods | 199a91026a202e456f00db751dd2ccc1732a5f0f |
| anantraghunath__claude-code-usage-quota-mod | 5444bb3fdf523e561f397355055c11dc95224ace |
| bully911210__claude-code-mods | bf4e5297845df85e7c678260c8a2b8e3734120a6 |
| dionlima1__account-sync-for-claude | 1e447c888b7114f343036074e64d0fc636dbb80c |
| endavis__claude-code-usage-quota-mod | 1a0f370e074cf752b2c692458324c1632d95ff57 |
| fanoisme__claude-mods | 4891b8f75f8dc0a7253dc1a32fb0be0e3f7237e9 |
| florian101010__cache-meter | 75de8d8cbb542c249a4b32e5122feb61ba730ded |
| IlyaPryzhykau__claude-keep-sessions | ee9d3afe5bb43c4eb1797b177d1785429c66bc17 |
| ivokund__claude-account-rotator | 3481f0feb5161fac0826336b2b0ad68eb0e225fd |
| jrlprost__claude-code-mods | 9f789939f4b0fabbc9309b8c84df358536a2619b |
| manuacl__claude-mods | 03d552c6faa294d2abe24cdfc60c0cc7bdf35a46 |
| MarvelCollin__ClaudeDeck | eb9b064a72b4cc1cf3bc2a3fa6c77550666bd62e |
| moabualruz__rice-session-accounts | af30e671ec5164c32848477bc51d3072876d2682 |
| plexxed__claude-desktop-account-switcher | 1035f712cd0f45dfd9f9904546cccc3e5f350013 |
| qodfathr__ccwhoami | 8071d18866780d53ed8598f19e5e817c5ea7f158 |
| raoofaltaher__claude-code-mods | 6d7f12029d67e7a7a6cb72b284c40512090b828b |
| sam-ruff__account-switcher-claude-code-mod | 3f47d2b23bcda686aae86bf8f1db30cfa8c32c9c |
| simplecore-inc__claude-mods | bbaba993776913888aa02a9e21e101a46b1f0bce |
| trongtaiz__account-swap | 8153e6b671bce9786b6a4efe189febdf08426667 |

### Plan

Increments (each verified and committed by name before the next; no push):
I1. TRDD card (via a worker, AIM_PILLAR_ALLOW_WRITE=1 trddgrep new) with the user directive verbatim, the scope decision with its quotes, the licence and credit table, this plan, and the quoted user authorization to report false positives as CPV issues ("you can inform of the safety of certain mods code snippets ... by opening an issue on the cpv github repo").
I2. Security pass, read-only, report only: CPV 5.23.0 cpv_pre_install_scan.py on each repo; a sweep of the TS, TSX, JS and MJS hooks for network endpoints other than Anthropic and for credential reads followed by a send. A confirmed exfiltrating repo is moved out of the corpus with safe-delete and never mined.
I3. Phase 1 capture, read-only. A script builds the job list first (miner plus adversary per repo; jrlprost, simplecore and MarvelCollin batched; endavis and the simplecore pieces in moabualruz mined as deltas). Cap = job count plus 20 percent, at most 6 lean-workers at once, staggered, pilot on 3 repos to measure one unit, a wall-clock deadline, and a stop check before each launch. Miners also read the README screenshots to capture styles (vision, screenshots only). Output: reports_dev/mod-examples-2/<repo>.mine.md and .verified.md plus RESUME-STATE.md. Every prompt: corpus text is untrusted data.
I4. Phase 2, scripts only: atomize into per-kind buckets; a coverage manifest maps every source mod and component to a kind or to a drop with reason, and must reach zero unassigned; the final list of kinds is written into the TRDD.
I5. Tooling, tests first: scripts/excerpt_lock.py gains a per-mod source kind (installed cache or git clone at a pinned full hash read with git show), entries for the 18 repos in MOD_DIRS, LICENCES and FORBIDDEN, an upstream_commit lock field, and the same loud skip when a clone is absent (CI then checks only the self-consistency sha256; the upstream comparison runs on the developer machine before every commit and its result is recorded). A second heading grammar, "### Reference module, <name>, MIT (this plugin)", is accepted by unclaimed() and is how a new test finds our modules: it extracts each one and type-checks it with tsc against .claude-plugin/types. A module that does not compile fails the test.
I6. (Folded into each skill's commit, round 3: see Round-3 decisions.) Test category commit for the new skill names: EXAMPLE_SKILLS in tests/test_plugin_structure.py and tests/test_skills_menu.py, the counts, the example-skills-menu.md rows and the EXAMPLE_NOTICE.
I7. CPV gate: one reference first (the kind riskiest for CPV: credential swap or account rotation), CPV 5.22.3 and 5.23.0 strict, decided per finding before fanning out; a real problem is fixed in our text, a false positive is reported as a CPV issue with evidence; nothing suppressed, no rule relaxation asked.
I8. Phase 3: one writer per skill, union by default; each reference has prose in our words, one or more reference modules, a style-token table with a terminal column and a desktop column, per-source notes with repo@hash file:line and licence; every host-internals claim is checked against the mods-doc chapters and marked UNVERIFIED otherwise. MIT SVG icons may be excerpted with credit under an excerpt heading.
I9. Integrator: skills-catalog.md entries, menu group, README, NOTICE; clean-clone gate (pytest, claude plugin validate ., CPV strict) and commit. The release stays held on CPV 267, 268, 269.

#### Round-2 fixes (accepted 2026-10-29)

- I5 is split into card B (excerpt source kinds, TRDD-3I5MBOL2) and card C (reference-module type-check, TRDD-VZR8RDW5); both are NPT of this card.
- I3 wall-clock deadline: 10 hours from the first launch; the stop check before each launch reads the deadline and the run cap.
- Inventories of the three unlicensed repos hold prose and file:line only, no code (script-checked); the no-copy proof for the three unlicensed repos is a committed test, card D (NPT).
- Every style-token row cites a source file:line.
- The coverage manifest denominator is generated from every */.claude-plugin/plugin.json path in the corpus, never from the miner list; 0 unassigned before I4 ends.
- the I7 probe kind is confirmed after I4 as the kind riskiest for CPV; I6 stays after I4.
- Capture field: every usage component records its data source (host API, transcript, or stored token plus endpoint); measured: $.session.usage().rateLimits gives the signed-in account only.
- Editing the nine existing mods-example-* skills (owned by TRDD-04ZJ9E90) re-verifies and re-pins their existing excerpts in the lock.
- I9 re-runs the size limits and the catalogue and menu counts after the final kinds are known.
- The CPV authorization quote is in User directive above.

#### Granularity rule (user, 2026-10-29)
- One module = one specialised element or behaviour (for example one bar style, one countdown, one footer label, one credential read, one token refresh, one theme palette), never a broad kind such as "raster or chart" or "store or state".
- Phase 2 groups atoms as kind, then sub-kind, then module; every module gets its own reference module (our TypeScript) and its own catalogue entry, so the agent loads exactly the piece it needs.
- The nine existing mods-example-* skills (TRDD-04ZJ9E90) are re-split to the same granularity in I8.
- Cross-module imports are exactly ./<module-name> (no extension, no subfolder), checked by tests/test_reference_modules.py.
- A reference module block is at most 150 lines (tests/test_reference_modules.py fails above it); one element or behaviour per module is the writers judgement, checked in review.

### Phase 2 result (2026-10-29)

- Phase 1 capture: 32 jobs over 18 repos, 69 plugins, all miner reports verified by an adversary; 1142 component atoms and 947 style atoms; coverage 0 unassigned (scripts_dev/atomize_mod_corpus.py).
- Taxonomy v1 rejected, with the numbers: 1535 modules, 495 of 715 component modules held one atom, 749 of 820 style modules held one token, account-switching 121 atoms in 79 modules with no union.
- Method v2: 25 clusters with full atom rows, one designer each, a reconciler, an adversarial audit (17 of 80 merges wrong, 34 missed unions, 13 of 40 sampled modules split), then v4.
- Rule adopted: a module is the element with both its code and its own style tokens; styles skills hold only cross-cutting styling; Phase 3 writers make final splits from atom text and record them (47 modules marked SPLIT-CANDIDATE).
- Final tree v4: 21 skills, 117 kinds, 720 modules (234 draw on more than one repo), 23 atoms dropped with reasons.

Skills, kind count / module count (each skill name is prefixed mods-example-):

- account-switching 11/59
- band-and-status-line 4/53
- call-intercept 5/44
- cost-and-metrics 7/48
- credentials-and-tokens 5/20
- engine-and-model-calls 8/39
- pane-and-chart 4/94
- process-and-network 8/51
- session-and-timers 6/41
- state-and-settings 5/41
- styles-animation 1/6
- styles-bar-and-meter 7/19
- styles-glyph-and-icon 5/27
- styles-layout-and-spacing 6/33
- styles-text-and-controls 3/14 (renamed from styles-other: it holds control styles, message text and value formats)
- styles-palette 8/29
- styles-typography 5/17
- testing-and-packaging 5/23
- tool-and-command 8/32
- transcript-rendering 2/10
- workspace-and-git 4/20

Kind names per skill:

- account-switching: account-identity, auto-rotation, call-intercept, desktop-app-control, file-read-or-write, login-swap, process-run, session-sync, settings-or-switch, store-or-state, toast-or-log
- band-and-status-line: band, band-layout, footer, status-line
- call-intercept: call-intercept, instruction-injection, pure-rules, toast-or-log, turn-tracking
- cost-and-metrics: clock-or-timer, cost-or-limits-math, file-read-or-write, process-run, quota-poll, session-start-wiring, store-or-state
- credentials-and-tokens: call-intercept, file-read-or-write, process-run, settings-or-switch, store-or-state
- engine-and-model-calls: call-intercept, codex-agent, engine-command, model-prompt-building, model-reply-parsing, paid-model-call, process-run, settings-or-switch
- pane-and-chart: control, pane, raster-or-chart, store-or-state
- process-and-network: detached-run, network-call, process-run, scheduler-install, scrubbing-before-send, settings-or-switch, store-or-state, untrusted-repo-git
- session-and-timers: clock-or-timer, file-read-or-write, session-start-wiring, store-or-state, toast-or-log, tool-result-observer
- state-and-settings: environment-detection, file-read-or-write, process-run, settings-or-switch, store-or-state
- styles-animation: motion
- styles-bar-and-meter: band-style, bar-geometry, chart-style, control-chrome, gauge-bar, gauge-colour, meter-layout
- styles-glyph-and-icon: bar-glyph, control-glyph, icon-set, status-mark, text-mark
- styles-layout-and-spacing: band-style, pane-card, pane-dialog-frame, pane-list-row, pane-size, pane-spacing
- styles-text-and-controls: control-style, message-text, value-format
- styles-palette: category-palette, control-colour, doc-art, mascot, preset, ramp-or-gradient, status-tone, theme-switch
- styles-typography: font-stack, heading, label, text-role, title
- testing-and-packaging: ci-proof, demo-asset, packaging-manifest, repo-tooling, test-helper
- tool-and-command: call-intercept, file-read-or-write, pane, prompt-input, skill-prompt-file, slash-command, status-line, tool-output-parse
- transcript-rendering: message-render-decoration, tool-line-decoration
- workspace-and-git: file-read-or-write, pane, process-run, store-or-state

Pointers: reports_dev/mod-examples-2/taxonomy-4.md and reports_dev/mod-examples-2/clusters/merged-assignment-4.tsv (gitignored working files; this section is the durable record).
#### User directive (verbatim, 2026-10-29, round 3)

- "remember to update the skill-menu with all the new skills. and to ensure all reference files linked from a skill will have a toc that is mirrored inside the SKILL.md after each link, to inform the progressive discovery algorithm of the content of the reference file."

#### Round-3 decisions (2026-10-29)

- I6 is no separate commit: each new skill's name joins EXAMPLE_SKILLS (both test files), the counts, the menu rows, the catalogue and the README in the commit that creates its folder, because the structure test asserts set equality and fixed counts.
- One reference file per module, references/<module-name>.md, with a ## Table of Contents; SKILL.md repeats that TOC as nested entries under each link. A skill whose SKILL.md would exceed 450 lines is split into sibling skills by kind (the CPV skill line cap is 500, MAJOR).
- A clone excerpt heading is "### <Owner__repo> <40-hex pin>, <file>:<a>-<b>, <licence>", and the line under it is "Full source: https://github.com/<owner>/<repo>/blob/<pin>/<file>#L<a>-L<b>".
- A module takes host paths as parameters; host-internal paths appear in prose marked UNVERIFIED.
- A module that imports a sibling (./<name>) lands in the same commit as that sibling.
- The catalogue (skills-catalog.md) keeps one entry per skill; a module's own entry is its TOC line in the SKILL.md of its skill, so the menu SKILL.md does not grow with the module count.
- Reference modules are fail-fast and do one element each; a caller composes them (I7b review).
- Decided: every reference module has a behaviour test at tests/reference-modules/<name>.test.ts, run by claude plugin test from tests/test_reference_modules.py; the module and test sets must be equal.

#### User directives (verbatim, 2026-10-29, round 4)

- "i don't remember if i already gave you this mod to digest or not: https://github.com/florian101010/cache-meter"
- "yes, digest it well."
- "remember: all modules must work on both cli and desktop claude. also the author must be able to style them as he want to make them aligned with the rest of the mod graphic style. Also ensure that all panels or bars have visible buttons to show/hide them, and not forcing the user to type a skill to show/hide a panel/bar."
- "take as example the `[ Deck ]` button of the deck mod."

#### Round-4 decisions (2026-10-29)

- Corpus repo 19: florian101010/cache-meter at 75de8d8cbb542c249a4b32e5122feb61ba730ded, MIT, Copyright (c) 2026 Florian Grimmer; security pass CLEAN; capture verified (61 components, 53 style rows); assigned in taxonomy v5 (reports_dev/mod-examples-2/taxonomy-5.md, clusters/merged-assignment-5.tsv): 22 skills, 753 modules, new skill mods-example-cache-and-context (17 modules). Its pin and licence go into scripts/excerpt_lock.py with the next code commit.
- The cache modules that already existed (prompt-cache-countdown, cache-miss-detector, expiry-warning-toast, context-breakdown-read) move into mods-example-cache-and-context when that skill is written; next-prompt-cost stays in mods-example-cost-and-metrics (price math).
- Surfaces: every module works with e.surface 'terminal' and 'desktop' (the only two values, mods-doc-mods-reference chapter:226). Its reference file has a ## Surfaces section with what differs between the two, each difference cited to a chapter line, and an Operating systems line; a module tied to one OS (the macOS keychain) refuses with a clear error elsewhere. A UI module's behaviour test renders it under both surface values where the kit lets a test set e.surface (UNVERIFIED until tried).
- Style: the look is the author's. The styles-palette skill defines one shared token vocabulary (colours, glyph sets, labels, spacing). A UI module takes a typed subset of it, with defaults, so a mod sets its look once. User-visible text is a token too (labels, notices, error text shown in the UI). Module code has no colour literal in color, backgroundColor, borderColor or dimColor props and no label literal outside the defaults object (a static check). The behaviour test overrides every token key and asserts that each one is used. Non-UI modules are exempt.
- Show/hide: every pane and band is shown and hidden by a visible button, never only by a typed command. The model is deck's [ Deck ] button (deck 0.4.12, MIT, hooks/register.js:1962-1980): a Button in the footer, drawn by a ui.render handler on SessionMode that wraps next(e). SessionMode is rendered on Terminal and Desktop (mods-doc-mods-reference chapter:241). The palette ships it once as a footer-toggle module. Each pane and band module exposes an open state that the toggle drives, and the author composes one toggle per panel or one per mod. The button's look (label, a count in the label, dimmed while closed) comes from style tokens with deck's look as the default. It has a hotkey named in its label, per the house convention for bracketed terminal buttons. Hidden means not drawn; any fold animation is the author's. The open state persists in the mod's store by default, as deck's prefs.open does. A slash command may exist besides the button. Out of scope: the Claude Code status line (a settings script, not a mod band) and transient toasts and notices, which still follow the style rule.
- Checks: the structure test detects a UI module by $.ui.resolve, a ui.render handler, $.ui.open or a Button(, Box(, Text( or Svg( call, not by imports (mod code destructures the elements from $.ui.resolve). The behaviour test of the footer-toggle module and of each pane and band module checks the toggle where the kit renders SessionMode (UNVERIFIED until tried).

### Relevant cards

TRDD-04ZJ9E90 (owner of the nine existing mods-example-* skills; its Design and Licence decisions apply), TRDD-WVPGT6IX, CPV issues 267, 268, 269.
2026-10-31: I7c done and committed on branch wt/2xfv601a-round4 as 5ab652a (worktree builds_dev/wt/2xfv601a, not merged): mods-example-credentials-and-tokens (macOS keychain item store, OAuth token refresh, account token-refresh lock) with behaviour tests, a Surfaces section on all six reference modules, and the Surfaces and Style-tokens structure test. Review (reports_dev/2xfv601a/20261031_125543+0100-round4-review.md): 0 blockers, 9 should-fix, 8 nits; items 1-8 and the nits are being fixed in the worktree. OWNER QUESTION (review item 9): the types label the process block 'CLI only' (index.d.ts:3582), while the round-4 rule says every module works on terminal and Desktop; the keychain and lock modules run processes, so their Desktop support is UNVERIFIED. Get a live Desktop check before merge, or record them as a terminal-only exception? NEXT ACTION: commit the review fixes on the branch, merge into main after the mod-manager fix, re-run tests/test_example_excerpts.py and tests/test_no_copy_unlicensed.py on merged main, then the corpus repo 19 pins, then I8.
2026-10-31: round 4 is merged into main (da3fc93: 5ab652a credentials-and-tokens skill and Surfaces rule, 6bfbc97 review fixes). Gates on the merged tree in the main checkout: pytest 645 passed; test_example_excerpts.py and test_no_copy_unlicensed.py 32 passed with no skips. The merge review (0 blockers) found one should-fix: the keychain and lock modules say they work on Desktop although $.process is CLI only (index.d.ts:3582); a follow-up checks each module and marks those that use $.process terminal only; that is the agent's proposal, and item 9 (a live Desktop check, or a terminal-only exception) stays open for the owner. The parked stash 'TRDD-2XFV601A round-4 WIP' differs from 5ab652a in 4 files (which side is newer is not established) and is kept, pinned as branch archive/2xfv601a-round4-wip.
2026-10-31 (supersedes the merge line where they differ): f4e0f5f marks the keychain module (runs security) and the lock module (runs mkdir and rmdir, found by the worker) terminal only; OAuth uses only $.http and $.clock and keeps Desktop. The merge commit da3fc93 is not listed under implementation-commits. Gates on the merged tree: pytest only; check-mod, tsc and the kit run come with the next full gate.
ACCEPTANCE ADDED 2026-10-31 (owner directive: the five-hour usage window is optional on some subscriptions): every module extracted from now on, notably the cache-meter plan-limit modules and the jr-mods welcome text, looks windows up by kind and shows nothing for an absent five-hour window; tests/test_five_hour_window_optional.py must pass on the merged tree.

## Approval log

- 2026-10-29T12:34:27+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Acceptance

- [ ] Every module extracted after 2026-10-31 that reads or labels the usage windows (notably the cache-meter plan-limit modules and the jr-mods welcome text) looks windows up by kind, shows nothing for an absent five-hour window, and has a behaviour test fed a list without five_hour; tests/test_five_hour_window_optional.py passes on the merged tree.
