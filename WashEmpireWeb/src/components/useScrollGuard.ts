import { useCallback, useRef } from 'react'

/**
 * Touch scrolling ends with a tap-like event, so a flick through a long list
 * can land on whatever button is under the finger. Buttons wrapped in `guard`
 * ignore activations that arrive while the list is still settling.
 */
const SCROLL_QUIET_MS = 400

export function useScrollGuard() {
  const lastScrollAt = useRef(0)

  const onScroll = useCallback(() => {
    lastScrollAt.current = Date.now()
  }, [])

  const guard = useCallback(
    <Args extends unknown[]>(action: (...args: Args) => void) =>
      (...args: Args) => {
        if (Date.now() - lastScrollAt.current < SCROLL_QUIET_MS) return
        action(...args)
      },
    [],
  )

  return { onScroll, guard }
}
