"""README tests (TRDD-ZQ0S5X07): the README names the command in its mods- form and holds no retired command name."""

import re
from pathlib import Path

README = Path(__file__).resolve().parents[1] / "README.md"
_SLASH = "/"  # assembled from parts so this file holds no slash form of the retired command name
NEW_COMMAND = _SLASH + "mods-manager"
OLD_COMMAND = re.compile(r"(?<![\w.])" + _SLASH + "mod-manager" + r"(?![\w/-])")


def test_readme_names_the_mods_manager_command():
    """README names the command as /mods-manager."""
    assert NEW_COMMAND in README.read_text(encoding="utf-8")


def test_readme_holds_no_retired_command_name():
    """README holds no retired command name, only paths that name the folder."""
    assert OLD_COMMAND.search(README.read_text(encoding="utf-8")) is None


def test_pattern_matches_the_command_and_not_the_paths():
    """The pattern matches the retired command name and not a path, a plugin folder or the new name."""
    assert OLD_COMMAND.search("`" + _SLASH + "mod-manager`") is not None
    assert OLD_COMMAND.search(_SLASH + "mod-manager close") is not None
    assert OLD_COMMAND.search("hooks" + _SLASH + "mod-manager" + _SLASH) is None
    assert OLD_COMMAND.search("plugins" + _SLASH + "mod-manager") is None
    assert OLD_COMMAND.search(NEW_COMMAND) is None
