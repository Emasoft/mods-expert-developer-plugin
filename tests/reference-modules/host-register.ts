// Test helper, staged as hooks/register.ts. Runs the action a test handed to host-harness inside a session.start hook,
// and wires the security-guard modules as a mod composing them would: one Taint shared by every guard, the trace
// registered first so it is outermost and sees what the guards return.
import type { Register } from 'claude-code'

import { egressVerdictGate } from './egress-verdict-gate'
import { eventTrace, TRACE_DEFAULTS } from './event-trace'
import { runStoredAction } from './host-harness'
import { CONTENT_GUARD_DEFAULTS, mcpAndSkillGuard } from './mcp-and-skill-guard'
import { FIREWALL_DEFAULTS, peerMessageFirewall } from './peer-message-firewall'
import { HUD_STYLE_DEFAULTS, securityHud, type HudStyle } from './security-hud'
import { newTaint, sessionTaint, TAINT_DEFAULTS } from './session-taint'

/** A style unlike the defaults, so the HUD tests show that every label, mark and color drawn comes from the style. */
export const HUD_TEST_STYLE: HudStyle = {
  ...HUD_STYLE_DEFAULTS,
  title: 'Guard state',
  toggleLabel: 'shield',
  toggleHotkey: 's',
  clearLabel: 'forget',
  clearHotkey: 'f',
  hideLabel: 'close',
  hideHotkey: 'x',
  heldMark: 'HELD',
  cleanMark: 'OK',
  heldColor: 'warning',
  cleanColor: 'subtle',
  untrustedName: 'from outside',
  sensitiveName: 'secret',
  noneText: 'nothing',
  dimWhileClosed: false,
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await runStoredAction($)
    return next(e)
  })
  const taint = newTaint()
  eventTrace(on, TRACE_DEFAULTS)
  sessionTaint(on, taint, TAINT_DEFAULTS)
  egressVerdictGate(on, taint)
  mcpAndSkillGuard(on, taint, { ...CONTENT_GUARD_DEFAULTS, allowedServers: ['notes', 'chat', 'tickets'] })
  peerMessageFirewall(on, taint, FIREWALL_DEFAULTS)
  securityHud(on, taint, HUD_TEST_STYLE)
}
