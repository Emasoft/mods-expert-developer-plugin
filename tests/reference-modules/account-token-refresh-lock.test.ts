// Behaviour of the account-token-refresh-lock reference module on the host's test kit: the lock folders, the file system and the
// clock are simulated in memory, with a fake clock that sleep advances, so no real wait happens.
// UNVERIFIED, seen only by running the kit: the process.run event carries `argv`, the fs events carry `path`, a stub answers { value }
// or makes the call reject with { deny }, a stub may answer late (an async stub), list and stat answers carry name, kind, size, mtimeMs
// and isLink, and crypto.randomUUID is defined inside a hook of the kit.
import { describe, expect, test } from 'claude-code/testing'

import { bridgeStubs, runThroughHost, WORK_FILE } from '../host-harness'

const DIR = '/w/locks'
const LOCK = `${DIR}/refresh-acct_1.lock`
const ABANDONED = `${LOCK}/owner-abandoned`
const OTHER = `${LOCK}/owner-other`
// The module names its owner entry owner-<random UUID>; the log shows every such entry as MINE.
const TOKEN = /owner-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
const MINE = `${LOCK}/owner-<token>`
const START = 1_000_000

type Tree = Map<string, number>

/** A lock folder made at `at` holding the owner entry `owner`. */
const lockAt = (at: number, owner = OTHER) => ({ [LOCK]: at, [owner]: at })
const parentOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.')
const ownerEntries = (tree: Tree) => [...tree.keys()].filter(key => key.startsWith(`${LOCK}/owner-`))

// mkdir and rmdir as POSIX runs them: an argument that starts with a hyphen before `--` is an option, mkdir fails when the path is
// there (except with -p) or its parent is missing, rmdir fails when the path is missing or not empty; both set the parent's mtime.
function act(tree: Tree, clock: number, argv: string[]): boolean {
  const [program, ...args] = argv
  const end = args.indexOf('--')
  const flags = end === -1 ? args.filter(arg => arg.startsWith('-')) : args.slice(0, end)
  const paths = end === -1 ? args.filter(arg => !arg.startsWith('-')) : args.slice(end + 1)
  const path = paths[0] as string
  const parents = flags.includes('-p')
  if (paths.length !== 1 || flags.some(flag => flag !== '-p')) return false
  if (program === 'mkdir') {
    if (tree.has(path)) return parents
    if (!parents && !tree.has(parentOf(path))) return false
    tree.set(path, clock)
  } else if (program === 'rmdir') {
    if (!tree.has(path) || [...tree.keys()].some(key => key.startsWith(`${path}/`))) return false
    tree.delete(path)
  } else {
    return false
  }
  if (tree.has(parentOf(path))) tree.set(parentOf(path), clock)
  return true
}

function world(
  on: any,
  options: {
    held?: Record<string, number>
    fails?: (command: string) => boolean
    /** Another session's step, run just before the program call `command` acts. */
    before?: (command: string, tree: Tree, clock: number) => void
    onWork?: (tree: Tree) => void
    /** fs.stat reports whole seconds, as a coarse file system does. */
    coarse?: boolean
    /** The first this many fs.list calls are refused. */
    listDenials?: number
    /** Every process.run is refused, as for a surface that does not offer it. */
    refuseProcess?: boolean
    /** Every rmdir waits until the clock has been read this many times. */
    rmdirAfterClockReads?: number
  } = {},
) {
  const tree: Tree = new Map(Object.entries(options.held ?? {}))
  const log: string[] = []
  const sleeps: number[] = []
  let clock = START
  let clockReads = 0
  let opened: () => void = () => {}
  const gate = new Promise<void>(resolve => { opened = resolve })
  if ((options.rmdirAfterClockReads ?? 0) === 0) opened()
  const bridge = bridgeStubs(on)
  const reply = (exitCode: number) => ({ value: { exitCode, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  on('process.run', async ($: any, e: any) => {
    const argv = e.argv as string[]
    const command = argv.join(' ').replace(TOKEN, 'owner-<token>')
    if (argv[0] === 'rmdir') await gate
    if (options.refuseProcess) return { deny: 'process.run is not available on this surface' }
    options.before?.(command, tree, clock)
    const ok = !options.fails?.(command) && act(tree, clock, argv)
    log.push(ok ? command : `${command} failed`)
    return reply(ok ? 0 : 1)
  })
  on('fs.exists', ($: any, e: any) => ({ value: tree.has(e.path) }))
  let listCalls = 0
  on('fs.list', ($: any, e: any) => {
    // The first listDenials calls are refused, as for a lock that vanished and was made again between the list and the check.
    listCalls += 1
    if (listCalls <= (options.listDenials ?? 0)) return { deny: `a hook refused fs.list of ${e.path}` }
    if (!tree.has(e.path)) return { deny: `ENOENT: no such file or directory, listing the folder '${e.path}'` }
    const children = [...tree.keys()].filter(key => parentOf(key) === e.path)
    return { value: children.map(key => ({ name: key.slice(e.path.length + 1), kind: 'dir', size: 0, mtimeMs: 0, isLink: false })) }
  })
  on('fs.stat', ($: any, e: any) => {
    const mtimeMs = tree.get(e.path)
    if (mtimeMs === undefined) return { deny: `ENOENT: no such file or directory, stat '${e.path}'` }
    return { value: { kind: 'dir', size: 0, mtimeMs: options.coarse ? Math.floor(mtimeMs / 1000) * 1000 : mtimeMs, isLink: false } }
  })
  on('fs.write', ($: any, e: any) => {
    log.push(`write ${e.path}`)
    if (e.path === WORK_FILE) options.onWork?.(tree)
    return { value: undefined }
  })
  on('clock.now', () => {
    clockReads += 1
    if (clockReads >= (options.rmdirAfterClockReads ?? 0)) opened()
    return { value: clock }
  })
  on('clock.sleep', ($: any, e: any) => {
    sleeps.push(e.ms)
    clock += e.ms
    return { value: undefined }
  })
  type Run = Partial<{ staleMs: number; tries: number; accountId: string; workFails: boolean; directory: string }>
  const lockOptions = (lock: Run) => ({ directory: lock.directory ?? DIR, staleMs: lock.staleMs ?? 60_000, tries: lock.tries ?? 3 })
  const run = ($: any, lock: Run = {}) =>
    runThroughHost($, bridge, { module: 'lock', options: lockOptions(lock), accountId: lock.accountId ?? 'acct_1', workFails: lock.workFails ?? false })
  const pair = ($: any, lock: Run = {}) =>
    runThroughHost($, bridge, { module: 'lock-pair', options: lockOptions(lock), accountId: lock.accountId ?? 'acct_1' })
  return { tree, log, sleeps, run, pair }
}

async function failure(call: Promise<unknown>): Promise<{ messages: string[] }> {
  try {
    await call
  } catch (error) {
    return error as { messages: string[] }
  }
  throw new Error('the call was expected to fail')
}

describe('withAccountRefreshLock, taking and giving up the lock', () => {
  test('the work runs between the claiming and the removal of the account lock, and its result is returned', async ($, on) => {
    const w = world(on)
    expect(await w.run($)).toBe('worked')
    expect(w.log).toEqual([`mkdir -p -- ${DIR}`, `mkdir -- ${LOCK}`, `mkdir -- ${MINE}`, `write ${WORK_FILE}`, `rmdir -- ${MINE}`, `rmdir -- ${LOCK}`])
    expect([...w.tree.keys()]).toEqual([DIR])
  })
  test('every program call ends its options with --, so a lock folder that starts with a hyphen stays a path', async ($, on) => {
    const w = world(on)
    expect(await w.run($, { directory: '-locks' })).toBe('worked')
    expect(w.log.filter(line => !line.startsWith('write'))).toEqual([
      'mkdir -p -- -locks',
      'mkdir -- -locks/refresh-acct_1.lock',
      'mkdir -- -locks/refresh-acct_1.lock/owner-<token>',
      'rmdir -- -locks/refresh-acct_1.lock/owner-<token>',
      'rmdir -- -locks/refresh-acct_1.lock',
    ])
  })
  test('the lock of another account does not block this one', async ($, on) => {
    const w = world(on, { held: { [`${DIR}/refresh-acct_2.lock`]: START, [`${DIR}/refresh-acct_2.lock/owner-other`]: START } })
    expect(await w.run($)).toBe('worked')
  })
  test('a lock held by another session is waited for with doubling delays, then reported busy without running the work', async ($, on) => {
    const w = world(on, { held: lockAt(START) })
    const failed = await failure(w.run($, { tries: 4 }))
    expect(failed.messages).toEqual([`the lock ${LOCK} is held by another session`])
    expect(w.sleeps).toEqual([100, 200, 400])
    expect(w.log).not.toContain(`write ${WORK_FILE}`)
    expect(ownerEntries(w.tree)).toEqual([OTHER])
  })
  test('the delay never grows past a second', async ($, on) => {
    const w = world(on, { held: lockAt(START) })
    await failure(w.run($, { tries: 7, staleMs: 10_000_000 }))
    expect(w.sleeps).toEqual([100, 200, 400, 800, 1000, 1000])
  })
  test('a lock older than the stale time loses its owner entry, then its folder, and is taken over', async ($, on) => {
    const w = world(on, { held: lockAt(START - 60_001, ABANDONED) })
    expect(await w.run($)).toBe('worked')
    expect(w.log).toEqual([
      `mkdir -p -- ${DIR}`,
      `mkdir -- ${LOCK} failed`,
      `rmdir -- ${ABANDONED}`,
      `rmdir -- ${LOCK}`,
      `mkdir -- ${LOCK}`,
      `mkdir -- ${MINE}`,
      `write ${WORK_FILE}`,
      `rmdir -- ${MINE}`,
      `rmdir -- ${LOCK}`,
    ])
  })
  test('with a single try a stale lock is still taken over, in the same try', async ($, on) => {
    const w = world(on, { held: lockAt(START - 60_001, ABANDONED) })
    expect(await w.run($, { tries: 1 })).toBe('worked')
    expect(w.sleeps).toEqual([])
  })
  test('a stale lock with no owner entry, whose maker died between its two mkdir calls, is removed and taken over', async ($, on) => {
    const w = world(on, { held: { [LOCK]: START - 60_001 } })
    expect(await w.run($, { tries: 1 })).toBe('worked')
    expect(w.log.slice(1, 4)).toEqual([`mkdir -- ${LOCK} failed`, `rmdir -- ${LOCK}`, `mkdir -- ${LOCK}`])
  })
  test('a lock exactly as old as the stale time is not taken over', async ($, on) => {
    const w = world(on, { held: lockAt(START - 60_000) })
    expect((await failure(w.run($, { tries: 1 }))).messages).toEqual([`the lock ${LOCK} is held by another session`])
    expect(w.log).toEqual([`mkdir -p -- ${DIR}`, `mkdir -- ${LOCK} failed`])
  })
  test('a lock that vanished and was made again while it was listed is read once more and judged as it now stands', async ($, on) => {
    const w = world(on, { held: lockAt(START), listDenials: 1 })
    expect((await failure(w.run($, { tries: 1 }))).messages).toEqual([`the lock ${LOCK} is held by another session`])
  })
  test('a lock that is there but cannot be listed twice is a failure, not a free lock', async ($, on) => {
    const w = world(on, { held: lockAt(START), listDenials: 2 })
    // The kit puts its own prefix before a refusal reason, so only the reason is matched.
    const { messages } = await failure(w.run($, { tries: 3 }))
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatch(`a hook refused fs.list of ${LOCK}`)
    expect(w.sleeps).toEqual([])
  })
  test('a lock with more than one owner entry is a failure and is left as it is', async ($, on) => {
    const w = world(on, { held: { ...lockAt(START - 60_001, ABANDONED), [OTHER]: START - 60_001 } })
    expect((await failure(w.run($))).messages).toEqual([`the lock ${LOCK} has more than one owner entry`])
    expect(ownerEntries(w.tree)).toEqual([ABANDONED, OTHER])
  })
  test('a lock that cannot be made and is not there is a failure, not a busy lock', async ($, on) => {
    const w = world(on, { fails: command => command === `mkdir -- ${LOCK}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot make the lock ${LOCK}`])
  })
  test('a surface that refuses process.run ends the call before the work runs and leaves nothing behind', async ($, on) => {
    const w = world(on, { refuseProcess: true })
    expect((await failure(w.run($))).messages).toEqual([expect.stringContaining('process.run is not available on this surface')])
    expect(w.log).toEqual([])
    expect(w.tree.size).toBe(0)
  })
  test('a lock folder that cannot be made is a failure and nothing else runs', async ($, on) => {
    const w = world(on, { fails: command => command === `mkdir -p -- ${DIR}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot make the lock folder ${DIR}`])
    expect(w.log).toEqual([`mkdir -p -- ${DIR} failed`])
  })
  test('a stale lock whose owner entry cannot be removed is a failure', async ($, on) => {
    const w = world(on, { held: lockAt(START - 60_001, ABANDONED), fails: command => command === `rmdir -- ${ABANDONED}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot remove the stale lock ${LOCK}`])
  })
  test('a stale lock whose owner entry another session removed first is left to that session', async ($, on) => {
    // The other session removes the abandoned entry and the folder and takes the lock just before this one's rmdir acts.
    const w = world(on, {
      held: lockAt(START - 60_001, ABANDONED),
      before: (command, tree, clock) => {
        if (command !== `rmdir -- ${ABANDONED}`) return
        tree.delete(ABANDONED)
        tree.set(LOCK, clock)
        tree.set(OTHER, clock)
      },
    })
    expect((await failure(w.run($, { tries: 1 }))).messages).toEqual([`the lock ${LOCK} is held by another session`])
    expect(w.log).toEqual([`mkdir -p -- ${DIR}`, `mkdir -- ${LOCK} failed`, `rmdir -- ${ABANDONED} failed`])
    expect(ownerEntries(w.tree)).toEqual([OTHER])
  })
  test('a lock whose owner entry cannot be made is removed again, the work does not run, and the failure is reported', async ($, on) => {
    const w = world(on, { fails: command => command === `mkdir -- ${MINE}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot claim the lock ${LOCK}`])
    expect(w.log).toEqual([`mkdir -p -- ${DIR}`, `mkdir -- ${LOCK}`, `mkdir -- ${MINE} failed`, `rmdir -- ${LOCK}`])
    expect([...w.tree.keys()]).toEqual([DIR])
  })
  test('an unclaimed lock that cannot be removed again is reported together with the failed claim', async ($, on) => {
    const w = world(on, { fails: command => command === `mkdir -- ${MINE}` || command === `rmdir -- ${LOCK}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot claim the lock ${LOCK}`, `cannot remove the unclaimed lock ${LOCK}`])
    expect(w.log).not.toContain(`write ${WORK_FILE}`)
  })
  test('a lock taken away by a stale remover between the two mkdir calls is made again', async ($, on) => {
    let claims = 0
    const w = world(on, {
      before: (command, tree) => {
        if (command === `mkdir -- ${MINE}` && ++claims === 1) tree.delete(LOCK)
      },
    })
    expect(await w.run($, { tries: 1 })).toBe('worked')
    expect(w.log.slice(1, 5)).toEqual([`mkdir -- ${LOCK}`, `mkdir -- ${MINE} failed`, `mkdir -- ${LOCK}`, `mkdir -- ${MINE}`])
  })
  test('a lock folder that cannot be removed at the release is a failure', async ($, on) => {
    const w = world(on, { fails: command => command === `rmdir -- ${LOCK}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot release the lock ${LOCK}`])
  })
  test('an owner entry that cannot be removed at the release is a failure, not a lost lock', async ($, on) => {
    const w = world(on, { fails: command => command === `rmdir -- ${MINE}` })
    expect((await failure(w.run($))).messages).toEqual([`cannot release the lock ${LOCK}`])
  })
})

describe('withAccountRefreshLock, failures', () => {
  test('a failing work still gives the lock up and its error is reported', async ($, on) => {
    const w = world(on)
    expect((await failure(w.run($, { workFails: true }))).messages).toEqual(['the work failed'])
    expect([...w.tree.keys()]).toEqual([DIR])
  })
  test('a lock taken over while the work ran is reported as lost and is not removed', async ($, on) => {
    const w = world(on, {
      onWork: tree => {
        for (const entry of ownerEntries(tree)) tree.delete(entry)
        tree.set(OTHER, START + 5)
      },
    })
    expect((await failure(w.run($))).messages).toEqual([`the lock ${LOCK} was taken over while the work ran`])
    expect(ownerEntries(w.tree)).toEqual([OTHER])
    expect(w.log).not.toContain(`rmdir -- ${LOCK}`)
  })
  test('a lock taken over within the same tick of a coarse clock is still reported as lost', async ($, on) => {
    // The new owner's entry leaves the folder's whole-second mtime as it was; only the owner entry tells the two holders apart.
    const w = world(on, {
      coarse: true,
      onWork: tree => {
        const before = tree.get(LOCK)
        for (const entry of ownerEntries(tree)) tree.delete(entry)
        tree.set(OTHER, START)
        tree.set(LOCK, before as number)
      },
    })
    expect((await failure(w.run($))).messages).toEqual([`the lock ${LOCK} was taken over while the work ran`])
    expect(ownerEntries(w.tree)).toEqual([OTHER])
  })
  test('a failing work and a lost lock are both reported', async ($, on) => {
    const w = world(on, {
      onWork: tree => {
        for (const entry of ownerEntries(tree)) tree.delete(entry)
        tree.delete(LOCK)
      },
    })
    expect((await failure(w.run($, { workFails: true }))).messages).toEqual(['the work failed', `the lock ${LOCK} was taken over while the work ran`])
  })
})

describe('withAccountRefreshLock, two sessions at once', () => {
  test('two callers that both find one abandoned lock remove it once and never run their works together', async ($, on) => {
    // Both callers judge the abandoned lock stale before either rmdir acts; the one owner entry decides which removal wins.
    const w = world(on, { held: lockAt(START - 60_001, ABANDONED), rmdirAfterClockReads: 2 })
    expect(await w.pair($, { tries: 6 })).toEqual({ values: ['worked', 'worked'], maxActive: 1 })
    expect(w.log.filter(line => line === `rmdir -- ${ABANDONED}`)).toHaveLength(1)
    expect(w.log.filter(line => line === `write ${WORK_FILE}`)).toHaveLength(2)
    expect([...w.tree.keys()]).toEqual([DIR])
  })
})

describe('withAccountRefreshLock, the arguments', () => {
  test('an account id that is not letters, digits, hyphen and underscore up to 64 is refused before any program runs', async ($, on) => {
    const w = world(on)
    for (const accountId of ['', '../up', 'a b', 'a/b', 'a.b', 'x'.repeat(65)]) {
      expect((await failure(w.run($, { accountId }))).messages).toEqual(['the account id must be letters, digits, hyphen and underscore, up to 64'])
    }
    expect(w.log).toEqual([])
  })
  test('a stale time or a number of tries that is not a positive integer is refused', async ($, on) => {
    const w = world(on)
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect((await failure(w.run($, { staleMs: bad }))).messages).toEqual(['staleMs and tries must be positive integers'])
      expect((await failure(w.run($, { tries: bad }))).messages).toEqual(['staleMs and tries must be positive integers'])
    }
    expect(w.log).toEqual([])
  })
})
