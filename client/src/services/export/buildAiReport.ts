import { parseIntelligenceSnapshotFromHistory } from "@/services/audit/intelligence/diagnostics/intelligenceSnapshot"
import type { AuditComparisonRecord } from "@/services/audit/intelligence/diagnostics/intelligenceSnapshot"
import type { AuditDetail, Issue } from "@/types/audit"
import type { AuditSessionData } from "@/types/auditEngine"
import {
  AI_REPORT_SCHEMA_VERSION,
  type AiReportPageIntent,
  type AiReportRuleExecutionSummary,
  type AiReportScoreExplanation,
  type ConvertlyAiReport,
} from "@/services/export/types"

function buildScoreExplanation(audit: AuditDetail): AiReportScoreExplanation {
  const meta = audit.runMetadata
  const topImpacts = [...audit.issues, ...audit.siteFindings]
    .slice(0, 12)
    .map((item: Issue) => ({
      title: item.issue,
      severity: item.severity,
      category: item.category,
      page: item.page,
      impact: item.impact,
    }))

  const summaryParts = [
    `Growth Score ${audit.overallScore}`,
    meta.growthPotential != null ? `growth potential ${meta.growthPotential}` : null,
    meta.recoverablePoints != null && meta.recoverablePoints > 0
      ? `${meta.recoverablePoints} recoverable points`
      : null,
    meta.scoreCeiling != null && meta.scoreCeiling < 94
      ? `score ceiling ${meta.scoreCeiling}`
      : null,
  ].filter(Boolean)

  return {
    growthScore: audit.overallScore,
    growthPotential: meta.growthPotential,
    recoverablePoints: meta.recoverablePoints,
    scoreCeiling: meta.scoreCeiling,
    blockerCount: meta.blockerCount,
    summary: summaryParts.join(" · "),
    dimensions: audit.scoreBreakdown,
    topImpacts,
  }
}

function buildRuleExecutionSummary(audit: AuditDetail): AiReportRuleExecutionSummary {
  const meta = audit.runMetadata
  return {
    catalogRuleCount: meta.ruleCount,
    pagesAnalyzed: meta.pagesAnalyzed,
    pagesDiscovered: meta.pagesDiscovered,
    findingsProduced: meta.findingsCount,
    pageFindings: meta.pageFindingsCount,
    siteFindings: meta.siteFindingsCount,
    recommendations: audit.recommendations.length,
  }
}

function resolveComparisonRecord(
  audit: AuditDetail,
  sessionData: AuditSessionData | null
): AuditComparisonRecord | undefined {
  if (!sessionData) return undefined

  const snapshot = parseIntelligenceSnapshotFromHistory(
    sessionData.history.map((event) => event.message)
  )
  if (snapshot?.comparisonRecord) return snapshot.comparisonRecord

  return {
    auditId: audit.id,
    websiteUrl: audit.websiteUrl ?? `https://${audit.domain}`,
    domain: audit.domain,
    auditedAt: sessionData.session.updatedAt,
    growthScore: audit.overallScore,
    growthPotential: audit.runMetadata.growthPotential ?? audit.overallScore,
    scoreCeiling: audit.runMetadata.scoreCeiling ?? audit.overallScore,
    findingsCount: audit.runMetadata.findingsCount,
    pagesAnalyzed: audit.runMetadata.pagesAnalyzed,
    auditEngineVersion: audit.runMetadata.auditEngineVersion,
  }
}

function buildPageIntents(
  audit: AuditDetail,
  sessionData: AuditSessionData | null
): AiReportPageIntent[] {
  if (!sessionData) return []

  const snapshot = parseIntelligenceSnapshotFromHistory(
    sessionData.history.map((event) => event.message)
  )
  if (!snapshot?.pageIntents) return []

  return audit.pageFindings
    .map((page) => {
      const intent = snapshot.pageIntents[page.id]
      if (!intent) return null
      return {
        pageId: page.id,
        path: page.path,
        title: page.label,
        intent,
      }
    })
    .filter((item): item is AiReportPageIntent => item != null)
}

export function buildAiReport(
  audit: AuditDetail,
  sessionData: AuditSessionData | null
): ConvertlyAiReport {
  const meta = audit.runMetadata
  const websiteUrl = audit.websiteUrl ?? `https://${audit.domain}`

  return {
    schemaVersion: AI_REPORT_SCHEMA_VERSION,
    product: "Convertly",
    exportedAt: new Date().toISOString(),
    audit: {
      id: audit.id,
      name: audit.name,
      status: audit.status,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      completedAtDate: audit.completedAtDate,
      website: {
        url: websiteUrl,
        domain: audit.domain,
      },
      scores: {
        growthScore: audit.overallScore,
        previousScore: audit.previousScore,
        scoreDelta: audit.scoreDelta,
      },
      scoreExplanation: buildScoreExplanation(audit),
      confidence: {
        score: meta.auditConfidence,
        label: meta.auditConfidenceLabel,
      },
      dimensions: audit.scoreBreakdown,
      pageAnalysis: audit.pageFindings,
      siteFindings: audit.siteFindings,
      prioritizedIssues: audit.issues,
      recommendations: audit.recommendations,
      timeline: audit.timeline,
      stats: audit.stats,
      runMetadata: meta,
      intelligence: {
        auditEngineVersion: meta.auditEngineVersion,
        pageIntents: buildPageIntents(audit, sessionData),
        ruleExecutionSummary: buildRuleExecutionSummary(audit),
        recoverableScore: meta.recoverablePoints,
        scoreCeiling: meta.scoreCeiling,
        growthPotential: meta.growthPotential,
        comparisonRecord: resolveComparisonRecord(audit, sessionData),
      },
    },
  }
}

export function serializeAiReport(report: ConvertlyAiReport): string {
  return JSON.stringify(report, null, 2)
}
