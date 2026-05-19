import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  // Use effect to avoid hydration mismatch - initialize after mount
  React.useEffect(() => {
    // Set initial value based on actual window size
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const initialValue = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(initialValue)

    // Listen for changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)

    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR and initial render to prevent hydration mismatch
  return !!isMobile
}
