import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { FindingSeverity } from "@/types/auditEngine"
import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { IntelligenceCategory } from "@/services/audit/intelligence/categories"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"

import type { FindingVerificationStatus, DetectionOutcome } from "@/services/audit/intelligence/rendering/renderReliability"

export type GroupedIntelligenceFinding = {
  ruleId: string
  title: string
  severity: FindingSeverity
  recommendation: string
  category: IntelligenceCategory
  scoreCategory: ScoreCategory
  affectedPageIds: string[]
  affectedPaths: string[]
  occurrenceCount: number
  verificationStatus?: FindingVerificationStatus
  detectionOutcome?: DetectionOutcome
  verificationReason?: string
  suppressRecommendation?: boolean
  needsManualVerification: boolean
}

function severityRank(severity: FindingSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity]
}

/**
 * Groups duplicate findings by rule across pages.
 * Used for report presentation and intelligence snapshots.
 */
export function groupIntelligenceFindings(
  findings: IntelligenceFindingDraft[],
  pagePathById: Map<string, string>
): GroupedIntelligenceFinding[] {
  const groups = new Map<string, GroupedIntelligenceFinding>()

  for (const finding of findings) {
    const key = finding.ruleId
    const pagePath = finding.pageId ? pagePathById.get(finding.pageId) : undefined
    const existing = groups.get(key)

    if (existing) {
      existing.occurrenceCount += 1
      if (finding.pageId && !existing.affectedPageIds.includes(finding.pageId)) {
        existing.affectedPageIds.push(finding.pageId)
      }
      if (pagePath && !existing.affectedPaths.includes(pagePath)) {
        existing.affectedPaths.push(pagePath)
      }
      if (finding.excludeFromScoring || finding.detectionOutcome === "could_not_verify") {
        existing.needsManualVerification = true
        existing.verificationStatus = "needs_manual_verification"
        existing.detectionOutcome = "could_not_verify"
        existing.verificationReason = finding.verificationReason ?? existing.verificationReason
        existing.suppressRecommendation = finding.suppressRecommendation ?? existing.suppressRecommendation
      }
      if (severityRank(finding.severity) < severityRank(existing.severity)) {
        existing.severity = finding.severity
      }
      continue
    }

    const meta = getRuleMetadata(finding.ruleId)

    groups.set(key, {
      ruleId: finding.ruleId,
      title: meta?.title ?? finding.title,
      severity: finding.severity,
      recommendation: finding.recommendation,
      category: finding.category,
      scoreCategory: finding.scoreCategory,
      affectedPageIds: finding.pageId ? [finding.pageId] : [],
      affectedPaths: pagePath ? [pagePath] : [],
      occurrenceCount: 1,
      verificationStatus: finding.verificationStatus,
      detectionOutcome: finding.detectionOutcome,
      verificationReason: finding.verificationReason,
      suppressRecommendation: finding.suppressRecommendation,
      needsManualVerification:
        Boolean(finding.excludeFromScoring) || finding.detectionOutcome === "could_not_verify",
    })
  }

  return [...groups.values()].sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      b.occurrenceCount - a.occurrenceCount
  )
}
