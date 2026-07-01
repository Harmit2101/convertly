import { getAuditStatusLabel } from "@/lib/auditStatus"
import type { AuditDetail } from "@/types/audit"
import type { jsPDF } from "jspdf"

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 18
const MARGIN_TOP = 22
const MARGIN_BOTTOM = 20
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const COLORS = {
  ink: [18, 18, 22] as const,
  muted: [96, 96, 110] as const,
  accent: [124, 108, 255] as const,
  accentSoft: [235, 232, 255] as const,
  border: [228, 228, 235] as const,
  white: [255, 255, 255] as const,
}

type PdfLayout = {
  y: number
}

function ensureSpace(doc: jsPDF, layout: PdfLayout, height: number): void {
  if (layout.y + height <= PAGE_HEIGHT - MARGIN_BOTTOM) return
  doc.addPage()
  drawPageChrome(doc)
  layout.y = MARGIN_TOP
}

function drawPageChrome(doc: jsPDF): void {
  doc.setFillColor(...COLORS.accent)
  doc.rect(0, 0, PAGE_WIDTH, 3.5, "F")
  doc.setFillColor(...COLORS.white)
  doc.rect(0, 3.5, PAGE_WIDTH, PAGE_HEIGHT - 3.5, "F")
}

function drawHeader(doc: jsPDF, layout: PdfLayout, audit: AuditDetail): void {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.muted)
  doc.text("CONVERTLY", MARGIN_X, layout.y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Conversion Intelligence Report", PAGE_WIDTH - MARGIN_X, layout.y, {
    align: "right",
  })
  layout.y += 10

  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(...COLORS.ink)
  doc.text(audit.name, MARGIN_X, layout.y)
  layout.y += 9

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.muted)
  const meta = [
    audit.websiteUrl ?? audit.domain,
    audit.completedAtDate ?? audit.completedAt,
    `${audit.pagesAnalyzed} pages analyzed`,
    getAuditStatusLabel(audit.status),
  ].join("  ·  ")
  doc.text(meta, MARGIN_X, layout.y, { maxWidth: CONTENT_WIDTH })
  layout.y += 14
}

function drawGrowthScoreCard(doc: jsPDF, layout: PdfLayout, audit: AuditDetail): void {
  ensureSpace(doc, layout, 34)
  const cardHeight = 30

  doc.setFillColor(...COLORS.accentSoft)
  doc.roundedRect(MARGIN_X, layout.y, CONTENT_WIDTH, cardHeight, 3, 3, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(34)
  doc.setTextColor(...COLORS.accent)
  doc.text(String(audit.overallScore), MARGIN_X + 8, layout.y + 20)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.ink)
  doc.text("Growth Score", MARGIN_X + 34, layout.y + 13)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text("Weighted conversion health across your audited pages.", MARGIN_X + 34, layout.y + 20)

  const runMeta = audit.runMetadata
  const sideNote = [
    runMeta.auditConfidence != null ? `Confidence ${runMeta.auditConfidence}%` : null,
    runMeta.growthPotential != null ? `Potential ${runMeta.growthPotential}` : null,
    runMeta.scoreCeiling != null && runMeta.scoreCeiling < 94 ? `Ceiling ${runMeta.scoreCeiling}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ")

  if (sideNote) {
    doc.text(sideNote, PAGE_WIDTH - MARGIN_X - 8, layout.y + 20, { align: "right" })
  }

  layout.y += cardHeight + 10
}

function drawSectionTitle(
  doc: jsPDF,
  layout: PdfLayout,
  title: string,
  description?: string
): void {
  ensureSpace(doc, layout, description ? 16 : 10)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.ink)
  doc.text(title, MARGIN_X, layout.y)
  layout.y += 6

  if (description) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.muted)
    doc.text(description, MARGIN_X, layout.y, { maxWidth: CONTENT_WIDTH })
    layout.y += 8
  }
}

function drawMetricRow(
  doc: jsPDF,
  layout: PdfLayout,
  metrics: Array<{ label: string; value: string }>
): void {
  ensureSpace(doc, layout, 18)
  const colWidth = CONTENT_WIDTH / metrics.length

  metrics.forEach((metric, index) => {
    const x = MARGIN_X + colWidth * index
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(metric.label.toUpperCase(), x, layout.y)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.ink)
    doc.text(metric.value, x, layout.y + 7)
  })

  layout.y += 16
}

function drawBulletedList(
  doc: jsPDF,
  layout: PdfLayout,
  items: Array<{ title: string; detail: string }>,
  limit = 8
): void {
  for (const item of items.slice(0, limit)) {
    ensureSpace(doc, layout, 14)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.ink)
    const titleLines = doc.splitTextToSize(`• ${item.title}`, CONTENT_WIDTH)
    doc.text(titleLines, MARGIN_X, layout.y)
    layout.y += titleLines.length * 4.8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.muted)
    const detailLines = doc.splitTextToSize(item.detail, CONTENT_WIDTH - 4)
    doc.text(detailLines, MARGIN_X + 4, layout.y)
    layout.y += detailLines.length * 4.2 + 3
  }
}

function drawScoreBreakdown(doc: jsPDF, layout: PdfLayout, audit: AuditDetail): void {
  drawSectionTitle(
    doc,
    layout,
    "Score breakdown",
    "Category-level conversion health for this audit."
  )

  for (const category of audit.scoreBreakdown) {
    ensureSpace(doc, layout, 12)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.ink)
    doc.text(category.label, MARGIN_X, layout.y)
    doc.text(String(category.score), PAGE_WIDTH - MARGIN_X, layout.y, { align: "right" })
    layout.y += 4

    doc.setDrawColor(...COLORS.border)
    doc.setFillColor(...COLORS.accent)
    const barWidth =
      ((PAGE_WIDTH - MARGIN_X * 2 - 30) * Math.max(0, Math.min(category.score, 100))) / 100
    doc.roundedRect(MARGIN_X, layout.y, PAGE_WIDTH - MARGIN_X * 2 - 30, 2.2, 1, 1, "S")
    doc.roundedRect(MARGIN_X, layout.y, barWidth, 2.2, 1, 1, "F")
    layout.y += 8
  }

  layout.y += 4
}

function drawPageTable(doc: jsPDF, layout: PdfLayout, audit: AuditDetail): void {
  drawSectionTitle(doc, layout, "Page analysis", "Per-page scores and finding counts.")

  for (const page of audit.pageFindings.slice(0, 12)) {
    ensureSpace(doc, layout, 10)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9.5)
    doc.setTextColor(...COLORS.ink)
    doc.text(page.path, MARGIN_X, layout.y)
    doc.text(
      `Score ${page.score} · ${page.issuesCount} findings · ${page.status}`,
      PAGE_WIDTH - MARGIN_X,
      layout.y,
      { align: "right" }
    )
    layout.y += 6
  }

  if (audit.pageFindings.length > 12) {
    ensureSpace(doc, layout, 8)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(`+ ${audit.pageFindings.length - 12} more pages`, MARGIN_X, layout.y)
    layout.y += 6
  }

  layout.y += 4
}

function drawFooter(doc: jsPDF, engineVersion: string): void {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(
      `Convertly · ${engineVersion} · Page ${page} of ${pageCount}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 10,
      { align: "center" }
    )
  }
}

export async function buildPdfReport(audit: AuditDetail): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const layout: PdfLayout = { y: MARGIN_TOP }
  const engineVersion = audit.runMetadata.auditEngineVersion

  drawPageChrome(doc)
  drawHeader(doc, layout, audit)
  drawGrowthScoreCard(doc, layout, audit)

  drawMetricRow(doc, layout, [
    { label: "Findings", value: String(audit.stats.totalFindings) },
    { label: "Recommendations", value: String(audit.stats.totalRecommendations) },
    { label: "Pages", value: String(audit.pagesAnalyzed) },
    {
      label: "Confidence",
      value:
        audit.runMetadata.auditConfidence != null
          ? `${audit.runMetadata.auditConfidence}%`
          : "—",
    },
  ])

  drawScoreBreakdown(doc, layout, audit)
  drawPageTable(doc, layout, audit)

  drawSectionTitle(
    doc,
    layout,
    "Prioritized issues",
    "Highest-impact findings surfaced during this audit."
  )
  drawBulletedList(
    doc,
    layout,
    audit.issues.map((issue) => ({
      title: `${issue.severity}: ${issue.issue}`,
      detail: [issue.impact, issue.recommendation, issue.page ? `Page ${issue.page}` : null]
        .filter(Boolean)
        .join(" · "),
    }))
  )

  if (audit.siteFindings.length > 0) {
    drawSectionTitle(doc, layout, "Site-wide findings")
    drawBulletedList(
      doc,
      layout,
      audit.siteFindings.map((finding) => ({
        title: `${finding.severity}: ${finding.issue}`,
        detail: finding.impact,
      })),
      6
    )
  }

  drawSectionTitle(
    doc,
    layout,
    "Recommendations",
    "Prioritized actions to improve conversion performance."
  )
  drawBulletedList(
    doc,
    layout,
    audit.recommendations.map((rec) => ({
      title: `${rec.priority}: ${rec.title}`,
      detail: `${rec.summary} · ${rec.estimatedLift}`,
    }))
  )

  drawFooter(doc, engineVersion)
  return doc.output("blob")
}
