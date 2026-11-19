# mod-manager profiles and a nicer panel: design spec

Card: TRDD-GSR975M8 (column design). Written 2026-10-31 against HEAD c9a9462 (mod code as of f19588d), and revised the same day after two review rounds (section 12). Covers the card's owner directive, its interpretations, the UPDATE line, the OWNER FACT line, the REVIEW 2 line and the coordinator's correction that the installedAt stamp is unverified. Where this spec and the card disagree, the card's STATE block wins until the card is updated from this spec.

Rationale in one sentence: let the person save the on/off state of their user-scope plugins as named profiles in ~/.claude/.mod-manager/mods-profiles.json and switch to one on both the terminal and the Desktop app, through `claude plugin` on the terminal and by editing enabledPlugins in the user settings file on Desktop, then compacting and reloading.

## Markers and sources

Every claim carries one marker:

- DOC: a bundled Anthropic chapter says it (file and line given).
- TYPES: the generated types say it, `.claude-plugin/types/claude-code/index.d.ts`, written by Claude Code 2.1.310 (line 1).
- CODE: this plugin's code says it (file:line at f19588d).
- MEASURED: observed once on this machine, Claude Code 2.1.316, 2026-10-31, read-only (field names and counts only). A lead, not a guarantee.
- INFERRED: the design's reading; open to the owner's correction.
- UNVERIFIED: not documented and not observed; each has a live check in section 11.

Chapter short names (each is `skills/<name>/references/chapter.md`):

| Short | Skill folder |
|---|---|
| REF | mods-doc-mods-reference |
| API | mods-doc-mods-api |
| UI | mods-doc-mods-interfaces |
| OVW | mods-doc-mods-overview |
| CMDS | mods-doc-plugin-commands-reference |
| INSTALL | mods-doc-install-and-manage-plugins |
| TRACE | mods-doc-tracing-the-origin-of-a-plugin |
| ORG | mods-doc-manage-plugins-in-organizations |
| TSP | mods-doc-troubleshooting-plugins |
| MANIFEST | mods-doc-plugin-manifest-reference |
| SETREF | mods-doc-cc-settings-reference |
| DEPS | mods-doc-plugins-depending-on-other-plugins |

## 1. Facts this design rests on

### 1.1 What a hooks module can call

- No Node and no file access of its own: a hooks module "runs in an environment of its own: no DOM, no Node" (TYPES 19-20); "The hooks module itself has no Node.js APIs ... and no network or file access of its own" (API 273). So node fs is not available on any surface.
- `$.fs` has exactly `read`, `write`, `list`, `exists`, `stat`, `ancestors` (TYPES 3312-3431; REF 214). There is no rename, no remove and no chmod.
- `$.fs.write` "Writes `text` to a file, creating it and its directories as needed" (TYPES 3332-3338) and "isn't atomic: it replaces the file's content in place, so another process can read a partly written file" (REF 214). Reads and writes are capped at 4 MiB per file (TYPES 3309, 3317; REF 307).
- `$.fs` carries no "CLI only" note; `$.process` does: "Commands on the host, run as the user the session runs as. CLI only." (TYPES 3582). DOC also lists `$.fs` beside `$.process` with no surface limit (API 275-278). Whether a mod's `$.fs` may read and write under ~/.claude on Desktop: UNVERIFIED (live check L1), and an organization's or another mod's `fs.*` hook may refuse any call (TYPES 3308; API 293).
- `$.settings.read` resolves the merged settings, one source's (`{ source }`), or one key (TYPES 3652-3671). Sources are `user`, `project`, `local`, `flag`, `policy` (TYPES 12530). The answer is "a snapshot in plain data: a write to it changes nothing the engine reads" (TYPES 12424-12425), so it reads but never writes.
- `$.store` is "A JSON file of the plugin's own under the user's Claude Code configuration directory" (TYPES 3433-3439), shared by every session on the machine (REF 215); a get and set pair is not atomic (UI 854); 4 MiB in all (REF 316).
- `$.session.surfaces()` lists the surfaces the session draws on, "`terminal` under the REPL first, then the remote ones" (TYPES 2864-2874).

### 1.2 Why the claude CLI cannot be the write path on Desktop

- `$.process` is CLI only (TYPES 3582), so `claude plugin enable|disable|list` cannot be relied on in the Desktop app's Code tab.
- `/plugin` (with `enable`, `disable`, `uninstall` subforms, CMDS 831-833) runs "only in an interactive terminal session" (CMDS 812) and replies "/plugin isn't available in this environment" in "the Claude desktop app's Code tab" (TSP 51). So `$.command.run({ command: 'plugin', ... })` is not a Desktop path either.
- `$.plugin` has only `name` and `root` (REF 202). `$.config.set` changes `/config` rows (TYPES 3195-3200); enabledPlugins is not documented as a row. `$.ui.notice` only adds a line under an open tool dialog (TYPES 2372-2382).
- The person's own Desktop route is "+ > Plugins > Manage plugins" (INSTALL 122).

### 1.3 The Desktop path the owner named: enabledPlugins in the user settings file

- OWNER FACT (card, 2026-10-31): editing enabledPlugins in the user settings.json updates both the terminal and Desktop.
- User scope lives in `enabledPlugins` in ~/.claude/settings.json (INSTALL 156). The terminal, the Desktop app's local sessions and VS Code "read the same settings files" (INSTALL 164).
- Key format: `"<name>@<marketplace>": true` or `false` under `enabledPlugins` (TRACE 62-66); `<name>` is the marketplace entry name, which is the enable key (TRACE 75-77). This matches the mod's `PLUGIN_ID` check (CODE logic.ts:9).
- MEASURED: all 97 user-scope entries of `claude plugin list --json` had an enabledPlugins key in ~/.claude/settings.json and the same true/false value; values are booleans only; one key (a `<name>@builtin` id) is not an installed plugin and must be left alone.
- MEASURED: ~/.claude/settings.json round-trips byte-exact as `JSON.stringify(value, null, 2) + "\n"` (85,883 bytes; mode 600).
- `CLAUDE_CONFIG_DIR` moves settings and plugins away from ~/.claude (SETREF 453). The mod resolves the config dir as `$.env.get('CLAUDE_CONFIG_DIR')` when set, else the home folder plus `/.claude`. The home folder is `$.env.get('HOME')` (read the same way as CODE resolve-bin.ts:86), or `$.env.get('USERPROFILE')` when HOME is unset, as on Windows, where `~/.claude` means `%USERPROFILE%\.claude` (SETREF 453). INFERRED; the profiles folder does not follow it and stays at the owner's literal ~/.claude/.mod-manager/ (the card's ruling; the alternative is Q5).

### 1.4 What the running session needs after a settings change

- Plugins reach the running session in stages: declared in settings, fetched to disk, loaded; "Changes to settings or to disk don't reach this layer until you run /reload-plugins or start a new session" (TRACE 42-49). So `/reload-plugins` is still needed, and the owner's APPLY order (compact, then reload) stands.
- The engine re-merges settings itself "once the loaded plugins or the settings have changed" (TYPES 3667-3671), which fits the owner's fact that both apps see the edit.
- `/reload-plugins [--force]` (CMDS 849-859). A reload that would add or remove a plugin MCP server is refused without `--force` (CMDS 871).
- In the desktop app `/reload-plugins` "runs only when you type it into the session yourself"; arriving "another way" it replies `/reload-plugins isn't available over a remote connection in this session.` and reloads nothing (CMDS 877-879). Whether a mod's `$.command.run` counts as another way: UNVERIFIED (L6). Plugin MCP servers are not reconnected by that reload (CMDS 879).
- `$.command.run` runs a slash command "as if the person typed `/command args`", queued until the session is idle; it rejects "inside a hook the turn waits on" (TYPES 3151-3162). This plugin already sends slash commands that way: CODE self-command/register.ts:49-71 (`$.command.run(request)`), started from `$.clock.after(0, ...)` because of that rejection (register.ts:88-92).
- `$.session.compact(args?)` is "the same call `/compact` makes, between turns"; it resolves the compacted conversation or `{ skip }` when a hook vetoed it, and "rejects while a turn runs" (TYPES 2923-2934, 11326-11420). It is the awaitable way to compact; `$.command.run({ command: 'compact' })` would only queue it.
- A hot reload cancels the module's pending waits (TYPES 3511-3513), and `session.start` fires again after a reload of the mod (REF 136). So nothing may be scheduled after the reload call; it is the last step.

### 1.5 What the panel can draw

- Elements: Box, Text, Button, Link, Code, Markdown, Input, Select, Svg, Client, Raster, Image (REF 258-271). There is no Checkbox and no Switch element: both are Buttons here.
- Button: no colour prop; `variant` is only `primary` or `secondary` (TYPES 1148-1158). A Button may hold `Text` children, drawn in place of the label, with `label` kept as its name (TYPES 1106-1115). Text takes `color`, a theme key or a colour (UI 436; TYPES 1719); theme keys include `error` (TYPES 13455). So DELETE PROFILE is red through a `Text` child with `color: 'error'`. Desktop drawing of a coloured child: UNVERIFIED (L4).
- Input: `key`, `label`, `placeholder`, `value`, `submitLabel`, `rows`, `autoFocus`, `onInput(value)` on every change, `onSubmit(value)` on Enter (TYPES 5627-5682). `onInput` is what makes the live name-collision line possible.
- Box takes `height`, `overflow: 'hidden'`, `flexWrap` (TYPES 983-1022).
- Pane props: `bodyColumns`, `placement` (`dock` or `inline`), `scroll` `{ offset, bodyRows }` (TYPES 10877-10921; REF 228-251). "A tree taller than the pane scrolls as a whole" (REF 252).
- Sticky header route: the `ui.scroll` event "Fires before a site's window moves ... no `next` (`{}` or `{ deny }`) leaves it undrawn, so a hook drawing its own rows under a header moves them by `e.by` and invalidates" (TYPES 4168-4178); `e.by`, `e.bodyRows`, `e.contentRows` (TYPES 15276-15307). `UiScrollComponent` is `Pane` or `AbovePrompt` (TYPES 15248). Desktop raising `ui.scroll` on a Pane: UNVERIFIED (L3).
- Keys: Up and Down move between controls "while your drawing fits", and Up, Down, Page Up, Page Down, Home, End scroll only "when it has more rows than it can show" (UI 547, 550). A tree that always fits therefore gets no keyboard scroll events: the pane needs page buttons with letter hotkeys.
- A tree with an element or prop a surface does not take is replaced by the engine's own drawing (UI 446).

## 2. Files and records

### 2.1 Where things live

| What | Path | Written by | Why there |
|---|---|---|---|
| Profiles | `~/.claude/.mod-manager/mods-profiles.json`, the literal home path even when `CLAUDE_CONFIG_DIR` is set (Q5) | the guarded write (section 3) | the owner's literal path; the owner's path wins over the house rule against new dot folders (card UPDATE line) |
| User settings | `<config dir>/settings.json`, key `enabledPlugins` only | on Desktop, the guarded write; on the terminal, `claude plugin enable\|disable --scope user` (the default, Q12) | the owner's fact (1.3) |
| Installed user-scope plugins | `<config dir>/plugins/installed_plugins.json` (read only) | Claude Code | TRACE 45-47 names it ("records each install with its scope, installPath, and version") |
| Re-apply record | `$.store` key `profile-reapply` | `$.store.set` | per machine: a profiles file copied to another machine must not carry this machine's install history (INFERRED) |

### 2.2 mods-profiles.json, schema 1

```json
{
  "schema": 1,
  "profiles": [
    {
      "id": "p-mhd2k3x1",
      "name": "Writing",
      "createdAt": "2026-10-31T12:00:00.000Z",
      "updatedAt": "2026-10-31T12:05:00.000Z",
      "plugins": {
        "example-mod@example-market": { "enabled": true, "isMod": true },
        "example-tool@example-market": { "enabled": false, "isMod": false }
      }
    }
  ]
}
```

- `id`: `p-` plus the creation time in base 36 from `$.clock.now()`, bumped by one until unique. Stable across renames, so the re-apply record survives a rename. No random source is assumed (Web Crypto's `getRandomValues` is not named in TYPES 17-19: UNVERIFIED).
- `plugins`: one entry per user-scope plugin id at creation (mods and plain plugins alike, interpretation 2). An entry for a plugin that is not installed stays, is listed as not installed, and survives edit, rename, duplicate and save (REVIEW 2 point 4).
- `isMod`: what the classification gave when the entry was last saved; shown for entries that are not installed now, recomputed for installed ones.
- Strict read. A missing file is an empty list. A file that is not JSON, has `schema` other than 1, or holds one malformed profile or entry is refused as a whole: the panel shows the reason with the path and no write of that file runs until it reads clean. A partial accept would drop the unread part at the next save (INFERRED).
- Names (interpretation 5, the agent's addition, not the owner's): trimmed, 1 to 64 characters, no control characters, unique when compared after `normalize('NFC').toLowerCase()`. The person's own spelling is kept. Renaming a profile to a different case of its own name is allowed.
- Order: profiles in creation order; the browser sorts by name for display.

### 2.3 The re-apply record, `$.store` key `profile-reapply`

```json
{ "schema": 1, "profileId": "p-mhd2k3x1", "appliedAt": "2026-10-31T12:06:00.000Z",
  "seen": { "example-mod@example-market": { "installedAt": "2026-10-20T09:00:00.000Z", "lastUpdated": "2026-10-28T08:00:00.000Z" } } }
```

`seen` maps each user-scope plugin id to the `installedAt` and `lastUpdated` it had at the last mod-manager run (section 6). Both are kept because which of them marks a reinstall is UNVERIFIED (section 6.1).

### 2.4 Where the plugin list comes from

- Profile scope (review S4): user-scope marketplace installs, which are the user entries of installed_plugins.json, the file that "records each install with its scope, installPath, and version" (TRACE 45-47). Skills-folder plugins (`<name>@skills-dir`, which can sit at user scope, CODE logic.ts:10-14), session-only plugins (`@inline`) and synced plugins (`@synced`) are not marketplace installs (TRACE 64-69) and stay outside profiles; the Profile view says so in one line. Owner question Q15.
- The list source and the change path follow `changePath(await $.session.surfaces())` (TYPES 2864-2875), one pure function with three answers. An answer that includes `terminal` is a CLI session: the main list keeps `claude plugin list --json` for every scope, as now (CODE cli.ts:19-24), and changes go through `claude plugin` (Q12). A non-empty answer without `terminal` (the Desktop app; VS Code falls here too, TYPES 10627) is treated as a session without `$.process`. An empty answer (a `-p` run, where nothing draws) gets no change path at all: no list, no change, no re-apply. That a Desktop session's answer lacks `terminal`, and that `$.process` rejects there, is UNVERIFIED: the types say only that `terminal` comes first "under the REPL" and that `$.process` is "CLI only" (TYPES 2864-2875, 3582). L1 prints both on each surface.
- A non-empty answer without `terminal` (the Desktop app): the main list is built from installed_plugins.json, user-scope entries only, with the on/off state from enabledPlugins. The pane says so in one line: "Desktop lists your user-scope marketplace plugins only. Skills-folder, project, local and synced plugins, and Uninstall, are in the terminal or in + > Plugins > Manage plugins." (INSTALL 122). The surface answer decides, not a caught `$.process` rejection. Changes there stay off until Q11 is answered yes (`DESKTOP_WRITES`, default `false`); then they use the guarded write of section 3.
- Profile features (NEW PROFILE, the sub panel, APPLY, re-apply) read installed_plugins.json and enabledPlugins on every surface, so they behave the same on both.
- MEASURED: installed_plugins.json is `{ version: 2, plugins: { <id>: [ { scope, installPath, version, installedAt, lastUpdated, gitCommitSha, projectPath, auto, resolvedVersion } ] } }`, 251,395 bytes; its 97 user-scope entries matched `claude plugin list --json` on id, installPath and installedAt 97 out of 97. That machine had no user-scope skills-folder plugin, so the match says nothing about them. The file's shape is not documented beyond TRACE 47: INFERRED. The parser refuses a `version` other than 2 and names any entry it cannot read, as CODE logic.ts:53-85 does for the CLI list.
- An installed user-scope plugin with no enabledPlugins key is shown as "not set" and counts as its manifest `defaultEnabled`, default true (MANIFEST 222-224). MEASURED: none on this machine.
- A user setting can be overridden: local over project over user (INSTALL 162), and managed settings lock enabledPlugins (ORG 203, 216, 414). The panel reads `$.settings.read({ source })` for `project`, `local`, `policy` and `flag`, and marks an entry "overridden here by a project or local setting" or "locked by your organization or a --settings file".

## 3. The guarded write (one writer for both files)

Called with the file path, the text the panel last read (`seenText`), and an edit function. For settings.json the edit only sets `enabledPlugins[id]` for the ids being changed. Which files it writes: mods-profiles.json on every surface; settings.json only where `$.process` is unavailable (Desktop) by default, because on the terminal `claude plugin` changes it (Q11, Q12).

1. `$.fs.stat(path, { resolve: true })` (TYPES 3358-3376). It resolves with `realPath` inside the folder the file belongs in (the config dir for settings.json, ~/.claude/.mod-manager/ for the profiles file): go on, writing through any link, because an in-place write keeps the link. It resolves with `realPath` outside that folder, or with no `realPath` because the path leads nowhere (TYPES 3362-3364): write nothing, and say where the link leads or that it leads nowhere. It rejects because the path is missing (TYPES 3359-3360): if `$.fs.list` of the folder still names the file, it is a link that leads nowhere or an entry the mod cannot read, so write nothing; otherwise it is a first creation, allowed only for mods-profiles.json (the mod never creates settings.json), after the same check on the nearest folder that exists on its path (the folder itself, or ~/.claude while .mod-manager does not exist yet). `$.fs.write` creates the missing folder (TYPES 3332-3338).
2. Read the file now (`$.fs.read`). For settings.json the value of every id about to change must equal the value the panel showed when the person pressed; for the profiles file the whole text must equal `seenText`. On any difference: write nothing, re-read, redraw, and say "settings.json changed since the list was read. Nothing was written; check the list and press again."
3. Parse. Refuse a text that is not a JSON object, or whose `enabledPlugins` is present and not an object of booleans.
4. Layout guard: detect the indent (the leading spaces or tab of the first indented line; none for a one-line file) and whether the text ends with a newline. Re-serialize the unchanged parsed value that way. If that is not byte-identical to the text read, refuse: "settings.json has formatting this mod cannot keep (comments, a byte order mark, Windows line ends, key order or spacing). Nothing was written. Save it as plain JSON and press again." This one guard is what keeps every other key, value and byte intact; it also catches duplicate keys and integer-like keys that JSON would reorder.
5. Apply the edit. For settings.json: never add a key for an id that is not an installed user-scope marketplace plugin (2.4), because an enabled entry is declared state that Claude Code may fetch to disk (TRACE 42-55), which would install it against the owner's "it does not install them". Never touch a key the mod did not mean to change (MEASURED: a `<name>@builtin` key is present).
6. Check the result: parse old and new, and require that they differ only in the intended `enabledPlugins` values (or, for the profiles file, only in what the operation changed). A failure here is a bug and writes nothing.
7. `$.fs.write` the new text in place. In place keeps the file's inode, a symbolic link and its mode 600 (INFERRED from REF 214 "replaces the file's content in place"; checked by L1).
8. Read back. Equal: done. Different but valid JSON: "settings.json changed while it was being written. Check it." and redraw from what is there. Not JSON: "settings.json may be damaged: <path>. Check it before you start a new session.", and the mod refuses every further write until the file reads clean.

No copy of settings.json is kept anywhere: the file can hold secrets (env values, tokens), and a copy made through `$.fs.write` or `$.store` would get a file mode this design cannot set (1.1). The earlier `settings-last-change` record had no reader and is dropped (review N4).

What this does not cover, said in the hand-over: a write by another process between step 2 and step 7 is lost. That window is not milliseconds: every `$.fs` call is an event that other mods' `fs.*` hooks see first (API 293), so it lasts as long as they take. A reader that opens settings.json during step 7 can see a partial file, and a crash or kill during step 7 can leave it truncated, which loses every setting in it, not only plugins (REF 214; Q11). Temp file then rename, and mode 0600 for mods-profiles.json, are not available through the mods API (no rename and no chmod, 1.1): interpretation 5's atomic write and 0600 cannot be built, and this design writes in place; the card now records interpretation 5 as superseded. The profiles file holds plugin ids, booleans and names, no secret. The file mode `$.fs.write` gives a new file: UNVERIFIED (L1).

## 4. Profile operations (pure functions in logic, no `$`)

- `snapshotUserScope(installed, enabledPlugins, isMod)`: one entry per installed user-scope marketplace id (2.4) with its current state. Used by NEW PROFILE.
- `createProfile(name, snapshot, now, existing)`, `duplicateProfile(source, now, existing)` (name `<name> copy`, then `<name> copy 2`, unique under the name rule), `renameProfile`, `deleteProfile`, `saveEdits(profile, draft)`: each returns the new file value or a refusal reason.
- `nameProblem(text, profiles, selfId)`: the reason the name cannot be used, or none. It drives the live line under the RENAME and NEW inputs.
- `applyPlan(profile, installed, enabledPlugins, locks, selfName)`: for each entry, one of
  - change: installed at user scope, its value differs, not locked, not this plugin;
  - same: nothing to do;
  - not installed: kept in the profile, applied later by section 6;
  - kept on: the entry would turn off this plugin itself (name part equals `$.plugin.name`); APPLY never turns off the manager, as the earlier preset decision said (TRDD-J4HRAQF0, "a preset never disables this plugin itself"); INFERRED, owner question Q6;
  - locked: `policy` (managed) or `flag` (`--settings`) settings set it, read with `$.settings.read({ source })` (TYPES 3652-3671, 12530); a managed `false` also blocks and hides the plugin (ORG 203);
  - overridden: written, with a note that a project or local setting wins here.
- Every skip is listed in the confirm question and in the result line, never dropped silently.

## 5. APPLY PROFILE and the reload step

APPLY PROFILE (owner: "it will trigger /reload-plugins after the changes, but it will compact first"):

1. Leave edit or rename mode first (owner rule, section 7.4); the saved profile is what applies.
2. Read installed_plugins.json, settings.json and the `policy`, `flag`, `project` and `local` settings; build `applyPlan`.
3. Nothing to change: a toast "Nothing to change: your plugins already match <name>." No write, no compaction, no reload.
4. Ask with `$.ui.ask` (as CODE state.ts:42-51 and logic.ts:382-392 do): "Apply <name>? Turns on N and off M user-scope plugins. K are not installed and stay in the profile. <skips>. Then the conversation is compacted and plugins reload." Options `Apply, compact and reload` and `Keep it as it is`. Any other answer or a dismissed question changes nothing.
5. Make the changes, in `applyOrder`: every enable before any disable, so a failure part-way never leaves a plugin the profile keeps on without a dependency the profile also keeps on (a plugin whose dependency is off stops loading, DEPS 138-140; the ordering reason is INFERRED). On the terminal (the default, Q12, `TERMINAL_PATH = 'cli'`): one `claude plugin enable|disable <id> --scope user` per change, built by `actionArgv` (CODE logic.ts:335-349), one after another, each with the 120-second timeout the mod-manager already uses (CODE cli.ts:10), while the message line shows `k of N`. The first failure stops the rest: the message names what changed and what did not, the band notice is created with `[ r: Reload plugins ]` so the changes already made can reach the session, and nothing else runs. Pressing APPLY again resumes cleanly, because `applyPlan` diffs against the current state. On Desktop: only after a yes to Q11 (`DESKTOP_WRITES`, default `false`), the guarded write of settings.json with every change at once (section 3), and on refusal nothing else runs. Until then APPLY on Desktop lists the changes and points to + > Plugins > Manage plugins, and writes nothing.
6. Only when every change succeeded, set the re-apply record: `profileId`, `appliedAt`, `seen` = the current installed map.
7. Run the reload step.

The reload step (also the `[ r: Reload plugins ]` button of the band notice, which compacts first, REVIEW 2 point 3):

1. `await $.session.compact()`.
   - Rejects: stop and show the engine's own message. A turn that is running is one documented cause (TYPES 2933); whether a conversation with nothing to compact yet also rejects is UNVERIFIED. The band notice is created, or stays when the step was started from it, with `[ r: Reload plugins ]` (try again) and `[ w: Reload without compacting ]`, which runs step 2 alone; the person chooses, because the owner asked for compaction first (Q14).
   - Resolves `{ skip }`: stop; message "Compaction was skipped: <skip>. Plugins were not reloaded; they load in your next session." The band notice is created or stays, with the same two buttons.
2. `await $.command.run({ command: 'reload-plugins', args: '--force' })`, started from `$.clock.after(0, ...)` as self-command does (CODE self-command/register.ts:88-92), so it never runs inside a hook the turn waits on. `--force` because a reload that changes MCP tools is otherwise refused (CMDS 871), and the owner compacts first precisely to accept that cost: INFERRED, Q9. On Desktop the reload does not connect or disconnect plugin MCP servers (CMDS 879), so `--force` is probably moot there, and harmless.
3. A successful reload replaces this module and cancels its pending waits (1.4), so code after the call runs only when no reload happened. Then, when the call rejects (an unknown name, a Stop, a host's limit, TYPES 3156-3157), or resolves with a `text` that does not start with `Reloaded:` (the summary line, CMDS 863), put `/reload-plugins --force` in the prompt box with `$.prompt.fill({ text })` (TYPES 3060) and toast "Press Enter to reload the plugins." The documented Desktop refusal (CMDS 877-879) is one such text, but the rule does not depend on its wording. The person's own Enter is typing it in the box, which CMDS 877 allows.
4. Nothing follows a successful reload call. The written settings and the re-apply record are already saved.

Failure leaves a valid state at every step: each change is complete or not made (one `claude plugin` call on the terminal, the one settings write on Desktop); compaction and reload are separate later steps; nothing is rolled back, and the next session loads the written state anyway.

## 6. Re-apply on reinstall (REVIEW 2 rule; the whole rule is INFERRED, and its stamp is UNVERIFIED)

Runs at every mod-manager start (`session.start`, via `$.clock.after(0, ...)` so the first prompt is not held, API 25 and 196) and at every refresh of the pane, once P4 ships. On Desktop its changes follow Q11 as APPLY's do, and with an empty surfaces answer it does nothing. Its reads use only files, no `$.process`, so the check runs on both surfaces; a change it makes goes through APPLY's change path (section 5, step 5). MEASURED cost: one read of installed_plugins.json (251 KB here); it runs only when a profile has been applied.

1. Read the record. Missing, unreadable, or a schema other than 1: write a fresh record with `seen` = the current installed map, no profile, and apply nothing.
2. Read installed_plugins.json user-scope entries: `now` = id to `{ installedAt, lastUpdated }`.
3. Reinstalled = `reinstalled(seen, now)`, one pure function and the only place the stamp is chosen (6.1). Under outcome A: ids in `now` whose installedAt differs from `seen`, or that `seen` lacks, so an uninstall and reinstall between two runs is caught (REVIEW 2 point 2).
4. For each reinstalled id that the last applied profile (record `profileId`) has an entry for, apply that entry's value through `applyPlan` and the same change path as APPLY (section 5, step 5: `claude plugin` on the terminal, the guarded write on Desktop), when it differs from enabledPlugins now. A plugin that stayed installed is never touched, so manual changes after an apply stand.
5. Save `seen` = `now`, except that an id whose write failed keeps its old value, so the next run tries again.
6. When anything was written: a toast once, and the band notice `Profile <name> re-applied to N reinstalled plugins.` with `[ r: Reload plugins ]` and `[ x: Dismiss ]`. No compaction and no reload unasked (card UPDATE line).
7. The applied profile was deleted: the record's `profileId` is cleared and nothing is re-applied. Renamed: the id is stable, so it keeps working.

Two sessions that start together may both run these steps, because a `$.store` get and set pair is not atomic (UI 854). Each change sets a value, so a second run changes nothing new, and the `seen` written last wins, which is harmless. The hand-over says so (review N6).

The band (`AbovePrompt`, both surfaces, REF 231) is where a button outside the pane can live; the hook wraps `await next(e)` in a Box so other mods' band drawing stays (UI 214). Letter hotkeys only: a digit hotkey on a band button fires from an empty prompt (REF 273).

### 6.1 Which stamp marks a reinstall (UNVERIFIED; decided by live check L7a)

- What is known: `installedAt` and `lastUpdated` are keys of the entries of `claude plugin list --json` and of every entry of installed_plugins.json, user and local scope (MEASURED; whether every CLI entry carries them, synced ones included, was not counted). No chapter defines either key or says when Claude Code changes it. Whether `installedAt` changes on a reinstall, stays the same on `claude plugin update` (CMDS 272), and is present at every scope is UNVERIFIED.
- A lead, not proof: MEASURED, in installed_plugins.json, 76 of 97 user-scope entries and 26 of 428 local-scope entries have `lastUpdated` later than `installedAt`, none earlier, and every entry at both scopes has both keys. That fits "an update moves `lastUpdated` and keeps `installedAt`" (INFERRED), but other causes could give the same counts.
- Why it matters: plugins update automatically after a session starts when their marketplace has auto-update on (INSTALL 371). If an update changed `installedAt`, every update would count as a reinstall and override the person's manual change, which the owner forbids. So the stamp is fixed only after L7a, and the record already stores both keys, so no outcome needs a record migration.
- Outcome A, update keeps `installedAt`, reinstall changes it: the rule in step 3 as written.
- Outcome B, both change `installedAt`, but an update also leaves `lastUpdated` different from `installedAt` while a fresh install sets them equal: a reinstall is an id whose `installedAt` changed and now equals its `lastUpdated`, or an id `seen` lacks.
- Outcome C, nothing in the entry tells an update from a reinstall: the only safe rule is presence, an id absent at one run and present at a later one. An uninstall and reinstall between two runs is then missed; the owner decides (section 8, Q7).
- L7a runs before `reinstalled` is written. It needs no mod, only the claude CLI, but it needs the owner's permission, because it updates, uninstalls and reinstalls one of their plugins. P4's tests 1 and 2 are written for the outcome L7a shows (as drafted, outcome A). Shipping re-apply on a guessed stamp could override manual changes at every auto-update, so P4 is not built until L7a has run.

## 7. The panel

### 7.1 Views and the toolbar

One pane, three views, one toolbar that never scrolls away:

| View | Body |
|---|---|
| Plugins | the installed list (today's pane: sections, filter, row buttons) |
| Profiles | the profile browser |
| Profile | one profile's sub panel |

Toolbar, always drawn, in this order: `[ m: Plugins ]` `[ p: Profiles ]` `[ n: NEW PROFILE ]` `[ d: DUPLICATE PROFILE ]` `[ r: Refresh ]` `[ k: Page up ]` `[ j: Page down ]`, then the totals line. Labels carry their letter, the house convention for bracketed buttons (TRDD-GF5UDFWI decision of 2026-10-24; UI 571). The list switch is in the Profile view's own row (7.4).

The two profile-making buttons and the browser's second explanation line live in one table, so the owner's answer to the DUPLICATE question edits one row:

```ts
// logic.ts: the only place NEW and DUPLICATE are defined (owner question Q1).
export const PROFILE_MAKERS = [
  { key: 'mm-new', hotkey: 'n', label: 'NEW PROFILE', run: 'fromCurrentState' },
  { key: 'mm-dup', hotkey: 'd', label: 'DUPLICATE PROFILE', run: 'copySelected' },
] as const
export const BROWSER_HOW_LINE = 'Create one with NEW PROFILE (your plugins as they are now) or DUPLICATE PROFILE (a copy of the selected one), then EDIT PROFILE.'
```

- NEW PROFILE: shows a name Input (prefilled `Profile <n>`, unique) with the live name line; Enter saves the user-scope snapshot and opens the new profile.
- DUPLICATE PROFILE: copies the selected profile (the one open, or the last one opened in the browser) under the next free `<name> copy` and opens the copy's sub panel. With none selected it writes nothing and says "Open a profile first."
- If the owner answers that DUPLICATE means "create from the current state", only the `mm-dup` row changes (`run: 'fromCurrentState'`), the `mm-new` row goes, and `BROWSER_HOW_LINE` changes in the same edit.

### 7.2 The toolbar that stays visible

A `Pane` scrolls its whole tree when the tree is taller than the body (REF 252), and the toolbar would scroll away with it. So the pane draws its own window:

- The root Box gets `height: bodyRows` and `overflow: 'hidden'`, so the tree always fits: an estimate error clips the bottom list rows and never moves the toolbar. The list Box gets `height: room` and `overflow: 'hidden'` too.
- `room = bodyRows - toolbarRows - headerRows`. `toolbarRows(labels, bodyColumns)` lays the bracketed labels out greedily (each `label.length + 4` cells, gap 1); `headerRows` counts the totals line, the Profile view's row and counts, the browser's two wrapped explanation lines, the message line and the rule. The estimate fits the terminal's text buttons. Desktop draws its own button chrome, so there the estimate is UNVERIFIED and the root clip is what protects the toolbar.
- Fallback: when `room` is below 3 (a short inline pane, or a narrow width where the toolbar wraps to many rows), there is no own window. The tree is drawn unclipped, the pane scrolls as a whole (REF 252) with the toolbar in it, and one line says "Make the pane taller to keep the toolbar in view: Ctrl+X then Up." (UI 551).
- Every list line is one row: Text with `wrap: 'truncate-end'`, button rows `flexWrap: 'nowrap'` with `fitLabel` (CODE logic.ts:421-424), so `windowOf(heights, offset, room)` is a pure function.
- What moves the list: `[ k: Page up ]` and `[ j: Page down ]`, by `room`. The clipped tree always fits, so the arrows, the Page keys and probably the wheel do not raise `ui.scroll` (UI 547, 550): with this layout they do not move the list. Tab reaches only drawn controls.
- Wheel support is a spike, L3a: a tree exactly one row taller than `bodyRows`, with `on('ui.scroll', { component: 'Pane', requestId: PANE }, ...)` returning `{}` and moving the own window by `e.by` (TYPES 4168-4178, 15276-15307). If L3a shows that the engine then hands wheel and key scrolls to the hook without moving the toolbar, P2 uses that and keeps j and k; if not, the layout above stands.
- Inline placement: the frame fits the tree up to `bodyRows` (TYPES 10908-10911), the same rule.
- Desktop: whether `bodyRows` means the same there, and whether `ui.scroll` fires, is UNVERIFIED (L3a, L3); the page buttons work either way.

### 7.3 The profile browser

- Title line, then the owner's two lines of explanation, exactly:
  1. `A profile saves which of your user-scope plugins are on or off. APPLY PROFILE switches them to match, then compacts and reloads.`
  2. `BROWSER_HOW_LINE` (7.1).
- The two lines sit in the header block above the rule, so they never scroll away; they wrap at narrow widths, and `headerRows` counts the wrapped rows.
- One line per profile, sorted by name: `[ <name> ]` (opens it), then `· N plugins · M mods`, `· applied 3 min ago` for the last applied one (relative time, house look rule), and `· not installed: K` when K is above 0.
- No profiles yet: `No profiles yet.` under the two lines.
- A refused profiles file: its reason and path, and no profile buttons.

### 7.4 The profile sub panel

Its own row under the main toolbar, also outside the scrolled list: `[ t: RENAME PROFILE ]` `[ x: DELETE PROFILE ]` `[ a: APPLY PROFILE ]` `[ e: EDIT PROFILE ]` (in edit mode `[ e: SAVE CHANGES ]`, in the same key slot so the focus stays on it) `[ l: list only mods ]`.

- RENAME PROFILE: an Input under the row with the current name. `onInput` updates the draft and the line under it from `nameProblem` ("A profile named Work already exists; names are compared without case." or "Free"); `onSubmit` saves only when there is no problem. Any other button leaves rename mode without saving.
- DELETE PROFILE: `Button({ key: 'mm-delete', label: 'DELETE PROFILE', children: [Text({ color: STYLE.danger, children: ['x: DELETE PROFILE'] })] })`, with `STYLE.danger` defaulting to the theme key `error`. A press asks `Delete profile "<name>"? It cannot be undone.` with `Delete it` and `Keep it as it is`; only `Delete it` writes. Deleting the applied profile clears the re-apply profile.
- APPLY PROFILE: section 5.
- EDIT PROFILE: copies the entries into a draft; each line gets a state button `[ on ]` or `[ off ]` (a word, never colour alone, house look rule; REF 258-271 has no Checkbox). Not-installed entries are listed and editable. The label becomes SAVE CHANGES. SAVE CHANGES runs the guarded write and leaves edit mode. Any other button discards the draft, says "Edits discarded.", leaves edit mode, then does its own job (owner rule). Exempt, INFERRED (Q4): the page buttons and the list switch, which only change what is shown.
- The list switch: the label names what a press does, as in the owner's "change a label from `list only mods` to `list all plugins`". The view starts with every entry listed and the label `list only mods`; a press lists only mods and the label becomes `list all plugins`. It filters lines only: a profile always records every user-scope plugin. It lives in this view only, and the Plugins view keeps its `mod` filter word (CODE logic.ts filterRows). Review S9; Q2 and Q3.
- Totals (card point d), proposed scope user, because profiles manage user scope only and Desktop can list only user scope, so both surfaces show the same numbers: `User scope: 97 plugins installed, 12 of them mods` in the Profiles and Profile views; in this view also `This profile: 60 entries · 3 not installed · 5 differ from now`. At narrow widths the words shorten (`User scope: 97 plugins, 12 mods`). The Plugins view keeps today's header (rows that apply here, CODE pane.ts:36-44) on the terminal, and on Desktop counts user scope with the word "user-scope" in it.
- Under the counts, one line names what profiles leave out: `Skills-folder, session-only and synced plugins are not in profiles.` (2.4, Q15).
- One line per entry, grouped Mods, then Other plugins (when every entry is listed), then Not installed; on before off, then by name: state (`on`/`off` or the edit button), name, `mod`, and the notes that apply: `now off` or `now on` (APPLY would change it), `kept on: this manager`, `locked by your organization or a --settings file`, `overridden here by a project or local setting`.

### 7.5 The Plugins view

- User-scope marketplace installs: on the terminal, Turn on and Turn off keep `claude plugin enable|disable <id> --scope user`, as the mod-manager does today (CODE logic.ts:335-349). That is the default (`TERMINAL_PATH = 'cli'`, Q12) because the CLI works there and an in-place write of settings.json risks every setting in it (review S2). On Desktop, where `$.process` is not available, the toggles stay off until the owner answers Q11 yes (`DESKTOP_WRITES`, default `false`) and L1 passes there; then they go through the guarded write of settings.json (the owner's fact, 1.3). Until then Desktop shows the list read-only, with the pointer to + > Plugins > Manage plugins (INSTALL 122). Using the file write on the terminal too is Q12.
- A user-scope skills-folder plugin (`<name>@skills-dir`) keeps the CLI on the terminal (CODE logic.ts:338-341) and is not listed on Desktop (2.4).
- Project and local toggles, synced and session rows, and Uninstall keep `claude plugin` (CODE logic.ts:282-289) and exist only where the CLI list is used.
- The note "Changes apply in your next session." (CODE pane.ts:58) becomes "Changes apply after Reload plugins or in your next session.", with the `[ Reload plugins ]` button of the reload step.

### 7.6 Look: style tokens and the visible show and hide

- Every colour, border and mark the pane draws comes from one `STYLE` record with defaults in logic.ts (`danger: 'error'`, `accent`, `dim`, `rule`, `toolbarBorder: 'round'`, the marks), with no colour literal elsewhere (module rule, memory note module-rules-surfaces-style-toggle, 2026-10-29).
- A footer button `[ Mods ]` on the `SessionMode` site (terminal and Desktop, REF 241) opens and closes the pane, drawn beside `await next(e)` so other mods' footer drawing stays; the same module rule, modelled on the deck mod's `[ Deck ]`. `/mods-manager` keeps working.

### 7.7 Hotkeys

Pane, one letter each, unique in the pane: m p n d r k j (toolbar), t x a e l (Profile row). Band: r w x (another site, so no clash). While an Input has the focus every printable key goes to the field (UI 549), so the letters work only when a button holds the focus; Tab reaches them. A bare `x` does not clash with the pane's close chord, Ctrl+X then X (UI 552); L3 checks it.

### 7.8 What the three views look like (the nicer panel)

Layout rules (taste, except where cited):

- Three blocks, top to bottom: the toolbar, the totals and the message line; for the Profile view its row and counts, for the browser its two lines; a rule drawn in `STYLE.rule`; then the list.
- A list line has a fixed 4-cell state column (`on`, `off`, or the `[ on ]`/`[ off ]` edit button), the name in a column as wide as the longest visible name up to 32 cells, then `mod` and the notes in `STYLE.dim`. Columns align by cell count, and when space is short the notes go first (house look rule).
- Group headers in bold: `Mods`, `Other plugins` (when every entry is listed), `Not installed`.
- Empty states take one line each: `No profiles yet.`, `No user-scope plugins installed.`, `No mods in this profile.`
- A message line (a result, a refusal, `Edits discarded.`) sits under the totals and stays until the next press.

The Profile view at 80 columns (a mock: the engine draws the frame and the button chrome):

```text
[ m: Plugins ] [ p: Profiles ] [ n: NEW PROFILE ] [ d: DUPLICATE PROFILE ]
[ r: Refresh ] [ k: Page up ] [ j: Page down ]
User scope: 97 plugins installed, 12 of them mods
Profile Writing · applied 3 min ago
[ t: RENAME PROFILE ] [ x: DELETE PROFILE ] [ a: APPLY PROFILE ]
[ e: EDIT PROFILE ] [ l: list only mods ]
This profile: 60 entries · 3 not installed · 5 differ from now
Skills-folder, session-only and synced plugins are not in profiles.
──────────────────────────────────────────────────────────────
Mods
on   deck                    mod
on   git-band                mod   now off
off  spell-band              mod
Other plugins
off  pdf-tools
Not installed
on   old-status-line         mod
```

The same view at 48 columns:

```text
[ m: Plugins ] [ p: Profiles ]
[ n: NEW PROFILE ] [ d: DUPLICATE PROFILE ]
[ r: Refresh ] [ k: Page up ]
[ j: Page down ]
User scope: 97 plugins, 12 mods
Profile Writing · applied 3 min ago
[ t: RENAME PROFILE ] [ x: DELETE PROFILE ]
[ a: APPLY PROFILE ] [ e: EDIT PROFILE ]
[ l: list only mods ]
60 entries · 3 not installed · 5 differ
──────────────────────────────────────────
Mods
on   deck              mod
on   git-band          mod   now off
```

The browser at 80 columns:

```text
[ m: Plugins ] [ p: Profiles ] [ n: NEW PROFILE ] [ d: DUPLICATE PROFILE ]
[ r: Refresh ] [ k: Page up ] [ j: Page down ]
User scope: 97 plugins installed, 12 of them mods
A profile saves which of your user-scope plugins are on or off. APPLY
PROFILE switches them to match, then compacts and reloads.
Create one with NEW PROFILE (your plugins as they are now) or DUPLICATE
PROFILE (a copy of the selected one), then EDIT PROFILE.
──────────────────────────────────────────────────────────────
[ Coding ] · 97 plugins · 12 mods
[ Writing ] · 97 plugins · 12 mods · applied 3 min ago · not installed: 3
```

The Plugins view keeps today's rows and section buttons under the same toolbar and rule.

## 8. Owner questions

1. Q1 DUPLICATE PROFILE: copy-and-open plus a separate NEW PROFILE button (this design), or DUPLICATE means "create from the current state" (card OWNER QUESTION). One table row changes either way (7.1).
2. Q2 The switch label names what a press does: the Profile view starts with every entry listed and the label `list only mods`, and a press lists only mods with the label `list all plugins` (this design). Or should the label name what is listed now?
3. Q3 The switch is in the Profile view only, and the Plugins view keeps its `mod` filter word (this design). Should it also filter the Plugins view?
4. Q4 In edit mode, do the page buttons and the list switch also discard edits? This design says no.
5. Q5 Profiles are always in the literal ~/.claude/.mod-manager/, the card's ruling (this design). With `CLAUDE_CONFIG_DIR` set, should they move to `<that dir>/.mod-manager/` instead?
6. Q6 APPLY never turns off this plugin itself (this design, from the earlier preset decision). Confirm.
7. Q7 Re-apply uses the last applied profile (REVIEW 2 notes this is the agent's reading).
   If live check L7a gives outcome C (section 6.1), an uninstall and reinstall between two runs cannot be told from an update, so REVIEW 2 point 2 cannot be met: accept "absent at one run, present at a later one" as the reinstall rule?
8. Q8 Adding a newly installed plugin to an existing profile in edit mode is not in the owner's text and not designed. Wanted?
9. Q9 `/reload-plugins --force` after compaction. Confirm.
10. Q10 mods-profiles.json is written in place with the default file mode, because the mods API has no rename or chmod (section 3). Accept?
11. Q11 On Desktop the mod cannot run `claude`, so enable, disable, APPLY and re-apply there would write settings.json in place (section 3). A crash or kill during that write can leave the file truncated, which loses every setting in it (permissions, hooks, env, plugins) for every project, and the mod keeps no copy. Until you answer, Desktop only lists the plugins and points to + > Plugins > Manage plugins (this design's default, `DESKTOP_WRITES = false`). Your fact says the file write works in both apps; do you also accept this risk on Desktop? (review S2, review 2 F4)
12. Q12 On the terminal, enable, disable, APPLY and re-apply use `claude plugin enable|disable <id> --scope user`, as the mod-manager does today (this design). Or should the file write be used everywhere, one path on both surfaces, with the same risk as Q11? (review S8)
13. Q13 "A nicer panel": the toolbar, the three views and the layout of section 7.8 as drawn (this design). Is that what you meant, or did you expect more? (review S10)
14. Q14 When compaction fails, for example when there is nothing to compact yet, may the notice offer `[ w: Reload without compacting ]` (this design), or should the reload wait for a compaction? (review S5)
15. Q15 Profiles cover only user-scope plugins installed from a marketplace, which is narrower than your "user-scoped set": user-scope skills-folder plugins (`<name>@skills-dir`) are left out (this design, `PROFILE_ORIGIN`), because installed_plugins.json is not documented to list them (INFERRED; the measured machine had none). Should profiles cover them too? (review S4)

## 9. Increments

Build order (the second review's advice, adopted): P1b; L3a, then P2; P3 on the terminal path; L1, then P1a and P1c, with Desktop writes only after a yes to Q11; L7a, after the owner allows it, then P4. This delivers the profiles panel and APPLY on the surface known to work (the terminal, through `claude plugin`) first, and leaves the parts with real risk or real unknowns (the Desktop file write, the surface mapping, the reinstall stamp) for last.

Each increment is one bounded change. Each one passes: kit tests on surface terminal and desktop, at a narrow and a wide width, with the same assertions unless the increment says a test is for one surface (as hooks/tests/mod-manager.test.ts does); `check-mod.sh` reporting == PASS; a mutation check of every new guard on a scratch copy; then its live checks. Tests stub `fs.read`, `fs.write`, `fs.stat`, `fs.list`, `settings.read`, `store.get`, `store.set`, `session.surfaces`, `session.compact`, `command.run`, `prompt.fill` and `process.run` with `on(...)` (DOC mods-doc-mods-testing, "Stub what Claude Code would answer").

What only stubs prove: the kit has no file access (TYPES 31), so every race, partial file and refusal in a kit test is the test's own answer, and every surface answer (`['desktop']`, `[]`) is the test's own too. Real-file proof and the real surface answers come from L1. The pure settings editor also runs on a synthetic settings.json of real shape and size (P1a test 1), built by the test, never read from the person's machine.

What each part depends on:

| Part | Depends on |
|---|---|
| P1b: the profile store (mods-profiles.json and its own guarded write), the pure profile operations, `applyPlan` (the diff between a profile and the current state), the installed_plugins.json parser | Not on Q11 or Q12. It encodes the defaults of Q5, Q6 and Q15 and this design's name rule, each in one named constant (listed in P1b), so an owner answer changes one line. Q10 is not a choice the code can make (no rename or chmod, 1.1). |
| P2: the panel | Q1 to Q4 and Q13, each a default in one place (7.1, 7.4, 7.8) |
| P3: APPLY and the reload step | The terminal path: Q9 and Q14. The Desktop path: off until Q11 is answered yes and P1a ships |
| P1a: the settings.json layout guard and the enabledPlugins editor | Q11; on the terminal only if Q12 picks the file write |
| P1c: the Desktop list and the Desktop toggles | The list: nothing (it ships read-only). The toggles: Q11 yes and L1 |
| P4: re-apply on reinstall, with `reinstalled` | L7a, which needs the owner's permission because it updates, uninstalls and reinstalls one of their plugins; Q7; on Desktop, Q11 yes |

Until an owner answer comes, an increment uses the default named here and its hand-over says so. The one exception is Q11: until it is answered yes, the Desktop change path stays off (review 2, F4).

### P1b: the profile store and the pure profile operations (no Q11 or Q12 dependency; defaults for Q5, Q6 and Q15)

Files: hooks/mod-manager/profiles.ts (new, pure: schema 1 parse and serialize, `nameProblem`, `snapshotUserScope`, the profile operations, `applyPlan`), hooks/mod-manager/installed.ts (new, pure: the installed_plugins.json parser), hooks/mod-manager/files.ts (new: the config dir and home folder, the `$.fs` and `$.settings` calls, and the guarded write of section 3 for mods-profiles.json, steps 1 to 3 and 6 to 8), tests hooks/tests/mod-manager-profiles.test.ts (new).

The owner defaults it encodes, each in one named constant of profiles.ts or files.ts:

| Constant | Default | Question |
|---|---|---|
| `PROFILES_DIR` | the literal ~/.claude/.mod-manager/, not moved by `CLAUDE_CONFIG_DIR` | Q5 |
| `KEEP_SELF_ON` | `true`: APPLY never turns this plugin off | Q6 |
| `PROFILE_ORIGIN` | `'marketplace'`: user-scope marketplace installs only, no `@skills-dir`, `@inline` or `@synced` ids | Q15 |
| `NAME_RULE` | trimmed, 1 to 64 characters, no control characters, unique after `normalize('NFC').toLowerCase()` | this design's addition (interpretation 5), not the owner's |

Kit tests (all fail before P1b, because the functions do not exist):

1. Profiles file: a valid file reads; `schema: 2`, a malformed entry and non-JSON are refused as a whole and no `fs.write` follows; a missing file is an empty list.
2. Names under `NAME_RULE`: empty, spaces only, 65 characters, a control character, and `work` beside `Work` are refused; renaming `Work` to `WORK` is allowed.
3. With `KEEP_SELF_ON`, `applyPlan` never turns off an id whose name part equals the plugin name, and lists it as kept on.
4. An id set in `policy` or in `flag` enabledPlugins is skipped as locked.
5. installed_plugins.json: `version: 2` reads; `version: 3` is refused; a malformed entry is named; only user-scope entries are used; under `PROFILE_ORIGIN` a `<name>@skills-dir` id never reaches a snapshot.
6. Profiles-file write, the file exists: when the text read just before the write differs from the text the panel read, nothing is written and the refusal is shown; a read-back mismatch is reported; a `realPath` outside `PROFILES_DIR` is refused.
7. Profiles-file write, edge cases of section 3 step 1: no file yet and `fs.list` of the folder does not name it: the first write goes ahead after the folder check; `fs.stat` rejects but `fs.list` names the file (a link that leads nowhere): refused; `fs.stat` resolves with no `realPath`: refused.

Mutation targets: the case-insensitive compare, the self skip, the `policy` and `flag` skip, the profiles-file compare-before-write, the dangling-link refusal.

Live checks: none of its own. L1 notes the mode of a new mods-profiles.json (Q10).

### P2: the panel

Files: pane.ts (the toolbar, the own window, the three views), logic.ts (`toolbarRows`, `windowOf`, `PROFILE_MAKERS`, `BROWSER_HOW_LINE`, `STYLE`, labels), state.ts (view, selected profile, draft, rename text, list mode, window offset), hooks/mod-manager/footer.ts (new, the `SessionMode` button), register.ts (wires `ui.scroll` and the footer), tests hooks/tests/mod-manager-panel.test.ts (new) and the expectations in mod-manager.test.ts that the new toolbar changes.

Precondition: P1b; L3a has run, and 7.2 follows its result.

Kit tests (all fail before P2: there are no toolbar keys and no profile views):

1. With 300 rows and `bodyRows` 20: the root Box has height 20 and `overflow: 'hidden'`; the toolbar buttons are drawn; after three presses of `j` they are still drawn and the first drawn row has moved; the drawn list lines never exceed `room`.
2. With `bodyRows` small enough that `room` is below 3: no clipping, the whole tree is drawn, and the note is shown.
3. The browser draws both explanation lines verbatim and one button per profile.
4. NEW PROFILE writes schema 1 with every user-scope marketplace entry, mods and others.
5. DUPLICATE PROFILE with a profile open writes `<name> copy` and opens it; with none open it writes nothing.
6. RENAME: typing a case variant of another name draws the collision line, and Enter writes nothing; a free name writes.
7. DELETE PROFILE holds a Text child whose `color` is `STYLE.danger`; the press asks `Delete it` / `Keep it as it is`; no answer, no write.
8. EDIT PROFILE: the label turns to SAVE CHANGES and each entry, not-installed ones included, gets an `[ on ]` or `[ off ]` button; a toggle then APPLY discards (no write, label back); a toggle then SAVE CHANGES writes that value and keeps not-installed entries.
9. The switch: the Profile view starts with every entry listed and the label `list only mods`; a press lists only mods and the label becomes `list all plugins`; the Plugins view's rows do not change; the totals line counts user scope; the Profile view draws the line that names the plugins outside profiles.
10. The footer `[ Mods ]` button draws beside the stub's `next(e)` drawing and opens and closes the pane.
11. A non-default `STYLE` changes the drawn colour (module rule).

Mutation targets: the root clip (without `overflow: 'hidden'`, test 1 must go red), the fallback limit on `room`.

Live checks: L3 and L4.

### P3: APPLY and the reload step

Files: state.ts (`applyProfile`, `reloadStep`), register.ts (the band `ui.render` hook), logic.ts (`applyOrder`, question, progress and result texts), tests hooks/tests/mod-manager-apply.test.ts (new). APPLY also sets the re-apply record (section 5, step 6), which only P4 reads.

Precondition: P1b and P2. The Desktop change path is built but off: until Q11 is answered yes and P1a and P1c ship, APPLY on Desktop lists the changes and points to + > Plugins > Manage plugins.

Kit tests (all fail before P3: APPLY does not exist):

1. Declined or dismissed: no write, no compaction, no command.
2. Confirmed, on the terminal: one `claude plugin enable|disable <id> --scope user` per differing installed id, every enable before any disable, each with the 120-second timeout, and no settings write; then `session.compact`, then `command.run` `reload-plugins --force`, in that order. On Desktop with the change path off: no `process.run`, no `fs.write`, no compaction, and the list of changes is drawn.
3. `session.compact` rejects with message M: no `command.run`; the message shows M; the band notice is created and offers `[ r: Reload plugins ]` and `[ w: Reload without compacting ]`.
4. `session.compact` resolves `{ skip }`: no reload; the message names the skip.
5. `[ w: Reload without compacting ]`: `command.run` runs and `session.compact` does not.
6. Nothing to change: no write, no compaction, no reload; the toast.
7. `command.run` rejects, or resolves with a text that does not start with `Reloaded:`: `prompt.fill` gets `/reload-plugins --force` and the toast tells the person to press Enter.
8. On the terminal, the second of three `claude plugin` calls fails: the third is not run; the message names what changed and what did not; there is no compaction and no reload; the band notice is created with `[ r: Reload plugins ]` for the change already made; the re-apply record is not set. Pressing APPLY again changes only what is still different.
9. The message line shows `2 of 3` while the second call runs.

Mutation targets: enables before disables; the order of change, compaction and reload; the stop at the first failure.

Live checks: L5 now; L6 once the Desktop path is on.

### P1a: the guarded settings.json writer (Desktop, after a yes to Q11)

Files: hooks/mod-manager/settings-file.ts (new, pure: the layout guard, `editEnabledPlugins`, the old-versus-new check, the refusal texts), the settings.json branch of the guarded write in hooks/mod-manager/files.ts, tests hooks/tests/mod-manager-settings-file.test.ts (new). Nothing calls it yet, so nothing the person sees changes.

Precondition: L1 has run. Its terminal half proves the write mechanics on a backed-up file; its Desktop half proves that a mod can reach the file there.

Kit tests (all fail before P1a, because the module does not exist):

1. A synthetic settings.json of the measured shape and size (about 86 KB, 2-space indent, final newline, 98 enabledPlugins entries, nested permissions, hooks and env objects): flipping two ids changes exactly those two lines, and every other byte is equal, a `<name>@builtin` key included.
2. Layout guard: a 4-space file keeps 4 spaces and a tab file keeps tabs; spaces inside braces, a duplicate key, a byte order mark, Windows line ends and a comment are each refused with no `fs.write`, and the message says to save the file as plain JSON.
3. No key is added for an id that is not in the installed set.
4. Concurrency: the second `fs.read` returns a changed value for an id being changed: no `fs.write`, the refusal message.
5. Read-back: a different but valid text is reported as a change during the write; a text that is not JSON is reported as possible damage with the path, and the next write is refused until the file reads clean.
6. `fs.stat` answers a `realPath` outside the config dir, or no `realPath`: no `fs.write`, and the message says where the link leads or that it leads nowhere. `fs.stat` rejects for settings.json: no `fs.write`, because the mod never creates settings.json.
7. `fs.write` rejects (a hook refused it): the message names the refusal and nothing is recorded.

Mutation targets: the layout guard, the compare-before-write, the not-installed key guard, the link check.

Live checks: L1 on Desktop, if it has not run yet.

### P1c: the Desktop list, and the Desktop toggles after a yes to Q11

Files: state.ts, logic.ts (`changePath(surfaces)`, and the constants `DESKTOP_WRITES = false` for Q11 and `TERMINAL_PATH = 'cli'` for Q12), cli.ts, pane.ts (the Desktop line), tests added to hooks/tests/mod-manager.test.ts. These tests differ by surface on purpose.

Precondition: P1a for the toggles; L1 passed on Desktop and Q11 answered yes, or the toggles stay off and only the read-only list ships.

Kit tests (tests 1, 3 and 5 fail before P1c, because the surface answers are not read and there is no Desktop source; tests 2 and 4 pass before and after, and guard the terminal default):

1. `session.surfaces` answers `['desktop']` and `DESKTOP_WRITES` is `true`: Turn off on a user-scope marketplace row writes `false` for that id through `fs.write` and calls no `process.run`. With the default `false`: no write, and the row has no toggle.
2. `session.surfaces` answers `['terminal']`: the same press runs `claude plugin disable <id> --scope user` and writes no file.
3. `session.surfaces` answers `['desktop']`: the list is built from installed_plugins.json user entries, no `process.run` is called, and the one-line Desktop note is drawn.
4. A user-scope `<name>@skills-dir` row still runs `claude plugin disable <name>@skills-dir` on the terminal, and is not listed on Desktop.
5. `session.surfaces` answers `[]`: no `process.run`, no `fs.write`, and re-apply does nothing (section 2.4, the empty answer).

Mutation target: the surface choice (forcing the file path on the terminal must turn test 2 red; treating `[]` as Desktop must turn test 5 red).

Live checks: L2.

### P4: re-apply on reinstall

Files: hooks/mod-manager/reinstall.ts (new, pure: `reinstalled`, moved here from P1b), state.ts (`reapply`), register.ts (re-apply started from `session.start` through `$.clock.after(0, ...)`), tests hooks/tests/mod-manager-reapply.test.ts (new).

Precondition: L7a has run, with the owner's permission, and `reinstalled` follows the outcome it shows (section 6.1). On Desktop the change path follows Q11, as in P3.

Kit tests (all fail before P4: re-apply does not exist):

1. `reinstalled` (outcome A as drafted, rewritten if L7a shows B or C): no record initializes and returns nothing; the same installedAt returns nothing; a changed `lastUpdated` with the same installedAt returns nothing; a new installedAt and an id absent from `seen` are returned.
2. Re-apply: `seen` has id A with installedAt t1, installed_plugins.json has A with installedAt t2, the applied profile says off, settings say on: one change to off (terminal: `claude plugin disable A --scope user`; Desktop with `DESKTOP_WRITES` `true`: one settings write of `false`), the band notice, no compaction and no reload. The same setup with only `lastUpdated` changed (an update under outcome A): no change.
3. No record: the record is written, no change.
4. An unreadable record: the same as 3.
5. A plugin that stayed installed with a manually changed value: untouched.
6. The applied profile deleted: nothing re-applied.
7. A failed change keeps that id's old `seen` value.

Mutation targets: the reinstall rule; the stayed-installed guard.

Live checks: L7b.

Cost line for the hand-over: the mod adds no text to requests and calls no model of its own. APPLY and the Reload plugins button run one compaction (one model call, the same as /compact) and one reload with `--force`, which can make the next request re-read the compacted conversation without the cache; Reload without compacting runs the reload only; all of them only on the person's press. APPLY on the terminal starts one `claude` process per change. At session start, only after P4 and only when a profile has been applied: one read of installed_plugins.json, and on the terminal one `claude plugin` process for each reinstalled plugin whose value must change. Measured cache counts: not measured.

## 10. Derived consequences to track

- Where the mod writes settings.json in place (Desktop, only after a yes to Q11; the terminal too only if Q12 picks the file write), every setting is at risk, not only plugins: a crash or kill during the write can leave a truncated file and lose permissions, hooks and env for every project (REF 214). The design keeps no copy, because the file can hold secrets, and it reports a read-back that is not JSON. The owner decides in Q11 and Q12.
- On Desktop, toggles and APPLY change only the settings key; anything `claude plugin enable|disable` does beyond it (what that is: UNVERIFIED) does not happen there, nor on the terminal if Q12 picks the file write. `/reload-plugins` installs missing dependencies of reloaded plugins (CMDS 867), so an applied profile can cause dependency installs at reload; say so in the APPLY question if L5 shows it.
- Profiles cover user-scope marketplace installs only; skills-folder, session-only and synced plugins are outside them (2.4, Q15).
- TRDD-R2QYIN8O's blocker (can a mod's `$.fs.read` read ~/.claude/plugins/?) is answered by the same run as L1.
- The Desktop main list becomes user-scope marketplace installs only (2.4); TRDD-J4HRAQF0's Desktop acceptance should cite this spec.

## 11. Live checks (by the person; the Desktop ones cannot be driven by an agent from inside the Desktop app)

Order: L3a runs before the P2 layout; L5 after P3; L1 before P1a; L7a, only with the owner's permission, before P4; every other check after its increment.

| Id | Surface and when | Check | Settles |
|---|---|---|---|
| L1 | terminal, then Desktop; before P1a | A probe mod that is never shipped, with one command that: (0) prints `$.session.surfaces()` and whether `$.process.run` of the claude binary with `--version` resolves or rejects; (1) reads installed_plugins.json and settings.json under the config dir and prints their sizes; (2) writes ~/.claude/.mod-manager/probe.json and prints `$.fs.stat(path, { resolve: true })` for it and for settings.json; (3) on the person's press, flips one enabledPlugins value of a harmless plugin through the section 3 write, and on a second press flips it back. On the terminal, load it with `--plugin-dir`. On Desktop, install it from a local marketplace, because Desktop loads installed plugins and `--plugin-dir` is a command-line flag (INFERRED). Before step 3 the person copies settings.json aside with `cp -p`. After each flip: `stat` shows the same inode and mode 600, `diff` against the copy shows one line, and a new session lists the plugin in the new state. Then change an unrelated setting through `/config` and check that the flip is still in the file, which rules out Claude Code writing the file back from its own copy. | the surface answer and `$.process` on each surface (2.4); `$.fs` reach under the config dir on each surface; the in-place write keeps the inode, the mode and a symbolic link; the mode of a new file; whether Claude Code undoes the edit |
| L2 | Desktop; after P1c | open the pane: the user-scope list matches + > Plugins > Manage plugins | installed_plugins.json as the Desktop source |
| L3a | terminal (fullscreen, dock and inline) and Desktop; before the P2 layout | a spike pane whose tree is exactly one row taller than `bodyRows`, with a `ui.scroll` hook that returns `{}` and moves its own rows: do the wheel, the Page keys and the arrows raise `ui.scroll`, and does the first row stay drawn? | whether the list can scroll by wheel and keys under a pinned toolbar (7.2) |
| L3 | terminal and Desktop; after P2 | 300 plugins at narrow and wide widths: j and k move the list and the toolbar stays on top; a pane below the fallback limit scrolls as a whole and shows the note; wheel and keys behave as L3a found; a bare x asks the DELETE question, and Ctrl+X then X still closes the pane | the layout of 7.2 and 7.8 |
| L4 | Desktop; after P2 | DELETE PROFILE shows red | the colour of a Text child inside a Desktop button |
| L5 | terminal; after P3 | APPLY a profile that changes two plugins: the settings.json diff, which must change only those two enabledPlugins values, exactly what the Desktop writer would produce (review 2, F2); the `k of N` progress; the compaction; the `Reloaded:` line (CMDS 863). Also: does `$.command.run({ command: 'reload-plugins' })` run the built-in at all, and does it resolve with that line? | the whole flow; the built-in through `$.command.run` |
| L6 | Desktop; after P3 | the same APPLY: does `$.session.compact` run, is `/reload-plugins` from `$.command.run` refused, does the prompt fill route work | the Desktop reload route |
| L7a | terminal, no mod needed; only with the owner's permission, because it changes their installed plugins; before P4 | pick a user-scope plugin whose marketplace has a newer version. Note its `installedAt` and `lastUpdated` in installed_plugins.json and in `claude plugin list --json`. Run `claude plugin update <id>` (CMDS 272) and compare both stamps; then `claude plugin uninstall <id>` and `claude plugin install <id>` and compare again; repeat the uninstall and reinstall at project or local scope | which stamp marks a reinstall (section 6.1, outcomes A to C); whether installedAt is present at every scope |
| L7b | terminal; after P3 | with a profile applied, uninstall and reinstall one of its plugins from a shell, then start a session: the band notice and the profile value in settings.json | re-apply end to end |

## 12. Review dispositions

### Review 1

Review: reports_dev/mod-manager/20261031_134535+0100-profiles-design-review.md (0 blockers, 11 should-fix, nits N1 to N8). Every finding was applied; S8 after the coordinator's follow-up made `claude plugin` the terminal default.

| Finding | Disposition | Where |
|---|---|---|
| S1 the premise is checked after the build | Applied. L1 (a probe mod, terminal then Desktop, including whether Claude Code writes settings.json back from its own copy) runs before P1a, the first code that writes settings.json, and L7a runs before P4, the re-apply increment. P1 is split, and each part names the live check it needs first. If L1 fails on the terminal, the terminal keeps `claude plugin`; if it fails on Desktop, Desktop stays read-only (7.5). | 9, 11 |
| S2 a failed write can damage all of settings.json | Applied. By default settings.json is written only where `$.process` is unavailable (Desktop), and the terminal keeps `claude plugin` (the coordinator's follow-up). Q11 asks whether to accept the in-place write on Desktop, and Q12 whether to use it everywhere. No copy of settings.json is kept, because it can hold secrets, and a read-back that is not JSON is reported as possible damage with the path. The "milliseconds" wording is gone: the window includes other mods' `fs.*` hooks. | 3, 7.5, 8, 9, 10 |
| S3 the toolbar against scrolling | Applied. The root Box is clipped to `bodyRows`; a small pane falls back to the whole tree with a note; the spec says plainly that wheel and keys do not move the clipped list; spike L3a runs before the layout; L3 no longer expects the wheel. | 7.2, 9 P2, 11 |
| S4 two list sources | Applied. Profiles cover user-scope marketplace installs only. Skills-folder, session-only and synced plugins stay on the CLI on the terminal and are not listed on Desktop. Tests in P1b and P1c; owner question Q15. | 2.4, 7.5, 9 |
| S5 a failed compaction is misread | Applied. The pane shows the engine's own message, and after a failed compaction offers `[ w: Reload without compacting ]` (Q14). Tests in P3. | 5, 9 P3 |
| S6 the Desktop refusal is matched by its wording | Applied. Any rejection, or any result text that does not start with `Reloaded:`, falls back to filling the prompt. Step 4 is reworded. L5 checks that the built-in command runs through `$.command.run`. | 5, 11 |
| S7 symbolic links, `--settings` locks, messages | Applied. `$.fs.stat(path, { resolve: true })` runs before every write and refuses a link that leads outside the config dir. The `flag` source is read with `policy`. The refusal says how to fix the file. | 3, 4 |
| S8 the terminal's working path is swapped | Applied after the coordinator's follow-up: on the terminal, toggles, APPLY and re-apply keep `claude plugin enable\|disable <id> --scope user`, as the mod-manager does today; the settings.json write is used only where `$.process` is unavailable (Desktop). Q12 asks whether to use the file write everywhere instead. | 5, 6, 7.5, 8, 9 |
| S9 the switch default | Applied. The label names what a press does, and every entry is listed first. The switch moves to the Profile view, so the Plugins view is unchanged. Q2 and Q3 are kept, each with a revision note. | 7.1, 7.4, 8 |
| S10 "a nicer panel" is not designed | Applied. Layout rules and text mocks of the views at 80 and 48 columns; owner question Q13. | 7.8, 8 |
| S11 the increments are too big and proven only by stubs | Applied. P1 is split into P1a, P1b and P1c. A synthetic fixture of real shape and size is added. The stub-only parts are named, and each increment lists the owner questions it depends on. | 9 |
| N1 TYPES 3581-3586 | Applied: TYPES 3582. | 1.1 |
| N2 TRACE 79 | Applied: TRACE 75-77. | 1.3 |
| N3 CMDS 875-879 | Applied: CMDS 877-879. | 1.4 |
| N4 `settings-last-change` has no reader | Applied: the record is dropped. | 2.1, 3 |
| N5 HOME only | Applied: HOME, else USERPROFILE. | 1.3 |
| N6 the record races between sessions | Applied: stated in section 6 and in the hand-over. | 6 |
| N7 `--force` is moot on Desktop | Applied: noted. | 5 |
| N8 `x` beside Ctrl+X | Kept `x`, because the pane's close chord is Ctrl+X then X (UI 552), a different key press. L3 checks it. | 7.7, 11 |
| Coordinator, after the review: Q5's default contradicted the card's ruling | Applied. The profiles file is at the literal ~/.claude/.mod-manager/ even when `CLAUDE_CONFIG_DIR` is set; Q5 keeps the alternative with a revision note. The card now records interpretation 5 (atomic, 0600) as superseded, which matches section 3. | 1.3, 2.1, 3, 8, 11 |

### Review 2

Review: reports_dev/mod-manager/20261031_140714+0100-profiles-design-review-2.md (0 blockers; should-fix F1 and F3 to F7; nits F2 and N-a to N-g). Every finding was applied.

| Finding | Disposition | Where |
|---|---|---|
| F1 the surface rule has an unhandled case and an unproven premise | Applied. `changePath` has three answers: `terminal` present means the CLI path; non-empty without `terminal` means the Desktop path; empty means no change path. That a Desktop session lacks `terminal`, and that `$.process` rejects there, is marked UNVERIFIED, and L1 prints both on each surface. P1c test 5 covers the empty answer. | 2.4, 9 P1c, 11 |
| F2 (nit) L5 should compare the terminal diff with the Desktop writer's | Applied in L5. | 11 |
| F3 a partial APPLY on the terminal leaves changes unloaded | Applied: enables before disables, `k of N` progress, the 120-second timeout per call, the band notice with `[ r: Reload plugins ]` after a partial failure, and resume by pressing APPLY again. P3 tests 2, 8 and 9. | 5, 9 P3 |
| F4 the unanswered Q11 default was the harmful one | Applied. Until Q11 is answered yes, `DESKTOP_WRITES` is `false`: Desktop lists the plugins read-only, and APPLY there lists the changes and writes nothing. | 2.4, 5, 7.5, 8, 9 |
| F5 `reinstalled` contradicts the card and the L7a gate, and P1b claimed no owner questions | Applied together with the coordinator's decision. `reinstalled` and its test left P1b and sit with re-apply, which F6 splits into P4, gated on L7a; L7a waits for the owner's permission. The P1b heading and the section 9 table now say that P1b encodes the defaults of Q5, Q6 and Q15 and the name rule, each in one named constant (`PROFILES_DIR`, `KEEP_SELF_ON`, `PROFILE_ORIGIN`, `NAME_RULE`). | 6.1, 9, 11 |
| F6 P3 mixes APPLY with re-apply | Applied: P3 is APPLY and the reload step; P4 is re-apply, with its own tests and the L7a precondition. The build order now delivers the panel and the terminal APPLY first. | 9 |
| F7 `fs.stat` rejects for a missing file and has no `realPath` for a link that leads nowhere | Applied: section 3 step 1 handles a first creation (a folder check, profiles file only), a link that leads nowhere (refused) and a missing settings.json (refused, never created). P1b test 7 and P1a test 6. | 3, 9 |
| N-a Q13 had no default | Applied: 7.8 as drawn. | 8 |
| N-b APPLY's band notice "stays", but none existed yet | Applied: the notice is created, or stays when the step was started from it. | 5 |
| N-c Q15 stated an INFERRED fact as fact and hid the narrowing | Applied: the narrowing comes first, and the reason is marked INFERRED. | 8 |
| N-d Q2, Q3 and Q5 contradicted their revision notes | Applied: each states its current default, and the revision notes are gone. This replaces the round 1 instruction to keep the questions' text. | 8 |
| N-e P2 test 2 used `bodyRows` instead of `room` | Applied. | 9 P2 |
| N-f the promised Profile view line was neither drawn nor tested | Applied in 7.4, the 7.8 mock and P2 test 9. | 7.4, 7.8, 9 |
| N-g the S1 row's "keeps its current path" was empty for Desktop | Applied: the row now says Desktop stays read-only. | 12 |
| The review's strongest reason not to build | Answered by the new build order: P1b, P2 and the terminal P3 first; the Desktop write, the surface mapping and re-apply last. | 9 |
