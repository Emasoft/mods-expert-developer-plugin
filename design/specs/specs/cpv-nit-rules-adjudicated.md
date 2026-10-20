# The 72 CPV NIT findings — adjudicated rule by rule and site by site

This is the pass the `DELEGATION.md` NIT bullet names as its remaining work: **for each of the 14 rules, and for each site
that rule fired on, is the rule detecting a real danger, a documentation artefact, or a generic pattern whose name
overstates what it detects?** The bucket partition in the ledger is a CRITERION, not a disposition; this file is the
disposition, and it is per rule AND per site, because a rule can behave differently on different sites.

**THE HEADLINE, STATED AS WHAT WAS OBSERVED AND NOT AS A VERDICT: every one of the 72 sites is a passage of Anthropic's own
documentation** — the vendor's own instruction to the reader, the vendor's own description of the product's behaviour, a
code sample the reader is shown, or a passage that names a construct in order to forbid it. **NO SITE IS EXECUTED BY THE
PLUGIN: the 72 findings are all on preserved chapter text, and the plugin's own shipped code is not what they point at.** The
rules are not misreading; they are reading a documentation corpus with a pattern designed for code.

**THIS FILE DOES NOT SET SEVERITY, AND IT DOES NOT DISPOSE OF BUCKET A.** Whether a given passage should be shipped in this
plugin is the OWNER's question; the corpus fact — that the passage is the vendor's own documentation — is a measured fact
about the corpus, and it is all this file claims. The editorial question stands exactly as it did: whether the plugin ships,
as they appear in Anthropic's own documentation, the vendor's install one-liner, the permission-bypass CLI flag, the
long-lived-token minting command and the superuser examples. **A passage can be the vendor's own documentation AND still
be something the owner decides not to ship**, and those are different questions.

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
| the passage column | read from the passage at the cited line; for the 36 bucket-A sites it is the STANCE the sibling spec already adjudicated |

**WHY THE PER-SITE MATCH IS RE-DERIVED RATHER THAN QUOTED.** A per-site report that says what a rule "detected" is only
auditable if the claim is the pattern's actual match. Every site below therefore carries the **RAW SPAN** — the exact
substring of the line the rule's own regex matched — and the **TOKEN GAP**, and the rule's pattern shape. All three come
from the installed catalogue (`scripts/rules/skillaudit_patterns.json` and `scripts/cpv_skillaudit_native.py`), applied to
the line at the cited line number.

**THE PASSAGES ARE NOT QUOTED, AND NEITHER ARE THE SPANS.** A tracked file that quotes a flagged construct is itself read
by the same skillaudit rules as an invocation — writing the flagged command names into the ledger once took the finding
count from 72 to 76. The span is therefore given as a LENGTH and a DESCRIPTION, never as a quotation, and the passage is
at the cited line. What a reader can still do is reproduce the whole thing: re-run the validator, then apply the
catalogue's pattern to the line, and the span is whatever comes back.

## THE ONE MEASUREMENT THAT SEPARATES THE RULES: THE TOKEN GAP

A rule that fires on a construct matches some tokens. The **TOKEN GAP** is how many characters lie between the pattern's
first trigger token and its last. The gap is the sharpest available evidence about whether a rule matched WHAT IT NAMES,
because a rule whose match reaches across unrelated text joined tokens that do not form the construct it claims to detect.

**THE GAP, NOT THE RAW SPAN, IS THE LOAD-BEARING MEASURE, AND THE DISTINCTION MATTERS.** The raw span is a property of the
line AS IT CURRENTLY STANDS: 139 of the 405 characters in the widest raw span are markdown link-target URL text, so a
re-wrap of the vendored chapter — which a re-sync does — moves the raw span without the pattern matching anything
different. The gap does not move: re-wrapping a paragraph does not change how many characters lie between the two words the
pattern joins. **WHAT FOLLOWS IS THEREFORE STATED ON THE GAP.**

**36 of the 72 sites have a token gap greater than zero, and 9 have a gap of 100 characters or more.** Those nine are
concentrated in four rules, and they are the rules whose pattern is a LEXICAL SEQUENCE rather than a single token. The other
eight rules match a single token or a single adjacent pair, so their gap is zero by construction.

| rule | sites | widest gap | what the pattern joins across it |
|---|---|---|---|
| `A2A_AGENT_IMPERSONATION` | 1 | 345 chars | its first trigger word to its last, across a paragraph about WHICH MODEL A FALLBACK SWITCHES TO. The words are in one sentence and describe unrelated things. |
| `CLAUDE_CLI_PERMISSION_BYPASS` | 7 | 191 chars | the product's own name to the flag, the pattern allowing 200 characters between them. The first is usually a URL path or the product's name in prose, not a command. |
| `AGENT_MEMORY_MOD` | 9 | 176 chars | a write or edit verb to a memory filename, the filename up to 176 characters later on the line. |
| `A2A_CROSS_AGENT_INJECT` | 3 | 175 chars | its verb to its agent noun, across a paragraph about how a subagent's PROMPT CACHE is kept intact. |

**THE CONSEQUENCE, STATED PLAINLY: for these four rules the name asserts a construct that the match does not contain.**
An impersonation rule that joined its first trigger word to its last across 345 characters did not detect an impersonation;
it detected two ordinary words in a paragraph about model fallbacks. That is a sharper statement than "the rule
over-fires", and it is the finding a future upstream fix can act on: **the defect is the GAP, not the presence of the
pattern.**

## THE FOURTEEN RULES, ONE BY ONE

### `SUPPLY_CHAIN` — supply-chain — bucket A — 10 findings, 10 sites

- **what the pattern detects:** a downloader piped into an interpreter.
- **widest token gap:** 68 characters.
- **widest raw span:** 81 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says a supply-chain attack — a compromised or substituted
dependency. What the pattern detects is a downloader piped into an interpreter, and NOT ONE of these ten sites involves a
dependency, a registry, a package or a substitution. **The rule's subject is absent from every one of its sites.** Nine of
them are the vendor's own install one-liner, quoted from Anthropic's setup documentation inside a troubleshooting chapter.
The tenth is a bulleted list of what Claude Code's own classifier BLOCKS by default — the passage names the pattern in order
to forbid it, so the rule fires on the documentation of the block-list. **This is the sharpest form of the defect: the one
site that most looks like the danger is the one that forbids it.**

### `CMD_INJECTION` — command-injection — bucket A — 8 findings, 8 sites

- **what the pattern detects:** a command separator followed by a command name, OR a backticked command word.
- **widest token gap:** 0 characters.
- **widest raw span:** 42 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

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
- **widest token gap:** 0 characters.
- **widest raw span:** 5 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says privilege escalation — code that OBTAINS or
PERSISTS elevated rights for an attacker. What the pattern detects is the token `sudo`, and the pattern fires on all seven
sites identically. **TWO OF THE SEVEN DO THE OPPOSITE OF ESCALATE**: one hands a newly created directory BACK to its owner,
and another sets a mode that RESTRICTS access. The rule fires on them exactly as it fires on the four that create a swapfile.
**THE NAME ASSERTS AN ATTACK; THE DETECTION IS A SYNTAX.** Each of the seven appears in a troubleshooting chapter as a step
with its trigger and its precondition stated — the one at the ownership remedy says outright that it requires administrator
rights.

### `CLAUDE_CLI_PERMISSION_BYPASS` — permission-bypass — bucket A — 7 findings, 7 sites

- **what the pattern detects:** the token `claude` followed, within 200 characters, by the bypass flag.
- **widest token gap:** 191 characters.
- **widest raw span:** 227 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says a command line that disables the
permission system, and the flag does exactly that, so the rule is a true positive on the flag's identity. **What it does not
detect is CONTEXT**, and this is the one bucket-A rule where that gap is measured rather than asserted: **five of the seven
matches have a token gap above 150 characters**, because the pattern requires one token and then the flag within 200
characters, and at those sites the first token is a URL path or the product's own name in prose, not a command. **At four of
the seven sites the surrounding prose argues AGAINST reaching for the flag** — one is a table cell listing the mode's
preconditions, one is a clause that says to use it only in environments you trust, one states that a hook returning a denial
blocks the tool EVEN in that mode, and one is a note about which flag applies to a specific resume case. **A SCANNER CANNOT
ADJUDICATE THIS RULE**, because the same string is a warning and an instruction depending only on its sentence.

### `CLAUDE_CLI_TOKEN_THEFT` — token-theft — bucket A — 4 findings, 4 sites

- **what the pattern detects:** the two-word command name.
- **widest token gap:** 0 characters.
- **widest raw span:** 18 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says credential theft, and the pattern
detects a two-word command name. **AT ALL FOUR SITES THE MENTION IS A PROVENANCE REFERENCE** — how a credential is OBTAINED —
inside the vendor's setup documentation for the very feature that consumes it. One names the command as the source of the
credential in a list of authentication methods; one is a numbered vendor setup step for the GitHub Action offering two ways
to supply a repository secret; one cites the command for the provenance of a token and the subscription it is tied to; one is a
parameter table describing where a workflow input's value comes from. **ONLY ONE OF THE FOUR IS AN INSTRUCTION TO THE READER
TO RUN IT, and it is the vendor's own documented procedure for the product the chapter is about.**

### `AGENT_MEMORY_MOD` — agent-memory-modification — bucket B — 9 findings, 9 sites

- **what the pattern detects:** a write or edit verb followed, ANYWHERE LATER ON THE SAME LINE, by a memory filename.
- **widest token gap:** 176 characters.
- **widest raw span:** 191 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says agent memory MODIFICATION, and the pattern
detects a write or edit verb followed, ANYWHERE LATER ON THE SAME LINE, by a memory filename — with a gap of up to 176
characters between them. **This is the clearest case in the series.** **The two files it fires in are the vendor's own
DOCUMENTATION OF THE MEMORY FEATURE** — one is titled 'How Claude remembers your project', the other is a directory map. Every
one of the nine sites is a passage whose SUBJECT IS the memory mechanism, describing it for the reader. **The passage that the
rule reads as an attack is, in context, an argument for a first-party, reversible, documented mechanism** — and the
directory-map entries say outright that the files are written by Claude and that the reader never creates them. **THE
DISCRIMINATOR CANNOT BE LEXICAL HERE AT ALL**, because the defect is not the tokens but the characters between them.

### `A2A_CROSS_AGENT_INJECT` — cross-agent-injection — bucket B — 3 findings, 3 sites

- **what the pattern detects:** a verb from a set, followed later on the line by a noun, followed later still by an agent noun.
- **widest token gap:** 175 characters.
- **widest raw span:** 340 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says cross-agent prompt injection — content
poisoning the channel between agents. The pattern is a VERB, then later on the line a NOUN, then later still an AGENT NOUN, and
**the gap between the tokens is what the rule measures by accident.** At one site the match is 41 characters and joins a
sentence about instructions becoming user messages; at the other two the match reaches 182 and 340 characters, joining a
sentence about a skill being hidden from command lists, and a paragraph about a subagent's prompt cache staying intact. **In
none of the three is there any content carried from one agent into another.** The detection is lexical, and the vocabulary it
matches is the product's own ordinary vocabulary for agents — so a rule that fires on the documentation of the feature it names
will fire on every page about that feature.

### `A2A_AGENT_IMPERSONATION` — bucket B — 1 finding, 1 site

- **what the pattern detects:** a credential word, then a word meaning to skip, then the word for an agent, in that order on one line.
- **widest token gap:** 345 characters.
- **widest raw span:** 405 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says agent impersonation — fabricating
an identity or a card. **THE WIDEST TOKEN GAP IN THE WHOLE PASS IS 345 CHARACTERS**, and it joins the rule's first trigger word
to its last, across a paragraph about WHICH MODEL A FALLBACK SWITCHES TO, where the first word is one item in a list of error
classes and the last is part of a cloud platform's product name. **NOTHING AT THIS SITE CLAIMS AN IDENTITY, FORGES A CARD OR
PRESENTS A FALSE AGENT.** This is the clearest instance of the defect this file names: the pattern is not what is wrong with the
rule — the pattern is a reasonable shape — **the GAP is**, because a regex that reaches hundreds of characters will join any
three words a paragraph happens to contain.

### `INTENT_DESTRUCTIVE_INTENT` — destructive-intent — bucket B — 1 findings, 1 sites

- **what the pattern detects:** a delete or remove verb followed by a noun such as files or data.
- **widest token gap:** -1 characters (the pattern matches a single adjacent pair, so there is no gap).
- **widest raw span:** 0 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says destructive intent, and the
pattern is a delete or remove verb followed by a noun. **The match is 12 characters of a WINDOWS SYMLINK CAVEAT** — the passage
explaining that removing a worktree does not remove anything outside it, and that a nested link is what could. **The passage is
evidence of the vendor's GUARDRAILS, not of intent**, and the scanner itself classifies this rule as a SOFT signal whose
prose over-firing is expected. A rule that scores a docs page DESCRIBING a deletion as destructive intent inverts the reading
of that page.

### `TIME_BOMB` — time-bomb — bucket B — 1 findings, 1 sites

- **what the pattern detects:** a conditional followed later by a duration, followed later by an execution verb.
- **widest token gap:** 37 characters.
- **widest raw span:** 42 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says a time-based activation or logic bomb — code that
behaves differently once a date or a count is reached. The pattern is a conditional, then later a duration, then later an
execution verb, and **the match is 42 characters describing when a scheduled task runs**: a task whose delay is a number of
minutes runs at a correspondingly shifted time. **There is no conditional payload, no hidden activation, and no code that
behaves differently over time.** The chapter's subject is a scheduling table, and the same chapter documents a seven-day
expiry — which BOUNDS a task's life and is the opposite of a logic bomb.

### `CLAUDE_AUTH_ENV_OVERRIDE` — auth-env-override — bucket B — 1 findings, 1 sites

- **what the pattern detects:** an `export` of a named Anthropic credential variable.
- **widest token gap:** 1 characters.
- **widest raw span:** 25 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says an auth or API-endpoint env
OVERRIDE — writing a credential or base URL into the environment, which for a base URL redirects all API traffic. The pattern
detects an `export` of a named Anthropic credential variable, and the match is 25 characters. **THE SITE IS THE VENDOR'S OWN
TROUBLESHOOTING PROCEDURE FOR REMOVING SUCH A LINE**: the passage tells the reader to find the variable in a shell profile and
REMOVE it, so that a different authentication method takes effect, and then to confirm with a status command. **THE RULE CANNOT
DISTINGUISH SETTING A VARIABLE FROM UNSETTING ONE**, and the construct here is the removal — the opposite of an override. **Note
the rule's own description says so**: it fires on WRITES and overwrites, and does not fire on reads; what matches here is the
word `export` inside a sentence that says to delete the line.

### `SHELL_EXEC` — shell-execution — bucket C — 9 findings, 9 sites

- **what the pattern detects:** one Node child-process call identifier.
- **widest token gap:** 0 characters.
- **widest raw span:** 8 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says shell command execution, and that is literally true
of every one of these nine sites, so the rule is a true positive on the MECHANISM. What it does not distinguish is whether the
command is a DANGEROUS one. **Every one of the nine is the same read-only git query** in a status-line example — the current
branch, the git directory, the staged and unstaged change counts — inside a chapter whose subject is building a status bar.
**THE SINGLE-FILE CONCENTRATION IS THE TELL**: all nine findings are in one chapter, in two tight clusters plus one line, and
the same query appears at three of them, each a separate finding because the detector fires per occurrence. **The token gap
is ZERO at every one of the nine** — the pattern matches a single identifier — so this rule is a clean single-token detection
whose severity, not whose shape, is the question.

### `FS_WRITE` — filesystem-write — bucket C — 7 findings, 7 sites

- **what the pattern detects:** a bare shell-profile filename.
- **widest token gap:** 0 characters.
- **widest raw span:** 8 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** This is the rule where the NAME is accurate and the DETECTION is the
problem, and the scanner already knows it. Of the rule's eight patterns, three are bare shell-profile FILENAMES and five are
write-shaped; **every one of these seven findings comes from the three name-shaped patterns**, and the write-shaped ones match
nothing here. **THE SCANNER CARRIES ITS OWN PREDICATE FOR EXACTLY THIS**, and running it over these seven lines separates two
from five: at two sites the line really does append, and at five it does not — a read of one profile, a listing of one profile, a
listing of six paths, and a comment naming two. **THE FINDING COUNT OVERSTATES THE NUMBER OF WRITES BY FIVE**, and the scanner's
own code comment names this false-positive shape as the reason the predicate exists. The rule's name describes precisely what
it detects; what it lacks is a VERDICT DIMENSION — the syntactic form, with no notion of whether the write is a payload, a fix
or a diagnostic.

### `ENV_INJECTION` — environment-injection — bucket C — 4 findings, 4 sites

- **what the pattern detects:** an `export` or `set` of a loader-affecting variable.
- **widest token gap:** 1 characters.
- **widest raw span:** 12 characters, of the line as it currently stands.
- **what was observed at every site:** the passage is the vendor's own documentation. No site is executed by the plugin.

**WHAT THE NAME IMPLIES vs WHAT IT DETECTS.** The name says environment variable INJECTION or poisoning, and
the pattern detects an `export` or `set` of a loader-affecting variable — a twelve-character match with a token gap of one.
**AT ALL FOUR SITES THE WRITE IS THE DOCUMENTED REMEDY OR THE DOCUMENTED API for the feature the surrounding text is about.**
Three are the vendor's PATH remedy for the reader's own shell profile, in its three shell variants; the fourth is the hooks
reference documenting the SessionStart mechanism that persists environment variables for later shell commands, through the
vendor's own sanctioned variable, with the vendor's own example values. **The name asserts an attacker's persistence
technique; the detection is 'a line beginning with `export` was written somewhere'.**

## THE PER-SITE TABLE, RULE BY RULE

One row per (rule, site) pair, in the rule order above. **RAW SPAN** is the length in characters of the substring the rule's
own pattern matched on that line, as the line currently stands; **GAP** is the number of characters between the pattern's
first trigger token and its last, which is the measure that survives a re-wrap. **WHAT THE PASSAGE IS** is the observed kind
of passage: the sibling spec's own four stances where it has already adjudicated the site (TEACHES, NAMES, WARNS, EXPLAINS),
plus SAMPLE for a fenced code sample the reader is shown and DESCRIBES for a passage stating the product's own behaviour.
The column reports WHAT WAS OBSERVED, not what the finding is worth.

### `SUPPLY_CHAIN`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `cc-permissions-modes` line 382 | 11 | 3 | NAMES |
| `troubleshooting-cc-setup` line 125 | 46 | 33 | TEACHES |
| `troubleshooting-cc-setup` line 535 | 15 | 7 | EXPLAINS |
| `troubleshooting-cc-setup` line 599 | 81 | 68 | TEACHES |
| `troubleshooting-cc-setup` line 688 | 21 | 13 | EXPLAINS |
| `troubleshooting-cc-setup` line 797 | 46 | 33 | TEACHES |
| `troubleshooting-cc-setup` line 829 | 46 | 33 | TEACHES |
| `troubleshooting-cc-setup` line 836 | 46 | 33 | EXPLAINS |
| `troubleshooting-cc-setup` line 845 | 46 | 33 | TEACHES |
| `troubleshooting-cc-setup` line 1049 | 46 | 33 | TEACHES |

### `CMD_INJECTION`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `native-toolset-reference` line 632 | 6 | 0 | NAMES |
| `troubleshooting-cc-setup` line 125 | 6 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 599 | 6 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 704 | 42 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 797 | 6 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 829 | 6 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 845 | 6 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 1049 | 6 | 0 | TEACHES |

### `PRIVILEGE_ESC`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `troubleshooting-cc-setup` line 390 | 5 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 391 | 5 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 528 | 5 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 788 | 5 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 789 | 5 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 790 | 5 | 0 | TEACHES |
| `troubleshooting-cc-setup` line 791 | 5 | 0 | TEACHES |

### `CLAUDE_CLI_PERMISSION_BYPASS`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `automate-actions-with-hooks` line 980 | 196 | 160 | WARNS |
| `cc-permissions-modes` line 76 | 51 | 15 | TEACHES |
| `channels-reference` line 293 | 186 | 150 | WARNS |
| `hooks-reference` line 2033 | 203 | 167 | NAMES |
| `sessions-reference` line 68 | 195 | 159 | NAMES |
| `sessions-reference` line 79 | 227 | 191 | NAMES |
| `sessions-reference` line 83 | 71 | 35 | NAMES |

### `CLAUDE_CLI_TOKEN_THEFT`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `cc-github-actions` line 94 | 18 | 0 | TEACHES |
| `cc-github-actions` line 116 | 18 | 0 | WARNS |
| `cc-github-actions` line 381 | 18 | 0 | NAMES |
| `mcp-servers-reference` line 1181 | 18 | 0 | NAMES |

### `AGENT_MEMORY_MOD`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `cc-native-memory-and-rules` line 26 | 89 | 74 | DESCRIBES |
| `cc-native-memory-and-rules` line 55 | 142 | 102 | DESCRIBES |
| `cc-native-memory-and-rules` line 474 | 191 | 176 | DESCRIBES |
| `cc-native-memory-and-rules` line 553 | 73 | 58 | DESCRIBES |
| `cc-native-memory-and-rules` line 563 | 21 | 6 | DESCRIBES |
| `cc-projects-directory-structure` line 29 | 83 | 2 | DESCRIBES |
| `cc-projects-directory-structure` line 70 | 151 | 1 | DESCRIBES |
| `cc-projects-directory-structure` line 287 | 26 | 11 | DESCRIBES |
| `cc-projects-directory-structure` line 394 | 23 | 8 | DESCRIBES |

### `A2A_CROSS_AGENT_INJECT`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `hooks-reference` line 2538 | 340 | 175 | DESCRIBES |
| `prompt-caching-reference` line 253 | 41 | 7 | DESCRIBES |
| `skills-reference` line 909 | 182 | 21 | DESCRIBES |

### `A2A_AGENT_IMPERSONATION`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `models-configuration` line 504 | 405 | 345 | DESCRIBES |

### `INTENT_DESTRUCTIVE_INTENT`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `worktrees-reference` line 81 | 12 | 0 | DESCRIBES |

### `TIME_BOMB`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `loop-and-chron-reference` line 207 | 42 | 37 | DESCRIBES |

### `CLAUDE_AUTH_ENV_OVERRIDE`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `troubleshooting-cc-setup` line 1188 | 25 | 1 | TEACHES |

### `SHELL_EXEC`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `status-line-customization` line 598 | 8 | 0 | SAMPLE |
| `status-line-customization` line 599 | 8 | 0 | SAMPLE |
| `status-line-customization` line 600 | 8 | 0 | SAMPLE |
| `status-line-customization` line 601 | 8 | 0 | SAMPLE |
| `status-line-customization` line 774 | 8 | 0 | SAMPLE |
| `status-line-customization` line 1067 | 8 | 0 | SAMPLE |
| `status-line-customization` line 1068 | 8 | 0 | SAMPLE |
| `status-line-customization` line 1069 | 8 | 0 | SAMPLE |
| `status-line-customization` line 1070 | 8 | 0 | SAMPLE |

### `FS_WRITE`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `automate-actions-with-hooks` line 1055 | 8 | 0 | SAMPLE |
| `troubleshooting-cc-setup` line 172 | 7 | 0 | SAMPLE |
| `troubleshooting-cc-setup` line 173 | 7 | 0 | SAMPLE |
| `troubleshooting-cc-setup` line 179 | 8 | 0 | SAMPLE |
| `troubleshooting-cc-setup` line 180 | 8 | 0 | SAMPLE |
| `troubleshooting-cc-setup` line 523 | 7 | 0 | SAMPLE |
| `troubleshooting-cc-setup` line 865 | 8 | 0 | SAMPLE |

### `ENV_INJECTION`

| site | raw span | gap | what the passage is |
|---|---|---|---|
| `hooks-reference` line 1320 | 12 | 1 | SAMPLE |
| `troubleshooting-cc-setup` line 172 | 12 | 1 | SAMPLE |
| `troubleshooting-cc-setup` line 179 | 12 | 1 | SAMPLE |
| `troubleshooting-cc-setup` line 186 | 12 | 1 | SAMPLE |

## WHAT THE PASS CHANGES, AND WHAT IT DOES NOT

**It changes the ledger's claim about the remaining work.** The ledger said the per-rule pass was the REMAINING WORK and
that until each rule was adjudicated individually the bucket partition was a hypothesis. That pass is now DONE: the partition's
counts are confirmed against the scan, and every rule is adjudicated. What is left is not a missing measurement.

**It sharpens the upstream case from "these rules over-fire on documentation" to a per-rule statement of what each pattern
actually matches** — and for four rules, to a statement about the GAP, which is the part a fix would change.

**It does not dispose of bucket A, and it does not set severity.** The 36 bucket-A findings sit in the vendor's own
documentation; whether those passages belong in the plugin is the owner's question, and this file does not answer it.

## Provenance

| | |
|---|---|
| validator | `cpv-remote-validate plugin . --strict` (CPV v5.22.0), re-run at commit `1bb05ad` |
| the 72 | the validator's `[NIT]` lines; the (rule, site) set re-verified byte-identical to the enumeration in `cpv-nit-bucketA-sites.md` |
| the per-site match | re-derived from the installed catalogue at `claude-plugins-validation` 5.22.0: `scripts/rules/skillaudit_patterns.json` and `scripts/cpv_skillaudit_native.py` |
| the write-intent classification | the scanner's own `_shell_match_lacks_write_intent` predicate in `scripts/_skillaudit_shell_context.py` |
| the passage column | the sibling spec's adjudicated stances for the 36 bucket-A sites; the remaining 36 read from the passage at the cited line |

### THE CHAPTER DIGEST — how staleness is detected here

**THE DIGEST, NOT A COMMIT ID, IS WHAT DETECTS STALENESS.** The line numbers here point into vendored chapters that a
re-sync re-wraps, which moves every line. Recompute the digest over the 17 chapters that hold the 64 sites; if it differs,
the line numbers in this file no longer point at the passages described. A commit id could not detect that, because this file
and the chapters would both have moved on. It does not detect a change in the other chapters, nor a change in the scanner's
rules — for that, re-run the validator.

| | |
|---|---|
| chapter-text digest | `b70a6dce9f702157` (sha256 over the 17 chapters' bytes, concatenated in SORTED PATH ORDER) |

The command that reproduces it — the chapter list is the set of files holding the 64 sites, and the ORDER IS SORTED PATH
ORDER, not the order the per-site table happens to list them in. A digest over a stated order is only reproducible if the
order is stated independently of the table, and the table's order is a per-rule grouping that a reordering of this file
would change:

```bash
cd /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer
cat $(grep -oE '^\| `[a-z0-9-]+` line [0-9]+' design/specs/specs/cpv-nit-rules-adjudicated.md \
  | sed -E 's/^\| `([a-z0-9-]+)`.*/skills\/mods-doc-\1\/references\/chapter.md/' \
  | sort -u) | shasum -a 256 | cut -c1-16
```

The `cat` is what makes it a digest of the CHAPTERS' BYTES; `shasum` over a FILE LIST would hash each file separately and
give one value per file, which is not this measurement. The result is `b70a6dce9f702157`.

The result is a digest over the CHAPTERS' BYTES in sorted path order. It quotes no flagged construct: the command names
files, not the constructs they contain.

**THE RAW SPAN MOVES WITH THE WRAPPING; THE GAP DOES NOT.** A re-sync that reflows a chapter changes the raw span column —
URL text and line breaks move — while leaving the gap column and the passage column unchanged. That is the reason the gap
carries the argument and the raw span does not.
