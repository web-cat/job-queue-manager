// PURPOSE: Custom AdonisJS v6 authentication guard for HMAC-SHA256 signed requests.
// Implements GuardContract so auth.getUserOrFail() works correctly in all
// controllers — no bypassing, no patching private fields.
//
// DESIGN: Follows the AdonisJS custom auth guard pattern documented at:
// https://docs.adonisjs.com/guides/authentication/custom-auth-guard
//
// The guard reads x-api-key, x-timestamp, x-nonce, x-signature headers,
// verifies the HMAC signature against the stored encrypted secret, and
// sets the authenticated user on the guard instance.
//
// REGISTRATION: Add to config/auth.ts and kernel.ts — see comments below.
//
// REPLAY PROTECTION:
//   - Timestamp must be within 5 minutes of server time
//   - Nonce tracked in memory — move to Redis for multi-pod deployments

import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import { symbols, errors } from '@adonisjs/auth'
import type { GuardContract } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import OAuthClient from '#models/oauth_client'
import { decrypt } from '#utils/oauth_encryption'
import User from '#models/user'

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000

// In-memory nonce store — move to Redis for multi-pod deployments
const usedNonces = new Map<string, number>()
const interval = setInterval(() => {
  const cutoff = Date.now() - TIMESTAMP_TOLERANCE_MS
  for (const [nonce, ts] of usedNonces.entries()) {
    if (ts < cutoff) usedNonces.delete(nonce)
  }
}, 60_000)
interval.unref() // allows process to exit even if interval is pending

export class HmacGuard implements GuardContract<User> {
  // Required by GuardContract
  declare [symbols.GUARD_KNOWN_EVENTS]: {}
  driverName = 'hmac' as const
  authenticationAttempted = false
  isAuthenticated = false
  user: User | undefined = undefined

  #ctx: HttpContext

  constructor(ctx: HttpContext) {
    this.#ctx = ctx
  }
  // Add this method to HmacGuard class:

  /**
   * Used by Japa test client loginAs() — not needed for HMAC auth.
   * Returns empty headers since HMAC signing is handled per-request.
   */
  async authenticateAsClient(
    _user: User,
    _abilities?: string[],
    _options?: Record<string, unknown>
  ): Promise<{ headers?: Record<string, string> }> {
    return {}
  }

  /**
   * Returns the authenticated user or throws E_UNAUTHORIZED_ACCESS.
   * This is what auth.getUserOrFail() calls internally.
   */
  getUserOrFail(): User {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }
    return this.user
  }

  /**
   * Authenticate the request by verifying the HMAC signature.
   * Called by auth.authenticate() and auth.authenticateUsing().
   */
  async authenticate(): Promise<User> {
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }

    this.authenticationAttempted = true

    const request = this.#ctx.request
    const clientId = request.header('x-api-key')
    const timestamp = request.header('x-timestamp')
    const nonce = request.header('x-nonce')
    const signature = request.header('x-signature')

    // Validate required headers
    if (!clientId || !timestamp || !nonce || !signature) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Missing HMAC headers', {
        guardDriverName: this.driverName,
      })
    }

    // Validate timestamp
    const ts = Number.parseInt(timestamp, 10)
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Timestamp outside tolerance window', {
        guardDriverName: this.driverName,
      })
    }

    // Validate nonce
    if (usedNonces.has(nonce)) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Replayed nonce', {
        guardDriverName: this.driverName,
      })
    }

    // Look up client
    const client = await OAuthClient.query()
      .where('client_id', clientId)
      .where('active', true)
      .preload('user')
      .first()

    if (!client) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unknown or inactive API key', {
        guardDriverName: this.driverName,
      })
    }

    // Decrypt stored secret
    let clientSecret: string
    try {
      clientSecret = decrypt(client.clientSecretEncrypted)
    } catch {
      throw new errors.E_UNAUTHORIZED_ACCESS('Failed to verify credentials', {
        guardDriverName: this.driverName,
      })
    }

    // Build canonical string and verify signature
    const rawBody = request.raw() ?? ''
    const bodyHash = createHash('sha256').update(rawBody).digest('hex')
    const path = request.url(false)
    const canonical = [request.method(), path, timestamp, nonce, bodyHash].join('\n')
    const expectedSig = createHmac('sha256', clientSecret).update(canonical).digest('hex')

    let sigValid = false
    try {
      const expectedBuf = Buffer.from(expectedSig, 'hex')
      const actualBuf = Buffer.from(signature, 'hex')
      sigValid = expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
    } catch {
      sigValid = false
    }

    if (!sigValid) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Invalid HMAC signature', {
        guardDriverName: this.driverName,
      })
    }

    // Mark nonce used and update client
    usedNonces.set(nonce, Date.now())
    client.lastUsedAt = DateTime.now()
    await client.save()

    // Set authenticated user
    this.user = client.user
    this.isAuthenticated = true

    return this.user
  }

  /**
   * Same as authenticate but returns null instead of throwing on failure.
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
  }
}
