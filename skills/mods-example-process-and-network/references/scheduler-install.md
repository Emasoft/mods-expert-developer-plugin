# Installing a background job per user

Reference notes on how a mod installs a job that the operating system runs when no session is open. This component has no excerpts: its only source is token-optimizer, whose licence does not allow copying its code into an MIT plugin. Every statement here is in the words of this plugin and cites the lines it rests on. No chapter skill names launchd, systemd or Task Scheduler, so the platform behaviour described here is not checked against a chapter; it is what the mod code does.

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A scheduler install registers a job for one person account, so the operating system runs it on a clock or at login: a launchd agent on macOS, a systemd user unit on Linux, or a Scheduled Task on Windows. The mod writes the definition file, loads it, and checks that it loaded. token-optimizer does this for two different jobs, and this reference keeps them apart.

- The keep-warm scheduler: a macOS launchd agent that runs a short Python command every five minutes. It is installed only after the person has opted in, and only on API billing. Linux and Windows get a stated gap: the install says it is macOS only and exits with an error.
- The dashboard daemon: a small local web server that serves the dashboard page. It starts at login, through a launchd agent on macOS, a systemd user unit on Linux or a Scheduled Task on Windows. It has no connection to the keep-warm job: its code gives that job its own label, its own install lock and its own definition file.

The code is one script, measure.py, in the scripts folder of the installed mod. The keep-warm consent and enable steps are at lines 16018-16145, its design notes and constants at 16249-16300, its definition at 16579-16624, and its macOS install and gate at 16728-16798. The dashboard daemon installers are at lines 33426-33555 (macOS), 34187-34387 (Windows) and 34628-34794 (Linux).

## When to build one

- The job must run when no session is open, or on a clock that a session cannot keep. A timer inside the session runs only while the session runs.
- Get explicit consent first, and make the default answer no. Read the stored consent before every install and every repair. An unreadable value counts as no.
- Make removal as easy as installing: one command removes the job, its definition file and the marker that records the install.
- Plan a separate code path for each operating system. A job that exists only on macOS should say so in its docs and fail with a clear message elsewhere.

## How each mod does it

### token-optimizer 5.13.58 (PolyForm Noncommercial; knowledge only, no excerpt)

Keep-warm job (macOS only):

- Consent is a stored value with four states: unasked, asked, declined and enabled. The unasked state, the declined state and any unreadable value all mean no. The enable step refuses on subscription billing and writes nothing in that case. On API billing it records enabled, resets the auto-demotion state, and then installs the job. A failed install never undoes the consent: the result says the install did not land and prints the manual command (measure.py:16018-16145).
- Definition: a LaunchAgent with its own label; the Python interpreter and the script path, followed by the keep-warm tick command and a quiet flag; a start interval of 300 seconds and no keep-alive, because the job is a periodic batch and not a server; a throttle interval of 60 seconds, so a fast exit cannot loop; a background process type with low I/O priority, so the job yields to the foreground session; and standard output and error sent to one log file (measure.py:16579-16624).
- Install: it refuses unless the gate allows, takes a lock of its own and never the dashboard lock, and rotates the log when it grows past one megabyte. It writes the definition only when the content changed. A loaded and unchanged job is left alone, because a reload can bring back the macOS background-item notice. Otherwise it boots out the old instance, boots in the new one, and writes a 0600 marker after the boot that records the result (measure.py:16728-16798).
- Each tick writes a small stamp file, so a freshness check can tell that the job is alive even when its log is quiet (measure.py:16249-16300 for the stamp name and the freshness rule).
- Repair: the health check recreates a removed definition only when the marker and the consent both say enabled. A declined or unasked person is never reinstalled (measure.py:16249-16300).
- Removal: boot out the job, then remove the definition and the marker.

Dashboard daemon:

- macOS: writes the server script and the agent definition, stops any old instance, frees the port (an orphaned server can keep it after the boot out), boots in the new agent, and checks the port one second later. When the definition is unchanged and the server already answers, it skips the reload (measure.py:33426-33555).
- Windows: refuses the Microsoft Store Python alias, because Task Scheduler cannot start it. It checks who owns the port before installing, writes a launcher and a task definition (the definition in UTF-16 with a byte-order mark), ends any running instance, creates the task with overwrite, and runs it once. An access-denied answer from the scheduler is recorded as permanent, so a retry loop stops (measure.py:34187-34387). It prefers a windowless interpreter, so no console window flashes at each run.
- Linux: checks that the user bus answers before it writes anything, because systemctl can succeed while the bus is dead. It disables and stops the old unit, writes the server script, a launcher and the unit file, reloads the user manager, and enables and starts the unit now. When the reload or the enable fails, it removes the files it wrote. It prints the hint for linger, which keeps a user unit running after logout, and does not enable linger itself, because some distributions need root for it (measure.py:34628-34794).
- All three: each installer refuses when the home folder is redirected, as a test sandbox does, so a test run cannot re-point the job of that person (the check sits at the top of each installer).

## Traps

- Give each job its own label, definition file and install lock. A lock shared by two jobs lets a stuck install of one block the other.
- Match the schedule type to the job. A periodic job takes an interval with a throttle; a server takes keep-alive. With keep-alive the system starts the job again each time it exits, so a periodic job would run without waiting for its interval.
- Do not reload a healthy job on every install. On macOS a reload can show the background-item notice again.
- Treat missing or unreadable consent as no, and let the repair path read the same value.
- Windows: a Store Python alias cannot run as a scheduled task. Check the interpreter path before you register the task, and record a refusal that will not change, so the retries stop.
- Linux: a user unit stops at logout unless linger is enabled, and enabling linger can need root. Tell the person; do not enable it silently.
- Roll back the files you wrote when a load step fails, or the next run starts from a half install.
- Free the port before a new instance starts. Booting out a job does not always stop the child process that holds the port.
- Rotate the log on install and on every run, or a quiet job fills the disk.
- Each keep-warm tick may send a model ping, which costs tokens. The enable message tells the person the ping limit before the job is installed (measure.py:16018-16145).
- Say in the docs that the keep-warm job is macOS only. Its own message says so on Linux and Windows.

## Excerpts

None. The only source is token-optimizer, whose licence does not allow copying its code into this MIT plugin, so this component is described in words only.
