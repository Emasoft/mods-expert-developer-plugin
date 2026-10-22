export type Snapshot = { branch: string; changed: number; untracked: number }

/** What the band draws: the last good snapshot, whether a later refresh failed, and the off switch (copied from the store so ui.render never reads the store). */
export type View = { snapshot: Snapshot | null; stale: boolean; enabled: boolean }

declare module 'claude-code' {
  interface PluginState {
    'git-poller': { view: View }
  }
}
