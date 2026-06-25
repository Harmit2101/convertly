import { useContext } from "react"

import { AuthSessionContext } from "@/components/auth/authSessionContext"

function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider")
  }
  return context
}

export { useAuthSession }
