import * as React from "react"

import type { AuthSession } from "@/types/auth"
import type { AccountInfo } from "@/types/account"

export type AuthSessionContextValue = {
  session: AuthSession | null
  account: AccountInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthSessionContext = React.createContext<AuthSessionContextValue | null>(null)
