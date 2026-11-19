# Judgment report and agreement statistics

Reference notes on how an installed mod measures how often an external judge agrees with a cheap rule and with human labels, and prints the result as a plain-text report. Excerpts are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative for the events a judge runs on (`mods-doc-mods-and-events`). No chapter covers judges or agreement statistics: the definitions used here (Cohen kappa, precision, recall, percentiles) are standard, and the choices the mod makes on top of them are its own.

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A judgment report is the record a mod keeps of each yes or no decision it hands to a judge, and the figures computed from that record. The figures say how many decisions were sent and answered, how often the judge and the rule agree beyond chance, and, where a person has labelled some cases, the precision and recall of the judge at a threshold. A person reads them to decide whether the judge is worth its cost and where its threshold belongs.

## When to build one

- A mod asks a model for a yes or no on each prompt or tool call, and a cheap rule could answer the same question.
- A person can label a few cases by hand, and the labels are needed to choose a threshold or to show that the judge is right.
- The report must show coverage and failures, so that a judge which failed silently is not read as agreement.
- Measure only the decisions a person will act on. Each judged point is a model call that costs tokens when the judge is paid.

## How each mod does it

### context-harness 0.0.1 (MIT)

- Each judged point writes a shadow record (`hooks/report.ts:4-29`). It holds the scrubbed text that was sent, whether the point was skipped and why, the verdict of the rule, the probability the judge gave, the token usage, any error, two timings, and the decision the gate took or would have taken. The hook time does not count what runs beneath the hook, so it is kept apart from the time the judge itself took.
- Latency is summarised with `percentile` (lines 33-38). It sorts the values and takes the one at index floor of p times the count, with no interpolation, so for up to twenty samples the 95th percentile is the largest value.
- `confusion` (lines 42-52) counts the four cells of the rule-against-judge table: both yes, rule only, judge only, neither. `kappa` (lines 55-64) is Cohen kappa for two yes or no raters, which is agreement beyond chance. It is undefined when there are no records, or when chance agreement is already 1.
- `sweep` (lines 69-88) takes the labelled, answered points and, for each threshold, gives precision and recall of "probability at or above the threshold" against the human labels, with the count of points flagged. The report uses the thresholds 0.5, 0.6, 0.7, 0.8, 0.9 and 0.95.
- `pointReport` (lines 94-142) prints one block per point: records, eligible (not skipped), sent, answered, skip reasons, decision counts, coverage (answered over sent), failures by kind, latency percentiles for the hook and for the judge, average input and output tokens per answered call, the rule-against-judge confusion and kappa at the chosen threshold, the ten most recent unlabelled disagreements to label, and the sweep over the labelled points. It prints ids and counts, never the text it sent.

## Traps

- Undefined is not zero. Kappa is undefined when chance agreement is 1, precision when nothing was flagged, recall when no positive label exists, and a percentile when there are no values. Print a dash, as the mod does (`fmt` and `ms`). A zero reads as a measurement.
- Coverage comes before agreement. A judge that failed on half the points agrees only on the answered half. Print coverage and the failure tally beside every agreement figure.
- Keep the denominators visible. Skipped points leave the eligible base, while sent points that failed stay in the sent base. Print both counts, so a reader can see which base a figure uses.
- A sweep over a handful of labels is noise. Print the label count and the positive count next to it, as the report does.
- Labels follow what the report shows. The disagreements listed are the recent unlabelled ones, so labels gather around recent cases. Say so when labels choose a threshold.
- Kappa measures agreement beyond chance with the rule, not correctness: a rule and a judge can agree and both be wrong. Only the human labels, through precision and recall, say which one is right.
- Keep the two timings apart. The report prints the hook percentiles and the judge percentiles as two lines; read them as two figures, not as a sum.
- The record keeps the scrubbed text that was sent. Keep the record local and print only counts and ids, as `pointReport` does.

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### context-harness 0.0.1, hooks/report.ts:33-38, MIT

Full source: examples/context-harness/hooks/report.ts:33-38 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
export function percentile(values: readonly number[], p: number): number | undefined {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}
```

### context-harness 0.0.1, hooks/report.ts:40-64, MIT

Full source: examples/context-harness/hooks/report.ts:40-64 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
export type Confusion = { both: number; ruleOnly: number; jevOnly: number; neither: number }

export function confusion(pairs: readonly { rule: boolean; jev: boolean }[]): Confusion {
  const c: Confusion = { both: 0, ruleOnly: 0, jevOnly: 0, neither: 0 }
  for (const { rule, jev } of pairs) {
    if (rule && jev) c.both++
    else if (rule) c.ruleOnly++
    else if (jev) c.jevOnly++
    else c.neither++
  }

  return c
}

/** Cohen's kappa of two yes/no raters; undefined when it cannot be computed. */
export function kappa(c: Confusion): number | undefined {
  const n = c.both + c.ruleOnly + c.jevOnly + c.neither
  if (n === 0) return undefined
  const observed = (c.both + c.neither) / n
  const ruleYes = (c.both + c.ruleOnly) / n
  const jevYes = (c.both + c.jevOnly) / n
  const expected = ruleYes * jevYes + (1 - ruleYes) * (1 - jevYes)

  return expected === 1 ? undefined : (observed - expected) / (1 - expected)
}
```

### context-harness 0.0.1, hooks/report.ts:68-88, MIT

Full source: examples/context-harness/hooks/report.ts:68-88 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
/** Precision and recall of `probability >= threshold` against labels, per threshold. */
export function sweep(points: readonly { probability: number; label: boolean }[], thresholds: readonly number[]): Sweep[] {
  return thresholds.map(threshold => {
    let tp = 0
    let fp = 0
    let fn = 0
    for (const { probability, label } of points) {
      const isPositive = probability >= threshold
      if (isPositive && label) tp++
      else if (isPositive) fp++
      else if (label) fn++
    }

    return {
      threshold,
      precision: tp + fp === 0 ? undefined : tp / (tp + fp),
      recall: tp + fn === 0 ? undefined : tp / (tp + fn),
      positives: tp + fp,
    }
  })
}
```

Credits for these excerpts are in NOTICE at the plugin root.
