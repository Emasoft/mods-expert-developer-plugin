// The types of hooks/deck/register.js, the Deck port (TRDD-RD1ISPMN). The port stays plain JavaScript, as upstream wrote
// it, and this plugin's type check has no allowJs, so the TypeScript files that import it read these declarations.
import type { AgentSpawnInput, EngineInterface, SessionMeasureInput, On, PromptSubmitInput, SessionStartInput, TurnCompleteInput, TurnStepInput } from 'claude-code'

/** Deck's start in one session: loads it, marks the session started and wakes the module's one clock; a start running here is joined, and one made here is not repeated unless reload (a session start) asks for it. */
export declare function startDeckIn($: EngineInterface, session: string, e: Pick<SessionStartInput, 'cwd'>, reload?: boolean): Promise<void>

/** Starts Deck in this session after an on written here; false when the start failed, which sets Deck's notice. */
export declare function startDeckHere($: EngineInterface): Promise<boolean>

/** Master off: stops the clock, the fold and the demo and forgets every session's start; true when a notice was dropped. */
export declare function stopDeck(): boolean

/** Deck's observer of a sent message, called by the prompt.submit dispatcher in hooks/index.ts; it never passes the prompt on. */
export declare function observeDeckPrompt($: EngineInterface, e: PromptSubmitInput): Promise<void>

/** What the dispatcher calls when observeDeckPrompt throws: the debug log and Deck's error count. */
export declare function deckPromptFailed($: EngineInterface, error: unknown): void

/** What the dispatcher calls when any other Deck observer throws: Deck's error count and one masked debug line naming the event. */
export declare function deckObserverFailed($: EngineInterface, event: string, error: unknown): void

/** Deck's Observer of a turn step, called by the turn.step dispatcher in hooks/index.ts before the event passes on. */
export declare function observeDeckTurnStep($: EngineInterface, e: TurnStepInput): Promise<void>

/** Deck's observer of a session measurement, called by the session.measure dispatcher; the cost line is the one it records. */
export declare function observeDeckMeasure($: EngineInterface, e: SessionMeasureInput): Promise<void>

/** Deck's observer of an agent spawn, run by the agent.spawn dispatcher once it returns; started is what next(e) returned. */
export declare function observeDeckSpawned($: EngineInterface, e: AgentSpawnInput, started: unknown): Promise<void>

/** Deck's observer of a finished turn, called by the turn.complete dispatcher; it closes the agent's row or the activity row. */
export declare function observeDeckTurnComplete($: EngineInterface, e: TurnCompleteInput): Promise<void>

/** Registers Deck's hooks: its command, the band, the panes, the footer and the event readers. */
export declare function registerDeck(on: On): void
