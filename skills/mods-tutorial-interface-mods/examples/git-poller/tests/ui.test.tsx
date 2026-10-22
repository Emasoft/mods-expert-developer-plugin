import { expect, test } from 'claude-code/testing'

import { startSession, stubs } from './helpers.js'

// The AbovePrompt props, one line per prop, each with the chapter line that documents it.
// Prop list and the site: mods-doc-mods-reference chapter.md:231.
const BAND = {
  plugin: 'git-poller',
  component: 'AbovePrompt',
  props: {
    // mods-doc-mods-reference chapter.md:231 (hasSurvey)
    hasSurvey: false,
    // mods-doc-mods-reference chapter.md:231 (isWorking)
    isWorking: false,
    // mods-doc-mods-reference chapter.md:231 (maxRows)
    maxRows: 10,
    // mods-doc-mods-reference chapter.md:231 (bodyColumns); width rule at :248
    bodyColumns: 80,
    // mods-doc-mods-reference chapter.md:231 (scroll); shape { offset, bodyRows } from mods-doc-mods-testing chapter.md:285
    scroll: { offset: 0, bodyRows: 10 },
    // mods-doc-mods-reference chapter.md:231 (view); empty object as in mods-doc-mods-testing chapter.md:286
    view: {},
  },
} as const

// The file name ends in .test.tsx: claude plugin test ran it (mods-doc-mods-testing chapter.md:23 names only .test.ts).
test('pressing the refresh Button redraws the band with the new branch', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ key: 'refresh' })).toBeDefined()
    s.git.stdout = '## dev\n'
    // press by key: mods-doc-mods-testing chapter.md:321
    await ui.press({ key: 'refresh' })
    expect(await ui.find({ type: 'Text', text: 'dev' })).toBeDefined()
    s.git.stdout = '## main\n'
    await ui.press({ key: 'refresh' })
    expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
    await ui.unmount()
  }
})
