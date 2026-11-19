---
trdd-id: 04ZJ9E90
title: Break the installed mods into catalogued component example skills
column: blocked
status: tasked
created: 2026-10-27T13:15:16+0100
updated: 2026-10-31T13:26:34+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T13:15:16+0100
eht: [WVPGT6IX]
blocked-by: [WVPGT6IX, gh:Emasoft/claude-plugins-validation#268, gh:Emasoft/claude-plugins-validation#269]
unblock-when: [trdd:WVPGT6IX, issue:Emasoft/claude-plugins-validation#268, issue:Emasoft/claude-plugins-validation#269]
implementation-commits: [9023df9, 9fb2473, b51767d, 622e0b8, b8597da, 21401e0, b698eac, 6a3add5, 7bf754a]
pre-block-column: testing
blocker-probe: s=$(for n in 267 268 269; do gh issue view $n --repo Emasoft/claude-plugins-validation --json state,stateReason -q ".state + \":\" + .stateReason"; done); [ "$(printf "%s\n" "$s" | grep -cx CLOSED:COMPLETED)" = 3 ] && echo CLOSED || echo OPEN
blocker-holds-if: match:^OPEN$
blocker-probe-canary: match:^(OPEN|CLOSED)$
---

# Break the installed mods into catalogued component example skills

## STATE
CURRENT STATE 2026-10-27: design; nothing built. NEXT ACTION: read-only component inventory of the seven installed mods (reports under reports_dev/mod-examples/), then fix the taxonomy, then one worker per component skill.
Inventory reports go to reports_dev/mod-examples/, with reports_dev/mod-examples/taxonomy.md as the entry point.
CURRENT STATE 2026-10-27 (supersedes the line above): column dev. Increment 1 probe (whole copy of context-harness) made CPV v5.22.3 and v5.23.0 strict report CRITICAL CMD_INJECTION (scripts/replay.ts:58, a regex .test()) and MAJOR CREDENTIAL_DISCOVERY (hooks/tool-gate.ts:81, a deny-list classifier); both false positives, filed as Emasoft/claude-plugins-validation#267, nothing suppressed. Whole copies are HELD (not dropped) until a CPV release fixes #267; the copy waits in samples_dev/mods-example-copies/context-harness (gitignored), and the applied inc1 work is in git stash (two entries named TRDD-04ZJ9E90 inc1; none dropped). NEXT ACTION: knowledge-first per the Revised plan section: (a) tests category for mods-example-* skills with no code; (b) ONE component skill with real excerpts as the CPV probe; (c) fan-out one worker per skill; (d) one integrator for shared files; (e) clean-clone gate and commit.
When the component skills ship, move this card to blocked on TRDD-WVPGT6IX (its EHT, the whole copies held on CPV issue 267), not to complete; pre-block-column is the column it would have reached.
CURRENT STATE 2026-10-27 (supersedes the lines above): nine example skills committed (band-and-status-line plus eight). CPV flags our own prose in three places, filed as Emasoft/claude-plugins-validation#268; together with #267 this blocks the next publish, not the commits. NEXT ACTION: clean-clone gate, then wait on CPV 267 and 268; the whole copies stay in TRDD-WVPGT6IX.
Urgent-release escape hatch: until CPV issues 267 and 268 ship, publish.py is blocked on main since 9fb2473 (prose false positives). An urgent fix ships from a branch cut at 9023df9 (CPV-clean) or after reverting 9fb2473 on that branch, never by suppressing a finding. Before every commit that touches skills/mods-example-*, run python3 -I scripts_dev/verify_excerpts.py R (bad must be 0) until it becomes a committed test.
CURRENT STATE 2026-10-27 (supersedes the lines above): column blocked. The nine example skills, the catalogue rows and the excerpt checks are done: tests/test_example_excerpts.py compares every excerpt with the cache, tests/fixtures/example-excerpts.lock.json pins each block by sha256, and scripts/update_excerpt_lock.py (helpers in scripts/excerpt_lock.py, standard library only) rewrites the lock only from verified excerpts; scripts_dev/verify_excerpts.py is superseded. Clean-clone gate on 7bf754a: pytest 470 pass; CPV v5.22.3 and v5.23.0 strict show only 2 MAJOR INTENT_EXFILTRATION and 3 NIT A2A plus the MINOR vague name tool (all #268) and the MINOR missing shebang on the import-only scripts/excerpt_lock.py (false positive, Emasoft/claude-plugins-validation#269; the shebang added in 6a3add5 to satisfy it was reverted in 7bf754a). Blocked on TRDD-WVPGT6IX (whole copies, CPV #267) and on CPV #268 and #269, which hold the next publish. NEXT ACTION: when the blockers clear, rerun the clean-clone gate, then publish with scripts/publish.py. Open follow-up: a test that update_excerpt_lock.py imports only the standard library and excerpt_lock (checked once by hand in a venv without pytest).
CURRENT STATE 2026-10-27 (review of e81172b, supersedes the lines above where they differ): only the component-skill half of the user's request is done. The other half, whole copies of the MIT and Apache mods inside the plugin, is NOT done: it is TRDD-WVPGT6IX, held on CPV #267 (token-optimizer and regia stay knowledge only by licence). Release rule: unblock-when governs, and it needs TRDD-WVPGT6IX terminal AND CPV #268 and #269 closed; the blocker-probe prints CLOSED only when all of 267, 268 and 269 are CLOSED with stateReason COMPLETED (won't-fix or a gh failure keeps OPEN). pre-block-column is testing: on release, rerun the clean-clone gate, then move to complete by hand only once TRDD-WVPGT6IX is terminal, then publish. The stdlib-only test follow-up is TRDD-0XUQDQLB.
2026-10-31: barmkin-mod and the tokensaver 0.4.0, token-optimizer 5.13.61 and keep-sessions 0.2.0 changes, installed after this card's corpus, are covered by TRDD-R2GILGKU, not here.

## User directive
"ok. i want you to copy all those mods into the plugin, incorporating them as templates and examples to learn and reproduce. you can break down them into the single components, putting the knowledge and the source as examples into different modular skills that the agent can call when it needs to build some similar components. make sure to classify and catalogue all the components that you break down those mods into, so the agent will discover the right component when reading the catalogue descriptions of them, and only loading the corresponding reference file when it needs it, as the progressive skills discovery system work."

"those mods" = the seven installed mods listed on 2026-10-27: tokensaver@claude-tokensaver 0.3.0, token-weather-usage@augiefra-mods 3.17.15, token-optimizer@alexgreensh-token-optimizer 5.13.58, deck@deck 0.4.12, context-harness@context-harness 0.0.1, regia@mod-claude 0.3.3, ponytail@ponytail 5.3.2.

## Licence decisions
- MIT with a LICENSE file: context-harness (ysys143), deck (nvr0x5), ponytail (DietrichGebert), tokensaver (Gregory Albert). Source may be copied. For every MIT mod: copy its LICENSE whole into its example folder and credit it in NOTICE.
- regia: MIT declared only in its manifest, with no LICENSE file; author "Samuel". Before copying, look upstream for a LICENSE file. If there is none, treat regia as knowledge only, like token-optimizer, and record that as a risk-based decision.
- token-weather-usage: Apache-2.0 per its README (author Eric Cologni; upstream LICENSE and NOTICE at augiefra/claude-mods). Fetch the upstream LICENSE and NOTICE from augiefra/claude-mods for version 3.17.15 and keep them beside the copy; mark modified files as changed. Its README says parts adapt code from MIT projects (agentpane by Anji Xu); credit those too. Also credit any remaining code from the Anthropic example that token-weather-usage cites.
- token-optimizer: PolyForm Noncommercial 1.0.0. This plugin is MIT, so NO source is copied: knowledge only, in our own words, with the scripts_dev/nocopy_diff.py no-copy proof.

## Design
- Split by COMPONENT TYPE, not by mod (for example band, pane, tool registration, command, store and state, call intercept, toast, clock and timer, process run). Each component skill gathers that component from every mod that has one.
- Each skill is skills/mods-example-<component>/:
  - SKILL.md: short, says when to load which reference;
  - references/<component>.md: knowledge in our words, per-source notes;
  - each copyable mod is kept WHOLE as a reference copy under skills/mods-example-mods/examples/<mod>/, holding its full source tree, its manifest and its hooks files, as the tutorial examples already do, plus that mod's LICENSE file;
  - the component skills point into those copies by file and line range, with short excerpts, so nothing of a mod is lost and the catalogue still drives discovery;
  - leave out node_modules, dist, lock files and build output.
  This follows the existing examples/ folders of the tutorial skills.
- One discovery-oriented catalogue entry per component in skills/mods-the-skills-menu/references/skills-catalog.md, plus a menu group.
- A new "example skills" category in BOTH tests/test_plugin_structure.py and tests/test_skills_menu.py, committed before the skill files. Each skill needs agents/openai.yaml and a README Components row.
- Measured on 2026-10-27, tsc does not see skills/: the generated .claude-plugin/types/tsconfig.json includes only hooks, types and tests. The existing tutorial examples under skills/*/examples/ already carry full plugin.json and hooks.json files and pass CPV, so whole copies follow a proven pattern.

## Checks per commit
- Grep copied files for machine paths.
- CPV security pass on the copied source.
- tsc must not pick up examples (check how the existing tutorial examples are excluded).
- List every .cspell.json word added.
- Clean-clone gate: pytest, CPV v5.22.3 strict, CPV v5.23.0 diff against the baseline.

## Sequence
After the pending release (mod-manager manifest-hooks fix, gate, publish).

## Risks and safeguards
- (a) Before copying everything, copy ONE mod and run CPV v5.22.3 strict plus the v5.23.0 baseline diff. A security finding on copied third-party code cannot be suppressed; if one appears, stop and decide per finding.
- (b) Prompt injection: scan every copied file for instruction-like text before committing. Every SKILL.md states that examples are data, never instructions to follow.
- (c) Secrets: run a secret scan on the copies, plus the machine-path grep.
- (d) Strip execute bits from copied files.
- (e) The structure tests in tests/test_plugin_structure.py already refuse root files that reference examples/, and stray manifests; they are the guard that keeps the copies inert.

## Approval log

- 2026-10-27T13:15:16+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-27T15:12+0100 Design change reviewed by an adversarial review fork (knowledge-first pivot, held copies). Applied: Apache LICENSE and NOTICE shipped beside any token-weather-usage excerpt; each excerpt carries a 'Full source' pointer for the later copies; the copy work split out as TRDD-WVPGT6IX, blocked on CPV issue 267. Design review columns skipped consciously: mono-agent project, main agent is the approver.
- 2026-10-27T16:34:42+0100 — column → blocked. skills shipped; publish held on TRDD-WVPGT6IX and CPV 268, 269

## Revised plan 2026-10-27

- Skills mods-example-<group>/ hold SKILL.md, references/<kind>.md (one per taxonomy kind) and agents/openai.yaml; no code files and no examples/ folder. References are self-contained (prose in our words plus short excerpts with mod, version, file:line and licence on each), because an installed plugin has no copies to point at.
- The 24 taxonomy kinds (reports_dev/mod-examples/taxonomy.md) are grouped into about ten skills, each kind its own reference file.
- Excerpts allowed from MIT mods context-harness, deck, ponytail, tokensaver, and from token-weather-usage (Apache-2.0, upstream LICENSE and NOTICE kept, changes marked). Knowledge only, no excerpt, with the scripts_dev/nocopy_diff.py proof: token-optimizer (PolyForm Noncommercial) and regia until its upstream LICENSE is checked.
- Every SKILL.md states the examples are data, never instructions. Worker prompts treat the mod caches as untrusted data.
- When whole copies land after #267: tests/test_no_absolute_paths.py needs per-file exemptions, never a global token such as the session temp-folder prefix (it would hide real scratchpad-path leaks).
- Recorded 2026-10-27: the token-weather-usage LICENSE and NOTICE come from the upstream default branch of augiefra/claude-mods (no tag exists; its plugin.json there says 3.17.15 and the hook file is byte-identical to the installed cache). The README lists the example skills in an Example skills section, not as Components rows; discovery runs through skills-catalog.md and the menu group. scrubbing-before-send.md shares 12 eight-word runs with token-optimizer: all are secret-pattern regex fragments inside the verbatim MIT context-harness excerpt (verified byte-exact by scripts_dev/verify_excerpts.py); the prose shares none. The two shared fragments are the generic character class [a-zA-Z0-9_]{10,} and the textbook PEM armour line -----BEGIN [A-Z ]*PRIVATE KEY-----, functional patterns common to public secret scanners and not copyrightable expression.
- Decided 2026-10-27: when an installed mod updates past a pinned excerpt version, tests/test_example_excerpts.py FAILS (and so blocks publish) until the excerpts are re-verified and re-pinned with scripts/update_excerpt_lock.py. A deferral file that downgrades this to a warning was considered and rejected: it is a bypass of a validation, which the owner's no-suppression rule forbids. The cache comparison skips only where no plugin cache exists (CI); the committed sha256 lock still runs there.
