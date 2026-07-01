import type { DetectedPageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import type { DetectedWebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import type { RuleExecutionSummary } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { ConsultantRecommendation } from "@/services/audit/intelligence/recommendations/consultantRecommendation"
import type { ScoreExplanation } from "@/services/audit/intelligence/scoring/scoreExplanation"
import type { AuditConfidenceResult } from "@/services/audit/intelligence/scoring/auditConfidence"
import type { PageScoreBreakdown } from "@/services/audit/intelligence/scoring/pageScoreDiagnostics"
import { PAGE_SCORE_EQUATION } from "@/services/audit/intelligence/recommendations/consultantRecommendation"

export type PageDiagnosticReport = {
  pageId: string
  path: string
  pageIntent: string
  scoreBreakdown: PageScoreBreakdown
  finalEquation: string
}

export type AuditDiagnosticsBundle = {
  engineVersion: string
  generatedAt: string
  websiteIntent?: DetectedWebsiteIntent
  pageIntents: Array<{ pageId: string; path: string; intent: DetectedPageIntent }>
  ruleExecution: RuleExecutionSummary
  scoreExplanation: ScoreExplanation
  auditConfidence: AuditConfidenceResult
  consultantRecommendations: ConsultantRecommendation[]
  pageDiagnostics: PageDiagnosticReport[]
}

export function isAuditDiagnosticsEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_AUDIT_DIAGNOSTICS === "true"
}

export function logAuditDiagnostics(bundle: AuditDiagnosticsBundle): void {
  if (!isAuditDiagnosticsEnabled()) return

  console.groupCollapsed(
    `[Convertly Audit Diagnostics] ${bundle.pageDiagnostics.length} pages · Growth ${bundle.scoreExplanation.growthScore}${bundle.websiteIntent ? ` · ${bundle.websiteIntent.websiteIntent}` : ""}`
  )
  console.info("Score equation:", bundle.pageDiagnostics[0]?.finalEquation ?? PAGE_SCORE_EQUATION)
  console.info("Growth explanation:", bundle.scoreExplanation)
  console.info("Confidence:", {
    score: bundle.auditConfidence.score,
    label: bundle.auditConfidence.label,
    reasons: bundle.auditConfidence.confidenceReasons,
    warnings: bundle.auditConfidence.confidenceWarnings,
  })
  console.info("Rule execution:", bundle.ruleExecution)
  console.table(
    bundle.pageDiagnostics.map((page) => ({
      path: page.path,
      intent: page.pageIntent,
      score: page.scoreBreakdown.finalScore,
      penalty: page.scoreBreakdown.weightedPenalty,
    }))
  )
  console.groupEnd()
}

export function buildPageDiagnosticReport(input: {
  pageId: string
  path: string
  pageIntent: string
  scoreBreakdown: PageScoreBreakdown
}): PageDiagnosticReport {
  return {
    ...input,
    finalEquation: PAGE_SCORE_EQUATION,
  }
}
