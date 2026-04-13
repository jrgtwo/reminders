export default function GrainFilter() {
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
