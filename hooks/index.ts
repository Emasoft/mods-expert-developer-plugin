// The plugin's one hooks module. hooks.json lists only this file; it owns the only
// session.start hook and starts each mod in its own try/catch, so one failing mod
// cannot keep the others from starting.
import type { Register } from 'claude-code'

import { registerRequirementsDrafts, startRequirementsDrafts } from './requirements-drafts/register'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    try {
      await startRequirementsDrafts($)
    } catch (error) {
      $.ui.log(`requirements-drafts: start failed: ${String(error)}`)
    }
    return next(e)
  })
  registerRequirementsDrafts(on)
}
