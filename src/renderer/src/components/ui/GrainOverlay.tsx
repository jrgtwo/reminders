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

  return (
    <>
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
      </svg>
      <div className="grain-overlay" aria-hidden="true" />
    </>
  )
}
