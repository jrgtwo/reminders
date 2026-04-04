import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { capture } from '../lib/analytics'

export function usePageTracking(): void {
  const location = useLocation()
  const prevPathname = useRef<string | null>(null)

  useEffect(() => {
    if (location.pathname === prevPathname.current) return
    prevPathname.current = location.pathname
    const redacted = location.pathname.replace(/\/day\/\d{4}-\d{2}-\d{2}/, '/day')
    capture('$pageview', { $current_url: redacted })
  }, [location.pathname, location.search])
}
