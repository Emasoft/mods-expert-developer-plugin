// Test helper, not a reference module. The kit gives `$.fs` and the other host calls to a hook only, and the hooks module does not
// share memory with the test, so the test and the hook in host-register.ts talk through two store keys that the test stubs with `on`:
// the test stores the action to run, raises session.start, the hook runs the module function with its own `$` and stores the outcome.
// The host also refuses a hooks module that passes `$` to a call it cannot resolve statically or with a spread, hence the switch with
// every module function called by its imported name and its arguments written out.
// UNVERIFIED, seen only by running the kit: the stubs read `e.key` and `e.value` from a store event and answer { value }.
import type { EngineInterface } from 'claude-code'

import type { SavedAccount } from './account-registry-file'
import { withAccountRefreshLock, type LockOptions } from './account-token-refresh-lock'
import { swapLogin } from './code-login-swap-credential-files'
import { compactWithCommandFallback } from './compact-with-command-fallback'
import { deleteKeychainItem, readKeychainItem, writeKeychainItem, type KeychainTool } from './macos-keychain-item-store'
import { refreshOAuthToken, type TokenEndpoint } from './oauth-token-refresh'

export const INPUTS_SLOT = 'swap-inputs'
export const OUTCOME_SLOT = 'swap-outcome'
/** The file the lock test's work writes, so that a test sees when the work ran. */
export const WORK_FILE = '/w/work-ran'

export type Inputs = {
  files: { credentials: string; config: string; suffix: string; credentialsBackup?: string }
  target: SavedAccount
  saved: { credentials: string; account: string }
  carryOver: string[]
}
export type Action =
  | { module: 'swap'; inputs: Inputs }
  | { module: 'keychain'; op: 'read' | 'write' | 'delete'; tool: KeychainTool; service: string; account: string; secret: string }
  | { module: 'refresh'; endpoint: TokenEndpoint; refreshToken: string }
  | { module: 'lock'; options: LockOptions; accountId: string; workFails: boolean }
  | { module: 'lock-pair'; options: LockOptions; accountId: string }
  | { module: 'compact'; instructions?: string; fallbackToCommand?: boolean }
type Outcome = { ok: true; value: unknown } | { ok: false; messages: string[]; facts: Record<string, unknown> }

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

async function perform($: EngineInterface, action: Action): Promise<unknown> {
  switch (action.module) {
    case 'swap': {
      const { credentials, config, suffix, credentialsBackup } = action.inputs.files
      // credentialsBackup lets a test give both files one backup path.
      const files = { credentials, config, backup: (file: string) => credentialsBackup ?? `${file}${suffix}` }
      return (await swapLogin($, files, action.inputs.target, action.inputs.saved, action.inputs.carryOver)).backups
    }
    case 'keychain':
      if (action.op === 'read') return readKeychainItem($, action.tool, action.service, action.account)
      if (action.op === 'delete') return deleteKeychainItem($, action.tool, action.service, action.account)
      return writeKeychainItem($, action.tool, action.service, action.account, action.secret)
    case 'refresh':
      return refreshOAuthToken($, action.endpoint, action.refreshToken)
    case 'compact':
      return compactWithCommandFallback($, action.instructions, { fallbackToCommand: action.fallbackToCommand === true })
    case 'lock':
      return withAccountRefreshLock($, action.options, action.accountId, async () => {
        await $.fs.write(WORK_FILE, 'ran')
        if (action.workFails) throw new Error('the work failed')
        return 'worked'
      })
    case 'lock-pair': {
      // Two callers on one account at once, as two sessions would be. Each work counts the works running, so the test sees an overlap.
      let active = 0
      let maxActive = 0
      const work = async () => {
        active += 1
        maxActive = Math.max(maxActive, active)
        await $.fs.write(WORK_FILE, 'ran')
        // The work spans several host calls, as a refresh does, so a caller that wrongly took the lock would run inside it.
        for (let step = 0; step < 8; step += 1) await $.fs.exists(WORK_FILE)
        active -= 1
        return 'worked'
      }
      const values = await Promise.all([
        withAccountRefreshLock($, action.options, action.accountId, work),
        withAccountRefreshLock($, action.options, action.accountId, work),
      ])
      return { values, maxActive }
    }
  }
}

// Called by the hook with its `$`.
export async function runStoredAction($: EngineInterface): Promise<void> {
  const action = (await $.store.get(INPUTS_SLOT)) as Action
  let outcome: Outcome
  try {
    outcome = { ok: true, value: await perform($, action) }
  } catch (error) {
    // facts: the own enumerable fields of the error (name, exitCode, status ...); a test reads them from the thrown error.
    const facts = error instanceof Error ? Object.fromEntries(Object.entries(error)) : {}
    outcome = { ok: false, messages: error instanceof AggregateError ? error.errors.map(message) : [message(error)], facts }
  }
  await $.store.set(OUTCOME_SLOT, outcome)
}

export type Bridge = { inputs: Action | undefined; outcome: Outcome | undefined; gets: string[]; sets: string[] }

/** Stubs the two store keys on the test engine; the returned object is what the test and the hook exchange. */
export function bridgeStubs(on: any): Bridge {
  const bridge: Bridge = { inputs: undefined, outcome: undefined, gets: [], sets: [] }
  on('store.get', ($: any, e: any) => {
    bridge.gets.push(e.key)
    return { value: { [INPUTS_SLOT]: bridge.inputs }[e.key as string] }
  })
  on('store.set', ($: any, e: any) => {
    bridge.sets.push(e.key)
    if (e.key === OUTCOME_SLOT) bridge.outcome = e.value
    return { value: undefined }
  })
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  return bridge
}

/** Runs the action inside the hook; resolves with its value, or rejects with an error whose `messages` lists every cause and `facts` the fields of the error. */
export async function runThroughHost($: any, bridge: Bridge, action: Action): Promise<unknown> {
  bridge.inputs = action
  bridge.outcome = undefined
  bridge.gets = []
  bridge.sets = []
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
  // The module must touch the store only through the two keys: any other store call would hide a change in the exchange.
  if (bridge.gets.join() !== INPUTS_SLOT || bridge.sets.join() !== OUTCOME_SLOT) {
    throw new Error(`unexpected store calls: get ${bridge.gets.join()}, set ${bridge.sets.join()}`)
  }
  const outcome = bridge.outcome
  if (outcome === undefined) throw new Error('the host harness hook did not run')
  if (!outcome.ok) throw Object.assign(new Error(outcome.messages.join(' | ')), { messages: outcome.messages, facts: outcome.facts })
  return outcome.value
}

/** Runs swapLogin inside the hook; resolves with the backups. */
export async function swapThroughHost($: any, bridge: Bridge, inputs: Inputs): Promise<string[]> {
  return (await runThroughHost($, bridge, { module: 'swap', inputs })) as string[]
}
