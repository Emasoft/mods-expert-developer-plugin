# mods-expert-developer-plugin

<!--BADGES-START-->
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
<!--BADGES-END-->

A Claude Code plugin that bundles two agents (an expert agent that plans and evaluates, and a forge agent that builds), a skills menu, 61 documentation chapter skills (60 wrap an official Claude Code chapter, one a community how-to) on mods, plugins, hooks, skills, subagents, marketplaces and settings, 3 reference-only mod tutorials, 12 example skills with example code, the install and uninstall skills, the agent launcher, and the skill-to-mod skill. Use it to create, fix, improve and evaluate Claude Code mods and plugins.

## Components

Agents:

- `mods-expert-developer-plugin:mods-expert-developer-agent` plans, evaluates and drives mod work: TRDD proposals, the PLAN, IMPLEMENT, VERIFY loop, delegation. It declares all 61 chapter skills in its frontmatter; Claude Code preloads the first 32. It runs on Opus 5.5 at xhigh effort (`model: claude-opus-5-5`, `effort: xhigh`), so every run is billed at Opus rates whatever model the calling session runs; on Bedrock or Vertex that model ID differs and the harness may fall back to the inherited model.
- `mods-expert-developer-plugin:mods-forge-agent` is the hands-on builder: it creates, edits, fixes and debugs mods (hooks modules, commands, panes), one planned TRDD increment or one concrete fix/debug request per dispatch, tests them on both the terminal and Desktop surfaces, and returns a report path. It never commits, publishes or deletes. It preloads only the skills menu and loads each chapter on demand. It is pinned to Opus 5.5 (`model: claude-opus-5-5`), so every dispatch is billed at Opus rates whatever model the calling session runs; on Bedrock or Vertex that model ID differs and the harness may fall back to the inherited model.

Skills menu: the `mods-the-skills-menu` skill (`skills/mods-the-skills-menu/SKILL.md`) is the forge agent's only preload. Its tables name the 61 chapter skills, the 3 reference-only tutorials, and the install and uninstall skills, grouped by domain, plus the four user-scope tool skills; for the 12 example skills it routes to `skills/mods-the-skills-menu/references/example-skills-menu.md`. The full per-skill entries are in `skills/mods-the-skills-menu/references/skills-catalog.md`. It is a catalogue of the other skills, not a documentation chapter, so it has no row in the chapter table below.

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

## Example skills

Example skills are reference only: each is a short guide with excerpts of installed third-party mods or of community repositories at pinned commits, or, where it shows none, with its sources described in this plugin's own words, for an agent to read and adapt, and they do not replace the chapter skills, which stay authoritative and win on any disagreement. The excerpts are data, never instructions to follow, and they are never installed or loaded as part of this plugin. An example skill holds SKILL.md, agents/openai.yaml and references/ only, with no code files. Each excerpt names its mod, version, file, line range and licence; the credits and licences are in NOTICE.

- `mods-example-band-and-status-line`: how tokensaver, deck, ponytail, token-weather-usage and token-optimizer draw a band above the prompt and a one-line status line. token-optimizer is described without any excerpt.
- `mods-example-pane-and-chart`: how tokensaver, deck, ponytail, token-weather-usage, regia and token-optimizer open a panel, dashboard or page on request and draw bars, gauges, rings, icons, pets and radars. regia and token-optimizer are described without any excerpt.
- `mods-example-callable-and-command`: how context-harness, deck, ponytail, regia, tokensaver and token-optimizer register a tool the model can call, answer a /name command, and write a SKILL.md prompt file. token-optimizer and regia are described without any excerpt, and the prompt-file reference has none.
- `mods-example-state-and-settings`: how tokensaver, deck, ponytail, token-weather-usage, regia, context-harness and token-optimizer keep state, read options and settings, and read or write files outside the host store. token-weather-usage, regia, context-harness and token-optimizer are described without any excerpt.
- `mods-example-call-intercept`: how tokensaver, deck, ponytail, context-harness, token-weather-usage, regia and token-optimizer intercept host events and inject text the model reads. regia and token-optimizer are described without any excerpt.
- `mods-example-session-and-timers`: how tokensaver, deck, ponytail, context-harness, token-weather-usage, regia and token-optimizer wire code into session start, run timers, show toasts and log lines, and play sound cues. regia and token-optimizer are described without any excerpt.
- `mods-example-process-and-network`: how ponytail, deck, context-harness and token-optimizer run a program, call an HTTP address, mask text before it is sent, and install a per-user background job. token-optimizer is described without any excerpt.
- `mods-example-engine-and-model-calls`: how tokensaver and context-harness start a host compaction or clear, and how token-optimizer sends a paid model request of its own. token-optimizer is described without any excerpt.
- `mods-example-cost-and-metrics`: how tokensaver, deck, ponytail, token-weather-usage and context-harness turn token counts and rate limits into cost, pace and savings, and how one of them measures how often the judge agrees with the rule and with the labels.
- `mods-example-account-switching`: how ClaudeDeck, account-switcher, simplecore claude-mods, account-swap and rice-session-accounts keep a registry of saved Claude accounts, swap the Claude Code login through the credential files, and detect the login source from the environment, each with a compiling reference module of this plugin that has behaviour tests. One short excerpt of account-swap is shown with its credit.
- `mods-example-credentials-and-tokens`: how rice-session-accounts, account-switcher and simplecore claude-mods keep a secret in the macOS keychain with the secret on standard input, renew an expired OAuth login over HTTP and refuse an incomplete answer, and run one token refresh per account at a time across sessions with a timeout lock, each with a compiling reference module of this plugin that has behaviour tests. No excerpt is shown.
- `mods-example-security-guards`: how barmkin-mod keeps text from outside the person from steering a session: two facts (outside text read, secret read) and who may clear them; an egress gate at tool.check that reads every program of a shell line and, while outside text is held, refuses downloads, package runners, pushes, uploads, remote logins and opening a remote address, and asks before other open commands; cleaned MCP and skill text; a message firewall; and a footer button that opens a band above the prompt. Each comes with a compiling, tested reference module. barmkin-mod has no LICENSE file, so nothing of it is excerpted: every module and sentence is this plugin's own, and the source is cited by file and line.

## Mods switches

Every function of the integrated mods switches on and off by itself, so you or Claude turn on only the functions you need (TRDD-5IK59SQ2). Each mod defines its functions in one shared registry (`hooks/switches/`), and three ways switch them, sharing one stored value per function and one set of checks:

- `/mods-switches` opens a pane. A digit picks a mod; a letter switches one of its functions; `0` keeps settings that an older release set or that were changed outside the plugin (below). A press acts on what the pane showed: if another session turned the function off after the pane was drawn, the press is refused and says so, and the next press acts on the new state.
- Claude uses the `switches` tool, which is deferred (only its name is in the prompt until Claude looks it up). With no input it lists every function, its id and its state; with `switch` and `on` it turns one on or off. You see a toast for every change Claude makes.
- A mod's own command switches several of its functions together: `/mods-dev-tools [on|off]` sets the four dev tools (see Self-command dev tools). A command run for Claude, as the `run` tool queues it, counts as Claude's change: you see a toast.

Tokensaver is integrated but off by default in 1.0.0. The integrated copy cannot yet detect the standalone Tokensaver plugin, so with both installed an on-by-default copy would run twice (two voices, two trims of the same output). Turn it on in the `/mods-switches` pane, or ask Claude to switch `tokensaver.master` on, once the standalone plugin is uninstalled or disabled. Its three functions that cost tokens or change a model (sub-agent routing, the re-run one tier up, compaction between turns) stay off until you switch each one on.

Deck is on by default and has no detection of the standalone Deck plugin either. With both installed you get two bands and two sets of sounds, so uninstall or disable the standalone Deck plugin before you install this one, or switch `deck.master` off.

A mod can also show one notice line under its heading in the pane, above its functions, and beside its name in the tool's listing, such as why it is paused or how many errors it swallowed; a notice that cannot be read says so there instead, and its functions are still shown (TRDD-AXE8CUWR).

A switch is read every time its function is about to run, so a change takes effect at the next press, command or hook call, in every session. A function that is off does no work: its command answers that it is off (a dev tool's command is not registered at all while its switch is off at the session start), its button is not drawn, and its hooks only read the switch. A tool turned on joins the tool list when the next session starts; turned off, it refuses every call at once. A change Claude makes reads the switch and writes it in one call, so an off another session wrote in between can be overwritten; the pane checks for that and refuses.

Each value is stored signed, and only this plugin's pane, commands and tool sign. A value that does not carry a valid signature, for example after a hand edit of the store file, never turns on a function that is off by default: an off is kept, anything else counts as the default, and a toast at the session start and a notice in the pane ask you to review it. `0: Keep these settings` signs what the pane showed. The signature is tamper evidence, not a security boundary: its constant is in this source, so a value forged from it, or a copy of an older signed value, is not detected. So a forged value also gets past the auto-update opt-ins.

### Debug log

A mod can keep a debug log of the errors and warnings it raises (TRDD-RWD5PW76). The log is off by default and switches on for each mod by itself, as the function `Debug log of errors and warnings` in `/mods-switches` or through the `switches` tool; a mod's own command, such as `/mods-dev-tools on`, does not turn it on. In this release the self-command, probe-runner and Deck mods keep one, and a failed start of any mod is masked as below.

While it is on, each line goes to `~/.claude/plugins/data/<data folder>/debug/<mod>.log` (`CLAUDE_CONFIG_DIR` in place of `~/.claude` when it is set), never to the project or the working folder. The data folder is named after the install, `mods-expert-developer-plugin-<marketplace>`, or `mods-expert-developer-plugin-inline` for a plugin loaded with `--plugin-dir`; that naming follows the plugin manifest reference and has not yet been checked on a live install. A file that would pass 256 KiB moves to `<mod>.log.1`, replacing the older one, so a mod keeps two files at most, and a single line larger than that is cut. A line is added by reading and rewriting the file; within one session the lines are written one after another, in the order raised, but two sessions logging to the same file at the same moment can lose one line. A configuration folder that is not an absolute path is refused, and nothing is written.

A line holds what the mod raised: its own errors and warnings, which the mod never builds from a prompt, a tool input, a hook payload, an environment value or the stored settings, but which can quote an error from Claude Code or another plugin. So before it is written, and before it reaches Claude Code's own log, it is masked: every secret shape named in the next paragraph, every e-mail address, your home folder as `~`, and the user name in any other home folder. self-command's line for each run, built from the command and its output, is masked in Claude Code's own log and never written to the file. The masking is a heuristic: it can mask part of ordinary text or miss a secret. A line that could not be written is reported in Claude Code's debug log.

Each secret value is replaced by a label that names its kind, such as `[REDACTED:github-token]`, or `[REDACTED:assignment]` for a value after a credential name (the label style of the secret-shield mod, see NOTICE). The name before the value, the quotes and the rest of the line stay as written, and a label already in the line is never redacted again. The check looks for API-key and token shapes (including Stripe keys and webhook secrets, GitLab, npm, PyPI, Hugging Face, SendGrid and Slack app tokens, and the token in Slack, Discord and Telegram webhook or bot URLs), JWTs, private key blocks (PEM, PGP and PuTTY: the key body is redacted, its BEGIN and END lines stay), runs of 64 or more hex digits (a 256-bit key or digest; a git commit id or a UUID stays), passwords in URLs and in `user:password@host` with or without a scheme, the value of an Authorization header whatever its shape (a scheme word such as Bearer, Basic or Token before it stays; after a credential name too), the word after Bearer anywhere, Docker config `auth` entries, passwords in the curl `-u`, `--password` and MySQL `-p` flags, `?key=` and Azure `sig=` query values, and credential names followed by a value (password, passphrase, credentials, token, secret, api_key, auth, sessionid, encryption and signing keys and similar, in snake_case, camelCase, quoted as a JSON key or in an escaped JSON line, and after a type annotation such as `apiKey: string =`). A value after a credential name is redacted whatever its shape, unless it is a reference such as `$VAR`, a URL or a file path, a placeholder such as `changeme`, `true`, `<your-api-key>`, `{{token}}` or `********`, or an unquoted function call such as `get_password()`; a quoted value is redacted up to its closing quote, spaces and all. A name that describes a secret instead of holding one, such as `token_type`, `password_hint` or `SECRET_LENGTH`, is not a credential name. Schema text such as `password: required` is still redacted.

## Self-command dev tools

The `self-command` mod (`hooks/self-command/`) lets Claude run a slash command of the session, and gives you a pane to browse, search and create commands. Its functions are off by default.

- Each dev tool has its own switch in `/mods-switches` (see Mods switches): the `run` tool, the `list_commands` tool, the `/self-command` pane, and probe-runner's `probe` tool with `/probe-runner`. `/mods-dev-tools [on|off]` sets all four; with no argument it turns all four off when all four are on, and on otherwise. Turning one on takes effect from the next session, because tools and commands register only when a session starts. Turning one off refuses every call at once; it leaves the tool list at the next session. A call accepted before that still completes: a queued run runs when the turn ends, and a probe already started runs to its end. An older release's `/mods-dev-tools on` is not applied by itself: the session start asks you to review it in `/mods-switches`, where `0: Keep these settings` turns the four on; an older off is kept. Claude can switch a dev tool too, through the `switches` tool, like any function: you see a toast, and a tool it turns on joins the tool list only when the next session starts. `run` refusing `/mods-dev-tools` does not prevent that.
- `run` (an MCP tool of this plugin) queues a slash command, for example `reload-plugins`. Turning it on lets Claude run slash commands as Claude Code runs the ones you type, built-in ones included: `/reload-plugins`, for example, reloads every plugin. A command `run` queues carries this plugin's origin, not yours, per the types (a plugin's `$.command.run` reads `{ kind: 'plugin', name }`) and as measured from a command hook in a scratch plugin on Claude Code 2.1.318: the hook of a command another scratch plugin queued saw `{"kind":"plugin","name":"<the plugin that queued it>"}`; the `run` tool's own path was not measured. So a mod that checks the origin, as this plugin's switches do, counts it as Claude's change, and you see a toast for it. A command cannot run during Claude's turn, so it runs after the turn ends, and its output reaches Claude as the next prompt through the plugin's `/send` command. Nine commands are refused: `/clear`, `/exit`, `/quit`, `/logout`, `/login`, `/resume` and `/rewind`, which clear, end or swap the session, and this plugin's own `/send` and `/mods-dev-tools`. A user's or another plugin's command of the same name stays runnable, unless it shares its name with one of this plugin's, because then which one runs is not known. Each run is logged and kept in a history of the last 50 runs of each of the last 20 sessions.
- `list_commands` lists the session's commands grouped by source, with the refused ones marked; with `query` it lists the matches with their descriptions.
- `/self-command` opens a pane with three views. `c: list` shows the commands grouped by source with a search box; the refused ones are dim, and pressing one puts `/<name> ` in the prompt box. `h: history` shows what `run` has queued and the runs of this session. `n: new` creates a command: a name of lowercase letters, digits and dashes, a description, the prompt (`$ARGUMENTS` stands for the text typed after the name) and the scope, this project (`.claude/commands/`) or every project (`~/.claude/commands/`). It refuses a name already in use, a file that already exists, and a home or project folder that is not a known absolute path.

The pane uses only elements both the terminal and the Desktop app draw; it was checked in the test kit on both surfaces, not yet in a live Desktop session.

## probe-runner (dev tools)

Off unless its switch, `probe-runner.probe`, is on (in `/mods-switches`, or `/mods-dev-tools on` for all four dev tools, then a new session). The tool `probe` and the command `/probe-runner [--model <model>] <plugin,...> <step> ;; <step>` run a live check of Claude Code plugins in a fresh tmux session: a new git repository in the system temp directory, only the given plugins loaded, and the steps typed one after another. The report arrives when the probe ends. Afterwards the temp directory of the probe, its transcripts and the inline store files it wrote are removed; a removal that fails is named in the report as left behind. tmux and claude must be installed; they are looked for in the standard locations, not on PATH.

The probe runner and the mods-manager look for `claude` in fixed folders, not on PATH. Set `claudePath` (in the plugin settings) when `claude` is installed outside `~/.local/bin`, its versions folder, `~/.claude/local`, `~/.npm-global/bin`, `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin` and `/bin`; a set path must be absolute (`~` is not expanded) and is the only place looked; a wrong one is reported, never replaced. `tmux`, `python3` and `git` must be in one of those system folders.

## mods-manager

The `mods-manager` mod (`hooks/mod-manager/`) shows the installed plugins in one pane, opened with `/mods-manager`. Mods come first, then the other plugins; within each group the enabled ones are on top, above the disabled ones.

Each row turns a plugin on or off, updates it, or uninstalls it. Every change you start first asks you in a dialog that names the plugin, its scope and what the change does; automatic updates, which you allow once for each plugin, are described below. The change runs only when you pick its confirm label, for example `Turn it off`. Picking `Keep it as it is`, or dismissing the dialog, runs nothing. A change applies in your next session, or after `l: Reload plugins` (below). While one change or a read of the installed list runs, every other button that runs `claude`, `Refresh` included, and `l: Reload plugins` are refused with a message, so no two changes run at once; the section headers and the filter still work. After a change, the pane reads the list again under the same claim, so a button pressed at that moment is refused too. The background read of the marketplace catalogs (below) takes no claim, so the buttons work while it runs, and its `claude plugin marketplace list --json` can run beside a change or a Refresh.

The pane lists all six scopes that `claude plugin list --json` reports. A `user`, `project` or `local` row can be turned on or off, updated, or uninstalled; a `synced` row (from claude.ai) only turned on or off, because it is removed on claude.ai; a `session` row (loaded with `--plugin-dir`) only turned off; a `managed` row (installed by your organization) only updated, because `claude plugin update` accepts that scope. A row from a skills folder (`<name>@skills-dir`) can be turned on or off but not updated or uninstalled: delete its folder to remove it. A row whose id is not a lowercase `name@marketplace` offers no change, and says so. An entry the pane cannot read is named on a line of its own, with its index and the reason, and the other rows are still shown; the pane names the first five such entries and counts the rest, and the debug log (`claude --debug`) names every one.

Each row also shows the latest version its marketplace offers, after the installed one. The pane reads it in the background once the list is shown, so the rows and their buttons never wait: `claude plugin marketplace list --json` names where each marketplace is kept, and only the `marketplace.json` of a marketplace with an installed row is read. For a plugin kept in the marketplace's own folder, the version is the `version` of its `plugin.json` when it declares one, else its entry's, because `plugin.json` wins when Claude Code installs; the row says `latest 2.0.0`. For a plugin fetched from elsewhere, such as GitHub, the pane cannot read its own `plugin.json`, which wins at install, so it shows the version the catalog lists and says so: `catalog lists 2.0.0`. The two normally match. A plugin built by a command has no version in the catalog, so it shows `latest unknown`, as does a plugin whose catalog gives no version, or an empty one. Versions are compared number by number, so `10.0.0` is newer than `2.0.0`, and a newer one gets an arrow, `↑ latest 2.1.0`; a version that is not plain numbers, such as `2.0.0-beta` or a commit hash, gets no arrow. A file that cannot be read, or a `plugin.json` whose version is not text, is named on a line of its own, and the rows stay as they are. A marketplace hosted on claude.ai has no local copy, so its plugins show `latest unknown`.

A row with an arrow has an `Update` button, which runs `claude plugin update <plugin> --scope <scope>`. A failed `Update` shows the last line of claude's error, with each control character shown as `?`. When any row the filter shows has one, `u: Update all (N)` updates those N rows and no others: a row the filter hides is not updated. Its question names each plugin with its scope, the first five, then counts the rest (`and 2 more`). The rows are updated one after another, and a failure does not stop the others. When they are done, the pane shows the first five rows as updated, no newer version found, or failed with the last line of claude's error, counts the rest (the debug log, `claude --debug`, names every one), and reads the list again. `Changes apply in your next session.` appears only when at least one row was updated. An update that finds no newer version says only that: it can still finish installing a dependency, so the pane never says that nothing was installed. The buttons appear only once the marketplace catalogs are read.

A plugin that sessions load in place from its marketplace's folder (`readFromFolder` in the list) is shown at the version it loads (`folderVersion`), not the one recorded when it was installed. Raising the version in its `plugin.json` therefore draws no arrow, because the session already loads those files. A plugin whose catalog entry is an archive with a `headersHelper` keeps its arrow but gets no `Update` and is not counted in `Update all`: `claude plugin update` asks you to accept that helper first and cannot ask inside the pane, so the row says to update it from your own terminal.

Once the catalogs are read, the status line under the prompt counts the rows with an update arrow, for example `⚠ mods-expert-developer-plugin: 2 plugin updates · /mods-manager` (Claude Code adds the `⚠` and the plugin's name). A row whose update needs your own terminal, because its archive entry sets a `headersHelper` (above), has an arrow, so it is counted, though `Update all` leaves it out; the filter does not change the count. The line is set again after every read of the catalogs, and removed when no row has an arrow or no latest version could be read. It is the plugin's one status line. The catalogs are read only when the pane opens or is refreshed, so in a session where the pane was not opened yet there is no line.

`l: Reload plugins` runs `/reload-plugins` in this session, as if you typed it, so a change made in the pane, or with `claude plugin` in a terminal, applies without a new session. It asks nothing, since it installs and removes nothing, runs once Claude is idle, and is refused while a change runs. It never adds `--force`: when a reload would change MCP tools, Claude Code holds it back and says to run `/reload-plugins --force` yourself, and the pane shows that answer. A reload that applies reloads this mod too; if the pane is still open, it reads the list again. If the reload cannot run, the pane says so and asks you to type `/reload-plugins` in the prompt. Plugin and marketplace names come from the list, so a control character in one is shown as `?`.

`Details` on a row shows that plugin in place of the list: its description, the version it loads and the latest one, its marketplace, its scope, the folder it loads from, and its homepage, or its repository when it lists no homepage. For the description, the homepage and the repository, the marketplace catalog's entry comes first and the plugin's own `plugin.json` fills in what the entry leaves unset, the rule Claude Code follows in its own listings. `o: Open folder` shows the folder in your file manager: on macOS it runs `/usr/bin/open -R`, which selects the folder in Finder instead of opening it, so a folder named like an app bundle is never started; on Linux it runs `/usr/bin/xdg-open`. `h: Open homepage` opens the link in your browser, and only an `http` or `https` link with no space and no control character: any other text is shown and never opened. Only those two fixed paths are tried, never PATH. When no program opens it, as on Windows, the path or the link is copied to your clipboard and a message says so; if the copy fails too, the pane names the reason and the text. Opening asks nothing and runs no `claude` command, so it works while a change runs. `b: Back to the list` returns to the list. The pane always opens on the list, and a read of the list that no longer finds the row, or finds it in another folder after an update, goes back to the list too. Every message that names a plugin, a path or a link shows a control character as `?`.

Under each marketplace section, once you open it, the pane lists the plugins that marketplace's catalog (`marketplace.json`) offers and that are not installed in any scope, by name, each with its description and two buttons. `Install` asks first, in a dialog that shows the command, `["claude","plugin","install","<name>@<marketplace>","--scope","user","--json"]`; only `Install it` runs it, with no shell and no `-y`; while it runs, for up to five minutes, the pane refuses its other buttons that run `claude`. The plugin loads in your next session, or after `l: Reload plugins`, and runs its hooks and servers with your permissions, as the dialog says: install only one you trust. After any install that ran, worked or not, the pane reads the list again. A command its marketplace declares for the install (a plugin built by a command, or an archive fetched through a `headersHelper`) is never run from the pane, and the pane does not try to accept it: Claude Code ignored `-y` and `--accept-command` when they were tried from a shell inside a session (measured on Claude Code 2.1.318, in a scratch home folder). The pane shows that command and its `sha256`, and offers to copy `claude plugin install <name>@<marketplace> --scope user --accept-command <sha256>`, which accepts exactly that command, for you to run in your own terminal, outside Claude Code; you can also accept it from the plugin's details pane in `/plugin`, as Claude Code's own message says. Once accepted, a command source runs again at each update and once per session. A command shown for another plugin (a dependency, for example) is shown with its `sha256` too, and no line is offered for it. `Copy install line` copies `claude plugin install <name>@<marketplace> --scope user` to your clipboard, for you to run in your own terminal; if the copy fails, the pane shows the line. The id has no quotes: it holds only lowercase letters, digits, `.`, `_`, `-` and one `@`, which sh, zsh, PowerShell and the Windows command prompt all pass on as written, and the Windows command prompt would pass quotes on to `claude` as part of the id. `Copy install line` runs nothing and asks nothing. The plugins listed here have no version and count toward neither the status line nor `Update all`. A marketplace with a local copy and no installed plugin has a section of its own, after every section with installed rows. It starts collapsed, and its catalog is read only when you open it, then kept until `Refresh`; `Refresh`, or opening the pane again, closes those sections again, so opening the pane never reads their catalogs. If its catalog cannot be read, the section says so, and opening the section again reads it once more. Every read of the catalogs replaces what an earlier one found, so a catalog that is gone, or a marketplace removed from the list, no longer shows its plugins. The filter field is shown whenever the pane lists an installed plugin or a marketplace with a local copy, even with nothing installed. The filter matches these plugins by name and marketplace too, and `mod` leaves them out, since none is known to be a mod; while the filter is set, a section whose catalog is not read yet shows only when its marketplace name matches, and pressing its header reads it. A section draws the first 25, then counts the rest: type part of a name in the filter to find one. A name in a catalog that is not a lowercase `name@marketplace` is not shown, and the debug log names it, once per session; a marketplace hosted on claude.ai has no local copy, so it lists nothing, and the debug log says so.

To add a marketplace, type where it comes from in the add field and press `a: Add marketplace` (Enter in the field does nothing). The pane adds only a local folder, given by its whole path starting with `/` (`~` is not expanded; the path of its `.claude-plugin/marketplace.json` names the same folder): it reads that file's `name` first and checks it against `claude plugin marketplace list --json`, because `claude plugin marketplace add` points a marketplace of the same name at the new source without a word (measured on Claude Code 2.1.317). The same name from the same folder is already added, and nothing runs; the same name from another source, or the same folder under another name, is refused, and the message names both. A free name gets a question that shows the exact command, `["claude","plugin","marketplace","add","<folder>"]`; only `Add it` runs it, with no shell and no `-y`. Measured on Claude Code 2.1.318 from a script, with a scratch home folder and no `-y`, on a folder holding one plugin with command hooks on eight events and an MCP server, and on one holding a plugin installed by a command its marketplace declares (that run with standard input closed): the add ran none of them, wrote nothing in the folder and installed no plugin, and said it declared the marketplace in the user settings; a later version may differ. A plugin of the second kind runs its command when it is installed or updated, and again once per session ([marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference), "command plugin source"); an install with no terminal and neither `-y` nor `--accept-command` is refused (plugin commands reference; accepting the command: [Install from your shell](https://code.claude.com/docs/en/plugins/install#install-from-your-shell)), and in the measured run (with `--json`) it showed the command, refused it and exited 1. The pane reads the marketplace list before and after the add, failed or not: a marketplace whose source changed is named in the log and in the pane, and is not changed back. Then the pane reads everything again, as `Refresh` does, and the new marketplace gets its own section, like the others; when the marketplace list cannot be read after the add, the message says so and does not point to the section, and `Refresh` reads the list again. The check does not resolve symbolic links, so a folder spelled through one may name a marketplace already added from its real path. The folder's `marketplace.json` is read again right before the add: a name changed since the question is refused. One changed during the add itself is not: a marketplace it re-points is named by the comparison above, and a new name is added under it while the pane's message still names the one the question showed; only the list read after the add shows the real one (its section, or the next `Refresh` when that read fails). A remote source (a GitHub `owner/repo`, an `https://` URL or a `git@host:path` URL) is never added, since it cannot be checked before it is added: `c: Copy request` copies `/mods-expert-developer-plugin:mods-install-mod --marketplace <source>` for you to send to Claude; that skill checks the source and asks for the plugin's name. The button copies the request of the source last checked, and is gone as soon as the field holds other text, until a check finds a remote source in it again. Any other text, a relative path included, is refused with a message.

`Auto-update: off`, over the rows, is the switch of automatic updates, off until you turn it on. Turning it on asks first, in a dialog that says what it then allows; turning it off asks nothing. `Auto: off` on a row whose scope offers `Update` (a `user`, `project`, `local` or `managed` row) opts that plugin in, after a dialog of its own that shows the exact command each update runs (and, for a `project` or `local` row, the folder it runs in), and `Auto: on` opts it out at once; the opt-in of a `project` or `local` row holds for that project's install only, and every opt-in keeps the source its marketplace had then (its kind and its path, repository or URL; not a git ref), which the pane reads with `claude`, so a session with no terminal opts nothing in and says so. The switch is a function of the shared registry, `mods-manager.auto-update` (see Mods switches), so `/mods-switches` and Claude's `switches` tool turn it on or off too, with no dialog, and you see a toast for a change Claude makes; a value forged in the store file is not detected (see Mods switches); no `/mods-manager` argument and no tool opts a row in or resumes a pause: only these buttons do. The settings are a plain JSON file of the plugin's store under your Claude Code configuration folder, which Claude's own file tools could also write, with your permission. The switch, the opt-ins and the pauses are stored signed, as every switch is: opt-ins written outside the plugin count as none, so nothing is updated, and the pane says to opt each plugin in again; pauses written outside the plugin are kept for their reason, since a pause only stops updates, but never for a command they name, so Review offers no line that accepts one; the pane says so until the next Resume, opt-out or pause a check adds saves them as the plugin's own, without those commands (each such row still offers Review). The timer of the check is set only while the switch is on: turning it on in a session sets it there, and turning it off there cancels it. Turned off in another session, the next check here reads it off and stops this session's timer, so turned on again elsewhere, this session checks again from its next start. With no plugin opted in, a check reads its settings and does nothing else: no `claude` call, no lease, no file read. While the switch is on, two minutes after a session starts (or the switch is turned on) and then every hour, the first open terminal session to check, with the pane open or not, updates each opted-in row that `Update` would update, one after another, with `claude plugin update <plugin> --scope <scope> --json`, no shell, no `-y` and no question. Every automatic update shows a toast, writes a line in the transcript and adds a line to the pane's list of recent automatic updates (the last ten, kept in the plugin's store), each with the plugin, its scope, the old and new versions claude reports, and the time; one that finds nothing newer writes only to the debug log (`claude --debug`). The check reads the marketplaces' local copies and does not refresh them: Claude Code refreshes them when it updates its marketplaces, or run `claude plugin marketplace update`. A plugin fetched from elsewhere, such as GitHub, whose own `plugin.json` gives an older version than its catalog lists keeps its arrow, so each check runs its update again; that claude then finds it current was not measured.

Before it calls claude, the check pauses a row whose own catalog entry declares a command (a command source, which builds the plugin, or an archive's `headersHelper`; such a row is never updated automatically anyway, and the pause says so), and a row whose marketplace now comes from another source than the one kept with its opt-in, such as a marketplace removed and added again under the same name. claude refuses a declared command too, which covers what the pane does not read (a dependency's entry, a catalog claude refreshes itself): measured from a shell on 2.1.318 in a scratch setup, with no terminal, an update whose entry became a command source exits 1 and shows the command and its `sha256` without running it, and an update whose new version depends on a plugin built by a command installs neither that plugin nor its command and goes ahead, leaving the plugin with an error; the check reads the list again after an update, and a row claude lists an error for pauses with it. If claude shows a command, the row pauses, and the toast and the line show the command and its `sha256`. A failed update pauses its row too, as does one claude does not finish within five minutes. A paused row says why and has `Review`, which shows the reason and, for a command shown for that plugin, offers to copy `claude plugin update <plugin> --scope <scope> --accept-command <sha256>` for your own terminal, outside Claude Code (as with `Install`, the pane never accepts a command itself); `Resume auto-update` lets the next check try the row again, and while the reason holds it pauses again. Opting a row out clears its pause. A session that draws on the Desktop app only, or a headless one, runs no check, since every `claude` call of the pane needs a terminal session. One check runs an hour across all open sessions, through a lease in the plugin's store. How that store behaves when two sessions write it at once was not measured: if one session's write could replace another's, a stale write could also turn the switch back on, bring back an opt-in or drop a pause. A check is skipped while a change or a read of the list runs in its session; while a row updates, a button that runs `claude` is refused until that row ends, five minutes at most, and a press that takes over between two rows stops the check. The switch, the opt-ins, the pauses and the records are kept in the plugin's own store, so they hold across sessions: an opt-in stays after its plugin is uninstalled, and holds again if it is installed again from the same marketplace source. The pane reads them when it reads the list, so a change made in another session shows after `Refresh`.

`/mods-manager` takes one argument, or none: `open` (the same as none), `close`, which closes the pane, `check`, which opens the pane and reads the list and the catalogs again as `Refresh` does, with no network (the catalogs are the local copies as of each marketplace's last update, and the pane says so), and `add <source>`, which opens the pane with the source in the add field and runs its check. A source with spaces goes in single or double quotes. `add` never adds by itself, because Claude's run tool can queue the command: it asks its question only for a run Claude Code stamps as your own gesture at the terminal (an Enter you typed, or one you queued while Claude was busy, or a click on a link in the transcript, as its types describe it; such a link may stand in a reply of Claude, not checked); run any other way, the pane shows the check and you press `a: Add marketplace` for the question. Either way nothing is added until you pick `Add it`. Any other argument opens nothing and names the forms.

The mod has no tool, only the pane, its status line and the hourly auto-update check, whose switch is off by default; while it is off no timer is set, except that a switch turned off in another session leaves this session's timer until its next check, at most an hour later, which reads it off and stops it. It was checked in the test kit on the terminal and Desktop surfaces, not yet in a live session. Still to check live, on the terminal and in the Desktop app:

- the confirm dialog, and the enable, disable, update and uninstall commands, run for real;
- `Update all` over real rows, its question, its report, and whether the next-session line appears only after a row was updated;
- whether the `u` and `l` hotkeys fire while the filter box has focus;
- a row loaded in place from a folder, and a row whose archive entry sets a `headersHelper`, against a real `claude plugin list --json` and a real catalog;
- `l: Reload plugins` for real: whether the pane, left open, reads the list again after the reload, and, in the Desktop app, whether a reload the mod runs is refused as one that does not come from the prompt box (`/reload-plugins isn't available over a remote connection in this session.`, plugin commands chapter, "Sessions without an interactive terminal");
- the status line under the prompt: how it looks, and whether it stays across a reload;
- `Details` against real plugins, and `o: Open folder` and `h: Open homepage` for real: Finder on macOS, `xdg-open` on Linux (not run at all yet), the copy when no program opens the folder or the link, and, in the Desktop app, whether the opener and the copy work there;
- whether the `b`, `o` and `h` hotkeys fire in the details view;
- the plugins not installed, against real catalogs (one catalog on the measured machine lists 2283 plugins): how fast the pane redraws when a filter of two characters opens every section, `Copy install line` on the terminal and in the Desktop app, and whether the copied line installs the plugin when you run it;
- `a: Add marketplace` for real: the question, the add, the section of the new marketplace; whether any of the pane's hotkeys (`r`, `l`, `u`, `a`, `c`) fires while the add field or the filter field has focus, since a path typed there holds those letters;
- whether a keyboard can reach `a: Add marketplace` without leaving the add field (Enter in it does nothing);
- `Install` for real, in a scratch setup: the question, the install, the row it then draws, and, for a plugin whose marketplace declares a command, the message with the command and its `sha256` and the copied line run in a terminal outside Claude Code; whether the installed plugin then loads after `l: Reload plugins`; and, in the Desktop app, whether the install runs at all;
- auto-update for real, in a scratch setup: the switch and `Auto` dialogs, a check two minutes after a session starts against a real catalog with a newer version, its toast, transcript line and line in the pane's list, two open sessions sharing one check an hour (and the store under two writers), a marketplace added again from another source, an update claude refuses from the pane itself and one that leaves a dependency missing (both measured only from a shell so far), then `Review` and the copied line run in a terminal outside Claude Code; in the Desktop app, that no check runs and `Auto` opts nothing in;
- on the mobile app, which draws no field: whether `/mods-manager add <source>` shows the source as text with `a: Add marketplace` (the test kit draws the field there too, so this was not reached);
- `/mods-manager close`, `check` and `add <source>`, typed and queued by the run tool, and the hint after the name in the typeahead; whether the Desktop app stamps a command you typed and sent as your own (`composer`), without which `add <source>` would ask nothing there and you would press `a: Add marketplace` for the question.

## Install and uninstall skills

`/mods-install-mod` installs one mod plugin, and `/mods-uninstall-mod` uninstalls one from an approximate name. Both run the `claude` CLI and act only on the names or the row you give. The install skill takes, in plain words or as the argument of the slash command, a plugin name with its marketplace name, a plugin name with `--marketplace <source>` (a local folder, a GitHub `owner/repo` or a git URL), or the repositories of the plugin and its marketplace; when another marketplace already has the same name, it stops and changes nothing. When the marketplace declares a command that runs during the install, the install skill shows that command and its `sha256` and continues only after you say yes. Its install commands run when your permission mode, your rules or your answer to a prompt allow them, inside a subagent too: under `bypassPermissions`, in auto mode when its classifier allows them, and where your rules allow them, nothing is asked. A refused command, or a question the skill cannot ask, comes back to you with the commands that remain. The uninstall skill lists the matching plugins for you to pick, asks whether to keep the data of the plugin, and runs only after both answers.

After a change, each skill reloads the plugins through the `run` tool; the install skill, run inside a subagent, returns the `/reload-plugins --force` line for you to type instead. That tool exists only while its switch, `self-command.run`, is on: turn it on in `/mods-switches` (or all four dev tools with `/mods-dev-tools on`), then start a new session. Without it, the skill ends with a `FAILED: reload not run` line that names the fix.

`mods-skill-to-mod` decides whether an existing skill should become a mod and, when it should, scaffolds a mod plugin that bundles the skill, with a switch for every function and an opt-in debug log, then verifies it. The mods expert agent loads it; it is adapted from arm-pz/skill-to-mod (MIT, see NOTICE).

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

Marketplace install: this plugin is listed in the Emasoft marketplace. Add that marketplace once, then install the plugin from it:

```bash
claude plugin marketplace add Emasoft/emasoft-plugins
claude plugin install mods-expert-developer-plugin@emasoft-plugins
```

The same install, from inside a session:

```
/plugin install mods-expert-developer-plugin --marketplace Emasoft/emasoft-plugins
```

## Usage

Invoke the agent by its namespaced name, for example through the Agent tool or by asking Claude Code to use it:

```text
mods-expert-developer-plugin:mods-expert-developer-agent
```

Give it a task such as creating a new mod, fixing a broken plugin hook, or reviewing a plugin manifest. The agent plans with TRDD proposals, loads only the chapter skills it needs, and verifies each step before moving on.

To start it from the prompt, type `/mods-expert-developer-agent <prompt>` (full name `/mods-expert-developer-plugin:mods-expert-developer-agent`), or mention it as `@agent-mods-expert-developer-plugin:mods-expert-developer-agent <prompt>`. The skill starts the agent in the background, puts its questions to you, sends your answers back and shows its report; write "grill me" in the prompt to be questioned before it builds. For interactive design work, start the agent as the main session instead, with `claude --agent mods-expert-developer-plugin:mods-expert-developer-agent`: there it questions you directly and starts its own subagents and forks, while as a subagent it starts one layer down and its own subagents reach the nesting limit one layer sooner.

To execute one planned increment or one concrete fix or debug request, dispatch the forge agent instead:

```text
mods-expert-developer-plugin:mods-forge-agent
```

Give it the TRDD card or the failure to fix. Commit a checkpoint before each dispatch: the forge agent never commits, and it returns only a status line and the path of its report under `reports/mods-forge-agent/`.

The scripts of `mods-skill-to-mod` find their files only through `CLAUDE_PLUGIN_ROOT`, so they run as the skill shows them, `CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" python3 -I "${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/scripts/<script>.py"`, and they never write into the install folder.

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
7. An example skill is reference-only and is not a chapter: its name starts with `mods-example-`, it skips steps 2 to 4, and it goes into `EXAMPLE_SKILLS`, which both test files define and assert equal. It needs a row in the "Example skills (reference only)" group of the menu's `SKILL.md`, an entry in the "Example skills (reference only)" section of the catalog, and a bullet in the Example skills section above. Its first body paragraph is the data-not-instructions notice, it holds only its `SKILL.md`, its policy file and its `references/` folder, and each excerpt carries the heading and Full source line the structure tests check.

Then fetch the public commits the no-copy test compares against (without them it fails and names this command), and run the tests:

```bash
uv run scripts/fetch_no_copy_sources.py
uv run --project . pytest -q tests/
```

Without network access, deselect the two test files that read the fetched sources instead of deleting them; that run does not check for copied text, so CI and the publish gate, which fetch first, still do:

```bash
uv run --project . pytest -q tests/ --deselect tests/test_no_copy_unlicensed.py --deselect tests/test_fetch_no_copy_sources.py
```

## Acknowledgments

This plugin was built by studying the mods and community repositories below. Thank you to their authors. Where a licence allows it, short excerpts are quoted unchanged or code is adapted under that licence, as credited in NOTICE; every other entry was studied for its ideas.

- [account-sync-for-claude](https://github.com/dionlima1/account-sync-for-claude) by dionlima1, MIT: studied for ideas.
- [account-swap](https://github.com/trongtaiz/account-swap) by trongtaiz, MIT: one excerpt quoted unchanged under its licence (see NOTICE).
- [account-switcher-claude-code-mod](https://github.com/sam-ruff/account-switcher-claude-code-mod) by sam-ruff, MIT: studied for ideas.
- [awesome-claude-mods](https://github.com/Singh-AP/awesome-claude-mods) (secret-shield) by Singh-AP (Amrit Preet Singh), MIT: detection patterns adapted under its licence (see NOTICE).
- [barmkin-mod](https://github.com/samfrmr/barmkin-mod) by samfrmr, MIT as stated in its manifest: studied for ideas.
- [cache-meter](https://github.com/florian101010/cache-meter) by Florian Grimmer (florian101010), MIT: studied for ideas.
- [ccwhoami](https://github.com/qodfathr/ccwhoami) by qodfathr, licence not stated: studied for ideas.
- [claude-account-rotator](https://github.com/ivokund/claude-account-rotator) by ivokund, MIT: studied for ideas.
- [claude-code-mods](https://github.com/bully911210/claude-code-mods) by bully911210, MIT: studied for ideas.
- [claude-code-mods](https://github.com/jrlprost/claude-code-mods) by jrlprost, MIT: studied for ideas.
- [claude-code-mods](https://github.com/karanb192/claude-code-mods) by karanb192 (mod-builder), MIT: studied for ideas.
- [claude-code-mods](https://github.com/KilimcininKorOglu/claude-code-mods) by KilimcininKorOglu (Kerem Gok; probe-runner and self-command), MIT: code adapted under its licence (see NOTICE).
- [claude-code-mods](https://github.com/raoofaltaher/claude-code-mods) by raoofaltaher, licence not stated: studied for ideas.
- [claude-code-usage-quota-mod](https://github.com/anantraghunath/claude-code-usage-quota-mod) by anantraghunath, MIT: studied for ideas.
- [claude-code-usage-quota-mod](https://github.com/endavis/claude-code-usage-quota-mod) by endavis, MIT: studied for ideas.
- [claude-deck](https://github.com/nvr0x5/claude-deck) (deck) by nvr0x5, MIT: excerpts quoted unchanged under its licence (see NOTICE).
- [ClaudeDeck](https://github.com/MarvelCollin/ClaudeDeck) by MarvelCollin, MIT: studied for ideas.
- [claude-desktop-account-switcher](https://github.com/plexxed/claude-desktop-account-switcher) by plexxed, MIT: studied for ideas.
- [claude-keep-sessions](https://github.com/IlyaPryzhykau/claude-keep-sessions) (keep-sessions) by IlyaPryzhykau, licence not stated: studied for ideas.
- [claude-mods](https://github.com/Amnesiac9/claude-mods) by Amnesiac9, MIT: studied for ideas.
- [claude-mods](https://github.com/augiefra/claude-mods) (token-weather-usage) by Eric Cologni (augiefra), Apache-2.0: excerpts quoted unchanged under its licence (see NOTICE).
- [claude-mods](https://github.com/fanoisme/claude-mods) by fanoisme, MIT: studied for ideas.
- [claude-mods](https://github.com/manuacl/claude-mods) by manuacl, Apache-2.0: studied for ideas.
- [claude-mods](https://github.com/mishgoldenberg/claude-mods) (mod-manager, command-hub) by mishgoldenberg (Michael Goldenberg), MIT: code adapted under its licence (see NOTICE).
- [claude-mods](https://github.com/simplecore-inc/claude-mods) by simplecore-inc, MIT: studied for ideas.
- [claude-mods-skill](https://github.com/BeLazy167/claude-mods-skill) by BeLazy167, MIT: the tutorial text and five example mods, code adapted under its licence (see NOTICE).
- [claude-tokensaver](https://github.com/AGregDev/claude-tokensaver) (tokensaver) by Gregory Albert (AGregDev), MIT: excerpts quoted unchanged under its licence (see NOTICE).
- [conjev](https://github.com/ysys143/conjev) (formerly context-harness) by ysys143, MIT for version 0.0.1, the version quoted (the repository moved to Apache-2.0 on 2026-10-28): excerpts quoted unchanged under its licence (see NOTICE).
- [givememod](https://github.com/timoncool/givememod) by timoncool, MIT: studied for ideas.
- [Mod_claude](https://github.com/purpleheads2026/Mod_claude) (regia) by purpleheads2026, MIT: studied for ideas.
- [plugin-marketplace](https://github.com/B314-N03/plugin-marketplace) (mod-builder) by B314-N03, licence not stated: studied for ideas.
- [ponytail](https://github.com/DietrichGebert/ponytail) by DietrichGebert, MIT: excerpts quoted unchanged under its licence (see NOTICE).
- [rice-session-accounts](https://github.com/moabualruz/rice-session-accounts) by moabualruz, MIT: studied for ideas.
- [token-optimizer](https://github.com/alexgreensh/token-optimizer) by alexgreensh, PolyForm Noncommercial 1.0.0: studied for ideas.

The reference chapters are adapted from Anthropic's Claude Code documentation, as the License section says.

## License

The plugin's own files are licensed under MIT (see LICENSE). The reference chapters are Anthropic documentation and are not covered by MIT. The tutorial example mods are copied from BeLazy167/claude-mods-skill under its own MIT license. The probe-runner and mods-manager mods are adapted from MIT-licensed code of KilimcininKorOglu/claude-code-mods and mishgoldenberg/claude-mods, credited in NOTICE. The excerpts in the example skills keep the licences of their mods (MIT, and Apache-2.0 for token-weather-usage; mods-example-security-guards excerpts nothing: its source has no LICENSE file, and its modules are this plugin's own, under MIT). See NOTICE for all of them.
