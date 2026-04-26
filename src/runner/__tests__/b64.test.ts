import { describe, it, expect } from 'vitest'

// Mirror the b64ToBytes implementation from runner.js for unit testing.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B64_LOOKUP = new Uint8Array(128)
for (let i = 0; i < B64_CHARS.length; i++) B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i

function b64ToBytes(b64: string): Uint8Array {
  const len = b64.length
  let padding = 0
  if (len > 0 && b64[len - 1] === '=') padding++
  if (len > 1 && b64[len - 2] === '=') padding++
  const byteLen = (len * 3) / 4 - padding
  const bytes = new Uint8Array(byteLen)
  let p = 0
  for (let i = 0; i < len; i += 4) {
    const a = B64_LOOKUP[b64.charCodeAt(i)]
    const b = B64_LOOKUP[b64.charCodeAt(i + 1)]
    const c = B64_LOOKUP[b64.charCodeAt(i + 2)]
    const d = B64_LOOKUP[b64.charCodeAt(i + 3)]
    bytes[p++] = (a << 2) | (b >> 4)
    if (p < byteLen) bytes[p++] = ((b & 15) << 4) | (c >> 2)
    if (p < byteLen) bytes[p++] = ((c & 3) << 6) | d
  }
  return bytes
}

describe('runner b64ToBytes', () => {
  it('matches atob output for ASCII strings', () => {
    const samples = ['hello', 'AES-GCM key data here', 'A', 'AB', 'ABC', 'ABCD']
    for (const s of samples) {
      const b64 = btoa(s)
      const ours = b64ToBytes(b64)
      const expected = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      expect(Array.from(ours)).toEqual(Array.from(expected))
    }
  })

  it('matches atob for random bytes', () => {
    for (let trial = 0; trial < 20; trial++) {
      const len = 1 + Math.floor(Math.random() * 100)
      const bytes = new Uint8Array(len)
      crypto.getRandomValues(bytes)
      const b64 = btoa(String.fromCharCode(...bytes))
      const ours = b64ToBytes(b64)
      expect(Array.from(ours)).toEqual(Array.from(bytes))
    }
  })

  it('decodes a 32-byte AES key correctly', () => {
    // Realistic test: encode a 32-byte key, decode, verify
    const key = new Uint8Array(32)
    crypto.getRandomValues(key)
    const b64 = btoa(String.fromCharCode(...key))
    const decoded = b64ToBytes(b64)
    expect(decoded.length).toBe(32)
    expect(Array.from(decoded)).toEqual(Array.from(key))
  })
})
