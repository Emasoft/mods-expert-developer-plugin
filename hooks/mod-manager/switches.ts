// The functions of the mod-manager that switch on and off by themselves (TRDD-5IK59SQ2, PRRD G13.1), in the registry
// every integrated mod shares (../switches). The automatic update (2k) is off by default: the owner chose an
// off-by-default switch plus a per-plugin opt-in (TRDD-R2QYIN8O, question 10). No release stored the switch before this
// one (the auto-update came in this release, commit fe18acb, in no tag), so it reads no older key. Every other function
// is on by default (final rule 6: a function that always ran before this release counts as on), and none stored a switch
// before, so none reads an older key either. What is merged and what is split, and why, is on TRDD-5IK59SQ2 (C6b).
import type { SwitchDef } from '../switches/logic'
import type { Action } from './logic'

export const MOD = 'mods-manager'

export const AUTO_UPDATE = 'mods-manager.auto-update'

/**
 * The ids of the functions the pane and the /mods-manager command run. pane works as a master: with it off nothing of the
 * pane can be reached but /mods-manager close. latest is the read of the local catalog copies: off, no catalog is read
 * and nothing a catalog said is drawn, so the update arrows, Update, Update all, the badge, and the plugins not installed
 * with their Install and Copy install line are gone too, and so is the section of every marketplace with no plugin installed,
 * its header button included, whether a catalog or the person added it: its section can then be neither opened nor read
 * (TRDD-5IK59SQ2, disclosure of 2026-11-05). The hourly check is not one of these: auto-update and the opt-ins
 * alone govern it, so update off does not stop an opted-in row's automatic update.
 */
export const FN = {
  pane: 'mods-manager.pane',
  reload: 'mods-manager.reload',
  latest: 'mods-manager.latest',
  badge: 'mods-manager.badge',
  enable: 'mods-manager.enable',
  disable: 'mods-manager.disable',
  update: 'mods-manager.update',
  updateAll: 'mods-manager.update-all',
  uninstall: 'mods-manager.uninstall',
  install: 'mods-manager.install',
  copyInstallLine: 'mods-manager.copy-install-line',
  addMarketplace: 'mods-manager.add-marketplace',
  open: 'mods-manager.open',
} as const

/** The switch of each action of a row, so its button and its press read the one switch. */
export const ACTION_SWITCH: Readonly<Record<Action, string>> = { enable: FN.enable, disable: FN.disable, update: FN.update, uninstall: FN.uninstall }

const on = (id: string, label: string): SwitchDef => ({ id, mod: MOD, label, defaultOn: true })

/** The functions the pane draws and runs, each on by default; the pane's cached view reads these (state.ts). */
export const MOD_MANAGER_FUNCTIONS: readonly SwitchDef[] = [
  on(FN.pane, '/mods-manager pane and command'),
  on(FN.reload, 'Reload plugins'),
  // Short enough to show whole in a /mods-switches body 76 columns wide: 63 characters after the hotkey and the state
  // (functionLabel), this label 61. "Plugins to install" are the catalog's plugins not installed, and "other marketplaces"
  // those with no plugin installed; what off hides is spelled out in the comment on FN above (item S review, finding 7,
  // and the orchestrator's ruling on its wording).
  on(FN.latest, 'Catalog read: updates, plugins to install, other marketplaces'),
  on(FN.badge, 'Status-line count of updates'),
  on(FN.enable, 'Turn on a plugin'),
  on(FN.disable, 'Turn off a plugin'),
  on(FN.update, 'Update a plugin'),
  on(FN.updateAll, 'Update all'),
  on(FN.uninstall, 'Uninstall a plugin'),
  on(FN.install, 'Install a plugin a catalog lists'),
  on(FN.copyInstallLine, 'Copy install line'),
  on(FN.addMarketplace, 'Add marketplace'),
  on(FN.open, 'Open folder and Open link'),
]

export const MOD_MANAGER_SWITCHES: readonly SwitchDef[] = [
  ...MOD_MANAGER_FUNCTIONS,
  // Off by default (TRDD-R2QYIN8O, owner question 10): on, the hourly check updates the opted-in plugins with no press.
  { id: AUTO_UPDATE, mod: MOD, label: 'auto-update: the hourly check updates the plugins opted in with Auto', defaultOn: false },
]

/** What a press of a function that is off is told: which function, and where to turn it on. */
export function offText(id: string): string {
  const def = MOD_MANAGER_SWITCHES.find((candidate) => candidate.id === id)
  if (def === undefined) throw new Error(`offText: ${id} is not a switch of ${MOD}`)
  return `${def.label} is off in ${MOD}. Turn it on in /mods-switches.`
}

/** The pane's line when a switch could not be read: its function is hidden, the safe side. The reason is outside text. */
export function switchesUnreadableText(reason: string): string {
  return `A switch of ${MOD} could not be read, so its function is hidden: ${reason}`
}
