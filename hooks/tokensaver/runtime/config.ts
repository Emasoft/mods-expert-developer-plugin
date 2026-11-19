// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, src/runtime/config.ts, MIT.
// Changed for mods-expert-developer-plugin: imports carry no .ts extension, as this plugin's tsconfig has no allowImportingTsExtensions; hasRouting and hasEscalation join Config, off by default and read from the plugin's routing and escalation options, so the two switches that govern the router reach the functions that read them (TRDD-71KVH9PA, G13.1).
import { isRecord } from '../core/log'

/**
 * How loud Clawd is. `auto` is quiet inside VS Code and Cursor, whose panel
 * draws no glyph art and turns every toast into a notification.
 */
export type QuietSetting = 'auto' | 'on' | 'off'

/** What the user can switch: the manifest's `userConfig` values, then `/tokensaver` overrides. */
export type Config = {
  isEnabled: boolean
  isDryRun: boolean
  hasReducedMotion: boolean
  hasContextHint: boolean
  hasStatusLine: boolean
  /** The router may pick a sub-agent's model (the tokensaver.routing switch, off by default). */
  hasRouting: boolean
  /** A failed sub-agent may be retried one tier up (the tokensaver.escalation switch, off by default). */
  hasEscalation: boolean
  quiet: QuietSetting
}

export const DEFAULT_CONFIG: Config = {
  isEnabled: true,
  isDryRun: false,
  hasReducedMotion: false,
  hasContextHint: true,
  hasStatusLine: true,
  hasRouting: false,
  hasEscalation: false,
  quiet: 'auto',
}

/** The switches `/tokensaver` changes at run time, kept across sessions. */
export type Overrides = {
  isEnabled?: boolean
  isDryRun?: boolean
  hasReducedMotion?: boolean
  quiet?: QuietSetting
}

const flag = (value: unknown, isOnByDefault: boolean): boolean =>
  typeof value === 'boolean' ? value : isOnByDefault

const isQuietSetting = (value: unknown): value is QuietSetting => value === 'auto' || value === 'on' || value === 'off'

/** Reads the plugin's options as Claude Code hands them to `register`. */
export const parseOptions = (options: Readonly<Record<string, unknown>>): Config => {
  const quiet = options['quiet']

  return {
    isEnabled: flag(options['enabled'], DEFAULT_CONFIG.isEnabled),
    isDryRun: flag(options['dryRun'], DEFAULT_CONFIG.isDryRun),
    hasReducedMotion: flag(options['reducedMotion'], DEFAULT_CONFIG.hasReducedMotion),
    hasContextHint: flag(options['contextHint'], DEFAULT_CONFIG.hasContextHint),
    hasStatusLine: flag(options['statusLine'], DEFAULT_CONFIG.hasStatusLine),
    // The switches that govern the router reach it through these two (TRDD-71KVH9PA, G13.1).
    hasRouting: flag(options['routing'], DEFAULT_CONFIG.hasRouting),
    hasEscalation: flag(options['escalation'], DEFAULT_CONFIG.hasEscalation),
    quiet: isQuietSetting(quiet) ? quiet : DEFAULT_CONFIG.quiet,
  }
}

/** Reads stored overrides, ignoring anything that is not a known switch. */
export const parseOverrides = (value: unknown): Overrides => {
  if (!isRecord(value)) {
    return {}
  }

  const { isEnabled, isDryRun, hasReducedMotion, quiet } = value

  return {
    ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
    ...(typeof isDryRun === 'boolean' ? { isDryRun } : {}),
    ...(typeof hasReducedMotion === 'boolean' ? { hasReducedMotion } : {}),
    ...(isQuietSetting(quiet) ? { quiet } : {}),
  }
}

export const applyOverrides = (config: Config, overrides: Overrides): Config => ({
  ...config,
  ...overrides,
})

/** NO_COLOR is honoured when it is set to anything but the empty string (no-color.org). */
export const isNoColor = (value: string | undefined): boolean => value !== undefined && value !== ''

/**
 * True when Claude Code runs inside VS Code or one of its forks (Cursor,
 * Windsurf): their integrated terminal sets `TERM_PROGRAM=vscode`, and the
 * Claude Code extension names itself in `CLAUDE_CODE_ENTRYPOINT`.
 */
export const isEditorHost = (env: { termProgram: string | undefined; entrypoint: string | undefined }): boolean =>
  env.termProgram?.toLowerCase() === 'vscode' || /vscode|cursor/i.test(env.entrypoint ?? '')

/** Whether Clawd keeps quiet: asked for, or `auto` inside an editor. */
export const isQuietOf = (config: Config, isInEditor: boolean): boolean =>
  config.quiet === 'on' || (config.quiet === 'auto' && isInEditor)
