import type { TimelineEvent } from "@/types/audit"

export type TimelinePageAnalysisGroup = {
  type: "page-analysis"
  id: string
  label: string
  events: TimelineEvent[]
  pageCount: number
  totalFindings: number
}

export type TimelineDisplayItem =
  | { type: "event"; event: TimelineEvent }
  | TimelinePageAnalysisGroup

const ANALYZED_PATTERN = /^Analyzed (\S+) — (\d+) finding/

/** Internal audit_history messages persisted for rebuild — never show in timeline UI */
const INTERNAL_HISTORY_MESSAGE_PATTERNS = [
  /^__/,
  /^Score explainability:/,
] as const

export function isInternalHistoryMessage(message: string): boolean {
  const trimmed = message.trim()
  return INTERNAL_HISTORY_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function filterPublicTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events.filter((event) => !isInternalHistoryMessage(event.label))
}

export function buildTimelineDisplayItems(events: TimelineEvent[]): TimelineDisplayItem[] {
  const publicEvents = filterPublicTimelineEvents(events)
  const items: TimelineDisplayItem[] = []
  let analysisBuffer: TimelineEvent[] = []

  const flushAnalysis = () => {
    if (analysisBuffer.length === 0) return

    const totalFindings = analysisBuffer.reduce((sum, event) => {
      const match = event.label.match(ANALYZED_PATTERN)
      return sum + (match ? Number(match[2]) : 0)
    }, 0)

    items.push({
      type: "page-analysis",
      id: `analysis-${analysisBuffer[0]?.id ?? "group"}`,
      label: `Page analysis · ${analysisBuffer.length} pages`,
      events: analysisBuffer,
      pageCount: analysisBuffer.length,
      totalFindings,
    })
    analysisBuffer = []
  }

  for (const event of publicEvents) {
    if (ANALYZED_PATTERN.test(event.label)) {
      analysisBuffer.push(event)
      continue
    }

    flushAnalysis()
    items.push({ type: "event", event })
  }

  flushAnalysis()
  return items
}

export function formatAnalyzedPageLabel(label: string): { path: string; findings: number } | null {
  const match = label.match(ANALYZED_PATTERN)
  if (!match) return null
  return { path: match[1], findings: Number(match[2]) }
}
