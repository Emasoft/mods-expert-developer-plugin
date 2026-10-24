// requirements-drafts (TRDD-O5LUMKPW): save the messages the person sends as Markdown drafts
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
// manifest is left unchanged. A reload of this module empties them; the switch lives in $.store.
// The switch is one machine-wide value, like the $.store it is read from.
let enabled = true
// Both lists are keyed by $.session.id(): one module instance may serve more than one session in
// a process (not verified on 2.1.309), and one conversation's message must never be saved from,
// or marked saved in, another (review finding, 2026-10-23).
const recentBySession = new Map<string, string[]>()
// Per session: requestId of a UserMessage row -> id of the draft saved from it, so the row draws "saved".
const savedRowsBySession = new Map<string, Map<string, string>>()

async function recentOf($: EngineInterface): Promise<string[]> {
  return recentBySession.get(await $.session.id()) ?? []
}

/** Read-only: a render never creates an entry (second fix round, 2026-10-23). */
async function savedIdOf($: EngineInterface, requestId: string): Promise<string | undefined> {
  return savedRowsBySession.get(await $.session.id())?.get(requestId)
}

/** The only place a session's saved-rows map is created: after a save succeeded. */
async function markSaved($: EngineInterface, requestId: string, id: string): Promise<void> {
  const session = await $.session.id()
  const rows = savedRowsBySession.get(session) ?? new Map<string, string>()
  rows.set(requestId, id)
  savedRowsBySession.set(session, rows)
}

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

/**
 * Every press and command saves through here: a thrown $.fs or $.session error (a full disk, a
 * folder it may not write) reaches the person as a toast and the log, never as an engine error
 * on a button press, and never silently (review finding, 2026-10-23).
 */
async function trySave(
  $: EngineInterface,
  text: string,
  via: Via,
  surface: string,
  messageId: string,
): Promise<Saved> {
  try {
    return await saveDraft($, text, via, surface, messageId)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    $.ui.log(`requirements-drafts: save failed: ${reason}`)
    $.ui.toast(`Not saved: ${reason}`)
    return undefined
  }
}

/** Called once per session.start by hooks/index.ts. Commands register last. */
export async function startRequirementsDrafts($: EngineInterface): Promise<void> {
  const stored = await $.store.get(SWITCH_KEY)
  // Default ON: an unset switch counts as on (the card's recorded default; the user has not
  // answered yet). A test pins it, so flipping the default turns that test red.
  enabled = stored !== false
  try {
    await $.command.register({ name: 'requirements-drafts', description: 'Turn requirement drafts on or off', argumentHint: '[on|off]' })
    await $.command.register({ name: 'requirements-drafts-save', description: 'Save your last sent message as a requirement draft', immediate: true })
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
      const session = await $.session.id()
      recentBySession.set(session, pushRecent(recentBySession.get(session) ?? [], e.text))
      $.ui.invalidate('ui.render')
    }
    return next(e)
  }).catch(async ($, e, next) => {
    // A throw (from $.session.id, say) must not drop the message silently: log why, pass the prompt on.
    // || not ??: an empty message falls back to the failure kind too.
    $.ui.log(`requirements-drafts: could not record a sent message: ${next.error.message || next.error.kind}`)
    return next(e)
  })

  // /clear, /resume and /branch start another conversation: its last sent message starts empty.
  // Only this session's entry is dropped; another session served by this module keeps its own.
  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      const session = await $.session.id()
      recentBySession.delete(session)
      savedRowsBySession.delete(session)
    }
    return next(e)
  }).catch(async ($, e, next) => {
    // Same rule for the reset: a failure is logged, and the event goes on.
    $.ui.log(`requirements-drafts: could not reset the sent messages: ${next.error.message || next.error.kind}`)
    return next(e)
  })

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
    const last = (await recentOf($))[0]
    if (last === undefined) {
      $.ui.toast('No sent message to save yet in this conversation.')
      return {}
    }
    // command.run names no surface, and the command's message has no id it can read: both stay empty.
    await trySave($, last, 'command', '', '')
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
    const choices = (await recentOf($)).slice(0, HOTKEYS.length)
    return Box({
      flexDirection: 'column',
      children: [
        choices.length === 0
          ? Text({ dimColor: true, children: ['No sent message yet in this conversation.'] })
          : Text({ children: ['Press a letter to save that message as a requirement draft.'] }),
        ...choices.map((text, i) =>
          Button({
            key: `pick-${i}`,
            label: preview(text, width),
            hotkey: HOTKEYS[i],
            plain: true,
            onPress: async (pe) => {
              await trySave($, text, 'picker', pe.surface, '')
              await $.ui.close({ id: PANE })
            },
          }),
        ),
        Text({ dimColor: true, children: ['Esc closes'] }),
      ],
    })
  })

  // A Button under a message the person sent (a click fired it in the fullscreen terminal on 2.1.309; the
  // classic renderer delivered no click). One render path for every surface.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const theirs = await next(e)
    if (!enabled || !rowIsSaveable(e.props.origin.kind, e.requestId)) return theirs
    const { Box, Button, Text } = $.ui.resolve(e)
    const savedId = await savedIdOf($, e.requestId)
    const mark = savedId !== undefined
      ? Text({ dimColor: true, children: [`✓ saved as requirement draft ${savedId}`] })
      : Button({
          key: `rd-save-${e.requestId}`,
          label: '+ save as requirement draft',
          plain: true,
          dimColor: true,
          onPress: async (pe) => {
            const saved = await trySave($, e.props.text, 'row', pe.surface, e.requestId)
            if (saved !== undefined) {
              await markSaved($, e.requestId, saved.id)
              $.ui.invalidate('ui.render')
            }
          },
        })
    return Box({ flexDirection: 'column', children: [theirs, mark] })
  })
}
