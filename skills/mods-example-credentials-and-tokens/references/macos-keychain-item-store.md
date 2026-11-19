# macOS keychain item store

Reference notes on keeping one secret as a generic password item in the macOS keychain through the `security` program: read it, write it, delete it, with the secret never in a command line. Notes are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-api` (`$.process.run`, and the rule that every `$` call is an event an earlier mod can see) and `mods-doc-skills-reference` (the variables that replace a stored sign-in).

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each source does it](#how-each-source-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Sources](#sources)

## What it is

Three functions over one keychain item, found by a service name and an account name that the caller passes in: `readKeychainItem` returns the secret, or null when the item is not there; `writeKeychainItem` creates the item or replaces it; `deleteKeychainItem` removes it and says whether it was there. Each runs `security` through `$.process.run` and treats any other non-zero exit as an error that carries the exit code.

The secret goes to `security` on standard input. The generated types give `$.process.run` an `init` with `cwd`, `env`, `stdin` and `timeoutMs` (index.d.ts, `ProcessRunInit`), so the write runs `security -i` and sends one `add-generic-password` line as hex on stdin; the secret and its hex are in no argument. The chapter text for `$.process.run` names only the argument list, the exit code and the timeout; the types are the authority for the `stdin` field, as for every type shape. A read has to print the secret, so it comes back on standard output (`find-generic-password -w`).

What the module refuses before it starts any program: any platform name other than darwin (the caller passes the OS name in the tool object), an empty service or account, a name with a quote, a backslash or a line break (the `-i` line is a command line of its own, and a quote would end a name and let the rest run as more options), an empty secret, and a write line over 4000 characters (the interactive mode splits a longer line and runs the first part, which would store a cut secret). The names are checked for all three functions, so a name that reads is a name that writes. The caller supplies the path of the `security` program and a working folder it trusts; the module hard-codes neither. Which service name Claude Code itself uses for its login is a host internal, outside this module, and UNVERIFIED here.

## When to build one

- A mod that must keep a login or token for an account in the OS store rather than in a plain file, on macOS.
- A mod that must read the item Claude Code keeps its own login in. Whether the host keeps it there on a given build is UNVERIFIED: the sources say it prefers the credentials file when one exists.
- Skip it where the secret can stay in the host's own store; every `$` call below is seen by the mods earlier in the chain.

## How each source does it

### moabualruz/rice-session-accounts at af30e671ec51, MIT

- The write sends `add-generic-password -U -a "<account>" -s "<service>" -X "<hex>"` plus a newline to `security -i` on standard input, as hex, never as an argument. A name with a quote, a backslash or a line break is refused, and so is a line over 4000 characters, because the source found that `security -i` cuts a line near 4095 characters and runs the part it kept; that limit is the source's claim, UNVERIFIED here (hooks/keychain.ts:22, 142-168, 234-242).
- The call is made by the absolute path of `security`, with `/` as the working folder, so a planted program in a project folder cannot be picked up; the same options clear `NODE_OPTIONS` for programs that read it (hooks/io.ts:34-48; hooks/keychain.ts:23-25). A rejection of the call is told apart as a timeout, a missing program or a denied one, and the message names the action and never the line (hooks/io.ts:50-65; hooks/keychain.ts:198-208).
- A non-zero exit is an error, a locked keychain (exit 36) has its own message, and error words on standard error count as a failure too, since the source says `-i` reports only the last command's status; standard error is never quoted because it may repeat the line (hooks/keychain.ts:229-242). The reference module checks the exit code and the same error words.
- A read treats exit 44 as no such item, any other non-zero exit as an error, and a cut output as an error. A value that prints as hex is decoded when it parses as the stored JSON (hooks/keychain.ts:121-130, 214-227). The reference module returns the printed text as it is.
- The service name comes from a hash of the config folder, and a write is read back to prove it landed on the same item. Both are outside the reference module (hooks/keychain.ts:32-48).

### sam-ruff/account-switcher-claude-code-mod at 3f47d2b23bcd, MIT

- `Security` is a function that takes the arguments and optional standard input and returns the exit code and output, so a test can answer it. The write sends the same `add-generic-password -U` line to `security -i` on standard input, and a non-zero exit becomes an error that names the exit code only. The delete is `delete-generic-password -a <user> -s <service>` and its result is not checked (hooks/keychain.ts:16-17, 57-69). The reference module checks the delete.
- The user name is used as the keychain account only when it matches letters, digits, dot, underscore and hyphen, else a fallback name (hooks/keychain.ts:19-20). The reference module refuses a name instead of replacing it.

### simplecore-inc/claude-mods at bbaba9937769, MIT

- Each saved account's login is one keychain item under a fixed service, named by the account id; the secret travels to `security` on stdin as hex, never in a command line. An account id is limited to letters, digits, hyphen and underscore, up to 64, because it travels inside the `-i` line (mods/accounts/hooks/keychain.ts:59-70, 87-102; docs/accounts.md:368).
- The delete runs `delete-generic-password` and treats exit 44 as already gone, any other non-zero exit as an error that carries standard error (hooks/credentials.ts:250-261). The reference module does the same, without quoting standard error.

## Reference module

The module takes the program path and the working folder as parameters and every name and the secret as arguments. It runs only `$.process.run`. The behaviour tests are in tests/reference-modules/macos-keychain-item-store.test.ts.

### Reference module, macos-keychain-item-store, MIT (this plugin)

```ts
import type { EngineInterface } from 'claude-code'

// security is the path of the program, cwd a folder the caller trusts, platform the OS name. All are host facts, so none is written in here.
export type KeychainTool = { security: string; cwd: string; platform: string }

export class KeychainError extends Error {
  exitCode: number | undefined
  constructor(message: string, exitCode?: number) {
    super(message)
    this.name = 'KeychainError'
    this.exitCode = exitCode
  }
}

// UNVERIFIED host facts taken from rice-session-accounts: 44 means no such item; `security -i` cuts a line near 4095 characters;
// these words on standard error mean the command failed even when the exit code is 0.
const ITEM_NOT_FOUND = 44
const LINE_LIMIT = 4000
const ERROR_WORDS = /unknown command|error|fail|invalid|cannot|could not|couldn't|not allowed|denied|usage:|SecKeychain|errSec/i
const TIMEOUT_MS = 15_000

// platform is the operating system name the caller found ('darwin' for macOS). The keychain exists only there, so any other value is refused
// before a program is started. No `$` call in the generated types reports the OS: how the caller finds it is UNVERIFIED.
function checkTool(tool: KeychainTool): void {
  if (tool.platform !== 'darwin') throw new KeychainError(`the macOS keychain store works on macOS only; this platform is ${tool.platform}`)
}

function checkName(label: string, value: string): void {
  if (value === '' || /["\\\n\r]/.test(value)) throw new KeychainError(`refused ${label}: it is empty or holds a quote, a backslash or a line break`)
}

function toHex(text: string): string {
  return Array.from(new TextEncoder().encode(text), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Never put a line or standard error in a message: either may repeat the secret.
async function run($: EngineInterface, tool: KeychainTool, argv: string[], action: string, stdin?: string) {
  try {
    return await $.process.run([tool.security, ...argv], { cwd: tool.cwd, timeoutMs: TIMEOUT_MS, ...(stdin === undefined ? {} : { stdin }) })
  } catch {
    throw new KeychainError(`could not ${action}`)
  }
}

/** The secret of the item, or null when there is no such item. */
export async function readKeychainItem($: EngineInterface, tool: KeychainTool, service: string, account: string): Promise<string | null> {
  checkTool(tool)
  checkName('the service', service)
  checkName('the account', account)
  const ran = await run($, tool, ['find-generic-password', '-s', service, '-a', account, '-w'], 'read the keychain item')
  if (ran.exitCode === ITEM_NOT_FOUND) return null
  if (ran.exitCode !== 0) throw new KeychainError(`cannot read the keychain item (security exit ${ran.exitCode})`, ran.exitCode)
  if (ran.isStdoutTruncated) throw new KeychainError('cannot read the keychain item: the output was cut')
  return ran.stdout.replace(/\n$/, '')
}

/** Creates the item or replaces it. The secret travels on standard input as hex. */
export async function writeKeychainItem($: EngineInterface, tool: KeychainTool, service: string, account: string, secret: string): Promise<void> {
  checkTool(tool)
  checkName('the service', service)
  checkName('the account', account)
  if (secret === '') throw new KeychainError('refused an empty secret')
  const line = `add-generic-password -U -a "${account}" -s "${service}" -X "${toHex(secret)}"\n`
  if (line.length > LINE_LIMIT) throw new KeychainError(`refused a ${line.length}-character write: security -i would cut it past ${LINE_LIMIT} and store a cut secret`)
  const ran = await run($, tool, ['-i'], 'write the keychain item', line)
  if (ran.exitCode !== 0) throw new KeychainError(`cannot write the keychain item (security exit ${ran.exitCode})`, ran.exitCode)
  if (ERROR_WORDS.test(ran.stderr)) throw new KeychainError('cannot write the keychain item: security reported an error')
}

/** Removes the item; false when it was not there. */
export async function deleteKeychainItem($: EngineInterface, tool: KeychainTool, service: string, account: string): Promise<boolean> {
  checkTool(tool)
  checkName('the service', service)
  checkName('the account', account)
  const ran = await run($, tool, ['delete-generic-password', '-s', service, '-a', account], 'delete the keychain item')
  if (ran.exitCode === ITEM_NOT_FOUND) return false
  if (ran.exitCode !== 0) throw new KeychainError(`cannot delete the keychain item (security exit ${ran.exitCode})`, ran.exitCode)
  return true
}
```

## Surfaces

This module draws nothing: it has no pane, bar, button or text, so there is no style to set and no show or hide control to add. It runs `security` through `$.process.run`.

Terminal: it works as described (`mods-doc-mods-api`, line 290, describes `$.process.run`). It runs on the terminal only, because `$.process` is labelled 'CLI only' in the generated types (index.d.ts line 3582); the same file writes 'Terminal only' where it means the terminal surface (line 9719).

Desktop: not supported. The module needs `$.process.run`, which the generated types label 'CLI only' (index.d.ts line 3582), so a Desktop mod is not meant to see it; hooks do run in the Code tab of the Desktop app (`mods-doc-mods-overview`, line 212), except in a WSL session (lines 212-213), but the chapter `mods-doc-mods-api` (line 290) names no surface for the call. What a Desktop session does with the call is UNVERIFIED until it is tried live. The module has no Desktop branch and runs no program there: a refused or rejected call ends in the module's "could not ..." error, an answer with a non-zero exit in "cannot ... (security exit N)" (how a refusal arrives is UNVERIFIED, `mods-doc-mods-api` line 293 says a call can be refused, not how); nothing is stored or read.

Operating systems: macOS only. The module refuses with a clear error on any other operating system, before it starts a program.

## Traps

- Every `$.process.run` is an event: a mod earlier in the chain can see its arguments and its standard input, rewrite them or refuse the call (`mods-doc-mods-api`). The secret is out of the process list and still readable by those mods, and a read returns it on standard output, so the same holds. Whether a given earlier mod logs it is the person's to check; this is the consequence of the sentence in the chapter.
- The generated types label `$.process` "CLI only" and do not say which hosts that leaves out. Hooks run in the Desktop Code tab (`mods-doc-mods-overview`, line 212), except in a WSL session (lines 212-213), so the module is meant for both surfaces, but a Desktop run is UNVERIFIED. How a refused call arrives is UNVERIFIED (`mods-doc-mods-api`, line 293, does not say): a rejection shows as "could not ...", an answer with a non-zero exit as "cannot ... (security exit N)"; neither is a missing item, which is only exit 44 on a read or delete.
- Only macOS has `security`. The module refuses any platform name other than darwin with a clear error, before it starts a program. The caller must pass the OS name truthfully; how it finds it is UNVERIFIED, since no `$` call in the generated types reports it. On Linux and Windows the sources keep the login in a file instead.
- The exit codes 44 (no such item) and 36 (locked keychain) are the source's claims, UNVERIFIED here. The module acts only on 44; a caller that wants to branch on 36 reads `exitCode` of the error. The keychain may also show a prompt to the person, and the call then runs into its 15 seconds and is rejected: the message says the program could not be run, not that a prompt waits.
- The 4000-character write limit counts characters of the whole line. Hex doubles the secret, so a secret above about 1900 bytes is refused; a login document with other keys can reach that. The rice source drops optional keys until the line fits; this module does not, since that is a decision about the document.
- The error words on standard error are a heuristic taken from one source. An exit code of 0 with those words is treated as a failure; an exit code of 0 with an unlisted failure text is not caught. Whether `security -i` exits non-zero for a failed single command is UNVERIFIED.
- A read prints the secret as hex when it has bytes that do not print; the source decodes it when it parses as the stored JSON. This module returns the text as printed.
- The error-words check can report failure for a write that already happened: `-U` has stored the item, and a harmless warning on standard error that holds one of the words (such as 'error' or 'fail') still makes the module throw. A caller that retries is safe, since `-U` replaces the item.
- UNVERIFIED: whether `security -i`, run without a terminal, echoes the command line it reads (which holds the secret as hex) to standard output or standard error. The module never quotes either, but a caller that logs them would leak it.
- `-U` replaces an existing item with the same service and account without asking, so a write with the wrong names overwrites another item. The names are the caller's contract, and the item Claude Code keeps its own login in is a host internal; do not write to it without reading the sources first.
- The names are placed inside double quotes of a command line. The module refuses the four characters the sources refuse; whether `security` treats any other character in a name specially is UNVERIFIED.
- The behaviour tests answer `$.process.run` through the host test kit. The names they rely on, the `argv` and `init` fields of the process.run event and the `{ value }` shape of a stub answer, were found by running the kit and not read from a chapter: UNVERIFIED.

## Sources

- moabualruz/rice-session-accounts@af30e671ec51 hooks/keychain.ts:9-48, 114-130, 142-168, 198-242, MIT
- moabualruz/rice-session-accounts@af30e671ec51 hooks/io.ts:34-65, MIT
- sam-ruff/account-switcher-claude-code-mod@3f47d2b23bcd hooks/keychain.ts:16-20, 57-69, MIT
- simplecore-inc/claude-mods@bbaba9937769 mods/accounts/hooks/keychain.ts:59-70, 87-102, MIT
- simplecore-inc/claude-mods@bbaba9937769 mods/accounts/hooks/credentials.ts:250-261, MIT
- simplecore-inc/claude-mods@bbaba9937769 docs/accounts.md:368, MIT
