# Trigger cases and evaluation scenarios

## Table of Contents

- [Trigger cases](#trigger-cases)
- [Boundary pairs](#boundary-pairs)
- [A message that spans two skills](#a-message-that-spans-two-skills)
- [Evaluation scenarios](#evaluation-scenarios)
- [Not run](#not-run)

Adapted from skills/skill-to-mod/evals/trigger-cases.md and evals/evals.json of arm-pz/skill-to-mod (MIT, see NOTICE), with the sibling skills replaced by the skills of this plugin. Status **read** means the case was decided by reading the descriptions only; none of them ran in a real triggering loop.

Siblings compared: `mods-tutorial-quickstart` (a new mod with no source skill), the `mods-doc-*` chapters (`mods-doc-mods-interfaces` for a drawing, `mods-doc-skills-reference` for writing or fixing a skill), and `mods-doc-automate-actions-with-hooks` (settings hooks).

## Trigger cases

| # | Message | Expected skill | Mode | Pass condition | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | "Can my release-checklist skill be a mod? I want it to run before every git push." | mods-skill-to-mod | check, then maybe build | Runs `check_skill.py`, states a verdict in five lines or fewer, builds nothing before that | read: pass |
| 2 | "Turn my deploy-notes skill into a mod." | mods-skill-to-mod | check, then scaffold | Checks `claude --version` first, runs the checker before scaffolding, names the plugin `deploy-notes-mod` | read: pass |
| 3 | "Should my code-review skill be a mod or stay a skill?" | mods-skill-to-mod | check only | Gives a verdict; on KEEP_SKILL generates no files and names a better fit | read: pass |
| 4 | "I keep forgetting to run my pre-ship checklist skill before pushing. Make Claude do it for me." | mods-skill-to-mod | HYBRID gate | Recognises the moment (push), proposes a gate, does not copy the checklist into the hooks | read: pass |
| 5 | "I want my context-guardian skill to show a live panel with how full the context is." | mods-skill-to-mod | MOD_FIRST, hand-written | Gives MOD_FIRST, writes the pane from `mods-doc-mods-interfaces`, keeps the skill text intact | read: pass, contested (`mods-doc-mods-interfaces` also matches "live panel"; it comes second, not first) |
| 6 | "Make me a mod that shows a pane with my current git branch." | mods-tutorial-quickstart and the chapters | n/a | No source skill, so mods-skill-to-mod stays out | read: pass |
| 7 | "My changelog skill never triggers when I ask for release notes. Fix it." | mods-doc-skills-reference | n/a | Edits the description; does not suggest a mod | read: pass |
| 8 | "Write me a new skill for reviewing SQL migrations." | mods-doc-skills-reference | n/a | Writes a skill; no mod mentioned | read: pass |
| 9 | "Add a pre-push hook to settings.json that runs ./check.sh." | mods-doc-automate-actions-with-hooks | n/a | No skill is involved, so mods-skill-to-mod does not start, though "before push" overlaps its wording | read: pass, fragile |

## Boundary pairs

| Message | Should trigger | Why |
| --- | --- | --- |
| "Make me a new skill that reminds me to run tests before pushing." | mods-doc-skills-reference | It writes a new skill. |
| "Make my existing test-reminder skill run before pushing." | mods-skill-to-mod | The skill exists and needs a moment. |
| "Give my context-guardian skill a status line entry." | mods-skill-to-mod | An existing skill plus a face. |
| "Add a status line entry showing the current git branch." | mods-tutorial-quickstart and the chapters | No source skill. |

## A message that spans two skills

"My release-gate skill doesn't trigger well. Fix its description, then turn it into a mod." Start with the description (`mods-doc-skills-reference`), then continue with mods-skill-to-mod on the fixed copy. The KEEP_SKILL step already points back to the description when the real problem is triggering.

## Evaluation scenarios

1. **release-gate, HYBRID.** "My release-gate skill is a checklist I want Claude to run before anything gets pushed or deployed, but it keeps forgetting to load it. Can you turn it into a mod so it can't be skipped? The skill is in ./skills/release-gate." Expected: runs the checker, reports HYBRID with the moment (ship commands) and the trust cost, writes a spec under `${CLAUDE_PLUGIN_DATA}/skill-to-mod/specs/`, scaffolds a plugin into a folder the user names that keeps the skill untouched, and ends with the verify step printing `RESULT: PASS`. Does not modify ./skills/release-gate. Says it is a reminder, not enforcement, and names the switches and the debug log.
2. **wordsmith, KEEP_SKILL.** "I have a skill called wordsmith that sets my writing voice and style rules for emails and blog posts. Should I make it a Claude Code mod?" Expected: runs the checker, concludes KEEP_SKILL with a short reason (no moment to hook, no interface), names what fits better or points at the description if it is not triggering, and generates no files.
3. **context-guardian, MOD_FIRST.** "Turn my context-guardian skill into a mod: I want a live panel showing how full the context window is, and a warning before it auto-compacts." Expected: runs the checker, concludes MOD_FIRST, says the scaffold does not cover panes, writes the pane from `mods-doc-mods-interfaces`, uses `session.measure` for the threshold and a pane or band for the display, keeps the trust surface to `$.ui.*` calls, gives every function a switch and a debug log, and verifies with the verify step.

## Not run

- Any message above against a live agent with this plugin installed.
- An automated triggering loop.
