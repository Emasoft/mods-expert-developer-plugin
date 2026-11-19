// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, tests/ui/ui.spec.ts, MIT.
// Changed for mods-expert-developer-plugin: runs on the kit's runner (claude-code/testing, its test as it) instead of vitest, named .test.ts, with its imports pointing at hooks/tokensaver/ without the .ts extension; the clawd tests test ui/draw.ts, which leaves Clawd out (owner directive 2, ruling 3, orchestrator ruling Q4): no mood class, figure or glyph face is drawn, so those assertions are now that none is, the ghost note names Tokensaver, and the blink test of the removed glyph art is a test of the speech rows that replace it (TRDD-71KVH9PA).
import { describe, expect, test as it } from 'claude-code/testing'

import { onSpawn, onSpawned } from '../../../tokensaver/runtime/session'
import type { Session } from '../../../tokensaver/runtime/session'
import { bandLineOf, bandSvgOf, bubbleRows, heroSvg, stripOf, tilesSvg, wrap } from '../../../tokensaver/ui/draw'
import type { AssistantView } from '../../../tokensaver/ui/draw'
import { bar, fit, formatTokens, spinner } from '../../../tokensaver/ui/format'
import { span } from '../../../tokensaver/ui/theme'
import { themeOf, toView } from '../../../tokensaver/ui/view'
import type { View } from '../../../tokensaver/ui/view'
import { OPUS, SEARCH_PROMPT, Stream, cleanRun, startSession } from '../helpers'

/** A session with spend, savings, history and a three-agent tree, one of them nested. */
const busySession = (options: Record<string, unknown> = {}): Session => {
  const stream = new Stream(startSession(options, { log: cleanRun(4, 'search', 'haiku') }))

  stream.runAgent({ toolUseId: 'call-1', prompt: SEARCH_PROMPT, results: [{ text: 'ok' }] })
  stream.runAgent({
    toolUseId: 'call-2',
    prompt: 'rename getUser to fetchUser in every file',
    results: [{ text: '', isError: true }, { text: 'ok' }],
  })

  for (const [toolUseId, parentAgentId] of [
    ['call-3', undefined],
    ['call-4', 'agent-live'],
  ] as const) {
    stream.apply(
      onSpawn(stream.session, {
        toolUseId,
        prompt: 'summarize the build logs and give me a recap of every warning',
        description: 'summarize logs',
        subagentType: 'general-purpose',
        explicitModel: undefined,
        parentModel: OPUS,
        parentAgentId,
        isBackground: false,
        isPinned: false,
      }),
    )
    stream.apply(
      onSpawned(stream.session, {
        toolUseId,
        agentId: toolUseId === 'call-3' ? 'agent-live' : 'agent-child',
        isDenied: false,
      }),
    )
  }

  return {
    ...stream.session,
    context: { tokens: 48_000, window: 200_000 },
    savedHistory: [0, 400, 900, 2600, 5200],
    shownSaved: 1234,
  }
}

const viewOf = (options: Record<string, unknown> = {}, hasNoColor = false): View => ({
  ...toView(busySession(options)),
  hasNoColor,
})

describe('format', () => {
  it('formats token counts', () => {
    expect([0, 950, 1000, 12_345, 2_500_000, -1500].map(formatTokens)).toEqual([
      '0',
      '950',
      '1.0k',
      '12.3k',
      '2.5M',
      '-1.5k',
    ])
  })

  it('draws a meter of a fixed width', () => {
    expect(bar(0, 8)).toBe('░░░░░░░░')
    expect(bar(0.5, 8)).toBe('████░░░░')
    expect(bar(1, 8)).toBe('████████')
    expect(bar(7, 8)).toBe('████████')
    expect(bar(-1, 8)).toBe('░░░░░░░░')
    expect(bar(Number.NaN, 4)).toBe('░░░░')
    expect(bar(0.5, 0)).toHaveLength(1)
  })

  it('turns the spinner with the frame, and holds still without motion', () => {
    const frames = [0, 1, 2, 3, 4].map(frame => spinner(frame, true))

    expect(new Set(frames).size).toBe(4)
    expect(frames[4]).toBe(frames[0])
    expect([0, 1, 2].map(frame => spinner(frame, false))).toEqual(['◆', '◆', '◆'])
  })

  it('cuts text', () => {
    expect(fit('abcdef', 4)).toBe('abc…')
    expect(fit('abc', 4)).toBe('abc')
    expect(fit('abc', 1)).toBe('a')
  })
})

describe('theme', () => {
  it('drops the tone under NO_COLOR and keeps the rest', () => {
    const colored = span({ hasColor: true, hasMotion: true }, 'x', { tone: 'error', isBold: true })
    const mono = span({ hasColor: false, hasMotion: true }, 'x', { tone: 'error', isDim: true })

    expect(colored).toEqual({ text: 'x', tone: 'error', isBold: true })
    expect(mono).toEqual({ text: 'x', isDim: true })
    expect(span({ hasColor: true, hasMotion: true }, 'x')).toEqual({ text: 'x' })
  })
})

describe('view', () => {
  it('summarises the session for drawing', () => {
    const view = viewOf()

    expect(view.mode).toBe('on')
    expect(view.total).toBe(view.spend.haiku + view.spend.sonnet + view.spend.opus + view.spend.other)
    expect(view.activeCount).toBe(2)
    expect(view.learning.count).toBe(6)
    expect(themeOf(view)).toEqual({ hasColor: true, hasMotion: true })
  })

  it('orders agents as a tree: a child follows its parent, one level deeper', () => {
    const view = viewOf()

    expect(view.agents.map(agent => [agent.key, agent.guides, agent.isLast])).toEqual([
      ['call-1', [], false],
      ['call-2', [], false],
      ['call-3', [], true],
      ['call-4', [false], true],
    ])
  })

  it('names the mode', () => {
    expect(viewOf({ enabled: false }).mode).toBe('off')
    expect(viewOf({ dryRun: true }).mode).toBe('dry-run')
  })
})


const pictured = (overrides: Partial<AssistantView> = {}): AssistantView => ({
  mood: 'idle',
  speech: 'Hi! I trim noisy output before it fills your context.',
  mode: 'on',
  hasMotion: true,
  hasColor: true,
  isQuiet: false,
  context: { tokens: 84_000, window: 200_000, percent: 42 },
  ghost: 23_000,
  stats: { eaten: 31_200, reReads: 412_000, compactFreed: 138_000, routed: 9100, keptOut: 4000, trims: 17, compactions: 1 },
  feed: [],
  activeAgents: 0,
  ...overrides,
})

describe('draw', () => {
  it('draws every mood as a self-contained, script-free picture, with no figure', () => {
    for (const mood of ['idle', 'chomp', 'happy', 'worried', 'sleepy', 'busy', 'alert', 'off'] as const) {
      const svg = heroSvg(pictured({ mood }), 560)
      const band = bandSvgOf(pictured({ mood }), 560)

      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg).not.toContain('class="c ')
      expect(band).not.toContain('class="c ')
      expect(svg).not.toMatch(/<script|onload|href=|url\((?!#)/)
    }
  })

  it('animates with CSS only while motion is on', () => {
    expect(heroSvg(pictured(), 560)).toContain('@keyframes')
    expect(heroSvg(pictured({ hasMotion: false }), 560)).not.toContain('@keyframes')
    expect(bandSvgOf(pictured({ hasMotion: false }), 560)).not.toContain('@keyframes')
  })

  it('shows the hatched ghost of what the trims kept out, and escapes text', () => {
    expect(heroSvg(pictured(), 560)).toContain('url(#hatch)')
    expect(heroSvg(pictured({ ghost: 0 }), 560)).not.toContain('Tokensaver kept out')
    expect(heroSvg(pictured({ speech: 'a <b> & "c"' }), 560)).toContain('a &lt;b&gt; &amp; &quot;c&quot;')
  })

  it('lays the tiles in four columns when wide and two when narrow', () => {
    expect(tilesSvg(pictured(), 600)).toMatch(/height="70"/)
    expect(tilesSvg(pictured(), 320)).toMatch(/height="150"/)
  })

  it('wraps speech at word boundaries and marks a cut', () => {
    expect(wrap('one two three four', 9, 3)).toEqual(['one two', 'three', 'four'])
    expect(wrap('one two three four five six', 7, 2).at(-1)).toMatch(/…$/)
  })

  it('draws a band line that fits, with no colour under NO_COLOR', () => {
    const line = bandLineOf(pictured({ hasColor: false }), 40)

    expect(line.every(part => part.tone === undefined)).toBe(true)
    expect(line.map(part => part.text).join('').length).toBeLessThanOrEqual(42)
  })

  it('draws no glyph face, quiet or not', () => {
    const quiet = bandLineOf(pictured({ isQuiet: true }), 60).map(part => part.text).join('')

    expect(quiet).toMatch(/^tokensaver /)
    expect(quiet.length).toBeLessThanOrEqual(62)

    for (const mood of ['idle', 'chomp', 'sleepy'] as const) {
      for (const isQuiet of [true, false]) {
        const text = bandLineOf(pictured({ mood, isQuiet }), 60).map(part => part.text).join('')

        // Every face had ▐ and ▌; the meter's █ and ░ are its fill, not a face, so they are not looked for.
        expect(text).not.toMatch(/[▐▛▜▌▄▀▝▘◂▪]/u)
      }
    }
  })

  it('shows the strip for passing moods only when not quiet', () => {
    const lively = { isFlaring: true, hasAgents: true, hasFlash: true }
    const calm = { isFlaring: false, hasAgents: false, hasFlash: false }

    expect(stripOf(pictured(), lively).isVisible).toBe(true)
    expect(stripOf(pictured(), calm).isVisible).toBe(false)
    expect(stripOf(pictured({ isQuiet: true }), lively).isVisible).toBe(false)
    expect(stripOf(pictured({ isQuiet: true, mood: 'sleepy' }), calm)).toEqual({ isVisible: true, shouldOffer: true })
    expect(stripOf(pictured({ isQuiet: true, mood: 'worried', context: { tokens: 150_000, window: 200_000, percent: 75 } }), calm).shouldOffer).toBe(true)
    expect(stripOf(pictured({ mode: 'off', mood: 'sleepy' }), lively).isVisible).toBe(false)
  })

  it('gives the terminal pane up to three rows of speech, with no pointer', () => {
    const rows = bubbleRows(pictured({ speech: 'one two three four five six seven eight nine ten eleven twelve' }), 16)

    expect(rows.length).toBeLessThanOrEqual(3)
    expect(rows.every(row => row.length <= 14)).toBe(true)
    expect(rows.join(' ')).not.toContain('◀')
    expect(bubbleRows(pictured({ speech: 'short' }), 40)).toEqual(['short'])
  })
})
