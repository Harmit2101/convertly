import {
  buildFindingDescription,
  resolveRuleConfidence,
} from "@/services/audit/intelligence/rules/buildProductionRules"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import { getRuleRegistry } from "@/services/audit/intelligence/rules/ruleRegistry"
import { detectPageIntent } from "@/services/audit/intelligence/pageIntentDetection"
import type { DetectedPageIntent } from "@/services/audit/intelligence/pageIntentTypes"
import { getRuleIdsForIntent } from "@/services/audit/intelligence/pageIntentDetection"
import {
  evaluateRuleApplicability,
} from "@/services/audit/intelligence/rules/ruleApplicability"
import { getSiteRuleIds, getPackRuleIds } from "@/services/audit/intelligence/rules/rulePacks"
import type { RuleExecutionTracker } from "@/services/audit/intelligence/execution/ruleExecutionTracker"
import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import type { AuditPage } from "@/types/auditEngine"
import type { PageRuleContext, SiteRuleContext } from "@/services/audit/intelligence/types"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { ScoredFindingInput } from "@/services/audit/scoring/calculateAuditScore"
import type { RuleDefinition } from "@/services/audit/intelligence/rules/ruleDefinition"
import { isRenderSensitiveRule } from "@/services/audit/intelligence/rendering/renderSensitiveRules"

function draftFromRule(
  rule: RuleDefinition,
  context: PageRuleContext | SiteRuleContext,
  pageId?: string
): IntelligenceFindingDraft {
  return {
    ruleId: rule.id,
    pageId,
    category: rule.category,
    legacyCategory: getRuleMetadata(rule.id)?.category ?? "ux",
    severity: rule.severity,
    scoreCategory: rule.scoreCategory,
    title: rule.title,
    description: rule.description,
    recommendation: rule.recommendation(context),
    confidence: resolveRuleConfidence(rule.id),
    businessImpact: rule.businessImpact,
    weight: rule.weight,
    scope: rule.scope,
    evidence: [],
    tags: rule.tags,
  }
}

async function evaluateRule(
  rule: RuleDefinition,
  context: PageRuleContext | SiteRuleContext,
  pageId?: string
): Promise<IntelligenceFindingDraft[]> {
  const result = await rule.detector(context)
  if (!result.triggered) return []

  const meta = getRuleMetadata(rule.id)
  const finding = draftFromRule(rule, context, pageId)
  finding.description = buildFindingDescription(rule.id, context, result.evidence ?? [])
  finding.recommendation = rule.recommendation(context)
  finding.confidence = resolveRuleConfidence(rule.id, result.confidence)
  finding.evidence = result.evidence ?? []
  finding.severity = meta?.severity ?? rule.severity

  return [finding]
}

function getPageRuleUniverse(): RuleDefinition[] {
  const registry = getRuleRegistry()
  const ids = new Set<string>()
  for (const packId of [
    "shared.technical",
    "shared.accessibility",
    "homepage.conversion",
    "homepage.trust",
    "services.conversion",
    "services.trust",
    "services.content",
    "about.trust",
    "about.content",
    "about.ux",
    "pricing.pricing",
    "pricing.conversion",
    "pricing.trust",
    "contact.conversion",
    "contact.technical",
    "projects.portfolio",
    "projects.conversion",
    "blog.seo",
    "blog.content",
    "legal.compliance",
    "signup.conversion",
    "login.conversion",
  ] as const) {
    for (const ruleId of getPackRuleIds(packId)) {
      ids.add(ruleId)
    }
  }
  return registry.getByIds([...ids]).filter((rule) => rule.scope === "page")
}

export async function executePageRules(
  context: PageRuleContext,
  tracker?: RuleExecutionTracker,
  options?: { trustworthyForUxRules?: boolean }
): Promise<{ findings: IntelligenceFindingDraft[]; detected: DetectedPageIntent }> {
  const registry = getRuleRegistry()
  const detected = detectPageIntent({
    page: context.currentSnapshot.page,
    snapshot: context.currentSnapshot,
  })
  const intent = detected.pageIntent
  const applicableIds = new Set(getRuleIdsForIntent(intent))

  for (const rule of getPageRuleUniverse()) {
    const applicability = evaluateRuleApplicability(rule.id, intent)
    if (!applicability.applicable) {
      tracker?.recordSkipped({
        ruleId: rule.id,
        pageId: context.currentSnapshot.page.id,
        pagePath: context.currentSnapshot.page.path,
        pageIntent: intent,
        reason: applicability.reason ?? "not_applicable_page_type",
        message: applicability.message,
      })
    }
  }

  const rules = registry
    .getByIds([...applicableIds])
    .filter((rule) => rule.scope === "page")

  const findings: IntelligenceFindingDraft[] = []

  for (const rule of rules) {
    if (options?.trustworthyForUxRules === false && isRenderSensitiveRule(rule.id)) {
      tracker?.recordSkipped({
        ruleId: rule.id,
        pageId: context.currentSnapshot.page.id,
        pagePath: context.currentSnapshot.page.path,
        pageIntent: intent,
        reason: "low_render_confidence",
        message: "Render confidence too low — UX/CRO rule skipped",
      })
      continue
    }

    const ruleFindings = await evaluateRule(rule, context, context.currentSnapshot.page.id)
    findings.push(...ruleFindings)

    tracker?.recordApplied({
      ruleId: rule.id,
      pageId: context.currentSnapshot.page.id,
      pagePath: context.currentSnapshot.page.path,
      pageIntent: intent,
      passed: ruleFindings.length === 0,
      findingCount: ruleFindings.length,
    })
  }

  return { findings, detected }
}

export async function executeSiteRules(
  context: SiteRuleContext,
  tracker?: RuleExecutionTracker
): Promise<IntelligenceFindingDraft[]> {
  const registry = getRuleRegistry()
  const ruleIds = getSiteRuleIds()
  const rules = registry.getByIds(ruleIds).filter((rule) => rule.scope === "site")
  const findings: IntelligenceFindingDraft[] = []

  for (const rule of rules) {
    const ruleFindings = await evaluateRule(rule, context)
    findings.push(...ruleFindings)

    tracker?.recordApplied({
      ruleId: rule.id,
      passed: ruleFindings.length === 0,
      findingCount: ruleFindings.length,
    })
  }

  return findings
}

export function toScoredFindingInputs(
  findings: IntelligenceFindingDraft[]
): ScoredFindingInput[] {
  return findings.map((finding) => ({
    ruleId: finding.ruleId,
    scoreCategory: finding.scoreCategory,
    severity: finding.severity,
    category: finding.legacyCategory,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    pageId: finding.pageId,
  }))
}

export function dedupeFindings(
  findings: IntelligenceFindingDraft[]
): IntelligenceFindingDraft[] {
  const seen = new Set<string>()
  const deduped: IntelligenceFindingDraft[] = []

  for (const finding of findings) {
    const key = `${finding.ruleId}:${finding.pageId ?? "site"}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(finding)
  }

  return deduped
}

export function countRulesForPage(page: AuditPage, snapshot?: PageContentSnapshot): number {
  const detected = detectPageIntent({ page, snapshot })
  return getRuleIdsForIntent(detected.pageIntent).length
}

export function countApplicableRuleEvaluations(
  pages: AuditPage[],
  snapshotsByPageId?: Map<string, PageContentSnapshot>
): number {
  const siteCount = getSiteRuleIds().length
  const pageCount = pages.reduce((sum, page) => {
    const snapshot = snapshotsByPageId?.get(page.id)
    return sum + countRulesForPage(page, snapshot)
  }, 0)
  return siteCount + pageCount
}

export function countExecutedRuleEvaluations(
  analyzedPages: AuditPage[],
  snapshotsByPageId?: Map<string, PageContentSnapshot>
): number {
  const siteCount = getSiteRuleIds().length
  const pageCount = analyzedPages.reduce((sum, page) => {
    const snapshot = snapshotsByPageId?.get(page.id)
    return sum + countRulesForPage(page, snapshot)
  }, 0)
  return siteCount + pageCount
}

export function getCatalogEntry(ruleId: string) {
  return getRuleMetadata(ruleId)
}
