import type { Register } from 'claude-code'

import { DAMAGED_LIST_TEXT, ENABLED_KEY, PATHS_KEY, checkTarget, parseManage, parseSwitch, readList } from './logic.js'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    // Register commands last: a throw here skips the rest of the hook (mods-doc-mods-api chapter.md:49).
    // $.command.register and its fields name, description, argumentHint: mods-doc-mods-api chapter.md:34.
    await $.command.register({ name: 'protect-files', description: 'Turn the protected-files guard on or off', argumentHint: '[on|off]' })
    await $.command.register({ name: 'protect-files-paths', description: 'Manage the protected paths', argumentHint: 'add <path> | remove <path> | list' })
    return next(e)
  })

  // e.args is the text typed after the command name, or an empty string (mods-doc-mods-api chapter.md:40).
  // $.store.get(key) resolves to the value or undefined and $.store.set(key, value) takes any JSON value
  // (mods-doc-mods-interfaces chapter.md:744); $.ui.toast shows a notification (mods-doc-mods-api chapter.md:222).
  on('command.run', { command: 'protect-files' }, async ($, e) => {
    // A missing key means on: a guard that has never been configured protects.
    const current = (await $.store.get(ENABLED_KEY)) !== false
    const result = parseSwitch(e.args, current)
    if ('usage' in result) return { text: result.usage }
    await $.store.set(ENABLED_KEY, result.enabled)
    await $.ui.toast(result.enabled ? 'protect-files on' : 'protect-files off')
    return {}
  })

  // e.args, $.store.get and $.store.set as above (mods-doc-mods-api chapter.md:40, mods-doc-mods-interfaces chapter.md:744).
  on('command.run', { command: 'protect-files-paths' }, async ($, e) => {
    const stored = await $.store.get(PATHS_KEY)
    // A damaged value is reported and left alone: replacing it with an empty list would silently
    // drop every protection the user thought was set.
    const current = readList(stored)
    if (current === undefined) return { text: DAMAGED_LIST_TEXT }
    const result = parseManage(e.args, current)
    if ('usage' in result) return { text: result.usage }
    // An answer with no paths (a refused entry) leaves the store untouched.
    if ('paths' in result) await $.store.set(PATHS_KEY, result.paths)
    return { text: result.text }
  })

  on('tool.call', { tool: ['Edit', 'Write'] }, async ($, e, next) => {
    // Off is a deliberate policy: every call passes untouched.
    if ((await $.store.get(ENABLED_KEY)) === false) return next(e)
    // e.file_path is documented for tool.call (mods-doc-mods-and-events chapter.md:108 and :134).
    const reason = checkTarget(e.file_path, await $.store.get(PATHS_KEY))
    // Deny BEFORE next: after next the tool has already run.
    if (reason !== undefined) return { deny: reason }
    return next(e)
  })
    // A hook that throws is skipped and the call would run. Refuse instead, unless
    // the hook had already called next (then its result stands). next.called and
    // next.error.kind (throw, timeout or re-entry) are in mods-doc-mods-reference chapter.md:62-63.
    // The `if (next.called) return next(e)` pattern is shown in mods-doc-mods-and-events chapter.md:331-337.
    .catch(($, e, next) => (next.called ? next(e) : { deny: 'protect-files: the guard failed, so this call was not allowed: ' + next.error.kind }))
}
