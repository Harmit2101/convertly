/**
 * Page intent — re-exports the detection module for backward compatibility.
 * @see pageIntentDetection.ts for implementation
 * @see pageIntentProfiles.ts for consultant profiles
 */
export {
  detectPageIntent,
  getRuleIdsForIntent,
  isRuleApplicableToIntent,
  intentToRulePageType,
  PAGE_INTENT_PACKS,
  getPageIntentProfile,
  type PageIntentContext,
} from "@/services/audit/intelligence/pageIntentDetection"

export type { PageIntent, DetectedPageIntent, PageIntentProfile } from "@/services/audit/intelligence/pageIntentTypes"
