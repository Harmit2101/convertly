import * as React from "react"

import type { AuthLegalView } from "@/features/auth/content/authContent"

export type AuthPanelContextValue = {
  activeLegal: AuthLegalView | null
  openLegal: (view: AuthLegalView) => void
  closeLegal: () => void
}

export const AuthPanelContext = React.createContext<AuthPanelContextValue | null>(null)
