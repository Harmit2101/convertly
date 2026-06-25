import { useEffect } from "react"

import { lockBodyScroll } from "@/lib/bodyScrollLock"

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    return lockBodyScroll()
  }, [active])
}
