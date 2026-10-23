// requirements-drafts (TRDD-O5LUMKPW): save the person's own typed messages as Markdown drafts
// in ~/.claude/requirements-drafts/, one file per draft, for every agent and session to read.
// Thin wiring only: every decision is a function in ./logic.ts.
import type { EngineInterface, On } from 'claude-code'

import {
  DRAFTS_SUBDIR,
  HOTKEYS,
  type Via,
  draftId,
  existingDraft,
  hex,
  isoLocal,
  parseSwitch,
  preview,
  pushRecent,
  refusal,
  renderDraft,
  rowIsSaveable,
  shouldRecord,
} from './logic'

const PANE = 'requirements-drafts-pick'
const SWITCH_KEY = 'enabled'

// Module variables, not $.state: $.state would need a `types` contract in the plugin manifest
// (claude plugin validate refused an undeclared key on 2.1.309), and the orchestrator ruled the
// manifest is left unchanged. A reload of this module empties both; the switch lives in $.store.
let enabled = true
let recent: string[] = []
// requestId of a UserMessage row -> id of the draft saved from it, so the row draws "saved".
const savedRows = new Map<string, string>()

type Saved = { id: string } | undefined

/** Shared by the row, the command and the picker: refuse, dedup by hash, then write once. */
async function saveDraft(
  $: EngineInterface,
  text: string,
  via: Via,
  surface: string,
  messageId: string,
): Promise<Saved> {
  const refused = refusal(text)
  if (refused !== undefined) {
    $.ui.toast(refused)
    return undefined
  }
  const home = await $.env.get('HOME')
  if (home === undefined || home === '') {
    $.ui.toast('Not saved: HOME is not set, so the drafts folder cannot be found.')
    return undefined
  }
  const dir = `${home}/${DRAFTS_SUBDIR}`
  const digest = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
  const names = (await $.fs.exists(dir)) ? (await $.fs.list(dir)).map((entry) => entry.name) : []
  const already = existingDraft(names, digest)
  if (already !== undefined) {
    // A reload forgets which rows were saved; the file on disk still knows.
    $.ui.toast(`already saved as ${already}`)
    return { id: already }
  }
  const now = await $.clock.now()
  // Minutes east of UTC; getTimezoneOffset counts the other way.
  const offset = -new Date(now).getTimezoneOffset()
  const id = draftId(now, offset, digest)
  const repo = await $.session.repo()
  const body = renderDraft({
    id,
    created: isoLocal(now, offset),
    projectRoot: await $.session.root(),
    repo: repo === null ? '' : repo.root,
    session: await $.session.id(),
    messageId,
    via,
    surface,
    text,
  })
  await $.fs.write(`${dir}/${id}.md`, body)
  $.ui.toast(`Saved requirement draft ${id}`)
  return { id }
}

/** Called once per session.start by hooks/index.ts. Commands register last. */
export async function startRequirementsDrafts($: EngineInterface): Promise<void> {
  const stored = await $.store.get(SWITCH_KEY)
  enabled = stored !== false
  try {
    await $.command.register({ name: 'requirements-drafts', description: 'Turn requirement drafts on or off', argumentHint: '[on|off]' })
    await $.command.register({ name: 'requirements-drafts-save', description: 'Save your last typed message as a requirement draft', immediate: true })
    await $.command.register({ name: 'requirements-drafts-pick', description: 'Pick one of your recent messages to save as a requirement draft' })
  } catch (error) {
    $.ui.log(`requirements-drafts: command registration failed: ${String(error)}`)
  }
}

export function registerRequirementsDrafts(on: On): void {
  // An observer: it must never drop the person's prompt, so the handler passes it on whatever failed.
  on('prompt.submit', async ($, e, next) => {
    if (enabled && shouldRecord({
      raisedBy: next.origin.plugin,
      originKind: e.origin.kind,
      hasCommand: e.command !== undefined,
      isMeta: e.isMeta === true,
      text: e.text,
    })) {
      recent = pushRecent(recent, e.text)
      $.ui.invalidate('ui.render')
    }
    return next(e)
  }).catch(async ($, e, next) => next(e))

  // /clear, /resume and /branch start another conversation: its "last typed message" starts empty.
  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      recent = []
      savedRows.clear()
    }
    return next(e)
  }).catch(async ($, e, next) => next(e))

  on('command.run', { command: 'requirements-drafts' }, async ($, e) => {
    const answer = parseSwitch(e.args, enabled)
    if ('usage' in answer) return { text: answer.usage }
    enabled = answer.enabled
    await $.store.set(SWITCH_KEY, enabled)
    $.ui.invalidate('ui.render')
    return { text: answer.text }
  })

  on('command.run', { command: 'requirements-drafts-save' }, async ($) => {
    if (!enabled) {
      $.ui.toast('requirements-drafts is off. Turn it on with /requirements-drafts on.')
      return {}
    }
    const last = recent[0]
    if (last === undefined) {
      $.ui.toast('No typed message to save yet in this conversation.')
      return {}
    }
    // command.run names no surface, and the command's message has no id it can read: both stay empty.
    await saveDraft($, last, 'command', '', '')
    return {}
  })

  on('command.run', { command: 'requirements-drafts-pick' }, async ($) => {
    if (!enabled) {
      $.ui.toast('requirements-drafts is off. Turn it on with /requirements-drafts on.')
      return {}
    }
    await $.ui.open({ id: PANE, title: 'Save a requirement draft', focus: true, closeOnEscape: true })
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const width = e.props.bodyColumns - 4
    const choices = recent.slice(0, HOTKEYS.length)
    return Box({
      flexDirection: 'column',
      children: [
        choices.length === 0
          ? Text({ dimColor: true, children: ['No typed message yet in this conversation.'] })
          : Text({ children: ['Press a letter to save that message as a requirement draft.'] }),
        ...choices.map((text, i) =>
          Button({
            key: `pick-${i}`,
            label: preview(text, width),
            hotkey: HOTKEYS[i],
            plain: true,
            onPress: async (pe) => {
              await saveDraft($, text, 'picker', pe.surface, '')
              await $.ui.close({ id: PANE })
            },
          }),
        ),
        Text({ dimColor: true, children: ['Esc closes'] }),
      ],
    })
  })

  // A Button under a typed message (a click fired it in the fullscreen terminal on 2.1.309; the
  // classic renderer delivered no click). One render path for every surface.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const theirs = await next(e)
    if (!enabled || !rowIsSaveable(e.props.origin.kind, e.requestId)) return theirs
    const { Box, Button, Text } = $.ui.resolve(e)
    const savedId = savedRows.get(e.requestId)
    const mark = savedId !== undefined
      ? Text({ dimColor: true, children: [`✓ saved as requirement draft ${savedId}`] })
      : Button({
          key: `rd-save-${e.requestId}`,
          label: '+ save as requirement draft',
          plain: true,
          dimColor: true,
          onPress: async (pe) => {
            const saved = await saveDraft($, e.props.text, 'row', pe.surface, e.requestId)
            if (saved !== undefined) {
              savedRows.set(e.requestId, saved.id)
              $.ui.invalidate('ui.render')
            }
          },
        })
    return Box({ flexDirection: 'column', children: [theirs, mark] })
  })
}
