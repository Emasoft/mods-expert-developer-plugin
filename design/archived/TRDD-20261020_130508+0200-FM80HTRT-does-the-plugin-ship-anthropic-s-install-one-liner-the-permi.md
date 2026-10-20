---
trdd-id: FM80HTRT
title: Does the plugin ship Anthropic's install one-liner, the permission-bypass flag, the long-lived-token command and the superuser examples, as Anthropic's own documentation shows them
column: complete
status: archived
created: 2026-10-20T13:05:08+0200
updated: 2026-10-20T13:52:43+0200
current-owner: user
created-by: user
task-type: feature
min-approval-requirement: user
assignee: user
approved: false
---

# Does the plugin ship Anthropic's install one-liner, the permission-bypass flag, the long-lived-token command and the superuser examples, as Anthropic's own documentation shows them

THE OWNER'S CALL, AND NOT A MEASUREMENT. This is the one open decision left by the NIT-adjudication series, and no amount of provenance measurement can settle it: it is a judgement about what the plugin should carry.

THE QUESTION, IN ONE LINE. Does this plugin ship chapters that teach those four things, as they appear in Anthropic's own documentation?

THE 36 FINDINGS THIS IS ABOUT. Bucket A of the 72 NIT findings - 36 of them, over 30 sites - are passages of Anthropic's own documentation that the validator's rules read as dangerous instructions: 10 supply-chain, 8 command-injection, 7 privilege-escalation, 7 permission-bypass, 4 token-theft. In substance: the vendor's install one-liner that pipes a downloaded script into a shell, superuser-privilege examples, the permission-bypass CLI flag, and the long-lived-token minting command, plus the prose describing them.

WHAT WAS MEASURED, SO THE DECISION IS NOT MADE BLIND. Every one of the 72 sites is a passage of Anthropic's own documentation - the vendor's own instruction to the reader, the vendor's own description of the product's behaviour, a code sample the reader is shown, or a passage naming a construct in order to forbid it. NO SITE IS EXECUTED BY THE PLUGIN: all 72 findings are on preserved chapter text, not on the plugin's own shipped code. The per-rule adjudication is in design/specs/specs/cpv-nit-rules-adjudicated.md; the independently adjudicated bucket-A sites are in design/specs/specs/cpv-nit-bucketA-sites.md, with a stance per site (TEACHES, NAMES, WARNS, EXPLAINS).

A DEFENSIBLE ANSWER IS YES. They are Anthropic's official instructions, and removing them would gut the chapters. But the answer must be MADE, not inferred - which is why it is a card and not a note.

WHAT IS NOT AT STAKE. The measurement establishes that the detections are not false positives about the TEXT: the rules are reading a real install-one-liner, a real superuser example, a real permission-bypass flag. What the owner decides is whether the plugin should carry them, not whether they are there. The three reworded lines in the plugin's own text - the only lines of the 72 the plugin can change alone - are already assigned and are not part of this decision.

## Approval log
- 2026-10-20 — OWNER RULED YES: the plugin ships Anthropic's install one-liner, the permission-bypass flag, the long-lived-token minting command and the superuser examples, as Anthropic's own documentation shows them. The 36 bucket-A findings are dispositioned accordingly, and the consent registry records that ruling per site.
- 2026-10-20T13:52:43+0200 — COMPLETE by user. Owner ruled YES on 2026-10-20: the plugin ships Anthropic's instructions as Anthropic documents them. The 36 bucket-A findings are dispositioned, and the consent registry records the ruling per site..

## Acceptance

- [x] The owner's ruling is recorded on the card: YES - the plugin ships Anthropic's install one-liner, the permission-bypass flag, the long-lived-token minting command and the superuser examples, as Anthropic's own documentation shows them.
- [x] The 36 bucket-A findings are dispositioned as shipped-by-ruling rather than as false positives: the consent registry records the ruling, per site, as the reason on each entry.
- [x] No site is executed by the plugin: the finding is about what the chapters TEACH, and the chapters are preserved text, not plugin code.
- [x] The three reworded lines in the plugin's own text remain assigned to the plugin alone, and are not part of this decision.
