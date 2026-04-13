import { useEffect } from 'react'

export default function GrainFilter() {
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
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <filter id="grain-fine">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.70"
          numOctaves="3"
          stitchTiles="stitch"
        />
      </filter>
      <filter id="grain-coarse">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.25"
          numOctaves="2"
          stitchTiles="stitch"
        />
      </filter>
    </svg>
  )
}
