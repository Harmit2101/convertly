import type {
  AuditDetail,
  Issue,
  PageFinding,
  Recommendation,
  ScoreBreakdownItem,
  SiteFinding,
  TimelineEvent,
} from "@/types/audit"

export const AI_REPORT_SCHEMA_VERSION = "1.0.0" as const

export type ExportFormat = "ai-report" | "pdf" | "developer-package"

export type AiReportScoreExplanation = {
  growthScore: number
  growthPotential?: number
  recoverablePoints?: number
  scoreCeiling?: number
  blockerCount?: number
  summary: string
  dimensions: ScoreBreakdownItem[]
  topImpacts: Array<{
    title: string
    severity: string
    category?: string
    page?: string
    impact: string
  }>
}

export type AiReportConfidence = {
  score?: number
  label?: string
}

export type AiReportRuleExecutionSummary = {
  catalogRuleCount: number
  pagesAnalyzed: number
  pagesDiscovered: number
  findingsProduced: number
  pageFindings: number
  siteFindings: number
  recommendations: number
}

export type AiReportPageIntent = {
  pageId: string
  path: string
  title: string
  intent: string
}

export type ConvertlyAiReport = {
  schemaVersion: typeof AI_REPORT_SCHEMA_VERSION
  product: "Convertly"
  exportedAt: string
  audit: {
    id: string
    name: string
    status: AuditDetail["status"]
    createdAt?: string
    completedAt: string
    completedAtDate?: string
    website: {
      url: string
      domain: string
    }
    scores: {
      growthScore: number
      previousScore: number
      scoreDelta: number
    }
    scoreExplanation: AiReportScoreExplanation
    confidence: AiReportConfidence
    dimensions: ScoreBreakdownItem[]
    pageAnalysis: PageFinding[]
    siteFindings: SiteFinding[]
    prioritizedIssues: Issue[]
    recommendations: Recommendation[]
    timeline: TimelineEvent[]
    stats: AuditDetail["stats"]
    runMetadata: AuditDetail["runMetadata"]
    intelligence: {
      auditEngineVersion: string
      pageIntents: AiReportPageIntent[]
      ruleExecutionSummary: AiReportRuleExecutionSummary
      recoverableScore?: number
      scoreCeiling?: number
      growthPotential?: number
      comparisonRecord?: import("@/services/audit/intelligence/diagnostics/intelligenceSnapshot").AuditComparisonRecord
    }
  }
}

export type ExportPayload =
  | { format: "ai-report"; blob: Blob; filename: string }
  | { format: "pdf"; blob: Blob; filename: string }
