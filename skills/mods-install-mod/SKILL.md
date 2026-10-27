---
name: mods-install-mod
description: "Use when the user asks to install a Claude Code mod plugin, given its exact plugin and marketplace names or the GitHub repos of the plugin and its marketplace. Adds or updates the marketplace, installs the plugin with the claude CLI, then reloads the plugins through the run tool."
user-invocable: true
allowed-tools: Bash, mcp__mods-expert-developer-plugin__run
---

# MODS INSTALL MOD

## Overview

This skill installs one mod plugin from a marketplace with the `claude` CLI. The argument is either the exact names, written `<plugin>@<marketplace>`, or two GitHub repositories: the repository of the plugin and the repository of its marketplace. The skill adds the marketplace, or updates it when it is already added, installs the plugin, and then reloads the plugins through the `run` tool. It acts only on the names the user gives.

## Prerequisites

- The `claude` CLI on the PATH, and logged in.
- `jq` on the PATH. Without it, stop and tell the user to install jq.
- The `run` tool (`mcp__mods-expert-developer-plugin__run`) for the reload. It exists only while the developer tools switch is on: the user turns it on with `/mods-dev-tools on`, then starts a new session.

## Instructions

1. Validate the argument before any command runs. Accept only these two forms, and ask the user for anything else:
   - `<plugin>@<marketplace>`, matching `^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9._-]+$`.
   - `<plugin repo> <marketplace repo>`, each matching `^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$` or an `https://` URL.

   Quote every argument with double quotes when it goes to the shell.

2. Resolve the marketplace. Run `claude plugin marketplace list --json`. An entry matches when its `name` equals the marketplace name, or when its `repo` equals the marketplace repository. An entry whose `repo` is null matches by `name` only.
   - A matching entry: run `claude plugin marketplace update "<name>" --json`.
   - No match: run `claude plugin marketplace add "<source>" --json`, where the source is the marketplace repository or URL. When the argument gave only names, ask the user for the source first.

   If the update or the add exits non-zero, stop and report its JSON result verbatim. Do not install.

3. Find the plugin. Run `claude plugin list --available --json` and read its `available` list. An entry matches when its `pluginId` equals `<plugin>@<marketplace name>`. For repository arguments, an entry also matches when its `source` is an object whose `repo` equals the plugin repository, and its `marketplaceName` equals the marketplace name from step 2. When no entry matches, stop and ask the user for the exact plugin name.

4. Install. Run `claude plugin install "<pluginId>" --json`, with no `-y`. Read the JSON result.
   - When the result shows a `shownCommand`, the marketplace declares a command that runs during the install. Show the user that command and its `sha256` exactly as the JSON gives them, and ask. Only after a yes, run `claude plugin install "<pluginId>" -y --json`. A no stops the skill.
   - A non-zero exit: stop and report the JSON result verbatim.

   Do not use `--accept-command`: it has no effect inside a session.

5. Reload, as the last step of the turn. Call the run tool with `command` set to `reload-plugins` and `args` set to `--force`. Make no other tool call after it and end the turn; the tool queues the reload until the turn ends.

   If the run tool is not available in this session, do not try another reload path. Make the last line of your reply exactly `FAILED: reload not run (<reason>; turn the developer tools on with /mods-dev-tools on, then start a new session)`, with the reason in place of `<reason>`.

## Output

- The marketplace added or updated, by name.
- The plugin id installed, and its version when the JSON result gives one.
- The reload: that `/reload-plugins --force` was requested, or the FAILED line of step 5.

## Error Handling

- `jq` is missing: stop and say so.
- The argument fails step 1: ask for the exact names.
- A marketplace add or update exits non-zero: stop and report its JSON result verbatim.
- No plugin entry matches: ask for the exact plugin name.
- The user declines the shown command: stop, and install nothing.
- The run tool is absent: the FAILED line of step 5.

## Examples

Input: `<plugin>@<marketplace>`. The marketplace is already added, so it is updated, the plugin is installed, and the reload is the last call of the turn.

Input: `<plugin repo> <marketplace repo>`. The marketplace is added from its repository, the plugin is found by its repository, and it is installed.

## Resources

- `claude plugin install --help` and `claude plugin marketplace add --help`: the flags this skill uses.
