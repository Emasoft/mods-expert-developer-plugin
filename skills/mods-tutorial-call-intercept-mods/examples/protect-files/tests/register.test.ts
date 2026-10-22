import { expect, test } from 'claude-code/testing'

// Stub $.store with a Map, as mods-doc-mods-testing does in "Test a drawing".
function stubStore(on: any, saved: Map<string, unknown>) {
  on('store.get', (_: unknown, e: any) => ({ value: saved.get(e.key) }))
  on('store.set', (_: unknown, e: any) => {
    saved.set(e.key, e.value)
    return { value: undefined }
  })
}

// The stub stands for the real Edit/Write tool: `ran` counts calls that reached it.
function stubTool(on: any) {
  const seen = { ran: 0 }
  on('tool.call', () => {
    seen.ran += 1
    return { result: 'ok' }
  })
  return seen
}

test('a protected path is denied and the tool never runs', async ($, on) => {
  const saved = new Map<string, unknown>([['protect-files.paths', ['/p/.env', 'secrets']]])
  stubStore(on, saved)
  const tool = stubTool(on)

  const a = await $.tool.call({ tool: 'Write', file_path: '/p/./.env', content: 'x' })
  expect(a.deny).toContain('is protected')
  const b = await $.tool.call({ tool: 'Edit', file_path: '/p/secrets/k.txt', old_string: 'a', new_string: 'b' })
  expect(b.deny).toContain('is protected')
  expect(tool.ran).toBe(0)
})

test('an unprotected path reaches the tool', async ($, on) => {
  const saved = new Map<string, unknown>([['protect-files.paths', ['/p/.env']]])
  stubStore(on, saved)
  const tool = stubTool(on)

  const r = await $.tool.call({ tool: 'Write', file_path: '/p/ok.txt', content: 'x' })
  expect(r.deny).toBeUndefined()
  expect(tool.ran).toBe(1)
})

test('a hook that throws before deciding denies the call (fail closed)', async ($, on) => {
  // UNVERIFIED: a { deny } answer on store.get makes $.store.get reject inside the hook; the testing
  // chapter shows { deny } for any mods API call that should fail (chapter.md:189), not for this hook.
  on('store.get', () => ({ deny: 'store is down' }))
  const tool = stubTool(on)

  const r = await $.tool.call({ tool: 'Write', file_path: '/p/ok.txt', content: 'x' })
  expect(r.deny).toContain('the guard failed')
  expect(tool.ran).toBe(0)
})

test('off lets every call through untouched', async ($, on) => {
  const saved = new Map<string, unknown>([
    ['protect-files.paths', ['/p/.env']],
    ['protect-files.enabled', false],
  ])
  stubStore(on, saved)
  const tool = stubTool(on)

  const r = await $.tool.call({ tool: 'Write', file_path: '/p/.env', content: 'x' })
  expect(r.deny).toBeUndefined()
  expect(tool.ran).toBe(1)
})

test('/protect-files toggles, sets, stores and toasts; bad args answer usage', async ($, on) => {
  const saved = new Map<string, unknown>()
  stubStore(on, saved)
  const toasts: string[] = []
  on('ui.toast', (_: unknown, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  await $.command.run({ command: 'protect-files', args: '' })
  expect(saved.get('protect-files.enabled')).toBe(false)
  await $.command.run({ command: 'protect-files', args: 'on' })
  expect(saved.get('protect-files.enabled')).toBe(true)
  const bad = await $.command.run({ command: 'protect-files', args: 'x' })
  expect(bad.text).toBe('usage: /protect-files [on|off]')
  expect(toasts).toEqual(['protect-files off', 'protect-files on'])
})

test('/protect-files-paths manages the stored list', async ($, on) => {
  const saved = new Map<string, unknown>()
  stubStore(on, saved)

  await $.command.run({ command: 'protect-files-paths', args: 'add ./a/b/' })
  expect(saved.get('protect-files.paths')).toEqual(['a/b'])
  const list = await $.command.run({ command: 'protect-files-paths', args: 'list' })
  expect(list.text).toBe('a/b')
  await $.command.run({ command: 'protect-files-paths', args: 'remove a/b' })
  expect(saved.get('protect-files.paths')).toEqual([])
})

test('/protect-files-paths add ../x is refused and leaves the store unset', async ($, on) => {
  const saved = new Map<string, unknown>()
  stubStore(on, saved)

  const r = await $.command.run({ command: 'protect-files-paths', args: 'add ../x' })
  expect(r.text).toContain('cannot be protected')
  expect(saved.has('protect-files.paths')).toBe(false)
})

test('a relative target is denied while an absolute entry exists, and the tool never runs', async ($, on) => {
  const saved = new Map<string, unknown>([['protect-files.paths', ['/p/.env']]])
  stubStore(on, saved)
  const tool = stubTool(on)

  const r = await $.tool.call({ tool: 'Write', file_path: '.env', content: 'x' })
  expect(r.deny).toContain('relative path')
  expect(tool.ran).toBe(0)
})

test('a damaged stored list is reported by the paths command and not overwritten', async ($, on) => {
  const saved = new Map<string, unknown>([['protect-files.paths', 'oops']])
  stubStore(on, saved)

  const r = await $.command.run({ command: 'protect-files-paths', args: 'add /p/.env' })
  expect(r.text).toContain('damaged')
  expect(saved.get('protect-files.paths')).toBe('oops')
})

test('session.start registers both commands', async ($, on) => {
  const names: string[] = []
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', (_: unknown, e: any) => {
    names.push(e.name)
    return { value: undefined }
  })

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(names).toEqual(['protect-files', 'protect-files-paths'])
})
