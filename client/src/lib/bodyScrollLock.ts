let lockCount = 0
let previousOverflow = ""
let previousPaddingRight = ""

function scrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth
}

export function lockBodyScroll(): () => void {
  lockCount += 1

  if (lockCount === 1) {
    previousOverflow = document.body.style.overflow
    previousPaddingRight = document.body.style.paddingRight

    const gap = scrollbarWidth()
    document.body.style.overflow = "hidden"
    if (gap > 0) {
      document.body.style.paddingRight = `${gap}px`
    }
  }

  return () => {
    lockCount = Math.max(0, lockCount - 1)

    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }
}
