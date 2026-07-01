/**
 * Quick V4 scoring validation — run: node scripts/validate-v4-scoring.mjs
 * Uses dynamic import from built dist is not available; uses relative ESM paths via file URL.
 */
import { pathToFileURL } from "node:url"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, "../src")

async function load(modulePath) {
  return import(pathToFileURL(modulePath).href)
}

const { detectWebsiteIntent } = await load(
  path.join(src, "services/audit/intelligence/websiteIntentDetection.ts")
)
const { calculateAuditScoreV4 } = await load(
  path.join(src, "services/audit/intelligence/scoring/scoringEngineV4.ts")
)
const { inferConfidenceFromSeverity, getRuleMetadata } = await load(
  path.join(src, "services/audit/intelligence/rules/ruleMetadata.ts")
)

function makeFinding(ruleId, overrides = {}) {
  const meta = getRuleMetadata(ruleId)
  if (!meta) throw new Error(`Unknown rule: ${ruleId}`)
  return {
    ruleId,
    pageId: "page-home",
    category: meta.category,
    legacyCategory: meta.category,
    severity: meta.severity,
    scoreCategory: meta.scoreCategory,
    title: meta.title,
    description: "test",
    recommendation: "test",
    confidence: inferConfidenceFromSeverity(meta.severity),
    businessImpact: meta.businessImpact,
    weight: meta.weight,
    scope: meta.scope,
    evidence: [],
    tags: meta.tags,
    ...overrides,
  }
}

function sessionFor(url) {
  return { id: "s1", websiteUrl: url, status: "completed", createdAt: new Date().toISOString() }
}

const screenshot = { captureStatus: "completed", storagePath: null, publicUrl: null }
const pages = [
  {
    id: "page-home",
    path: "/",
    pageType: "homepage",
    title: "Home",
    status: "completed",
    screenshots: { desktop: screenshot, mobile: screenshot },
  },
]

const scenarios = [
  {
    name: "Google (search + marketing findings)",
    url: "https://www.google.com",
    findings: [
      "hero-missing-primary-cta",
      "conversion-no-lead-capture",
      "trust-no-testimonials",
      "trust-missing-contact-page",
      "tech-missing-meta-description",
      "a11y-missing-landmarks",
    ],
  },
  {
    name: "GitHub (developer platform)",
    url: "https://github.com",
    findings: [
      "hero-missing-primary-cta",
      "conversion-no-lead-capture",
      "hero-no-value-proposition",
      "trust-no-social-proof",
      "tech-missing-h1",
      "a11y-small-touch-targets",
    ],
  },
  {
    name: "Vercel (developer platform)",
    url: "https://vercel.com",
    findings: [
      "conversion-no-lead-capture",
      "hero-generic-headline",
      "trust-no-testimonials",
      "tech-weak-heading-structure",
      "a11y-missing-landmarks",
    ],
  },
  {
    name: "HM Coding (agency)",
    url: "https://hmcoding.com",
    findings: [
      "hero-generic-headline",
      "conversion-no-lead-capture",
      "trust-no-testimonials",
      "services-missing-cta",
      "tech-missing-meta-description",
    ],
  },
  {
    name: "Convertly (SaaS)",
    url: "https://convertly.app",
    findings: [
      "hero-no-value-proposition",
      "conversion-weak-cta-language",
      "trust-no-social-proof",
      "pricing-missing-trust",
      "tech-missing-viewport",
    ],
  },
]

console.log("=== Intelligence V4 Validation ===\n")

for (const scenario of scenarios) {
  const intent = detectWebsiteIntent({
    session: sessionFor(scenario.url),
    pages,
    pageSnapshots: [],
  })

  const findings = scenario.findings.map((ruleId) => makeFinding(ruleId))
  const score = calculateAuditScoreV4(findings, pages, { websiteIntent: intent })

  const penalized = findings.filter((f) =>
    score.clusterPenalties.some((c) => c.ruleIds.includes(f.ruleId)) ||
    score.scoringFindingsCount > 0
  ).length

  console.log(`${scenario.name}`)
  console.log(`  Intent: ${intent.websiteIntent} (${intent.confidence}%)`)
  console.log(`  Growth Score: ${score.growthScore} — ${score.scoreBand.label}`)
  console.log(`  Quality: ${score.qualityScore} (+${score.positiveScoring.totalBonus})`)
  console.log(`  Scoring findings: ${score.scoringFindingsCount}/${findings.length} (skipped ${score.skippedScoringFindingsCount})`)
  console.log(`  Categories: conv=${score.categories.conversion} trust=${score.categories.trust} ux=${score.categories.ux} mobile=${score.categories.mobile}`)
  if (score.clusterPenalties.length) {
    console.log(`  Clusters: ${score.clusterPenalties.map((c) => `${c.label}=${c.cappedUnits}`).join(", ")}`)
  }
  console.log("")
}
