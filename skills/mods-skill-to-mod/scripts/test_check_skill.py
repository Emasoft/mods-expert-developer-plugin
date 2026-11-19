#!/usr/bin/env python3
"""Regression tests for check_skill.py.

Run (the mods-skill-to-mod skill substitutes the variable on both sides):
  CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" python3 -I \\
    "${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/scripts/test_check_skill.py"

These cover wording that used to push ordinary skills to HYBRID. Each case writes a tiny skill to
a temporary folder and checks the verdict. Adapted from skills/skill-to-mod/scripts/test_check_skill.py
of arm-pz/skill-to-mod (MIT, see NOTICE): the cases are the source's, the path handling is new.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

# The oldest python3 these scripts were run on is the one macOS ships, 3.9.6: stop with the reason on an older one.
if sys.version_info < (3, 9):
    print(f"error: the mods-skill-to-mod scripts need Python 3.9 or later; this python3 is {sys.version.split()[0]}.", file=sys.stderr)
    sys.exit(2)

# The checker is found from CLAUDE_PLUGIN_ROOT, as the checker finds its own siblings, never from this
# file's location: the suite must test the copy the skill would run.
sys.dont_write_bytecode = True  # the install folder is replaced on every update: no __pycache__ there
_ROOT = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
CHECK = Path(_ROOT, "skills", "mods-skill-to-mod", "scripts", "check_skill.py")
if not _ROOT or not CHECK.is_file():
    _why = "is not set" if not _ROOT else f"is {_ROOT}, which holds no skills/mods-skill-to-mod/scripts/check_skill.py"
    print(f"error: CLAUDE_PLUGIN_ROOT {_why}. Run this suite the way the mods-skill-to-mod skill shows, "
          'with CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" in front of python3.', file=sys.stderr)
    sys.exit(2)
FILLER = " ".join(["Write clear, short sentences and keep the author's voice."] * 12)


def verdict_for(description, body):
    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp) / "demo"
        folder.mkdir()
        (folder / "SKILL.md").write_text(
            "---\nname: demo\ndescription: " + description + "\n---\n\n# Demo\n\n" + body + "\n",
            encoding="utf-8",
        )
        # The child inherits CLAUDE_PLUGIN_ROOT from this process; -I does not drop it.
        out = subprocess.run([sys.executable, "-I", str(CHECK), str(folder)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


# cspell:ignore scaffoldable  (a key of the checker's JSON report)
class CheckSkill(unittest.TestCase):
    def test_trigger_wording_in_description_is_not_a_moment(self):
        r = verdict_for("Edits prose. Use when the user wants clearer, shorter writing.", FILLER)
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_an_instruction_about_the_user_is_not_a_moment(self):
        r = verdict_for("Runs a review.", FILLER + "\nIf the user says stop, stop.")
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_compact_as_an_adjective_is_not_compaction(self):
        r = verdict_for("Checks a site.", FILLER + "\nRequests a compact path set and nothing else.")
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_one_passing_mention_of_compaction_is_weak(self):
        r = verdict_for("Runs a review.", FILLER + "\nIf your context gets compacted mid-run, nothing is lost.")
        self.assertEqual(r["verdict"], "KEEP_SKILL")
        self.assertTrue(any(w["id"] == "context-or-compaction" for w in r["weak_signals"]))

    def test_a_single_weak_signal_is_not_enough(self):
        r = verdict_for("Runs a review.", FILLER + "\nIt runs automatically for the chosen files.")
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_launching_agents_is_not_launching_a_product(self):
        r = verdict_for("Runs agents in waves.", FILLER + "\nWait until every agent has replied before you launch the next wave.")
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_before_launch_as_a_noun_is_a_moment(self):
        r = verdict_for("Audits a web app before launch.", FILLER)
        self.assertEqual(r["verdict"], "HYBRID")

    def test_checklist_before_shipping_is_hybrid(self):
        r = verdict_for("Release checklist. Run before pushing or deploying.", FILLER)
        self.assertEqual(r["verdict"], "HYBRID")
        self.assertIn("gate", r["scaffoldable_patterns"])

    def test_quoted_user_phrase_in_body_counts_with_a_stronger_signal(self):
        body = FILLER + '\nWhen the user says "ship it", run the checklist before pushing.'
        r = verdict_for("Release checklist.", body)
        self.assertEqual(r["verdict"], "HYBRID")
        self.assertIn("prime", r["scaffoldable_patterns"])

    def test_live_panel_is_mod_first(self):
        r = verdict_for("Shows a live panel.", "A live view panel showing context usage. Warn when the context window fills or before compaction.")
        self.assertEqual(r["verdict"], "MOD_FIRST")

    def test_use_whenever_the_user_wants_to_edit_is_trigger_wording(self):
        r = verdict_for("Use this skill whenever the user wants to create, read, edit or fix reports.", FILLER)
        self.assertEqual(r["verdict"], "KEEP_SKILL")
        self.assertEqual(r["events"], [])

    def test_how_to_notes_that_say_after_you_edit_or_on_every_cell_are_not_moments(self):
        body = FILLER + "\nDuplicating after you edit clones the edited content. Set width on every cell and on every row."
        r = verdict_for("Builds tables.", body)
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_after_editing_files_is_a_moment(self):
        r = verdict_for("Runs the formatter after editing any source file.", FILLER)
        self.assertEqual([e["id"] for e in r["events"]], ["after-edit"])

    def test_skill_to_skill_handoff_is_not_a_context_handoff(self):
        body = FILLER + "\nWrite the handoff contract. Pass the handoff block to the sibling. Each handoff names its owner."
        r = verdict_for("Tunes skills.", body)
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_a_browser_pane_is_not_a_mod_surface(self):
        body = FILLER + "\nThe browser pane keeps sign-ins. Open the browser pane first, then use the pane's tabs."
        r = verdict_for("Drives the in-app browser.", body)
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_one_interface_word_is_not_a_theme(self):
        r = verdict_for("Writes slides.", FILLER + "\nNothing else on the page is a toast.")
        self.assertEqual(r["verdict"], "KEEP_SKILL")

    def test_the_note_names_the_rubric_under_the_install_folder(self):
        r = verdict_for("Runs a review.", FILLER)
        expected = Path(_ROOT).resolve() / "skills" / "mods-skill-to-mod" / "references" / "suitability.md"
        self.assertIn(str(expected), r["note"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
