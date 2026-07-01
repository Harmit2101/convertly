import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  Code2,
  FileJson,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { isAuditInProgress } from "@/lib/auditStatus"
import { ROUTES } from "@/lib/routes"
import { showErrorToast } from "@/lib/toast"
import { exportAuditReport } from "@/services/export"
import type { AuditDetail } from "@/types/audit"
import { cn } from "@/lib/utils"

type AuditReportActionsProps = {
  audit: AuditDetail
  className?: string
}

type MenuAction = {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  onSelect?: () => void | Promise<void>
  disabled?: boolean
  badge?: string
}

function AuditReportActions({ audit, className }: AuditReportActionsProps) {
  const navigate = useNavigate()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [activeAction, setActiveAction] = React.useState<string | null>(null)

  const running = isAuditInProgress(audit.status)
  const exportsDisabled = running

  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  async function runAction(actionId: string, task: () => void | Promise<void>) {
    setActiveAction(actionId)
    try {
      await task()
      setOpen(false)
    } catch (actionError) {
      const title =
        actionId === "export-pdf"
          ? "PDF export failed"
          : actionId === "export-ai-report"
            ? "AI report export failed"
            : "Action failed"
      showErrorToast(title, actionError)
    } finally {
      setActiveAction(null)
    }
  }

  const menuItems: MenuAction[] = [
    {
      id: "re-audit",
      label: "Re-audit",
      description: "Start a new audit for this website",
      icon: RefreshCw,
      disabled: activeAction != null,
      onSelect: () => {
        const url = audit.websiteUrl ?? `https://${audit.domain}`
        navigate(ROUTES.auditNew, { state: { url, autoStart: true } })
      },
    },
    {
      id: "export-pdf",
      label: "Export PDF",
      description: "Client-ready branded report",
      icon: FileText,
      disabled: exportsDisabled || activeAction != null,
      onSelect: async () => {
        await exportAuditReport(audit.id, "pdf")
      },
    },
    {
      id: "export-ai-report",
      label: "Export AI Report",
      description: "Structured JSON for AI assistants",
      icon: FileJson,
      disabled: exportsDisabled || activeAction != null,
      onSelect: async () => {
        await exportAuditReport(audit.id, "ai-report")
      },
    },
    {
      id: "export-developer-package",
      label: "Export Developer Package",
      description: "Rules, evidence, and diagnostics bundle",
      icon: Code2,
      disabled: true,
      badge: "Coming soon",
    },
  ]

  return (
    <div ref={containerRef} className={cn("audit-report-actions", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="audit-report-actions__trigger w-full sm:w-auto"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={activeAction != null}
        onClick={() => setOpen((value) => !value)}
      >
        {activeAction ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        Report actions
        <ChevronDown
          className={cn(
            "size-4 opacity-70 transition-transform duration-[var(--motion-fast)]",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="audit-report-actions__menu"
          >
            {menuItems.map((item) => {
              const Icon = item.icon
              const isLoading = activeAction === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled || isLoading}
                  onClick={() => {
                    if (!item.onSelect || item.disabled) return
                    void runAction(item.id, item.onSelect)
                  }}
                  className="audit-report-actions__item"
                >
                  <span className="audit-report-actions__icon" aria-hidden>
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/92">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full border border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-muted uppercase">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs text-muted">{item.description}</span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export { AuditReportActions }
