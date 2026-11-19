"""Tests for scripts/fetch_no_copy_sources.py, which fetches the no-copy test's pinned public commits (TRDD-R2GILGKU).

One test per guard of the script: a folder whose origin is not the table's URL is refused and never repointed; a folder
that already holds its commit is not fetched again; git may use https only, so a local file URL is refused; neither the
user's git configuration nor an inherited GIT_* variable applies (a URL rewrite, a GIT_DIR, a default object format),
and only the two CA variables pass through; every call carries those switches, names the pin folder's repository
explicitly, ignores replace refs and the init fixes the formats (logged by a fake git); a pin folder's own hooks folder,
file-system monitor and askpass program never run, nor does SSH_ASKPASS; a partial .git inside another repository is
refused and that repository is neither read nor written; a pin folder that was there before the run is reset to the
script's own .git layout, its configuration replaced in one rename, refused when it or its .git is a link or a gitdir
file or anything under its .git is a link (nothing is written through one), and refused when git fsck finds an altered
object, with a remedy that names ci.yml's cache only on GitHub Actions; a failed
fetch is tried once more and then names what to check, and a TLS or proxy failure names the variables to set; a
timeout and a missing git come back as failure reasons, not tracebacks; each failure is printed when it happens; a git
older than 2.32 is refused; the run deadline caps each fetch and stops the run in time; --prune removes what no pin
names; the ci.yml cache key is the pin table's hash. No test here reaches the network: each one that could fetch
forbids https to git (NO_NETWORK), runs a fake git, or asks a local server that answers only 401.
"""

from __future__ import annotations

import contextlib
import http.server
import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import zlib
from collections.abc import Iterator
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest
import yaml

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
# GIT_ALLOW_PROTOCOL lists the only protocols git may use and overrides the script's own protocol settings; with just
# "ext" an https fetch is refused at once.
NO_NETWORK = {"GIT_ALLOW_PROTOCOL": "ext"}


def _load_fetch() -> ModuleType:
    """Load the fetch script as a module; its `import excerpt_lock` resolves through scripts/ only while it loads."""
    sys.path.insert(0, str(SCRIPTS))
    try:
        spec = importlib.util.spec_from_file_location("fetch_no_copy_sources", SCRIPTS / "fetch_no_copy_sources.py")
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    finally:
        sys.path.remove(str(SCRIPTS))
    return module


fetch_script = _load_fetch()
excerpt_lock = fetch_script.excerpt_lock
CCWHOAMI = excerpt_lock.NO_COPY_SOURCES["qodfathr__ccwhoami"][0]


def _origin(folder: Path) -> str:
    """Read a folder's origin URL through the script's git helper, so no URL rewrite of this machine changes it."""
    return str(fetch_script.git(folder, "remote", "get-url", "origin").stdout.strip())


FETCH = "uv run scripts/fetch_no_copy_sources.py"


def _require_fetched() -> None:
    """Fail naming the fetch command when a pinned commit is not on disk, before a test touches the real pin folders.

    Without it, a test that reads the real folders fails with a bare git error, or creates an empty pin repository
    there (fetch makes the folder before it fetches), when the sources were never fetched; the CI lanes still run then
    (TRDD-R2GILGKU).
    """
    every_pin = [pin for pins in excerpt_lock.NO_COPY_SOURCES.values() for pin in pins]
    missing = [pin for pin in every_pin if not fetch_script.has_commit(excerpt_lock.no_copy_dir(pin), pin.commit)]
    if missing:
        pytest.fail(f"{len(missing)} no-copy source(s) not fetched, first {missing[0].repo} at {missing[0].commit}; fetch them with: {FETCH}")


def test_a_folder_whose_origin_differs_is_refused_and_not_repointed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pin folder whose origin is not the table's URL is refused, and its origin is left as it was."""
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    folder: Path = excerpt_lock.no_copy_dir(CCWHOAMI)
    folder.mkdir(parents=True)
    other = "https://github.com/someone-else/ccwhoami"
    subprocess.run(["git", "init", "--quiet", str(folder)], check=True)
    subprocess.run(["git", "-C", str(folder), "remote", "add", "origin", other], check=True)
    reason = fetch_script.fetch(CCWHOAMI)
    assert reason is not None and f"origin is {other}" in reason and CCWHOAMI.repo in reason, reason
    assert _origin(folder) == other


def test_a_present_commit_is_not_fetched_again(monkeypatch: pytest.MonkeyPatch) -> None:
    """Every fetched pin is left as it is: with https forbidden to git, a second fetch attempt would fail this test."""
    _require_fetched()
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, **NO_NETWORK})
    for pins in excerpt_lock.NO_COPY_SOURCES.values():
        for pin in pins:
            reason = fetch_script.fetch(pin)
            assert reason is None, reason


def test_git_refuses_a_local_file_url(tmp_path: Path) -> None:
    """The script's git helper allows https only, so a file:// URL can never make it read a local repository."""
    source = tmp_path / "local-source"
    subprocess.run(["git", "init", "--quiet", str(source)], check=True)
    subprocess.run(
        ["git", "-C", str(source), "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "--quiet", "--allow-empty", "-m", "x"],
        check=True,
    )
    commit = subprocess.run(["git", "-C", str(source), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    folder = tmp_path / "pin"
    folder.mkdir()
    subprocess.run(["git", "init", "--quiet", str(folder)], check=True)
    done = fetch_script.git(folder, "fetch", "--depth", "1", "--no-tags", f"file://{source}", commit)
    assert done.returncode != 0 and "not allowed" in done.stderr, (done.returncode, done.stderr)


def test_the_users_git_configuration_is_ignored(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A URL rewrite in the user's git configuration, in ~/.gitconfig or where GIT_CONFIG_GLOBAL points, does not change the origin the script compares with the table."""
    _require_fetched()
    rewrite = '[url "https://example.invalid/"]\n\tinsteadOf = https://github.com/\n'
    home = tmp_path / "home"
    home.mkdir()
    (home / ".gitconfig").write_text(rewrite, encoding="utf-8")
    (tmp_path / "global.cfg").write_text(rewrite, encoding="utf-8")
    monkeypatch.setenv("HOME", str(home))
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", str(tmp_path / "global.cfg"))
    folder = excerpt_lock.no_copy_dir(CCWHOAMI)
    rewritten = CCWHOAMI.repo.replace("https://github.com/", "https://example.invalid/")
    # The test can fail: a git that reads the user's configuration, from either place, does see the rewritten URL.
    for env in (dict(os.environ), {key: value for key, value in os.environ.items() if key != "GIT_CONFIG_GLOBAL"}):
        plain = subprocess.run(["git", "-C", str(folder), "remote", "get-url", "origin"], capture_output=True, text=True, env=env, check=False)
        assert plain.stdout.strip() == rewritten, (plain.stdout, plain.stderr)
    script = _load_fetch()  # the script builds its git environment from the environment it starts in
    monkeypatch.setattr(script, "ENV", {**script.ENV, **NO_NETWORK})
    for pins in excerpt_lock.NO_COPY_SOURCES.values():
        for pin in pins:
            assert script.fetch(pin) is None, pin


def test_a_new_pin_folder_is_made_in_place_as_sha1_whatever_the_environment_says(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Inherited GIT_* variables neither move a new pin repository (GIT_DIR) nor change its format (GIT_DEFAULT_HASH)."""
    elsewhere = tmp_path / "elsewhere.git"
    monkeypatch.setenv("GIT_DIR", str(elsewhere))
    monkeypatch.setenv("GIT_DEFAULT_HASH", "sha256")
    script = _load_fetch()
    monkeypatch.setattr(script, "ENV", {**script.ENV, **NO_NETWORK})
    monkeypatch.setattr(script, "RETRY_PAUSE", 0, raising=False)
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    assert script.fetch(CCWHOAMI) is not None, "https is forbidden here, so the fetch must fail after the folder is made"
    assert not elsewhere.exists(), "an inherited GIT_DIR redirected the script's git away from the pin folder"
    folder = excerpt_lock.no_copy_dir(CCWHOAMI)
    object_format = script.git(folder, "rev-parse", "--show-object-format").stdout.strip()
    # A files ref store keeps refs/heads as a folder (the other store writes a stub file there).
    assert (object_format, (folder / ".git" / "refs" / "heads").is_dir()) == ("sha1", True)


def test_a_failed_fetch_is_retried_once_and_names_what_to_check(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A fetch that fails is tried once more, then the reason names the commit page to check and the two ways out."""
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, **NO_NETWORK})
    monkeypatch.setattr(fetch_script, "RETRY_PAUSE", 0, raising=False)
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    real_git = fetch_script.git
    fetches: list[tuple[str, ...]] = []

    def counting_git(folder: Path, *args: str, **kwargs: Any) -> Any:
        if args[:1] == ("fetch",):
            fetches.append(args)
        return real_git(folder, *args, **kwargs)

    monkeypatch.setattr(fetch_script, "git", counting_git)
    reason = fetch_script.fetch(CCWHOAMI)
    assert len(fetches) == 2, fetches
    assert reason is not None and f"{CCWHOAMI.repo}/commit/{CCWHOAMI.commit}" in reason and "NO_COPY_AVAILABLE" in reason, reason


def test_a_git_timeout_is_a_failure_reason_not_a_traceback(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A git command that outlives the timeout comes back as a failed result that says so, instead of raising."""
    monkeypatch.setattr(fetch_script, "FETCH_TIMEOUT", 1e-6, raising=False)
    done = fetch_script.git(tmp_path, "--version")
    assert done.returncode != 0 and "timed out" in done.stderr, (done.returncode, done.stderr)


def test_a_missing_git_is_a_failure_reason_not_a_traceback(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """With no git on PATH, a pin fails with a reason that says so, instead of raising."""
    empty = tmp_path / "empty-path"
    empty.mkdir()
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, "PATH": str(empty)})
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    reason = fetch_script.fetch(CCWHOAMI)
    assert reason is not None and "git was not found" in reason, reason


def test_each_failure_is_printed_when_it_happens(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """main() prints each pin's reason right after its FAILED line, not all at the end, so a run cut short still shows why."""
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, **NO_NETWORK})
    monkeypatch.setattr(fetch_script, "RETRY_PAUSE", 0, raising=False)
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        assert fetch_script.main() == 1
    lines = out.getvalue().splitlines()
    failed = [i for i, line in enumerate(lines) if line.startswith("FAILED ")]
    assert len(failed) == sum(len(pins) for pins in excerpt_lock.NO_COPY_SOURCES.values()), lines
    for i in failed:
        assert lines[i].split()[-1] in lines[i + 1], lines[i : i + 2]


# Every pin of the real table, kept before any test replaces the table.
ALL_PINS = excerpt_lock.NO_COPY_SOURCES
ONE_PIN = {"qodfathr__ccwhoami": (CCWHOAMI,)}
# The -c settings every git call must carry before -C, written out here instead of read from the script, so a setting
# deleted from the script turns a test red instead of vanishing from both sides.
EVERY_CALL_SETTINGS = {
    "protocol.allow=never",
    "protocol.https.allow=always",
    "credential.helper=",
    "core.askPass=",
    "core.fsmonitor=",
    f"core.hooksPath={os.devnull}",
}
# A stand-in for git, run by _fake_git's wrapper with config.json next to it.
FAKE_GIT = """\
import json
import os
import sys
from pathlib import Path

here = Path(__file__).parent
config = json.loads((here / "config.json").read_text(encoding="utf-8"))
args = sys.argv[1:]
with open(here / "calls.jsonl", "a", encoding="utf-8") as log:
    log.write(json.dumps({"argv": args, "env": {k: v for k, v in os.environ.items() if k.startswith("GIT_")}}) + "\\n")
if "--version" in args:
    print(config["version"])
elif "init" in args:
    Path(args[args.index("-C") + 1], ".git").mkdir(parents=True, exist_ok=True)
elif "--absolute-git-dir" in args:
    print(os.path.realpath(next(arg for arg in args if arg.startswith("--git-dir=")).split("=", 1)[1]))
elif "fetch" in args and config["fetch_error"]:
    print(config["fetch_error"], file=sys.stderr)
    sys.exit(128)
"""


def _fake_git(folder: Path, version: str = "git version 2.56.0", fetch_error: str = "") -> Path:
    """Make `folder` hold a fake `git` that logs each call's argv and GIT_* environment to calls.jsonl, and return it.

    It prints `version` for --version, makes the .git folder on init, fails a fetch with `fetch_error` when one is given,
    and succeeds at every other call, so fetch() and main() run every step with no real git and no network.
    """
    folder.mkdir(parents=True)
    (folder / "fake_git.py").write_text(FAKE_GIT, encoding="utf-8")
    (folder / "config.json").write_text(json.dumps({"version": version, "fetch_error": fetch_error}), encoding="utf-8")
    wrapper = folder / "git"
    wrapper.write_text(f'#!/bin/sh\nexec "{sys.executable}" -I "{folder / "fake_git.py"}" "$@"\n', encoding="utf-8")
    wrapper.chmod(0o755)
    return folder


def _calls(fake: Path) -> list[dict[str, Any]]:
    """Return the calls the fake git in `fake` logged, in order; none when it was never called."""
    log = fake / "calls.jsonl"
    return [json.loads(line) for line in log.read_text(encoding="utf-8").splitlines()] if log.exists() else []


def _use_fake_git(script: ModuleType, fake: Path, root: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Make `script` run the fake git in `fake`, the only folder on its PATH, with one pin whose folders go under `root`."""
    monkeypatch.setattr(script, "ENV", {**script.ENV, "PATH": str(fake)})
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", root)
    monkeypatch.setattr(excerpt_lock, "NO_COPY_SOURCES", ONE_PIN)


def test_every_git_call_carries_the_switches_and_the_init_fixes_the_formats(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Every git call runs with the global and system configuration off, https only and a pin folder's own risky settings off, and the init asks for sha1 objects and files refs whatever git's own defaults are (a fake git logs each call)."""
    fake = _fake_git(tmp_path / "bin")
    _use_fake_git(fetch_script, fake, tmp_path / "no-copy-sources", monkeypatch)
    assert fetch_script.fetch(CCWHOAMI) is None
    calls = _calls(fake)
    # A new pin folder takes four calls: init, the repository check, fetch and the commit check (the script writes the
    # configuration itself).
    assert len(calls) == 4, calls
    # Each call names the pin folder's repository itself, so git never searches the folders above (TRDD-R2GILGKU M1).
    named = {f"--git-dir={excerpt_lock.no_copy_dir(CCWHOAMI) / '.git'}", f"--work-tree={excerpt_lock.no_copy_dir(CCWHOAMI)}"}
    for call in calls:
        head = call["argv"][: call["argv"].index("-C")]
        assert EVERY_CALL_SETTINGS <= {head[i + 1] for i, word in enumerate(head) if word == "-c"}, call
        assert (call["env"].get("GIT_CONFIG_NOSYSTEM"), call["env"].get("GIT_CONFIG_GLOBAL")) == ("1", os.devnull), call
        assert named <= set(call["argv"]), call
    init = [call["argv"] for call in calls if "init" in call["argv"]]
    assert len(init) == 1 and "--object-format=sha1" in init[0] and "init.defaultRefFormat=files" in init[0], init
    assert init[0][init[0].index("init.defaultRefFormat=files") - 1] == "-c", init


def test_only_the_two_ca_variables_pass_through_to_git(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """GIT_SSL_CAINFO and GIT_SSL_CAPATH reach git, since the ignored git configuration can no longer name a CA bundle; every other inherited GIT_* variable, one that turns certificate checks off included, is still dropped."""
    ca = {"GIT_SSL_CAINFO": str(tmp_path / "ca.pem"), "GIT_SSL_CAPATH": str(tmp_path / "certs")}
    for key, value in {**ca, "GIT_DIR": str(tmp_path / "elsewhere.git"), "GIT_SSL_NO_VERIFY": "1"}.items():
        monkeypatch.setenv(key, value)
    script = _load_fetch()  # the script builds its git environment from the environment it starts in
    fake = _fake_git(tmp_path / "bin")
    _use_fake_git(script, fake, tmp_path / "no-copy-sources", monkeypatch)
    assert script.fetch(CCWHOAMI) is None
    expected = {**ca, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1", "GIT_TERMINAL_PROMPT": "0", "GIT_NO_REPLACE_OBJECTS": "1"}
    calls = _calls(fake)
    assert calls and all(call["env"] == expected for call in calls), calls


def _repo_with_a_commit(folder: Path, files: dict[str, str] | None = None) -> str:
    """Make `folder` a git repository with one commit holding `files` (an empty commit when none), through the script's git, and return the commit."""
    folder.mkdir(parents=True)
    for name, text in (files or {}).items():
        (folder / name).write_text(text, encoding="utf-8")
    commit = ("-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "--quiet", "--allow-empty", "-m", "x")
    for args in (("init", "--quiet"), ("add", "--all"), commit):
        assert fetch_script.git(folder, *args).returncode == 0, args
    return str(fetch_script.git(folder, "rev-parse", "HEAD").stdout.strip())


def _marker_script(script: Path, marker: Path, code: int) -> None:
    """Write an executable shell script that creates `marker` and exits with `code`."""
    script.write_text(f"#!/bin/sh\ntouch '{marker}'\nexit {code}\n", encoding="utf-8")
    script.chmod(0o755)


def test_a_pin_folders_own_hooks_folder_never_runs(tmp_path: Path) -> None:
    """A hooks folder named in a pin folder's own .git/config, which a restored CI cache keeps, never runs through the script's git: a fetch writes the pin ref, and a ref update runs the reference-transaction hook."""
    repo = tmp_path / "pin"
    commit = _repo_with_a_commit(repo)
    hooks = tmp_path / "hooks"
    hooks.mkdir()
    marker = tmp_path / "hook-ran"
    _marker_script(hooks / "reference-transaction", marker, 0)
    assert fetch_script.git(repo, "config", "core.hooksPath", str(hooks)).returncode == 0
    # The test can fail: a git with the script's environment but without its switches does run the hook.
    subprocess.run(["git", "-C", str(repo), "update-ref", "refs/control", commit], env=fetch_script.ENV, check=True)
    assert marker.exists()
    marker.unlink()
    assert fetch_script.git(repo, "update-ref", fetch_script.REF, commit).returncode == 0
    assert not marker.exists()


def test_a_pin_folders_own_file_system_monitor_never_runs(tmp_path: Path) -> None:
    """A file-system monitor command named in a pin folder's own .git/config never runs through the script's git."""
    repo = tmp_path / "pin"
    _repo_with_a_commit(repo)
    marker = tmp_path / "monitor-ran"
    monitor = tmp_path / "monitor.sh"
    _marker_script(monitor, marker, 1)
    assert fetch_script.git(repo, "config", "core.fsmonitor", str(monitor)).returncode == 0
    # The test can fail: a git with the script's environment but without its switches does run the monitor.
    subprocess.run(["git", "-C", str(repo), "status"], env=fetch_script.ENV, capture_output=True, check=False)
    assert marker.exists()
    marker.unlink()
    assert fetch_script.git(repo, "status").returncode == 0
    assert not marker.exists()



@contextlib.contextmanager
def _server_answering_401() -> Iterator[str]:
    """Serve a local http URL that answers every request with 401, as GitHub does for a deleted or private repository, so git asks for credentials; yield the URL and stop the server afterwards."""

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            self.send_response(401)
            self.send_header("WWW-Authenticate", 'Basic realm="no-copy test"')
            self.send_header("Content-Length", "0")
            self.end_headers()

        def log_message(self, *args: Any) -> None:
            """Keep the request log out of the test output."""

    server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}/a/b"
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def test_a_pin_folders_own_askpass_program_and_ssh_askpass_never_run(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """An askpass program named in a pin folder's own .git/config, or in SSH_ASKPASS, never runs through the script's git when a server asks for credentials (the server here is local, so this test alone allows http)."""
    with_config, plain = tmp_path / "with-config", tmp_path / "plain"
    _repo_with_a_commit(with_config)
    _repo_with_a_commit(plain)
    ran = {"config": tmp_path / "config-askpass-ran", "env": tmp_path / "ssh-askpass-ran"}
    for name, marker in ran.items():
        _marker_script(tmp_path / f"{name}.sh", marker, 0)
    assert fetch_script.git(with_config, "config", "core.askPass", str(tmp_path / "config.sh")).returncode == 0
    # No proxy variable, so git reaches the local server; SSH_ASKPASS is what git runs when no askpass is configured.
    env = {key: value for key, value in fetch_script.ENV.items() if "proxy" not in key.lower()}
    monkeypatch.setattr(fetch_script, "ENV", {**env, "SSH_ASKPASS": str(tmp_path / "env.sh")})
    monkeypatch.setattr(fetch_script, "HTTPS_ONLY", ("-c", "protocol.allow=always"))
    with _server_answering_401() as url:
        for repo, marker in ((with_config, ran["config"]), (plain, ran["env"])):
            # The test can fail: a git with the script's environment but without its switches does run the program.
            subprocess.run(["git", "-c", "protocol.allow=always", "-C", str(repo), "ls-remote", url], env=fetch_script.ENV, capture_output=True, check=False)
            assert marker.exists(), marker
            marker.unlink()
            assert fetch_script.git(repo, "ls-remote", url).returncode != 0
            assert not marker.exists(), marker


def _local_pin(root: Path, name: str) -> tuple[Any, Path]:
    """Make a pin folder, under the NO_COPY_ROOT the test set, for a local repository with one commit holding a.md and its origin set to the pin's own URL; return the pin and its folder."""
    staging = root / f"staging-{name}"
    commit = _repo_with_a_commit(staging, {"a.md": "original\n"})
    pin = CCWHOAMI._replace(repo=f"https://github.com/someone/{name}", commit=commit)
    folder: Path = excerpt_lock.no_copy_dir(pin)
    folder.parent.mkdir(parents=True, exist_ok=True)
    staging.rename(folder)
    assert fetch_script.git(folder, "remote", "add", "origin", pin.repo).returncode == 0
    return pin, folder


# The whole .git/config of a pin folder, written out here instead of read from the script, so a key the script adds to it
# or drops from it turns the test red.
PIN_CONFIG = '[core]\n\trepositoryformatversion = 0\n\tbare = false\n[remote "origin"]\n\turl = {repo}\n'


def test_a_pin_folder_from_before_the_run_is_reset_to_the_scripts_own_layout(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pin folder that was there before the run, as a restored CI cache leaves it, is reset before git reads it: its .git/config becomes the script's own (no askpass program, ssh command, include, URL rewrite or extra header survives), its hooks folder is emptied, and its info folder, replace refs, common-folder pointer and alternates are removed."""
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, **NO_NETWORK})
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    pin, folder = _local_pin(tmp_path, "restored")
    gitdir = folder / ".git"
    elsewhere = tmp_path / "elsewhere"
    _repo_with_a_commit(elsewhere)
    planted = {
        "core.askPass": str(tmp_path / "askpass.sh"),
        "core.sshCommand": str(tmp_path / "ssh.sh"),
        "include.path": str(tmp_path / "included.cfg"),
        "url.https://example.invalid/.insteadOf": "https://github.com/",
        "http.extraHeader": "X-Test: 1",
    }
    for key, value in planted.items():
        assert fetch_script.git(folder, "config", key, value).returncode == 0, key
    assert fetch_script.git(folder, "update-ref", "refs/replace/" + "1" * 40, pin.commit).returncode == 0
    for sub in ("hooks", "info", "objects/info"):
        (gitdir / sub).mkdir(exist_ok=True)
    (gitdir / "hooks" / "reference-transaction").write_text("#!/bin/sh\n", encoding="utf-8")
    (gitdir / "info" / "attributes").write_text("* diff=planted\n", encoding="utf-8")
    (gitdir / "objects" / "info" / "alternates").write_text(f"{elsewhere / '.git' / 'objects'}\n", encoding="utf-8")
    (gitdir / "objects" / "info" / "http-alternates").write_text("https://example.invalid/objects\n", encoding="utf-8")
    # A common-folder pointer makes git read the other repository's configuration instead of this one's.
    (gitdir / "commondir").write_text(f"{elsewhere / '.git'}\n", encoding="utf-8")
    assert fetch_script.fetch(pin) is None
    assert (gitdir / "config").read_text(encoding="utf-8") == PIN_CONFIG.format(repo=pin.repo)
    local = fetch_script.git(folder, "config", "--local", "--list").stdout.split()
    assert local == ["core.repositoryformatversion=0", "core.bare=false", f"remote.origin.url={pin.repo}"], local
    assert list((gitdir / "hooks").iterdir()) == []
    gone = ("info", "refs/replace", "commondir", "objects/info/alternates", "objects/info/http-alternates")
    assert [name for name in gone if os.path.lexists(gitdir / name)] == []


@pytest.mark.parametrize("runner", ["local", "github-actions"])
@pytest.mark.parametrize("storage", ["loose", "packed"])
def test_a_pin_folder_from_before_the_run_whose_objects_were_altered_is_refused(storage: str, runner: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pin folder that was there before the run is checked with git fsck, since git reads an object without checking it against its name: an altered loose object or pack is refused, where git alone would read the altered text as the pinned commit's file, and the remedy names ci.yml's cache entry only on GitHub Actions and the local folder elsewhere."""
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, **NO_NETWORK})
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    # GitHub Actions sets GITHUB_ACTIONS=true; any other value, or none, is a local run.
    monkeypatch.setenv("GITHUB_ACTIONS", "true" if runner == "github-actions" else "")
    pin, folder = _local_pin(tmp_path, storage)
    blob = fetch_script.git(folder, "rev-parse", f"{pin.commit}:a.md").stdout.strip()
    if storage == "loose":
        target = folder / ".git" / "objects" / blob[:2] / blob[2:]
        body = b"substituted\n"
        altered = zlib.compress(b"blob %d\0" % len(body) + body)
    else:
        assert fetch_script.git(folder, "repack", "-a", "-d", "-q").returncode == 0
        (target,) = (folder / ".git" / "objects" / "pack").glob("*.pack")
        flipped = bytearray(target.read_bytes())
        flipped[len(flipped) // 2] ^= 0xFF
        altered = bytes(flipped)
    target.chmod(0o644)
    target.write_bytes(altered)
    if storage == "loose":
        # The test can fail: git reads the altered object as the commit's file without a word.
        assert fetch_script.git(folder, "show", f"{pin.commit}:a.md").stdout == "substituted\n"
    reason = fetch_script.fetch(pin)
    assert reason is not None and "git fsck" in reason, reason
    # The remedy fits where the folder came from (TRDD-R2GILGKU L3): only GitHub Actions restores it from ci.yml's cache.
    on_ci = runner == "github-actions"
    assert ("gh cache delete" in reason, "It is a local folder" in reason) == (on_ci, not on_ci), reason


@pytest.mark.parametrize(
    "shape", ["the .git folder is a link", "the .git folder is a gitdir file", "the pin folder is a link", "the objects folder is a link"]
)
def test_a_pin_folder_reached_through_a_link_or_a_gitdir_file_is_refused(shape: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pin folder, its .git or its .git/objects that is a link, or a .git that is a gitdir file, is refused and the repository it points to is left as it was, since git would follow it and the reset would write there; that repository holding the pinned commit with the right origin does not change this."""
    monkeypatch.setattr(fetch_script, "ENV", {**fetch_script.ENV, **NO_NETWORK})
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    pin, folder = _local_pin(tmp_path, "linked")
    elsewhere = tmp_path / "elsewhere"
    folder.rename(elsewhere)
    if shape == "the pin folder is a link":
        folder.symlink_to(elsewhere)
    elif shape == "the objects folder is a link":
        shutil.copytree(elsewhere, folder, symlinks=True)
        shutil.rmtree(folder / ".git" / "objects")
        (folder / ".git" / "objects").symlink_to(elsewhere / ".git" / "objects")
    else:
        folder.mkdir()
        if shape == "the .git folder is a link":
            (folder / ".git").symlink_to(elsewhere / ".git")
        else:
            (folder / ".git").write_text(f"gitdir: {elsewhere / '.git'}\n", encoding="utf-8")
    config = (elsewhere / ".git" / "config").read_text(encoding="utf-8")
    reason = fetch_script.fetch(pin)
    # The objects folder sits inside .git, so the walk for links refuses it; the others are refused before the walk.
    expected = "a link inside .git" if shape == "the objects folder is a link" else "not a folder"
    assert reason is not None and expected in reason, reason
    assert (elsewhere / ".git" / "config").read_text(encoding="utf-8") == config


def _upstream(tmp_path: Path) -> tuple[Path, str]:
    """Make a local upstream repository with one commit holding a.md, and return it and the commit."""
    upstream = tmp_path / "upstream"
    return upstream, _repo_with_a_commit(upstream, {"a.md": "upstream\n"})


def _files_under(folder: Path) -> list[tuple[str, bytes]]:
    """Return every file under `folder` with its bytes, sorted, so a test sees any write there."""
    return sorted((str(path.relative_to(folder)), path.read_bytes()) for path in folder.rglob("*") if path.is_file())


def test_a_partial_git_folder_never_lets_git_reach_the_repository_around_it(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pin folder whose .git holds only a configuration (a run or a cache cut short) inside another repository, as downloads_dev sits inside the project checkout, is refused: git never searches upward, so the fetch neither checks nor writes the enclosing repository (TRDD-R2GILGKU M1)."""
    upstream, commit = _upstream(tmp_path)
    outer = tmp_path / "outer"
    _repo_with_a_commit(outer, {"o.md": "outer\n"})
    assert fetch_script.git(outer, "remote", "add", "origin", f"file://{upstream}").returncode == 0
    # The file:// origin stands in for the https origin of a project checkout; the script itself allows https only.
    monkeypatch.setattr(fetch_script, "HTTPS_ONLY", ("-c", "protocol.allow=always"))
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", outer / "downloads_dev" / "no-copy-sources")
    pin = CCWHOAMI._replace(repo="https://github.com/someone/partial", commit=commit)
    gitdir = excerpt_lock.no_copy_dir(pin) / ".git"
    gitdir.mkdir(parents=True)
    (gitdir / "config").write_text(PIN_CONFIG.format(repo=pin.repo), encoding="utf-8")
    state = [("for-each-ref",), ("count-objects", "-v")]
    before = [fetch_script.git(outer, *args).stdout for args in state]
    reason = fetch_script.fetch(pin)
    assert reason is not None and "does not open it as this pin's own repository" in reason, reason
    assert [fetch_script.git(outer, *args).stdout for args in state] == before


@pytest.mark.parametrize("inside", ["objects/<fan-out>", "objects", "refs/no-copy", "shallow"])
def test_a_link_anywhere_inside_git_is_refused_and_nothing_is_written_through_it(inside: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A link anywhere under a pin folder's .git, which a restored cache can carry (an object fan-out folder, the objects folder, a ref folder, the shallow file), is refused before git runs there, and nothing is written where it points: through a linked fan-out folder git would store the fetched pin's objects outside the pin folder (TRDD-R2GILGKU M2)."""
    upstream, commit = _upstream(tmp_path)
    pin = CCWHOAMI._replace(repo="https://github.com/someone/linked", commit=commit)
    # The pin's URL reaches the local upstream; the script itself allows https only.
    monkeypatch.setattr(fetch_script, "HTTPS_ONLY", ("-c", "protocol.allow=always", "-c", f"url.file://{upstream}.insteadOf={pin.repo}"))
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    folder: Path = excerpt_lock.no_copy_dir(pin)
    folder.mkdir(parents=True)
    for args in (("init", "--quiet"), ("remote", "add", "origin", pin.repo)):
        assert fetch_script.git(folder, *args).returncode == 0, args
    outside = tmp_path / "outside"
    outside.mkdir()
    link = folder / ".git" / inside.replace("<fan-out>", commit[:2])
    if inside == "shallow":
        (outside / "shallow").write_text("", encoding="utf-8")
        link.symlink_to(outside / "shallow")
    else:
        if inside == "objects":
            shutil.rmtree(link)
        link.symlink_to(outside, target_is_directory=True)
    before = _files_under(outside)
    reason = fetch_script.fetch(pin)
    assert reason is not None and "a link inside .git" in reason, reason
    assert _files_under(outside) == before


def test_an_interrupted_rewrite_of_the_configuration_leaves_the_old_one_whole(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pin folder's configuration is replaced through a new file renamed over it, so a run cut short at that point leaves the old file in place, never no file (TRDD-R2GILGKU L2)."""
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    pin, folder = _local_pin(tmp_path, "interrupted")
    config = folder / ".git" / "config"
    old = config.read_bytes()

    def cut_short(*args: Any) -> None:
        raise OSError("cut short")

    with monkeypatch.context() as patch:
        patch.setattr(os, "replace", cut_short)
        with pytest.raises(OSError, match="cut short"):
            fetch_script.reset_git_dir(folder, pin)
    assert config.read_bytes() == old


@pytest.mark.parametrize(
    ("repo", "error", "tls"),
    [
        (CCWHOAMI.repo, f"fatal: unable to access '{CCWHOAMI.repo}/': SSL certificate problem: unable to get local issuer certificate", True),
        (CCWHOAMI.repo, f"fatal: unable to access '{CCWHOAMI.repo}/': Received HTTP code 407 from proxy after CONNECT", True),
        (
            "https://github.com/someone/openssl-proxy",
            "remote: Repository not found.\nfatal: repository 'https://github.com/someone/openssl-proxy/' not found",
            False,
        ),
    ],
)
def test_a_tls_or_proxy_failure_names_the_variables_to_set(repo: str, error: str, tls: bool, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A TLS or proxy failure says how to give a proxy and a CA bundle, which the ignored git configuration no longer can; any other failure keeps the re-pin remedy, also for a repository whose name holds one of the words."""
    fake = _fake_git(tmp_path / "bin", fetch_error=error)
    _use_fake_git(fetch_script, fake, tmp_path / "no-copy-sources", monkeypatch)
    monkeypatch.setattr(fetch_script, "RETRY_PAUSE", 0, raising=False)
    reason = fetch_script.fetch(CCWHOAMI._replace(repo=repo))
    assert reason is not None, reason
    assert ("GIT_SSL_CAINFO" in reason and "https_proxy" in reason, "NO_COPY_AVAILABLE" in reason) == (tls, not tls), reason


@pytest.mark.parametrize(
    ("version", "accepted"),
    [
        ("git version 2.31.8", False),
        ("git version 1.40.0", False),
        ("not a version", False),
        ("git version 2.32.0", True),
        ("git version 2.54.0 (Apple Git-157)", True),
        ("git version 3.0.0", True),
    ],
)
def test_a_git_older_than_2_32_is_refused_before_anything_runs(
    version: str, accepted: bool, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """GIT_CONFIG_GLOBAL, which keeps the user's git configuration out, came in git 2.32: an older or unreadable git is refused before any other git call, and 2.32 or newer goes on."""
    fake = _fake_git(tmp_path / "bin", version=version)
    _use_fake_git(fetch_script, fake, tmp_path / "no-copy-sources", monkeypatch)
    code = fetch_script.main([])
    calls = _calls(fake)
    if accepted:
        # The version check, then the four calls of one new pin.
        assert (code, len(calls)) == (0, 5), calls
    else:
        assert (code, len(calls)) == (1, 1), calls
        assert "2.32" in capsys.readouterr().err


def test_after_the_run_deadline_no_pin_is_tried_and_each_one_left_is_printed(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """Once the whole-run deadline has passed no fetch starts, and every pin left is printed as FAILED with the deadline as its reason, so the log says what is missing before the CI job's own timeout cuts it."""
    fake = _fake_git(tmp_path / "bin")
    _use_fake_git(fetch_script, fake, tmp_path / "no-copy-sources", monkeypatch)
    monkeypatch.setattr(excerpt_lock, "NO_COPY_SOURCES", ALL_PINS)
    monkeypatch.setattr(fetch_script, "RUN_DEADLINE", 0, raising=False)
    assert fetch_script.main([]) == 1
    assert [call["argv"][-1] for call in _calls(fake)] == ["--version"]
    out, err = capsys.readouterr()
    pins = [pin for group in ALL_PINS.values() for pin in group]
    assert len([line for line in out.splitlines() if line.startswith("FAILED ")]) == len(pins), out
    assert err.count("deadline") >= len(pins), err


def test_a_fetch_gets_only_the_time_left_and_no_retry_without_time(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A fetch begun near the deadline gets the time left as its timeout, not FETCH_TIMEOUT, and is not retried when less than RETRY_PAUSE is left, so it cannot outlive the CI job (a git stand-in records each fetch's timeout)."""
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    timeouts: list[float | None] = []

    def stand_in(folder: Path, *args: str, timeout: float | None = None) -> subprocess.CompletedProcess[str]:
        if "init" in args:
            (folder / ".git").mkdir(parents=True)
        if args[:1] == ("fetch",):
            timeouts.append(timeout)
            return subprocess.CompletedProcess(["git", *args], 128, "", "fatal: unable to access: Could not resolve host: github.com")
        # The repository check is answered as git answers it: the pin folder's own .git.
        opened = str((folder / ".git").resolve()) if "--absolute-git-dir" in args else ""
        return subprocess.CompletedProcess(["git", *args], 0, opened, "")

    monkeypatch.setattr(fetch_script, "git", stand_in)
    reason = fetch_script.fetch(CCWHOAMI, time.monotonic() + 3)
    assert len(timeouts) == 1 and timeouts[0] is not None and 0 < timeouts[0] <= 3, timeouts
    assert reason is not None and "not retried" in reason, reason


def test_prune_removes_what_no_pin_names_and_only_when_asked(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """--prune removes every entry under the sources folder that no pin names (an old commit, a dropped repository, a stray file, a link but never what it points to) and keeps the pin's own folder; a run without it removes nothing."""
    fake = _fake_git(tmp_path / "bin")
    root = tmp_path / "no-copy-sources"
    _use_fake_git(fetch_script, fake, root, monkeypatch)
    kept = excerpt_lock.no_copy_dir(CCWHOAMI) / "kept.txt"
    kept.parent.mkdir(parents=True)
    kept.write_text("x", encoding="utf-8")
    outside = tmp_path / "outside" / "keep.txt"
    outside.parent.mkdir()
    outside.write_text("x", encoding="utf-8")
    extra = [kept.parent.parent / ("0" * 40), root / "someone__dropped", root / "stray.txt", root / "link"]
    (extra[0] / ".git").mkdir(parents=True)
    (extra[1] / ("1" * 40)).mkdir(parents=True)
    extra[2].write_text("x", encoding="utf-8")
    extra[3].symlink_to(outside.parent)
    assert fetch_script.main([]) == 0
    assert [entry.is_symlink() or entry.exists() for entry in extra] == [True] * 4
    assert fetch_script.main(["--prune"]) == 0
    assert [entry.is_symlink() or entry.exists() for entry in extra] == [False] * 4
    assert kept.exists() and outside.exists()


def test_the_pin_hash_changes_with_the_pins_and_nothing_else(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    """The ci.yml cache key follows each pin's repository and commit: their order and the other fields leave it as it is, a changed, added or removed pin changes it, and --pin-hash prints it."""
    base = fetch_script.pin_table_hash()

    def hash_of(sources: dict[str, tuple[Any, ...]]) -> str:
        monkeypatch.setattr(excerpt_lock, "NO_COPY_SOURCES", sources)
        return str(fetch_script.pin_table_hash())

    first_mod, first_pins = next(iter(ALL_PINS.items()))
    same = [
        {mod: tuple(reversed(pins)) for mod, pins in reversed(list(ALL_PINS.items()))},
        {mod: tuple(pin._replace(plugin="x", version="9.9.9", manifest="x.json") for pin in pins) for mod, pins in ALL_PINS.items()},
    ]
    changed = [
        {**ALL_PINS, first_mod: (first_pins[0]._replace(commit="f" * 40), *first_pins[1:])},
        {**ALL_PINS, "someone__new": (first_pins[0]._replace(repo="https://github.com/someone/new"),)},
        {mod: pins for mod, pins in ALL_PINS.items() if mod != first_mod},
    ]
    assert [hash_of(sources) for sources in same] == [base, base]
    assert len({base, *(hash_of(sources) for sources in changed)}) == 4
    monkeypatch.setattr(excerpt_lock, "NO_COPY_SOURCES", ALL_PINS)
    assert fetch_script.main(["--pin-hash"]) == 0
    assert capsys.readouterr().out.strip() == base


def test_ci_keys_the_sources_cache_on_the_pin_hash_alone_and_prunes_before_the_archive() -> None:
    """ci.yml's No-copy sources job keys its cache on the pin hash with no restore-keys, and fetches with --prune before it archives the folder, so neither an older cache nor a dropped pin reaches the test lanes."""
    steps = yaml.safe_load((ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8"))["jobs"]["no-copy-sources"]["steps"]
    runs = [str(step.get("run", "")) for step in steps]
    hashing = next(i for i, run in enumerate(runs) if "fetch_no_copy_sources.py --pin-hash" in run)
    caching = next(i for i, step in enumerate(steps) if str(step.get("uses", "")).startswith("actions/cache@"))
    fetching = next(i for i, run in enumerate(runs) if "fetch_no_copy_sources.py --prune" in run)
    assert hashing < caching < fetching
    assert steps[caching]["with"]["key"] == "no-copy-sources-${{ steps." + steps[hashing]["id"] + ".outputs.hash }}"
    assert "restore-keys" not in steps[caching]["with"]
    assert runs[fetching].index("--prune") < runs[fetching].index("tar -cf")
