import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import { PLATFORM_WEBSITE_INTENTS } from "@/services/audit/intelligence/websiteIntentTypes"

export type WebsiteRuleApplicabilitySpec = {
  applicableIntents: WebsiteIntent[] | "all"
  excludedIntents: WebsiteIntent[]
  optional: boolean
  priority: "critical" | "high" | "medium" | "low"
}

const MARKETING_INTENTS: WebsiteIntent[] = [
  "saas",
  "agency",
  "marketing",
  "commerce",
  "ecommerce",
  "marketplace",
]
const COMMERCIAL_INTENTS: WebsiteIntent[] = [
  ...MARKETING_INTENTS,
  "portfolio",
  "community",
]
const PLATFORM_INTENTS: WebsiteIntent[] = PLATFORM_WEBSITE_INTENTS

/** Pack-level defaults — rules inherit from their primary pack */
const PACK_WEBSITE_INTENT_DEFAULTS: Partial<Record<RulePackId, WebsiteIntent[] | "all">> = {
  "shared.technical": "all",
  "shared.accessibility": "all",
  "homepage.conversion": MARKETING_INTENTS,
  "homepage.trust": MARKETING_INTENTS,
  "services.conversion": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketplace", "marketing"],
  "services.trust": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketplace", "marketing"],
  "services.content": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketplace", "marketing"],
  "about.trust": COMMERCIAL_INTENTS,
  "about.content": COMMERCIAL_INTENTS,
  "about.ux": COMMERCIAL_INTENTS,
  "pricing.pricing": ["saas", "ecommerce", "marketplace"],
  "pricing.conversion": ["saas", "ecommerce", "marketplace"],
  "pricing.trust": ["saas", "ecommerce", "marketplace"],
  "contact.conversion": COMMERCIAL_INTENTS,
  "contact.technical": COMMERCIAL_INTENTS,
  "projects.portfolio": ["agency", "portfolio", "saas", "marketing", "marketplace"],
  "projects.conversion": ["agency", "portfolio", "saas", "marketing", "marketplace"],
  "blog.seo": ["blog", "saas", "agency", "community"],
  "blog.content": ["blog", "saas", "agency", "community"],
  "legal.compliance": "all",
  "signup.conversion": ["saas", "ecommerce", "marketplace", "community"],
  "login.conversion": "all",
  "site.navigation-trust": "all",
}

/** Sparse per-rule overrides for intent-aware scoring */
export const WEBSITE_RULE_APPLICABILITY_OVERRIDES: Partial<
  Record<string, Partial<WebsiteRuleApplicabilitySpec>>
> = {
  "hero-missing-primary-cta": {
    applicableIntents: MARKETING_INTENTS,
    excludedIntents: PLATFORM_INTENTS,
    optional: false,
    priority: "high",
  },
  "hero-no-value-proposition": {
    applicableIntents: MARKETING_INTENTS,
    excludedIntents: PLATFORM_INTENTS,
    optional: false,
    priority: "high",
  },
  "hero-generic-headline": {
    applicableIntents: MARKETING_INTENTS,
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "medium",
  },
  "hero-cta-below-fold": {
    applicableIntents: MARKETING_INTENTS,
    excludedIntents: PLATFORM_INTENTS,
    optional: false,
    priority: "high",
  },
  "hero-multiple-competing-ctas": {
    applicableIntents: MARKETING_INTENTS,
    excludedIntents: ["search_engine", "documentation"],
    optional: true,
    priority: "medium",
  },
  "conversion-no-lead-capture": {
    applicableIntents: ["agency", "saas"],
    excludedIntents: [...PLATFORM_INTENTS, "ecommerce", "marketplace", "blog", "community"],
    optional: true,
    priority: "medium",
  },
  "conversion-no-urgency": {
    applicableIntents: ["saas", "ecommerce", "marketplace"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "low",
  },
  "conversion-weak-cta-language": {
    applicableIntents: MARKETING_INTENTS,
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "medium",
  },
  "trust-no-testimonials": {
    applicableIntents: ["agency", "saas", "ecommerce"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "low",
  },
  "trust-no-social-proof": {
    applicableIntents: ["agency", "saas", "ecommerce"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "low",
  },
  "trust-missing-contact-page": {
    applicableIntents: COMMERCIAL_INTENTS,
    excludedIntents: ["search_engine", "developer_platform"],
    optional: true,
    priority: "medium",
  },
  "site-missing-about-link": {
    applicableIntents: ["agency", "saas", "ecommerce"],
    excludedIntents: ["search_engine", "developer_platform", "documentation"],
    optional: true,
    priority: "low",
  },
  "site-missing-services-link": {
    applicableIntents: ["agency"],
    excludedIntents: PLATFORM_INTENTS,
    optional: true,
    priority: "medium",
  },
  "conversion-too-many-nav-links": {
    applicableIntents: COMMERCIAL_INTENTS,
    excludedIntents: ["search_engine"],
    optional: true,
    priority: "low",
  },
  "tech-thin-content": {
    applicableIntents: "all",
    excludedIntents: ["search_engine"],
    optional: true,
    priority: "low",
  },
}

/** Blockers that should not cap scores for specific website intents */
export const WEBSITE_INTENT_BLOCKER_EXCLUSIONS: Partial<
  Record<WebsiteIntent, string[]>
> = {
  search_engine: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-missing-contact-page",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "site-footer-missing-legal",
    "site-missing-about-link",
    "site-missing-services-link",
  ],
  developer_platform: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-missing-contact-page",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "conversion-no-urgency",
    "site-missing-about-link",
    "site-missing-services-link",
  ],
  documentation: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-no-testimonials",
    "trust-no-social-proof",
  ],
  open_source: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-missing-contact-page",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "conversion-no-urgency",
    "site-missing-about-link",
    "site-missing-services-link",
  ],
  dashboard: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-no-testimonials",
    "trust-no-social-proof",
    "trust-missing-contact-page",
  ],
  marketing: [],
  portfolio: [],
  commerce: [],
  blog: [
    "hero-missing-primary-cta",
    "conversion-no-lead-capture",
    "trust-no-testimonials",
  ],
}

function resolvePackDefaults(packIds: RulePackId[]): WebsiteIntent[] | "all" {
  for (const packId of packIds) {
    const defaults = PACK_WEBSITE_INTENT_DEFAULTS[packId]
    if (defaults) return defaults
  }
  return "all"
}

export function resolveWebsiteRuleApplicabilitySpec(
  ruleId: string
): WebsiteRuleApplicabilitySpec {
  const override = WEBSITE_RULE_APPLICABILITY_OVERRIDES[ruleId]
  const meta = getRuleMetadata(ruleId)

  if (!meta) {
    return {
      applicableIntents: "all",
      excludedIntents: [],
      optional: false,
      priority: "medium",
    }
  }

  const packDefaults = resolvePackDefaults(meta.packIds)

  return {
    applicableIntents: override?.applicableIntents ?? packDefaults,
    excludedIntents: override?.excludedIntents ?? [],
    optional: override?.optional ?? false,
    priority: override?.priority ?? priorityFromSeverity(meta.severity),
  }
}

function priorityFromSeverity(
  severity: import("@/types/auditEngine").FindingSeverity
): WebsiteRuleApplicabilitySpec["priority"] {
  switch (severity) {
    case "critical":
      return "critical"
    case "high":
      return "high"
    case "medium":
      return "medium"
    default:
      return "low"
  }
}

/**
 * Returns whether a rule finding should contribute to scoring for this website intent.
 * Non-applicable rules still appear as recommendations — they score zero penalty.
 */
export function isRuleApplicableToWebsiteIntent(
  ruleId: string,
  websiteIntent: WebsiteIntent
): boolean {
  const spec = resolveWebsiteRuleApplicabilitySpec(ruleId)

  if (spec.excludedIntents.includes(websiteIntent)) {
    return false
  }

  if (spec.applicableIntents === "all") {
    return true
  }

  return spec.applicableIntents.includes(websiteIntent)
}

export function isBlockerExcludedForWebsiteIntent(
  ruleId: string,
  websiteIntent: WebsiteIntent
): boolean {
  const exclusions = WEBSITE_INTENT_BLOCKER_EXCLUSIONS[websiteIntent] ?? []
  return exclusions.includes(ruleId)
}
