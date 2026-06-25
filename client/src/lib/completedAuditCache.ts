import { isAuditInProgress } from "@/lib/auditStatus"
import type { AuditDetail } from "@/types/audit"

const completedDetailCache = new Map<string, AuditDetail>()

export function getCompletedAuditDetail(id: string): AuditDetail | null {
  return completedDetailCache.get(id) ?? null
}

export function setCompletedAuditDetail(detail: AuditDetail): void {
  if (!isAuditInProgress(detail.status)) {
    completedDetailCache.set(detail.id, detail)
  }
}

export function clearCompletedAuditDetail(id?: string): void {
  if (id) {
    completedDetailCache.delete(id)
    return
  }
  completedDetailCache.clear()
}
