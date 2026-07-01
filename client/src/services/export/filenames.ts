function sanitizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function formatExportDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

export function buildAiReportFilename(domain: string, completedAt: string): string {
  return `${sanitizeDomain(domain)}-audit-${formatExportDate(completedAt)}.ai-report.json`
}

export function buildPdfFilename(domain: string, completedAt: string): string {
  return `${sanitizeDomain(domain)}-audit-${formatExportDate(completedAt)}.pdf`
}
