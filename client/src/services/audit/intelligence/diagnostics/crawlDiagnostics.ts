import type { FetchFailureKind } from "@/services/audit/fetch/fetchErrorClassifier"

export type CrawlStopReason =
  | "completed"
  | "max_pages_reached"
  | "homepage_unreachable"
  | "cloudflare_blocked"
  | "bot_protection"
  | "robots_blocked"
  | "authentication_required"
  | "rate_limited"
  | "timeout"
  | "dns_failure"
  | "ssl_failure"
  | "connection_refused"
  | "javascript_render_failed"
  | "unknown"

export type CrawlDiagnostics = {
  pagesDiscovered: number
  pagesVerified: number
  pagesRejected: number
  pagesSkippedDuplicate: number
  pagesBlocked: number
  redirectCount: number
  duplicatesRemoved: number
  pagesAnalyzed: number
  pagesSkippedAnalysis: number
  crawlStoppedReason: CrawlStopReason
  crawlStoppedDetail?: string
  failureKind?: FetchFailureKind
}

export function createEmptyCrawlDiagnostics(): CrawlDiagnostics {
  return {
    pagesDiscovered: 0,
    pagesVerified: 0,
    pagesRejected: 0,
    pagesSkippedDuplicate: 0,
    pagesBlocked: 0,
    redirectCount: 0,
    duplicatesRemoved: 0,
    pagesAnalyzed: 0,
    pagesSkippedAnalysis: 0,
    crawlStoppedReason: "completed",
  }
}

export function crawlStopReasonFromFailureKind(kind: FetchFailureKind): CrawlStopReason {
  switch (kind) {
    case "cloudflare":
      return "cloudflare_blocked"
    case "bot_protection":
      return "bot_protection"
    case "blocked":
    case "robots_blocked":
      return "robots_blocked"
    case "authentication_required":
      return "authentication_required"
    case "rate_limited":
      return "rate_limited"
    case "timeout":
      return "timeout"
    case "dns":
      return "dns_failure"
    case "ssl":
      return "ssl_failure"
    case "connection_refused":
      return "connection_refused"
    case "javascript_render_failed":
      return "javascript_render_failed"
    case "network":
      return "connection_refused"
    case "unreachable":
      return "homepage_unreachable"
    default:
      return "unknown"
  }
}

export function describeCrawlStopReason(diagnostics: CrawlDiagnostics): string {
  switch (diagnostics.crawlStoppedReason) {
    case "completed":
      return "Crawl completed successfully."
    case "max_pages_reached":
      return `Crawl stopped after reaching the maximum page limit (${diagnostics.pagesVerified} pages verified).`
    case "cloudflare_blocked":
      return "Crawl stopped — Cloudflare challenge blocked automated access."
    case "bot_protection":
      return "Crawl stopped — the website blocked automated access."
    case "robots_blocked":
      return "Crawl stopped — URL blocked by security policy."
    case "authentication_required":
      return "Crawl stopped — authentication is required to access this site."
    case "rate_limited":
      return "Crawl stopped — the website rate-limited our requests."
    case "timeout":
      return "Crawl stopped — the website took too long to respond."
    case "dns_failure":
      return "Crawl stopped — the domain could not be resolved."
    case "ssl_failure":
      return "Crawl stopped — a secure connection could not be established."
    case "connection_refused":
      return "Crawl stopped — the server refused the connection."
    case "javascript_render_failed":
      return "Crawl stopped — JavaScript rendering failed for critical pages."
    case "homepage_unreachable":
      return "Crawl stopped — the homepage could not be reached."
    default:
      return diagnostics.crawlStoppedDetail ?? "Crawl stopped for an unknown reason."
  }
}
