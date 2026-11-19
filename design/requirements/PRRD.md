# Project Requirements and Rules

## Golden requirements

- **G1.1** — Integrate Mod Manager and dev-tools functionality, including hooks, scripts, and skills, inside mods-expert-developer-plugin.
- **G2.1** — Enable the plugin’s own agent to use both toolkits independently, without either original standalone mod installed.
- **G3.1** — Provide user- and agent-accessible on, off, and status operations that reflect actual capability readiness.
- **G4.1** — Provide supported install, uninstall, configure, active-mod inspection, and debug operations while respecting host permissions and required confirmations.
- **G5.1** — Reuse existing integration and fix the parser without rewriting valid user settings.
- **G6.1** — Track work through TRDDs and necessary derived tasks, with measured assumptions and verification between increments.
- **G7.1** — Publish a release and update the installed plugin only after validation and resolution of the existing release hold; this requirement does not lift that hold.
- **G8.2** — Automatically install required dependencies and external tools and supply usable defaults without separate manual setup or configuration phases, with no unnecessarily restrictive default gates for ordinary authorized use; preserve required authorization boundaries and mandatory permissions, credentials, and platform and service limitations, and honestly disclose these constraints.
- **G9.2** — Make all present and future integrated mods fully auto-configurable and discoverable in the skills menu, with user- and agent-controlled activation that persists until explicitly changed or deactivated; make individual features configurable and toggleable at runtime, remembering values and toggles across sessions and restarts, and allow routine changes without opening a configuration skill; when options are numerous, expose a visual settings panel through a skill and equivalent nonvisual typed agent tools sharing one state and validation; enable the agent command/tool-access component by default, including authorized /reload-plugins access; provide a dedicated skill explaining full auto-configurability.

- **G10.1** — No MCP server is allowed in the plugin, ever. When integrating something that uses MCP, always convert it to something else: a Claude Code mod native tool, a skill, a CLI binary, a Python script, or similar.
- **G11.1** — Prefer native mod libraries to skills or external scripts.
- **G12.1** — The mods-expert-developer-agent designs and develops every mod. It runs on Opus 5.5 at xhigh effort, can spawn subagents and forks of itself, and can switch mod functions on and off at runtime; its frontmatter configures its allowed tools and its skills menu.
- **G13.1** — Every mod function can be switched on and off, so the user or the agent activates only the functions it needs.
- **G14.1** — Every mod can switch on a debug log that tracks errors, warnings and similar events, with secrets redacted.

## Approval and implementation status

These fourteen golden requirements are user-approved. They specify required behavior, not completed implementation. Mandatory permissions and confirmations remain applicable, unsupported capabilities must be disclosed, and the existing release hold remains in force until resolved.

G10 to G14 were set by the owner on 2026-11-03, in these words:
> in general you must always follow these rules when creating the plugin (rules to add to design/requirements/prrd.md):
> - no mcp are allowed in the plugin. EVER! When integrating an mcp always convert it to something else (claude mod native tool, skill, cli binary, python script, etc.).
> - prefer using native mods libs to skills or external scripts.
> - always make the mod expert developer agent (with opus 5.5 xhigh and the ability to spawn subagents and agent forks of itself and to enable/disable mods functionalities at runtime, configuring the agent frontmatter allowed tools and skill-menu) design and develop the mod. it was created for this.
> - always made the mod functions being able to be switched on/off, so the user or the agent can activate only those he/it needs.
> - always made a mod able to switch debug log on to track errors, warnings, etc. but redacted from secrets.
