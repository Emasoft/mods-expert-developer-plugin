import { mock } from 'claude-code/testing'

// Stubs for every call the mod makes, so a test never touches git, the store or a real clock.
// Stub shapes: mods-doc-mods-testing chapter.md:183 (store.get), :188 (process.run), :193 (turn.complete).
export function stubs(on: any, opts: { stdout?: string } = {}) {
  const clock = mock.clock(on)
  const saved = new Map<string, unknown>()
  const toasts: string[] = []
  const registered: unknown[] = []
  const calls: string[][] = []
  const git = { stdout: opts.stdout ?? '## main...origin/main\n M a.ts\n?? b.ts\n', exitCode: 0, reject: false, slow: false }
  // slowNext: the next store.get reads the value at once but answers only after the clock advances.
  const store = { fails: false, slowNext: false }
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($: unknown, e: unknown) => {
    registered.push(e)
    return { value: undefined }
  })
  // A { deny } answer makes the call reject in the mod (mods-doc-mods-testing chapter.md:189).
  on('store.get', async ($: unknown, e: { key: string }) => {
    if (store.fails) return { deny: 'store down' }
    const value = saved.get(e.key)
    if (store.slowNext) {
      store.slowNext = false
      await clock.sleep(1000)
    }
    return { value }
  })
  on('store.set', ($: unknown, e: { key: string; value: unknown }) => {
    saved.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.toast', ($: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('turn.complete', () => ({ text: '' }))
  // The engine draws nothing beneath the mod: the stub stands for it (mods-doc-mods-testing chapter.md:202).
  on('ui.render', () => ({ type: 'Text', props: {}, children: [''] }))
  on('process.run', async ($: unknown, e: { argv: string[] }) => {
    calls.push(e.argv)
    // A slow git: the stub answers only once the test has advanced the mock clock.
    if (git.slow) await clock.sleep(1000)
    if (git.reject) return { deny: 'git failed to start' }
    return { value: { exitCode: git.exitCode, stdout: git.stdout, stderr: '' } }
  })
  return { clock, saved, toasts, registered, calls, git, store }
}

export const DONE = { turnId: 't1', answer: 'ok', durationMs: 1, isAborted: false, usage: null } as const

export const START = { surface: 'terminal', isInteractive: true, cwd: '/work' } as const

// session.start does not wait for its first refresh, so let the pending work finish before asserting.
// UNVERIFIED: the chapter describes clock.settle() as running timers that are already due; that it
// also lets the mod's pending promises finish is observed here, not documented.
export async function startSession($: any, s: ReturnType<typeof stubs>): Promise<void> {
  await $.session.start(START)
  await s.clock.settle()
}
