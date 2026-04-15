#!/usr/bin/env node
/**
 * Bumps Android versionCode and versionName in android/app/build.gradle.
 * versionCode: incremented by 1
 * versionName: patch segment incremented by 1 (e.g. "1.0" → "1.0.1", "1.0.1" → "1.0.2")
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const gradlePath = resolve(__dirname, '../android/app/build.gradle')

let gradle = readFileSync(gradlePath, 'utf8')

// Parse current values
const codeMatch = gradle.match(/versionCode\s+(\d+)/)
const nameMatch = gradle.match(/versionName\s+"([^"]+)"/)

if (!codeMatch || !nameMatch) {
  console.error('Could not find versionCode or versionName in build.gradle')
  process.exit(1)
}

const currentCode = parseInt(codeMatch[1], 10)
const currentName = nameMatch[1]

// Increment versionCode
const newCode = currentCode + 1

// Increment patch on versionName (normalise to major.minor.patch)
const parts = currentName.split('.').map(Number)
while (parts.length < 3) parts.push(0)
parts[2] += 1
const newName = parts.join('.')

gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`)

writeFileSync(gradlePath, gradle, 'utf8')

console.log(`Android version bumped:`)
console.log(`  versionCode  ${currentCode} → ${newCode}`)
console.log(`  versionName  "${currentName}" → "${newName}"`)
