// Increment 2f of TRDD-R2QYIN8O, the Install button (owner question 4, verbatim choice "Add Install button"; option text:
// "2f installs the chosen plugin, not only lists it."): the argument vector and the texts of an install from the pane.
// Pure, and its own file, so the flow (state.ts confirmAndInstall) and the button (pane.ts) can be switched off in one
// place later (TRDD-5IK59SQ2). Every claude call of the pane is $.process.run in cli.ts, which no permission mode or rule
// gates, so the safeguard is the question: the install runs only after the person picks INSTALL_LABEL.
import { type Available, PLUGIN_ID, printable } from './logic'
import type { ShownCommand } from './results'

/** The answer that lets an install run; any other answer, or none, runs nothing. */
export const INSTALL_LABEL = 'Install it'

/**
 * The argument vector of an install from the pane: claude plugin install <id> --scope user --json, with no shell and never
 * -y. The id is checked against PLUGIN_ID first, so it can never be read as a flag or a path. User scope, as the copied
 * install line has (installLine). --json, so the result is read from its fields (results.ts parseCliResult), and a command
 * the marketplace declares comes back as shownCommand with its sha256, for the person to read; without a terminal and
 * without -y claude only displays it (plugin commands chapter: "the install is refused", exit 1; measured on 2.1.318).
 */
export function installArgv(claude: string, id: string): string[] {
  if (!PLUGIN_ID.test(id)) throw new Error(`refused: "${id}" is not a plugin id (name@marketplace)`)
  return [claude, 'plugin', 'install', id, '--scope', 'user', '--json']
}

/** The question of an install: the plugin, its marketplace and scope, the exact argv with claude as the name the person knows, and what happens to a declared command. */
export function installQuestion(entry: Available): string {
  return printable(
    `Install ${entry.name} from ${entry.marketplace} (user scope)? This runs ${JSON.stringify(installArgv('claude', entry.id))}, with no shell and no -y. ` +
      'It loads in your next session. If its marketplace declares a command that runs at the install, that command is not run: the pane shows it with its sha256. ' +
      'A plugin runs its hooks and servers with your permissions from your next session on: install only one you trust.',
  )
}

/** The busy line while an install runs. */
export const installingText = (name: string): string => printable(`installing ${name}…`)

/** The toast of an install that worked. */
export const installedText = (name: string): string => printable(`${name} installed. It loads in your next session.`)

/** The message of an install that failed, with claude's own message or last line. */
export const installFailedText = (name: string, reason: string): string => printable(`install ${name} failed: ${reason}`)

/**
 * The message when the command claude showed belongs to another plugin than the one installed (a dependency, for example):
 * claude's own message, then that plugin, its command and its sha256, so the person sees what was declared. No line is
 * offered for it: whether --accept-command on this install would cover another plugin's command was not measured.
 */
export const otherPluginText = (name: string, id: string, message: string, shown: ShownCommand): string =>
  printable(
    `install ${name} failed: ${message} claude showed a command declared for ${shown.pluginId}, another plugin: ${shown.command} (sha256 ${shown.sha256}). ` +
      `It was not run, and the pane offers no line for it: run claude plugin install ${id} in your own terminal to review it.`,
  )
