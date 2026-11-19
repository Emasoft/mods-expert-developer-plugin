// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, src/runtime/commands.ts, MIT.
// Changed for mods-expert-developer-plugin: imports carry no .ts extension, as this plugin's tsconfig has no allowImportingTsExtensions; the help text names /mods-tokensaver, this plugin's command, and its quiet line no longer names glyph art, which is left out with Claude's mascot (owner directive 2, ruling 3) (TRDD-71KVH9PA).
export type Command =
  | { kind: 'status' }
  | { kind: 'help' }
  | { kind: 'doctor' }
  | { kind: 'dashboard' }
  | { kind: 'reset' }
  | { kind: 'enable'; value: boolean }
  /** `value` undefined toggles. */
  | { kind: 'dry-run'; value: boolean | undefined }
  | { kind: 'motion'; value: boolean | undefined }
  /** `value` undefined toggles. */
  | { kind: 'quiet'; value: 'on' | 'off' | 'auto' | undefined }
  | { kind: 'export'; path: string | undefined }
  | { kind: 'unknown'; word: string }

export const DEFAULT_EXPORT_PATH = 'tokensaver-export.json'

export const HELP_TEXT = [
  '/mods-tokensaver              show status',
  '/mods-tokensaver on|off       master switch',
  '/mods-tokensaver dry-run [on|off]   only show what would be delegated',
  '/mods-tokensaver dashboard    open the dashboard pane',
  '/mods-tokensaver motion [on|off]    animations',
  '/mods-tokensaver quiet [on|off|auto]   no pop-ups (auto: on in VS Code and Cursor)',
  '/mods-tokensaver export [path]      write the local outcome log as JSON',
  '/mods-tokensaver reset        clear the outcome log and learned thresholds',
  '/mods-tokensaver doctor       what tokensaver knows and what the display reported',
].join('\n')

const switchOf = (word: string | undefined): boolean | undefined => {
  if (word === 'on') {
    return true
  }

  return word === 'off' ? false : undefined
}

/** Parses what follows `/tokensaver`. Nothing typed means `status`. */
export const parseCommand = (args: string): Command => {
  const [first = '', ...rest] = args.trim().split(/\s+/)
  const word = first.toLowerCase()
  const argument = rest.join(' ')

  switch (word) {
    case '':
    case 'status':
      return { kind: 'status' }
    case 'help':
      return { kind: 'help' }
    case 'doctor':
      return { kind: 'doctor' }
    case 'on':
      return { kind: 'enable', value: true }
    case 'off':
      return { kind: 'enable', value: false }
    case 'dashboard':
    case 'pane':
      return { kind: 'dashboard' }
    case 'reset':
      return { kind: 'reset' }
    case 'dry-run':
    case 'dryrun':
      return { kind: 'dry-run', value: switchOf(rest[0]?.toLowerCase()) }
    case 'motion':
      return { kind: 'motion', value: switchOf(rest[0]?.toLowerCase()) }
    case 'quiet':
    case 'subtle': {
      const value = rest[0]?.toLowerCase()

      return { kind: 'quiet', value: value === 'on' || value === 'off' || value === 'auto' ? value : undefined }
    }
    case 'export':
      return { kind: 'export', path: argument === '' ? undefined : argument }
    default:
      return { kind: 'unknown', word: first }
  }
}
