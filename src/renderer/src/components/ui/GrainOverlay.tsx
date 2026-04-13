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
      {/* SVG filter definition */}
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

      {/* Background grain — fixed behind all content */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: '-10%',
          width: '120%',
          height: '120%',
          pointerEvents: 'none',
          zIndex: 0,
          background: 'white',
          filter: 'url(#grain) contrast(170%) brightness(100%)',
          opacity: 'var(--grain-opacity, 0.04)',
          transform: 'translate(calc(var(--mx, 0.5) * -6%), calc(var(--my, 0.5) * -6%))',
          transition: 'transform 0.4s ease-out',
        }}
      />

      {/* Overlay grain — on top, blends with each surface */}
      <div className="grain-overlay" aria-hidden="true" />
    </>
  )
}
