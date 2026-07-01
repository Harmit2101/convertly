import type { RulePackId } from "@/services/audit/intelligence/rules/rulePacks"

/**
 * Semantic page intents — used for context-aware rule scoping.
 * Each intent maps to a consultant profile (goals, components, rule packs).
 */
export type PageIntent =
  | "homepage"
  | "landing_page"
  | "pricing"
  | "product"
  | "features"
  | "blog"
  | "article"
  | "documentation"
  | "knowledge_base"
  | "api_docs"
  | "changelog"
  | "login"
  | "signup"
  | "dashboard"
  | "account_settings"
  | "contact"
  | "about"
  | "careers"
  | "support"
  | "faq"
  | "legal"
  | "checkout"
  | "search"
  | "error_page"
  | "portfolio"
  | "services"
  | "marketing"
  | "generic"

export type PageGoal =
  | "convert_visitors"
  | "communicate_value"
  | "build_trust"
  | "capture_leads"
  | "enable_signup"
  | "enable_login"
  | "inform_users"
  | "support_users"
  | "document_product"
  | "publish_content"
  | "comply_legal"
  | "complete_purchase"
  | "navigate_site"

export type PageIntentProfile = {
  pageIntent: PageIntent
  label: string
  primaryGoal: PageGoal
  secondaryGoal: PageGoal
  /** UI/structural elements a consultant expects on this page type */
  expectedComponents: string[]
  preferredRulePacks: RulePackId[]
  ignoredRulePacks: RulePackId[]
}

export type DetectedPageIntent = {
  pageIntent: PageIntent
  profile: PageIntentProfile
  /** 0–100 deterministic confidence from signal matches */
  detectionConfidence: number
  matchedSignals: string[]
}
