## Mods Development

## Table of Contents

* [Create a mod](#create-a-mod)
  * [Ask Claude for a mod](#ask-claude-for-a-mod)
  * [Write a mod yourself](#write-a-mod-yourself)
  * [Change and test a mod](#change-and-test-a-mod)
  * [Share your mod](#share-your-mod)
  * [Related Topics](#related-topics)

## Chapter content

### Create a mod

> Create a mod from a description or write a tool-call counter with a command; validate and reload during development.

A Claude Code mod [plugin](https://code.claude.com/docs/en/plugins/overview) has a JavaScript/TypeScript entry file (hooks module) whose functions handle events:

* **Ask Claude**: [describe the mod](https://code.claude.com/docs/en/plugins/mods/create#ask-claude-for-a-mod) in a session.
* **Write it yourself**: [follow the tutorial](https://code.claude.com/docs/en/plugins/mods/create#write-a-mod-yourself). Claude Code loads `.js`/`.ts` directly; no Node.js, bundler, or build step required.

First [compare alternatives](https://code.claude.com/docs/en/plugins/mods/overview#compare-mods-settings-hooks-skills-and-mcp-servers) if unsure a mod fits.

<Note>
  Requires Claude Code v2.1.287+; check shell `claude --version`. See [Check whether mods can load](https://code.claude.com/docs/en/plugins/mods/troubleshoot#check-whether-mods-can-load).
</Note>

#### Ask Claude for a mod

Describe it in an interactive session. Claude's built-in [skill](https://code.claude.com/docs/en/skills) `plugin-authoring` specifies write locations, your version's events/methods, and loading. Claude can load it on request, or you can run `/plugin-authoring` at the prompt.

Approval runs the mod, except in [sessions where it can't load](https://code.claude.com/docs/en/plugins/mods/create#sessions-that-skip-the-approval).

<Steps>
  <Step title="Describe the mod">
    Example request: `make a mod that shows the current git branch above the prompt`. Claude gives it a directory in `~/.claude/dev-mods/` + session ID, e.g. `~/.claude/dev-mods/3f2a9c1e-5b7d-4e8a-9c21-6d0f4b8a7e13/git-branch/`.

    <Note>
      `~/.claude` is protected: `default`/`acceptEdits` [permission modes](https://code.claude.com/docs/en/permission-modes#protected-paths) ask before creating each mod file. Approve each.
    </Note>
  </Step>

  <Step title="Approve the mod">
    Saving the first file prompts to enable session hot reloading: run session-written mods and pick up later changes.

    * **Enable for this session**: session-folder mods load at turn end, then reload at the end of each turn modifying them. Approval persists through session resume.
    * **Not now**: nothing loads now; files remain and mods load when that session next starts. Delete the directory to prevent loading permanently.
  </Step>

  <Step title="Check that the mod loaded">
    Run `/plugin`; press Tab to **Installed** to find/disable the mod.
  </Step>

  <Step title="Try the mod">
    Try the requested behavior (here, branch name above the prompt box). Ask Claude for corrections; file changes reload at each modifying turn's end, so retry as soon as Claude finishes.
  </Step>
</Steps>

##### Use the mod in other sessions

Claude-written mods load only in their creating session; its mods folder is deleted after [`cleanupPeriodDays`](https://code.claude.com/docs/en/settings-reference#cleanupperioddays). To retain a mod, copy its directory elsewhere, e.g. `~/mods/git-branch`, then load it:

* **In a session you start**: in your shell, run `claude --plugin-dir ~/mods/git-branch`
* **For other people**: [add it to a marketplace](https://code.claude.com/docs/en/plugins/mods/create#share-your-mod) so they can install it

<h3 id="sessions-that-skip-the-approval">
  Sessions where a mod Claude writes can't load
</h3>

Claude-written mods require approval, a trusted workspace, and enabled mods. They do not load when:

* **No approval prompt possible**: `claude -p` or [`dontAsk` mode](https://code.claude.com/docs/en/permission-modes).
* **Workspace untrusted**: its directory trust prompt remains unaccepted.
* **Mods disabled**: `--safe-mode`, `--bare`, `disableAllHooks`, or [managed settings block loading](https://code.claude.com/docs/en/plugins/mods/admin#choose-how-much-to-allow).

#### Write a mod yourself

Build `first-mod`: count Claude's tool calls, display the count beside the working spinner, and print it with `/tally`. Then inspect adjacent generated types and run `claude plugin validate` to learn your version's events/methods and what Claude Code reads from the code.

Recording: the finished mod counts in the spinner, prints via `/tally`, and applies a code edit during the running session:

<Frame>
  <video autoPlay muted loop playsInline controls className="w-full dark:hidden" src="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-first-mod-light.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=eb561134afa90375777408453ba51c77" aria-label="In a Claude Code session, the prompt 'list the files here and read the README' is typed and sent. The spinner reads 'Thinking · tool calls: 1' and the count rises as Claude works. The /tally command prints 'first-mod: Claude has made 3 tool calls since this mod loaded'. A line says first-mod reloaded and lists its four hooks. On the next prompt the spinner reads 'Thinking · tools used: 1'." data-path="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-first-mod-light.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=eb561134afa90375777408453ba51c77" />

  <video autoPlay muted loop playsInline controls className="w-full hidden dark:block" src="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-first-mod-dark.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=09779dadc7ef66c2b1e2da0c2e31ac72" aria-label="In a Claude Code session, the prompt 'list the files here and read the README' is typed and sent. The spinner reads 'Thinking · tool calls: 1' and the count rises as Claude works. The /tally command prints 'first-mod: Claude has made 3 tool calls since this mod loaded'. A line says first-mod reloaded and lists its four hooks. On the next prompt the spinner reads 'Thinking · tools used: 1'." data-path="https://mintcdn.com/claude-code/dgiVO_Od1X1faduV/images/mods-first-mod-dark.mp4?fit=max&auto=format&n=dgiVO_Od1X1faduV&q=85&s=09779dadc7ef66c2b1e2da0c2e31ac72" />
</Frame>

You write three files:

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
* **`register.js`**: your code, called the hooks module

<Steps>
  <Step title="Create the plugin directory">
    Create the two directories that hold the files:

    <Tabs>
      <Tab title="Bash or Zsh">
        ```bash theme={null}
        mkdir -p first-mod/.claude-plugin first-mod/hooks
        ```
      </Tab>

      <Tab title="PowerShell">
        ```powershell theme={null}
        New-Item -ItemType Directory -Force first-mod\.claude-plugin, first-mod\hooks
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Write the manifest">
    The mod requires a plugin [manifest](https://code.claude.com/docs/en/plugins/manifest-reference), with no special fields here. Save as `first-mod/.claude-plugin/plugin.json`:

    ```json first-mod/.claude-plugin/plugin.json theme={null}
    {
      "name": "first-mod",
      "version": "0.1.0",
      "description": "Counts Claude's tool calls, shows the count beside the spinner, and adds a /tally command",
      "author": { "name": "Your Name" }
    }
    ```
  </Step>

  <Step title="Tell Claude Code where your code is">
    Loading reads `hooks/hooks.json`; its `modules` key makes the plugin a mod. List one code path relative to `hooks.json`: here `register.js`, written next.

    Save as `first-mod/hooks/hooks.json`:

    ```json first-mod/hooks/hooks.json theme={null}
    {
      "description": "The first-mod hooks module",
      "modules": ["./register.js"]
    }
    ```
  </Step>

  <Step title="Write the code">
    On load, Claude Code calls the hooks module's exported `register`, passing [`on`](https://code.claude.com/docs/en/plugins/mods/reference#the-hook-function). Each `on` call registers a hook for its named event.

    Save as `first-mod/hooks/register.js`:

    ```javascript first-mod/hooks/register.js theme={null}
    // The count, shared by the hooks below
    let calls = 0

    // Claude Code calls this once when the mod loads
    export function register(on) {
      // Runs when the session starts, before your first prompt
      on('session.start', async ($, e, next) => {
        // Add the /tally command
        await $.command.register({
          name: 'tally',
          description: 'Show how many tool calls Claude has made',
        })
        // Let the session start as usual
        return next(e)
      })

      // Runs each time Claude is about to use a tool
      on('tool.call', async ($, e, next) => {
        calls += 1
        // Ask Claude Code to draw the interface again, so the new count shows
        $.ui.invalidate('ui.render')
        // Let the tool run as usual
        return next(e)
      })

      // Runs when you type /tally, and only then, because of the matcher
      on('command.run', { command: 'tally' }, async () => {
        // The text to print in the transcript
        return { text: 'Claude has made ' + calls + ' tool calls since this mod loaded' }
      })

      // Runs each time Claude Code draws the spinner
      on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
        // Keep Claude Code's spinner, with the count added after its word
        return next({ ...e, props: { ...e.props, suffix: ' · tool calls: ' + calls + '…' } })
      })
    }
    ```

    `calls` is shared by four hooks:

    * **[`session.start`](https://code.claude.com/docs/en/plugins/mods/reference#session)**: before the first prompt and on every reload; registers `/tally`.
    * **[`tool.call`](https://code.claude.com/docs/en/plugins/mods/reference#tools)**: before each tool; increments `calls`, requests redraw.
    * **[`command.run`](https://code.claude.com/docs/en/plugins/mods/reference#commands-and-configuration)**: `/tally` returns text to print.
    * **[`ui.render`](https://code.claude.com/docs/en/plugins/mods/reference#interface)**: appends count after the spinner's word on each draw.

    Arguments/returns: [How the example mod works](https://code.claude.com/docs/en/plugins/mods/create#how-the-example-mod-works).
  </Step>

  <Step title="Load the mod">
    Start Claude Code with the `--plugin-dir` flag, which loads a plugin directory for one session without installing it:

    ```bash theme={null}
    claude --plugin-dir ./first-mod
    ```
  </Step>

  <Step title="Try the mod">
    Ask Claude to do something that takes a few tool calls, such as `list the files here and read the README`. While Claude works, the spinner's word is followed by a count that rises, as in `Thinking · tool calls: 2…`. When Claude finishes, type `/tally` and press Enter. The transcript shows `first-mod: Claude has made 2 tool calls since this mod loaded`, with your own count. Claude Code puts the plugin's name in front of the command's text.

    To check the command without an interactive session, run it in non-interactive mode:

    ```bash theme={null}
    claude -p "/tally" --plugin-dir ./first-mod
    ```

    ```text theme={null}
    first-mod: Claude has made 0 tool calls since this mod loaded
    ```

    If `/tally` isn't in the command list, the module didn't load. See [Find out why a mod does nothing](https://code.claude.com/docs/en/plugins/mods/troubleshoot#find-out-why-a-mod-does-nothing).
  </Step>

  <Step title="Change the code while the session runs">
    Leave the session open. In `register.js`, change `' · tool calls: '` to `' · tools used: '` in the `ui.render` hook and save. The highlighted line is the one that changes:

    ```javascript first-mod/hooks/register.js {4} theme={null}
      // Runs each time Claude Code draws the spinner
      on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
        // Keep Claude Code's spinner, with the count added after its word
        return next({ ...e, props: { ...e.props, suffix: ' · tools used: ' + calls + '…' } })
      })
    ```

    A line in the transcript says `first-mod` reloaded and lists its hooks, and the next spinner uses the new text, as in `Thinking · tools used: 1…`.
  </Step>
</Steps>

##### How the example mod works

Every hook passed to `on` receives:

* **Mods API `$`**: all methods for reaching outside the mod, in [namespaces](https://code.claude.com/docs/en/plugins/mods/reference#mods-api-methods) such as `$.ui`/`$.command`.
* **Event `e`**: plain [input data](https://code.claude.com/docs/en/plugins/mods/reference#events), e.g. tool name/arguments.
* **Next handler [`next`](https://code.claude.com/docs/en/plugins/mods/events#how-a-hook-handles-an-event)**: forwards the event through other mods to Claude Code's behavior; returns its result.

`first-mod` uses:

* **Observe**: `session.start` registers the command; `tool.call` counts/requests redraw. Both return `next(e)`, preserving normal session/tool behavior.
* **Answer**: `command.run` returns its own result without `next`. Second `on` argument `{ command: 'tally' }` is a [matcher](https://code.claude.com/docs/en/plugins/mods/events#filter-which-events-a-hook-handles) restricting it to `/tally`.
* **Rewrite**: `ui.render` calls `next` with copied `e`, setting `suffix` to the count; the normal spinner retains its word with text appended.

Claude Code watches `--plugin-dir` directories and hot-reloads the hooks module when files change. Reload reruns `register`, resets `calls` to `0`, and restarts `/tally` counting. For persistence, see [Keep state](https://code.claude.com/docs/en/plugins/mods/interface#keep-state).

#### Change and test a mod

After loading, ask Claude for changes, check against version-specific types, inspect detected events/calls, and test.

##### Change a mod with Claude

To change a mod you already have, start the session with `--plugin-dir` pointed at the mod's directory, so that what Claude writes loads in the same session:

```bash theme={null}
claude --plugin-dir ./first-mod
```

Ask, e.g. `add a /tally-reset command to this mod that sets the tally back to zero`. Claude edits the module, runs `claude plugin validate`, and fixes findings. `--plugin-dir` directories are [protected paths](https://code.claude.com/docs/en/permission-modes#protected-paths): `default`/`acceptEdits` require approval per edit; the protected-paths table covers other modes.

Claude's saved changes reload at turn end; try `/tally-reset` immediately afterward.

<h3 id="get-the-types-for-your-build">
  Get type definitions for your version
</h3>

Loading an interactive `--plugin-dir` mod or one [Claude wrote](https://code.claude.com/docs/en/plugins/mods/create#ask-claude-for-a-mod) generates TypeScript declarations in `.claude-plugin/types/`: exact running-version events, API methods, and elements for editor autocomplete/type-checking. Files:

| Path | What it declares |
| :- | :- |
| `claude-code/index.d.ts` | Every event and its input and result, every mods API namespace and method, and the elements each surface can draw |
| `claude-code-tools/index.d.ts` | The built-in tools' inputs and results, so that checking `e.tool === 'Bash'` narrows `e` |
| `claude-code-mcp/index.d.ts` | The inputs of the MCP tools that were connected the last time you saved a file in the mod |
| `index.d.ts` in a directory named for a plugin | What that plugin adds to the mods API. There's one directory for each plugin your `plugin.json` lists under `dependencies`. |
| `tsconfig.json` | Compiler options that fit a hooks module |

Without a mod-owned `tsconfig.json`, Claude Code adds a root config extending the generated one; the editor and `tsc -p ./first-mod` then type-check without further setup.

Events/methods change across releases: generated files override conflicting pages, including this one. `claude-code/index.d.ts` is the fullest build reference, with a comment/example per API method; search names such as `'tool.call'`.

##### Check what Claude Code reads from your mod

Shell `claude plugin validate` checks the manifest and performs the same source static analysis as mod loading, without executing the code or starting a session. Target the mod directory:

```bash theme={null}
claude plugin validate ./first-mod
```

For `first-mod`, the output includes these lines.

```text theme={null}
  ❯ ./register.js hooks: session.start, tool.call, command.run{command=tally}, ui.render{component=Spinner}
  ❯ ./register.js calls: $.command.register, $.ui.invalidate

✔ Validation passed
```

Inspect `hooks:` (events, with filters in braces), `calls:` (every API method), `env reads:`/`env writes:` for environment access, and `state reads:`/`state writes:` for [`$.state`](https://code.claude.com/docs/en/plugins/mods/interface#keep-state). Each action-refusing hook gets a line such as `gating hook without .catch: tool.call`, indicating whether it has a [`.catch` handler](https://code.claude.com/docs/en/plugins/mods/events#handle-a-hook-that-fails).

An event missing from `hooks:` won't be called. Common cause: misspelling, reported e.g. as `"tool.calls" is not an event`.

Static-analysis requirements:

* Write each mods API call in full: `$`, the namespace, then the method, as in `$.store.get('notes')`. You can pass `$` to a function declared at the top level of the same file, and for a function of yours named `loadNotes`, the `calls:` line then reads `$.store.get (via loadNotes)`. Passing `$` to a method, a function defined inside the hook, or a function you import from another of your files fails validation. The `read` and `update` functions that [`$.state`](https://code.claude.com/docs/en/plugins/mods/interface#keep-state) uses are the imports that can take it. Don't assign `$` or one of its namespaces to a variable, destructure it, or index it with a computed name. `const ui = $.ui` fails with `$.ui is used as a value`.
* Write the event name in each `on` call as a string literal, such as `'tool.call'`. A variable, or a loop over a list of names, fails with `the event name passed to on() is not a string literal`.
* Inside `register`, don't declare a second variable or parameter named `on`. Validation fails with `"on" is declared again (shadowed)`.
* Import only from files inside the plugin directory, by relative path. The one bare import allowed is `claude-code`, for types and a few helpers.
* Use `import` declarations at the top of the file, as in `import { name } from './file.js'`. A dynamic `import()` fails with `a dynamic import(); a hooks module imports its own files with an import declaration`.
* Write every file as an ES module, with `import` and not `require`. The [reference](https://code.claude.com/docs/en/plugins/mods/reference#files) lists the file extensions Claude Code loads.

##### Test the mod

`claude plugin test` runs automated event/behavior tests from the shell without a session, sign-in, or network.

This test fires two tool calls, runs `/tally`, and checks both were counted. Save as `first-mod/tests/first-mod.test.ts`:

```typescript first-mod/tests/first-mod.test.ts theme={null}
import { expect, test } from 'claude-code/testing'

test('/tally reports the tool calls the mod has seen', async ($, on) => {
  // Answer each tool call in Claude Code's place, so no tool runs
  on('tool.call', () => ({ result: 'ok' }))

  // Fire two tool calls, which the mod's tool.call hook counts
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: 'README.md' })

  // Run /tally and check the text its hook returns
  const answer = await $.command.run({ command: 'tally', args: '' })
  expect(answer.text).toBe('Claude has made 2 tool calls since this mod loaded')
})
```

In your shell, run the tests from the `first-mod` directory:

```bash theme={null}
claude plugin test
```

The output names each test and whether it passed, with timings that vary from run to run:

```text theme={null}
tests/first-mod.test.ts:
(pass) /tally reports the tool calls the mod has seen [22.87ms]

 1 pass
 0 fail
Ran 1 test across 1 file. [0.19s]
```

[Test a mod](https://code.claude.com/docs/en/plugins/mods/test) covers stubbing a model call or the store, and testing timers and drawings.

#### Share your mod

A mod is a plugin, so you version it in the manifest and people install and update it with the `/plugin` commands. How you share it depends on who it's for:

* **A few people**: send them the plugin's directory or a `.zip` of it. See [Share a plugin without a marketplace](https://code.claude.com/docs/en/plugins/publish#share-a-plugin-without-a-marketplace)
* **Your team**: list it in [your own marketplace](https://code.claude.com/docs/en/plugins/publish#publish-through-your-own-marketplace), such as a private repository with one directory for each plugin. To add that marketplace for everyone who works in a repository, [register it in the repository's settings](https://code.claude.com/docs/en/plugins/host-marketplace#register-the-marketplace-for-everyone-in-a-repository)
* **Your whole organization**: an administrator can [install your organization's mods](https://code.claude.com/docs/en/plugins/mods/admin#install-your-organizations-mods) through managed settings
* **Anyone**: make your marketplace's repository public, or [submit the plugin to Anthropic's directory](https://code.claude.com/docs/en/plugins/publish#submit-to-anthropics-directory)

Check `name` before sharing: `claude plugin validate` rejects names [resembling Anthropic's](https://code.claude.com/docs/en/plugins/manifest-reference#name), e.g. starting `claude-`. Events/methods change by release; record the tested Claude Code version in README.

Develop against `--plugin-dir`, not an installed copy: installed plugins are cached by version; edits reach them only after incrementing the version and reinstalling.

#### Related Topics

* [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface): open a pane, draw above the prompt, and add buttons and text fields
* [React to events](https://code.claude.com/docs/en/plugins/mods/events): hook tool calls, prompts, and turns
* [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api): add commands and tools, call a model, and run work on a timer
* [Test a mod](https://code.claude.com/docs/en/plugins/mods/test): stub what Claude Code would answer, and test timers and drawings
* [Troubleshoot a mod](https://code.claude.com/docs/en/plugins/mods/troubleshoot): the reasons a mod does nothing, and the debug log
* [Read the source of built-in mods](https://code.claude.com/docs/en/plugins/mods/overview#read-the-source-of-built-in-mods): complete plugins, each with its hooks module and tests

---
