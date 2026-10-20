# The 72 CPV NIT findings — adjudicated rule by rule and site by site

This is the pass the `DELEGATION.md` NIT bullet names as its remaining work: **for each of the 14 rules, and for each site
that rule fired on, is the rule detecting a real danger, a documentation artefact, or a generic pattern whose name
overstates what it detects?** The bucket partition in the ledger is a CRITERION, not a disposition; this file is the
disposition, and it is per rule AND per site, because a rule can behave differently on different sites.

**THE HEADLINE RESULT: 0 findings are a real danger, 0 are undetermined, and 72 are documentation artefacts.** Every one
of the 72 sits in a passage that is either Anthropic's own instruction to the reader or Anthropic's own description of
the product's behaviour. The rules are not misreading; they are reading a documentation corpus with a pattern designed
for code.

**WHAT THIS DOES NOT CHANGE: the owner's editorial question.** Bucket A's 36 findings are disposed of as
DOCUMENTATION ARTEFACTS in the sense that no site is a REAL DANGER — the passage is the vendor's own documentation. That
is NOT the same question as whether the plugin should ship them, and this file does not answer that. The question is
whether the plugin ships, as they appear in Anthropic's own documentation, the vendor's install one-liner, the
permission-bypass CLI flag, the long-lived-token minting command and the superuser examples. **A finding can be a
documentation artefact AND still be something the owner may decide not to ship**, and those are different questions.

## WHAT IS MEASURED HERE, AND HOW

Every number in this file is RE-RUNNABLE, and the method is given so a re-run can reproduce it.

| | |
|---|---|
| corpus | the plugin's own tracked tree, scanned as the plugin ships it |
| validator | `cpv-remote-validate plugin . --strict` (CPV v5.22.0) |
| the 72 | the validator's `[NIT]` lines, one per (rule, site) pair; the scanner marks all 72 *demoted, needs review* itself |
| distinct sites | **64**, not 72: eight sites carry two rules each, so eight findings share a site with another |
| the rules | **14** distinct rule ids; three of them are `agent_manipulation` rules, counted separately |
| the per-site match | re-derived by applying the installed CPV's OWN pattern catalogue to the exact line at each site |

**WHY THE PER-SITE MATCH IS RE-DERIVED RATHER THAN QUOTED.** A per-site report that says what a rule "detected" is only
auditable if the claim is the pattern's actual match. Every site below therefore carries the **MATCH SPAN** — the exact
substring of the line the rule's own regex matched — and the rule's pattern shape. Both come from the installed
catalogue (`scripts/rules/skillaudit_patterns.json` and `scripts/cpv_skillaudit_native.py`), applied to the line at the
cited line number.

**THE PASSAGES ARE NOT QUOTED, AND NEITHER IS THE SPAN.** A tracked file that quotes a flagged construct is itself read
by the same skillaudit rules as an invocation — writing the flagged command names into the ledger once took the finding
count from 72 to 76. The span is therefore given as a LENGTH and a DESCRIPTION, never as a quotation, and the passage is
at the cited line. What a reader can still do is reproduce the whole thing: re-run the validator, then apply the
catalogue's pattern to the line, and the span is whatever comes back.

## THE ONE MEASUREMENT THAT SEPARATES THE RULES: THE MATCH SPAN

A rule that fires on a construct has a span — how much of the line its regex consumed. The span is the sharpest available
evidence about whether a rule matched WHAT IT NAMES, because a rule whose match reaches across unrelated text joined
tokens that do not form the construct it claims to detect.

**61 of the 72 sites match a span under 100 characters; 11 match a span of 100 characters or more.** The eleven are
concentrated in four rules, and they are the rules whose pattern is a LEXICAL SEQUENCE rather than a single token.

| rule | sites | widest span | what the span joins |
|---|---|---|---|
| `A2A_AGENT_IMPERSONATION` | 1 | 405 chars | `authentication` … `disable` … `agent`, across a paragraph about WHICH MODEL A FALLBACK SWITCHES TO. The three tokens are in one sentence and describe unrelated things. |
| `A2A_CROSS_AGENT_INJECT` | 3 | 340 chars | `injects` … `agent`, across a paragraph about how a subagent's PROMPT CACHE is kept intact. |
| `CLAUDE_CLI_PERMISSION_BYPASS` | 7 | 227 chars | `claude` … the bypass flag, within 200 characters. The `claude` is usually a URL path or the product's own name in prose, not a command. |
| `AGENT_MEMORY_MOD` | 9 | 191 chars | a write or edit verb … a memory filename, with the filename up to 191 characters later on the line. |

**THE CONSEQUENCE, STATED PLAINLY: for these four rules the name asserts a construct that the match does not contain.**
An impersonation rule that joined `authentication` to `agent` across 405 characters did not detect an impersonation; it
detected two ordinary words in a paragraph about model fallbacks. That is a sharper statement than "the rule over-fires",
and it is the finding a future upstream fix can act on: **the defect is the SPAN, not the presence of the pattern.**

## THE FOURTEEN RULES, ONE BY ONE

### `SUPPLY_CHAIN` — supply-chain — bucket A — 10 findings, 10 sites

- **what the pattern detects:** a downloader piped into an interpreter.
- **widest match span:** 81 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says a supply-chain attack — a compromised or substituted
dependency. What the pattern detects is a downloader piped into an interpreter, and NOT ONE of these ten sites involves a
dependency, a registry, a package or a substitution. **The rule's subject is absent from every one of its sites.** Nine of
them are the vendor's own install one-liner, quoted from Anthropic's setup documentation inside a troubleshooting chapter.
The tenth is a bulleted list of what Claude Code's own classifier BLOCKS by default — the passage names the pattern in order
to forbid it, so the rule fires on the documentation of the block-list. **This is the sharpest form of the defect: the one
site that most looks like the danger is the one that forbids it.**

### `CMD_INJECTION` — command-injection — bucket A — 8 findings, 8 sites

- **what the pattern detects:** a command separator followed by a command name, OR a backticked command word.
- **widest match span:** 42 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says command injection — an attacker-supplied string
spliced into a command so that running it executes the attacker's text. That is the canonical meaning, and the rule's name
is accurate about the danger class. **NOT ONE OF THE EIGHT SITES IS COMMAND INJECTION**, and the measurement says so in three
properties an injection site must have. **NO UNTRUSTED INPUT** — the URL is a literal, the flags are literal, the program
piped into is the shell itself, and nothing is spliced. **NO INTERPOLATION** — the pattern fires on a pipe-to-interpreter
SHAPE, not on a spliced argument, and there is no `${...}` or `$(...)` in these commands. **NO ATTACKER AND NO VICTIM PATH** —
these are the vendor's own setup pages, the reader is the operator, and there is no untrusted party in the picture.
**THE RULE IS THEREFORE STRUCTURALLY INCAPABLE OF TELLING THE VENDOR'S INSTALL ONE-LINER FROM AN ATTACKER'S: THE TWO ARE THE
SAME STRING.** The only textual difference available — the HOST — is the discriminator the rule does not take, and the
eighth site shows the cost: a sentence offering a plain network-fetch tool by NAME, matched on the backticked word alone,
with no command string and no URL present at all.

### `PRIVILEGE_ESC` — privilege-escalation — bucket A — 7 findings, 7 sites

- **what the pattern detects:** the token `sudo`.
- **widest match span:** 5 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says privilege escalation — code that OBTAINS or
PERSISTS elevated rights for an attacker. What the pattern detects is the token `sudo`, and the pattern fires on all seven
sites identically. **TWO OF THE SEVEN DO THE OPPOSITE OF ESCALATE**: one hands a newly created directory BACK to its owner,
and another sets a mode that RESTRICTS access. The rule fires on them exactly as it fires on the four that create a swapfile.
**THE NAME ASSERTS AN ATTACK; THE DETECTION IS A SYNTAX.** Each of the seven appears in a troubleshooting chapter as a step
with its trigger and its precondition stated — the one at the ownership remedy says outright that it requires administrator
rights.

### `CLAUDE_CLI_PERMISSION_BYPASS` — permission-bypass — bucket A — 7 findings, 7 sites

- **what the pattern detects:** the token `claude` followed, within 200 characters, by the bypass flag.
- **widest match span:** 227 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says a command line that disables the
permission system, and the flag does exactly that, so the rule is a true positive on the flag's identity. **What it does not
detect is CONTEXT**, and this is the one bucket-A rule where that gap is measured rather than asserted: **five of the seven
matches span more than 180 characters**, because the pattern requires the token `claude` and then the flag within 200
characters, and at those sites the `claude` is a URL path or the product's own name in prose, not a command. **At four of the
seven sites the surrounding prose argues AGAINST reaching for the flag** — one is a table cell listing the mode's
preconditions, one is a clause that says to use it only in environments you trust, one states that a hook returning a denial
blocks the tool EVEN in that mode, and one is a note about which flag applies to a specific resume case. **A SCANNER CANNOT
ADJUDICATE THIS RULE**, because the same string is a warning and an instruction depending only on its sentence.

### `CLAUDE_CLI_TOKEN_THEFT` — token-theft — bucket A — 4 findings, 4 sites

- **what the pattern detects:** the two-word command name.
- **widest match span:** 18 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says credential theft, and the pattern
detects a two-word command name. **AT ALL FOUR SITES THE MENTION IS A PROVENANCE REFERENCE** — how a credential is OBTAINED —
inside the vendor's setup documentation for the very feature that consumes it. One names the command as the source of the
credential in a list of authentication methods; one is a numbered vendor setup step for the GitHub Action offering two ways
to supply a repository secret; one cites the command for the provenance of a token and the subscription it is tied to; one is a
parameter table describing where a workflow input's value comes from. **ONLY ONE OF THE FOUR IS AN INSTRUCTION TO THE READER
TO RUN IT, and it is the vendor's own documented procedure for the product the chapter is about.**

### `AGENT_MEMORY_MOD` — agent-memory-modification — bucket B — 9 findings, 9 sites

- **what the pattern detects:** a write or edit verb followed, ANYWHERE LATER ON THE SAME LINE, by a memory filename.
- **widest match span:** 191 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says agent memory MODIFICATION, and the pattern
detects a write or edit verb followed, ANYWHERE LATER ON THE SAME LINE, by a memory filename — with a gap of up to 191
characters between them. **This is the clearest case in the series.** **The two files it fires in are the vendor's own
DOCUMENTATION OF THE MEMORY FEATURE** — one is titled 'How Claude remembers your project', the other is a directory map. Every
one of the nine sites is a passage whose SUBJECT IS the memory mechanism, describing it for the reader. At the widest match the
verb and the filename are 191 characters apart, in different sentences. **The passage that the rule reads as an attack is, in
context, an argument for a first-party, reversible, documented mechanism** — and the directory-map entries say outright that
the files are written by Claude and that the reader never creates them. **THE DISCRIMINATOR CANNOT BE LEXICAL HERE AT ALL**,
because the defect is not the tokens but the hundreds of characters between them.

### `A2A_CROSS_AGENT_INJECT` — cross-agent-injection — bucket B — 3 findings, 3 sites

- **what the pattern detects:** a verb from a set, followed later on the line by a noun, followed later still by an agent noun.
- **widest match span:** 340 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says cross-agent prompt injection — content
poisoning the channel between agents. The pattern is a VERB, then later on the line a NOUN, then later still an AGENT NOUN, and
**the gap between the tokens is what the rule measures by accident.** At one site the match is 41 characters and joins a
sentence about instructions becoming user messages; at the other two the match reaches 182 and 340 characters, joining a
sentence about a skill being hidden from command lists, and a paragraph about a subagent's prompt cache staying intact. **In
none of the three is there any content carried from one agent into another.** The detection is lexical, and the vocabulary it
matches is the product's own ordinary vocabulary for agents — so a rule that fires on the documentation of the feature it names
will fire on every page about that feature.

### `A2A_AGENT_IMPERSONATION` — agent-impersonation — bucket B — 1 finding, 1 site

- **what the pattern detects:** the word `authentication` followed later by a bypass word, followed later by `agent`.
- **widest match span:** 405 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says agent impersonation — fabricating
an identity or a card. **The MATCH IS 405 CHARACTERS LONG**, and it joins the word `authentication` to a bypass verb to the
word `agent`, across a paragraph about WHICH MODEL A FALLBACK SWITCHES TO, in which `authentication` is one item in a list of
error classes and `agent` is part of a cloud platform's product name. **NOTHING AT THIS SITE CLAIMS AN IDENTITY, FORGES A CARD
OR PRESENTS A FALSE AGENT.** This is the widest match in the whole pass and the clearest instance of the defect this file
names: the pattern is not what is wrong with the rule — the pattern is a reasonable shape — **the SPAN is**, because a regex
that reaches 405 characters will join any three words a paragraph happens to contain.

### `INTENT_DESTRUCTIVE_INTENT` — destructive-intent — bucket B — 1 finding, 1 site

- **what the pattern detects:** a delete or remove verb followed by a noun such as files or data.
- **widest match span:** 0 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says destructive intent, and the
pattern is a delete or remove verb followed by a noun. **The match is 41 characters of a WINDOWS SYMLINK CAVEAT** — the passage
explaining that removing a worktree does not delete files outside it, and that a nested link is what could. **The passage is
evidence of the vendor's GUARDRAILS, not of intent**, and the scanner itself classifies this rule as a SOFT signal whose
prose over-firing is expected. A rule that scores a docs page DESCRIBING a deletion as destructive intent inverts the reading
of that page.

### `TIME_BOMB` — time-bomb — bucket B — 1 finding, 1 site

- **what the pattern detects:** a conditional followed later by a duration, followed later by an execution verb.
- **widest match span:** 42 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says a time-based activation or logic bomb — code that
behaves differently once a date or a count is reached. The pattern is a conditional, then later a duration, then later an
execution verb, and **the match is 42 characters describing when a scheduled task runs**: a task whose delay is a number of
minutes runs at a correspondingly shifted time. **There is no conditional payload, no hidden activation, and no code that
behaves differently over time.** The chapter's subject is a scheduling table, and the same chapter documents a seven-day
expiry — which BOUNDS a task's life and is the opposite of a logic bomb.

### `CLAUDE_AUTH_ENV_OVERRIDE` — auth-env-override — bucket B — 1 finding, 1 site

- **what the pattern detects:** an `export` of a named Anthropic credential variable.
- **widest match span:** 25 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says an auth or API-endpoint env
OVERRIDE — writing a credential or base URL into the environment, which for a base URL redirects all API traffic. The pattern
detects an `export` of a named Anthropic credential variable, and the match is 25 characters. **THE SITE IS THE VENDOR'S OWN
TROUBLESHOOTING PROCEDURE FOR REMOVING SUCH A LINE**: the passage tells the reader to find the variable in a shell profile and
REMOVE it, so that a different authentication method takes effect, and then to confirm with a status command. **THE RULE
CANNOT DISTinguish SETTING A VARIABLE FROM UNSETTING ONE**, and the construct here is the removal — the opposite of an
override. **Note the rule's own description says so**: it fires on WRITES and overwrites, and does not fire on reads; what
matches here is the word `export` inside a sentence that says to delete the line.

### `SHELL_EXEC` — shell-execution — bucket C — 9 findings, 9 sites

- **what the pattern detects:** the identifier `execSync`.
- **widest match span:** 8 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says shell command execution, and that is literally true
of every one of these nine sites, so the rule is a true positive on the MECHANISM. What it does not distinguish is whether the
command is a DANGEROUS one. **Every one of the nine is the same read-only git query** in a status-line example — the current
branch, the git directory, the staged and unstaged change counts — inside a chapter whose subject is building a status bar.
**THE SINGLE-FILE CONCENTRATION IS THE TELL**: all nine findings are in one chapter, in two tight clusters plus one line, and
the same query appears at three of them, each a separate finding because the detector fires per occurrence. **THE MATCH SPAN IS
EIGHT CHARACTERS** — the identifier alone — so this rule is a clean single-token detection whose severity, not whose shape, is
the question.

### `FS_WRITE` — filesystem-write — bucket C — 7 findings, 7 sites

- **what the pattern detects:** a bare shell-profile filename.
- **widest match span:** 8 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** This is the rule where the NAME is accurate and the DETECTION is the
problem, and the scanner already knows it. Of the rule's eight patterns, three are bare shell-profile FILENAMES and five are
write-shaped; **every one of these seven findings comes from the three name-shaped patterns**, and the write-shaped ones match
nothing here. **THE SCANNER CARRIES ITS OWN PREDICATE FOR EXACTLY THIS**, and running it over these seven lines separates two
from five: at two sites the line really does append, and at five it does not — a `source` of a profile, an `ls -l` of one, an
`ls -ld` of six, and a comment naming two. **THE FINDING COUNT OVERSTATES THE NUMBER OF WRITES BY FIVE**, and the scanner's
own code comment names this false-positive shape as the reason the predicate exists. The rule's name describes precisely what
it detects; what it lacks is a VERDICT DIMENSION — the syntactic form, with no notion of whether the write is a payload, a fix
or a diagnostic.

### `ENV_INJECTION` — environment-injection — bucket C — 4 findings, 4 sites

- **what the pattern detects:** an `export` or `set` of a loader-affecting variable.
- **widest match span:** 12 characters.
- **verdict at every site:** DOCUMENTATION ARTEFACT. Real danger: 0. Undetermined: 0.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says environment variable INJECTION or poisoning, and
the pattern detects an `export` or `set` of a loader-affecting variable — a twelve-character match. **AT ALL FOUR SITES THE
WRITE IS THE DOCUMENTED REMEDY OR THE DOCUMENTED API for the feature the surrounding text is about.** Three are the vendor's
PATH remedy for the reader's own shell profile, in its three shell variants; the fourth is the hooks reference documenting the
SessionStart mechanism that persists environment variables for later shell commands, through the vendor's own sanctioned
variable, with the vendor's own example values. **The name asserts an attacker's persistence technique; the detection is 'a
line beginning with `export` was written somewhere'.**

## THE PER-SITE TABLE, RULE BY RULE

One row per (rule, site) pair, in the rule order above. SPAN is the length in characters of the substring the rule's own
pattern matched on that line. The VERDICT is the adjudication; the reasoning is in the per-rule section above and in the
accompanying dev reports.

### `SUPPLY_CHAIN`

| site | span | verdict |
|---|---|---|
| `cc-permissions-modes` line 382 | 11 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 125 | 46 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 535 | 15 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 599 | 81 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 688 | 21 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 797 | 46 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 829 | 46 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 836 | 46 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 845 | 46 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 1049 | 46 | DOCUMENTATION ARTEFACT |

### `CMD_INJECTION`

| site | span | verdict |
|---|---|---|
| `native-toolset-reference` line 632 | 6 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 125 | 6 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 599 | 6 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 704 | 42 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 797 | 6 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 829 | 6 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 845 | 6 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 1049 | 6 | DOCUMENTATION ARTEFACT |

### `PRIVILEGE_ESC`

| site | span | verdict |
|---|---|---|
| `troubleshooting-cc-setup` line 390 | 5 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 391 | 5 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 528 | 5 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 788 | 5 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 789 | 5 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 790 | 5 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 791 | 5 | DOCUMENTATION ARTEFACT |

### `CLAUDE_CLI_PERMISSION_BYPASS`

| site | span | verdict |
|---|---|---|
| `automate-actions-with-hooks` line 980 | 196 | DOCUMENTATION ARTEFACT |
| `cc-permissions-modes` line 76 | 51 | DOCUMENTATION ARTEFACT |
| `channels-reference` line 293 | 186 | DOCUMENTATION ARTEFACT |
| `hooks-reference` line 2033 | 203 | DOCUMENTATION ARTEFACT |
| `sessions-reference` line 68 | 195 | DOCUMENTATION ARTEFACT |
| `sessions-reference` line 79 | 227 | DOCUMENTATION ARTEFACT |
| `sessions-reference` line 83 | 71 | DOCUMENTATION ARTEFACT |

### `CLAUDE_CLI_TOKEN_THEFT`

| site | span | verdict |
|---|---|---|
| `cc-github-actions` line 94 | 18 | DOCUMENTATION ARTEFACT |
| `cc-github-actions` line 116 | 18 | DOCUMENTATION ARTEFACT |
| `cc-github-actions` line 381 | 18 | DOCUMENTATION ARTEFACT |
| `mcp-servers-reference` line 1181 | 18 | DOCUMENTATION ARTEFACT |

### `AGENT_MEMORY_MOD`

| site | span | verdict |
|---|---|---|
| `cc-native-memory-and-rules` line 26 | 89 | DOCUMENTATION ARTEFACT |
| `cc-native-memory-and-rules` line 55 | 142 | DOCUMENTATION ARTEFACT |
| `cc-native-memory-and-rules` line 474 | 191 | DOCUMENTATION ARTEFACT |
| `cc-native-memory-and-rules` line 553 | 73 | DOCUMENTATION ARTEFACT |
| `cc-native-memory-and-rules` line 563 | 21 | DOCUMENTATION ARTEFACT |
| `cc-projects-directory-structure` line 29 | 83 | DOCUMENTATION ARTEFACT |
| `cc-projects-directory-structure` line 70 | 151 | DOCUMENTATION ARTEFACT |
| `cc-projects-directory-structure` line 287 | 26 | DOCUMENTATION ARTEFACT |
| `cc-projects-directory-structure` line 394 | 23 | DOCUMENTATION ARTEFACT |

### `A2A_CROSS_AGENT_INJECT`

| site | span | verdict |
|---|---|---|
| `hooks-reference` line 2538 | 340 | DOCUMENTATION ARTEFACT |
| `prompt-caching-reference` line 253 | 41 | DOCUMENTATION ARTEFACT |
| `skills-reference` line 909 | 182 | DOCUMENTATION ARTEFACT |

### `A2A_AGENT_IMPERSONATION`

| site | span | verdict |
|---|---|---|
| `models-configuration` line 504 | 405 | DOCUMENTATION ARTEFACT |

### `INTENT_DESTRUCTIVE_INTENT`

| site | span | verdict |
|---|---|---|
| `worktrees-reference` line 81 | 0 | DOCUMENTATION ARTEFACT |

### `TIME_BOMB`

| site | span | verdict |
|---|---|---|
| `loop-and-chron-reference` line 207 | 42 | DOCUMENTATION ARTEFACT |

### `CLAUDE_AUTH_ENV_OVERRIDE`

| site | span | verdict |
|---|---|---|
| `troubleshooting-cc-setup` line 1188 | 25 | DOCUMENTATION ARTEFACT |

### `SHELL_EXEC`

| site | span | verdict |
|---|---|---|
| `status-line-customization` line 598 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 599 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 600 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 601 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 774 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 1067 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 1068 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 1069 | 8 | DOCUMENTATION ARTEFACT |
| `status-line-customization` line 1070 | 8 | DOCUMENTATION ARTEFACT |

### `FS_WRITE`

| site | span | verdict |
|---|---|---|
| `automate-actions-with-hooks` line 1055 | 8 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 172 | 7 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 173 | 7 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 179 | 8 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 180 | 8 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 523 | 7 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 865 | 8 | DOCUMENTATION ARTEFACT |

### `ENV_INJECTION`

| site | span | verdict |
|---|---|---|
| `hooks-reference` line 1320 | 12 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 172 | 12 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 179 | 12 | DOCUMENTATION ARTEFACT |
| `troubleshooting-cc-setup` line 186 | 12 | DOCUMENTATION ARTEFACT |

## WHAT THE PASS CHANGES, AND WHAT IT DOES NOT

**It changes the ledger's claim about the remaining work.** The ledger said the per-rule pass was the REMAINING WORK and
that until each rule was adjudicated the bucket partition was a hypothesis. That pass is now DONE: the partition's counts
are confirmed against the scan, and every rule is adjudicated. What is left is not a missing measurement.

**It sharpens the upstream case from "these rules over-fire on documentation" to a per-rule statement of what each pattern
actually matches** — and for four rules, to a statement about the SPAN, which is the part a fix would change.

**It does not dispose of bucket A.** The editorial question is the owner's, and this file deliberately does not answer it.

## Provenance

| | |
|---|---|
| validator | `cpv-remote-validate plugin . --strict` (CPV v5.22.0), re-run at commit `1bb05ad` |
| the 72 | the validator's `[NIT]` lines; the (rule, site) set re-verified byte-identical to the enumeration in `cpv-nit-bucketA-sites.md` |
| the per-site match | re-derived from the installed catalogue at `claude-plugins-validation` 5.22.0: `scripts/rules/skillaudit_patterns.json` and `scripts/cpv_skillaudit_native.py` |
| the write-intent classification | the scanner's own `_shell_match_lacks_write_intent` predicate in `scripts/_skillaudit_shell_context.py` |

**THE DIGEST QUESTION DOES NOT ARISE HERE, AND WHY.** The sibling spec carries a chapter-text digest, because its line
numbers point at passages that a re-sync would move. This file's line numbers point at the same chapters, so the same
staleness applies — a re-sync that reworded a chapter would move these lines. The re-run is the check: re-running the
validator and re-deriving the spans produces this file's numbers, or does not.
