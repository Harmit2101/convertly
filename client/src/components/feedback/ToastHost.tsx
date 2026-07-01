import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import * as React from "react"

import { dismissToast, subscribeToToasts, type ToastMessage } from "@/lib/toast"
import { cn } from "@/lib/utils"

function ToastHost() {
  const [messages, setMessages] = React.useState<ToastMessage[]>([])

  React.useEffect(() => subscribeToToasts(setMessages), [])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {messages.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-auto w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border px-4 py-3 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.95)] backdrop-blur-xl",
              toast.variant === "error" &&
                "border-[color-mix(in_srgb,#ef4444_35%,var(--border))] bg-[color-mix(in_srgb,#ef4444_10%,var(--background))]",
              toast.variant === "success" &&
                "border-[color-mix(in_srgb,#22c55e_30%,var(--border))] bg-[color-mix(in_srgb,#22c55e_8%,var(--background))]",
              toast.variant === "info" &&
                "border-[color-mix(in_srgb,var(--border)_60%,transparent)] bg-[color-mix(in_srgb,var(--background)_94%,var(--surface))]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-5 text-muted">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-[var(--radius-sm)] p-1 text-muted transition-colors hover:text-foreground"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export { ToastHost }
