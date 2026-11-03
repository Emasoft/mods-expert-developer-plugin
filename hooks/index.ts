// The plugin's one hooks module. hooks.json lists only this file; it owns the only
// session.start hook and starts each mod in its own try/catch, so one failing mod
// cannot keep the others from starting. The dev-tools start runs last, because it
// registers a command and commands register last.
import type { Register } from 'claude-code'

import { registerDevTools, startDevTools } from './dev-tools'
import { registerRequirementsDrafts, startRequirementsDrafts } from './requirements-drafts/register'
import { registerSelfCommand, startSelfCommand } from './self-command/register'
import { registerProbeRunner, startProbeRunner } from './probe-runner/register'
import { registerModManager, startModManager } from './mod-manager/register'
import { configureBins } from './resolve-bin'

export const register: Register = (on, options) => {
  configureBins({ claude: typeof options?.claudePath === 'string' ? options.claudePath : undefined })
  on('session.start', async ($, e, next) => {
    try {
      await startRequirementsDrafts($)
    } catch (error) {
      $.ui.log(`requirements-drafts: start failed: ${String(error)}`)
    }
    try {
      await startSelfCommand($)
    } catch (error) {
      $.ui.log(`self-command: start failed: ${String(error)}`)
    }
    try {
      await startModManager($)
    } catch (error) {
      $.ui.log(`mod-manager: start failed: ${String(error)}`)
    }
    try {
      await startProbeRunner($)
    } catch (error) {
      $.ui.log(`probe-runner: start failed: ${String(error)}`)
    }
    try {
      await startDevTools($)
    } catch (error) {
      $.ui.log(`mods-dev-tools: start failed: ${String(error)}`)
    }
    return next(e)
  })
  registerRequirementsDrafts(on)
  registerSelfCommand(on)
  registerModManager(on)
  registerProbeRunner(on)
  registerDevTools(on)
}
