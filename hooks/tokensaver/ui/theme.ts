// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, src/ui/theme.ts, MIT.
// Changed for mods-expert-developer-plugin: imports carry no .ts extension, as this plugin's tsconfig has no allowImportingTsExtensions; nothing else (TRDD-71KVH9PA).
/** Colours are named by meaning, as Claude Code's theme keys are, so they follow the user's theme. */
export type Tone = 'success' | 'warning' | 'error' | 'claude' | 'suggestion' | 'inactive'

/** One run of text with one style. The renderers build these; a surface paints them. */
export type Span = {
  text: string
  tone?: Tone
  isBold?: boolean
  isDim?: boolean
}

export type Line = readonly Span[]

export type Theme = {
  /** False under NO_COLOR: no span carries a tone, and meaning rests on glyphs and words. */
  hasColor: boolean
  /** False under reduced motion: one static frame, and counters show their final value. */
  hasMotion: boolean
}

export type SpanStyle = {
  tone?: Tone
  isBold?: boolean
  isDim?: boolean
}

/** Builds a span for the theme: under NO_COLOR the tone is left out entirely. */
export const span = (theme: Theme, text: string, style: SpanStyle = {}): Span => ({
  text,
  ...(theme.hasColor && style.tone !== undefined ? { tone: style.tone } : {}),
  ...(style.isBold === true ? { isBold: true } : {}),
  ...(style.isDim === true ? { isDim: true } : {}),
})

export const plain = (line: Line): string => line.map(part => part.text).join('')
