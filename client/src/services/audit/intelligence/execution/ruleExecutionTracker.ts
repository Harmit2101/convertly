import type { PageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import type { RuleSkipReason } from "@/services/audit/intelligence/rules/ruleApplicability"

import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"

export type AppliedRuleRecord = {
  ruleId: string
  pageId?: string
  pagePath?: string
  pageIntent?: PageIntent
  passed: boolean
  findingCount: number
  executionOrder: number
}

export type SkippedRuleRecord = {
  ruleId: string
  pageId?: string
  pagePath?: string
  pageIntent?: PageIntent
  reason: RuleSkipReason
  message: string
}

export type RuleExecutionSummary = {
  appliedRules: AppliedRuleRecord[]
  skippedRules: SkippedRuleRecord[]
  rulesPassed: number
  rulesFailed: number
  rulesSkipped: number
}

export class RuleExecutionTracker {
  private order = 0
  private applied: AppliedRuleRecord[] = []
  private skipped: SkippedRuleRecord[] = []

  recordApplied(input: Omit<AppliedRuleRecord, "executionOrder">): void {
    this.order += 1
    this.applied.push({ ...input, executionOrder: this.order })
  }

  recordSkipped(record: SkippedRuleRecord): void {
    this.skipped.push(record)
  }

  recordGateSkippedPage(input: {
    pageId: string
    pagePath: string
    ruleIds: string[]
    pageIntent: PageIntent
  }): void {
    for (const ruleId of input.ruleIds) {
      this.recordSkipped({
        ruleId,
        pageId: input.pageId,
        pagePath: input.pagePath,
        pageIntent: input.pageIntent,
        reason: "page_analysis_gate_failed",
        message: "Page did not pass analysis gate — rules not executed",
      })
    }
  }

  buildSummary(): RuleExecutionSummary {
    const rulesFailed = this.applied.filter((record) => record.findingCount > 0).length
    const rulesPassed = this.applied.filter((record) => record.findingCount === 0).length

    return {
      appliedRules: [...this.applied],
      skippedRules: [...this.skipped],
      rulesPassed,
      rulesFailed,
      rulesSkipped: this.skipped.length,
    }
  }
}

/** Counts rule evaluations per score category — used for category budget normalization */
export function countEvaluatedRulesByCategory(
  summary: RuleExecutionSummary
): Record<ScoreCategory, number> {
  const counts: Record<ScoreCategory, number> = {
    conversion: 0,
    trust: 0,
    mobile: 0,
    ux: 0,
  }

  for (const record of summary.appliedRules) {
    const meta = getRuleMetadata(record.ruleId)
    if (!meta) continue
    counts[meta.scoreCategory] += 1
  }

  return counts
}
