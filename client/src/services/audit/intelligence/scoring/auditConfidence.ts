import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { AuditPage } from "@/types/auditEngine"
import {
  calculateAuditConfidenceFromSignals,
  type AuditConfidenceResult as EngineConfidenceResult,
} from "@/services/audit/intelligence/scoring/auditConfidenceEngine"

export type AuditConfidenceInput = {
  pages: AuditPage[]
  analyzedPageIds: Set<string>
  pageSnapshots: PageContentSnapshot[]
  applicableRuleCount: number
  executedRuleCount: number
  skippedPageCount?: number
  renderConfidenceScore?: number
  blockedPageCount?: number
  crawlFailureCount?: number
  renderSensitiveUnverifiedRatio?: number
  highRiskPlatform?: boolean
}

/** Backward-compatible result shape — extended with explainability fields */
export type AuditConfidenceResult = {
  score: number
  label: string
  tier: "High" | "Medium" | "Low"
  manualVerificationRecommended: boolean
  components: {
    crawlCompleteness: number
    analysisDepth: number
    contentReliability: number
    ruleIntegrity: number
  }
  confidenceReasons?: string[]
  confidenceWarnings?: string[]
  signals?: EngineConfidenceResult["signals"]
}

/**
 * Delegates to the signal-based confidence engine.
 * @see auditConfidenceEngine.ts
 */
export function calculateAuditConfidence(input: AuditConfidenceInput): AuditConfidenceResult {
  const engineResult = calculateAuditConfidenceFromSignals({
    pages: input.pages,
    pageSnapshots: input.pageSnapshots,
    analyzedPageIds: input.analyzedPageIds,
    applicableRuleCount: input.applicableRuleCount,
    executedRuleCount: input.executedRuleCount,
    skippedPageCount: input.skippedPageCount ?? 0,
    renderConfidenceScore: input.renderConfidenceScore,
    blockedPageCount: input.blockedPageCount ?? 0,
    crawlFailureCount: input.crawlFailureCount ?? 0,
    renderSensitiveUnverifiedRatio: input.renderSensitiveUnverifiedRatio,
    highRiskPlatform: input.highRiskPlatform,
  })

  return {
    score: engineResult.confidenceScore,
    label: engineResult.label,
    tier: engineResult.tier,
    manualVerificationRecommended: engineResult.manualVerificationRecommended,
    components: {
      crawlCompleteness: engineResult.components.crawlCompleteness,
      analysisDepth: engineResult.components.analysisDepth,
      contentReliability: engineResult.components.domExtraction,
      ruleIntegrity: engineResult.components.ruleCoverage,
    },
    confidenceReasons: engineResult.confidenceReasons,
    confidenceWarnings: engineResult.confidenceWarnings,
    signals: engineResult.signals,
  }
}

export type { EngineConfidenceResult }
