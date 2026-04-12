import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const fontkit = require('fontkit')
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const bree = fontkit.openSync(resolve(root, 'node_modules/@fontsource/bree-serif/files/bree-serif-latin-400-normal.woff'))
const inter300 = fontkit.openSync(resolve(root, 'node_modules/@fontsource/inter/files/inter-latin-300-normal.woff'))
const inter400 = fontkit.openSync(resolve(root, 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff'))
const archivo700 = fontkit.openSync(resolve(root, 'node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff'))

function textToPath(font, text, x, y, fontSize, fill) {
  const run = font.layout(text)
  const scale = fontSize / font.unitsPerEm
  let paths = []
  let xCursor = x

  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i]
    const pos = run.positions[i]
    const gx = xCursor + pos.xOffset * scale
    const path = glyph.path
    let d = ''
    for (const cmd of path.commands) {
      switch (cmd.command) {
        case 'moveTo':
          d += `M${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)}`
          break
        case 'lineTo':
          d += `L${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)}`
          break
        case 'quadraticCurveTo':
          d += `Q${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)} ${(cmd.args[2] * scale + gx).toFixed(2)} ${(y - cmd.args[3] * scale).toFixed(2)}`
          break
        case 'bezierCurveTo':
          d += `C${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)} ${(cmd.args[2] * scale + gx).toFixed(2)} ${(y - cmd.args[3] * scale).toFixed(2)} ${(cmd.args[4] * scale + gx).toFixed(2)} ${(y - cmd.args[5] * scale).toFixed(2)}`
          break
        case 'closePath':
          d += 'Z'
          break
      }
    }
    if (d) paths.push(d)
    xCursor += pos.xAdvance * scale
  }

  return { svg: `<path d="${paths.join(' ')}" fill="${fill}"/>`, width: xCursor - x }
}

function textToPathSpaced(font, text, x, y, fontSize, fill, spacing) {
  const run = font.layout(text)
  const scale = fontSize / font.unitsPerEm
  let paths = []
  let xCursor = x

  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i]
    const pos = run.positions[i]
    const gx = xCursor + pos.xOffset * scale
    const path = glyph.path
    let d = ''
    for (const cmd of path.commands) {
      switch (cmd.command) {
        case 'moveTo':
          d += `M${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)}`
          break
        case 'lineTo':
          d += `L${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)}`
          break
        case 'quadraticCurveTo':
          d += `Q${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)} ${(cmd.args[2] * scale + gx).toFixed(2)} ${(y - cmd.args[3] * scale).toFixed(2)}`
          break
        case 'bezierCurveTo':
          d += `C${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)} ${(cmd.args[2] * scale + gx).toFixed(2)} ${(y - cmd.args[3] * scale).toFixed(2)} ${(cmd.args[4] * scale + gx).toFixed(2)} ${(y - cmd.args[5] * scale).toFixed(2)}`
          break
        case 'closePath':
          d += 'Z'
          break
      }
    }
    if (d) paths.push(d)
    xCursor += pos.xAdvance * scale + spacing
  }

  return { svg: `<path d="${paths.join(' ')}" fill="${fill}"/>`, width: xCursor - x - spacing }
}

function measureWidth(font, text, fontSize) {
  const run = font.layout(text)
  const scale = fontSize / font.unitsPerEm
  let w = 0
  for (const pos of run.positions) w += pos.xAdvance * scale
  return w
}

// Returns individual glyph paths as an array (for per-character styling)
function textToGlyphs(font, text, x, y, fontSize) {
  const run = font.layout(text)
  const scale = fontSize / font.unitsPerEm
  let glyphs = []
  let xCursor = x

  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i]
    const pos = run.positions[i]
    const gx = xCursor + pos.xOffset * scale
    const path = glyph.path
    let d = ''
    for (const cmd of path.commands) {
      switch (cmd.command) {
        case 'moveTo':
          d += `M${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)}`
          break
        case 'lineTo':
          d += `L${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)}`
          break
        case 'quadraticCurveTo':
          d += `Q${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)} ${(cmd.args[2] * scale + gx).toFixed(2)} ${(y - cmd.args[3] * scale).toFixed(2)}`
          break
        case 'bezierCurveTo':
          d += `C${(cmd.args[0] * scale + gx).toFixed(2)} ${(y - cmd.args[1] * scale).toFixed(2)} ${(cmd.args[2] * scale + gx).toFixed(2)} ${(y - cmd.args[3] * scale).toFixed(2)} ${(cmd.args[4] * scale + gx).toFixed(2)} ${(y - cmd.args[5] * scale).toFixed(2)}`
          break
        case 'closePath':
          d += 'Z'
          break
      }
    }
    const advance = pos.xAdvance * scale
    glyphs.push({ d, x: gx, width: advance, char: text[i] })
    xCursor += advance
  }

  return { glyphs, totalWidth: xCursor - x }
}

// ═══════════════════════════════════════════════════════════════
// Logo 1: "Sunrise calendar" — calendar page with warm radial
// gradient sunrise behind it, stacked text. The "today" dot
// becomes a sun rising over the calendar divider line.
// ═══════════════════════════════════════════════════════════════
function logo1() {
  const iconW = 48
  const gap = 14
  const textX = iconW + gap
  const topSize = 13
  const botSize = 42
  const spacing = topSize * 0.22
  const top = textToPathSpaced(bree, 'REMINDER', textX, 16, topSize, '#b0b8c4', spacing)
  const bot = textToPath(bree, 'Today', textX, 52, botSize, '#e5e7eb')
  const w = textX + Math.max(top.width, bot.width)
  return `<svg viewBox="0 0 ${Math.ceil(w)} 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sun1" cx="24" cy="20" r="18" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fde68a" stop-opacity="0.5"/>
      <stop offset="0.6" stop-color="#fde68a" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#fde68a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="calG1" x1="3" y1="8" x2="45" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7aaed4"/>
      <stop offset="1" stop-color="#4e7fa8"/>
    </linearGradient>
  </defs>
  <rect x="3" y="10" width="42" height="42" rx="7" stroke="url(#calG1)" stroke-width="2.4" fill="none"/>
  <line x1="3" y1="22" x2="45" y2="22" stroke="url(#calG1)" stroke-width="2.4"/>
  <line x1="15" y1="5" x2="15" y2="14" stroke="#7aaed4" stroke-width="2.4" stroke-linecap="round"/>
  <line x1="33" y1="5" x2="33" y2="14" stroke="#7aaed4" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="24" cy="22" r="10" fill="url(#sun1)"/>
  <circle cx="24" cy="36" r="6" fill="#fbbf24"/>
  <circle cx="24" cy="36" r="3" fill="#f59e0b"/>
  ${top.svg}
  ${bot.svg}
</svg>`
}

// ═══════════════════════════════════════════════════════════════
// Logo 2: "Split bold" — Archivo Black "R" + "T" monogram
// sitting above a single-line "reminder today" in Inter.
// The R and T overlap slightly with a gradient blend.
// ═══════════════════════════════════════════════════════════════
function logo2() {
  const rGlyph = textToPath(archivo700, 'R', 0, 50, 62, '#6498c8')
  const tGlyph = textToPath(archivo700, 'T', rGlyph.width - 4, 50, 62, '#A2ECFB')
  const monoW = rGlyph.width - 4 + tGlyph.width
  // Small text below
  const sub = textToPathSpaced(inter400, 'REMINDER TODAY', 0, 72, 11, '#9ca3af', 3.5)
  // Center sub text under monogram
  const subOffset = (monoW - sub.width) / 2
  const subCentered = textToPathSpaced(inter400, 'REMINDER TODAY', subOffset, 72, 11, '#9ca3af', 3.5)
  const w = Math.max(monoW, subOffset + sub.width)
  return `<svg viewBox="0 0 ${Math.ceil(w)} 78" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rtGrad" x1="0" y1="10" x2="${Math.ceil(monoW)}" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6498c8"/>
      <stop offset="0.55" stop-color="#6498c8"/>
      <stop offset="0.55" stop-color="#A2ECFB"/>
      <stop offset="1" stop-color="#A2ECFB"/>
    </linearGradient>
  </defs>
  ${rGlyph.svg}
  ${tGlyph.svg}
  <line x1="${subOffset}" y1="58" x2="${subOffset + sub.width}" y2="58" stroke="#6498c8" stroke-width="1" stroke-opacity="0.3"/>
  ${subCentered.svg}
</svg>`
}

// ═══════════════════════════════════════════════════════════════
// Logo 3: "Neon ring" — the word "Today" in large Bree wraps
// around a glowing circle mark with "R" inside. Modern badge feel.
// ═══════════════════════════════════════════════════════════════
function logo3() {
  const circleR = 24
  const cx = circleR + 4
  const cy = 32
  // "R" centered in circle
  const rSize = 28
  const rW = measureWidth(bree, 'R', rSize)
  const rX = cx - rW / 2
  const rChar = textToPath(bree, 'R', rX, cy + rSize * 0.35, rSize, '#e5e7eb')

  const textX = cx + circleR + 14
  const topSize = 13
  const botSize = 42
  const spacing = topSize * 0.22
  const top = textToPathSpaced(bree, 'REMINDER', textX, 18, topSize, '#8899aa', spacing)
  const bot = textToPath(bree, 'Today', textX, 52, botSize, '#e5e7eb')
  const w = textX + Math.max(top.width, bot.width)

  return `<svg viewBox="0 0 ${Math.ceil(w)} 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow3" cx="${cx}" cy="${cy}" r="${circleR + 8}" gradientUnits="userSpaceOnUse">
      <stop offset="0.5" stop-color="#6498c8" stop-opacity="0.15"/>
      <stop offset="1" stop-color="#6498c8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${circleR + 8}" fill="url(#glow3)"/>
  <circle cx="${cx}" cy="${cy}" r="${circleR}" stroke="#6498c8" stroke-width="2.5" fill="none"/>
  <circle cx="${cx}" cy="${cy}" r="${circleR - 3}" stroke="#A2ECFB" stroke-width="0.8" fill="none" stroke-opacity="0.4"/>
  ${rChar.svg}
  ${top.svg}
  ${bot.svg}
</svg>`
}

// ═══════════════════════════════════════════════════════════════
// Logo 4: "Refined calendar" — improved version of the previous
// #4. Blue calendar frame, warm glowing today dot, gradient pegs,
// clean stacked text.
// ═══════════════════════════════════════════════════════════════
function logo4() {
  const iconW = 48
  const gap = 14
  const textX = iconW + gap
  const topSize = 13
  const botSize = 42
  const spacing = topSize * 0.22
  const top = textToPathSpaced(bree, 'REMINDER', textX, 16, topSize, '#b0b8c4', spacing)
  const bot = textToPath(bree, 'Today', textX, 52, botSize, '#e5e7eb')
  const w = textX + Math.max(top.width, bot.width)
  return `<svg viewBox="0 0 ${Math.ceil(w)} 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="calG4" x1="3" y1="10" x2="45" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7aaed4"/>
      <stop offset="1" stop-color="#4a7da6"/>
    </linearGradient>
    <radialGradient id="dot4" cx="24" cy="36" r="7" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="0.7" stop-color="#A2ECFB"/>
      <stop offset="1" stop-color="#6498c8" stop-opacity="0.3"/>
    </radialGradient>
  </defs>
  <rect x="3" y="10" width="42" height="42" rx="7" stroke="url(#calG4)" stroke-width="2.4" fill="none"/>
  <line x1="3" y1="22" x2="45" y2="22" stroke="url(#calG4)" stroke-width="2.4"/>
  <line x1="15" y1="5" x2="15" y2="14" stroke="#6498c8" stroke-width="2.4" stroke-linecap="round"/>
  <line x1="33" y1="5" x2="33" y2="14" stroke="#6498c8" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="24" cy="36" r="6.5" fill="url(#dot4)"/>
  ${top.svg}
  ${bot.svg}
</svg>`
}

// ═══════════════════════════════════════════════════════════════
// Logo 5: "Checkmark today" — dramatic amber checkmark with
// expressive stroke, warm glow, and layered ring detail.
// ═══════════════════════════════════════════════════════════════
function logo5() {
  const iconW = 54
  const gap = 12
  const textX = iconW + gap
  const topSize = 20
  const botSize = 42
  const spacing = 2.5
  const top = textToPathSpaced(bree, 'REMINDER', textX, 20, topSize, '#b0b8c4', spacing)
  const bot = textToPath(bree, 'Today', textX, 54, botSize, '#e5e7eb')
  const w = textX + Math.max(top.width, bot.width)
  const cx = 26, cy = 30

  return `<svg viewBox="0 0 ${Math.ceil(w)} 68" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chk5" x1="8" y1="38" x2="44" y2="14" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d97706"/>
      <stop offset="0.5" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="23" stroke="#d97706" stroke-width="1.8" fill="none" stroke-opacity="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="19" stroke="#f59e0b" stroke-width="2.4" fill="none" stroke-opacity="0.7" stroke-dasharray="4 6"/>
  <path d="M12 30 L22 42 L43 16" stroke="url(#chk5)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  ${top.svg}
  ${bot.svg}
</svg>`
}

// ═══════════════════════════════════════════════════════════════
// Logo 6: "Gradient wordmark" — single-line "ReminderToday"
// in Bree where "Reminder" is in a cool slate and "Today"
// transitions through a cyan-to-blue gradient. A subtle curved
// underswash line runs below the whole word.
// ═══════════════════════════════════════════════════════════════
function logo6() {
  const s = 46
  const r = textToPath(bree, 'Reminder', 8, 44, s, '#8899aa')
  const t = textToPath(bree, 'Today', 8 + r.width + 2, 44, s, '#6498c8')
  const totalW = 8 + r.width + 2 + t.width + 8
  const todayStart = 8 + r.width + 2
  const todayEnd = todayStart + t.width

  return `<svg viewBox="0 0 ${Math.ceil(totalW)} 58" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="swash6" x1="0" y1="52" x2="${Math.ceil(totalW)}" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6498c8" stop-opacity="0"/>
      <stop offset="0.3" stop-color="#A2ECFB" stop-opacity="0.6"/>
      <stop offset="0.7" stop-color="#6498c8" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#6498c8" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${r.svg}
  ${t.svg}
  <path d="M4 52 Q${Math.round(totalW * 0.3)} 48, ${Math.round(totalW * 0.5)} 52 Q${Math.round(totalW * 0.7)} 56, ${Math.round(totalW - 4)} 50" stroke="url(#swash6)" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`
}

// Generate all
const logos = [
  ['logo-1-sunrise-calendar.svg', logo1],
  ['logo-2-monogram-bold.svg', logo2],
  ['logo-3-ring-badge.svg', logo3],
  ['logo-4-calendar-refined.svg', logo4],
  ['logo-5-checkmark.svg', logo5],
  ['logo-6-gradient-wordmark.svg', logo6],
]

for (const [name, fn] of logos) {
  const svg = fn()
  writeFileSync(resolve(__dirname, name), svg)
  console.log(`Generated ${name}`)
}

console.log('\nDone!')
