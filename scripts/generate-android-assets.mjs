#!/usr/bin/env node
/**
 * Generate Android app icon and splash screen assets from the app's SVG logo.
 * Uses sharp for SVG → PNG conversion and compositing.
 *
 * Usage: node scripts/generate-android-assets.mjs
 */

import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const ANDROID_RES = join(ROOT, 'android/app/src/main/res')

// ── SVG Sources ──────────────────────────────────────────────────────────

// Icon foreground: checkmark with circles, centered in 108dp adaptive-icon canvas.
// The safe zone is the inner 66%, so the logo sits within that area.
const iconForegroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <defs>
    <linearGradient id="g" x1="30" y1="65" x2="78" y2="35" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d97706"/>
      <stop offset="0.5" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <circle cx="54" cy="54" r="28" stroke="#d97706" stroke-width="2" fill="none" stroke-opacity="0.5"/>
  <circle cx="54" cy="54" r="23" stroke="#f59e0b" stroke-width="2.8" fill="none" stroke-opacity="0.7" stroke-dasharray="4.5 6.5"/>
  <path d="M37 54 L50 68 L74 38" stroke="url(#g)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`

// Legacy icon: checkmark with dark background, full icon
const legacyIconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="${size * 0.25}" y1="${size * 0.65}" x2="${size * 0.75}" y2="${size * 0.3}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d97706"/>
      <stop offset="0.5" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#1c1c2e"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}" stroke="#d97706" stroke-width="${size * 0.02}" fill="none" stroke-opacity="0.5"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.25}" stroke="#f59e0b" stroke-width="${size * 0.025}" fill="none" stroke-opacity="0.7" stroke-dasharray="${size * 0.04} ${size * 0.06}"/>
  <path d="M${size * 0.32} ${size * 0.5} L${size * 0.44} ${size * 0.64} L${size * 0.7} ${size * 0.34}" stroke="url(#g)" stroke-width="${size * 0.06}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`

// Round icon: same but circular mask
const roundIconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="${size * 0.25}" y1="${size * 0.65}" x2="${size * 0.75}" y2="${size * 0.3}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d97706"/>
      <stop offset="0.5" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
    <clipPath id="c"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${size}" height="${size}" fill="#1c1c2e"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}" stroke="#d97706" stroke-width="${size * 0.02}" fill="none" stroke-opacity="0.5"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.25}" stroke="#f59e0b" stroke-width="${size * 0.025}" fill="none" stroke-opacity="0.7" stroke-dasharray="${size * 0.04} ${size * 0.06}"/>
    <path d="M${size * 0.32} ${size * 0.5} L${size * 0.44} ${size * 0.64} L${size * 0.7} ${size * 0.34}" stroke="url(#g)" stroke-width="${size * 0.06}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`

// Splash screen: logo centered on dark background
const splashSvg = (w, h) => {
  const logoSize = Math.min(w, h) * 0.2
  const cx = w / 2
  const cy = h / 2
  const r1 = logoSize * 0.5
  const r2 = logoSize * 0.42
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="${cx - r1}" y1="${cy + r1 * 0.6}" x2="${cx + r1}" y2="${cy - r1 * 0.4}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d97706"/>
      <stop offset="0.5" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1c1c2e"/>
  <circle cx="${cx}" cy="${cy}" r="${r1}" stroke="#d97706" stroke-width="${logoSize * 0.035}" fill="none" stroke-opacity="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="${r2}" stroke="#f59e0b" stroke-width="${logoSize * 0.045}" fill="none" stroke-opacity="0.7" stroke-dasharray="${logoSize * 0.07} ${logoSize * 0.1}"/>
  <path d="M${cx - r1 * 0.55} ${cy} L${cx - r1 * 0.15} ${cy + r1 * 0.45} L${cx + r1 * 0.65} ${cy - r1 * 0.45}" stroke="url(#g)" stroke-width="${logoSize * 0.1}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`
}

// ── Generate PNGs ────────────────────────────────────────────────────────

function sharp(inputSvg, outputPath, width, height) {
  const tmpSvg = join(ROOT, '.tmp-icon.svg')
  writeFileSync(tmpSvg, inputSvg)
  const h = height ? `--height ${height}` : ''
  execSync(`npx sharp-cli -i "${tmpSvg}" -o "${outputPath}" resize ${width} ${h || `${width}`}`, {
    cwd: ROOT,
    stdio: 'pipe',
  })
}

// Adaptive icon foreground sizes (108dp base)
const densities = [
  { name: 'mdpi', foreground: 108, legacy: 48 },
  { name: 'hdpi', foreground: 162, legacy: 72 },
  { name: 'xhdpi', foreground: 216, legacy: 96 },
  { name: 'xxhdpi', foreground: 324, legacy: 144 },
  { name: 'xxxhdpi', foreground: 432, legacy: 192 },
]

// Splash screen sizes
const splashSizes = [
  { dir: 'drawable', w: 480, h: 800 },
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  { dir: 'drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
]

console.log('Generating Android icon assets...')

for (const d of densities) {
  const mipmapDir = join(ANDROID_RES, `mipmap-${d.name}`)
  mkdirSync(mipmapDir, { recursive: true })

  // Adaptive foreground
  console.log(`  mipmap-${d.name}/ic_launcher_foreground.png (${d.foreground}x${d.foreground})`)
  sharp(iconForegroundSvg, join(mipmapDir, 'ic_launcher_foreground.png'), d.foreground, d.foreground)

  // Legacy icon
  console.log(`  mipmap-${d.name}/ic_launcher.png (${d.legacy}x${d.legacy})`)
  sharp(legacyIconSvg(d.legacy), join(mipmapDir, 'ic_launcher.png'), d.legacy, d.legacy)

  // Round icon
  console.log(`  mipmap-${d.name}/ic_launcher_round.png (${d.legacy}x${d.legacy})`)
  sharp(roundIconSvg(d.legacy), join(mipmapDir, 'ic_launcher_round.png'), d.legacy, d.legacy)
}

console.log('\nGenerating splash screen assets...')

for (const s of splashSizes) {
  const dir = join(ANDROID_RES, s.dir)
  mkdirSync(dir, { recursive: true })
  console.log(`  ${s.dir}/splash.png (${s.w}x${s.h})`)
  sharp(splashSvg(s.w, s.h), join(dir, 'splash.png'), s.w, s.h)
}

// Also generate the main app icon at 512px for build/resources
console.log('\nGenerating build icons...')
sharp(legacyIconSvg(512), join(ROOT, 'resources/icon.png'), 512, 512)
sharp(legacyIconSvg(512), join(ROOT, 'build/icon.png'), 512, 512)
sharp(legacyIconSvg(512), join(ROOT, 'src/renderer/public/icon-512.png'), 512, 512)

console.log('\nDone! All assets generated.')
