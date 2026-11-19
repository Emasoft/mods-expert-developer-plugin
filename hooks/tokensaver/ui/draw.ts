// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, src/ui/clawd.ts, MIT.
// Changed for mods-expert-developer-plugin: Claude's mascot Clawd is left out (owner directive 2, ruling 3): its body (clawdBody and rect), its mood animations and stylesheet rules, the figure group in the hero and in the strip (the bubble and the strip text move into its place; the bubble's tail goes), the terminal glyph art (clawdArt, ART, BLINK), the glyph face and crumb trail of the terminal strip, and the speech rows' pointer and padding to the art's three rows; AssistantView is AssistantView, without the frame the art blinked on; the hero's ghost note says Tokensaver (orchestrator ruling Q4); imports carry no .ts extension (TRDD-71KVH9PA).
/**
 * Tokensaver's pictures of the token data: the pane's speech bubble and context
 * meter, the savings tiles and the strip above the prompt, as SVG for surfaces that
 * draw it (the desktop app), and as a line or a few rows for the terminal. Every
 * picture is a pure function of an AssistantView, so the same state always draws
 * the same markup and a redraw with nothing new does not restart it.
 */
import type { FeedItem, FeedKind, Mood } from '../runtime/assistant'
import { bar, fit, formatTokens } from './format'
import type { Line, Tone } from './theme'

export type AssistantView = {
  mood: Mood
  speech: string
  mode: 'on' | 'off' | 'dry-run'
  hasMotion: boolean
  hasColor: boolean
  /** No glyph art and no passing moods: plain words, shown only when the person can act. */
  isQuiet: boolean
  context: { tokens: number; window: number; percent: number }
  /** Tokens Tokensaver cut that would otherwise sit in the context right now. */
  ghost: number
  stats: {
    eaten: number
    reReads: number
    compactFreed: number
    routed: number
    keptOut: number
    trims: number
    compactions: number
  }
  feed: readonly FeedItem[]
  activeAgents: number
}

const ORANGE = '#D97757'

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Splits text into lines of at most `width` characters, breaking at spaces. */
export const wrap = (text: string, width: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(word => word !== '')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line === '' ? word : `${line} ${word}`

    if (candidate.length <= width) {
      line = candidate
      continue
    }

    if (line !== '') {
      lines.push(line)
    }

    line = word.length > width ? fit(word, width) : word
  }

  if (line !== '') {
    lines.push(line)
  }

  if (lines.length <= maxLines) {
    return lines
  }

  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = fit(`${kept[maxLines - 1] ?? ''} …`, width)

  return kept
}

// --- The vector ------------------------------------------------------------

/**
 * The stylesheet every picture shares: text, track and tile colours for light
 * and dark, and, with motion on, the one-shot pop that brings new text in.
 */
const STYLE = (hasMotion: boolean): string => `<style>
svg{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.t{fill:#3b3530}
.d{fill:#8a817a}
.bubble{fill:#ffffff;stroke:#e6ddd6}
.track{fill:#efe8e2}
.tile{fill:#faf6f3;stroke:#eee5de}
@media (prefers-color-scheme:dark){
.t{fill:#ece6e1}.d{fill:#a59d96}.bubble{fill:#2b2724;stroke:#3d3733}.track{fill:#3a3430}.tile{fill:#262220;stroke:#352f2b}
}
${
  hasMotion
    ? `
@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.pop{animation:pop .45s ease-out both}
`
    : ''
}</style>`

const KIND_COLORS: Readonly<Record<FeedKind, string>> = {
  trim: '#3FA55B',
  paste: '#3FA55B',
  compact: '#7B83EB',
  cold: '#6FB7E9',
  warn: '#D99A00',
  route: '#3FA55B',
  escalate: '#E5484D',
  info: '#8B8B8B',
}

const fillColor = (percent: number): string => {
  if (percent >= 85) {
    return '#E5484D'
  }

  return percent >= 70 ? '#D99A00' : ORANGE
}

/**
 * The pane's hero: a speech bubble and the context meter, which also
 * shows as a hatched ghost what the context would hold without the trims.
 */
export const heroSvg = (view: AssistantView, width: number): string => {
  const w = Math.max(300, Math.round(width))
  const bubbleX = 18
  const bubbleW = w - bubbleX - 10
  const lines = wrap(view.speech, Math.max(16, Math.floor((bubbleW - 28) / 7.1)), 4)
  const bubbleH = Math.max(46, lines.length * 18 + 22)
  const bubbleY = Math.max(10, 58 - bubbleH / 2)
  const meterY = 132
  const meterW = w - 36
  const { percent, tokens, window } = view.context
  const fillW = window <= 0 ? 0 : Math.min(meterW, (tokens / window) * meterW)
  const ghostW = window <= 0 ? 0 : Math.min(meterW - fillW, (view.ghost / window) * meterW)
  const height = meterY + 44
  const label =
    window <= 0
      ? 'Context: waiting for the first reply'
      : `Context ${String(percent)}%  ·  ${formatTokens(tokens)} of ${formatTokens(window)}`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(w)}" height="${String(height)}" viewBox="0 0 ${String(w)} ${String(height)}">`,
    STYLE(view.hasMotion),
    '<defs>',
    `<linearGradient id="fill" x1="0" x2="1"><stop offset="0" stop-color="${ORANGE}"/><stop offset="1" stop-color="${fillColor(percent)}"/></linearGradient>`,
    '<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="#3FA55B" opacity=".55"/></pattern>',
    '</defs>',
    `<g class="pop">`,
    `<rect class="bubble" x="${String(bubbleX)}" y="${String(bubbleY)}" width="${String(bubbleW)}" height="${String(bubbleH)}" rx="14" stroke-width="1.5"/>`,
    ...lines.map(
      (line, index) =>
        `<text class="t" x="${String(bubbleX + 14)}" y="${String(bubbleY + 25 + index * 18)}" font-size="13">${escape(line)}</text>`,
    ),
    '</g>',
    `<text class="t" x="18" y="${String(meterY - 8)}" font-size="12" font-weight="600">${escape(label)}</text>`,
    view.ghost > 0
      ? `<text class="d" x="${String(w - 18)}" y="${String(meterY - 8)}" font-size="11" text-anchor="end">hatched: ${formatTokens(view.ghost)} Tokensaver kept out</text>`
      : '',
    `<rect class="track" x="18" y="${String(meterY)}" width="${String(meterW)}" height="12" rx="6"/>`,
    `<rect x="18" y="${String(meterY)}" width="${Math.max(fillW, window > 0 ? 6 : 0).toFixed(1)}" height="12" rx="6" fill="url(#fill)"/>`,
    ghostW > 1
      ? `<rect x="${(18 + fillW).toFixed(1)}" y="${String(meterY)}" width="${ghostW.toFixed(1)}" height="12" rx="3" fill="url(#hatch)"/>`
      : '',
    ...[50, 70, 85].map(mark => {
      const x = 18 + (meterW * mark) / 100

      return `<rect x="${x.toFixed(1)}" y="${String(meterY - 2)}" width="1" height="16" fill="#8b8b8b" opacity=".35"/>`
    }),
    `<text class="d" x="18" y="${String(meterY + 28)}" font-size="11">${escape(
      view.context.percent >= 70
        ? 'Past 70%: every request is heavy. Compact to lighten it.'
        : 'Marks at 50 · 70 · 85%. Tokensaver speaks up as you cross them.',
    )}</text>`,
    '</svg>',
  ].join('')
}

type Tile = { value: string; label: string; color: string; hint: string }

/** The savings, as tiles: what was eaten, what re-sending that avoided, what compaction freed, what routing saved. */
export const tilesSvg = (view: AssistantView, width: number): string => {
  const w = Math.max(300, Math.round(width))
  const tiles: Tile[] = [
    {
      value: formatTokens(view.stats.eaten),
      label: 'noise eaten',
      color: '#3FA55B',
      hint: `${String(view.stats.trims)} outputs trimmed`,
    },
    {
      value: formatTokens(view.stats.reReads),
      label: 're-sends avoided',
      color: '#7B83EB',
      hint: 'trimmed tokens × later requests',
    },
    {
      value: formatTokens(view.stats.compactFreed),
      label: 'freed by compacting',
      color: ORANGE,
      hint: `${String(view.stats.compactions)} compaction${view.stats.compactions === 1 ? '' : 's'}`,
    },
    {
      value: formatTokens(view.stats.routed + view.stats.keptOut),
      label: 'routing & delegation',
      color: '#D99A00',
      hint: 'cheaper models for helpers',
    },
  ]
  const columns = w >= 560 ? 4 : 2
  const gap = 10
  const tileW = (w - gap * (columns - 1)) / columns
  const tileH = 70
  const rows = Math.ceil(tiles.length / columns)
  const height = rows * tileH + (rows - 1) * gap

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(w)}" height="${String(height)}" viewBox="0 0 ${String(w)} ${String(height)}">`,
    STYLE(view.hasMotion),
    ...tiles.map((tile, index) => {
      const x = (index % columns) * (tileW + gap)
      const y = Math.floor(index / columns) * (tileH + gap)

      return [
        `<g class="pop" style="animation-delay:${String(index * 0.06)}s"><title>${escape(tile.hint)}</title>`,
        `<rect class="tile" x="${x.toFixed(1)}" y="${String(y)}" width="${tileW.toFixed(1)}" height="${String(tileH)}" rx="12"/>`,
        `<rect x="${(x + 12).toFixed(1)}" y="${String(y + 14)}" width="4" height="${String(tileH - 28)}" rx="2" fill="${tile.color}"/>`,
        `<text class="t" x="${(x + 26).toFixed(1)}" y="${String(y + 36)}" font-size="22" font-weight="700">${escape(tile.value)}</text>`,
        `<text class="d" x="${(x + 26).toFixed(1)}" y="${String(y + 55)}" font-size="11.5">${escape(tile.label)}</text>`,
        '</g>',
      ].join('')
    }),
    '</svg>',
  ].join('')
}

/** The strip above the prompt: what Tokensaver just did, and the context fill. */
export const bandSvgOf = (view: AssistantView, width: number): string => {
  const w = Math.max(240, Math.round(width))
  const h = 46
  const textX = 12
  const pillW = 86
  const text = fit(view.speech, Math.max(10, Math.floor((w - textX - pillW - 24) / 6.9)))
  const { percent } = view.context

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(w)}" height="${String(h)}" viewBox="0 0 ${String(w)} ${String(h)}">`,
    STYLE(view.hasMotion),
    `<text class="t pop" x="${String(textX)}" y="${String(h / 2 + 4.5)}" font-size="13">${escape(text)}</text>`,
    view.context.window > 0
      ? [
          `<rect class="track" x="${String(w - pillW - 8)}" y="${String(h / 2 - 9)}" width="${String(pillW)}" height="18" rx="9"/>`,
          `<rect x="${String(w - pillW - 8)}" y="${String(h / 2 - 9)}" width="${Math.max(18, (pillW * percent) / 100).toFixed(1)}" height="18" rx="9" fill="${fillColor(percent)}" opacity=".85"/>`,
          `<text class="t" x="${String(w - 8 - pillW / 2)}" y="${String(h / 2 + 4)}" font-size="11" font-weight="700" text-anchor="middle">ctx ${String(percent)}%</text>`,
        ].join('')
      : '',
    '</svg>',
  ].join('')
}

export const feedColor = (kind: FeedKind): string => KIND_COLORS[kind]

// --- The terminal ----------------------------------------------------------

const toneOf = (view: AssistantView, tone: Tone): { tone?: Tone } => (view.hasColor ? { tone } : {})

const moodTone = (mood: Mood): Tone => {
  switch (mood) {
    case 'worried':
      return 'warning'
    case 'alert':
      return 'error'
    case 'off':
    case 'sleepy':
      return 'inactive'
    case 'happy':
    case 'chomp':
      return 'success'
    case 'idle':
    case 'busy':
      return 'claude'
  }
}

/**
 * Whether the strip above the prompt shows, and whether it offers to compact.
 * Quiet, it shows only for the offer: no passing mood, helper band or flash.
 */
export const stripOf = (
  view: AssistantView,
  input: { isFlaring: boolean; hasAgents: boolean; hasFlash: boolean },
): { isVisible: boolean; shouldOffer: boolean } => {
  const shouldOffer = view.mood === 'sleepy' || (view.mood === 'worried' && view.context.percent >= 70)
  const isLively = !view.isQuiet && (input.isFlaring || input.hasAgents || input.hasFlash)

  return { isVisible: view.mode !== 'off' && (shouldOffer || isLively), shouldOffer }
}

/** The strip above the prompt, in the terminal: one line. */
export const bandLineOf = (view: AssistantView, columns: number): Line => {
  if (view.isQuiet) {
    const label = 'tokensaver '
    const meter = view.context.window > 0 ? ` (${String(view.context.percent)}%)` : ''

    return [
      { text: label, isDim: true },
      { text: fit(view.speech, Math.max(10, columns - label.length - meter.length - 1)), ...toneOf(view, moodTone(view.mood)) },
      { text: meter, isDim: true },
    ]
  }

  const meter =
    view.context.window > 0 ? ` ${bar(view.context.percent / 100, 8)} ${String(view.context.percent)}%` : ''
  const room = Math.max(10, columns - meter.length - 1)

  return [
    { text: fit(view.speech, room), ...toneOf(view, moodTone(view.mood)) },
    { text: meter, isDim: true },
  ]
}

/** The speech in a terminal pane: up to three rows, wrapped to its width. */
export const bubbleRows = (view: AssistantView, columns: number): readonly string[] =>
  wrap(view.speech, Math.max(10, columns - 2), 3)
