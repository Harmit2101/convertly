import type { PositiveScoringResult } from "@/services/audit/intelligence/scoring/positiveScoring"

export type AuditStrength = {
  id: string
  label: string
}

const STRENGTH_DISPLAY_LABELS: Record<string, string> = {
  "privacy-policy": "Privacy policy detected",
  "terms-page": "Terms of service detected",
  "legal-footer": "Footer legal links present",
  "contact-page": "Contact page available",
  "strong-headings": "Strong heading structure",
  "page-title": "Page titles present",
  "meta-description": "Meta descriptions present",
  viewport: "Good mobile viewport configuration",
  "no-overflow": "Responsive layout — no horizontal overflow",
  "h1-present": "Clear H1 headings",
  landmarks: "Accessibility landmarks detected",
  "primary-cta": "Clear primary call-to-action",
  "value-proposition": "Clear value proposition",
  testimonials: "Testimonials present",
  "social-proof": "Social proof detected",
  "schema-markup": "Structured data (schema) detected",
  "performance-baseline": "Solid technical performance baseline",
}

const MAX_STRENGTHS = 5

/**
 * Builds "what you're doing well" strengths from detected positive signals only.
 */
export function buildAuditStrengths(
  positiveScoring: PositiveScoringResult
): AuditStrength[] {
  const ranked = [...positiveScoring.awards]
    .sort((a, b) => b.bonus - a.bonus)
    .slice(0, MAX_STRENGTHS)

  return ranked.map((award) => ({
    id: award.id,
    label: STRENGTH_DISPLAY_LABELS[award.id] ?? award.label,
  }))
}
