// The HUD runs inside the staged plugin, drawn with HUD_TEST_STYLE from tests/reference-modules/host-register.ts so
// that nothing drawn can come from the defaults. Every drawing is checked on both surfaces at a narrow and a wide width.
import { describe, expect, test } from 'claude-code/testing'

import { HUD_TEST_STYLE as STYLE } from '../register'
import { HUD_OPEN_KEY } from '../security-hud'
import { TAINT_DEFAULTS } from '../session-taint'

const PLUGIN = 'reference-modules-test'
const LAYOUTS = [
  { surface: 'terminal', columns: 40 },
  { surface: 'terminal', columns: 120 },
  { surface: 'desktop', columns: 40 },
  { surface: 'desktop', columns: 120 },
] as const
const footer = (surface: string, columns: number) => ({ plugin: PLUGIN, component: 'SessionMode', surface, viewport: { columns, rows: 30 }, props: { modes: ['plan mode'] } })
const band = (surface: string, columns: number, hasSurvey = false) => ({
  plugin: PLUGIN,
  component: 'AbovePrompt',
  surface,
  viewport: { columns, rows: 30 },
  props: { hasSurvey, isWorking: false, maxRows: 10, bodyColumns: columns - 5, scroll: { offset: 0, bodyRows: 10 }, view: {} },
})

/** Stubs $.store with a Map and the site Claude Code draws beneath the HUD; returns the Map. */
function host(on: any): Map<string, unknown> {
  const saved = new Map<string, unknown>()
  on('store.get', ($: any, e: any) => ({ value: saved.get(e.key) }))
  on('store.set', ($: any, e: any) => (saved.set(e.key, e.value), { value: undefined }))
  on('ui.render', ($: any, e: any) => $.ui.resolve(e).Text({ children: ['drawn by Claude Code'] }))
  on('tool.call', () => ({ result: 'text' }))
  return saved
}
const toggleLabel = (mark: string) => `${STYLE.toggleHotkey}: ${STYLE.toggleLabel} ${mark}`

describe('securityHud, footer button', () => {
  test('beside the mode labels it shows the clean mark, and a press opens the band', async ($, on) => {
    const saved = host(on)
    for (const { surface, columns } of LAYOUTS) {
      saved.delete(HUD_OPEN_KEY)
      const ui = await $.ui.mount(footer(surface, columns) as any)
      expect(await ui.find({ type: 'Text', text: 'drawn by Claude Code' }), surface).toBeDefined()
      expect((await ui.find({ key: 'security-hud-toggle' }))?.props, surface).toMatchObject({ label: toggleLabel(STYLE.cleanMark), hotkey: STYLE.toggleHotkey, dimColor: false })
      await ui.press({ key: 'security-hud-toggle' })
      expect(saved.get(HUD_OPEN_KEY), surface).toBe(true)
      await ui.unmount()
    }
  })
  test('after a fetched page it shows the held mark', async ($, on) => {
    host(on)
    await $.tool.call({ tool: 'WebFetch', url: 'https://example.test/page', prompt: 'Summarize it.' })
    for (const { surface, columns } of LAYOUTS) {
      const ui = await $.ui.mount(footer(surface, columns) as any)
      expect((await ui.find({ key: 'security-hud-toggle' }))?.props.label, surface).toBe(toggleLabel(STYLE.heldMark))
      await ui.unmount()
    }
  })
})

describe('securityHud, band', () => {
  test('a closed band, or one a survey holds, draws nothing of its own', async ($, on) => {
    const saved = host(on)
    for (const { surface, columns } of LAYOUTS) {
      saved.set(HUD_OPEN_KEY, false)
      let ui = await $.ui.mount(band(surface, columns) as any)
      expect(await ui.find({ type: 'Text', text: STYLE.title }), surface).toBeUndefined()
      await ui.unmount()
      saved.set(HUD_OPEN_KEY, true)
      ui = await $.ui.mount(band(surface, columns, true) as any)
      expect(await ui.find({ type: 'Text', text: STYLE.title }), surface).toBeUndefined()
      await ui.unmount()
    }
  })
  test('an open band names both facts in the style colors and offers no clear while nothing is held', async ($, on) => {
    const saved = host(on)
    saved.set(HUD_OPEN_KEY, true)
    for (const { surface, columns } of LAYOUTS) {
      const ui = await $.ui.mount(band(surface, columns) as any)
      expect(await ui.find({ type: 'Text', text: STYLE.title }), surface).toBeDefined()
      expect((await ui.find({ type: 'Text', text: `${STYLE.cleanMark} ${STYLE.untrustedName}: ${STYLE.noneText}` }))?.props.color, surface).toBe(STYLE.cleanColor)
      expect(await ui.find({ key: 'security-hud-clear' }), surface).toBeUndefined()
      expect((await ui.find({ key: 'security-hud-hide' }))?.props.label, surface).toBe(`${STYLE.hideHotkey}: ${STYLE.hideLabel}`)
      await ui.unmount()
    }
  })
  test('the clear button clears what is held, and the hide button closes the band', async ($, on) => {
    const saved = host(on)
    saved.set(HUD_OPEN_KEY, true)
    for (const { surface, columns } of LAYOUTS) {
      await $.tool.call({ tool: 'WebFetch', url: 'https://example.test/page', prompt: 'Summarize it.' })
      const ui = await $.ui.mount(band(surface, columns) as any)
      expect((await ui.find({ type: 'Text', text: `${STYLE.heldMark} ${STYLE.untrustedName}: WebFetch returned text from outside` }))?.props.color, surface).toBe(STYLE.heldColor)
      await ui.press({ key: 'security-hud-clear' })
      const status = await $.command.run({ command: TAINT_DEFAULTS.commands.status, args: '' })
      expect(status.text, surface).toBe('untrusted text: none\nsecret read: none')
      await ui.press({ key: 'security-hud-hide' })
      expect(saved.get(HUD_OPEN_KEY), surface).toBe(false)
      saved.set(HUD_OPEN_KEY, true)
      await ui.unmount()
    }
  })
})
