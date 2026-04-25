// PURPOSE: HMAC-SHA256 request signing utilities shared between the middleware
// (server-side verification) and the client SDK (client-side signing).
//
// DESIGN: Uses Node.js built-in crypto module — no external dependencies.
// The canonical string format ensures both sides compute identical signatures.
// timingSafeEqual prevents timing attacks during signature comparison.
//
// CANONICAL STRING FORMAT:
//   METHOD\n
//   PATH\n
//   TIMESTAMP\n
//   NONCE\n
//   BODY_HASH
//
// Example:
//   POST\n
//   /api/submissions\n
//   1745000000000\n
//   abc123\n
//   e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
//
// CLIENT USAGE (TypeScript/JavaScript):
//   import { signRequest, buildCanonicalString, hashBody } from './hmac_utils'
//
//   const timestamp = Date.now().toString()
//   const nonce = crypto.randomUUID()
//   const bodyHash = hashBody(JSON.stringify(body))
//   const canonical = buildCanonicalString('POST', '/api/submissions', timestamp, nonce, bodyHash)
//   const signature = signRequest(clientSecret, canonical)
//
//   fetch('https://webcatmaxxers.discovery.cs.vt.edu/api/submissions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'x-api-key': clientId,
//       'x-timestamp': timestamp,
//       'x-nonce': nonce,
//       'x-signature': signature,
//     },
//     body: JSON.stringify(body),
//   })

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Compute SHA-256 hash of request body for integrity verification.
 * Empty body → hash of empty string.
 */
export function hashBody(body: string | Buffer): string {
  const content = typeof body === 'string' ? body : body.toString('utf8')
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Build the canonical string that gets signed.
 * Both client and server must construct this identically.
 */
export function buildCanonicalString(
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  bodyHash: string
): string {
  return [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n')
}

/**
 * Sign a canonical string with the client secret using HMAC-SHA256.
 */
export function signRequest(secret: string, canonical: string): string {
  return createHmac('sha256', secret).update(canonical).digest('hex')
}

/**
 * Timing-safe comparison of two signatures.
 * Prevents timing attacks where an attacker measures response time
 * to determine how many characters of the signature are correct.
 */
export function verifySignature(expected: string, actual: string): boolean {
  try {
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf = Buffer.from(actual, 'hex')
    if (expectedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}