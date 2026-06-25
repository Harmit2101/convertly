import * as React from "react"

import { AuthPanelContext } from "@/components/auth/authPanelStore"
import type { AuthLegalView } from "@/features/auth/content/authContent"

function AuthPanelProvider({ children }: { children: React.ReactNode }) {
  const [activeLegal, setActiveLegal] = React.useState<AuthLegalView | null>(null)

  const openLegal = React.useCallback((view: AuthLegalView) => {
    setActiveLegal(view)
  }, [])

  const closeLegal = React.useCallback(() => {
    setActiveLegal(null)
  }, [])

  const value = React.useMemo(
    () => ({
      activeLegal,
      openLegal,
      closeLegal,
    }),
    [activeLegal, openLegal, closeLegal]
  )

  return <AuthPanelContext.Provider value={value}>{children}</AuthPanelContext.Provider>
}

export { AuthPanelProvider }
