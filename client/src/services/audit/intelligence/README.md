# Audit Intelligence Engine — Architecture Notes

## Page intent detection (`pageIntentDetection.ts`)

Deterministic classification using weighted signals:

| Signal source | Weight range | Examples |
|---------------|--------------|----------|
| URL path | 34–40 | `/docs`, `/pricing`, `/domains` |
| Title / meta / H1 / nav | 10–14 | "API reference", "FAQ" |
| Schema.org `@type` | 14–16 | Article, Product, FAQPage |
| DB page type | 18 | homepage, pricing |

Highest total weight wins. Each intent exposes a **consultant profile** (`pageIntentProfiles.ts`):

- `primaryGoal` / `secondaryGoal`
- `expectedComponents`
- `preferredRulePacks` / `ignoredRulePacks`

## Rule applicability (`ruleApplicability.ts`)

Every rule is evaluated per intent:

1. **Excluded** page types → skipped
2. **Pack** must be in intent's preferred packs and not ignored
3. **Applicable page types** from metadata overrides (e.g. hero rules → homepage only)
4. **Optional** page types run with lower priority

Skipped rules never produce failures — they are recorded in `RuleExecutionTracker`.

## Consultant recommendations (`consultantRecommendation.ts`)

Structured from findings only:

- Evidence comes from detector output (`IntelligenceEvidence[]`)
- Business impact mapped from category (conversion → "May reduce conversions")
- `estimatedRecovery` derived from severity units × category growth weight
- Consolidated by finding title across pages

## Score explainability (`scoreExplanation.ts`)

Traceable growth score:

```
categoryScore = baseline − (penaltyUnits / budget) × (baseline − floor)
growthScore = min(weighted(categories), blockerCeiling)
```

`largestPenalties` lists per-rule penalty units. Page scores use a separate local penalty path (no site-wide allocation).

## Audit confidence (`auditConfidenceEngine.ts`)

Signal-weighted composite (not arbitrary):

| Signal | Weight |
|--------|--------|
| Crawl completeness | 20% |
| JS render + hydration | 20% |
| DOM extraction | 15% |
| Metadata (title, description, H1) | 10% |
| Analysis depth | 20% |
| Rule coverage | 15% |

Produces `confidenceReasons[]` and `confidenceWarnings[]`.

## Diagnostics (`auditDiagnostics.ts`)

Enabled when `import.meta.env.DEV` or `VITE_AUDIT_DIAGNOSTICS=true`.

Logs reproducible page score breakdowns, rule execution summary, and score equation.

## Intelligence snapshot (`intelligenceSnapshot.ts`)

Persisted in audit history as `__INTELLIGENCE_SNAPSHOT_V1__:{json}` for accurate report rebuild (page scores, intents, consultant recommendations).
