# The mod spec

## Table of Contents

- [An example](#an-example)
- [Fields](#fields)
- [The switches the generator writes](#the-switches-the-generator-writes)
- [What the generator refuses](#what-the-generator-refuses)
- [What it writes](#what-it-writes)
- [Choices behind the spec](#choices-behind-the-spec)

Adapted from skills/skill-to-mod/references/mod-spec.md of arm-pz/skill-to-mod (MIT, see NOTICE). A JSON file read by `scripts/scaffold_mod.py`. Keep it at `${CLAUDE_PLUGIN_DATA}/skill-to-mod/specs/<plugin>.json`, never inside the skill folder or under `${CLAUDE_PLUGIN_ROOT}`.

## An example

```json
{
  "plugin": "release-gate-mod",
  "description": "Makes sure the release-gate checklist runs before anything ships.",
  "version": "0.1.0",
  "author": "Your Name",
  "keywords": ["release"],
  "gate": {
    "match": ["git push", "gh pr create", "npm publish", "re:\\bterraform\\s+apply\\b"],
    "example": "git push origin main",
    "required": ["release-gate"],
    "mode": "ask",
    "staleOnEdit": true,
    "maxHolds": 2
  },
  "prime": {
    "match": ["ship it", "go live"],
    "text": "Optional. Defaults to a line naming the outstanding checks."
  },
  "command": { "name": "release-gate-mod" }
}
```

## Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `plugin` | no | Plugin name. Default `<skill>-mod`. Lowercase letters, digits and hyphens; must not start with `claude` or contain `anthropic`. |
| `description` | no | One line for the manifest and README. |
| `version`, `author`, `keywords` | no | Manifest fields. `mods` is always the first keyword. |
| `gate` | one of `gate` and `prime` | Hold ship commands until the required skills have run. |
| `gate.match` | yes | Commands that count as shipping. A plain entry is words matched anywhere a command can start (`git push` matches `cd x && git push`, not `git pushed`). An entry starting `re:` is a raw JavaScript regular expression, test-compiled with Node. |
| `gate.example` | when every entry is `re:` | A command that matches, used by the generated tests. |
| `gate.required` | no | Skills that must have run. Default: the source skill. All must have run. Users change it with `/plugin configure <plugin>@<marketplace>`. |
| `gate.mode` | no | `ask` (default), `block` or `nudge`. The gate has its own on/off switch, the `gate` setting, so `off` is refused. Users change it with `/plugin configure`. |
| `gate.staleOnEdit` | no | Default true. A successful edit clears earlier checks. False leaves out the stale-on-edit hook and its switch. |
| `gate.maxHolds` | no | Default 2. After this many holds the command is let through. |
| `prime` | one of `gate` and `prime` | Add one line of context when a prompt matches. |
| `prime.match` | yes | Phrases, case-insensitive, matched on word boundaries; `re:` raw entries allowed. |
| `prime.example` | when every entry is `re:` | A phrase that matches. |
| `prime.text` | no | The line Claude reads. The default depends on whether a gate exists. |
| `command` | no | `false` for none. Otherwise `{ "name": ... }`; the default name is the plugin name. It must not equal the skill's name. |

There is no field for the switches or the debug log: every mod gets them (PRRD G13 and G14). There is no field for an MCP server either, and a spec with an `mcpServers` or `mcp` key is refused (PRRD G10).

## The switches the generator writes

| Function | `userConfig` key | Default | Present when |
| --- | --- | --- | --- |
| gate | `gate` | on | the spec has a gate |
| stale | `staleOnEdit` | on | the gate keeps `staleOnEdit` |
| status | `statusLine` | on | the spec has a gate |
| prime | `prime` | on | the spec has a prime |
| debug | `debugLog` | off | always |
| the command | `command` | on | the spec keeps the command; settings only |

## What the generator refuses

A missing or broken skill frontmatter, a reserved plugin name, a spec with neither gate nor prime, a spec that asks for an MCP server, `gate.mode` `off` or any unknown mode, a match list with no literal entry and no example, a regular expression that does not compile (or no Node to compile it with), a command named like the skill, an output folder inside `${CLAUDE_PLUGIN_ROOT}` or inside the skill folder, and a non-empty output folder (unless `--force`). It prints the reason in one line and writes nothing.

## What it writes

`.claude-plugin/plugin.json` (with the switches above, plus `mode` and `required` when there is a gate), `hooks/hooks.json`, `hooks/register.js`, `tests/<plugin>.test.ts`, `README.md`, and a copy of the skill in `skills/<name>/`. Its last line is the verify command for the new folder.

## Choices behind the spec

These choices are deliberate. Step 2 of SKILL.md binds every mod this skill builds to them, scaffolded or hand-written:

- **Smallest reach.** No process, network, file, environment or model calls unless the behaviour cannot work without them. Every call is something the installer has to read. The generated mods call only `$.ui.*` and `$.command.register`.
- **Advisory, fail open.** A mod that reads command text cannot be a security control, so make it a reminder: `.catch` handlers that let the call through, a cap on how many times it holds, a way to snooze it. When you recommend a gate, say that enforcement belongs in permission rules or managed settings (chapter skill `mods-doc-cc-permissions-modes`).
- **Never approve on the user's behalf.** Do not hook `tool.check` to return `allow`, and do not submit prompts as the user.
- **The skill still does the work.** Do not copy the skill's scripts or logic into the hooks module. The mod triggers; the bundled skill acts.
- **Every function has a switch** (PRRD G13): the scaffold gives each one a `userConfig` boolean and a session switch, `/<command> <function> off|on`.
- **A debug log that can be switched on** (PRRD G14): off by default, written with `$.ui.log(text, { to: 'debug' })`, every line masked by `redact()` first.
- **No MCP server** (PRRD G10): the scaffold refuses a spec that asks for one. A tool Claude should call becomes `$.tool.register`, a skill, a CLI or a script.
- **Name it `<skill>-mod`.** Names that start with `claude` or contain `anthropic` are refused by the validator, and a command named like the skill would collide with its own `/<skill>`.
