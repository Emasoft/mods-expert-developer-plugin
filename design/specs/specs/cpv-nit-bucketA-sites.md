# The 72 CPV NIT findings — bucket A enumerated

Bucket A = the 30 distinct SITES on which a rule about a DANGEROUS INSTRUCTION fired.
(36 findings: a finding is a (rule, site) pair, and 6 of the 30 sites carry two rules.)

This is the list backing the editorial question in `DELEGATION.md`: **does this plugin ship, as they appear in Anthropic's own
documentation, the vendor's install one-liner, the permission-bypass CLI flag, the long-lived-token minting command, and the
superuser examples?**

**Each site carries a STANCE, because that is what the ruling turns on.** Whether a passage TEACHES a thing, merely NAMES it, WARNS
against it, or merely EXPLAINS it is a different question from whether the passage mentions it, and a summary that flattens those
together cannot answer the question. Read the STANCE column, not just the description.

**REGISTER — what in this file is measured and what is a reading.** Three things here are MEASURED: the count of 30 sites
(re-derivable from the validator's output), the digest below (a checksum over the chapters' bytes), and the recorded search result
(the pattern and the command are given above, so it can be re-run). Everything else in this file is a READING —
the grouping into contents, the per-site descriptions, the stances, and the per-content decisions. Those are one reader's judgement,
written here so the owner can CHECK them rather than re-derive them, and marked here so the reader knows which register they are in. A
count in this file is not an opinion; a stance is.

**The passages are deliberately NOT quoted.** A tracked file that quotes these commands is itself read by the skillaudit rules as
an invocation, so quoting them would make this file a new instance of the very finding it documents. The same thing happened to the
ledger during this series: writing the flagged command names into it took the finding count from 72 to 76. Each site is described
in words instead, and the passage is at the cited line.

## WHAT THIS FILE DOES NOT STATE

**No recommendation. The question is the owner's, and the plugin's own reasoning is not the answer.** The per-content decisions below
state what each content IMPLIES; what this file withholds is a RECOMMENDATION. The readings below are the plugin's account of the
evidence, not its ruling on it.

The tempting move — after twenty-two rounds of characterising these passages, to state a position and hand it over — is wrong here for
three reasons, and the first is the load-bearing one.

**The premise was not established, and the repository says so in a way that cuts both ways.** The repository DOES state a practice of
preservation: `README.md:8` and `.claude-plugin/plugin.json:4` both describe "60 **preserved** Claude Code documentation chapters", and
`NOTICE:12-17` says the chapter files are "adapted from Anthropic's Claude Code documentation ... included for reference only". The
README's second sentence — "Use it to create, fix, improve and evaluate Claude Code mods and plugins" — is the plugin's stated purpose,
and it is a USE statement, not a statement of what to do with a dangerous passage.

What the repository does NOT state is a policy on what to do when a preserved passage is a dangerous instruction — no file says
whether preservation is unconditional, whether redaction is permitted, or who decides.

**THE CHECK, RECORDED SO IT CAN BE RE-RUN — not a summary of a search, but the search itself.** Corpus: every tracked file except the
60 chapter files (151 files). Pattern (case-insensitive, one alternation):

    redact|unconditional|editorial (policy|remit)|dangerous (content|instruction)
    |permitted to (remove|omit|edit)|must not ship|omit|sanitis|sanitiz|scrub
    |keep verbatim|unmodified

Command, run over the corpus EXCLUDING this series' own two artefacts, so a re-runner reaches the substantive result without
subtracting by hand. The pattern is inline so the command is copy-pasteable, not a placeholder to reconstruct:

    PAT='redact|unconditional|editorial (policy|remit)|dangerous (content|instruction)|permitted to (remove|omit|edit)|must not ship|omit|sanitis|sanitiz|scrub|keep verbatim|unmodified'
    git ls-files -z | grep -zvE "chapter\.md$" \
      | grep -zvE "^(DELEGATION\.md|design/specs/specs/cpv-nit-bucketA-sites\.md)$" \
      | xargs -0 grep -ilE "$PAT"

And pass 2, the broader alternation, the same way:

    PAT2='as-is|as is|do not alter|without modification|reproduce|reproducible|unaltered|authoritative|verbatim|do not change|do not edit|do not modify|do not remove|must remain|unchanged|fidelity|faithful'
    git ls-files -z | grep -zvE "chapter\.md$" \
      | grep -zvE "^(DELEGATION\.md|design/specs/specs/cpv-nit-bucketA-sites\.md)$" \
      | xargs -0 grep -ilE "$PAT2"

Substantive hits — 3 files, and each is an unrelated use of the word:

| file | what the hit is |
|---|---|
| `scripts/publish.py` | a publish gate's CREDENTIAL redaction, not documentation |
| `scripts/cpv_network_resilience.py` | "unconditionally" describing network-failure handling |
| `.github/workflows/notify-marketplace.yml` | "Sanitization" of `${{ github.* }}` values crossing into a shell |

Running the same command WITHOUT the second filter also returns this file and `DELEGATION.md` — the two artefacts doing the recording.

**THE COVERAGE LIMIT OF BOTH PASSES JOINTLY, so the negative is bounded on the record the way the digest bounds its scope.** A search
for WORDS is a search for words, not a proof of silence: a policy could be written in vocabulary neither alternation matches. Pass 2
was built to test pass 1, so the phrasings named as pass 1's misses ARE pass 2's vocabulary — and pass 2 is one more word list among
two, with its own misses. Phrasings NEITHER pass would match include "these chapters ship exactly as Anthropic publishes them",
"the upstream text governs", "reproduced faithfully", "not to be altered", "pass through unmodified". The honest bound is therefore
stated over the two passes TOGETHER: **no tracked non-chapter file states a policy on preserved documentation in the vocabulary
searched, and that vocabulary is not exhaustive of how a policy might be phrased.** A second, broader
alternation over those phrasings was run against the same corpus, and it hit 10 files — every one of them an unrelated use of a word:

| file | what the hit is |
|---|---|
| `LICENSE` | "AS IS" — the standard MIT warranty disclaimer |
| `CHANGELOG.md` | "verbatim" — the release note's own claim about the bundle (see below). This hit is on the ORIGINAL wording, re-verified after the hand-edit was reverted; a run made while the correction was in place would have hit the correction text instead. |
| `git-hooks/pre-push` | "Do NOT edit by hand" — about a GENERATED file, not the chapters |
| `scripts/publish.py` | "as-is" / "authoritative" / "verbatim" — about a build step and a shipped artefact |
| `tests/test_skills_menu.py` | "authoritative" — about skill frontmatter |
| the 5 `design/proposals/TRDD-*.md` | "authoritative" (a STATE-block header) and "verbatim" (a TRDD body about the chapters) |

**No hit in either pass is a policy on preserved documentation.**

**ONE INCONSISTENCY IN THE REPOSITORY'S OWN SELF-DESCRIPTION, FOUND WHILE DOING THIS, AND MATERIAL TO THE RULING.**
`CHANGELOG.md:20` describes the bundle as "60 reference skills holding **verbatim** Claude Code documentation chapters", while
`NOTICE:12-17` describes the same files as "**adapted** from Anthropic's Claude Code documentation" and lists what was changed. The
NOTICE is the accurate one, and the chapter files bear it out. **What is checkable, with a procedure and its result:**

    git ls-files 'skills/*/references/chapter.md' | xargs grep -c "^## Chapter content"

→ 60 of 60 files. Every chapter file carries a `## Chapter content` heading with Anthropic's `### Hooks reference`-style section
titles nested under it (`skills/mods-doc-hooks-reference/references/chapter.md:17` is that heading, and the chapter's own
`### Hooks reference` sits at `:23`), and each opens with a `## Table of Contents` at `:3`. That two-heading shape is NOT Anthropic's
page structure: a document fetched from `code.claude.com` is prose under one title, and the plugin's chapters are restructured into a
contents list plus a content section.

**A CORRECTION TO AN EARLIER CLAIM IN THIS FILE.** A previous version of this section cited the two headings as "the ADDED
`## Table of Contents` heading" and "the ADDED `## Chapter content` heading", and said the chapters were reworded in a way "verbatim"
forbids. **That was wrong on both counts.** The baseline commit `0a8e531~1` — the pre-series upstream — ALREADY had both headings in
all 60 files (`git show 0a8e531~1:skills/mods-doc-hooks-reference/references/chapter.md` opens `## HOOKS REFERENCE` / `## Table of
Contents` / `## Chapter content`), so the two-heading shape is the baseline's, not this plugin's addition. And the reworded section
TITLES that NOTICE lists were reworded in the plugin's OWN EARLIER WORK — commits `fa1395b` ("trim chapter TOCs to section level,
reword reader-facing passages for the agent"), `2339314` ("broaden section titles in 7 chapters so they cover their subsections") and
`8f6d9f6` ("broaden section titles in the remaining chapters") — which are all BEFORE the `0a8e531~1` baseline. So the chapter files are
NOT verbatim, but the evidence is the plugin's own history, not a structural difference from the baseline: against `0a8e531~1` the net
diff is 2 chapter files and 4 path values. **The honest statement is therefore narrower: the chapters are adaptations because the
plugin's own commit history says so, and NOTICE describes them accurately; the "verbatim" word is wrong.** The
CHANGELOG's word is wrong, and it is wrong in the direction that MATTERS here: "verbatim" would make preservation unconditional by
description, whereas the truth is that the chapters are adaptations, and whether an instruction may be omitted from an adaptation is
the question the owner is being asked.

**THE CHANGELOG IS GENERATED, SO THE WORD IS CORRECTED IN THE COMMIT MESSAGE AND NOT IN THE FILE.** `scripts/publish.py:2740`
(`stage_changelog`) runs `git cliff --bump --tag v<NEXT> -o CHANGELOG.md`, and `-o` OVERWRITES the file from the commit log; the
step's own docstring says "CHANGELOG.md is fully DERIVED from conventional commits, so hand-written prose in it does not survive a
publish. Put release prose in the commit messages." A hand-edit to the 0.1.0 entry would therefore be discarded on the next release —
and with it the one correction in this series that bears on the owner's ruling. The fix belongs in a conventional commit message,
which git-cliff renders into the next entry; `cliff.toml`'s `body` template uses `commit.message`, so a `fix:` commit carrying the
correction is what reaches the CHANGELOG. **Until such a commit is released, the false word is still in `CHANGELOG.md:20`, and that is
stated here rather than left for a reader to discover.**

**WHAT THE NEXT CHANGELOG WILL SAY — MEASURED, not predicted, and the measurement corrects an earlier claim of this file's.**
`git-cliff` was run against the repository, in a scratch clone, using **the pipeline's own command, `git cliff --bump --tag v<NEXT> -o
CHANGELOG.md` (`scripts/publish.py:2740`)**. **It exited 0 and produced a dated `## [0.2.0]` heading with the same body — but it also
printed `WARN There is nothing to bump`, because this repository has NO TAGS.** So: the generator's output from this commit log was
MEASURED, and it is the dated form the pipeline writes; the version-bump path itself is NOT exercised here, and the pipeline's step is
not what was run end-to-end. The two commits carrying this correction render under "Bug Fixes" as:

    - **docs:** The chapters are adapted, not verbatim — the release note said otherwise (cb5a1d8)
    - **docs:** Revert the CHANGELOG hand-edit — that file is generated (9404d9e)

The first bullet carries the corrected FACT — the chapters are adapted, not verbatim — which is what a reader of the next CHANGELOG
needs. Those two bullets are a SLICE of a larger "Bug Fixes" group, not the whole group.

**AND THE MEASUREMENT CORRECTED A CLAIM THIS FILE PREVIOUSLY MADE.** An earlier version of this section said the 0.1.0 bullet "is
regenerated from the same commit log, and the commit that produced it still says 'verbatim'". **That was false.** The committed
`CHANGELOG.md` is a 20-line HAND-AUTHORED file, and the "verbatim" bullet is hand-written prose in it: `git show HEAD:CHANGELOG.md`
reads "## [0.1.0] … - Initial packaging: the expert mods developer agent and 60 reference skills holding verbatim Claude Code
documentation chapters", and **no commit subject in this repository contains that sentence** — `e25b03e`, the commit that created the
file, has the subject "feat: embed chapter TOCs in SKILL.md, rename reserved-word skills, add canonical pipeline" and uses "verbatim"
in its body about TOC COPYING, not about the chapters. The generated render does not reproduce the bullet at all: the measured output
contains no "Initial packaging" line, and its Features group reads "Embed chapter TOCs in SKILL.md, rename reserved-word skills, add
canonical pipeline". **So the file is only PARTLY derived**: the pipeline overwrites it wholesale on the next publish, and in doing so
the hand-written 0.1.0 bullet DISAPPEARS — carrying the false word with it, by regeneration rather than by correction. The false
word does not persist into the next CHANGELOG, but it also is not corrected there; it is simply gone, and what replaces it is a
commit-subject-derived bullet about the pipeline work. **THIS HOLDS CONDITIONALLY** — it is true for a release cut from a commit that
still contains `e25b03e`, which every current commit does. This repository has NO TAGS, so the release-cut point is not fixed, and
`stage_changelog`'s own docstring warns that a `-o` overwrite destroys prior entries; a release cut from a commit BEFORE `e25b03e`
would produce a CHANGELOG with no 0.1.0 section at all, and the false word would be gone in a different way again.

**THE CONSEQUENCE FOR THE RULING.** The false word lives in a released file the plugin ships, and it says the chapters are verbatim —
which would make preservation unconditional by description. Two things follow, and both are stated rather than assumed. First, until
the next publish, the word is in the released artefact, and the correction lives only in this repository. Second, the next publish
removes the word as a side effect of overwriting a hand-written file, not as a correction — so nobody should read the next CHANGELOG as
evidence that the point was settled. **NOTICE already states the adaptations accurately**, so the claim the CHANGELOG contradicted is already answered correctly in the
repository. (NOTICE is the licensing and attribution statement; nothing in this repository designates it as the plugin's policy
authority, and this file does not claim one. Whether the false word constitutes a POLICY problem is the owner's question, and this
file does not answer it — it reports the false claim and the corrected fact.) **There is no CLAUDE.md and no PRRD.md in this repository** — the project's conventions
elsewhere assume a PRRD, and its absence here is itself part of the finding. So the premise is HALF-stated, not absent: the practice of
preservation is declared, the rule for dangerous content is not, and the rule for dangerous content is exactly what is under review. A
practice is not a grant of authority over the question. **The silence may also mean the question has simply never been put** — a READING, not a fact about the repository: the owner may hold the policy in their head rather than in a file, which is why the rule is asked rather than derived. It is offered as a possible explanation, not as the explanation.

**SCOPE LIMIT, so this negative has a shelf life stated:** the check covers the 151 tracked non-chapter files as of this commit. It
does not cover the 60 chapter files (Anthropic's own text, which cannot state this repository's policy), and it would need re-running
if a new tracked file appeared — a PRRD, a CLAUDE.md, a policy file, or a pipeline change. Nothing in this file flags that
automatically; the chapter digest below does not cover it either.

**AND THE CHAPTERS ARE ALREADY ADAPTED — a FACT, which bears on the ruling and sits in the same NOTICE paragraph as the citation
above.** `NOTICE:12-17` also documents that the chapter files are "adapted from Anthropic's Claude Code documentation": section-level
tables of contents added, section titles reworded to describe what each section covers, one subsection promoted to a section,
website-only components rewritten as plain Markdown, and a few passages reworded for the agent. The plugin therefore does NOT ship
Anthropic's text verbatim; it ships an adaptation, and it has already reworded passages once. That is worth the owner's attention,
because it means "ship" and "rewrite the chapter" are not the only two shapes the answer can take — but what it does NOT establish is
that a dangerous instruction may be omitted within that envelope. The NOTICE records that titles are reworded, subsections promoted and
website components rewritten; it does not record that an instruction was ever removed. Whether an omission is in scope is a question
for the owner, and this file does not answer it.

The second reason is about the document's function, not its content: a brief which arranges a position next to its supporting evidence
makes that position easier to accept than the evidence alone would make it, and a decision-maker handed a brief is not making the
decision the same way as one handed a table of readings.

The third is simpler: a plugin that states its own editorial position in its own file exercises an authority its owner has not granted
it.

What follows is EVIDENCE, and the readings on it, so the owner can rule without re-deriving anything. The decision per content below is
what each content IMPLIES, not what the plugin recommends.

## The contents, and the decision each one implies

The owner rules on a DECISION, not on 30 sites. The 30 sites reduce to the contents below; each content carries the decision it
implies, so the ruling can be made from this file alone. The count is the number of SITES, not of findings.

**The "procedure or instruction" column is the distinction the ruling actually turns on.** THE CRITERION, in one sentence: a passage
is a PROCEDURE if the reader would run it to accomplish an ordinary goal, and an INSTRUCTION if the reader would run it to do something
dangerous for its own sake. The column is a reading, not a measurement, and it is applied per group — so a group label can be a
summary of sites whose individual stances differ, and the per-site stances below are the finer grain. Where they differ, the per-site
stance describes the LINE and the group label describes the GROUP; the ruling turns on the group, the detail on the line. It is also
why the tally of stances should not be read as a count of endorsed practices.

| content | sites | procedure or instruction | the decision it implies |
|---|---|---|---|
| the vendor's install one-liner | 11 | PROCEDURE for the 7 that show the command (the reader's route to installing Claude Code, in several shapes — the plain command, a corporate-proxy variant, a container build; 7 sites are not 7 teachings); 3 of the 11 merely EXPLAIN the command and 1 merely NAMES the pattern, so the group label is a summary, not a description of every line. | The plugin ships the vendor's OWN install command, in the chapter that documents installing Claude Code and in the chapter that troubleshoots installing it. The decision is whether preserving the vendor's own installer is within this plugin's remit — the passages that merely explain what it does are the same decision in weaker form. |
| the permission-bypass flag | 7 | MIXED — one passage RECOMMENDS it (running unattended in a container), two WARN against it (use only in trusted environments), four merely NAME it as a mode override. Only the first is an instruction for its own sake. | The plugin mentions the permission-bypass flag in three different registers: recommended (running unattended in a container), warned against (use only in environments you trust), and named as an option to override a restored mode. The decision is whether a chapter that mentions the flag at all is within remit, or only one that recommends it. |
| the superuser examples | 7 | PROCEDURE — every one is a remedy in a troubleshooting chapter: a superuser command the reader needs for a problem they already hit (a local-bin directory they cannot write, a file owned by another user, or a swap file that needs superuser to create). None instructs privilege escalation for its own sake. | Every one of these is a REMEDY in a troubleshooting chapter: a superuser command the reader needs to fix a permissions problem they already hit, not an instruction to escalate privilege. The decision is whether teaching a superuser remedy falls within remit. |
| the token-minting command | 4 | PROCEDURE — documenting how to authenticate, with one passage advising AGAINST the token for a shared secret. It is how a reader authenticates, not an instruction to mint a token for its own sake. | The plugin documents the token-minting command once as something to run, once to advise against (use an API key instead for a shared secret), and twice as a reference. The decision is whether documenting the command is within remit. |
| not one of the four | 1 | NEITHER — a plain network-fetch command mentioned in passing, with no dangerous instruction behind it. | This site is EVIDENCE for the upstream discriminator, not an outlier to exclude: a dangerous-instruction rule fired on a pipe character in a sentence that carries no dangerous instruction at all. It is the cleanest demonstration in the set that the rule matches a CHARACTER rather than a danger, and it should be quoted as such in the upstream request. |
| **total** | **30** | | |

## The stance tally

**The stance tally is a READING, like the grouping and the descriptions.** The count of 30 and the digest are measured; this is a
judgement about what each passage does, one reader's account of it, recorded so it can be checked.

| content | TEACHES | NAMES | WARNS | EXPLAINS |
|---|---|---|---|---|
| the vendor's install one-liner | 7 | 1 | 0 | 3 |
| the permission-bypass flag | 1 | 4 | 2 | 0 |
| the superuser examples | 7 | 0 | 0 | 0 |
| the token-minting command | 1 | 2 | 1 | 0 |
| not one of the four | 0 | 1 | 0 | 0 |

## Provenance

| | |
|---|---|
| chapter-text digest | `d2cb0b417e9b5d16` (sha256 over the 9 chapters' bytes) |
| validator | `cpv-remote-validate plugin . --strict` (CPV v5.22.0) |
| regenerated by | re-running the validator and re-deriving the site list from its `[NIT]` lines |

**The digest, not a commit id, is what detects staleness.** The line numbers are tied to the chapter text, and a re-sync changes
the text without changing this file. Recompute the digest over the same 9 chapters; if it differs, the line numbers here no longer
point at the passages described. A commit id could not detect that, because the file and the chapters would both have moved on.
It does not detect a change in the other 51 chapters, nor a change in the scanner's rules — for that, re-run the validator.

## The 30 sites, by content

### the vendor's install one-liner  (11 sites)

- **mods-doc-cc-permissions-modes** line 382 — rule: SUPPLY_CHAIN — **NAMES**
  - a prose BULLET naming the install-one-liner pattern as an EXAMPLE of downloading and executing code, in a list of things a permission prompt might cover

- **mods-doc-troubleshooting-cc-setup** line 125 — rule: CMD_INJECTION, SUPPLY_CHAIN — **TEACHES**
  - a fenced shell sample of the vendor's install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code

- **mods-doc-troubleshooting-cc-setup** line 535 — rule: SUPPLY_CHAIN — **EXPLAINS**
  - a prose sentence explaining what the install one-liner does and what a write-failure error means — explanatory text inside a troubleshooting entry

- **mods-doc-troubleshooting-cc-setup** line 599 — rule: CMD_INJECTION, SUPPLY_CHAIN — **TEACHES**
  - a fenced shell sample of the install one-liner with a corporate-CA certificate flag — the vendor's own instruction, for a proxied network

- **mods-doc-troubleshooting-cc-setup** line 688 — rule: SUPPLY_CHAIN — **EXPLAINS**
  - a prose bullet on an unknown-parameter error, explaining that the macOS/Linux installer was run in Windows PowerShell and pointing at the PowerShell installer instead

- **mods-doc-troubleshooting-cc-setup** line 704 — rule: CMD_INJECTION — **TEACHES**
  - a prose sentence explaining that the Windows batch installer prints the script instead of saving it without an output flag, and telling the reader to run the complete command

- **mods-doc-troubleshooting-cc-setup** line 797 — rule: CMD_INJECTION, SUPPLY_CHAIN — **TEACHES**
  - a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code

- **mods-doc-troubleshooting-cc-setup** line 829 — rule: CMD_INJECTION, SUPPLY_CHAIN — **TEACHES**
  - a fenced Dockerfile sample running the install one-liner inside a container image — the vendor's own instruction, in a container build

- **mods-doc-troubleshooting-cc-setup** line 836 — rule: SUPPLY_CHAIN — **EXPLAINS**
  - a prose sentence explaining why an install started from a pipe fails, because stdin is the pipe rather than a terminal — explanatory text inside a troubleshooting entry

- **mods-doc-troubleshooting-cc-setup** line 845 — rule: CMD_INJECTION, SUPPLY_CHAIN — **TEACHES**
  - a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code

- **mods-doc-troubleshooting-cc-setup** line 1049 — rule: CMD_INJECTION, SUPPLY_CHAIN — **TEACHES**
  - a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code

### the permission-bypass flag  (7 sites)

- **mods-doc-automate-actions-with-hooks** line 980 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **WARNS**
  - a prose line stating that a PreToolUse hook can DENY a tool even when the bypass flag is set, so the flag cannot be used to escape policy

- **mods-doc-cc-permissions-modes** line 76 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **TEACHES**
  - a TABLE ROW giving the command line for running fully unattended inside a container, which uses the bypass flag — presented as the recommended way to run unattended

- **mods-doc-channels-reference** line 293 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **WARNS**
  - a prose paragraph about a session pausing on a permission prompt; the bypass flag is mentioned for unattended use, with the explicit warning to use it only in environments you trust

- **mods-doc-hooks-reference** line 2033 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **NAMES**
  - a prose sentence stating that a resumed non-interactive run does not restore a stored permission mode, so the mode flag or the bypass flag must be passed again

- **mods-doc-sessions-reference** line 68 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **NAMES**
  - a prose bullet describing which permission mode applies when resuming from a terminal, and that the mode flag or the bypass flag can be passed to override the restored mode

- **mods-doc-sessions-reference** line 79 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **NAMES**
  - a prose bullet describing which permission mode applies when resuming from a terminal, and that the mode flag or the bypass flag can be passed to override the restored mode

- **mods-doc-sessions-reference** line 83 — rule: CLAUDE_CLI_PERMISSION_BYPASS — **NAMES**
  - a prose bullet describing which permission mode applies to the in-session conversation switch, and noting that a conversation that ended in plan mode resumes in plan mode even if the run was launched with the bypass flag

### the superuser examples  (7 sites)

- **mods-doc-troubleshooting-cc-setup** line 390 — rule: PRIVILEGE_ESC — **TEACHES**
  - a fenced shell sample creating the local binary directory with superuser privileges — a remedy for a permissions problem the reader hit

- **mods-doc-troubleshooting-cc-setup** line 391 — rule: PRIVILEGE_ESC — **TEACHES**
  - a fenced shell sample transferring ownership of the local directory to the current user with superuser privileges — a remedy for a permissions problem the reader hit

- **mods-doc-troubleshooting-cc-setup** line 528 — rule: PRIVILEGE_ESC — **TEACHES**
  - a prose bullet on taking ownership of a file owned by another user, which requires administrator rights — a remedy for a permissions problem the reader hit

- **mods-doc-troubleshooting-cc-setup** line 788 — rule: PRIVILEGE_ESC — **TEACHES**
  - a fenced shell sample allocating a swap file with superuser privileges — a remedy for a permissions problem the reader hit

- **mods-doc-troubleshooting-cc-setup** line 789 — rule: PRIVILEGE_ESC — **TEACHES**
  - a fenced shell sample restricting swap-file permissions with superuser privileges — a remedy for a permissions problem the reader hit

- **mods-doc-troubleshooting-cc-setup** line 790 — rule: PRIVILEGE_ESC — **TEACHES**
  - a fenced shell sample marking a swap file with superuser privileges — a remedy for a permissions problem the reader hit

- **mods-doc-troubleshooting-cc-setup** line 791 — rule: PRIVILEGE_ESC — **TEACHES**
  - a fenced shell sample enabling a swap file with superuser privileges — a remedy for a permissions problem the reader hit

### the token-minting command  (4 sites)

- **mods-doc-cc-github-actions** line 94 — rule: CLAUDE_CLI_TOKEN_THEFT — **TEACHES**
  - a prose bullet documenting the OAuth-token environment variable and telling the reader to run the token-minting command to generate one

- **mods-doc-cc-github-actions** line 116 — rule: CLAUDE_CLI_TOKEN_THEFT — **WARNS**
  - a prose sentence advising an API key INSTEAD of an OAuth token for a secret shared across repositories, because the token is tied to one subscriber

- **mods-doc-cc-github-actions** line 381 — rule: CLAUDE_CLI_TOKEN_THEFT — **NAMES**
  - a TABLE ROW listing the OAuth-token variable as an available input and noting how it is generated

- **mods-doc-mcp-servers-reference** line 1181 — rule: CLAUDE_CLI_TOKEN_THEFT — **NAMES**
  - a prose bullet describing what the OAuth-token environment variable holds, linking to the token-minting command's documentation

### not one of the four  (1 sites)

- **mods-doc-native-toolset-reference** line 632 — rule: CMD_INJECTION — **NAMES**
  - a prose sentence explaining that a web-fetch tool is lossy by design, and suggesting a plain network-fetch command run through Bash as the way to get the unprocessed page

## Summary by chapter

| chapter | sites |
|---|---|
| `mods-doc-automate-actions-with-hooks` | 1 |
| `mods-doc-cc-github-actions` | 3 |
| `mods-doc-cc-permissions-modes` | 2 |
| `mods-doc-channels-reference` | 1 |
| `mods-doc-hooks-reference` | 1 |
| `mods-doc-mcp-servers-reference` | 1 |
| `mods-doc-native-toolset-reference` | 1 |
| `mods-doc-sessions-reference` | 3 |
| `mods-doc-troubleshooting-cc-setup` | 17 |
| **total** | **30** |
