#!/usr/bin/env node
/**
 * Bumps iOS CURRENT_PROJECT_VERSION and MARKETING_VERSION in project.pbxproj.
 * CURRENT_PROJECT_VERSION: incremented by 1
 * MARKETING_VERSION: patch segment incremented by 1 (e.g. "1.0" → "1.0.1", "1.0.1" → "1.0.2")
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pbxprojPath = resolve(__dirname, '../ios/App/App.xcodeproj/project.pbxproj')

let pbxproj = readFileSync(pbxprojPath, 'utf8')

// Parse current values
const buildMatch = pbxproj.match(/CURRENT_PROJECT_VERSION\s*=\s*(\d+)/)
const marketingMatch = pbxproj.match(/MARKETING_VERSION\s*=\s*([^;]+)/)

if (!buildMatch || !marketingMatch) {
  console.error('Could not find CURRENT_PROJECT_VERSION or MARKETING_VERSION in project.pbxproj')
  process.exit(1)
}

const currentBuild = parseInt(buildMatch[1], 10)
const currentMarketing = marketingMatch[1].trim()

// Increment CURRENT_PROJECT_VERSION
const newBuild = currentBuild + 1

// Increment patch on MARKETING_VERSION (normalise to major.minor.patch)
const parts = currentMarketing.split('.').map(Number)
while (parts.length < 3) parts.push(0)
parts[2] += 1
const newMarketing = parts.join('.')

pbxproj = pbxproj
  .replace(/CURRENT_PROJECT_VERSION\s*=\s*\d+/g, `CURRENT_PROJECT_VERSION = ${newBuild}`)
  .replace(/MARKETING_VERSION\s*=\s*[^;]+/g, `MARKETING_VERSION = ${newMarketing}`)

writeFileSync(pbxprojPath, pbxproj, 'utf8')

console.log(`iOS version bumped:`)
console.log(`  CURRENT_PROJECT_VERSION  ${currentBuild} → ${newBuild}`)
console.log(`  MARKETING_VERSION        "${currentMarketing}" → "${newMarketing}"`)
