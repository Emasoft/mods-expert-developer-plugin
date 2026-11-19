// What Claude Code itself answers for the events the plugin's hooks pass on, shared by the test worlds that start a
// session with the whole hooks module loaded: the start, a sent prompt, the classic session start, and a row the engine
// draws.
export function engineAnswers(on: any): void {
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
  on('classic.SessionStart', () => ({}))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine row'] }))
}
