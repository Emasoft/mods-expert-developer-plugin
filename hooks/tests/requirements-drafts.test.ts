// Wiring tests of the requirements-drafts mod through the kit: rows, commands, picker, refusals.
// Every row test draws on both surfaces at a narrow and a wide width with the same assertions.
import { describe, expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'mods-expert-developer-plugin'
const HOME = '/home/tester'
const DIR = `${HOME}/.claude/requirements-drafts`
const SURFACES = ['terminal', 'desktop'] as const
const WIDTHS = [40, 160] as const

type Write = { path: string; text: string }
type World = { writes: Write[]; toasts: string[]; store: Map<string, unknown>; files: string[]; closed: string[] }

// Register every stub the mod's calls need; the kit wants them before the first call on $.
function stubs(on: any, files: string[] = []): World {
  const world: World = { writes: [], toasts: [], store: new Map(), files: [...files], closed: [] }
  mock.clock(on, { now: Date.UTC(2026, 9, 23, 16, 1, 9) })
  on('store.get', ($: any, e: any) => ({ value: world.store.get(e.key) }))
  on('store.set', ($: any, e: any) => {
    world.store.set(e.key, e.value)
    return { value: undefined }
  })
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.exists', () => ({ value: world.files.length > 0 }))
  on('fs.list', () => ({ value: world.files.map((name) => ({ name, kind: 'file', size: 1, mtimeMs: 1, isLink: false })) }))
  on('fs.write', ($: any, e: any) => {
    world.writes.push({ path: e.path, text: e.text })
    world.files.push(e.path.slice(e.path.lastIndexOf('/') + 1))
    return { value: undefined }
  })
  on('session.repo', () => ({ value: { root: '/work', remote: null, internal: false, name: null } }))
  on('session.root', () => ({ value: '/work' }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('ui.toast', ($: any, e: any) => {
    world.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', ($: any, e: any) => {
    world.closed.push(e.id)
    return { value: undefined }
  })
  on('command.register', ($: any, e: any) => ({ value: { command: e.name } }))
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
  on('classic.SessionStart', () => ({}))
  // What Claude Code itself draws for the message row, under which the mod adds its line.
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine row'] }))
  return world
}

async function start($: any) {
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
}

async function typed($: any, text: string) {
  await $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
}

function command($: any, name: string, args = '') {
  return $.command.run({ command: name, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
}

function row(surface: 'terminal' | 'desktop', columns: number, requestId: string, text: string, kind = 'composer') {
  return {
    plugin: PLUGIN,
    surface,
    component: 'UserMessage' as const,
    requestId,
    viewport: { columns, rows: 30 },
    props: { text, origin: { kind }, isExpanded: true },
  } as any
}

function pane(surface: 'terminal' | 'desktop', columns: number) {
  return {
    plugin: PLUGIN,
    surface,
    component: 'Pane' as const,
    requestId: 'requirements-drafts-pick',
    viewport: { columns, rows: 30 },
    props: { title: 'Save a requirement draft', isFocused: true, bodyColumns: columns - 4, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  } as any
}

describe('row button under a typed message', () => {
  test('draws, saves the message with its frontmatter, then shows the saved mark', async ($, on) => {
    const world = stubs(on)
    await start($)
    let n = 0
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        n += 1
        const id = `msg-${surface}-${columns}`
        const text = `requirement ${n}: the drafts list sorts newest first`
        const ui = await $.ui.mount(row(surface, columns, id, text))
        expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
        expect(await ui.find({ key: `rd-save-${id}` })).toBeDefined()
        await ui.press({ key: `rd-save-${id}` })
        const written = world.writes[n - 1]
        expect(written).toBeDefined()
        expect(written!.path.startsWith(`${DIR}/`)).toBe(true)
        expect(written!.path).toMatch(/\/\d{8}_\d{6}[+-]\d{4}-[0-9a-f]{12}\.md$/)
        expect(written!.text).toContain(`message-id: "${id}"`)
        expect(written!.text).toContain('via: "row"')
        expect(written!.text).toContain(`surface: "${surface}"`)
        expect(written!.text).toContain('project-root: "/work"')
        expect(written!.text).toContain('session: "sess-1"')
        expect(written!.text).toContain(text)
        expect(written!.text.endsWith('<!-- requirements-drafts:end -->\n')).toBe(true)
        expect(await ui.find({ type: 'Text', text: /^✓ saved as requirement draft / })).toBeDefined()
        expect(await ui.find({ key: `rd-save-${id}` })).toBeUndefined()
        await ui.unmount()
      }
    }
    expect(world.writes.length).toBe(4)
    expect(world.toasts.filter((t) => t.startsWith('Saved requirement draft ')).length).toBe(4)
  })

  test('a message already on disk is found by its hash: no second file, "already saved" toast, saved mark', async ($, on) => {
    const text = 'the same requirement twice'
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (b) => b.toString(16).padStart(2, '0')).join('')
    const existing = `20261001_090000+0200-${digest.slice(0, 12)}`
    const world = stubs(on, [`${existing}.md`])
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const id = `again-${surface}-${columns}`
        const ui = await $.ui.mount(row(surface, columns, id, text))
        await ui.press({ key: `rd-save-${id}` })
        expect(await ui.find({ type: 'Text', text: `✓ saved as requirement draft ${existing}` })).toBeDefined()
        await ui.unmount()
      }
    }
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(Array(4).fill(`already saved as ${existing}`))
  })

  test('switch off: no button on any surface or width, and the state is stored', async ($, on) => {
    const world = stubs(on)
    await start($)
    const answer = await command($, 'requirements-drafts', 'off')
    expect(answer.text).toBe('requirements-drafts is off.')
    expect(world.store.get('enabled')).toBe(false)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(row(surface, columns, `off-${surface}-${columns}`, 'a requirement'))
        expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
        expect(await ui.find({ key: `rd-save-off-${surface}-${columns}` })).toBeUndefined()
        await ui.unmount()
      }
    }
  })

  test('an off switch already in the store keeps the mod off after a start', async ($, on) => {
    const world = stubs(on)
    world.store.set('enabled', false)
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'stored-off', 'a requirement'))
    expect(await ui.find({ key: 'rd-save-stored-off' })).toBeUndefined()
  })

  test('a row that is not the composer\'s gets no button', async ($, on) => {
    stubs(on)
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        for (const kind of ['task-notification', 'peer', 'bridge', 'plugin']) {
          const id = `${kind}-${surface}-${columns}`
          const ui = await $.ui.mount(row(surface, columns, id, 'not typed here', kind))
          expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
          expect(await ui.find({ key: `rd-save-${id}` })).toBeUndefined()
          await ui.unmount()
        }
      }
    }
  })

  test('the placeholder id of a first draw gets no button', async ($, on) => {
    stubs(on)
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(row(surface, columns, 'placeholder', 'first row'))
        expect(await ui.find({ key: 'rd-save-placeholder' })).toBeUndefined()
        await ui.unmount()
      }
    }
  })

  test('a secret-looking message is refused with a toast and nothing is written', async ($, on) => {
    const world = stubs(on)
    await start($)
    const ui = await $.ui.mount(row('desktop', 160, 'secret-row', 'my key is AKIAABCDEFGHIJKLMNOP'))
    await ui.press({ key: 'rd-save-secret-row' })
    expect(world.writes.length).toBe(0)
    expect(world.toasts[0]).toMatch(/looks like it holds a secret/)
    expect(await ui.find({ key: 'rd-save-secret-row' })).toBeDefined()
  })
})

describe('/requirements-drafts', () => {
  test('toggles with no argument and answers usage for anything else', async ($, on) => {
    const world = stubs(on)
    await start($)
    expect((await command($, 'requirements-drafts')).text).toBe('requirements-drafts is off.')
    expect((await command($, 'requirements-drafts')).text).toBe('requirements-drafts is on.')
    expect(world.store.get('enabled')).toBe(true)
    expect((await command($, 'requirements-drafts', 'later')).text).toBe('Usage: /requirements-drafts [on|off]')
  })
})

describe('/requirements-drafts-save', () => {
  test('saves the last typed message, never a slash command, and prints nothing', async ($, on) => {
    const world = stubs(on)
    await start($)
    await typed($, 'first requirement')
    await typed($, 'second requirement')
    await typed($, '/compact')
    const answer = await command($, 'requirements-drafts-save')
    expect(answer).toEqual({})
    expect(world.writes.length).toBe(1)
    expect(world.writes[0]!.text).toContain('\nsecond requirement\n')
    expect(world.writes[0]!.text).toContain('via: "command"')
    expect(world.writes[0]!.text).toContain('message-id: ""')
  })

  test('a prompt from another origin is not recorded', async ($, on) => {
    const world = stubs(on)
    await start($)
    await $.prompt.submit({ text: 'a task notification', wait: false, origin: { kind: 'task-notification' } })
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(['No typed message to save yet in this conversation.'])
  })

  test('nothing is recorded while the switch is off', async ($, on) => {
    const world = stubs(on)
    await start($)
    await command($, 'requirements-drafts', 'off')
    await typed($, 'typed while off')
    await command($, 'requirements-drafts', 'on')
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
  })

  test('refuses a secret with a toast', async ($, on) => {
    const world = stubs(on)
    await start($)
    await typed($, 'password: correcthorsebattery')
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
    expect(world.toasts[0]).toMatch(/secret/)
  })

  test('/clear, /resume and /branch empty the list of typed messages; compaction keeps it', async ($, on) => {
    const world = stubs(on)
    await start($)
    for (const source of ['clear', 'resume', 'fork'] as const) {
      await typed($, `before ${source}`)
      await $.classic.SessionStart({ source })
      await command($, 'requirements-drafts-save')
    }
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(Array(3).fill('No typed message to save yet in this conversation.'))
    await typed($, 'before compact')
    await $.classic.SessionStart({ source: 'compact' })
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(1)
  })
})

describe('/requirements-drafts-pick', () => {
  test('lists recent messages under letter hotkeys and saves the pressed one', async ($, on) => {
    const world = stubs(on)
    await start($)
    await typed($, 'older requirement')
    await typed($, 'newer requirement')
    expect(await command($, 'requirements-drafts-pick')).toEqual({})
    let saves = 0
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(pane(surface, columns))
        const first = await ui.find({ key: 'pick-0' })
        expect(first?.props.hotkey).toBe('a')
        expect(first?.props.label).toBe('newer requirement')
        expect((await ui.find({ key: 'pick-1' }))?.props.hotkey).toBe('b')
        expect(await ui.find({ type: 'Text', text: 'Esc closes' })).toBeDefined()
        await ui.press({ key: 'pick-1' })
        saves += 1
        await ui.unmount()
      }
    }
    // The first press writes; the next ones find the same hash on disk.
    expect(world.writes.length).toBe(1)
    expect(world.writes[0]!.text).toContain('via: "picker"')
    expect(world.writes[0]!.text).toContain('\nolder requirement\n')
    expect(world.closed.length).toBe(saves)
  })

  test('an empty list says so', async ($, on) => {
    stubs(on)
    await start($)
    await command($, 'requirements-drafts-pick')
    const ui = await $.ui.mount(pane('terminal', 80))
    expect(await ui.find({ type: 'Text', text: 'No typed message yet in this conversation.' })).toBeDefined()
    expect(await ui.find({ key: 'pick-0' })).toBeUndefined()
  })
})
