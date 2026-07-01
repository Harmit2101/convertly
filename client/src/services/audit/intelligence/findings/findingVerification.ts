/**
 * @deprecated Use renderReliability.ts — kept for backward-compatible imports.
 */
export type {
  FindingVerificationStatus,
  DetectionOutcome,
} from "@/services/audit/intelligence/rendering/renderReliability"

export {
  applyRenderReliabilityToFindings as applyRenderConfidenceToFindings,
} from "@/services/audit/intelligence/rendering/renderReliability"
