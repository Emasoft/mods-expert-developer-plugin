# Should this skill be a mod?

## Table of Contents

- [The core question](#the-core-question)
- [Three tests](#three-tests)
- [What each mechanism is for](#what-each-mechanism-is-for)
- [Alternatives that often beat a mod](#alternatives-that-often-beat-a-mod)
- [Costs a mod carries](#costs-a-mod-carries)
- [Worked verdicts](#worked-verdicts)
- [What to ask the user](#what-to-ask-the-user)

Adapted from skills/skill-to-mod/references/suitability.md of arm-pz/skill-to-mod (MIT, see NOTICE). The facts about mods come from the chapter skills of this plugin named in each section; where one of them disagrees with this page, the chapter wins.

## The core question

If Claude reading these instructions when it judges them relevant is enough, it is a skill and should stay one. A mod is justified only when the behaviour has to happen **at a moment Claude does not control**, needs a **face** outside the chat, or has to **intercept** something. Everything else is cheaper, safer and more portable as a skill.

## Three tests

1. **Moment test.** Can you complete "when ___ happens, do ___" with an event Claude Code fires? Candidates: a Bash command about to run (`tool.call`), a file edited (`tool.call` on Edit or Write), a prompt submitted (`prompt.submit`), a skill expanded (`skill.prompt`), a turn finished (`turn.complete`), a session starting (`session.start`), usage measured after a turn (`session.measure`), a conversation about to be compacted (`session.compact`). The full list is in chapter skill `mods-doc-mods-reference`, "Events a mod can hook". If you cannot name the event, there is no mod.
2. **Reliability test.** Would it matter if Claude simply did not load the skill this time? If it would reach for it anyway, the skill's description is doing its job; improve it with the chapter skill `mods-doc-skills-reference` if needed. If a missed run is costly (pre-release checks, secret scans, handoffs), a trigger earns its place.
3. **Face test.** Does the person need to see or press something outside the chat: a pane, a band above the prompt, a status line, a toast, a slash command that runs code without a model turn? Skills cannot draw; mods can (chapter skill `mods-doc-mods-interfaces`).

No test passes: **KEEP_SKILL**. A face or a moment with too little guidance behind it to stand as a skill: **MOD_FIRST**. The checker calls it so for a face whose `knowledge` score is under 2, or for a moment whose `event` score is 4 or more and whose `knowledge` score is under 1. Any other face or moment, with guidance worth keeping as a skill: **HYBRID**.

## What each mechanism is for

Chapter skill `mods-doc-mods-overview`, "Compare mods, settings hooks, skills, and MCP servers", holds Anthropic's comparison. In short:

| | Mod | Settings hook | Skill | MCP server |
| --- | --- | --- | --- | --- |
| What it is | Functions in a plugin that run inside Claude Code | A shell command, HTTP call or prompt run on a lifecycle event | A `SKILL.md` Claude reads | A process that gives Claude tools |
| Can change | Tool calls, prompts, commands, turns, what is drawn | Whether a call or prompt goes ahead, its arguments and result | What Claude knows and does | Which tools Claude has |
| Can draw | Yes | No | No | No |
| Written in | JavaScript or TypeScript | A script plus a settings entry | Markdown | Any language |

A plugin can hold a mod beside the skill it triggers. For mods made with this plugin, the MCP column is reference only: PRRD G10 rules out MCP servers, so a tool Claude needs becomes a mod tool (`$.tool.register`, chapter skill `mods-doc-mods-api`, "Add a command or a tool"), a skill, a CLI or a script.

## Alternatives that often beat a mod

- A fixed script that must run on an event, with no interface: a **settings hook** (chapter skill `mods-doc-automate-actions-with-hooks`). It runs outside Claude Code's process and is easier to audit.
- A rule that should always apply: **CLAUDE.md** (chapter skill `mods-doc-cc-native-memory-and-rules`). No trigger needed.
- Reaching GitHub, a database or an API: a **CLI or script** the skill calls, or a mod tool. Not an MCP server (PRRD G10).
- Enforcement across a team: **permission rules or managed settings** (chapter skills `mods-doc-cc-permissions-modes` and `mods-doc-manage-mods-for-organizations`), not a mod that reads command text.
- A skill that is simply not firing: fix its description (chapter skill `mods-doc-skills-reference`).

## Costs a mod carries

- **Unsandboxed.** It runs as the user: if it calls those APIs it can read files and environment variables (which can hold API keys), start processes and make network requests. Every `$` call is something the installer must be willing to read (chapter skill `mods-doc-mods-overview`, "Decide whether to trust a mod"). This is why the generated mods call only `$.ui.*` and `$.command.register`.
- **Moving API.** Events and methods change between releases. Record the tested version, and prefer the type files of the installed build over any written reference.
- **Surfaces differ.** Hooks run wherever the plugin loads, but only the terminal and the Desktop app draw (chapter skill `mods-doc-mods-overview`, "How a mod works").
- **Admin control.** An organisation can stop user-installed mods from loading; the skill inside the plugin still works.
- **Switches and a debug log.** Every function needs its own switch (PRRD G13) and the mod needs a debug log that can be switched on, with secrets masked (PRRD G14). The scaffold provides both; a hand-written mod must too.

## Worked verdicts

**`wordsmith`** (write in a clear, warm voice; style guide, examples, workflow). No moment, no face: all guidance. **KEEP_SKILL.** If it does not trigger when someone drafts an email, fix the description. A mod would add risk and nothing else.

**`release-gate`** (run a checklist before pushing, deploying or publishing; also on "ship it"). A moment (a ship command), a reliability problem (a skipped gate is costly), real instruction (the checklist). **HYBRID.** Mod: hold a ship command until the skill has run since the last edit, and add one line of context when the prompt says "ship it". Skill: unchanged, bundled.

**`context-guardian`** (a live panel of context usage; warn before compaction; hand off). A face and moments (`session.measure`, `session.compact`) with almost no instruction behind them. **MOD_FIRST.** Hand-written; the nearest public sample is Anthropic's `token-weather`, listed in chapter skill `mods-doc-mods-overview`, "Try a sample mod".

## What to ask the user

At most one question, and only when the answer changes the build. Good ones: "Which commands count as shipping here: only `git push`, or deploys too?" or "Should it block, or only remind?". If a sensible default exists, take it and say so. Never ask whether to proceed.
