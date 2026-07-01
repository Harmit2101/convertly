import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import {
  CATEGORY_SCORING_POLICY_V4,
  GROWTH_SCORE_POLICY_V4,
} from "@/services/audit/intelligence/scoring/scoringPolicyV4"

export type GrowthPotentialInput = {
  currentGrowthScore: number
  uncappedGrowthScore: number
  scoreCeiling: number
  categories: Record<ScoreCategory, number>
  optimalCategories: Record<ScoreCategory, number>
  findings: IntelligenceFindingDraft[]
}

export type CategoryRecoverablePoints = Record<ScoreCategory, number>

export type GrowthPotentialResult = {
  /**
   * Estimated Growth Score if all detected issues were resolved
   * (subject to normal max, not blocker-free theoretical max).
   */
  growthPotential: number
  /** Points recoverable from current score toward growth potential */
  recoverablePoints: number
  /** Theoretical max if blockers were also resolved */
  theoreticalMax: number
  blockerLift: number
  /** Per-category points recoverable before blocker ceiling binds */
  categoryRecoverable: CategoryRecoverablePoints
  /** Weighted optimal score from category ceilings (pre-blocker, pre-max clamp) */
  optimalWeightedScore: number
}

function weightedOptimalScore(): number {
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]
  const weighted = categories.reduce(
    (sum, category) =>
      sum + CATEGORY_SCORING_POLICY_V4[category].ceiling * CATEGORY_SCORING_POLICY_V4[category].growthWeight,
    0
  )

  return Math.round(
    Math.min(GROWTH_SCORE_POLICY_V4.maxScore, Math.max(GROWTH_SCORE_POLICY_V4.minScore, weighted))
  )
}

/**
 * Estimates achievable score after fixing detected issues.
 *
 * - `growthPotential`: weighted category ceilings, capped at normal max and blocker ceiling.
 * - `theoreticalMax`: optimal weighted score with blocker ceiling removed.
 * - `recoverablePoints`: growthPotential − currentGrowthScore (mathematically bounded).
 * - `blockerLift`: theoreticalMax − growthPotential (points locked by active blockers).
 */
export function calculateGrowthPotential(input: GrowthPotentialInput): GrowthPotentialResult {
  const optimalWeightedScore = weightedOptimalScore()

  const clampedOptimal = Math.round(
    Math.min(GROWTH_SCORE_POLICY_V4.maxScore, Math.max(GROWTH_SCORE_POLICY_V4.minScore, optimalWeightedScore))
  )

  const growthPotential = Math.min(clampedOptimal, input.scoreCeiling)
  const theoreticalMax = Math.min(clampedOptimal, GROWTH_SCORE_POLICY_V4.maxScore)

  const recoverablePoints = Math.max(0, growthPotential - input.currentGrowthScore)
  const blockerLift = Math.max(0, theoreticalMax - growthPotential)

  const categoryRecoverable = {} as CategoryRecoverablePoints
  const categories: ScoreCategory[] = ["conversion", "trust", "mobile", "ux"]

  for (const category of categories) {
    const policy = CATEGORY_SCORING_POLICY_V4[category]
    const gapToCeiling = Math.max(0, policy.ceiling - input.categories[category])
    categoryRecoverable[category] = Math.round(gapToCeiling * policy.growthWeight)
  }

  return {
    growthPotential,
    recoverablePoints,
    theoreticalMax,
    blockerLift,
    categoryRecoverable,
    optimalWeightedScore,
  }
}
