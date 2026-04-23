// PURPOSE: AES-256-GCM encryption/decryption for OAuth client secrets.
// Used to store client secrets in a recoverable encrypted form so they can
// be retrieved for HMAC signature verification.
//
// WHY NOT BCRYPT/SCRYPT:
//   One-way hashing cannot be used for HMAC keys because the server must
//   re-sign requests with the same raw secret the client used. Unlike
//   passwords (where you verify input against a hash), HMAC requires the
//   actual secret value to compute the expected signature.
//
// SECURITY:
//   - AES-256-GCM is authenticated encryption — detects tampering
//   - Each encryption uses a random 12-byte IV — same secret encrypts differently
//   - Encryption key derived from APP_KEY — rotating APP_KEY invalidates all secrets
//   - Raw secrets are never logged or stored in plaintext
//
// FORMAT: iv:authTag:ciphertext (all hex-encoded, colon-separated)

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'
import env from '#start/env'

const ALGORITHM = 'aes-256-gcm'

/**
 * Derive a 32-byte encryption key from APP_KEY.
 * SHA-256 of APP_KEY ensures we always get exactly 32 bytes.
 */
function getEncryptionKey(): Buffer {
  const appKey = env.get('APP_KEY')
  return createHash('sha256').update(appKey).digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns iv:authTag:ciphertext (all hex).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Expects iv:authTag:ciphertext format from encrypt().
 * Throws if the ciphertext has been tampered with.
 */
export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':')

  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted format — expected iv:authTag:ciphertext')
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
