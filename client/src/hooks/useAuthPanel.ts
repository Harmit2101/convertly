import { useContext } from "react"

import { AuthPanelContext } from "@/components/auth/authPanelStore"

function useAuthPanel() {
  const context = useContext(AuthPanelContext)
  if (!context) {
    throw new Error("useAuthPanel must be used within AuthPanelProvider")
  }
  return context
}

export { useAuthPanel }
