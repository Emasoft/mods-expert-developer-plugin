# MODS EXPERT DEVELOPER SKILLS MENU: full catalog

## Table of Contents

- [Mods](#mods)
- [Plugins](#plugins)
- [Marketplaces](#marketplaces)
- [Hooks, Subagents and Skills](#hooks-subagents-and-skills)
- [Settings and Configuration](#settings-and-configuration)
- [Sessions and Runtime](#sessions-and-runtime)
- [Troubleshooting](#troubleshooting)
- [Tutorials (reference only)](#tutorials-reference-only)

Full entries for the chapter skills of `mods-expert-developer-plugin`, grouped by domain. Each entry is derived from the skill's own SKILL.md: its description, its H1 and its section table of contents. The four standalone tool skills (optional, recommended; user-scope, not shipped by this plugin) are described in the menu's SKILL.md, not here.

## Mods

### mods-expert-developer-plugin:mods-doc-mods-overview

**Use when:** working on mods overview (MODS OVERVIEW). Sections: What a mod can do; Install, update, or try a mod; Decide whether to trust a mod; Turn mods on or off; How a mod works; Control mods for your organization; Compare mods, settings hooks, skills, and MCP servers; Mods built into Claude Code; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-overview", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-development

**Use when:** working on mods development (Mods Development). Sections: Ask Claude for a mod; Write a mod yourself; Change and test a mod; Share your mod; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-development", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-interfaces

**Use when:** working on mods interfaces (MODS INTERFACES). Sections: Build a pane with tabs; Pick where to draw and open panes; Build a tree from elements and cell grids; Handle input and redraws; Keep state across reloads and sessions; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-interfaces", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-basic-examples

**Use when:** working on mods basic examples (MODS BASIC EXAMPLES). Sections: Try a sample; Pick an element; Show text; Show code and changes; Arrange elements; Take input; Draw pictures; See where a mod can draw; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-basic-examples", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-and-events

**Use when:** working on mods and events (MODS AND EVENTS). Sections: How a hook handles an event; Hook tool calls, prompts, and turns; Mod ordering and failed hooks; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-and-events", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-api

**Use when:** working on mods api (MODS API). Sections: Add a command or a tool; Call a model; Run and control background work; Send and receive messages between sessions; Reach files, processes, and the network; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-api", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-testing

**Use when:** working on mods testing (MODS TESTING). Sections: Write a mod test; Test a timer; Test a drawing; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-testing", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-troubleshooting

**Use when:** working on mods troubleshooting (MODS TROUBLESHOOTING). Sections: Find out why a mod does nothing; Check whether mods can load; The mod doesn't load; A hook is skipped or a mod is unloaded; A tool call is denied; A drawing doesn't appear or respond; An edit or a value is lost; Read the debug log; Related Topics.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-troubleshooting", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mods-reference

**Use when:** working on mods reference (MODS REFERENCE). Sections: Files; The hook function; Events a mod can hook; Mods API methods; Render sites; Elements; Limits; Settings and environment variables; Commands.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-manage-mods-for-organizations

**Use when:** working on manage mods for organizations (MANAGE MODS FOR ORGANIZATIONS). Sections: Stop user-installed mods from loading; Know what happens by default; Decide whether to leave mods on; Control which mods run and configure the built-in guard; Enforce policy with your own mods; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-manage-mods-for-organizations", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Plugins

### mods-expert-developer-plugin:mods-doc-plugins-creation

**Use when:** working on plugins creation (PLUGINS CREATION). Sections: Decide when to use a plugin; Create your first plugin; Develop without a marketplace; Test and debug plugins; RELATED DOCS.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-plugins-creation", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-add-components-to-a-plugin

**Use when:** working on add components to a plugin (ADD COMPONENTS TO A PLUGIN). Sections: Explore the plugin directory; Add and configure every plugin component type; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-add-components-to-a-plugin", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-plugins-depending-on-other-plugins

**Use when:** working on plugins depending on other plugins (PLUGINS DEPENDING ON OTHER PLUGINS). Sections: Declare dependencies; How dependencies behave for your users; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-plugins-depending-on-other-plugins", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-test-plugins-with-evals

**Use when:** working on test plugins with evals (TEST PLUGINS WITH EVALS). Sections: Requirements; How an eval run works; Create your first eval suite; Set up fixtures and mocks; Run evals; Read the results; Eval suite reference; Troubleshooting; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-test-plugins-with-evals", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-publish-a-plugin

**Use when:** working on publish a plugin (PUBLISH A PLUGIN). Sections: Choose how to distribute; Prepare your plugin for release; Share a plugin without a marketplace; Publish through your own marketplace; Manage a plugin after release; Declare dependencies; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-publish-a-plugin", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-manage-costs-of-a-plugin

**Use when:** working on manage costs of a plugin (MANAGE COSTS OF A PLUGIN). Sections: Measure and reduce what a plugin costs; Check whether a plugin is used; Measure across a fleet; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-manage-costs-of-a-plugin", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-manage-plugins-from-cli

**Use when:** working on manage plugins from cli (MANAGE PLUGINS FROM CLI). Sections: Emit the hint; Hint format; Check when the prompt appears; Preview what the user sees; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-manage-plugins-from-cli", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-install-and-manage-plugins

**Use when:** working on install and manage plugins (INSTALL AND MANAGE PLUGINS). Sections: Install a plugin; Add a marketplace; Manage installed plugins; Keep plugins updated; Manage marketplaces; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-install-and-manage-plugins", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-code-intelligence-components-in-plugins

**Use when:** working on code intelligence components in plugins (CODE INTELLIGENCE COMPONENTS IN PLUGINS). Sections: Install a code intelligence plugin; See what Claude gains and view diagnostics; Handle the plugin recommendation dialog; Troubleshoot code intelligence; Add a language without an official plugin; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-code-intelligence-components-in-plugins", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-plugins-security-and-trust

**Use when:** working on plugins security and trust (PLUGINS SECURITY AND TRUST). Sections: Understand what a plugin can do; Review plugins before and after you install; Recognize when Claude Code refuses or warns; Enforce plugin controls for your organization; Find plugins in telemetry; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-plugins-security-and-trust", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-manage-plugins-in-organizations

**Use when:** working on manage plugins in organizations (MANAGE PLUGINS IN ORGANIZATIONS). Sections: Pre-install and require plugins; Seed containers and CI; Restrict what users can install; Set update policy; Recommend plugins; Audit and review plugin usage; Plan for what managed settings can't enforce; Troubleshoot policy; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-manage-plugins-in-organizations", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-plugin-manifest-reference

**Use when:** working on plugin manifest reference (PLUGIN MANIFEST REFERENCE). Sections: Manifest file; Manifest fields; Component path forms; Path rules; User configuration options; Channels; Environment variable resolution and quoting; Standard layout; Marketplace entries and the manifest; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-plugin-manifest-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-plugin-commands-reference

**Use when:** working on plugin commands reference (PLUGIN COMMANDS REFERENCE). Sections: claude plugin commands; claude plugin marketplace commands; Flags that load a plugin for one session; See Also:.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-plugin-commands-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-recomended-plugins-to-create-plugins

**Use when:** working on recomended plugins to create plugins (RECOMENDED PLUGINS TO CREATE PLUGINS). Sections: skill-creator; Plugin Development Toolkit; Overview; Guided Workflow Command; Plugin development skills; Installation; Quick Start; Development Workflow; Toolkit features; Documentation Standards; Total Content; Example plugin use cases; Best Practices.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-recomended-plugins-to-create-plugins", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-large-monorepo-plugin-development

**Use when:** working on how to use a large monorepo with claude (usually the case when developing plugins) (HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins)). Sections: What this guide covers and its example monorepo; Choose where to start Claude; Layer CLAUDE.md files by directory; Reduce what Claude reads; Scope worktrees and file access; Add per-directory skills; Centralize conventions and recommend plugins; Put it together; Scope and plan changes that span packages; Next steps.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-large-monorepo-plugin-development", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cc-security-plugin

**Use when:** working on claude security plugin (CLAUDE SECURITY PLUGIN). Sections: Prerequisites; Models and providers; Install and uninstall the plugin; Scan your codebase and read the results; Fix findings and review patches; How the plugin fits with other security tools; Troubleshooting; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-security-plugin", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Marketplaces

### mods-expert-developer-plugin:mods-doc-official-marketplaces

**Use when:** working on anthropic marketplaces (ANTHROPIC MARKETPLACES). Sections: Anthropic's marketplaces; Find plugins in the official marketplace; Browse and install from Anthropic's marketplaces; Third-party marketplaces; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-official-marketplaces", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-create-a-marketplace

**Use when:** working on create a marketplace (Create a marketplace). Sections: Create a marketplace; Add plugin entries; Rules for plugin entries; Choose a plugin source; Validate and test; Host your marketplace; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-create-a-marketplace", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-how-to-host-a-marketplace

**Use when:** working on how to host a marketplace (HOW TO HOST A MARKETPLACE). Sections: Host your marketplace; Distribute through organization settings; Grant access to a private marketplace; Roll out to a whole company; Keep users up to date and control versions; Run release channels; Rename or remove a plugin; Authenticate archive downloads; Depend on and recommend other plugins; Work around what a marketplace can't do; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-how-to-host-a-marketplace", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-plugin-recomendations

**Use when:** working on plugin recomendations (PLUGIN RECOMENDATIONS). Sections: Understand how plugin relevance works; Add relevance to a plugin entry; Relevance field reference; Validate your marketplace; Enable suggestions in managed settings; Preview what the user sees; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-plugin-recomendations", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-marketplace-manifest-reference

**Use when:** working on marketplace manifest reference (MARKETPLACE MANIFEST REFERENCE). Sections: Marketplace file layout; Top-level fields; Plugin entry fields; Plugin source types; Marketplace source types; Validation messages; See Also:.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-marketplace-manifest-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Hooks, Subagents and Skills

### mods-expert-developer-plugin:mods-doc-hooks-reference

**Use when:** working on hooks reference (HOOKS REFERENCE). Sections: Hook lifecycle; Hook configuration and management; Hook input and output; Hook events and decision control; Prompt-based hooks; Agent-based hooks; Run hooks in the background; Security considerations; Windows PowerShell tool; Debug hooks.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-hooks-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-automate-actions-with-hooks

**Use when:** working on automate actions with hooks (AUTOMATE ACTIONS WITH HOOKS). Sections: Set up your first hook; Hook recipes for common automation tasks; Hook lifecycle and configuration; Prompt-based hooks; Agent-based hooks; HTTP hooks; Limitations and troubleshooting; Learn more.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-automate-actions-with-hooks", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-subagents-reference

**Use when:** working on subagents reference (SUBAGENTS REFERENCE). Sections: Built-in subagents; Quickstart: create your first subagent; Configure subagents; Work with subagents; Fork the current conversation; Example subagents; Related Docs:.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-subagents-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-skills-reference

**Use when:** working on skills reference (SKILLS REFERENCE). Sections: Bundled skills; Create and manage skills; Configure skills; Advanced skill patterns; Evaluate and iterate on a skill; Share skills; Generate visual output; Troubleshooting; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-skills-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-dynamic-workflows-reference

**Use when:** working on dynamic workflows reference (DYNAMIC WORKFLOWS REFERENCE). Sections: When to use a workflow; Run and watch a bundled workflow; Have Claude write and reuse a workflow; Example workflow prompts and saved scripts; How a workflow runs and its limits; Manage workflow runs; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-dynamic-workflows-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-mcp-servers-reference

**Use when:** working on mcp servers reference (MCP SERVERS REFERENCE). Sections: What you can do with MCP; Find and build MCP servers; Install and manage MCP servers; MCP installation scopes and variable expansion; Practical MCP server examples; Authenticate with remote MCP servers; Add MCP servers from JSON configuration; Import MCP servers from Claude Desktop; Use MCP connectors from claude.ai; Use Claude Code as an MCP server; MCP output limits and warnings; Tool input schemas with a root-level combinator; Tools with invalid input schemas; Require approval for a specific tool; Respond to MCP elicitation requests; Use MCP resources; Scale with MCP tool search; Use MCP prompts as commands; Managed MCP configuration.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-mcp-servers-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-output-style-reference

**Use when:** working on output style reference (OUTPUT STYLE REFERENCE). Sections: Built-in output styles; Change your output style; Create a custom output style; Choose between an output style and other features; How output styles work; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-output-style-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-status-line-customization

**Use when:** working on status line customization (STATUS LINE CUSTOMIZATION). Sections: Set up a status line; Build a status line step by step; How status lines work; Available data; Status line examples; Subagent status lines; Tips; Troubleshooting.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-status-line-customization", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-native-toolset-reference

**Use when:** working on native tools reference (NATIVE TOOLS REFERENCE). Sections: Configure tools with permission rules and hooks; Agent tool behavior; AskUserQuestion tool behavior; Bash tool behavior; Edit tool behavior; EndConversation tool behavior; Glob tool behavior; Grep tool behavior; LSP tool behavior; Monitor tool and WebSocket sources; NotebookEdit tool behavior; PowerShell tool setup and limits; Read tool behavior; SendFeedback tool behavior; Task tool availability; WebFetch tool behavior; WebSearch tool behavior; Write tool behavior; Check which tools are available; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-native-toolset-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Settings and Configuration

### mods-expert-developer-plugin:mods-doc-cc-settings-reference

**Use when:** working on claude code settings reference (CLAUDE CODE SETTINGS REFERENCE). Sections: Settings files and who they affect; Change and verify a setting; Settings precedence and merging; Settings in cloud sessions; What's next.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-settings-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-settings-precedence-and-scopes

**Use when:** working on settings precedence and scopes (SETTINGS PRECEDENCE AND SCOPES). Sections: Settings files and who they affect; Change and verify a setting; Settings precedence and conflict resolution; Settings in cloud sessions; What's next.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-settings-precedence-and-scopes", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cc-permissions-modes

**Use when:** working on claude permissions modes (CLAUDE PERMISSIONS MODES). Sections: Available modes; Common setups; Switch permission modes; Auto-approve file edits with acceptEdits mode; Plan mode and auto mode; Allow only pre-approved tools with dontAsk mode; Skip all checks with bypassPermissions mode; Protected paths; Critical paths and how removals are guarded; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-permissions-modes", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-models-configuration

**Use when:** working on models configuration (MODELS CONFIGURATION). Sections: Available models and how to set them; Restrict and enforce model selection; Organization default model; Organization effort limits; Special model behavior and tuning; Context window and auto-compaction; Checking your current model; Add a custom model option; Model environment variables; Version history.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-models-configuration", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cc-native-memory-and-rules

**Use when:** working on claude code native memory and rules (CLAUDE CODE NATIVE MEMORY AND RULES). Sections: CLAUDE.md vs auto memory; CLAUDE.md files and rules; Use AGENTS.md alongside CLAUDE.md; Auto memory behavior and storage; View and edit with `/memory`; Troubleshoot memory issues; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-native-memory-and-rules", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cc-projects-directory-structure

**Use when:** working on claude projects directory structure (CLAUDE PROJECTS DIRECTORY STRUCTURE). Sections: Explore the directory; What's not shown; Choose the right file; File reference; Frontmatter fields by file; Troubleshoot configuration; Application data storage and cleanup; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-projects-directory-structure", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-prompt-caching-reference

**Use when:** working on prompt caching reference (PROMPT CACHING REFERENCE). Sections: How the cache is organized; Actions that invalidate the cache; Actions that keep the cache; Resuming a session; Cache lifetime and TTL; Cache scope; Check cache performance; Subagents and the cache; Disable prompt caching; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-prompt-caching-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Sessions and Runtime

### mods-expert-developer-plugin:mods-doc-sessions-reference

**Use when:** working on sessions reference (SESSIONS REFERENCE). Sections: Resume a session; Name your sessions; Use the session picker; Branch a session; Manage context within a session; Access and manage stored session data; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-sessions-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cross-session-messaging-reference

**Use when:** working on cross session messaging reference (CROSS SESSION MESSAGING REFERENCE). Sections: When to use cross-session messaging; Send messages and track other sessions; How a session treats an incoming message; Restrict or turn off cross-session messaging; Availability; Limitations; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cross-session-messaging-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-worktrees-reference

**Use when:** working on worktrees reference (WORKTREES REFERENCE). Sections: Start Claude in a worktree; Clean up worktrees; Resume a worktree session; How Claude Code enforces isolation; Isolate subagents with worktrees; Customize worktree creation; What worktrees share with the main checkout; Manage worktrees manually; Non-git version control; Worktree troubleshooting; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-worktrees-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-channels-reference

**Use when:** working on channels reference (CHANNELS REFERENCE). Sections: Supported channels; Quickstart; Security; Enterprise controls for channels; Research preview; How channels compare; Next steps.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-channels-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-loop-and-chron-reference

**Use when:** working on loop and chron reference (LOOP AND CHRON REFERENCE). Sections: Compare scheduling options; Run a prompt repeatedly with /loop; Set a one-time reminder; Manage scheduled tasks; How scheduled tasks run; Cron expression reference; Disable scheduled tasks; Limitations.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-loop-and-chron-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-headless-mode-reference

**Use when:** working on headless mode reference (HEADLESS MODE REFERENCE). Sections: Basic usage and startup options; Headless usage examples; Next steps.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-headless-mode-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-deep-links-reference

**Use when:** working on deep links reference (DEEP LINKS REFERENCE). Sections: How deep links work; Build a link; Deep link examples; Registration and supported platforms; Open a VS Code tab instead of a terminal; Open a Claude Desktop session on an SSH connection; Deep link troubleshooting; Learn more.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-deep-links-reference", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-run-background-sessions

**Use when:** running a second Claude session in the background (RUN BACKGROUND SESSIONS). Sections: Who runs what; Security first; Ask the user to mint a long-lived token; Start the background session; Write the prompt for an interactive session; Talk to the session; The three commands; Troubleshooting; See also.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to a community how-to, not Anthropic documentation: asking the user to mint a long-lived token, the launch command, the caller-report prompt, and the attach, logs and stop commands.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-run-background-sessions", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-platforms-overview

**Use when:** working on platforms overview (PLATFORMS OVERVIEW). Sections: Where to run Claude Code; Connect your tools; Work when you are away from your terminal; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-platforms-overview", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cc-github-actions

**Use when:** working on claude github actions (CLAUDE GITHUB ACTIONS). Sections: Set up and manage the Claude GitHub app; Interactive and automation modes and run triggers; Example use cases; Best practices for Claude in GitHub Actions; Use a cloud provider; Troubleshooting; Advanced configuration; Upgrade from beta; Also See:.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-github-actions", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Troubleshooting

### mods-expert-developer-plugin:mods-doc-troubleshooting-plugins

**Use when:** working on troubleshooting plugins (TROUBLESHOOTING PLUGINS). Sections: Find where `/plugin` runs; Add a marketplace; Install a plugin; Plugin installed but not working; Build a plugin; Host a marketplace; Blocked by your organization; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-troubleshooting-plugins", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-tracing-the-origin-of-a-plugin

**Use when:** working on tracing the origin of a plugin (TRACING THE ORIGIN OF A PLUGIN). Sections: Check which stage a plugin reached; Find where a plugin came from; Find where a plugin is enabled; Find plugins on disk; Versions and updates; Name conflicts; Related Docs.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-tracing-the-origin-of-a-plugin", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-troubleshooting-cc-setup

**Use when:** working on troubleshooting claude setup (TROUBLESHOOTING CLAUDE SETUP). Sections: Find your error; Run diagnostic checks; Common installation issues; Login and authentication; Still stuck.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-troubleshooting-cc-setup", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

### mods-expert-developer-plugin:mods-doc-cc-debug-mode

**Use when:** working on claude code debug mode (CLAUDE CODE DEBUG MODE). Sections: See what loaded into context; Check resolved settings; Check MCP servers; Check hooks; Test against a clean configuration; Check common causes; Related resources.

**Do not use when:** the task needs none of these sections, or needs a write: the skill is read-only routing to the preserved Claude Code chapter.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-doc-cc-debug-mode", args: "<section title>"})`

**Inputs:** one section title from the list above, or the question that section answers.

**Outputs:** that section of the chapter read into context; nothing is written.

**Dependencies:** the chapter file in the skill's own references folder.

## Tutorials (reference only)

These three skills are worked examples for reading and copying, not chapters. The mods-doc-* chapter skills are authoritative and win on any disagreement, except that for API names and type shapes (event, method and argument names and their TypeScript types) the type files your running build generates win, while for behaviour the types cannot express (ordering, timing, what `next` does) the chapters still win (events and methods change across releases), and the example code a tutorial carries under its examples folder is never installed or loaded as part of the plugin. The scripts the quickstart carries are tools to run, not examples to read; the example code stays reference only. The copied examples (`hello-mod`, `redact-output`, `dice-tool`, `branch-band`, `notes-pane`) and the upstream tutorial text are adapted from BeLazy167/claude-mods-skill (MIT, see NOTICE). The `turn-timer`, `git-poller` and `protect-files` examples, the house conventions, the quickstart scripts and the text that describes them were written for this plugin.

### mods-expert-developer-plugin:mods-tutorial-quickstart

**Use when:** building a first mod and you want a step-by-step checklist that names the chapter skill for each step, the traps the chapters do not settle (UNVERIFIED where they do not confirm them), an index of the example mods, the house conventions for mods you keep, the check-mod, new-mod and keep-mod scripts, and the Anthropic mods to read next. Sections: Instructions; Traps the chapters do not settle; Example index; Anthropic mods to read next.

**Do not use when:** the task needs the authoritative facts of a step: load the chapter skill the step names instead. Also not for example code: it carries none.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-tutorial-quickstart", args: "<section title>"})`

**Inputs:** one section title from the list above, or the mod you want to build.

**Outputs:** that section read into context, and the house conventions file read on demand. When an agent runs the scripts: `new-mod.sh` copies a tutorial example to a new folder under its own plugin name and never deletes anything, `check-mod.sh` type-checks, validates and tests a mod and prints `== PASS` or `== FAIL: <step>`, `keep-mod.sh` copies a mod out of the session mods folder and never deletes or overwrites anything, and `plan-diff.sh` compares the footprint `claude plugin validate` prints with a plan file and prints what differs.

**Dependencies:** the chapter skills it names. All four scripts need bash and standard POSIX tools; `check-mod.sh` also needs the `claude` CLI and npx from Node.js (npx fetches typescript over the network when it is not in its cache), and `new-mod.sh` needs perl. `plan-diff.sh` also needs the `claude` CLI unless it is given `--from-file`.

### mods-expert-developer-plugin:mods-tutorial-call-intercept-mods

**Use when:** writing a mod that blocks, rewrites or answers tool calls, or adds a tool the model can call, and you want a complete example to copy: `hello-mod` (a guard that fails closed), `redact-output` (rewrite a result after `next`), `dice-tool` (`$.tool.register` and a `tool.call` hook on `mcp__<plugin>__<tool>`) or `protect-files` (a fail-closed path guard with a stored list). Sections: Instructions; About smoke.sh; Where the examples differ from the chapters.

**Do not use when:** the task needs the authoritative semantics of `tool.call`, `next` or `.catch`: load `mods-expert-developer-plugin:mods-doc-mods-and-events` instead. Never run the example code from inside the plugin.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-tutorial-call-intercept-mods", args: "<section title>"})`

**Inputs:** one section title from the list above, or the tool-call behaviour you want.

**Outputs:** that section read into context, and the example files it links read on demand; nothing is written.

**Dependencies:** the example mods under the skill's own examples folder.

### mods-expert-developer-plugin:mods-tutorial-interface-mods

**Use when:** writing a mod that draws a band above the prompt, a status line, or a pane opened by a slash command, and you want a complete example to copy: `branch-band` (a timer, `$.process.run` and `$.state` atoms), `notes-pane` (commands, a `Pane` with a `Button`, and `$.store`), `turn-timer` (a status line and a toast on a transition) or `git-poller` (a band with the branch and change counts, a Refresh button and an on/off command). Sections: Instructions; Where the examples differ from the chapters; Where the copied examples differ from the house conventions.

**Do not use when:** the task needs the authoritative facts on render sites, elements or state: load `mods-expert-developer-plugin:mods-doc-mods-interfaces` instead. Never run the example code from inside the plugin.

**Load with:** `Skill({skill: "mods-expert-developer-plugin:mods-tutorial-interface-mods", args: "<section title>"})`

**Inputs:** one section title from the list above, or what you want to draw.

**Outputs:** that section read into context, and the example files it links read on demand; nothing is written.

**Dependencies:** the example mods under the skill's own examples folder.
