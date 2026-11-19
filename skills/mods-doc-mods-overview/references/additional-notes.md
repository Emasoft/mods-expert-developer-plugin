# Claude Code mods: additional notes

Last Updated: 2026-10-24. Installed Claude Code: 2.1.310.

## Table of Contents

- [How to read the markers](#how-to-read-the-markers)
- [1. What a mod is, how it ships, runtime, surfaces, version, trust](#1-what-a-mod-is-how-it-ships-runtime-surfaces-version-trust)
- [2. Events a mod can hook, and what it can do with each](#2-events-a-mod-can-hook-and-what-it-can-do-with-each)
- [3. Native tools, programmatic commands, turns, waking, timers](#3-native-tools-programmatic-commands-turns-waking-timers)
- [4. Rewriting context](#4-rewriting-context)
- [5. UI a mod can add](#5-ui-a-mod-can-add)
- [6. State, persistence, access, limits, error isolation](#6-state-persistence-access-limits-error-isolation)
- [7. Does a mod run with no session open?](#7-does-a-mod-run-with-no-session-open)
- [8. Interaction with hooks, plugins, skills, agents, MCP; distribution](#8-interaction-with-hooks-plugins-skills-agents-mcp-distribution)
- [9. Stability, limitations, troubleshooting](#9-stability-limitations-troubleshooting)
- [10. Local copies versus the live docs](#10-local-copies-versus-the-live-docs)
- [11. Common mechanism to mods mapping](#11-common-mechanism-to-mods-mapping)
- [Risks and limits to plan around](#risks-and-limits-to-plan-around)

<!-- cspell:ignore keepalive respawn -->

## How to read the markers

- DOC: stated in the live docs (https://code.claude.com/docs/en/plugins/mods/...) or the local chapters.
- TYPES: stated in the declaration file Claude Code 2.1.309 generates when it loads the plugin, `index.d.ts` under `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/types/claude-code/` (not shipped; Claude Code wrote it when it loaded this plugin from its source folder, an installed copy may not have it, and its contents follow the Claude Code version that wrote it)
  (header marks it EARLY ACCESS). Signatures and doc comments only, behaviour not run.
- UNVERIFIED: no source settles it; needs a live probe before implementing.
- INFERRED: conclusion from documented facts; but no page states it outright.

## 1. What a mod is, how it ships, runtime, surfaces, version, trust

- DOC. A mod is an ordinary plugin whose hooks/hooks.json has a modules key listing one ES module file, the hooks
  module, which exports register(on, options). Having that key is what makes the plugin a mod. JavaScript or
  TypeScript (.js .mjs .cjs .jsx .ts .mts .cts .tsx), loaded directly: no Node.js, bundler or build step.
  Source: create.md, Write a mod yourself (step 3); reference.md, Files.
- DOC. The same plugin can also carry skills, agents, commands, MCP servers and settings-style hooks under the hooks
  key of the same hooks.json. Disabling the mod part leaves the rest of the plugin loading.
  Source: overview.md, Compare mods, settings hooks, skills and MCP servers; troubleshoot.md.
- DOC. Runtime: no Node APIs, no setTimeout or other timer globals, no file or network access of its own. Web APIs
  such as URL, TextEncoder, AbortController and crypto.subtle exist. Every outside effect goes through the mods API,
  written $. Installed mods share one hooks worker thread.
  Source: api.md, Reach files, processes, and the network; troubleshoot.md, crashed the hooks worker.
- DOC. Static-analysis rules enforced at load and by claude plugin validate: write each $ call in full; $ may be
  passed only to a top-level function in the same file; no aliasing, destructuring or computed indexing of $; event
  names must be string literals; no second binding named on inside register; imports only relative files or the
  bare module claude-code; no dynamic import(); ES modules only. A mod that breaks them does not load.
  Source: create.md, Check what Claude Code reads from your mod.
- DOC. Versions: mods are on by default from v2.1.286 (Desktop) and the docs ask for v2.1.287 or later; v2.1.287+
  ignores CLAUDE_CODE_ENABLE_FUNCTION_HOOKS at any value. Source: create.md (note at top); admin.md, Stop
  user-installed mods; overview.md, Turn mods on or off.
- DOC. Surfaces where hooks run: terminal (including JetBrains), the Desktop app's Code tab (not WSL), VS Code, -p
  and the Agent SDK, Remote Control on the local machine, cloud sessions the plugin reaches. Drawing works in the
  terminal and Desktop, and in VS Code from extension 2.1.299 (2.1.304 for sessions that do not fetch feature
  flags, for example Bedrock). Source: overview.md, Where mods run; interface.md, Draw in the VS Code extension.
- DOC. Trust: a mod is not sandboxed and runs with the installing user's permissions. It can read files and
  secrets, start processes, make network requests, see and rewrite every prompt and tool call, deny or approve a
  tool call before the permission prompt, submit prompts (optionally as the user's own words), message other
  sessions and teammates, and spend the user's plan through model calls. It cannot restyle the permission prompt.
  No mod loads in an untrusted workspace until the trust prompt is answered.
  Source: overview.md, Decide whether to trust a mod; admin.md, Know what happens by default, Know which controls
  still apply.
- DOC. Permission precedence (live, newer than the local copy): a built-in guard mod, sec-default@builtin, loads
  ahead of user mods when the machine has managed settings or the session uses a Team or Enterprise /login. With
  the guard loaded, a user's mod cannot approve a call that a deny rule refuses or an ask rule prompts for, nor one
  a PreToolUse hook blocked; allowModsToOverrideDenyRules relaxes the deny part. Without the guard (API key,
  Bedrock, Google Cloud's Agent Platform, Microsoft Foundry, or a long-lived CLAUDE_CODE_OAUTH_TOKEN on a machine with no managed settings) these
  protections do not apply. Permission rules never cover a mod's own $.fs and $.process calls.
  Source: admin.md, Know what happens by default; Set options on the built-in guard.
- DOC. Off switches: disable the plugin in /plugin; claude --safe-mode; --bare; disableAllHooks. Managed options:
  allowManagedModsOnly (guard option), allowManagedHooksOnly, disableSideloadFlags (rejects --plugin-dir,
  --plugin-url, and mods Claude writes). Built-in mods have their own switches.
  Source: admin.md, Choose how much to allow; overview.md.
- DOC. Anthropic can turn installed mods off remotely through a rollout switch; built-ins are unaffected.
  Source: overview.md / troubleshoot.md (rollout switch entry).
- DOC. Review before install: claude plugin validate prints a hooks: line (events received) and a calls: line (mods
  API methods used), plus env reads/writes, state reads/writes, and a gating-hook-without-.catch line.
  Source: admin.md, Review what a mod can do; create.md.

## 2. Events a mod can hook, and what it can do with each

Model (DOC, events.md and reference.md, The hook function): on(event, matcher?, async ($, e, next) => ...). A hook is
middleware: it can observe (return next(e)), rewrite (return next(changedE)), or answer (return its own result and
never call next). e is deeply frozen. next carries signal, origin, budget, to (prepend and append tiers only); in a
.catch handler it also carries error (kinds throw, timeout, re-entry; live-only cause values rewritten from v2.1.300
and lent) and called. One registration per event per matcher. Matchers take a value, an array or a regex; '*' and
'classic.*' wildcards exist. Every $ method is itself an event other mods can hook (name without the $.).

Order (DOC, events.md, The order mods run in; admin.md): managed PreToolUse hooks first (if they block, no mod
tool.call hook runs, and they re-run on a mod-rewritten call), then prepend tier (org mods, then the guard), then
user mods ordered by dependencies, then append tier, then built-ins. PreToolUse hooks from other settings files and
plugins run after the last mod; if a mod answers the call, the tool and those hooks never run.

| Group | Event | Can modify / block / replace (DOC unless marked) |
|---|---|---|
| Tools | tool.call | rewrite input, deny, answer with its own result (tool never runs), retry, withhold the result after it ran |
| Tools | tool.check | return allow / ask / deny before the prompt; e.isReadOnly from v2.1.304 (live only); in plan mode only tighten (live) |
| Tools | tool.describe | change a tool's description and isDeferred |
| Prompts | prompt.submit | rewrite text, add context, drop the prompt |
| Prompts | prompt.fill, prompt.suggest, prompt.edit (50 ms limit), prompt.autocomplete (live only) | change prompt-box text, suggestions, completion |
| System prompt | prompt.compose | answer with the whole section list |
| System prompt | prompt.section | rewrite or omit each section |
| Context | prompt.context | supply first-message context blocks |
| Context | prompt.attachment | rewrite or omit system reminders |
| Context | prompt.mention | redirect or deny an @-file read |
| Skills | skill.prompt | rewrite a skill's text; source and frontmatter fields from v2.1.299 (live only) |
| Git | attribution.text | rewrite commit/PR attribution |
| Commands | command.run | answer with text, empty, or pass; a rewrite of the command name is refused |
| Commands | command.describe, config.set (deny), config.describe | describe/deny configuration changes |
| Turns | turn.start | observe the turn beginning |
| Turns | turn.step | async generator per model request: change model or effort, or answer without calling the model; result.usage and serverToolUses visible |
| Turns | turn.complete | sees isAborted, answer, usage, agentId; can return text |
| Session | session.start | once per loaded mod before the first prompt, again after a reload; not after /clear, /resume, /branch; the first is awaited |
| Session | session.end | exit, /clear, resume, logout, prompt_input_exit, other; all hooks share 1.5 s |
| Session | session.compact | trigger manual / auto / plugin / precompute; rewrite instructions or messages, answer with own messages (replaces the transcript), or skip |
| Session | session.append | rewrite text and tool_result content of each row before it is stored |
| Session | session.receive / session.send | consume or rewrite an incoming message (origin kinds include peer messages and scheduled triggers); intercept outgoing |
| Session | session.attach, session.detach, session.measure (after each turn and on rate-limit changes) | observe |
| Agents | agent.offer (withhold an agent type), agent.spawn (change model or deny) | not re-fired when SendMessage resumes an agent |
| UI | ui.render, ui.resolve, ui.press, ui.input, ui.select, ui.focus, ui.scroll, ui.close, ui.message, ui.fault | draw or redraw sites, handle input |
| Other mods | plugin.register | refuse another mod from loading (sees its tier and its uses.calls list) |
| Engine | engine.create | add a namespace |
| Telemetry | telemetry.log, telemetry.mark | need the {to:'collector'} matcher |
| Settings hooks | classic.<SettingsHookEvent> (e.g. classic.SessionStart, classic.Stop, classic.PreCompact) | receive the same stdin JSON a settings hook gets |

## 3. Native tools, programmatic commands, turns, waking, timers

- DOC. Register native tools: $.tool.register adds a tool Claude can call; the mod answers it in a tool.call hook.
  $.command.register adds a slash command; $.agent.register adds a subagent type. Source: api.md, Add a command /
  Add a tool; reference.md, Mods API methods.
- TYPES. $.command.run({command, args}) runs a slash command as if the person typed it, built-ins included; it is
  queued and runs once the session is idle. It rejects an unknown name, a call from inside a hook the turn is
  waiting on, a call after Stop, or a host limit. $.command.list returns built-in, plugin and MCP commands.
  Source: index.d.ts lines ~3142-3170 and CommandRunInput/CommandRunResult ~1790-1900.
- UNVERIFIED. Whether /clear, /reload-plugins (and /model, /login) actually execute through $.command.run. Neither
  the docs nor the types list which built-ins are allowed, and the local quickstart flags even
  $.command.run({command:'compact'}) as unverified (${CLAUDE_PLUGIN_ROOT}/skills/mods-tutorial-quickstart/references/traps-table.md).
  This is the single gating fact for removing keystroke injection. Probe: a throwaway mod with a /probe-clear
  command whose command.run hook calls $.command.run({command:'clear', args:''}) after the turn ends, loaded with
  claude --plugin-dir and claude --debug; check whether the transcript clears and session.end fires with reason
  clear. Repeat with reload-plugins.
- TYPES and DOC. $.session.compact({instructions}) performs the same compaction /compact performs, between turns;
  it rejects while a turn runs; the resulting session.compact event carries trigger plugin. Source: index.d.ts
  ~2915-2945 and ~11320-11435; reference.md, Session.
- TYPES and DOC. $.tool.call({tool, ...input}) calls any built-in or MCP tool through the normal permission check,
  dialog included. Source: index.d.ts ~3089-3135; api.md.
- TYPES and DOC. $.prompt.submit({text, asUser?}) waits until the session is idle, then starts a new turn. Without
  asUser Claude sees a line naming the mod as the sender. This is how a mod wakes an idle session.
  Source: index.d.ts ~3005-3035; api.md.
- DOC (live only, v2.1.304). After the user presses Esc or Stop, $.prompt.submit, $.command.run, $.agent.spawn,
  $.session.send, and $.tool.call of Bash with run_in_background, Monitor and CronCreate are refused until the
  user's next input, and anything already queued is dropped; a toast tells the user a mod cannot resume work after
  Stop. The suggested pattern is to retry from turn.complete. Source: api.md, after an interruption.
- UNVERIFIED. Whether a turn ended by an API error or a 429 counts as a Stop for that refusal. Only user Stop is
  documented. This decides whether a mod can resume work on its own after a rate-limit or API-error stop.
- DOC. Timers: $.clock.now, sleep, after, every. Timers run between turns and do not start a turn by themselves;
  they stop when the module reloads; a callback that throws is logged to the debug log and the timer keeps running.
  Source: api.md, Run work in the background.
- TYPES. The origin kind scheduled-trigger (a scheduled task, routine or /loop firing its stored prompt) exists in
  prompt.submit's e.origin union (index.d.ts ~9317-9319) and in SessionReceiveOrigin, the inbound-delivery origin
  for session.receive (index.d.ts ~12005-12016, described as classified by the bridge). So a prompt.submit hook can
  in principle recognise, rewrite or drop a cron-fired prompt. UNVERIFIED: whether a local CronCreate fire reaches
  session.receive at all (the type comment ties that event to bridge deliveries), and whether dropping it really
  avoids the model turn's cost; test.md shows only a peer-send-message origin.
- DOC. $.session.send sends a message another session, subagent or teammate reads. Source: admin.md calls table.
- DOC. After a worker respawn session.start runs again, but from v2.1.292 an earlier $.prompt.submit,
  $.command.run or $.agent.spawn is not repeated. Source: troubleshoot.md.

## 4. Rewriting context

- DOC. System prompt: prompt.compose (whole section list) and prompt.section (each section). Reminders:
  prompt.attachment. First-message context: prompt.context. @-mentions: prompt.mention. Skill text: skill.prompt.
- DOC. Tool results: tool.call can answer with its own result, or withhold a result after the tool ran.
- DOC. Stored transcript rows: session.append rewrites text and tool_result content before storage.
- DOC. Compaction: a session.compact hook can rewrite the instructions or messages, skip the compaction, or answer
  with its own messages, which replace the transcript; a message without the engine's handle is rebuilt from its
  role, text and tool blocks.
- DOC. Changing these between requests invalidates the prompt cache.
- DOC. $.session.messages returns the newest 4,096 entries.
  Sources: reference.md, Prompts and what Claude reads, Session; events.md.

## 5. UI a mod can add

- DOC. A pane (dock sidebar, or inline above the prompt in a narrow terminal); the band above the prompt, shared by
  all mods; a status line under the prompt; toasts; dim log lines in the transcript ($.ui.log, also to the debug
  log); terminal notifications ($.ui.notify, live only); $.ui.ask (holds a tool call on a question; rejects in -p);
  $.ui.copy, selection, blit.
- DOC. Restyle existing render sites: UserMessage, AssistantMessage, ToolUse, ToolResult, ToolGroup, CommandOutput,
  AskUserQuestion, Spinner, ToolProgress, TurnDuration, InfoNotice, SessionMode, PromptHint. Never the permission
  prompt.
- DOC. Elements: Box, Text (typography and spacing props from v2.1.299, live), Button, Link, Code, Markdown, Input,
  Select, Svg (Desktop and VS Code, not terminal), Client, Raster and Image (terminal only).
- DOC. A pane opened without user action needs 144 columns, 110 once the user has opened it once. Redraws are capped
  at 10 per second (30 for some terminal sites).
- DOC (live). The user can collapse the band to one row (Ctrl+X then Ctrl+A, or the [-] mark); it stays collapsed
  even after /clear, and a mod cannot detect or undo that, so the band must not be the only place for something
  the user has to answer.
  Sources: interface.md, Pick where to draw, When the user collapses the band, How often a site can redraw;
  reference.md, Render sites, Elements.

## 6. State, persistence, access, limits, error isolation

- DOC. Module variables reset on every reload. $.state lasts for the session, survives module reloads, resets on
  /clear, /resume and /branch; reload values after those in a classic.SessionStart hook. $.store is a per-plugin JSON
  key-value file under ~/.claude/plugins/store/, shared by every session on the machine, 4 MiB, get-then-set is not
  atomic (concurrent sessions race), and it is deleted after cleanupPeriodDays with no session using it.
  Source: interface.md, Keep state, Load a saved value again after /clear, Save from more than one session.
- DOC. Access: $.fs (read, write — not atomic, list, exists, stat, ancestors), $.process.run and $.process.spawn
  (as the user), $.http.fetch, $.mcp.call and $.mcp.connect (only the plugin's own manifest servers), $.env.get/set
  (set affects every later command and MCP server), $.settings.read, $.model.complete / fork / classify (spends the
  user's plan), $.audio. Network policy: an org WebFetch block also blocks $.http.fetch, but a WebFetch deny rule or
  CLAUDE_CODE_DISABLE_WEB_FETCH does not; nothing covers programs started with $.process.run.
  Source: api.md; admin.md, Know which controls still apply.
- DOC. Limits: a hook's own time 10 s (prompt.edit 50 ms, a .catch handler 1 s); $.process.run 30 s default, 10 min
  max; $.model.complete maxTokens 1024 default, up to 64k; $.fs read/write 4 MiB; $.http.fetch body 4 MiB, 30 s, 5
  redirects; 2,000 nested scopes; command/tool/subagent/pane names 64 characters; claude plugin test 5 s per test.
  Source: reference.md, Limits.
- DOC. Errors: a hook that throws or times out is skipped and the session continues (fails open); a .catch handler
  lets a gating hook fail closed. A mod that crashes or blocks the shared worker is unloaded; after three crashes
  that cannot be traced to one mod, every non-built-in mod is off until /reload-plugins or a new session. Before
  v2.1.289 a render throw ended the session. Source: troubleshoot.md; events.md, Handle a hook that fails;
  admin.md, Enforce a policy.

## 7. Does a mod run with no session open?

- DOC. A mod lives inside a running Claude Code process: register runs when the plugin loads into a session,
  session.start fires per process per load, timers die with the module, and claude plugin test runs with no session
  but only against stubs. Source: reference.md, Session; api.md, timers; test.md.
- INFERRED. No documented mechanism runs mod code when no Claude Code session is open. The only machine-wide piece
  is $.store, which is passive storage. A mod therefore cannot do the work of a machine-wide daemon (for example
  plugin updates, OAuth keepalive and rotation); it can only do per-session work. Several open sessions would each
  run their own copy of a mod timer, so any fleet-wide chore needs its own election through $.store, which is not
  atomic.

## 8. Interaction with hooks, plugins, skills, agents, MCP; distribution

- DOC. Settings hooks keep running alongside mods; a mod observes them as classic.* events. Skills, agents, commands
  and MCP servers can ship in the same plugin; a mod can rewrite skill text (skill.prompt), withhold or redirect
  agents (agent.offer, agent.spawn), register agents ($.agent.register), call MCP tools ($.mcp.call, own servers).
  Source: overview.md, Compare; admin.md.
- DOC. Distribution is the plugin path: a marketplace (own repo, public, or Anthropic's directory), a directory or
  zip, or org managed settings. Installed plugins are cached by version, so develop against --plugin-dir (hot
  reload) and bump the version to update installs. Plugin names that look like Anthropic's (for example starting
  with claude-) fail validation. A mod copied from GitHub, git, URL or npm counts as a user's mod even when managed
  settings enable it; only an admin-owned local directory marketplace counts as the org's.
  Source: create.md, Share your mod; admin.md, Install your organization's mods.
- DOC. Mods Claude writes go to ~/.claude/dev-mods/<session-id>/, load only in that session after approval, and do
  not load in -p, dontAsk mode, untrusted workspaces, --safe-mode, --bare, or under disableAllHooks or
  disableSideloadFlags. Source: create.md, Ask Claude for a mod.
- DOC. Development: --plugin-dir with hot reload; CLAUDE_CODE_PLUGIN_DIRS and CLAUDE_CODE_PLUGIN_DIR_WATCH;
  interactive loads write .claude-plugin/types/ (claude-code, claude-code-tools, claude-code-mcp, per-dependency
  dirs, tsconfig.json). claude plugin test runs *.test.ts with claude-code/testing, stubs, mock.clock, mock.store,
  mock.env, mock.session (v2.1.293+), $.ui.mount for drawings, tier() and inline plugins for policy mods; exits 1
  on failure, so it works in CI. Source: create.md; test.md.
  - NOTE. The chapters' short test fires (for example `$.command.run` or `turn.complete` with fewer fields, `{ value: undefined }` from a stubbed `command.register`) run under `claude plugin test` but fail `tsc`; see the trap table in `mods-tutorial-quickstart`.

## 9. Stability, limitations, troubleshooting

- TYPES. The declaration file header marks the surface EARLY ACCESS and says it may change between releases without
  notice. DOC. Events and methods change across releases and the generated types win over the pages (create.md).
- DOC. Remote rollout switch can disable installed mods (overview.md, troubleshoot.md).
- DOC. Troubleshooting starts with claude --debug and the debug log (hooks module lines with tier, refusal lines,
  guard messages); live-only entries include the previous version being unloaded on reload, stack overflows while
  parsing or linking, and a band replaced by another mod. Source: troubleshoot.md.

## 10. Local copies versus the live docs

| Topic | Local 0.5.0 chapters (as of v2.1.290) | Live docs |
|---|---|---|
| VS Code drawing | not drawn | drawn from extension 2.1.299 (2.1.304 without feature flags); reference has a VS Code column |
| prompt.autocomplete event | absent | present |
| $.ui.notify | absent | present |
| tool.check isReadOnly / read-only matcher | absent | v2.1.304 |
| next.error.cause rewritten | absent | v2.1.300 |
| Box/Text typography and spacing | absent | v2.1.299 |
| skill.prompt source and frontmatter | absent | v2.1.299 |
| Calls after Esc/Stop refused, queue dropped, retry from turn.complete | absent | v2.1.304 |
| Mod approval versus ask rules and PreToolUse | mod approval passes | blocked when the guard loads (managed settings or Team/Enterprise login); allowModsToOverrideDenyRules |
| Band collapse | absent | documented, undetectable by a mod |
| Troubleshoot entries (previous version unloaded, stack overflow while linking, band replaced) | absent | present |
| You-should-know mod | on | off until turned on |

## 11. Common mechanism to mods mapping

| mechanism | Mods equivalent |
|---|---|
| Per-session cron heartbeat (CronCreate) firing a model turn | $.clock.every in the mod, running background checks via $.process.run between turns with zero model turns; $.prompt.submit only when Claude is needed; a prompt.submit hook may recognise a scheduled-trigger origin |
| Keystroke injection of /compact | $.session.compact({instructions}) |
| Keystroke injection of /clear | $.command.run({command:'clear'}) |
| Keystroke injection of /reload-plugins | $.command.run({command:'reload-plugins'}) |
| Clear-and-inject handoff | answer session.compact with own messages; prompt.context / prompt.attachment for the bootstrap; DOC; strong fit, no /clear needed |
| Rate-limit / post-compaction auto-resume | $.prompt.submit from turn.complete or a timer |
| Settings hooks (secret and injection guards on tool calls, SessionStart, PreCompact) | tool.call / tool.check / prompt.submit hooks, or keep the settings hooks and observe them as classic.* |
| Machine-wide daemon (plugin updates, OAuth keepalive, rotation) | none; INFERRED impossible: no mod code runs without a session; use a separate background process |
| Background checks that report problems | $.process.run / $.fs in timers; report via $.ui.status, toast, log, notify |
| State shared across sessions | $.store (4 MiB, machine-shared, non-atomic) or keep files via $.fs (writes not atomic) |
| Skills and agents | stay as skills and agents, shipped in the same plugin; skill.prompt and agent.spawn can adjust them |
| A long-term memory store | stays a separate tool, outside the mod; called through $.process.run if a mod needs it |

## Risks and limits to plan around

- Not sandboxed; runs as the user; one hooks worker shared by every installed mod. A blocking hook unloads the mod;
  three untraceable crashes unload every non-built-in mod for the session.
- Early access: the surface may change without notice; Anthropic can switch installed mods off remotely; managed
  settings (allowManagedModsOnly, disableAllHooks, allowManagedHooksOnly) can turn a mod off on any org machine, and --safe-mode or --bare do the same per session.
- Without the guard (API key, Bedrock, Google Cloud's Agent Platform, Foundry, long-lived OAuth token, no managed settings) a mod's tool
  approval bypasses ask rules; with it, it does not. A guard mod must not rely on either behaviour.
- Between sessions race conditions.
- Multiple mods can occupy too much screen space. Side panels may need tabs for showing multiple mods using panels.
- Sound effects produced by mods events can overlap and confuse the user if made without a coordinated sound design. User should have the option to turn them off or customize the volume.
