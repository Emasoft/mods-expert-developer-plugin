// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, src/core/savings.ts, MIT.
// Changed for mods-expert-developer-plugin: imports carry no .ts extension, as this plugin's tsconfig has no allowImportingTsExtensions; nothing else (TRDD-71KVH9PA).
import { TOP_RANK } from './tiers'

/**
 * Relative cost of a token on each tier, by rank (Haiku, Sonnet, Opus). They
 * are ratios for estimating, not prices; anything above Opus is weighed as
 * Opus, which can only understate a saving.
 */
export const COST_WEIGHTS: readonly [number, number, number] = [1, 3, 5]

/** The relative cost of a token at a model rank. */
export const costWeightAt = (rank: number): number => {
  if (rank <= 0) {
    return COST_WEIGHTS[0]
  }

  return rank >= TOP_RANK ? COST_WEIGHTS[2] : COST_WEIGHTS[1]
}

/** The usual rule of thumb for English text and code: about four characters a token. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4)

/**
 * What running `tokens` on a cheaper tier saved, in tokens of the baseline
 * tier. Negative when the work was routed up: escalation is counted as a cost.
 */
export const routingSavings = (tokens: number, usedRank: number, baselineRank: number): number =>
  Math.round(tokens * (1 - costWeightAt(usedRank) / costWeightAt(baselineRank)))

/**
 * What delegating kept out of the main context: the work the sub-agent read
 * and wrote, less the summary it handed back. Never negative.
 */
export const contextSavings = (workTokens: number, answerTokens: number): number =>
  Math.max(0, workTokens - answerTokens)
