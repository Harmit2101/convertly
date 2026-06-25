import type { AccountInfo } from "@/types/account"
import type { AuthSession } from "@/types/auth"

type AuthSnapshot = {
  session: AuthSession | null
  account: AccountInfo | null
}

let snapshot: AuthSnapshot = { session: null, account: null }

export function setAuthSnapshot(next: AuthSnapshot): void {
  snapshot = next
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot
}

export function getCachedAuthSession(): AuthSession | null {
  return snapshot.session
}

export function clearAuthSnapshot(): void {
  snapshot = { session: null, account: null }
}
