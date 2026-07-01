import { type RulePackId } from "@/services/audit/intelligence/rules/rulePacks"
import type { PageIntent, PageIntentProfile } from "@/services/audit/intelligence/pageIntentTypes"

const SHARED: RulePackId[] = ["shared.technical", "shared.accessibility"]

function profile(
  pageIntent: PageIntent,
  label: string,
  primaryGoal: PageIntentProfile["primaryGoal"],
  secondaryGoal: PageIntentProfile["secondaryGoal"],
  expectedComponents: string[],
  preferredRulePacks: RulePackId[],
  ignoredRulePacks: RulePackId[] = []
): PageIntentProfile {
  return {
    pageIntent,
    label,
    primaryGoal,
    secondaryGoal,
    expectedComponents,
    preferredRulePacks: [...SHARED, ...preferredRulePacks],
    ignoredRulePacks,
  }
}

export const PAGE_INTENT_PROFILES: Record<PageIntent, PageIntentProfile> = {
  homepage: profile(
    "homepage",
    "Homepage",
    "convert_visitors",
    "communicate_value",
    ["hero", "primary_cta", "value_proposition", "navigation", "social_proof"],
    ["homepage.conversion", "homepage.trust"]
  ),
  landing_page: profile(
    "landing_page",
    "Landing Page",
    "capture_leads",
    "convert_visitors",
    ["hero", "primary_cta", "benefits", "social_proof"],
    ["homepage.conversion"],
    ["homepage.trust"]
  ),
  pricing: profile(
    "pricing",
    "Pricing",
    "convert_visitors",
    "build_trust",
    ["plan_cards", "pricing_cta", "feature_comparison", "faq"],
    ["pricing.pricing", "pricing.conversion", "pricing.trust"]
  ),
  product: profile(
    "product",
    "Product",
    "communicate_value",
    "convert_visitors",
    ["feature_sections", "product_cta", "screenshots", "benefits"],
    ["services.conversion", "services.trust", "services.content"]
  ),
  features: profile(
    "features",
    "Features",
    "communicate_value",
    "convert_visitors",
    ["feature_grid", "comparison", "demo_cta"],
    ["services.conversion", "services.trust", "services.content"]
  ),
  blog: profile(
    "blog",
    "Blog",
    "publish_content",
    "inform_users",
    ["article_list", "categories", "subscribe_cta"],
    ["blog.seo", "blog.content"]
  ),
  article: profile(
    "article",
    "Article",
    "inform_users",
    "publish_content",
    ["headline", "author", "publish_date", "body_content", "related_posts"],
    ["blog.seo", "blog.content"]
  ),
  documentation: profile(
    "documentation",
    "Documentation",
    "document_product",
    "support_users",
    ["sidebar_nav", "code_samples", "search", "version_selector"],
    ["blog.seo", "blog.content"]
  ),
  knowledge_base: profile(
    "knowledge_base",
    "Knowledge Base",
    "support_users",
    "inform_users",
    ["search", "categories", "article_links"],
    ["blog.content"]
  ),
  api_docs: profile(
    "api_docs",
    "API Docs",
    "document_product",
    "inform_users",
    ["endpoint_reference", "authentication_section", "code_samples"],
    ["blog.seo"],
    ["homepage.conversion", "homepage.trust", "services.conversion"]
  ),
  changelog: profile(
    "changelog",
    "Changelog",
    "inform_users",
    "build_trust",
    ["release_list", "version_dates", "change_descriptions"],
    ["blog.content"]
  ),
  login: profile(
    "login",
    "Login",
    "enable_login",
    "build_trust",
    ["login_form", "password_recovery", "security_notice"],
    ["login.conversion"]
  ),
  signup: profile(
    "signup",
    "Signup",
    "enable_signup",
    "convert_visitors",
    ["signup_form", "value_reminder", "trust_signals"],
    ["signup.conversion"]
  ),
  dashboard: profile(
    "dashboard",
    "Dashboard",
    "navigate_site",
    "inform_users",
    ["app_shell", "navigation", "user_menu"],
    ["login.conversion"],
    ["homepage.conversion", "homepage.trust", "pricing.conversion"]
  ),
  account_settings: profile(
    "account_settings",
    "Account Settings",
    "navigate_site",
    "build_trust",
    ["settings_form", "save_actions", "security_options"],
    ["login.conversion"],
    ["homepage.conversion", "pricing.conversion"]
  ),
  contact: profile(
    "contact",
    "Contact",
    "capture_leads",
    "build_trust",
    ["contact_form", "email", "phone", "business_info"],
    ["contact.conversion", "contact.technical"]
  ),
  about: profile(
    "about",
    "About",
    "build_trust",
    "communicate_value",
    ["mission", "team", "company_story"],
    ["about.trust", "about.content", "about.ux"]
  ),
  careers: profile(
    "careers",
    "Careers",
    "capture_leads",
    "build_trust",
    ["job_listings", "culture_section", "apply_cta"],
    ["about.trust", "about.content"]
  ),
  support: profile(
    "support",
    "Support",
    "support_users",
    "inform_users",
    ["help_links", "contact_options", "search"],
    ["contact.conversion", "contact.technical"]
  ),
  faq: profile(
    "faq",
    "FAQ",
    "support_users",
    "inform_users",
    ["question_list", "accordion", "contact_escalation"],
    ["blog.content", "contact.conversion"]
  ),
  legal: profile(
    "legal",
    "Legal",
    "comply_legal",
    "build_trust",
    ["policy_body", "last_updated", "contact_reference"],
    ["legal.compliance"]
  ),
  checkout: profile(
    "checkout",
    "Checkout",
    "complete_purchase",
    "build_trust",
    ["cart_summary", "payment_form", "trust_badges"],
    ["pricing.conversion", "pricing.trust"],
    ["homepage.conversion", "blog.content"]
  ),
  search: profile(
    "search",
    "Search",
    "navigate_site",
    "inform_users",
    ["search_input", "results_list", "filters"],
    [],
    ["homepage.conversion", "homepage.trust", "pricing.conversion", "services.conversion"]
  ),
  error_page: profile(
    "error_page",
    "Error Page",
    "navigate_site",
    "inform_users",
    ["error_message", "recovery_links", "search"],
    [],
    ["homepage.conversion", "homepage.trust", "pricing.conversion", "services.conversion"]
  ),
  portfolio: profile(
    "portfolio",
    "Portfolio",
    "build_trust",
    "convert_visitors",
    ["case_studies", "outcomes", "project_cta"],
    ["projects.portfolio", "projects.conversion"]
  ),
  services: profile(
    "services",
    "Services",
    "convert_visitors",
    "communicate_value",
    ["service_list", "benefits", "services_cta"],
    ["services.conversion", "services.trust", "services.content"]
  ),
  marketing: profile(
    "marketing",
    "Marketing",
    "convert_visitors",
    "capture_leads",
    ["campaign_hero", "cta", "social_proof"],
    ["homepage.conversion", "homepage.trust"]
  ),
  generic: profile(
    "generic",
    "General Page",
    "inform_users",
    "navigate_site",
    ["navigation", "main_content"],
    [],
    ["homepage.conversion", "homepage.trust", "pricing.conversion"]
  ),
}

export const PAGE_INTENT_PACKS: Record<PageIntent, RulePackId[]> = Object.fromEntries(
  Object.entries(PAGE_INTENT_PROFILES).map(([intent, p]) => [intent, p.preferredRulePacks])
) as Record<PageIntent, RulePackId[]>

export function getPageIntentProfile(intent: PageIntent): PageIntentProfile {
  return PAGE_INTENT_PROFILES[intent]
}

export function intentToRulePageType(
  intent: PageIntent
): import("@/services/audit/intelligence/rules/rulePageType").RulePageType {
  const map: Record<PageIntent, import("@/services/audit/intelligence/rules/rulePageType").RulePageType> = {
    homepage: "homepage",
    landing_page: "homepage",
    marketing: "homepage",
    pricing: "pricing",
    product: "features",
    features: "features",
    blog: "blog",
    article: "blog",
    documentation: "blog",
    knowledge_base: "blog",
    api_docs: "custom",
    changelog: "blog",
    login: "login",
    signup: "signup",
    dashboard: "login",
    account_settings: "login",
    contact: "contact",
    about: "about",
    careers: "about",
    support: "contact",
    faq: "blog",
    legal: "legal",
    checkout: "pricing",
    search: "custom",
    error_page: "custom",
    portfolio: "projects",
    services: "services",
    generic: "custom",
  }
  return map[intent]
}
