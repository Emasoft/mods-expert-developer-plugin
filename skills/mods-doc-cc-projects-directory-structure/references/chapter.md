## CLAUDE PROJECTS DIRECTORY STRUCTURE

## Table of Contents

- [Explore the .claude directory](#explore-the-claude-directory)
  - [Explore the directory](#explore-the-directory)
  - [What's not shown](#whats-not-shown)
  - [Choose the right file](#choose-the-right-file)
  - [File reference](#file-reference)
  - [Frontmatter fields by file](#frontmatter-fields-by-file)
  - [Troubleshoot configuration](#troubleshoot-configuration)
  - [Application data](#application-data)
  - [Related resources](#related-resources)

> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

### Explore the .claude directory

> Where Claude Code reads CLAUDE.md, settings.json, hooks, skills, commands, subagents, workflows, rules, and auto memory. Explore the .claude directory in your project and ~/.claude in your home directory.

Claude Code reads instructions, settings, skills, subagents, and memory from your project directory and from `~/.claude` in your home directory. Commit project files to git to share them with your team; files in `~/.claude` are personal configuration that applies across all your projects.

On Windows, `~/.claude` resolves to `%USERPROFILE%\.claude`. If you set [`CLAUDE_CONFIG_DIR`](https://code.claude.com/docs/en/env-vars), every `~/.claude` path on this page lives under that directory instead.

Most users only edit `CLAUDE.md` and `settings.json`. If your repository already has an `AGENTS.md` for other coding agents, Claude Code [can read that](https://code.claude.com/docs/en/memory#agents-md) in place of a `CLAUDE.md`. The rest of the directory is optional: add skills, rules, or subagents as you need them.

#### Explore the directory

When you need to know where a Claude Code file belongs, what it does, and when Claude Code loads it, use the directory map below. Each entry gives its badge (`committed` = share through git, `gitignored` = personal to the project, `local` = lives in your home directory and is never committed), when it loads, and what to put in it.

```text
your-project/
├── CLAUDE.md            committed   project instructions, loaded every session
├── .mcp.json            committed   project-scoped MCP servers
├── .worktreeinclude     committed   gitignored files to copy into new worktrees
└── .claude/
    ├── settings.json         committed   permissions, hooks, configuration
    ├── settings.local.json   gitignored  personal overrides for this project
    ├── rules/                topic-scoped instructions (testing.md, api-design.md)
    ├── skills/               one folder per skill (security-review/SKILL.md, checklist.md)
    ├── commands/             single-file prompts (fix-issue.md)
    ├── output-styles/        project-scoped output styles
    ├── agents/               subagents (code-reviewer.md)
    ├── workflows/            dynamic workflow scripts (.js)
    └── agent-memory/<agent-name>/MEMORY.md   subagent memory, written by the subagent

~/
├── .claude.json         local   app state, UI preferences, personal MCP servers
└── .claude/
    ├── CLAUDE.md             personal preferences for every project
    ├── settings.json         default settings for all projects
    ├── keybindings.json      custom keyboard shortcuts
    ├── themes/               custom color themes (.json)
    ├── projects/<project>/memory/   auto memory (MEMORY.md plus topic files)
    ├── rules/                user-level rules
    ├── skills/               personal skills
    ├── commands/             personal single-file commands
    ├── output-styles/        custom output styles (teaching.md)
    ├── agents/               personal subagents
    ├── workflows/            personal dynamic workflows
    └── agent-memory/         memory for subagents with `memory: user`
```

Project files:

* `CLAUDE.md`: project-specific instructions Claude reads every session (conventions, common commands, architectural context). Target under 200 lines; longer files still load in full but may reduce adherence. If something matters only for specific tasks, put it in a skill or a path-scoped rule so it loads only when needed. List the commands run most (build, test, format). It also works at `.claude/CLAUDE.md` to keep the project root clean. If the repository already has an `AGENTS.md` for other coding agents, Claude Code can read that in place of a `CLAUDE.md`. Example content: a `# Project conventions` heading with `## Commands` (`npm run build`, `npm test`, `npm run lint`), `## Stack` (TypeScript strict mode, React 19 functional components) and `## Rules` (named exports only, tests next to source as `foo.ts` -> `foo.test.ts`, API routes return `{ data, error }`).
* `.mcp.json`: project-scoped Model Context Protocol servers shared with the team. It lives at the project root, not inside `.claude/`. Servers connect when the session begins; tool schemas are deferred by default and load on demand through tool search. Reference secrets as environment variables such as `${NOTION_TOKEN}` so the token never lands in the file. Servers only one user needs go in `~/.claude.json` (run `claude mcp add --scope user`). Example: a `mcpServers.notion` entry with `command: "npx"`, `args: ["-y", "@notionhq/notion-mcp-server"]` and `env.NOTION_TOKEN` set to `${NOTION_TOKEN}`.
* `.worktreeinclude`: lists gitignored files (`.gitignore` syntax) to copy from the main repository into each new worktree, because worktrees are fresh checkouts and untracked files such as `.env` are missing by default. Only files that match a pattern and are also gitignored get copied. Read when Claude creates a worktree through `--worktree`, the `EnterWorktree` tool, or subagent `isolation: worktree`. It lives at the project root and is Git-only: with a WorktreeCreate hook for a different VCS it is not read, so copy files inside the hook script instead. It also applies to parallel sessions in the desktop app. Example: `.env`, `.env.local`, `config/secrets.json` with `#` comments.
* `.claude/settings.json`: settings Claude Code enforces directly, whether or not Claude follows them (unlike CLAUDE.md, which is guidance). Keys include `permissions` (allow, deny or prompt before specific tools or commands), `hooks` (run scripts on events such as before a tool call or after a file edit), `statusLine`, `model`, `env` and `outputStyle`. It overrides global `~/.claude/settings.json`; local settings, CLI flags and managed settings override it. Bash permission patterns support wildcards: `Bash(npm test *)` matches any command starting with `npm test`. Array settings such as `permissions.allow` combine across all scopes; scalar settings such as `model` use the most specific value. Example: allow `Bash(npm test *)` and `Bash(npm run *)`, deny `Bash(rm -rf *)`, and a `PostToolUse` hook with matcher `Edit|Write` running `jq -r '.tool_input.file_path' | xargs npx prettier --write`.
* `.claude/settings.local.json`: personal overrides with the same schema, the highest of the user-editable settings files (CLI flags and managed settings still win). When Claude Code saves a setting to it in a repository that does not already ignore it, it adds `**/.claude/settings.local.json` to your global git excludes file: `core.excludesFile` from your global git config when set to an absolute or `~`-prefixed path, otherwise `$XDG_CONFIG_HOME/git/ignore`, or `~/.config/git/ignore`. To share the ignore rule with the team, also add it to the project `.gitignore`. Example: `permissions.allow` of `Bash(docker *)`.
* `.claude/rules/`: project instructions split into topic files. A rule without `paths:` frontmatter loads at session start like CLAUDE.md; a rule with `paths:` globs loads only when Claude reads, writes or edits a matching file. Rules are guidance, not enforced configuration; for guaranteed behavior use hooks or permissions. Subdirectories work (`.claude/rules/frontend/react.md` is discovered automatically). When CLAUDE.md approaches 200 lines, start splitting into rules. Examples: `testing.md` with `paths:` of `**/*.test.ts` and `**/*.test.tsx` (descriptive test names, mock external dependencies, clean up side effects in afterEach); `api-design.md` with `paths:` of `src/api/**/*.ts` (validate input with Zod schemas, return `{ data: T } | { error: string }`, rate limit public endpoints).
* `.claude/skills/`: each skill is a folder with a `SKILL.md` plus any supporting files, invoked with `/skill-name` or when Claude matches the task to the skill. Use `disable-model-invocation: true` for user-only workflows such as `/deploy`, or `user-invocable: false` to hide a skill from the `/` menu while Claude can still invoke it. Skills accept arguments: `/deploy staging` passes "staging" as `$ARGUMENTS`; use `$0`, `$1` for positional access. The `description` frontmatter determines when Claude auto-invokes the skill. Bundle reference docs next to `SKILL.md`; Claude knows the skill directory path and can read supporting files when they are mentioned, and scripts in injection commands can use the `${CLAUDE_SKILL_DIR}` placeholder. Example `security-review/SKILL.md`: frontmatter with `description`, `disable-model-invocation: true` and `argument-hint: <branch-or-path>`, a `## Diff to review` heading, the line `` !`git diff $ARGUMENTS` `` (a `` !`...` `` line runs a shell command and injects its output into the prompt), an audit list, and a pointer to `checklist.md` in the same directory, which Claude reads on demand.
* `.claude/commands/`: a file at `commands/deploy.md` creates `/deploy` the same way a skill at `skills/deploy/SKILL.md` does, and both can be auto-invoked by Claude. Commands and skills are now the same mechanism; for new workflows use skills (a skill can bundle supporting files). If a skill and a command share a name, the skill takes precedence. Use `$ARGUMENTS` for parameters (`/fix-issue 123`). Example `fix-issue.md`: frontmatter `argument-hint: <issue-number>`, then the line `` !`gh issue view $ARGUMENTS` `` and a numbered fix procedure.
* `.claude/output-styles/`: project-scoped output styles, only if the team shares one (most live in `~/.claude/output-styles/`). Files are read at startup; the style selected with `outputStyle` applies to every response.
* `.claude/agents/`: each markdown file defines a subagent with its own system prompt, tool access and optionally its own model, running in a fresh context window separate from the main session. Restrict tool access with the `tools:` frontmatter field. Typing `@` and picking an agent from the autocomplete delegates directly. Example `code-reviewer.md`: frontmatter `name: code-reviewer`, a `description`, and `tools: Read, Grep, Glob` (read-only); the body is the subagent's system prompt.
* `.claude/workflows/`: each `.js` file is a dynamic workflow, a script the runtime executes to spawn and coordinate many subagents. Workflows are written by Claude and saved here from `/workflows` (press `s` on a run) rather than authored from scratch. Loaded at startup; each file becomes a `/<name>` command. A project workflow takes precedence over a personal one in `~/.claude/workflows/` with the same name.
* `.claude/agent-memory/`: subagents with `memory: project` in their frontmatter get a dedicated directory here; the first 200 lines (capped at 25KB) of `MEMORY.md` are loaded into the subagent system prompt when it runs. It is created only for subagents that set `memory:`, and the subagent writes `<agent-name>/MEMORY.md` itself (for example `# code-reviewer memory` with `## Patterns seen` and `## Recurring issues`). It is distinct from the main session auto memory at `~/.claude/projects/`. To keep memory out of version control use `memory: local`, which writes to `.claude/agent-memory-local/`; for cross-project memory use `memory: user`, which writes to `~/.claude/agent-memory/`.

Global files (in your home directory, never committed):

* `~/.claude.json`: state that does not belong in settings.json: OAuth session, per-project trust decisions (the `projects` key tracks trust-dialog acceptance and last-session metrics), personal MCP servers (user scope applies across all projects, local scope is per project but not committed), and UI toggles such as `autoConnectIde` and `externalEditorContext`. Read at session start; Claude Code writes back when settings change in `/config` or trust prompts are approved. Permission rules approved in-session go to `.claude/settings.local.json` instead. Team-shared servers go in `.mcp.json` at the project root.
* `~/.claude/CLAUDE.md`: personal preferences for every project, loaded alongside the project CLAUDE.md at session start; when instructions conflict, project-level instructions take priority. Keep it short (response style, commit format, personal conventions).
* `~/.claude/settings.json`: default settings for all projects, with the same keys as project `settings.json` (permissions, hooks, model, environment variables). Project `settings.json` overrides matching keys set here, unlike CLAUDE.md, where global and project files are both loaded into context rather than merged key by key.
* `~/.claude/keybindings.json`: custom keyboard shortcuts for the interactive CLI, read at session start and hot-reloaded on edit. `/keybindings` creates or opens it with a schema reference. Ctrl+C, Ctrl+D, Ctrl+M and Caps Lock are reserved and cannot be rebound. Example: under `bindings`, a `context` of `Chat` binding `ctrl+e` to `chat:externalEditor` and `ctrl+s` to `null` (unbound).
* `~/.claude/themes/`: each `.json` file defines a custom color theme: a built-in `base` preset plus an `overrides` map of color tokens (for example name `Dracula`, base `dark`, overrides for `claude`, `error`, `success`). Create one with `/theme` or by hand; selecting it stores `custom:<slug>` as the theme preference. Read at session start and hot-reloaded.
* `~/.claude/projects/<project>/memory/`: auto memory, Claude's own notes per project, keyed by the repository path. On by default; toggle with `/memory` or `autoMemoryEnabled` in settings. `MEMORY.md` is the index loaded each session (first 200 lines or 25KB, whichever comes first) and points to topic files; Claude creates and updates it itself and you do not write it. Topic files such as `debugging.md`, `architecture.md` or `build-commands.md` are created when `MEMORY.md` grows long and are read on demand, not at startup. They are plain markdown that you can edit or delete. Example index: `# Memory Index` with a `## Project` list (`build-and-test.md`: npm run build (~45s), Vitest, dev server on 3001; `architecture.md`: API client singleton, refresh-token auth) and a `## Reference` list (`debugging.md`: auth token rotation and DB connection troubleshooting). Example topic file: frontmatter `name: Debugging patterns`, `type: reference`, with `## Auth Token Issues` and `## Database Connection Drops` sections.
* `~/.claude/rules/`, `~/.claude/skills/`, `~/.claude/commands/`, `~/.claude/agents/`, `~/.claude/workflows/`: the user-level counterparts of the project folders, with the same format, available in every project. A project-level item with the same name takes precedence for workflows and output styles.
* `~/.claude/output-styles/`: each markdown file defines an output style, a set of instructions that by default also replaces the built-in software-engineering task instructions. Select a built-in or custom style with `/output-style`, `/config`, or the `outputStyle` key in settings. Built-in styles Default, Proactive, Concise, Explanatory and Learning ship with Claude Code. Set `keep-coding-instructions: true` in frontmatter to keep the default task instructions alongside your additions. Switching styles mid-session applies from the next message; in the terminal, a style file created or edited mid-session is picked up after a restart. Example `teaching.md`: adds a "Why this approach" note after each task and leaves `TODO(human)` markers for changes under 10 lines; select it by setting `outputStyle` to the filename without `.md`, or to the `name` frontmatter field.
* `~/.claude/agent-memory/`: persistent memory for subagents with `memory: user`, stored across all projects and loaded into the subagent system prompt when it starts. For project-scoped subagent memory see `.claude/agent-memory/`.

#### What's not shown

The explorer covers files you author and edit. A few related files live elsewhere:

| File | Location | Purpose |
| - | - | - |
| `managed-settings.json` | System-level, varies by OS | Enterprise-enforced settings that your own settings files and `--settings` values can't override, apart from [narrow exceptions](https://code.claude.com/docs/en/settings#exceptions-to-managed-settings-precedence). See [where to save the file](https://code.claude.com/docs/en/managed-settings#deploy-a-managed-settings-file) and [which managed source Claude Code uses](https://code.claude.com/docs/en/managed-settings#precedence-within-the-managed-tier). |
| `CLAUDE.local.md` | Project root | Your private preferences for this project, loaded alongside CLAUDE.md. Create it manually and add it to `.gitignore`. |
| `AGENTS.md` | Project root, `.claude/`, or any directory | Project instructions you write for AI coding agents. Claude Code can [load it](https://code.claude.com/docs/en/memory#agents-md) in place of a `CLAUDE.md`. |
| Installed plugins | `~/.claude/plugins` | Cloned marketplaces, installed plugin versions, the `installed_plugins.json` install record, and per-plugin data, managed by `claude plugin` commands. Plugins [synced from your claude.ai account](https://code.claude.com/docs/en/plugins/loading#synced-plugins) download into `~/.claude/plugins/synced/`. For a plugin installed from a marketplace [`command` source](https://code.claude.com/docs/en/plugins/marketplace-reference#command-plugin-source) in link mode, Claude Code stores links here instead of a copy, and the plugin's files stay in the directory the command prints. A `command` source requires Claude Code v2.1.229 or later. A plugin listed by relative path in a marketplace you added from a local path also [loads in place](https://code.claude.com/docs/en/plugins/loading#find-plugins-on-disk) from its source directory rather than from a cache copy. See [plugin caching](https://code.claude.com/docs/en/plugins/loading#find-plugins-on-disk) for how orphaned versions are cleaned up. |

`~/.claude` also holds data Claude Code writes as you work: transcripts, prompt history, file snapshots, caches, and logs. See [application data](https://code.claude.com/docs/en/claude-directory#application-data) below.

#### Choose the right file

Different kinds of customization live in different files. Use this table to find where a change belongs.

| You want to | Edit | Scope | Reference |
| :- | :- | :- | :- |
| Give Claude project context and conventions | `CLAUDE.md` | project or global | [Memory](https://code.claude.com/docs/en/memory) |
| Allow or block specific tool calls | `settings.json` `permissions` or `hooks` | project or global | [Permissions](https://code.claude.com/docs/en/permissions), [Hooks](https://code.claude.com/docs/en/hooks) |
| Run a script before or after tool calls | `settings.json` `hooks` | project or global | [Hooks](https://code.claude.com/docs/en/hooks) |
| Set environment variables for the session | `settings.json` `env` | project or global | [Settings](https://code.claude.com/docs/en/settings-reference#all-settings) |
| Keep personal overrides out of git | `settings.local.json` | project only | [Settings scopes](https://code.claude.com/docs/en/settings#where-settings-live) |
| Add a prompt or capability you invoke with `/name` | `skills/<name>/SKILL.md` | project or global | [Skills](https://code.claude.com/docs/en/skills) |
| Define a specialized subagent with its own tools | `agents/*.md` | project or global | [Subagents](https://code.claude.com/docs/en/sub-agents) |
| Orchestrate many subagents from a script | `workflows/*.js` | project or global | [Dynamic workflows](https://code.claude.com/docs/en/workflows) |
| Connect external tools over MCP | `.mcp.json` | project only | [MCP](https://code.claude.com/docs/en/mcp) |
| Change how Claude formats responses | `output-styles/*.md` | project or global | [Output styles](https://code.claude.com/docs/en/output-styles) |

#### File reference

This table lists every file the explorer covers. Project-scope files live in your repo under `.claude/` (or at the root for `CLAUDE.md`, `.mcp.json`, and `.worktreeinclude`). Global-scope files live in `~/.claude/` and apply across all projects.

<Note>
  Several things can override what you put in these files:

  * [Managed settings](https://code.claude.com/docs/en/server-managed-settings) deployed by your organization take precedence over every settings file and `--settings` value, apart from the [exceptions under Settings precedence](https://code.claude.com/docs/en/settings#exceptions-to-managed-settings-precedence)
  * CLI flags like `--permission-mode` or `--settings` override `settings.json` for that session
  * Some environment variables take precedence over their equivalent setting, but this varies: check the [environment variables reference](https://code.claude.com/docs/en/env-vars) for each one

  See [settings precedence](https://code.claude.com/docs/en/settings#settings-precedence) for the full order.
</Note>

Click a filename to open that node in the explorer above.

| File | Scope | Commit | What it does | Reference |
| - | - | - | - | - |
| [`CLAUDE.md`](https://code.claude.com/docs/en/claude-directory#ce-claude-md) | Project and global | ✓ | Instructions loaded every session | [Memory](https://code.claude.com/docs/en/memory) |
| [`rules/*.md`](https://code.claude.com/docs/en/claude-directory#ce-rules) | Project and global | ✓ | Topic-scoped instructions, optionally path-gated | [Rules](https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/) |
| [`settings.json`](https://code.claude.com/docs/en/claude-directory#ce-settings-json) | Project and global | ✓ | Permissions, hooks, env vars, model defaults | [Settings](https://code.claude.com/docs/en/settings) |
| [`settings.local.json`](https://code.claude.com/docs/en/claude-directory#ce-settings-local-json) | Project only | | Your personal overrides, gitignored when Claude Code saves a setting to it | [Settings scopes](https://code.claude.com/docs/en/settings#where-settings-live) |
| [`.mcp.json`](https://code.claude.com/docs/en/claude-directory#ce-mcp-json) | Project only | ✓ | Team-shared MCP servers | [MCP scopes](https://code.claude.com/docs/en/mcp#mcp-installation-scopes) |
| [`.worktreeinclude`](https://code.claude.com/docs/en/claude-directory#ce-worktreeinclude) | Project only | ✓ | Gitignored files to copy into new worktrees | [Worktrees](https://code.claude.com/docs/en/worktrees#copy-gitignored-files-into-worktrees) |
| [`skills/<name>/SKILL.md`](https://code.claude.com/docs/en/claude-directory#ce-skills) | Project and global | ✓ | Reusable prompts invoked with `/name` or auto-invoked | [Skills](https://code.claude.com/docs/en/skills) |
| [`commands/*.md`](https://code.claude.com/docs/en/claude-directory#ce-commands) | Project and global | ✓ | Single-file prompts; same mechanism as skills | [Skills](https://code.claude.com/docs/en/skills) |
| [`output-styles/*.md`](https://code.claude.com/docs/en/claude-directory#ce-output-styles) | Project and global | ✓ | Custom instruction sets that adjust how Claude works | [Output styles](https://code.claude.com/docs/en/output-styles) |
| [`agents/*.md`](https://code.claude.com/docs/en/claude-directory#ce-agents) | Project and global | ✓ | Subagent definitions with their own prompt and tools | [Subagents](https://code.claude.com/docs/en/sub-agents) |
| [`workflows/*.js`](https://code.claude.com/docs/en/claude-directory#ce-workflows) | Project and global | ✓ | Dynamic workflow scripts written by Claude and saved from `/workflows`; each file becomes a `/<name>` command | [Dynamic workflows](https://code.claude.com/docs/en/workflows) |
| [`agent-memory/<name>/`](https://code.claude.com/docs/en/claude-directory#ce-agent-memory) | Project and global | ✓ | Persistent memory for subagents | [Persistent memory](https://code.claude.com/docs/en/sub-agents#enable-persistent-memory) |
| [`~/.claude.json`](https://code.claude.com/docs/en/claude-directory#ce-claude-json) | Global only | | App state, OAuth, UI toggles, personal MCP servers | [Global config](https://code.claude.com/docs/en/settings-reference#global-config-settings) |
| [`projects/<project>/memory/`](https://code.claude.com/docs/en/claude-directory#ce-global-projects) | Global only | | Auto memory: Claude's notes to itself across sessions | [Auto memory](https://code.claude.com/docs/en/memory#auto-memory) |
| [`keybindings.json`](https://code.claude.com/docs/en/claude-directory#ce-keybindings) | Global only | | Custom keyboard shortcuts | [Keybindings](https://code.claude.com/docs/en/keybindings) |
| [`themes/*.json`](https://code.claude.com/docs/en/claude-directory#ce-themes) | Global only | | Custom color themes | [Custom themes](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme) |

#### Frontmatter fields by file

Skills, command files, subagents, output styles, and rules read their configuration from YAML [frontmatter](https://code.claude.com/docs/en/glossary#frontmatter) at the top of the file, and each accepts its own set of fields. This table lists the field names for each file and links to the reference that describes them.

| File | Frontmatter fields | Reference |
| - | - | - |
| `skills/<name>/SKILL.md` | `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility` | [Skill frontmatter](https://code.claude.com/docs/en/skills#frontmatter-reference) |
| `commands/*.md` | The skill fields except `name` and `paths` | [Skill frontmatter](https://code.claude.com/docs/en/skills#frontmatter-reference) |
| `agents/*.md` | `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`, `omitClaudeMd`, `experimental` | [Subagent frontmatter](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields) |
| `output-styles/*.md` | `name`, `description`, `keep-coding-instructions`, `force-for-plugin` | [Output style frontmatter](https://code.claude.com/docs/en/output-styles#frontmatter) |
| `rules/*.md` | `paths` | [Rule frontmatter](https://code.claude.com/docs/en/memory#rules-frontmatter-reference) |

Agents shipped in a [plugin](https://code.claude.com/docs/en/plugins/components#agents) honor a subset of the subagent fields.

#### Troubleshoot configuration

If a setting, hook, or file isn't taking effect, see [Debug your configuration](https://code.claude.com/docs/en/debug-your-config) for the inspection commands and a symptom-first lookup table.

#### Application data

Beyond the config you author, `~/.claude` holds data Claude Code writes during sessions. These files are plaintext. Anything that passes through a tool is written to a transcript on disk: file contents, command output, pasted text.

##### Cleaned up automatically

Claude Code deletes the files in the paths below once they're older than [`cleanupPeriodDays`](https://code.claude.com/docs/en/settings-reference#cleanupperioddays), as long as it can safely determine the retention period. The default is 30 days and the minimum is 1; setting `0` fails with a validation error. The same age cutoff applies to automatic removal of [orphaned worktrees](https://code.claude.com/docs/en/worktrees#clean-up-subagent-and-background-session-worktrees).

| Path under `~/.claude/` | Contents |
| - | - |
| `projects/<project>/<session>.jsonl` | Full conversation transcript: every message, tool call, and tool result |
| `projects/<project>/<session>.orphaned-<timestamp>-<suffix>.jsonl`, `projects/<project>/<session>.jsonl.superseded-<timestamp>` | A previous transcript for the session that Claude Code set aside instead of overwriting or deleting it. It doesn't appear in the session picker |
| `projects/<project>/<session>/subagents/` | [Subagent](https://code.claude.com/docs/en/sub-agents) conversation transcripts, removed with the parent session transcript when it ages out |
| `projects/<project>/<session>/tool-results/` | Large tool outputs spilled to separate files, and full-size copies of [images that MCP tools return](https://code.claude.com/docs/en/mcp#images-in-tool-results) |
| `file-history/<session>/` | Pre-edit snapshots of files Claude changed, used for [checkpoint restore](https://code.claude.com/docs/en/checkpointing). Holds snapshots for the 100 most recent checkpoints; snapshot files that no retained checkpoint references are deleted, except each file's first snapshot |
| `plans/` | Plan files written during [plan mode](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) |
| `debug/` | Per-session debug logs, written while debug logging is on, such as when you start with [`--debug`](https://code.claude.com/docs/en/cli-reference#cli-flags) or run `/debug` |
| `paste-cache/` | Contents of large pastes |
| `image-cache/<session>/` | Attached images saved by Claude Code v2.1.274 and earlier. Later versions save pasted and attached images outside `~/.claude`, in an `images/` directory for each session under the temp directory that [`CLAUDE_CODE_TMPDIR`](https://code.claude.com/docs/en/env-vars) controls. The sweep removes other sessions' leftover directories here, whatever their age. |
| `uploads/<session>/` | Files you attach from the web or mobile app, and photos you attach from the mobile app, when messaging a [Remote Control](https://code.claude.com/docs/en/remote-control) session. An attachment to a [cloud session](https://code.claude.com/docs/en/claude-code-on-the-web) is saved in that session's own cloud environment instead, not on your machine. |
| `dev-mods/<session>/` | [Mods that Claude wrote](https://code.claude.com/docs/en/plugins/mods/create#ask-claude-for-a-mod) during the session |
| `session-env/` | Per-session environment metadata |
| `tasks/` | Task lists written by the task tools, one directory per list |
| `shell-snapshots/` | Aliases, functions, and shell options captured at startup and applied by the [Bash tool](https://code.claude.com/docs/en/tools-reference#bash-tool-behavior) to each command. Removed on clean exit. The sweep clears any left after a crash. |
| `backups/` | Earlier versions of `~/.claude.json`, copied when Claude Code rewrites the file. Claude Code keeps the five newest, plus a copy of any version it couldn't parse. |
| `feedback-bundles/` | Redacted transcript archives written by `/feedback` on third-party providers or when no Anthropic credentials are configured, for sending to your Anthropic account team |
| `feedback/drafts/` | Queued [Claude-drafted feedback](https://code.claude.com/docs/en/tools-reference#sendfeedback-tool-behavior) awaiting your review in `/feedback`. Swept after `cleanupPeriodDays` or 30 days, whichever is shorter. When the queue is at its 10-draft limit, Claude Code deletes the oldest draft to make room. |
| `usage-data/` | `report.html` and timestamped report copies written by [`/insights`](https://code.claude.com/docs/en/costs#analyze-your-usage-patterns), plus cached per-session analysis data used to build them |
| `skills/.trash/`, `plugins/.trash/` | [Skills](https://code.claude.com/docs/en/skills#how-synced-skills-behave) and [plugins](https://code.claude.com/docs/en/plugins/loading#synced-plugins) that the claude.ai sync removed, such as after you turn one off on claude.ai or stop syncing. The files stay here so you can recover them until the sweep deletes them |
| `plugins/installed_plugins.set-aside.<date>.<hash>.json`, `plugins/installed_plugins.unreadable.<date>.<hash>.kept` | Dated copies Claude Code makes before rewriting [`installed_plugins.json`](https://code.claude.com/docs/en/plugins/loading#find-plugins-on-disk): install records it dropped, and the contents of a file it couldn't read. |
| `todos/`, `statsig/`, `logs/` | Legacy directories from older versions. No longer written. The sweep removes their contents and then the empty directory. |

Session files in `sessions/`, auto memory, and Claude Desktop and Cowork transcripts each follow their own retention rule:

* **`sessions/`**: holds one small file per running session, used to detect concurrent sessions and crashes. It isn't part of the age-based sweep: Claude Code removes each file when its session exits and clears crash leftovers on the next launch.
* **Auto memory**: the sweep doesn't delete the memory files in a project's [auto memory](https://code.claude.com/docs/en/memory#auto-memory) directory, `projects/<project>/memory/`. Claude Code removes that directory only if it has been empty for the whole retention period. Before v2.1.228, the sweep treated folders inside the memory directory as session data and could delete old files beneath it.
* **Claude Desktop and Cowork transcripts**: Claude Code keeps the transcript of a session you started or most recently continued in Claude Desktop or Cowork at any age. To give these transcripts an age limit, set [`desktopSessionCleanupPeriodDays`](https://code.claude.com/docs/en/settings-reference#desktopsessioncleanupperioddays). Requires Claude Code v2.1.248 or later; earlier versions delete them after `cleanupPeriodDays`.

  Claude Code deletes these transcripts after `cleanupPeriodDays` instead in either of these cases:

  * [Managed settings](https://code.claude.com/docs/en/managed-settings) set `cleanupPeriodDays`
  * The [HIPAA configuration applies to your sessions](https://code.claude.com/docs/en/hipaa-setup#check-how-developers-sign-in-and-connect)

Claude Code skips the age-based sweep in these cases:

* **Bare mode**: when you run `claude -p` with [`--bare`](https://code.claude.com/docs/en/headless#start-faster-with-bare-mode), Claude Code doesn't run the sweep in that session.
* **Paused sweep**: if Claude Code can't safely determine the retention period, it pauses the retention cleanup sweep; the [`retention_sweep` event](https://code.claude.com/docs/en/monitoring-usage#retention-sweep-event) lists each configuration that pauses it. When the cause is a settings file that can't be read or parsed, or settings errors with `cleanupPeriodDays` or `desktopSessionCleanupPeriodDays` explicitly set, Claude Code also shows a warning in `/status` until you fix the settings errors. When [managed settings](https://code.claude.com/docs/en/server-managed-settings) provide `cleanupPeriodDays`, Claude Code runs the sweep at the managed value in either case.

To check that the machines in your organization run the sweep with the retention period you set, see [Check the retention sweep](https://code.claude.com/docs/en/monitoring-usage#check-the-retention-sweep).

##### Session scratchpad directory

The scratchpad is a per-session directory that Claude Code gives Claude for temporary files: intermediate results, helper scripts, and drafts that don't belong in your project. When Claude says it saved something "to the scratchpad", the file is there. Claude uses it instead of `/tmp`, and can create, edit, and read files in it without a permission prompt.

The scratchpad lives under Claude Code's temp directory rather than `~/.claude`. Find the current session's path for your platform:

* **macOS**: `/private/tmp/claude-<uid>/<project>/<session-id>/scratchpad/`
* **Linux**: `/tmp/claude-<uid>/<project>/<session-id>/scratchpad/`, or the same shape under `$TMPDIR` when your system sets one
* **Windows**: `%TEMP%\claude\<project>\<session-id>\scratchpad\`

`<project>` is your working directory path with every character other than letters and digits replaced by `-`, such as `-Users-you-my-project`. If you set [`CLAUDE_CODE_TMPDIR`](https://code.claude.com/docs/en/env-vars), the tree moves under that directory instead. Hooks receive the current session's path as [`scratchpad_dir`](https://code.claude.com/docs/en/hooks#common-input-fields).

Scratchpad files last as long as the session's transcript: the [retention sweep](https://code.claude.com/docs/en/claude-directory#cleaned-up-automatically) deletes the directory when it deletes the transcript, and [`claude purge`](https://code.claude.com/docs/en/claude-directory#clear-local-data) doesn't touch the temp directory. Because the directory sits under the system temp location, your operating system can also clear it, such as on restart. To keep something Claude wrote there, ask Claude to move it into your project.

A session has a scratchpad only when all of these hold:

* You're signed in with a claude.ai account rather than an API key
* The session uses the Anthropic API, not Amazon Bedrock, Google Cloud's Agent Platform, or Microsoft Foundry
* [`enableArtifact`](https://code.claude.com/docs/en/settings-reference#enableartifact) isn't set to `false`

##### Kept until you delete them

Apart from the rows that say otherwise, the retention cleanup sweep doesn't remove the paths below, and Claude Code keeps them until you delete them.

| Path under `~/.claude/` | Contents |
| - | - |
| `history.jsonl` | Every prompt you've typed, with timestamp and project path. Used for up-arrow recall, `Ctrl+R` history search, and `!` shell-command completion. Each sweep removes the entries older than `cleanupPeriodDays` when the [HIPAA configuration applies to your sessions](https://code.claude.com/docs/en/hipaa-setup#check-how-developers-sign-in-and-connect). |
| `stats-cache.json` | Aggregated token and cost counts shown by `/usage` |
| `remote-settings.json` | Cached copy of [server-managed settings](https://code.claude.com/docs/en/server-managed-settings) for your organization, or `{}` when your organization has configured none. Only present when the session [fetches them](https://code.claude.com/docs/en/server-managed-settings#platform-availability). Claude Code checks for updates at startup and hourly during a session. Claude Code deletes it when you log out. |
| `cache/changelog.md` | Cached copy of the Claude Code changelog, shown by `/release-notes`. Refreshed in the background. |
| `policy-limits.json` | Cached feature policy settings for your organization. Only present for some account types. Refreshed automatically. A `policy-limits.json.stamp.json` sidecar records which account or API key the cache belongs to. Claude Code deletes both files when you log out. |

<h4 id="state-files-to-keep">
  State files to keep
</h4>

Depending on which features you use, `~/.claude/` also holds files that the tables under [Application data](https://code.claude.com/docs/en/claude-directory#application-data) don't list. Of those, caches and lock files are safe to delete. Keep these state files:

* `.credentials.json`: your [login credentials](https://code.claude.com/docs/en/authentication#credential-management)
* `agent-memory/`: [subagent memory](https://code.claude.com/docs/en/sub-agents#enable-persistent-memory)
* `jobs/` and `daemon/`: [background session](https://code.claude.com/docs/en/agent-view#where-state-is-stored) state

##### Plaintext storage

Transcripts and history are not encrypted at rest. OS file permissions are the only protection. If a tool reads a `.env` file or a command prints a credential, that value is written to `projects/<project>/<session>.jsonl`. To reduce exposure:

* Lower `cleanupPeriodDays` to shorten how long Claude Code keeps transcripts
* Set [`desktopSessionCleanupPeriodDays`](https://code.claude.com/docs/en/settings-reference#desktopsessioncleanupperioddays) to give Claude Desktop and Cowork transcripts an age limit too
* Set the [`CLAUDE_CODE_SKIP_PROMPT_HISTORY`](https://code.claude.com/docs/en/env-vars) environment variable to skip writing transcripts and prompt history in any mode. In non-interactive mode, you can instead pass `--no-session-persistence` alongside `-p`, or set `persistSession: false` in the TypeScript Agent SDK; the Python SDK has no equivalent option.
* Use [permission rules](https://code.claude.com/docs/en/permissions) to deny reads of credential files

##### Clear local data

Run `claude purge` to delete the state Claude Code holds for one project. It deletes:

* Transcripts and auto memory under `projects/`
* Per-session `tasks/`, `debug/`, and `file-history/` entries
* Matching prompt lines in `history.jsonl`
* The project's entry in `~/.claude.json`

Images you pasted or attached in the project's sessions and each session's [scratchpad](https://code.claude.com/docs/en/claude-directory#session-scratchpad-directory) are stored under Claude Code's temp directory rather than `~/.claude`, so the purge doesn't remove them. The [retention sweep](https://code.claude.com/docs/en/claude-directory#cleaned-up-automatically) still deletes the images once they're older than `cleanupPeriodDays`; a purged session's scratchpad stays until you delete it or your operating system clears the temp directory.

The command prints the full deletion plan and asks for confirmation before removing anything.

Before v2.1.288, the command was `claude project purge`.

The examples below use `~/work/my-repo` as a placeholder. Replace it with the path to your project. If no state matches the path, the command prints an error and exits with status 1.

Preview the plan without deleting anything:

```bash theme={null}
claude purge ~/work/my-repo --dry-run
```

The plan lists each matching item and why it is included:

```text theme={null}
Purge plan for /home/user/work/my-repo:

  dir:    /home/user/.claude/projects/-home-user-work-my-repo
           project transcripts (.jsonl) and memory/
  config: projects["/home/user/work/my-repo"]
           project entry in ~/.claude.json (trust, history, MCP servers)
  filter: /home/user/.claude/history.jsonl
           12 prompt(s) typed in this project

shell-snapshots/ are not project-scoped and will not be touched
backups/ may still contain this project entry in old .claude.json snapshots (/home/user/.claude/backups); at most 5 are kept and they rotate out automatically
Dry run: 3 item(s) would be deleted.
```

Delete with a single confirmation prompt:

```bash theme={null}
claude purge ~/work/my-repo
```

The command prints the same plan, then asks `Delete 3 item(s) for /home/user/work/my-repo? This cannot be undone. [y/N]` and deletes only if you answer `y`.

Omit the path to pick a project from an interactive list.

Skip the confirmation prompt for use in scripts:

```bash theme={null}
claude purge ~/work/my-repo --yes
```

Pass `--all` instead of a path to purge state for every project at once, which deletes `history.jsonl` outright rather than filtering it. Pass `-i` to step through the deletion plan one item at a time.

The command leaves `shell-snapshots/` and `backups/` alone because those are not project-scoped, and warns about them in the plan output. If anyone ran [`/heapdump`](https://code.claude.com/docs/en/troubleshooting#high-cpu-or-memory-usage) on the machine, delete the `.heapsnapshot` files it wrote too. A heap snapshot contains the full conversation and any credentials the process held, and neither the retention sweep nor the purge touches it.

You can also delete any of the application-data paths above by hand, apart from the [state files to keep](https://code.claude.com/docs/en/claude-directory#state-files-to-keep). New sessions are unaffected. The table below shows what you lose for past sessions.

| Delete | You lose |
| - | - |
| `~/.claude/projects/` | Resume, continue, and rewind for past sessions, and auto memory for every project |
| `~/.claude/history.jsonl` | Up-arrow prompt recall, `Ctrl+R` history search, and `!` shell-command completion |
| `~/.claude/paste-cache/` | Pasted text in recalled prompts; see [paste large content](https://code.claude.com/docs/en/terminal-config#paste-large-content) |
| `~/.claude/uploads/` | Attachments that past [Remote Control](https://code.claude.com/docs/en/remote-control) sessions refer to by path |
| `~/.claude/file-history/` | Checkpoint restore for past sessions |
| `~/.claude/stats-cache.json` | Historical totals shown by `/usage` |
| `~/.claude/usage-data/` | Past [`/insights`](https://code.claude.com/docs/en/costs#analyze-your-usage-patterns) reports and the cached analysis data used to build them |
| `~/.claude/feedback-bundles/` | Feedback and bug-report archives you haven't yet sent to your Anthropic account team |
| `~/.claude/feedback/drafts/` | [Claude-drafted feedback](https://code.claude.com/docs/en/tools-reference#sendfeedback-tool-behavior) you haven't sent |
| `~/.claude/remote-settings.json` | Nothing. Re-fetched on next launch. |
| `~/.claude/cache/changelog.md` | Nothing. Refreshed in the background. |
| `~/.claude/policy-limits.json` | Nothing. Refreshed automatically. |
| `~/.claude/tasks/` | Task lists that a resumed session would pick up |
| `~/.claude/skills/.trash/`, `~/.claude/plugins/.trash/` | The chance to recover [synced skills](https://code.claude.com/docs/en/skills#how-synced-skills-behave) and [synced plugins](https://code.claude.com/docs/en/plugins/loading#synced-plugins) that Claude Code removed |
| `~/.claude/plugins/installed_plugins.set-aside.<date>.<hash>.json`, `~/.claude/plugins/installed_plugins.unreadable.<date>.<hash>.kept` | The copies of plugin install records that Claude Code dropped or couldn't read. Nothing reads them back |
| `~/.claude/debug/`, `~/.claude/plans/`, `~/.claude/session-env/`, `~/.claude/shell-snapshots/`, `~/.claude/backups/` | Nothing user-facing |
| `~/.claude/todos/`, `~/.claude/statsig/`, `~/.claude/logs/`, `~/.claude/image-cache/` | Nothing. Legacy directories not written by current versions. |

Don't delete `~/.claude.json`, `~/.claude/settings.json`, or `~/.claude/plugins/`: those hold your auth, preferences, and installed plugins.

#### Related resources

* [Manage Claude's memory](https://code.claude.com/docs/en/memory): write and organize CLAUDE.md, rules, and auto memory
* [Configure settings](https://code.claude.com/docs/en/settings): set permissions, hooks, environment variables, and model defaults
* [Create skills](https://code.claude.com/docs/en/skills): build reusable prompts and workflows
* [Configure subagents](https://code.claude.com/docs/en/sub-agents): define specialized agents with their own context

---


