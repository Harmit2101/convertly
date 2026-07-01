import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import { isRuleApplicableToWebsiteIntent } from "@/services/audit/intelligence/websiteRuleApplicability"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import {
  POSITIVE_SIGNAL_DEFINITIONS,
  QUALITY_PILLAR_POLICY,
  type PositiveSignalId,
} from "@/services/audit/intelligence/scoring/scoringPolicyV4"

export type PositiveSignalAward = {
  id: PositiveSignalId | string
  label: string
  bonus: number
}

export type PositiveScoringResult = {
  qualityScore: number
  totalBonus: number
  awards: PositiveSignalAward[]
}

const MARKETING_ONLY_SIGNALS = new Set<PositiveSignalId>([
  "primary-cta",
  "value-proposition",
  "testimonials",
  "social-proof",
])

const PLATFORM_INTENTS: WebsiteIntent[] = [
  "search_engine",
  "developer_platform",
  "open_source",
  "documentation",
  "dashboard",
]

function isSignalApplicable(
  signalId: PositiveSignalId,
  websiteIntent: WebsiteIntent
): boolean {
  if (MARKETING_ONLY_SIGNALS.has(signalId) && PLATFORM_INTENTS.includes(websiteIntent)) {
    return false
  }
  return true
}

/**
 * Rewards good implementation by detecting absent negative findings.
 * Bonus is capped to avoid inflated scores.
 */
export function calculatePositiveScoring(input: {
  findings: IntelligenceFindingDraft[]
  websiteIntent: WebsiteIntent
  pageSnapshots?: PageContentSnapshot[]
}): PositiveScoringResult {
  const triggeredRuleIds = new Set(input.findings.map((finding) => finding.ruleId))
  const awards: PositiveSignalAward[] = []

  for (const signal of POSITIVE_SIGNAL_DEFINITIONS) {
    if (!isSignalApplicable(signal.id, input.websiteIntent)) continue
    if (!isRuleApplicableToWebsiteIntent(signal.absentRuleId, input.websiteIntent)) continue
    if (triggeredRuleIds.has(signal.absentRuleId)) continue

    awards.push({
      id: signal.id,
      label: signal.label,
      bonus: signal.bonus,
    })
  }

  const schemaBonus = detectSchemaBonus(input.pageSnapshots ?? [])
  if (schemaBonus > 0) {
    awards.push({ id: "schema-markup", label: "Structured data (schema)", bonus: schemaBonus })
  }

  const performanceBonus = detectPerformanceBonus(input.findings)
  if (performanceBonus > 0) {
    awards.push({ id: "performance-baseline", label: "Performance baseline", bonus: performanceBonus })
  }

  const rawBonus = awards.reduce((sum, award) => sum + award.bonus, 0)
  const cappedBonus = Math.min(QUALITY_PILLAR_POLICY.maxPositiveBonus, rawBonus)
  const scale = rawBonus > 0 ? cappedBonus / rawBonus : 1

  const scaledAwards = awards.map((award) => ({
    ...award,
    bonus: Math.round(award.bonus * scale * 100) / 100,
  }))

  const totalBonus = scaledAwards.reduce((sum, award) => sum + award.bonus, 0)
  const qualityScore = Math.min(
    QUALITY_PILLAR_POLICY.ceiling,
    Math.max(QUALITY_PILLAR_POLICY.floor, QUALITY_PILLAR_POLICY.baseline + totalBonus)
  )

  return {
    qualityScore: Math.round(qualityScore),
    totalBonus: Math.round(totalBonus * 100) / 100,
    awards: scaledAwards,
  }
}

function detectSchemaBonus(snapshots: PageContentSnapshot[]): number {
  for (const snapshot of snapshots) {
    const html = snapshot.html ?? ""
    if (/application\/ld\+json/i.test(html)) {
      return 2
    }
  }
  return 0
}

function detectPerformanceBonus(findings: IntelligenceFindingDraft[]): number {
  const performanceRules = new Set([
    "tech-heavy-dom",
    "tech-oversized-images",
    "tech-horizontal-overflow",
  ])
  const hasPerformanceIssue = findings.some((finding) => performanceRules.has(finding.ruleId))
  return hasPerformanceIssue ? 0 : 1.5
}
