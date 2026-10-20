---
trdd-id: PII6Z5NS
title: trddgrep has no verb that removes a line, so a blank line in a card is unrepairable and the strict scan blocks on it
column: todo
status: tasked
created: 2026-10-20T16:09:09+0200
updated: 2026-10-20T16:09:09+0200
current-owner: user
created-by: user
task-type: bugfix
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-10-20T16:09:09+0200
---

# trddgrep has no verb that removes a line, so a blank line in a card is unrepairable and the strict scan blocks on it

THE DEFECT. trddgrep edit replaces TEXT WITHIN a line (lib/pillar/edit.ts PASS 2: lines[line-1] = before.replace(expect, () => replace)), so a line disappears only when its whole text is replaced by the empty string. A BLANK line has no text, so --expect can never match it, and three separate guards each refuse the attempt: an empty --expect is refused outright (a comparand that matches every string is not a compare-and-swap); a whitespace comparand fails the staleness check, because the line does not contain a space; and trddgrep fix has no whitespace repair, because MD012 is markdownlint's rule and not a trddgrep lint finding. The file's blank run is SEVERAL separate array elements (splitLines splits on every newline), and an element can only be edited if expect matches text it contains. THE CONSEQUENCE: a card that acquires two or more consecutive blank lines CANNOT BE REPAIRED WITH ANY VERB, and the strict scan reports each one as an MD012 NIT, so the release is blocked by a defect no verb can fix.

THE INSTANCE IN THIS REPOSITORY. design/tasks/TRDD-20261020_143209+0200-07W10I9D-*.md carries five consecutive blank lines and three consecutive blank lines. They were introduced by commit 4c2c80a, which removed three paragraphs the section restructure had left duplicated, using trddgrep edit --replace "" --allow-empty-replace. That verb emptied the duplicated paragraphs' TEXT but left the blank lines that surrounded them, and the two runs are the residue. The card is otherwise correct: each heading owns its paragraph, and the paragraphs appear exactly once.

WHAT WAS TRIED, so the next reader does not repeat it. An empty --expect is refused by design. A single-space --expect is refused by the staleness check. trddgrep fix repairs nothing here. trddgrep append backs over a section's TRAILING blank run before inserting, but it only INSERTS - the blanks it backs over remain after the inserted line, so the count does not change (measured). A multi-line --replace INSERTS newlines into one element, which adds physical lines but never removes an element, and the array size is invariant. A multi-line --expect can only match an element that ALREADY holds newlines, and the only way to give it newlines is a previous multi-line --replace, so the two-call sequence does not help either. Emptied elements become blank elements, so emptying a content line ADDS a blank. The blank-run LENGTH IS THEREFORE INVARIANT under every available verb, and the run of five cannot be reduced to one.

THE UPSTREAM HALF IS FILED as Emasoft/ai-maestro#183, with the three refusals quoted and the invariant argued. The remedy it asks for is a verb or flag that removes a line rather than replacing its text - for example trddgrep edit --at-line N --delete-line, or a spelling for an explicitly blank comparand that is not the empty string, so the compare-and-swap guard is not defeated. check-box already addresses a line by ORDINAL rather than by content, which is the same idea: a line is a position, and a position can be deleted.

WHY THIS MATTERS BEYOND ONE FILE. The strict scan collects every gitignore-visible markdown file, so a defect in ANY card in the corpus blocks the release, and the tool that governs the cards is the tool that cannot repair it. A card that acquires a blank line from an ordinary edit is unrepairable until the missing verb ships.

## Approval log

- 2026-10-20T16:09:09+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
