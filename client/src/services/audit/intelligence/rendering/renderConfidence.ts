import type { PageContentSnapshot } from "@/services/audit/pageContentService"
import { getSnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"

export type RenderConfidenceLevel = "very_low" | "low" | "medium" | "high"

export type PageRenderConfidence = {
  pageId: string
  path: string
  score: number
  level: RenderConfidenceLevel
  signals: string[]
  trustworthyForUxRules: boolean
}

export type SiteRenderConfidence = {
  /** Weighted average across analyzed pages (0–1) */
  score: number
  level: RenderConfidenceLevel
  pageConfidence: Record<string, PageRenderConfidence>
  signals: string[]
  trustworthyForUxRules: boolean
}

const CLOUDFLARE_PATTERNS = [
  /cloudflare/i,
  /cf-ray/i,
  /checking your browser/i,
  /just a moment/i,
  /attention required/i,
  /challenge-platform/i,
]

const CAPTCHA_PATTERNS = [/captcha/i, /hcaptcha/i, /recaptcha/i, /g-recaptcha/i]
const BOOTSTRAP_PATTERNS = [
  /__next_data__/i,
  /window\.__INITIAL_STATE__/i,
  /id=["']root["']>\s*<\/div>/i,
  /data-reactroot/i,
]

export const RENDER_CONFIDENCE_UX_THRESHOLD = 0.85

export function levelFromScore(score: number): RenderConfidenceLevel {
  if (score < 0.4) return "very_low"
  if (score < 0.6) return "low"
  if (score < RENDER_CONFIDENCE_UX_THRESHOLD) return "medium"
  return "high"
}

function assessPageRenderConfidence(snapshot: PageContentSnapshot): PageRenderConfidence {
  const signals: string[] = []
  let score = 1

  if (!snapshot.fetchSucceeded || !snapshot.html) {
    return {
      pageId: snapshot.page.id,
      path: snapshot.page.path,
      score: 0.05,
      level: "very_low",
      signals: ["blocked-or-empty-response"],
      trustworthyForUxRules: false,
    }
  }

  const html = snapshot.html
  const htmlLower = html.slice(0, 16_000).toLowerCase()
  const metrics = snapshot.document ? getSnapshotMetrics(snapshot) : null
  const bodyText = snapshot.document?.body?.textContent?.replace(/\s+/g, " ").trim() ?? ""
  const scriptCount = snapshot.document?.querySelectorAll("script").length ?? 0
  const elementCount = snapshot.document?.querySelectorAll("*").length ?? 0

  if (CLOUDFLARE_PATTERNS.some((pattern) => pattern.test(htmlLower))) {
    score -= 0.55
    signals.push("cloudflare-challenge")
  }

  if (CAPTCHA_PATTERNS.some((pattern) => pattern.test(htmlLower))) {
    score -= 0.45
    signals.push("captcha-detected")
  }

  if (/<noscript[\s>]/i.test(html) && bodyText.length < 80) {
    score -= 0.25
    signals.push("noscript-fallback-dominant")
  }

  if (html.length < 400) {
    score -= 0.35
    signals.push("tiny-dom")
  } else if (html.length < 1200) {
    score -= 0.15
    signals.push("small-dom")
  }

  if (bodyText.length < 40) {
    score -= 0.35
    signals.push("no-body-text")
  } else if (bodyText.length < 120) {
    score -= 0.15
    signals.push("minimal-body-text")
  }

  if (elementCount > 0 && elementCount < 12) {
    score -= 0.2
    signals.push("few-rendered-elements")
  }

  const scriptChars = (html.match(/<script[\s\S]*?<\/script>/gi) ?? []).join("").length
  if (scriptChars > bodyText.length * 2 && bodyText.length < 300) {
    score -= 0.2
    signals.push("scripts-dominate-page")
  }

  if (BOOTSTRAP_PATTERNS.some((pattern) => pattern.test(html)) && bodyText.length < 200) {
    score -= 0.2
    signals.push("js-bootstrap-shell")
  }

  if (snapshot.contentSource === "static" && metrics && metrics.visibleTextLength < 100) {
    score -= 0.15
    signals.push("static-html-incomplete")
  }

  if (snapshot.renderDiagnostics && !snapshot.renderDiagnostics.hydrationSettled) {
    score -= 0.12
    signals.push("hydration-not-settled")
  }

  if (scriptCount > 8 && bodyText.length < 250) {
    score -= 0.1
    signals.push("heavy-scripts-light-content")
  }

  const normalized = Math.max(0.05, Math.min(1, score))
  const level = levelFromScore(normalized)

  return {
    pageId: snapshot.page.id,
    path: snapshot.page.path,
    score: Math.round(normalized * 1000) / 1000,
    level,
    signals,
    trustworthyForUxRules: normalized >= RENDER_CONFIDENCE_UX_THRESHOLD,
  }
}

export function assessSiteRenderConfidence(
  snapshots: PageContentSnapshot[],
  analyzedPageIds?: Set<string>
): SiteRenderConfidence {
  const eligible = snapshots.filter((snapshot) => {
    if (!snapshot.fetchSucceeded) return false
    if (analyzedPageIds && !analyzedPageIds.has(snapshot.page.id)) return false
    return snapshot.analyzed || Boolean(snapshot.document)
  })

  if (eligible.length === 0) {
    return {
      score: 0.2,
      level: "very_low",
      pageConfidence: {},
      signals: ["no-analyzable-pages"],
      trustworthyForUxRules: false,
    }
  }

  const pageConfidence: Record<string, PageRenderConfidence> = {}
  let weightedSum = 0
  const siteSignals = new Set<string>()

  for (const snapshot of eligible) {
    const assessment = assessPageRenderConfidence(snapshot)
    pageConfidence[snapshot.page.id] = assessment
    weightedSum += assessment.score
    for (const signal of assessment.signals) {
      siteSignals.add(signal)
    }
  }

  const score = Math.round((weightedSum / eligible.length) * 1000) / 1000
  const level = levelFromScore(score)

  return {
    score,
    level,
    pageConfidence,
    signals: [...siteSignals],
    trustworthyForUxRules: score >= RENDER_CONFIDENCE_UX_THRESHOLD,
  }
}
