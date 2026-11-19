// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, tests/helpers.ts, MIT.
// Changed for mods-expert-developer-plugin: imports point at hooks/tokensaver/ without the .ts extension (TRDD-71KVH9PA).
// freshSession turns the router's two switches on: routing and escalation default OFF in the plugin (ruling Q3), and every
// world in this folder was written about what the router does. A test of the off state passes routing: false or
// escalation: false, which wins over this default, and asserts that no model is picked and no retry happens.
import type { Outcome } from '../../tokensaver/core/log'
import type { TaskType } from '../../tokensaver/core/score'
import type { Tier } from '../../tokensaver/core/tiers'
import {
  hydrate,
  onAgentResult,
  onSpawn,
  onSpawned,
  onStepUsage,
  onTurnComplete,
} from '../../tokensaver/runtime/session'
import type { Effect, Session, Step } from '../../tokensaver/runtime/session'

export const OPUS = 'claude-opus-5-5'
export const SONNET = 'claude-sonnet-5-5'
export const HAIKU = 'claude-haiku-5-5'
export const FABLE = 'claude-fable-5-1'

/** A mechanical, non-risky task that routes to Haiku by default. */
export const SEARCH_PROMPT = 'find all usages of parseConfig across the repo and list every file'

/** A task the heuristics must treat as risky. */
export const RISKY_PROMPT = 'find every place the production database password is read and delete the old one'

export type Options = Readonly<Record<string, unknown>>

export type Stored = { log?: unknown; thresholds?: unknown; settings?: unknown; delegation?: unknown }

/** A session before it has seen any sub-agent start. */
export const freshSession = (
  options: Options = {},
  stored: Stored = {},
): Session =>
  hydrate({
    options: { routing: true, escalation: true, ...options },
    storedLog: stored.log,
    storedThresholds: stored.thresholds,
    storedSettings: stored.settings,
    storedDelegation: stored.delegation,
    noColor: undefined,
  }).session

/** A session that has already watched a general-purpose agent inherit its parent's model. */
export const startSession = (
  options: Options = {},
  stored: Stored = {},
): Session => ({
  ...freshSession(options, stored),
  agentTypes: { 'general-purpose': 'inherits' },
  facts: { repoFiles: 400, model: OPUS },
})

export const outcome = (partial: Partial<Outcome> & { seq: number }): Outcome => ({
  at: 1,
  taskType: 'search',
  tier: 'haiku',
  tokens: 1000,
  retries: 0,
  wasEscalated: false,
  isSuccess: true,
  signal: 'ok',
  ...partial,
})

export const cleanRun = (count: number, taskType: TaskType, tier: Tier, fromSeq = 1): Outcome[] =>
  Array.from({ length: count }, (_, index) => outcome({ seq: fromSeq + index, taskType, tier }))

/**
 * A mocked event stream: plays events through the controller in the order
 * Claude Code raises them, keeping every effect, as hooks/register.tsx does.
 */
export class Stream {
  session: Session
  readonly effects: Effect[] = []
  private nextAgent = 0

  constructor(session: Session) {
    this.session = session
  }

  apply<Reply>(step: Step<Reply>): Reply {
    this.session = step.session
    this.effects.push(...step.effects)

    return step.reply
  }

  toasts(): string[] {
    return this.effects.flatMap(effect => (effect.kind === 'toast' ? [effect.text] : []))
  }

  kinds(): string[] {
    return this.effects.map(effect => effect.kind)
  }

  /**
   * One foreground Agent call, start to finish: the spawn, the sub-agent's
   * work, its result, and the retry the controller asks for, if any. `results`
   * are the answers of the first attempt and of the retry.
   */
  runAgent(input: {
    toolUseId: string
    prompt: string
    parentModel?: string
    explicitModel?: string
    results: readonly { text: string; isError?: boolean; isDenied?: boolean }[]
    tokens?: number
    hasSteps?: boolean
  }): { models: (string | undefined)[]; attempts: number } {
    const models: (string | undefined)[] = []
    let explicitModel = input.explicitModel
    let attempts = 0

    for (const result of input.results) {
      attempts += 1
      this.nextAgent += 1

      const agentId = `agent-${String(this.nextAgent)}`
      const turnId = `turn-${agentId}`
      const spawn = this.apply(
        onSpawn(this.session, {
          toolUseId: input.toolUseId,
          prompt: input.prompt,
          description: '',
          subagentType: 'general-purpose',
          explicitModel,
          parentModel: input.parentModel ?? OPUS,
          parentAgentId: undefined,
          isBackground: false,
          isPinned: false,
        }),
      )
      const model = spawn.model ?? explicitModel ?? input.parentModel ?? OPUS

      models.push(spawn.model)
      this.apply(
        onSpawned(this.session, {
          toolUseId: input.toolUseId,
          agentId,
          isDenied: false,
          resolvedModel: model,
        }),
      )

      const usage = { model, input: input.tokens ?? 4000, output: 200, cacheWrite: 0 }

      if (input.hasSteps !== false) {
        this.apply(onStepUsage(this.session, { turnId, agentId, usage }))
      }

      this.apply(
        onTurnComplete(this.session, {
          turnId,
          agentId,
          usage,
          isFailed: result.isError === true,
          isAborted: false,
          answer: result.text,
          now: 10,
        }),
      )

      const reply = this.apply(
        onAgentResult(this.session, {
          toolUseId: input.toolUseId,
          isDenied: result.isDenied === true,
          isError: result.isError === true,
          text: result.text,
          totalTokens: undefined,
          now: 10,
        }),
      )

      if (reply.retryWith === undefined) {
        break
      }

      explicitModel = reply.retryWith
    }

    return { models, attempts }
  }
}
