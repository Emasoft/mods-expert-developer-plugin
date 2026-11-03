# mods-expert-developer-plugin

<!--BADGES-START-->
![Version](https://img.shields.io/badge/version-0.6.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
<!--BADGES-END-->

A Claude Code plugin that bundles two agents (an expert agent that plans and evaluates, and a forge agent that builds), a skills menu, 60 Claude Code documentation chapters plus one how-to (mods, plugins, hooks, skills, subagents, marketplaces, settings), and three reference-only mod tutorials with example code. Use it to create, fix, improve and evaluate Claude Code mods and plugins.

## Components

Agents:

- `mods-expert-developer-plugin:mods-expert-developer-agent` plans, evaluates and drives mod work: TRDD proposals, the PLAN, IMPLEMENT, VERIFY loop, delegation. It declares all 61 chapter skills in its frontmatter; Claude Code preloads the first 32.
- `mods-expert-developer-plugin:mods-forge-agent` is the hands-on builder: it creates, edits, fixes and debugs mods (hooks modules, commands, panes), one planned TRDD increment or one concrete fix/debug request per dispatch, tests them on both the terminal and Desktop surfaces, and returns a report path. It never commits, publishes or deletes. It preloads only the skills menu and loads each chapter on demand. It is pinned to Opus 5.5 (`model: claude-opus-5-5`), so every dispatch is billed at Opus rates whatever model the calling session runs; on Bedrock or Vertex that model ID differs and the harness may fall back to the inherited model.

Skills menu: the `mods-the-skills-menu` skill (`skills/mods-the-skills-menu/SKILL.md`) is the forge agent's only preload. It names every chapter skill once with its namespaced name, grouped by domain, plus the three reference-only tutorials in a group of their own and the four user-scope tool skills; the full per-skill entries are in `skills/mods-the-skills-menu/references/skills-catalog.md`. It is a catalogue of the chapters, not a chapter, so it has no row in the table below.

Skills: plugin skills are namespaced `mods-expert-developer-plugin:<skill>` and are reference-only (`user-invocable: false`). Sixty wrap a documentation chapter; `mods-doc-run-background-sessions` wraps an original community how-to.

| Skill | SKILL.md heading |
|---|---|
| mods-doc-add-components-to-a-plugin | ADD COMPONENTS TO A PLUGIN |
| mods-doc-official-marketplaces | ANTHROPIC MARKETPLACES |
| mods-doc-automate-actions-with-hooks | AUTOMATE ACTIONS WITH HOOKS |
| mods-doc-channels-reference | CHANNELS REFERENCE |
| mods-doc-cc-debug-mode | CLAUDE CODE DEBUG MODE |
| mods-doc-cc-native-memory-and-rules | CLAUDE CODE NATIVE MEMORY AND RULES |
| mods-doc-cc-settings-reference | CLAUDE CODE SETTINGS REFERENCE |
| mods-doc-cc-github-actions | CLAUDE GITHUB ACTIONS |
| mods-doc-cc-permissions-modes | CLAUDE PERMISSIONS MODES |
| mods-doc-cc-projects-directory-structure | CLAUDE PROJECTS DIRECTORY STRUCTURE |
| mods-doc-cc-security-plugin | CLAUDE SECURITY PLUGIN |
| mods-doc-code-intelligence-components-in-plugins | CODE INTELLIGENCE COMPONENTS IN PLUGINS |
| mods-doc-create-a-marketplace | Create a marketplace |
| mods-doc-cross-session-messaging-reference | CROSS SESSION MESSAGING REFERENCE |
| mods-doc-deep-links-reference | DEEP LINKS REFERENCE |
| mods-doc-dynamic-workflows-reference | DYNAMIC WORKFLOWS REFERENCE |
| mods-doc-headless-mode-reference | HEADLESS MODE REFERENCE |
| mods-doc-hooks-reference | HOOKS REFERENCE |
| mods-doc-how-to-host-a-marketplace | HOW TO HOST A MARKETPLACE |
| mods-doc-large-monorepo-plugin-development | HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) |
| mods-doc-install-and-manage-plugins | INSTALL AND MANAGE PLUGINS |
| mods-doc-loop-and-chron-reference | LOOP AND CHRON REFERENCE |
| mods-doc-manage-costs-of-a-plugin | MANAGE COSTS OF A PLUGIN |
| mods-doc-manage-mods-for-organizations | MANAGE MODS FOR ORGANIZATIONS |
| mods-doc-manage-plugins-from-cli | MANAGE PLUGINS FROM CLI |
| mods-doc-manage-plugins-in-organizations | MANAGE PLUGINS IN ORGANIZATIONS |
| mods-doc-marketplace-manifest-reference | MARKETPLACE MANIFEST REFERENCE |
| mods-doc-mcp-servers-reference | MCP SERVERS REFERENCE |
| mods-doc-models-configuration | MODELS CONFIGURATION |
| mods-doc-mods-and-events | MODS AND EVENTS |
| mods-doc-mods-api | MODS API |
| mods-doc-mods-basic-examples | MODS BASIC EXAMPLES |
| mods-doc-mods-development | Mods Development |
| mods-doc-mods-interfaces | MODS INTERFACES |
| mods-doc-mods-overview | MODS OVERVIEW |
| mods-doc-mods-reference | MODS REFERENCE |
| mods-doc-mods-testing | MODS TESTING |
| mods-doc-mods-troubleshooting | MODS TROUBLESHOOTING |
| mods-doc-native-toolset-reference | NATIVE TOOLS REFERENCE |
| mods-doc-output-style-reference | OUTPUT STYLE REFERENCE |
| mods-doc-platforms-overview | PLATFORMS OVERVIEW |
| mods-doc-plugin-commands-reference | PLUGIN COMMANDS REFERENCE |
| mods-doc-plugin-manifest-reference | PLUGIN MANIFEST REFERENCE |
| mods-doc-plugin-recomendations | PLUGIN RECOMENDATIONS |
| mods-doc-plugins-creation | PLUGINS CREATION |
| mods-doc-plugins-depending-on-other-plugins | PLUGINS DEPENDING ON OTHER PLUGINS |
| mods-doc-plugins-security-and-trust | PLUGINS SECURITY AND TRUST |
| mods-doc-prompt-caching-reference | PROMPT CACHING REFERENCE |
| mods-doc-publish-a-plugin | PUBLISH A PLUGIN |
| mods-doc-recomended-plugins-to-create-plugins | RECOMENDED PLUGINS TO CREATE PLUGINS |
| mods-doc-run-background-sessions | RUN BACKGROUND SESSIONS |
| mods-doc-sessions-reference | SESSIONS REFERENCE |
| mods-doc-settings-precedence-and-scopes | SETTINGS PRECEDENCE AND SCOPES |
| mods-doc-skills-reference | SKILLS REFERENCE |
| mods-doc-status-line-customization | STATUS LINE CUSTOMIZATION |
| mods-doc-subagents-reference | SUBAGENTS REFERENCE |
| mods-doc-test-plugins-with-evals | TEST PLUGINS WITH EVALS |
| mods-doc-tracing-the-origin-of-a-plugin | TRACING THE ORIGIN OF A PLUGIN |
| mods-doc-troubleshooting-cc-setup | TROUBLESHOOTING CLAUDE SETUP |
| mods-doc-troubleshooting-plugins | TROUBLESHOOTING PLUGINS |
| mods-doc-worktrees-reference | WORKTREES REFERENCE |

## Tutorials

Three tutorial skills are reference only: they hold worked examples for agents, and they do not replace the chapter skills, which stay authoritative and win on any disagreement, except that for API names and type shapes (event, method and argument names and their TypeScript types) the type files your running build generates win, because events and methods change across releases, while for behaviour the types cannot express (ordering, timing, what `next` does) the chapters still win. The copied examples (`hello-mod`, `redact-output`, `dice-tool`, `branch-band`, `notes-pane`) and the upstream tutorial text are adapted from BeLazy167/claude-mods-skill (MIT, see NOTICE). The `turn-timer`, `git-poller` and `protect-files` examples, the house conventions, the quickstart scripts and the text that describes them were written for this plugin. The example code under each tutorial's `examples/` folder is for reading and copying into your own project; it is never installed or loaded as part of this plugin. The quickstart scripts are tools to run, not examples to read; the example code stays reference only.

- `mods-tutorial-quickstart`: a step-by-step checklist for a first mod that names the chapter skill for each step, the traps the chapters do not settle (marked UNVERIFIED where they do not confirm them), an index of the example mods, the house conventions, and the `check-mod.sh`, `new-mod.sh`, `keep-mod.sh` and `plan-diff.sh` scripts.
- `mods-tutorial-call-intercept-mods`: the `hello-mod`, `redact-output`, `dice-tool` and `protect-files` example mods, which block, rewrite and answer tool calls, add a tool, and guard paths.
- `mods-tutorial-interface-mods`: the `branch-band`, `notes-pane`, `turn-timer` and `git-poller` example mods, which draw a band above the prompt, a pane opened by a command, a status line, and a band kept current by a git poller.

More mods written by others are listed at [timoncool/givememod](https://github.com/timoncool/givememod). This plugin has not reviewed them: before you load one, go through the review checklist and threat model in the `mods-tutorial-quickstart` skill.

## Requirements drafts mod

The `requirements-drafts` mod (`hooks/requirements-drafts/`) saves messages you send as requirements drafts: one Markdown file per message in `~/.claude/requirements-drafts/`. Drafts are plain text in your home folder, and every agent and session on the machine can read them.

Setup is installing and enabling the plugin; nothing else is needed. The mod is on by default, and `/requirements-drafts off` turns it off.

A dim line, `+ save as requirement draft`, appears under every message you send. That was checked live for messages sent with Enter at the terminal; the code also accepts messages from the Desktop app and from Remote Control, which have not yet been confirmed on a live session. It does not appear under assistant replies, task notifications or messages from other sessions, and it may not appear under messages from conversations stored before Claude Code recorded where a message came from. Clicking the line saves the message; after a save it reads `✓ saved as requirement draft <id>`.

In the classic (non-fullscreen) terminal view a click on the line is not delivered on Claude Code 2.1.309 (measured). Use fullscreen (`CLAUDE_CODE_NO_FLICKER=1`) or the commands. Three commands do the rest:

- `/requirements-drafts [on|off]` sets the switch; with no argument it toggles.
- `/requirements-drafts-save` saves your last sent message.
- `/requirements-drafts-pick` opens a picker of your recent messages and saves the one you choose.

Two skills, which you or Claude can invoke, read the drafts back: `mods-requirements-drafts-list` (newest first, for this project or `--all`) and `mods-requirements-drafts-search` (every keyword must match).

The recent list resets on `/clear`, `/resume` and fork, and on a module reload. Messages that look like they hold a secret are refused, with a toast that says why. The check looks for API-key and token shapes (including Stripe, GitLab, npm, Hugging Face, SendGrid and Slack app tokens, and Slack, Discord and Telegram webhook or bot URLs), JWTs, private key blocks (PEM, PGP and PuTTY), credentials in URLs, Basic and Token authorization headers, Docker config `auth` entries, passwords in `curl -u`, `--password` and MySQL `-p` flags, and credential names followed by a value (password, passphrase, credentials, token, secret, api_key and similar, in snake_case, camelCase or quoted as a JSON key). It is a heuristic: it can refuse ordinary text or miss a secret, so do not paste secrets into messages you plan to save.

## Self-command dev tools

The `self-command` mod (`hooks/self-command/`) lets Claude run a slash command of the session, and gives you a pane to browse, search and create commands. It is off by default.

- `/mods-dev-tools [on|off]` sets the switch; with no argument it toggles. Turning it on takes effect from the next session, because tools register only when a session starts. Turning it off refuses every call at once; the tools leave the tool list at the next session.
- `run` (an MCP tool of this plugin) queues a slash command, for example `reload-plugins`. A command cannot run during Claude's turn, so it runs after the turn ends, and its output reaches Claude as the next prompt through the plugin's `/send` command. Nine commands are refused: `/clear`, `/exit`, `/quit`, `/logout`, `/login`, `/resume` and `/rewind`, which clear, end or swap the session, and this plugin's own `/send` and `/mods-dev-tools`. A user's or another plugin's command of the same name stays runnable, unless it shares its name with one of this plugin's, because then which one runs is not known. Each run is logged and kept in a history of the last 50 runs of each of the last 20 sessions.
- `list_commands` lists the session's commands grouped by source, with the refused ones marked; with `query` it lists the matches with their descriptions.
- `/self-command` opens a pane with three views. `c: list` shows the commands grouped by source with a search box; the refused ones are dim, and pressing one puts `/<name> ` in the prompt box. `h: history` shows what `run` has queued and the runs of this session. `n: new` creates a command: a name of lowercase letters, digits and dashes, a description, the prompt (`$ARGUMENTS` stands for the text typed after the name) and the scope, this project (`.claude/commands/`) or every project (`~/.claude/commands/`). It refuses a name already in use, a file that already exists, and a home or project folder that is not a known absolute path.

The pane uses only elements both the terminal and the Desktop app draw; it was checked in the test kit on both surfaces, not yet in a live Desktop session.

## probe-runner (dev tools)

Off unless the dev tools are on (`/mods-dev-tools on`, then a new session). The tool `probe` and the command `/probe-runner [--model <model>] <plugin,...> <step> ;; <step>` run a live check of Claude Code plugins in a fresh tmux session: a new git repository in the system temp directory, only the given plugins loaded, and the steps typed one after another. The report arrives when the probe ends. Afterwards the temp directory of the probe, its transcripts and the inline store files it wrote are removed; a removal that fails is named in the report as left behind. tmux and claude must be installed; they are looked for in the standard locations, not on PATH.

The probe runner and the mod-manager look for `claude` in fixed folders, not on PATH. Set `claudePath` (in the plugin settings) when `claude` is installed outside `~/.local/bin`, its versions folder, `~/.claude/local`, `~/.npm-global/bin`, `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin` and `/bin`; a set path must be absolute (`~` is not expanded) and is the only place looked; a wrong one is reported, never replaced. `tmux`, `python3` and `git` must be in one of those system folders.

## mod-manager

The `mod-manager` mod (`hooks/mod-manager/`) shows the installed plugins in one pane, opened with `/mod-manager`. Mods come first, then the other plugins; within each group the enabled ones are on top, above the disabled ones.

Each row turns a plugin on or off, or uninstalls it. Every change first asks you in a dialog that names the plugin, its scope and what the change does. The change runs only when you pick its confirm label, for example `Turn it off`. Picking `Keep it as it is`, or dismissing the dialog, runs nothing. A change applies in your next session.

The pane lists all six scopes that `claude plugin list --json` reports. A `user`, `project` or `local` row can be turned on or off, or uninstalled; a `synced` row (from claude.ai) only turned on or off, because it is removed on claude.ai; a `session` row (loaded with `--plugin-dir`) only turned off; a `managed` row (installed by your organization) not changed at all. A row from a skills folder (`<name>@skills-dir`) can be turned on or off but not uninstalled: delete its folder to remove it. A row whose id is not a lowercase `name@marketplace` offers no change, and says so. An entry the pane cannot read is named on a line of its own, with its index and the reason, and the other rows are still shown; the pane names the first five such entries and counts the rest, and the debug log (`claude --debug`) names every one.

The mod is always on: it has no switch and no tool, only the pane. It was checked in the test kit on the terminal and Desktop surfaces, not yet in a live session, and the confirm dialog and the enable, disable and uninstall commands have not been run live.

## Install and uninstall skills

`/mods-install-mod` installs one mod plugin from a marketplace, and `/mods-uninstall-mod` uninstalls one from an approximate name. Both run the `claude` CLI and act only on the names or the row you give. When the marketplace declares a command that runs during the install, the install skill shows that command and its `sha256` and continues only after you say yes. The uninstall skill lists the matching plugins for you to pick, asks whether to keep the data of the plugin, and runs only after both answers.

After a change, each skill reloads the plugins through the `run` tool. That tool exists only while the developer tools are on: turn them on with `/mods-dev-tools on`, then start a new session. Without it, the skill ends with a `FAILED: reload not run` line that names the fix.

## Prerequisites

The expert agent delegates to the user-scope agents `fast-worker` and `cheap-worker`, which are NOT bundled with this plugin. Node is required because mods are written in TypeScript and their tests run on Node; the `quicksilver` skill also uses it.

Both agents also use these user-scope skills. They are optional but recommended, they are NOT bundled with this plugin, and they are NOT preloaded (a preload of a skill this plugin does not ship is silently skipped by Claude Code): each agent loads them on demand when installed.

- `tldr-code`: token-efficient reading of files, line ranges and symbols.
- `fastedit`: verified, validated edits with backups.
- `jgrep`: search for code by what it does, not by name.
- `quicksilver`: bulk triage of many files, lines or items without reading them all.
- `safe-delete`: recoverable deletion.

Without them the agents fall back to the native tools (Read, Edit and Write, Grep and Glob, plain reading, and a plain `mv` into a gitignored `_dev` folder instead of a deletion) and list the missing skills in their report. Every `mods-forge-agent` dispatch runs at Opus price.

## Installation

Local install for development and testing:

```bash
claude --plugin-dir /absolute/path/to/mods-expert-developer-plugin
```

Marketplace install: once this plugin is published in a Claude Code marketplace you have added, install it with the plugin install command and the marketplace name of your choice:

```bash
claude plugin install mods-expert-developer-plugin@<marketplace-name>
```

## Usage

Invoke the agent by its namespaced name, for example through the Agent tool or by asking Claude Code to use it:

```text
mods-expert-developer-plugin:mods-expert-developer-agent
```

Give it a task such as creating a new mod, fixing a broken plugin hook, or reviewing a plugin manifest. The agent plans with TRDD proposals, loads only the chapter skills it needs, and verifies each step before moving on.

To execute one planned increment or one concrete fix or debug request, dispatch the forge agent instead:

```text
mods-expert-developer-plugin:mods-forge-agent
```

Give it the TRDD card or the failure to fix. Commit a checkpoint before each dispatch: the forge agent never commits, and it returns only a status line and the path of its report under `reports/mods-forge-agent/`.

## Validate

```bash
claude plugin validate .
```

## Adding or reordering a skill

Five artifacts list the chapter skills, and the plugin's tests require specific relationships
between them. A skill addition is not one edit:

1. `skills/<name>/SKILL.md` — the wrapper, with its `skills/<name>/references/chapter.md` and `skills/<name>/agents/openai.yaml`.
2. `README.md` — a row in the Components table above. The table must cover every skill exactly once, its heading column must match each SKILL.md's H1, and it is ordered by heading (case-insensitive) — deliberately NOT the same order as the frontmatter.
3. `agents/mods-expert-developer-agent.md` — an entry in the `skills:` frontmatter AND a row in the "Chapter skill index" table, at the same position in the same order, so the two copies of the routing order agree. The body table must cover every skill exactly once, and its label column must match each SKILL.md's H1.
4. `PINNED_PRELOAD_SKILLS` in `tests/test_skills_menu.py` — the set of skills occupying the first 32 frontmatter entries, which are the ones Claude Code preloads in full. It is mirrored as a set, not a list: reordering within the window does not change it, but adding a skill at position 30 or earlier pushes another skill out, and the set must be updated to match. Read the frontmatter's own diff too, since the set records the membership and not which member was displaced. The user-scope tool skills are deliberately NOT in the frontmatter, so they never occupy a window slot; `tests/test_skills_menu.py` asserts their absence.
5. `skills/mods-the-skills-menu/` — a row in the right domain table of its `SKILL.md` and a full entry in `skills/mods-the-skills-menu/references/skills-catalog.md`, both under the namespaced name `mods-expert-developer-plugin:<name>` and derived only from the new skill's own `SKILL.md`. The tests require each chapter skill exactly once in both files. A skill that catalogues the chapters instead of wrapping one goes into `CATALOG_SKILLS`, which both test files define and assert equal.
6. A tutorial skill is reference-only and is not a chapter: its name contains `tutorial`, it skips steps 2 to 4, and it goes into `TUTORIAL_SKILLS`, which both test files define and assert equal. It needs a row in the "Tutorials (reference only)" group of the menu's `SKILL.md`, an entry in the "Tutorials (reference only)" section of the catalog, and a line in the Tutorials section above. Its first body paragraph is the reference-only notice, and its example code lives only under `skills/<name>/examples/<example>/`.

Then run the tests:

```bash
uv run --project . pytest -q tests/
```

## License

The plugin's own files are licensed under MIT (see LICENSE). The reference chapters are Anthropic documentation and are not covered by MIT. The tutorial example mods are copied from BeLazy167/claude-mods-skill under its own MIT license. See NOTICE for both.
