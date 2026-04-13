export default function GrainFilter() {
  return (
    <>
      {/* Hidden SVG filter definitions */}
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

      {/* Layer 3: film grain on top of everything */}
      <div className="grain-film" aria-hidden="true" />
    </>
  )
}
