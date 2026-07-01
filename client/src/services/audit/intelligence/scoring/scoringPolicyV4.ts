import type { ScoreCategory } from "@/services/audit/scoring/calculateAuditScore"
import type { FindingSeverity } from "@/types/auditEngine"
import type { BusinessImpactLevel } from "@/services/audit/intelligence/types"

export const SCORING_ENGINE_VERSION_V4 = "Intelligence v4" as const

/** V4 impact weight ranges — penalty units per finding */
export const IMPACT_WEIGHT_BY_PRIORITY: Record<
  "critical" | "high" | "medium" | "low",
  number
> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
}

export const SEVERITY_IMPACT_WEIGHT: Record<FindingSeverity, number> = {
  critical: 22,
  high: 10,
  medium: 5,
  low: 2,
}

export const BUSINESS_IMPACT_WEIGHT: Record<BusinessImpactLevel, number> = {
  critical: 22,
  high: 10,
  medium: 5,
  low: 2,
}

export type CategoryScoringPolicyV4 = {
  baseline: number
  floor: number
  ceiling: number
  budget: number
  growthWeight: number
}

/** Category normalization — Conversion 30%, Trust 20%, UX 15%, Mobile 10% (+ Quality 25% in engine) */
export const CATEGORY_SCORING_POLICY_V4: Record<ScoreCategory, CategoryScoringPolicyV4> = {
  conversion: { baseline: 90, floor: 40, ceiling: 96, budget: 50, growthWeight: 0.3 },
  trust: { baseline: 88, floor: 40, ceiling: 95, budget: 48, growthWeight: 0.2 },
  ux: { baseline: 88, floor: 42, ceiling: 95, budget: 46, growthWeight: 0.15 },
  mobile: { baseline: 86, floor: 42, ceiling: 94, budget: 44, growthWeight: 0.1 },
}

export const QUALITY_PILLAR_POLICY = {
  baseline: 74,
  ceiling: 96,
  floor: 50,
  growthWeight: 0.25,
  maxPositiveBonus: 14,
} as const

export const GROWTH_SCORE_POLICY_V4 = {
  minScore: 35,
  maxScore: 98,
  maxPageScore: 97,
  pageScoreBase: 100,
  pageScoreBudget: 32,
  familyRepeatMultiplier: 0.55,
  clusterDiminishingMultiplier: 0.45,
} as const

export type PenaltyClusterId =
  | "hero"
  | "navigation"
  | "trust_social"
  | "lead_capture"
  | "thin_content"

export type PenaltyClusterDefinition = {
  id: PenaltyClusterId
  label: string
  ruleIds: string[]
  maxPenaltyUnits: number
  scoreCategory: ScoreCategory
}

export const PENALTY_CLUSTERS: PenaltyClusterDefinition[] = [
  {
    id: "hero",
    label: "Hero section",
    ruleIds: [
      "hero-missing-primary-cta",
      "hero-generic-headline",
      "hero-no-value-proposition",
      "hero-cta-below-fold",
      "conversion-weak-cta-language",
      "hero-multiple-competing-ctas",
    ],
    maxPenaltyUnits: 12,
    scoreCategory: "conversion",
  },
  {
    id: "navigation",
    label: "Navigation",
    ruleIds: [
      "conversion-too-many-nav-links",
      "site-inconsistent-navigation",
      "site-weak-internal-linking",
    ],
    maxPenaltyUnits: 8,
    scoreCategory: "ux",
  },
  {
    id: "trust_social",
    label: "Trust & social proof",
    ruleIds: [
      "trust-no-testimonials",
      "trust-no-social-proof",
      "services-no-proof",
      "pricing-missing-trust",
      "about-no-credibility",
    ],
    maxPenaltyUnits: 8,
    scoreCategory: "trust",
  },
  {
    id: "lead_capture",
    label: "Lead capture",
    ruleIds: ["conversion-no-lead-capture", "contact-no-form", "contact-missing-cta"],
    maxPenaltyUnits: 10,
    scoreCategory: "conversion",
  },
  {
    id: "thin_content",
    label: "Content depth",
    ruleIds: [
      "tech-thin-content",
      "services-thin-page",
      "features-thin-page",
      "about-thin-story",
      "blog-thin-article",
    ],
    maxPenaltyUnits: 6,
    scoreCategory: "ux",
  },
]

export type ScoreBand = {
  min: number
  max: number
  label: string
}

export const SCORE_BANDS: ScoreBand[] = [
  { min: 95, max: 100, label: "Industry-leading" },
  { min: 85, max: 94, label: "Excellent" },
  { min: 70, max: 84, label: "Strong" },
  { min: 55, max: 69, label: "Needs improvement" },
  { min: 40, max: 54, label: "Poor" },
  { min: 0, max: 39, label: "Critical" },
]

export function resolveScoreBand(score: number): ScoreBand {
  const band = SCORE_BANDS.find((entry) => score >= entry.min && score <= entry.max)
  return band ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}

/** Confidence multiplier — low-confidence findings reduce score less */
export function confidenceMultiplierV4(confidence: number): number {
  const normalized = Math.min(100, Math.max(0, confidence)) / 100
  return 0.45 + normalized * 0.55
}

export const POSITIVE_SIGNAL_DEFINITIONS = [
  { id: "privacy-policy", label: "Privacy policy", bonus: 2.5, absentRuleId: "trust-missing-privacy-policy" },
  { id: "terms-page", label: "Terms of service", bonus: 2, absentRuleId: "trust-missing-terms-page" },
  { id: "legal-footer", label: "Footer legal links", bonus: 1.5, absentRuleId: "site-footer-missing-legal" },
  { id: "contact-page", label: "Contact page", bonus: 2, absentRuleId: "trust-missing-contact-page" },
  { id: "strong-headings", label: "Strong heading structure", bonus: 2, absentRuleId: "tech-weak-heading-structure" },
  { id: "page-title", label: "Page title present", bonus: 1.5, absentRuleId: "tech-missing-page-title" },
  { id: "meta-description", label: "Meta description", bonus: 1.5, absentRuleId: "tech-missing-meta-description" },
  { id: "viewport", label: "Mobile viewport", bonus: 2, absentRuleId: "tech-missing-viewport" },
  { id: "no-overflow", label: "No horizontal overflow", bonus: 2, absentRuleId: "tech-horizontal-overflow" },
  { id: "h1-present", label: "H1 heading", bonus: 1.5, absentRuleId: "tech-missing-h1" },
  { id: "landmarks", label: "Accessibility landmarks", bonus: 1.5, absentRuleId: "a11y-missing-landmarks" },
  { id: "primary-cta", label: "Clear primary CTA", bonus: 2.5, absentRuleId: "hero-missing-primary-cta" },
  { id: "value-proposition", label: "Clear value proposition", bonus: 2, absentRuleId: "hero-no-value-proposition" },
  { id: "testimonials", label: "Testimonials", bonus: 2, absentRuleId: "trust-no-testimonials" },
  { id: "social-proof", label: "Social proof", bonus: 2, absentRuleId: "trust-no-social-proof" },
] as const

export type PositiveSignalId = (typeof POSITIVE_SIGNAL_DEFINITIONS)[number]["id"]

export function clusterIdForRule(ruleId: string): PenaltyClusterId | null {
  const cluster = PENALTY_CLUSTERS.find((entry) => entry.ruleIds.includes(ruleId))
  return cluster?.id ?? null
}
