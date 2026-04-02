import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { capture } from '../lib/analytics'

export function usePageTracking(): void {
  const location = useLocation()
  const prevPathname = useRef<string | null>(null)

  useEffect(() => {
    if (location.pathname === prevPathname.current) return
    prevPathname.current = location.pathname
    capture('$pageview', { $current_url: location.pathname, $search: location.search })
  }, [location.pathname, location.search])
}
