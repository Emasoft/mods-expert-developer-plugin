// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, tests/integration/agent-types.spec.ts, MIT.
// Changed for mods-expert-developer-plugin: runs on the kit's runner (claude-code/testing, its test as it) instead of vitest, named .test.ts so claude plugin test runs it, with its imports pointing at hooks/tokensaver/ and hooks/tests/tokensaver/ without the .ts extension (TRDD-71KVH9PA).
/**
 * An agent type can name its own model, and a spawn does not say whether it
 * does. tokensaver therefore watches the first spawn of each type untouched,
 * and reroutes only a type it has seen inherit its parent's model.
 */
import { describe, expect, test as it } from 'claude-code/testing'

import { onSpawn, onSpawned } from '../../../tokensaver/runtime/session'
import type { Session, SpawnInput } from '../../../tokensaver/runtime/session'
import { HAIKU, OPUS, RISKY_PROMPT, SEARCH_PROMPT, SONNET, Stream, freshSession } from '../helpers'

const spawnInput = (extra: Partial<SpawnInput> = {}): SpawnInput => ({
  toolUseId: 'call-1',
  prompt: SEARCH_PROMPT,
  description: '',
  subagentType: 'general-purpose',
  explicitModel: undefined,
  parentModel: OPUS,
  parentAgentId: undefined,
  isBackground: false,
  isPinned: false,
  ...extra,
})

/** Spawns once and lets Claude Code resolve the model as `resolved`; answers what tokensaver asked for. */
const spawn = (stream: Stream, input: SpawnInput, resolved: (asked: string | undefined) => string): string | undefined => {
  const asked = stream.apply(onSpawn(stream.session, input)).model

  stream.apply(
    onSpawned(stream.session, {
      toolUseId: input.toolUseId,
      agentId: `agent-${input.toolUseId}`,
      isDenied: false,
      resolvedModel: resolved(asked),
    }),
  )

  return asked
}

const inheriting = (parentModel: string) => (asked: string | undefined) => asked ?? parentModel

describe('learning how an agent type picks its model', () => {
  it('leaves the first spawn of a type untouched, then routes the type once it has seen it inherit', () => {
    const stream = new Stream(freshSession())

    expect(spawn(stream, spawnInput({ toolUseId: 'call-1' }), inheriting(OPUS))).toBeUndefined()
    expect(stream.session.agentTypes).toEqual({ 'general-purpose': 'inherits' })
    expect(stream.toasts()).toEqual([])
    expect(stream.session.notes.at(-1)).toContain('inherit their model')

    expect(spawn(stream, spawnInput({ toolUseId: 'call-2' }), inheriting(OPUS))).toBe('haiku')
    expect(stream.toasts()).toEqual([expect.stringContaining('→ haiku')])
  })

  it('never reroutes a type that brings its own model, however mechanical the task', () => {
    const stream = new Stream(freshSession())
    const ownModel = (): string => SONNET

    for (const toolUseId of ['call-1', 'call-2', 'call-3']) {
      expect(spawn(stream, spawnInput({ toolUseId, subagentType: 'architect' }), ownModel)).toBeUndefined()
    }

    expect(stream.session.agentTypes).toEqual({ architect: 'own-model' })
    expect(stream.session.notes.at(-1)).toContain('choose their own model')
    expect(stream.toasts()).toEqual([])
    expect(stream.session.outcomes).toEqual([])
  })

  it('shows the model the type resolved to in the tree', () => {
    const stream = new Stream(freshSession())

    spawn(stream, spawnInput({ subagentType: 'Explore' }), () => HAIKU)

    expect(stream.session.agents[0]).toMatchObject({ tier: 'haiku', isRouted: false, isProbe: true })
  })

  it('learns each type separately', () => {
    const stream = new Stream(freshSession())

    spawn(stream, spawnInput({ toolUseId: 'a', subagentType: 'Explore' }), () => HAIKU)
    spawn(stream, spawnInput({ toolUseId: 'b' }), inheriting(OPUS))

    expect(stream.session.agentTypes).toEqual({ Explore: 'own-model', 'general-purpose': 'inherits' })
    expect(spawn(stream, spawnInput({ toolUseId: 'c', subagentType: 'Explore' }), () => HAIKU)).toBeUndefined()
    expect(spawn(stream, spawnInput({ toolUseId: 'd' }), inheriting(OPUS))).toBe('haiku')
  })

  it('treats a type that resolves to the parent tier under another id as inheriting', () => {
    const stream = new Stream(freshSession())

    spawn(stream, spawnInput(), () => 'us.anthropic.claude-opus-5-5-v1:0')

    expect(stream.session.agentTypes).toEqual({ 'general-purpose': 'inherits' })
  })

  it('learns nothing from a spawn that names a model, a pinned spawn, or a refused one', () => {
    const cases: readonly Partial<SpawnInput>[] = [
      { explicitModel: 'sonnet' },
      { isPinned: true, subagentType: 'fork' },
    ]

    for (const extra of cases) {
      const stream = new Stream(freshSession())

      spawn(stream, spawnInput(extra), asked => asked ?? extra.explicitModel ?? OPUS)

      expect(stream.session.agentTypes).toEqual({})
    }

    const refused = new Stream(freshSession())

    refused.apply(onSpawn(refused.session, spawnInput()))
    refused.apply(onSpawned(refused.session, { toolUseId: 'call-1', agentId: undefined, isDenied: true }))

    expect(refused.session.agentTypes).toEqual({})
  })

  it('learns nothing when Claude Code does not say which model it resolved', () => {
    const stream = new Stream(freshSession())

    stream.apply(onSpawn(stream.session, spawnInput()))
    stream.apply(onSpawned(stream.session, { toolUseId: 'call-1', agentId: 'agent-1', isDenied: false }))

    expect(stream.session.agentTypes).toEqual({})
    expect(stream.session.agents[0]?.agentId).toBe('agent-1')
  })

  it('still raises a risky task from a named cheaper model on a type it has never seen', () => {
    const stream = new Stream(freshSession())
    const asked = stream.apply(
      onSpawn(stream.session, spawnInput({ prompt: RISKY_PROMPT, explicitModel: 'haiku', subagentType: 'mystery' })),
    ).model

    expect(asked).toBe(OPUS)
  })

  it('observes in a dry run too, and changes nothing', () => {
    const stream = new Stream(freshSession({ dryRun: true }))

    expect(spawn(stream, spawnInput({ toolUseId: 'call-1' }), inheriting(OPUS))).toBeUndefined()
    expect(spawn(stream, spawnInput({ toolUseId: 'call-2' }), inheriting(OPUS))).toBeUndefined()
    expect(stream.session.agentTypes).toEqual({ 'general-purpose': 'inherits' })
    expect(stream.toasts()).toEqual([expect.stringContaining('dry-run: would run')])
  })
})

describe('an agent type’s own model is never overridden', () => {
  const PROMPTS = [SEARCH_PROMPT, RISKY_PROMPT, 'design the caching architecture and weigh the trade-offs', 'hello']
  const PARENTS = [HAIKU, SONNET, OPUS]

  const withTypes = (agentTypes: Session['agentTypes']): Session => ({ ...freshSession(), agentTypes })

  it('holds for every task and parent, for a type known to bring its own model and for an unseen one', () => {
    for (const session of [withTypes({ architect: 'own-model' }), withTypes({})]) {
      for (const prompt of PROMPTS) {
        for (const parentModel of PARENTS) {
          const step = onSpawn(session, spawnInput({ prompt, parentModel, subagentType: 'architect' }))

          expect(step.reply.model, `${prompt} | ${parentModel}`).toBeUndefined()
          expect(step.effects).toEqual([])
        }
      }
    }
  })
})
