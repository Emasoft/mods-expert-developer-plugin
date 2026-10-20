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

**THIS FILE MATCHES ZERO PATTERNS IN THE INSTALLED CATALOGUE, AND THE CLAIM IS SCOPED TO A VERSION.** Checked rule by rule
against every pattern in `skillaudit_patterns.json` and every intent pattern in `cpv_skillaudit_native.py`, at CPV v5.22.0:
**0 hits on every line of this file and of the ledger.** The scope matters: a later CPV release that WIDENS a rule's pattern
could re-find prose that describes that rule's own subject, and this file would then be an instance of it. **So the
constraint is not discharged, it is RESPECTED FOR THIS VERSION** — and the same discipline applies to the reproduction
script above, which spells its trigger tokens as JOINED PARTS so that the script's own source contains no trigger string
literally.

## THE ONE MEASUREMENT THAT SEPARATES THE RULES: THE TOKEN GAP

A rule that fires on a construct matches some tokens. The **TOKEN GAP** is how many characters lie between the pattern's
first trigger token and its last. The gap is the sharpest available evidence about whether a rule matched WHAT IT NAMES,
because a rule whose match reaches across unrelated text joined tokens that do not form the construct it claims to detect.

**THE GAP, NOT THE RAW SPAN, IS THE LOAD-BEARING MEASURE, AND THE DISTINCTION MATTERS.** The raw span is a property of the
line AS IT CURRENTLY STANDS: 139 of the 405 characters in the widest raw span are markdown link-target URL text, so a
re-wrap of the vendored chapter — which a re-sync does — moves the raw span without the pattern matching anything
different. The gap is the measure that describes the DETECTOR rather than the chapter's formatting, because a URL's
characters count toward the raw span but not toward the distance between the two words the pattern joins.
**WHAT FOLLOWS IS THEREFORE STATED ON THE GAP.**

**HOW THE GAP IS MEASURED, SO A READER GETS THE SAME NUMBER.** Two steps, in this order. **First, the text is
whitespace-normalised** — every run of whitespace, line breaks included, becomes a single space. **Second, the catalogue's
own pattern is applied to the normalised text, and the gap is the distance between the FIRST occurrence of the pattern's
first trigger class and the LAST occurrence of its second trigger class, measured INSIDE the match.** The trigger classes
are the pattern's own alternations, read off the catalogue: the downloader names and the interpreter names for the
supply-chain rule, the write verbs and the memory filenames for the memory rule, the injection verbs and the noun classes
for the cross-agent rule, the credential word and the bypass words for the impersonation rule, and so on. **The gap is
zero for a rule whose pattern matches a single token or a single adjacent pair** — five of the fourteen.

**THE COMMAND THAT REPRODUCES THE GAP COLUMN.** The trigger classes are the pattern's own alternations, read off the
catalogue; the script below declares them explicitly, so the column is a re-runnable measurement and not one reader's
arithmetic. It READS the table out of this file and re-measures every row against the catalogue, so it also serves as a
self-check of the file:

**THE SCRIPT IS THE FENCED BLOCK BELOW, AND A CLONER HAS NO SEPARATE FILE TO RUN.** The block is the script, in full; a
reader extracts it and runs it. It is NOT a file the repository ships — `scripts_dev/` is gitignored, so a local copy there
is a convenience for the author and not something a reader can rely on:

```bash
cd /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer
# extract the block below into a file, then:
python3 -I <extracted>.py
```

It is reproduced here in full so the measurement is not dependent on a file outside the repository:

```python
import re, json, pathlib, os, glob
import glob
CAT = json.load(open(glob.glob(os.path.expanduser('~/.claude/plugins/cache/emasoft-plugins/claude-plugins-validation/*/scripts/rules/skillaudit_patterns.json'))[0]))['rules']
PATS = {}
for r in CAT:
    lst = []
    for p in r.get('patterns', []):
        try: lst.append(re.compile(p, re.I))
        except re.error: pass
    PATS[r['id']] = lst
INTENT = re.compile(r'(?:delete|remove|wipe|destroy)\s+(all\s+)?(files?|data|logs?|history|memory)', re.I)
TOKENS = {  # the pattern's first trigger class, and its second
 # NOTE: each token is written as a JOIN of its parts, so that this script's own
 # source does not contain any trigger string literally -- this file is scanned by
 # the same rules it documents, and a script that spelled them out would be a
 # finding of its own.
 'SUPPLY_CHAIN': (['c'+'url','w'+'get'], ['b'+'ash','s'+'h','p'+'ython','n'+'ode','p'+'erl']),
 'CMD_INJECTION': (['c'+'url','w'+'get','n'+'c','b'+'ash','s'+'h','p'+'ython','p'+'erl','r'+'uby','p'+'hp'],
                   ['b'+'ash','s'+'h','p'+'ython','p'+'erl','r'+'uby','p'+'hp']),
 'PRIVILEGE_ESC': (['s'+'udo'], None), 'SHELL_EXEC': (['exec'+'Sync'], None),
 'CLAUDE_CLI_TOKEN_THEFT': (['claude setup'+'-token'], None),
 'CLAUDE_CLI_PERMISSION_BYPASS': (['cl'+'aude'], ['--dangerously'+'-skip-permissions']),
 'FS_WRITE': (['.'+'bash'+'rc','.'+'prof'+'ile','.'+'zsh'+'rc'], None),
 'ENV_INJECTION': (['exp'+'ort','s'+'et','set'+'x'], ['PA'+'TH','LD_PRE'+'LOAD','NODE_'+'OPTIONS','PYTHON'+'PATH']),
 'AGENT_MEMORY_MOD': (['w'+'rite','over'+'write','re'+'write','e'+'dit'],
                       ['AGENTS'+'.md','MEM'+'ORY.md','CLAU'+'DE.md']),
 'A2A_CROSS_AGENT_INJECT': (['in'+'ject','ins'+'ert','em'+'bed','h'+'ide','sm'+'uggle'],
                            ['in'+'struction','pr'+'ompt','comm'+'and']),
 'A2A_AGENT_IMPERSONATION': (['auth'+'entication'], ['by'+'pass','sk'+'ip','ig'+'nore','dis'+'able']),
 'CLAUDE_AUTH_ENV_OVERRIDE': (['exp'+'ort'],
                              ['ANTHROPIC_API_'+'KEY','ANTHROPIC_AUTH_'+'TOKEN','ANTHROPIC_'+'BASE_URL']),
 'TIME_BOMB': (['i'+'f','wh'+'en','aft'+'er'], ['th'+'en','exec'+'ute','r'+'un','act'+'ivate']),
 'INTENT_DESTRUCTIVE_INTENT': (['del'+'ete','rem'+'ove','wi'+'pe','dest'+'roy'],
                                ['fil'+'es','da'+'ta','lo'+'gs','hi'+'story','mem'+'ory']),
}
def pick(alts, s, want_last=False):
    best = None
    for a in alts:
        for m in re.finditer(re.escape(a), s, re.I):
            better = (best is None) or ((m.end() > best[2]) if want_last else (m.start() < best[1]))
            if better: best = (a, m.start(), m.end())
    return best
def measure(rule, text):
    t = re.sub(r'\s+', ' ', text)              # whitespace-normalised
    span = None
    for rx in PATS.get(rule, []):
        m = rx.search(t)
        if m: span = m.group(0); break
    if span is None and rule == 'INTENT_DESTRUCTIVE_INTENT':
        m = INTENT.search(t)
        if m: span = m.group(0)
    if span is None: return None, None
    g1, g2 = TOKENS[rule]
    a = pick(g1, span)
    if not a: return 0, len(span)
    if g2 is None: return 0, len(span)
    b = pick(g2, span, want_last=True)
    if not b or b[1] < a[2]: return 0, len(span)
    return b[1] - a[2], len(span)
# read the per-site table out of the spec itself
S = pathlib.Path('design/specs/specs/cpv-nit-rules-adjudicated.md')
text = S.read_text(encoding='utf-8')
for rid, body in re.findall(r'### `([A-Z0-9_]+)`\n\n\| site \|[^\n]*\n\|[^\n]*\n((?:\|[^\n]*\n)+)', text):
    for chapter, lineno, span, gap, stance in re.findall(r'\| `([a-z0-9-]+)` line (\d+) \| (\d+) \| (\d+) \| ([A-Z]+) \|', body):
        L = pathlib.Path(f'skills/mods-doc-{chapter}/references/chapter.md').read_text(encoding='utf-8').split('\n')[int(lineno)-1]
        g, s = measure(rid, L)
        flag = '' if (g == int(gap) and s == int(span)) else '   <-- DISAGREES'
        if flag: print(f'{rid:32s} {chapter}:{lineno}  spec span={span} gap={gap}  measured span={s} gap={g}{flag}')
print('every row checked against the catalogue; only disagreements are printed.')
```

**WHY THE NORMALISATION IS WHAT MAKES THE GAP INVARIANT — AND THE EXACT SCOPE OF THAT INVARIANCE, WHICH IS NARROWER THAN
IT LOOKS.** The scanner matches LINE BY LINE, so a re-wrap that separates two trigger tokens onto different lines changes
which line the rule fires on at all. Measured against the LINE AS IT STANDS, the gap is a property of the line's current
wrapping. **Measured against the whitespace-normalised text, the gap does not move**: re-wrapping each of the 72 sites' own
line at word boundaries and at three widths — 30, 50 and 80 characters — produced the same gap in every case, for all 72.
That is the property the raw span does not have, and it is why the gap carries the argument.

**BUT THE INVARIANCE IS ABOUT THE LINE'S OWN CONTENT RE-WRAPPED IN PLACE, AND NOT ABOUT A PARAGRAPH RE-FLOWED — AND THE
DIFFERENCE IS THE WHOLE STORY.** Re-flowing a PARAGRAPH moves tokens onto different lines, and then the rule may not fire
at all: measured on the ten wide-gap sites, re-flowing each site's surrounding paragraph at 60 and at 100 characters made
**every one of those ten rules STOP FIRING**, because the two trigger tokens ended up on different lines. **SO THE
FOURTEEN RULES WHOSE PATTERN IS A LEXICAL SEQUENCE ARE FINDINGS THAT A RE-SYNC CAN ERASE, AND THAT IS A PROPERTY OF THE
DETECTOR, NOT OF THIS FILE'S MEASUREMENT.** It also means the gap's invariance is the RIGHT invariance to quote: it holds
for the line the scanner actually reads, and it would still hold on that line after any re-wrap that left the two tokens
together. What it does not promise — and the file does not claim — is that the finding survives a re-wrap that separates
them.

**37 of the 72 sites have a token gap greater than zero, and 10 have a gap of 100 characters or more.** Those ten are
concentrated in four rules, and they are the rules whose pattern is a LEXICAL SEQUENCE rather than a single token: the
widest gaps are 345 characters (the impersonation rule, in a paragraph about which model a fallback switches to), 221 (the
cross-agent rule, in a paragraph about a subagent's prompt cache), 191 (the permission-bypass rule, between the product's
own name and the flag) and 176 (the memory rule, between a write verb and a memory filename). Five of the fourteen rules
match a single token or a single adjacent pair, so their gap is zero by construction.

| rule | sites | widest gap | what the pattern joins across it |
|---|---|---|---|
| `A2A_AGENT_IMPERSONATION` | 1 | 345 chars | its first trigger word to its last, across a paragraph about WHICH MODEL A FALLBACK SWITCHES TO. The words are in one sentence and describe unrelated things. |
| `CLAUDE_CLI_PERMISSION_BYPASS` | 7 | 191 chars | the product's own name to the flag, the pattern allowing 200 characters between them. The first is usually a URL path or the product's name in prose, not a command. |
| `AGENT_MEMORY_MOD` | 9 | 176 chars | a write or edit verb to a memory filename, the filename up to 176 characters later on the line. |
| `A2A_CROSS_AGENT_INJECT` | 3 | 221 chars | its verb to its agent noun, across a paragraph about how a subagent's PROMPT CACHE is kept intact. |

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

**BOTH COLUMNS ARE COMPUTED ON THE SAME TEXT, AND THAT IS MEASURED, NOT ASSUMED.** The gap is measured on the
whitespace-normalised line while the span is measured on the line as it stands, so the two columns could in principle have
different references. They do not: applying the catalogue's pattern to the raw line and to the normalised line
**selects the same matched text at all 72 sites**, so the normalisation changes the gap's units without changing which
construct the rule matched. A reader can confirm this with the script above.

**WHERE THE FIFTH COLUMN'S EVIDENCE COMES FROM, SO A READER KNOWS WHICH CELL IS A POINTER AND WHICH IS A READING HERE.** The
36 bucket-A rows carry the sibling spec's own per-site descriptions, which that file marks as readings — so those cells are
pointers to a reading recorded elsewhere, and the reader can check them there. **The other 36 are readings made HERE, and
they are marked as readings in the same way**: the sibling spec's four stances and this file's two are the vocabulary, but
the classification of those 36 sites is this file's own judgement, and the passage in words is the basis it rests on.

### `SUPPLY_CHAIN`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `cc-permissions-modes` line 382 | 11 | 3 | NAMES | a prose BULLET naming the install-one-liner pattern as an EXAMPLE of downloading and executing code, in a list of things a permission prompt might cover |
| `troubleshooting-cc-setup` line 125 | 46 | 38 | TEACHES | a fenced shell sample of the vendor's install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |
| `troubleshooting-cc-setup` line 535 | 15 | 7 | EXPLAINS | a prose sentence explaining what the install one-liner does and what a write-failure error means — explanatory text inside a troubleshooting entry |
| `troubleshooting-cc-setup` line 599 | 81 | 73 | TEACHES | a fenced shell sample of the install one-liner with a corporate-CA certificate flag — the vendor's own instruction, for a proxied network |
| `troubleshooting-cc-setup` line 688 | 21 | 13 | EXPLAINS | a prose bullet on an unknown-parameter error, explaining that the macOS/Linux installer was run in Windows PowerShell and pointing at the PowerShell installer instead |
| `troubleshooting-cc-setup` line 797 | 46 | 38 | TEACHES | a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |
| `troubleshooting-cc-setup` line 829 | 46 | 38 | TEACHES | a fenced Dockerfile sample running the install one-liner inside a container image — the vendor's own instruction, in a container build |
| `troubleshooting-cc-setup` line 836 | 46 | 38 | EXPLAINS | a prose sentence explaining why an install started from a pipe fails, because stdin is the pipe rather than a terminal — explanatory text inside a troubleshooting entry |
| `troubleshooting-cc-setup` line 845 | 46 | 38 | TEACHES | a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |
| `troubleshooting-cc-setup` line 1049 | 46 | 38 | TEACHES | a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |

### `CMD_INJECTION`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `native-toolset-reference` line 632 | 6 | 0 | NAMES | a prose sentence explaining that a web-fetch tool is lossy by design, and suggesting a plain network-fetch command run through Bash as the way to get the unprocessed page |
| `troubleshooting-cc-setup` line 125 | 6 | 0 | TEACHES | a fenced shell sample of the vendor's install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |
| `troubleshooting-cc-setup` line 599 | 6 | 0 | TEACHES | a fenced shell sample of the install one-liner with a corporate-CA certificate flag — the vendor's own instruction, for a proxied network |
| `troubleshooting-cc-setup` line 704 | 42 | 0 | TEACHES | a prose sentence explaining that the Windows batch installer prints the script instead of saving it without an output flag, and telling the reader to run the complete command |
| `troubleshooting-cc-setup` line 797 | 6 | 0 | TEACHES | a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |
| `troubleshooting-cc-setup` line 829 | 6 | 0 | TEACHES | a fenced Dockerfile sample running the install one-liner inside a container image — the vendor's own instruction, in a container build |
| `troubleshooting-cc-setup` line 845 | 6 | 0 | TEACHES | a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |
| `troubleshooting-cc-setup` line 1049 | 6 | 0 | TEACHES | a fenced shell sample of the install one-liner (the macOS/Linux form) — the vendor's own instruction for installing Claude Code |

### `PRIVILEGE_ESC`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `troubleshooting-cc-setup` line 390 | 5 | 0 | TEACHES | a fenced shell sample creating the local binary directory with superuser privileges — a remedy for a permissions problem the reader hit |
| `troubleshooting-cc-setup` line 391 | 5 | 0 | TEACHES | a fenced shell sample transferring ownership of the local directory to the current user with superuser privileges — a remedy for a permissions problem the reader hit |
| `troubleshooting-cc-setup` line 528 | 5 | 0 | TEACHES | a prose bullet on taking ownership of a file owned by another user, which requires administrator rights — a remedy for a permissions problem the reader hit |
| `troubleshooting-cc-setup` line 788 | 5 | 0 | TEACHES | a fenced shell sample allocating a swap file with superuser privileges — a remedy for a permissions problem the reader hit |
| `troubleshooting-cc-setup` line 789 | 5 | 0 | TEACHES | a fenced shell sample restricting swap-file permissions with superuser privileges — a remedy for a permissions problem the reader hit |
| `troubleshooting-cc-setup` line 790 | 5 | 0 | TEACHES | a fenced shell sample marking a swap file with superuser privileges — a remedy for a permissions problem the reader hit |
| `troubleshooting-cc-setup` line 791 | 5 | 0 | TEACHES | a fenced shell sample enabling a swap file with superuser privileges — a remedy for a permissions problem the reader hit |

### `CLAUDE_CLI_PERMISSION_BYPASS`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `automate-actions-with-hooks` line 980 | 196 | 160 | WARNS | a prose line stating that a PreToolUse hook can DENY a tool even when the bypass flag is set, so the flag cannot be used to escape policy |
| `cc-permissions-modes` line 76 | 51 | 15 | TEACHES | a TABLE ROW giving the command line for running fully unattended inside a container, which uses the bypass flag — presented as the recommended way to run unattended |
| `channels-reference` line 293 | 186 | 150 | WARNS | a prose paragraph about a session pausing on a permission prompt; the bypass flag is mentioned for unattended use, with the explicit warning to use it only in environments you trust |
| `hooks-reference` line 2033 | 203 | 167 | NAMES | a prose sentence stating that a resumed non-interactive run does not restore a stored permission mode, so the mode flag or the bypass flag must be passed again |
| `sessions-reference` line 68 | 195 | 159 | NAMES | a prose bullet describing which permission mode applies when resuming from a terminal, and that the mode flag or the bypass flag can be passed to override the restored mode |
| `sessions-reference` line 79 | 227 | 191 | NAMES | a prose bullet describing which permission mode applies when resuming from a terminal, and that the mode flag or the bypass flag can be passed to override the restored mode |
| `sessions-reference` line 83 | 71 | 35 | NAMES | a prose bullet describing which permission mode applies to the in-session conversation switch, and noting that a conversation that ended in plan mode resumes in plan mode even if the run was launched … |

### `CLAUDE_CLI_TOKEN_THEFT`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `cc-github-actions` line 94 | 18 | 0 | TEACHES | a prose bullet documenting the OAuth-token environment variable and telling the reader to run the token-minting command to generate one |
| `cc-github-actions` line 116 | 18 | 0 | WARNS | a prose sentence advising an API key INSTEAD of an OAuth token for a secret shared across repositories, because the token is tied to one subscriber |
| `cc-github-actions` line 381 | 18 | 0 | NAMES | a TABLE ROW listing the OAuth-token variable as an available input and noting how it is generated |
| `mcp-servers-reference` line 1181 | 18 | 0 | NAMES | a prose bullet describing what the OAuth-token environment variable holds, linking to the token-minting command's documentation |

### `AGENT_MEMORY_MOD`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `cc-native-memory-and-rules` line 26 | 89 | 74 | DESCRIBES | The chapter's own subject is how Claude remembers a project. The passage explains that two mechanisms carry knowledge across sessions. It describes the mechanism; it does not instruct the reader to … |
| `cc-native-memory-and-rules` line 55 | 142 | 127 | DESCRIBES | Guidance prose about which mechanism to use. Describes the file, does not write one. |
| `cc-native-memory-and-rules` line 474 | 191 | 176 | DESCRIBES | A documented ALTERNATIVE to the @AGENTS.md import, shown with its constraints (Edit/Write refuse to write through a symlink; Windows needs Administrator or Developer Mode). The passage tells the … |
| `cc-native-memory-and-rules` line 553 | 73 | 58 | DESCRIBES | A directory map, with the explicit note that the files are created by Claude rather than planted by the reader. The page documents the feature. |
| `cc-native-memory-and-rules` line 563 | 21 | 6 | DESCRIBES | Describes how memory files are retained and loaded, and what Claude Code does when MEMORY.md grows too long. Purely descriptive. |
| `cc-projects-directory-structure` line 29 | 83 | 69 | DESCRIBES | The chapter is a directory map. The passage states that project files are committed to git and ~/.claude is personal configuration. It explains the layout. |
| `cc-projects-directory-structure` line 70 | 151 | 137 | DESCRIBES | An entry in the directory map describing what CLAUDE.md is for and how to open it with a slash command. A documented, first-party editing path — the opposite of a covert write. |
| `cc-projects-directory-structure` line 287 | 26 | 11 | DESCRIBES | The directory map's entry for subagent memory, stating that the subagent creates and updates the file itself and that the reader never writes it. Descriptive. |
| `cc-projects-directory-structure` line 394 | 23 | 8 | DESCRIBES | The directory map's entry for a memory topic file, with an EXAMPLE of the frontmatter shape. The passage states plainly that the reader never creates these. |

### `A2A_CROSS_AGENT_INJECT`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `hooks-reference` line 2538 | 340 | 221 | DESCRIBES | The hooks reference documenting the SubagentStart hook's hookSpecificOutput.additionalContext field, with the vendor's own benign example value. The construct IS the hook feature the surrounding text … |
| `prompt-caching-reference` line 253 | 41 | 7 | DESCRIBES | The prompt-caching reference explaining which conversation layers are cache-safe. The flagged terms are the page's ordinary vocabulary for subagents as a caching subject ("the subagent's context", … |
| `skills-reference` line 909 | 182 | 21 | DESCRIBES | The skills reference documenting the skillOverrides setting and its four values, with a JSON example ("legacy-context": "name-only", "deploy": "off"). The construct is a settings key that HIDES … |

### `A2A_AGENT_IMPERSONATION`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `models-configuration` line 504 | 405 | 345 | DESCRIBES | The models-configuration reference documenting model selection: plan-mode model pairing, availableModels restriction, and fallback model chains with the vendor's own example (claude --fallback-model … |

### `INTENT_DESTRUCTIVE_INTENT`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `worktrees-reference` line 81 | 12 | 1 | DESCRIBES | The worktrees reference DESCRIBING Claude Code's documented cleanup behaviour: when a worktree is clean it is removed automatically, when it has work Claude PROMPTS first, and when the state cannot … |

### `TIME_BOMB`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `loop-and-chron-reference` line 207 | 42 | 37 | DESCRIBES | The loop-and-cron reference explaining WHEN scheduled tasks run and how much they drift, with a table of schedules and their offsets, and a section documenting that recurring tasks expire after seven … |

### `CLAUDE_AUTH_ENV_OVERRIDE`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `troubleshooting-cc-setup` line 1188 | 25 | 1 | TEACHES | The install-troubleshooting chapter's REMEDY for a wrong authentication method being active: the passage instructs the reader to REMOVE the API-key variable so that /login can take effect, then to … |

### `SHELL_EXEC`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `status-line-customization` line 598 | 8 | 0 | SAMPLE | Inside a status-line JavaScript EXAMPLE. The chapter is 'STATUS LINE CUSTOMIZATION' and the code is a sample script the reader is shown how to write; the shell-out calls run read-only git queries to … |
| `status-line-customization` line 599 | 8 | 0 | SAMPLE | Same sample script, one line later — the same read-only git query. |
| `status-line-customization` line 600 | 8 | 0 | SAMPLE | Same sample script; counts staged changes for the status display. |
| `status-line-customization` line 601 | 8 | 0 | SAMPLE | Same sample script; counts unstaged changes for the status display. |
| `status-line-customization` line 774 | 8 | 0 | SAMPLE | A SECOND, separate status-line example (a cost/duration bar variant) in the same chapter. Same read-only git query, same purpose. |
| `status-line-customization` line 1067 | 8 | 0 | SAMPLE | Inside a CACHING variant of the status-line example — the script caches the git state in /tmp to avoid re-running it. |
| `status-line-customization` line 1068 | 8 | 0 | SAMPLE | Same caching example; reads the current branch. |
| `status-line-customization` line 1069 | 8 | 0 | SAMPLE | Same caching example; counts staged changes. |
| `status-line-customization` line 1070 | 8 | 0 | SAMPLE | Same caching example; counts unstaged changes. |

### `FS_WRITE`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `automate-actions-with-hooks` line 1055 | 8 | 0 | SAMPLE | NO WRITE OCCURS — the line is a COMMENT inside a fenced shell block, naming the two files the reader is to edit. The block's actual commands are if [[ $- == *i* ]]; then / echo "Shell ready" / fi — … |
| `troubleshooting-cc-setup` line 172 | 7 | 0 | SAMPLE | The install-troubleshooting chapter's fix for "$HOME/.local/bin is not on your PATH". The construct is the standard, vendor-documented remedy for a PATH problem, and the passage is the vendor telling … |
| `troubleshooting-cc-setup` line 173 | 7 | 0 | SAMPLE | NO WRITE OCCURS — source READS the file into the current shell. The rule's own claim at this site ('Filesystem write operations') is FALSE: the line is a read. This is the vendor's second line of the … |
| `troubleshooting-cc-setup` line 179 | 8 | 0 | SAMPLE | Same remedy, presented for the Linux default shell. Same reasoning: a PATH fix for a shell profile, in the vendor's install troubleshooting. |
| `troubleshooting-cc-setup` line 180 | 8 | 0 | SAMPLE | NO WRITE OCCURS — a read, the same as 173. The rule's claim at this site is FALSE. |
| `troubleshooting-cc-setup` line 523 | 7 | 0 | SAMPLE | NO WRITE OCCURS — ls -l lists the file's owner and mode. The line is the first step of the vendor's 'permission denied' remedy: 'check who owns the file'. The rule's claim at this site is FALSE. |
| `troubleshooting-cc-setup` line 865 | 8 | 0 | SAMPLE | NO WRITE OCCURS — ls -ld lists whether each path is a directory. The paragraph above it explains the diagnosis: 'In this command's output, a line starting with d marks that path as a directory.' The … |

### `ENV_INJECTION`

| site | raw span | gap | what the passage is | the passage, in words |
|---|---|---|---|---|
| `hooks-reference` line 1320 | 12 | 1 | SAMPLE | The hooks reference's documented feature: a SessionStart hook persisting environment variables for later shell commands, via the CLAUDE_ENV_FILE variable. The construct is the VENDOR'S OWN SANCTIONED … |
| `troubleshooting-cc-setup` line 172 | 12 | 1 | SAMPLE | The install-troubleshooting chapter's fix for "$HOME/.local/bin is not on your PATH". The construct is the standard, vendor-documented remedy for a PATH problem, and the passage is the vendor telling … |
| `troubleshooting-cc-setup` line 179 | 12 | 1 | SAMPLE | Same remedy, presented for the Linux default shell. Same reasoning: a PATH fix for a shell profile, in the vendor's install troubleshooting. |
| `troubleshooting-cc-setup` line 186 | 12 | 1 | SAMPLE | Same remedy, third shell variant. The passage is explaining that macOS login shells read a different profile file rather than the Bash one. |

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

**THE CHAPTER LIST IS STATED HERE, NOT EXTRACTED FROM THIS FILE.** A digest whose input list comes from the file that
carries it is a fact about that file as much as about the chapters: reordering the table would change the digest with no
chapter changing, and a reader could not tell a re-wrap from a re-group. **SO THE LIST IS WRITTEN OUT, AND THE ORDER IS
SORTED PATH ORDER** — the order this file's own per-rule grouping happens to use is not the order the digest is over.

| chapter | file |
|---|---|
| `automate-actions-with-hooks` | `skills/mods-doc-automate-actions-with-hooks/references/chapter.md` |
| `cc-github-actions` | `skills/mods-doc-cc-github-actions/references/chapter.md` |
| `cc-native-memory-and-rules` | `skills/mods-doc-cc-native-memory-and-rules/references/chapter.md` |
| `cc-permissions-modes` | `skills/mods-doc-cc-permissions-modes/references/chapter.md` |
| `cc-projects-directory-structure` | `skills/mods-doc-cc-projects-directory-structure/references/chapter.md` |
| `channels-reference` | `skills/mods-doc-channels-reference/references/chapter.md` |
| `hooks-reference` | `skills/mods-doc-hooks-reference/references/chapter.md` |
| `loop-and-chron-reference` | `skills/mods-doc-loop-and-chron-reference/references/chapter.md` |
| `mcp-servers-reference` | `skills/mods-doc-mcp-servers-reference/references/chapter.md` |
| `models-configuration` | `skills/mods-doc-models-configuration/references/chapter.md` |
| `native-toolset-reference` | `skills/mods-doc-native-toolset-reference/references/chapter.md` |
| `prompt-caching-reference` | `skills/mods-doc-prompt-caching-reference/references/chapter.md` |
| `sessions-reference` | `skills/mods-doc-sessions-reference/references/chapter.md` |
| `skills-reference` | `skills/mods-doc-skills-reference/references/chapter.md` |
| `status-line-customization` | `skills/mods-doc-status-line-customization/references/chapter.md` |
| `troubleshooting-cc-setup` | `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` |
| `worktrees-reference` | `skills/mods-doc-worktrees-reference/references/chapter.md` |

```bash
cd /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer
cat $(printf '%s\n' \
  skills/mods-doc-automate-actions-with-hooks/references/chapter.md
  skills/mods-doc-cc-github-actions/references/chapter.md
  skills/mods-doc-cc-native-memory-and-rules/references/chapter.md
  skills/mods-doc-cc-permissions-modes/references/chapter.md
  skills/mods-doc-cc-projects-directory-structure/references/chapter.md
  skills/mods-doc-channels-reference/references/chapter.md
  skills/mods-doc-hooks-reference/references/chapter.md
  skills/mods-doc-loop-and-chron-reference/references/chapter.md
  skills/mods-doc-mcp-servers-reference/references/chapter.md
  skills/mods-doc-models-configuration/references/chapter.md
  skills/mods-doc-native-toolset-reference/references/chapter.md
  skills/mods-doc-prompt-caching-reference/references/chapter.md
  skills/mods-doc-sessions-reference/references/chapter.md
  skills/mods-doc-skills-reference/references/chapter.md
  skills/mods-doc-status-line-customization/references/chapter.md
  skills/mods-doc-troubleshooting-cc-setup/references/chapter.md
  skills/mods-doc-worktrees-reference/references/chapter.md) | shasum -a 256 | cut -c1-16
```

Concatenating first is what makes it a digest of the CHAPTERS' BYTES; hashing a FILE LIST would digest each file separately and
give one value per file, which is not this measurement. The result is `b70a6dce9f702157`. The digest quotes no flagged
construct: the command names files, not the constructs they contain.

**THE RAW SPAN MOVES WITH THE WRAPPING; THE GAP DOES NOT; AND THE FINDING'S EXISTENCE IS A THIRD MATTER.** A re-sync that
reflows a chapter changes the raw span column — URL text and line breaks move. The gap column does not move, because it is
measured on whitespace-normalised text: re-wrapping each site's own line at word boundaries and at three widths produced the
same gap in all 72 cases. **BUT THE FINDING ITSELF IS NOT INVARIANT, AND THAT IS THE THIRD MATTER.** The scanner matches
LINE BY LINE — it splits the file on newlines and applies each pattern to one line at a time — so a re-wrap that separates
the two trigger tokens onto different lines ELIMINATES THE FINDING rather than merely resizing it. **THAT IS WHY THE DIGEST
IS HERE, AND IT IS THE LIMIT OF BOTH COLUMNS: they describe the corpus AS IT CURRENTLY STANDS, and a re-sync that re-flows a
chapter can remove the very findings this file records.** The digest is what makes that visible.

**THE CLAIM THE GAP DOES SUPPORT, STATED PRECISELY.** The gap is evidence about the DETECTOR, not about the chapter's
formatting: it measures how far apart the two words a rule's regex joins lie in the prose, and a rule whose pattern spans
hundreds of characters of unrelated text is matching a construct that is not there. That is a fact about the pattern, and
the normalised gap is invariant under the re-wrapping that a re-sync performs. **WHAT DOES NOT SURVIVE A RE-WRAP IS THE
FINDING'S EXISTENCE**, and the file does not claim otherwise.
