---
name: mods-uninstall-mod
description: "Use when the user asks to uninstall a Claude Code mod plugin, named approximately or incompletely, with or without its marketplace name. Lists the matching installed plugins for the user to pick, uninstalls the one picked with the claude CLI, then reloads the plugins through the run tool."
user-invocable: true
allowed-tools: Bash, mcp__mods-expert-developer-plugin__run
---

# MODS UNINSTALL MOD

## Overview

This skill uninstalls one installed mod plugin with the `claude` CLI. The argument is an approximate or incomplete plugin name, with or without its marketplace name. The skill finds the installed plugins whose names match, has the user confirm or pick one, uninstalls it, and reloads the plugins through the `run` tool. It never uninstalls a plugin the user has not picked.

## Prerequisites

- The `claude` CLI on the PATH, and logged in.
- `jq` on the PATH. Without it, stop and tell the user to install jq.
- The `run` tool (`mcp__mods-expert-developer-plugin__run`) for the reload, as in `mods-install-mod`: it exists only while the developer tools switch is on.

## Instructions

1. Take the argument as the search text. If it is empty, ask the user which plugin to uninstall.

2. If the argument contains `/`, it names a marketplace by its repository. Run `claude plugin marketplace list --json` and take the `name` of the entry whose `repo` equals it. An entry whose `repo` is null never matches. Uninstall takes only names, so the search text becomes that name. If no entry matches, stop and say so.

3. Shortlist the installed plugins. Lowercase the search text and remove spaces, `-`, `_` and `.`. Keep the installed entries whose id, lowercased with the same characters removed, contains that text. Show the user only the shortlist, at most 10 rows:

   ```bash
   Q=$(echo "<search text>" | tr A-Z a-z | tr -d " ._-")
   claude plugin list --json | jq -r --arg q "$Q" ".[] | (.id | ascii_downcase | gsub(\"[-_.]\"; \"\")) as \$n | select(\$n | contains(\$q)) | [.id, .scope, (.projectPath // \"-\")] | @tsv" | head -n 10
   ```

4. Check the scope of each candidate:
   - `user`: a candidate.
   - `local`: a candidate only when its `projectPath` equals the current folder (`pwd -P`). Otherwise refuse it, and name the folder it belongs to.
   - `synced`: `claude plugin uninstall` accepts only the user, project or local scope. Stop for this candidate and say so. Never map it to another scope.

5. Confirm with the user. If no candidate is left, say that no installed plugin matches, and ask for the exact name. If one candidate is left, show its id and scope. If several are left, list them numbered and ask which one to uninstall. Then ask the keep-data question: keep the plugin data (recommended), delete the plugin data, or cancel. Do not uninstall until the user has answered both questions. Never pass `-y`.

6. Uninstall. Run `claude plugin uninstall "<id>" -s "<scope>" --keep-data --json` when the user chose to keep the data, or `claude plugin uninstall "<id>" -s "<scope>" --json` when the user chose to delete it. Read the JSON result. A non-zero exit: stop and report the JSON result verbatim.

7. Reload, as the last step of the turn. Call the run tool with `command` set to `reload-plugins` and `args` set to `--force`. Make no other tool call after it and end the turn; the tool queues the reload until the turn ends.

   If the run tool is not available in this session, do not try another reload path. Make the last line of your reply exactly `FAILED: reload not run (<reason>; turn the developer tools on with /mods-dev-tools on, then start a new session)`, with the reason in place of `<reason>`.

## Output

- The plugin id uninstalled, its scope, and whether its data was kept or deleted.
- The reload: that `/reload-plugins --force` was requested, or the FAILED line of step 7.

## Error Handling

- `jq` is missing: stop and say so.
- The argument is empty: ask for the plugin name.
- The repository in the argument matches no marketplace: stop and say so.
- No candidate remains: ask for the exact name.
- The user cancels: stop. Nothing has changed.
- The uninstall exits non-zero: stop and report the JSON result verbatim.
- The run tool is absent: the FAILED line of step 7.

## Examples

Input: `dev tools`. The shortlist shows a user-scope row and a local-scope row whose folder is not the current one. The local row is refused and its folder is named. The user picks the user-scope row and keeps the data, so the skill runs the uninstall with `--keep-data`, then calls the run tool as the last call of the turn.

## Resources

- `claude plugin uninstall --help`: the flags this skill uses.
