import { isPasswordRecoveryLanding } from "@/lib/authRedirects"
import { getJson, removeItem, setJson } from "@/services/storage/sessionStorageClient"

const STORAGE_KEY = "convertly.auth.password-recovery"
const COMPLETED_KEY = "convertly.auth.password-recovery-completed"

export type PasswordRecoveryPersistedState = {
  active: boolean
  activatedAt: string
}

function readActiveState(): PasswordRecoveryPersistedState | null {
  const state = getJson<PasswordRecoveryPersistedState | null>(STORAGE_KEY, null)
  return state?.active ? state : null
}

function isRecoveryCompleted(): boolean {
  try {
    return sessionStorage.getItem(COMPLETED_KEY) === "1"
  } catch {
    return false
  }
}

function markRecoveryCompleted(): void {
  try {
    sessionStorage.setItem(COMPLETED_KEY, "1")
  } catch {
    /* storage unavailable */
  }
}

function clearRecoveryCompleted(): void {
  removeItem(COMPLETED_KEY)
}

export function isPasswordRecoveryActive(): boolean {
  if (isRecoveryCompleted()) return false
  return readActiveState()?.active === true
}

export function activatePasswordRecovery(): void {
  if (isRecoveryCompleted()) {
    return
  }

  clearRecoveryCompleted()
  setJson(STORAGE_KEY, {
    active: true,
    activatedAt: new Date().toISOString(),
  })
}

export function clearPasswordRecovery(): void {
  removeItem(STORAGE_KEY)
}

/**
 * Call after a successful password reset. Clears active recovery state and blocks
 * auto-reopen until a new recovery flow starts.
 */
export function finalizePasswordRecovery(): void {
  clearPasswordRecovery()
  markRecoveryCompleted()
}

/**
 * One-time bootstrap while the recovery hash is still in the URL.
 */
export function bootstrapPasswordRecoveryFromUrl(): void {
  if (isRecoveryCompleted()) {
    return
  }

  if (isPasswordRecoveryLanding()) {
    activatePasswordRecovery()
  }
}

export function isPasswordRecoveryCompleted(): boolean {
  return isRecoveryCompleted()
}

export function resetPasswordRecoveryState(): void {
  clearPasswordRecovery()
  clearRecoveryCompleted()
}

export function readPasswordRecoveryState(): PasswordRecoveryPersistedState | null {
  return readActiveState()
}
