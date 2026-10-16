## MODS OVERVIEW

## Table of Contents

* [What a mod can do](#what-a-mod-can-do)
* [Install, update, or try a mod](#install-update-or-try-a-mod)
  * [Install or update a mod](#install-or-update-a-mod)
  * [Try a sample mod](#try-a-sample-mod)
* [Decide whether to trust a mod](#decide-whether-to-trust-a-mod)
  * [What a mod can reach](#what-a-mod-can-reach)
  * [List what a mod does before you install one](#list-what-a-mod-does-before-you-install-one)
* [Turn mods on or off](#turn-mods-on-or-off)
  * [See which mods a session loaded](#see-which-mods-a-session-loaded)
* [How a mod works](#how-a-mod-works)
  * [What a hook can do with an event](#what-a-hook-can-do-with-an-event)
  * [Where mods run](#where-mods-run)
* [Control mods for your organization](#control-mods-for-your-organization)
* [Compare mods, settings hooks, skills, and MCP servers](#compare-mods-settings-hooks-skills-and-mcp-servers)
* [Mods built into Claude Code](#mods-built-into-claude-code)
  * [Read the source of built-in mods](#read-the-source-of-built-in-mods)
* [Related Topics](#related-topics)

## Chapter content

> Mods add panes, commands, and tool-call rules to Claude Code; this chapter covers capabilities, creation, installation, and runtimes.

A mod is a [plugin](https://code.claude.com/docs/en/plugins/overview) of JavaScript/TypeScript event handlers running inside Claude Code. On a tool call, submitted prompt, or interface draw, a handler can observe, rewrite, or take over the event. Example: a pane charting context fullness after each request. See [How a mod works](https://code.claude.com/docs/en/plugins/mods/overview#how-a-mod-works) for files and a complete example.

<Note>
  Existing [hooks](https://code.claude.com/docs/en/hooks) run configured shell commands, HTTP requests, or prompts from settings files; mod handlers run functions inside Claude Code. Both are called hooks: here, "hook" means a mod handler; "settings hook" means the settings-file kind.
</Note>

### What a mod can do

Settings hooks, skills, status lines, and MCP servers run outside Claude Code (scripts, text, or tools). Mods run inside and can:

* **Draw usable UI**: transcript-side panes or bands above the prompt, with tabs, buttons, and text fields. See [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface).
* **Redraw existing UI**: replace/restyle tool-call rows, the spinner, or question dialogs. See [Change what Claude Code already draws](https://code.claude.com/docs/en/plugins/mods/interface#change-what-claude-code-already-draws).
* **Intercept tools/requests**: hold a tool call for a user question, answer without running it, or route one request to another model. See [Guard or change a tool call](https://code.claude.com/docs/en/plugins/mods/events#guard-or-change-a-tool-call) and [Follow a turn](https://code.claude.com/docs/en/plugins/mods/events#follow-a-turn).
* **Run commands directly**: `/command` executes your function immediately, without a Claude turn, even while Claude works. See [Add a command or a tool](https://code.claude.com/docs/en/plugins/mods/api#add-a-command-or-a-tool).
* **Share hook state**: file variables let one hook count tool calls or record request token usage and another display the count beside the spinner or chart usage in a pane. See [React to events](https://code.claude.com/docs/en/plugins/mods/events).

Mods work in the CLI and Desktop app's Code tab; [Where mods run](https://code.claude.com/docs/en/plugins/mods/overview#where-mods-run) covers VS Code, `claude -p`, and cloud sessions. Before writing one, [compare](https://code.claude.com/docs/en/plugins/mods/overview#compare-mods-settings-hooks-skills-and-mcp-servers) whether a settings hook, skill, or MCP server suffices. Organization administration: [Manage mods for your organization](https://code.claude.com/docs/en/plugins/mods/admin).

### Install, update, or try a mod

Choose:

* **Use an existing mod**: built-in features include `/diff`. See [Mods built into Claude Code](https://code.claude.com/docs/en/plugins/mods/overview#mods-built-into-claude-code).
* **Make one**: describe it in a session for Claude to write; see [Ask Claude for a mod](https://code.claude.com/docs/en/plugins/mods/create#ask-claude-for-a-mod), or [write one yourself](https://code.claude.com/docs/en/plugins/mods/create#write-a-mod-yourself) to learn its code.
* **Install one**: [Install or update a mod](https://code.claude.com/docs/en/plugins/mods/overview#install-or-update-a-mod), or [try a sample](https://code.claude.com/docs/en/plugins/mods/overview#try-a-sample-mod)

#### Install or update a mod

<Warning>
  A mod is code that runs with your permissions. It can read and write your files, start processes, and make network requests. Install mods only from authors and marketplaces you trust. See [Decide whether to trust a mod](https://code.claude.com/docs/en/plugins/mods/overview#decide-whether-to-trust-a-mod).
</Warning>

A mod installs as a marketplace plugin: `plugin@marketplace`. For `token-chart` from `your-org`:

* Session: `/plugin install token-chart@your-org`.
* Shell: `claude plugin install token-chart@your-org`.

[Install plugins](https://code.claude.com/docs/en/plugins/install) covers marketplaces, scopes, VS Code, Desktop, and [updates](https://code.claude.com/docs/en/plugins/install#keep-plugins-updated); these apply unchanged to mod-containing plugins.

After shell installation/update, run `/reload-plugins` in any open session; otherwise the mod loads at next startup.

#### Try a sample mod

Anthropic's [`claude-code/mods` samples in `claude-code-playground`](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods) are complete, unsupported, as-is plugins; each README explains its construction.

* [`token-weather`](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather): context-window forecast above the prompt.
* [`blast-radius`](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius): holds risky shell commands (`rm -rf`, force push), previews effects, and offers proceed/cancel buttons.
* [`replay-theater`](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater): `/replay` steps through the last turn's file edits.

Samples run with your permissions; [list hooks and calls](https://code.claude.com/docs/en/plugins/mods/overview#list-what-a-mod-does-before-you-install-one) before loading. Clone, then [load its directory for one session](https://code.claude.com/docs/en/plugins/create#load-a-directory-or-archive-for-one-session) using `--plugin-dir`; [check loaded mods](https://code.claude.com/docs/en/plugins/mods/overview#see-which-mods-a-session-loaded).

To keep a sample, [add the clone's `claude-code/mods` as a marketplace](https://code.claude.com/docs/en/plugins/install#add-a-marketplace), then install from `claude-code-playground-mods`. Moving/deleting the clone stops loading: the marketplace points to it.

### Decide whether to trust a mod

Mods run inside Claude Code with your permissions; trust both authors and [marketplaces](https://code.claude.com/docs/en/plugins/security).

#### What a mod can reach

A loaded mod can:

* **Act as you**: read/write anywhere your account can, start programs, make network requests.
* **Read secrets**: environment variables and settings files, including API keys in either.
* **See the session**: every submitted prompt and Claude tool call.
* **Change the session**: rewrite prompts/tool calls, submit prompts as you, message other sessions.
* **Act without asking**: approve tool calls before you're asked.
* **Spend usage**: call models on your plan/API key.

Mods are not sandboxed: [sandboxing](https://code.claude.com/docs/en/sandboxing) isolates Claude's Bash commands, not mod-started processes.

A mod can approve calls that `ask` rules would prompt for or your `PreToolUse` hooks blocked. [Extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks) covers approval scope, including when `deny` refusals can be overridden.

Mods can restyle much of the UI, but cannot restyle the permission prompt or change what it shows.

#### List what a mod does before you install one

Before installation, inspect handled events and requested actions (for example, file reads/network requests) without executing the mod. Obtain its files (for example, clone), then validate its directory in your shell:

```bash theme={null}
claude plugin validate ./some-mod
```

Output `hooks:`/`calls:` lists handled events/requested actions; [Review what a mod can do](https://code.claude.com/docs/en/plugins/mods/admin#review-what-a-mod-can-do) explains output and calls to inspect.

### Turn mods on or off

Mods default on. Minimum Claude Code versions: terminal v2.1.287; Desktop's bundled copy v2.1.286. Check where you use mods:

* **Terminal**: shell `claude --version`; [update older versions](https://code.claude.com/docs/en/setup#update-claude-code).
* **Desktop**: local Code-tab session `/status`, **Claude Code** row (example `2.1.286`); [update Desktop if older](https://code.claude.com/docs/en/desktop#claude-code-version-in-the-code-tab).

Choose scope/duration to disable; undo the same change to re-enable:

* **One mod**: disable or uninstall its plugin from the [**Installed** tab in `/plugin`](https://code.claude.com/docs/en/plugins/install#manage-installed-plugins)
* **Every installed mod, for one session**: start Claude Code with [`--safe-mode`](https://code.claude.com/docs/en/cli-reference#cli-flags), which also disables your other customizations
* **Every mod you installed, in every session**: set [`"disableAllHooks": true`](https://code.claude.com/docs/en/settings-reference#disableallhooks) in `~/.claude/settings.json`. Your settings hooks and custom status line stop too. What your organization manages keeps running.

Organization administrators can also restrict loading; see [Stop user-installed mods from loading](https://code.claude.com/docs/en/plugins/mods/admin#stop-user-installed-mods-from-loading).

`disableAllHooks` and managed `allowManagedModsOnly` stop mod code, not the rest of its plugin: it stays installed; skills, commands, agents, and MCP servers load. Other flags/settings reach further. [`disableAllHooks`](https://code.claude.com/docs/en/settings-reference#disableallhooks) and [What runs under `allowManagedHooksOnly`](https://code.claude.com/docs/en/settings-reference#what-runs-under-allowmanagedhooksonly) detail plugin/settings-hook effects.

Diagnose loading eligibility: [Check whether mods can load](https://code.claude.com/docs/en/plugins/mods/troubleshoot#check-whether-mods-can-load).

<Note>
  Remove early-access `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`: v2.1.287+ ignores it; `0` does not disable mods.
</Note>

#### See which mods a session loaded

In a terminal session, `/plugin` shows a dim count/name line below the tabs (example `1 mod active · first-mod`). For missing installed mods, see [Find out why a mod does nothing](https://code.claude.com/docs/en/plugins/mods/troubleshoot#find-out-why-a-mod-does-nothing).

### How a mod works

A mod [plugin](https://code.claude.com/docs/en/plugins/overview) registers event handlers (hooks); Claude Code calls them on events such as tool calls or spinner draws. A small mod has three files:

```text theme={null}
first-mod/
├── .claude-plugin/
│   └── plugin.json
└── hooks/
    ├── hooks.json
    └── register.js
```

* **`plugin.json`**: the plugin's [manifest](https://code.claude.com/docs/en/plugins/manifest-reference)
* **`hooks.json`**: [points to your code file](https://code.claude.com/docs/en/plugins/mods/reference#files)
* **`register.js`**: [your code](https://code.claude.com/docs/en/plugins/mods/create#write-a-mod-yourself), called the hooks module. It tells Claude Code which events to run your functions on.

Complete `register.js`: counts Claude's tool calls and shows them beside the working spinner, e.g. `Thinking · tool calls: 3…`.

```javascript hooks/register.js theme={null}
// The count, shared by the two hooks below
let calls = 0

// Claude Code calls this once when the mod loads
export function register(on) {
  // Runs each time Claude is about to use a tool
  on('tool.call', async ($, e, next) => {
    calls += 1
    // Ask Claude Code to draw the interface again, so the new count shows
    $.ui.invalidate('ui.render')
    // Let the tool run as usual
    return next(e)
  })

  // Runs each time Claude Code draws the spinner
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    // Keep Claude Code's spinner, with the count added after its word
    return next({ ...e, props: { ...e.props, suffix: ' · tool calls: ' + calls + '…' } })
  })
}
```

Both hooks share file-level `calls`:

* [`tool.call`](https://code.claude.com/docs/en/plugins/mods/reference#tools): before each Claude tool call, increments `calls`, requests a redraw, and lets the tool run unchanged.
* [`ui.render`](https://code.claude.com/docs/en/plugins/mods/reference#interface): on each spinner draw, retains the original spinner and appends the count after its word.

Recording: while Claude lists a directory and reads two files, the spinner above the prompt progresses `Thinking · tool calls: 1…`, `2…`, `3…`.

<Frame>
  <video autoPlay muted loop playsInline controls className="w-full dark:hidden" src="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-overview-light.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=00a18aa0743b59a700f0275ce226e6d1" aria-label="In a Claude Code session, the prompt 'list the files here and read the README' is typed and sent. While Claude works, the spinner reads 'Thinking · tool calls: 1', then 2, then 3, as Claude lists the files and reads two of them." data-path="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-overview-light.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=00a18aa0743b59a700f0275ce226e6d1" />

  <video autoPlay muted loop playsInline controls className="w-full hidden dark:block" src="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-overview-dark.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=d5223da2fef16ceaaa214a36d72c0536" aria-label="In a Claude Code session, the prompt 'list the files here and read the README' is typed and sent. While Claude works, the spinner reads 'Thinking · tool calls: 1', then 2, then 3, as Claude lists the files and reads two of them." data-path="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-overview-dark.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=d5223da2fef16ceaaa214a36d72c0536" />
</Frame>

#### What a hook can do with an event

Hooks run before Claude Code acts on an event, choosing:

* **Observe**: record, then continue unchanged (`tool.call` above).
* **Rewrite**: modify before continuing (`ui.render` appends the count).
* **Answer**: handle directly, suppressing usual behavior (for example, refuse a command).

Outside its own code, a hook must use the mods API to draw, add commands, call models, read files, start processes, or make network requests. This exclusive path enables pre-install [listing of mod actions](https://code.claude.com/docs/en/plugins/mods/overview#list-what-a-mod-does-before-you-install-one).

Choice examples: [React to events](https://code.claude.com/docs/en/plugins/mods/events#how-a-hook-handles-an-event). Available calls: [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api).

#### Where mods run

Hooks run wherever the plugin loads; only terminal/Desktop render panes, bands, or replaced rows. Runtime support:

| Where you run Claude Code | Hooks run | What the mod draws appears |
| :- | :- | :- |
| `claude` in a terminal, including an editor's integrated terminal and the JetBrains plugin | Yes | Yes |
| The Code tab of the Desktop app, except in a WSL session | Yes | Yes, except elements the [elements table](https://code.claude.com/docs/en/plugins/mods/reference#elements) marks terminal-only |
| A [WSL session](https://code.claude.com/docs/en/desktop-wsl) in the Desktop app | No, because plugins aren't available in WSL sessions | No |
| The VS Code extension's chat panel | Yes | No |
| `claude -p` and the [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) | Yes | No |
| [Remote Control](https://code.claude.com/docs/en/remote-control) from claude.ai or the mobile app | Yes, in the session on your machine | In the terminal on your machine |
| A [cloud session](https://code.claude.com/docs/en/claude-code-on-the-web) | Yes, for a plugin that [reaches the cloud session](https://code.claude.com/docs/en/cloud-environments#what-carries-over-from-your-setup) | No |

Drawing mods can detect their host app and fall back to transcript lines or command text replies where drawing is unavailable.

### Control mods for your organization

Administrators control whether/which mods run through [managed settings](https://code.claude.com/docs/en/managed-settings). [Manage mods for your organization](https://code.claude.com/docs/en/plugins/mods/admin) covers defaults, review, and custom policy-enforcing mods.

### Compare mods, settings hooks, skills, and MCP servers

Overlapping capabilities and selection criteria:

| | Mod | Settings hook | Skill | MCP server |
| :- | :- | :- | :- | :- |
| What it is | Functions in a plugin that Claude Code calls in its own process | A shell command, HTTP request, or prompt that Claude Code runs on a lifecycle event | A `SKILL.md` file of instructions Claude reads | An external process or service that gives Claude tools |
| What it can change | Tool calls, prompts, commands, turns, and what the interface draws | Whether a tool call or prompt goes ahead, a tool call's arguments and result, and context added for Claude | What Claude knows and does | Which tools Claude has |
| Can it draw in the interface | Yes | No | No | No |
| What you write | JavaScript or TypeScript | A script and a `settings.json` entry | Markdown | A server in any language |
| Pick it when | You want a pane, a band above the prompt, a custom command, or to rewrite an event | You want to block, allow, or log an event with a script you already have | You keep pasting the same instructions into chat | Claude needs to reach an external system |

See [Hooks](https://code.claude.com/docs/en/hooks), [Skills](https://code.claude.com/docs/en/skills), and [MCP](https://code.claude.com/docs/en/mcp). One plugin can contain all, including a mod, skill, and MCP server.

### Mods built into Claude Code

Built-in features appear in session `/plugin` -> **Installed** -> **Built-in**, under the names below. They cannot be updated/uninstalled; disable methods are in the last column. The [`mods active` line](https://code.claude.com/docs/en/plugins/mods/overview#see-which-mods-a-session-loaded) excludes them.

| Name in `/plugin` | What it does | Where it's on | How to turn it off |
| :- | :- | :- | :- |
| `cc-plugin-agents-md` | Loads `AGENTS.md` as project instructions | Every session, apart from [the ones that can't read `AGENTS.md`](https://code.claude.com/docs/en/memory#when-agents-md-support-is-unavailable) | Disable it in `/plugin`, or [choose which instruction files load](https://code.claude.com/docs/en/memory#choose-which-instruction-files-load) |
| `cc-plugin-diff` | Takes over [`/diff`](https://code.claude.com/docs/en/interactive-mode#review-changes-with-%2Fdiff) and draws its pane | Interactive terminal sessions | Disable it in `/plugin`. `/diff` stays, and Claude Code's built-in version of the command answers it. |
| `cc-plugin-plugin-authoring` | Gives Claude the [`plugin-authoring` skill](https://code.claude.com/docs/en/plugins/mods/create#ask-claude-for-a-mod) for writing mods. It holds a skill and no mod code. | Unless Anthropic has turned installed mods off remotely | Disable it in `/plugin` |
| `cc-plugin-sec-default` | Guards what your organization manages from the mods a user installs | [Where the guard loads](https://code.claude.com/docs/en/plugins/mods/admin#know-what-happens-by-default) | You can't. An administrator [sets the order](https://code.claude.com/docs/en/plugins/mods/admin#install-your-organizations-mods) in managed settings |
| `cc-plugin-telemetry` | Sends the analytics records that Claude Code and its built-in mods log | Wherever Claude Code's own analytics are on | Disable it in `/plugin`, or turn analytics off, for example with [`DISABLE_TELEMETRY`](https://code.claude.com/docs/en/env-vars) |
| `cc-plugin-you-should-know` | Runs a side agent that watches your back while Claude works on longer tasks. When it finds something worth knowing that you might miss, it shows you a note above the prompt. | Disabled by default. Listed in `/plugin` -> **Installed** -> **Show disabled** if available for your org. Enable with [`/plugin enable cc-plugin-you-should-know@builtin`](https://code.claude.com/docs/en/plugins/cli-reference#plugin-in-a-session). | Disable it in `/plugin` |

The settings and flags that stop installed mods, such as `disableAllHooks`, `--bare`, and `--safe-mode`, don't stop built-in mods.

#### Read the source of built-in mods

Some built-ins have public source in the Claude Code repository's [`mods` directory](https://github.com/anthropics/claude-code/tree/main/mods); each is a complete plugin with hooks module and tests:

* [`diff`](https://github.com/anthropics/claude-code/tree/main/mods/diff): the `/diff` pane, with buttons bound to keyboard actions and scrolling the mod handles itself
* [`agents-md`](https://github.com/anthropics/claude-code/tree/main/mods/agents-md): loads `AGENTS.md` as project instructions, with a [`userConfig`](https://code.claude.com/docs/en/plugins/components#user-configuration) option
* [`sec-default`](https://github.com/anthropics/claude-code/tree/main/mods/sec-default): the guard described in [Know what happens by default](https://code.claude.com/docs/en/plugins/mods/admin#know-what-happens-by-default), a model for a mod that enforces policy
* [`telemetry`](https://github.com/anthropics/claude-code/tree/main/mods/telemetry): adds methods that other mods can call, and ships their types

### Related Topics

* [Create a mod](https://code.claude.com/docs/en/plugins/mods/create): build one that counts tool calls, shows the count beside the spinner, and adds a command, and learn the edit and reload loop
* [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface): panes, the band above the prompt, buttons, text fields, and state
* [React to events](https://code.claude.com/docs/en/plugins/mods/events): tool calls, prompts, turns, and the order mods run in
* [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api): commands, tools, model calls, timers, and files
* [Test a mod](https://code.claude.com/docs/en/plugins/mods/test): automated tests that run without a session
* [Troubleshoot a mod](https://code.claude.com/docs/en/plugins/mods/troubleshoot): the reasons a mod does nothing, and the debug log
* [Manage mods for your organization](https://code.claude.com/docs/en/plugins/mods/admin): defaults, managed settings, reviewing a mod, and policy mods
* [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference): events, methods, elements, and limits

---
