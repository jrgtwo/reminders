import { useEffect } from 'react'

export default function GrainOverlay() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mx = e.clientX / window.innerWidth
      const my = e.clientY / window.innerHeight
      document.documentElement.style.setProperty('--mx', String(mx))
      document.documentElement.style.setProperty('--my', String(my))
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return null
}
