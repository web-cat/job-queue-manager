// PURPOSE: AdonisJS middleware that verifies HMAC-SHA256 signatures on incoming
// API requests from external tools (scripts, IDE plugins, instructor automation).
//
// DESIGN: Runs before controller actions on external tool API routes only.
// Does NOT run on user-facing routes (frontend uses session tokens).
// On success, injects the client's owner user into auth context so all
// Bouncer policies and controller auth checks work identically to session auth.
//
// REQUEST FORMAT (external tool must send these headers):
//   x-api-key:   <client_id from oauth_client creation>
//   x-timestamp: <unix ms timestamp e.g. Date.now()>
//   x-nonce:     <unique string per request e.g. crypto.randomUUID()>
//   x-signature: <HMAC-SHA256 hex of canonical string>
//
// CANONICAL STRING (must match exactly on both sides):
//   METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
//
// CLIENT SIGNING EXAMPLE (TypeScript):
//   import { createHmac, createHash, randomUUID } from 'node:crypto'
//
//   const clientId = '<your client_id>'
//   const clientSecret = '<your client_secret>'
//   const method = 'POST'
//   const path = '/api/submissions'
//   const body = JSON.stringify({ workoutId: 1 })
//   const timestamp = Date.now().toString()
//   const nonce = randomUUID()
//   const bodyHash = createHash('sha256').update(body).digest('hex')
//   const canonical = [method, path, timestamp, nonce, bodyHash].join('\n')
//   const signature = createHmac('sha256', clientSecret).update(canonical).digest('hex')
//
//   fetch('https://webcatmaxxers.discovery.cs.vt.edu/api/submissions', {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       'x-api-key': clientId,
//       'x-timestamp': timestamp,
//       'x-nonce': nonce,
//       'x-signature': signature,
//     },
//     body,
//   })
//
// NEXT TEAM NOTES:
//   The nonce store is in-memory — resets on pod restart. For production
//   multi-pod deployments, move to Redis to prevent cross-pod replay attacks.
//
// STATUS: complete

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import { DateTime } from 'luxon'
import OAuthClient from '#models/oauth_client'
import { decrypt } from '#utils/oauth_encryption'

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000 // 5 minutes

// In-memory nonce store — maps nonce → timestamp used
const usedNonces = new Map<string, number>()

// Evict expired nonces every minute
setInterval(() => {
  const cutoff = Date.now() - TIMESTAMP_TOLERANCE_MS
  for (const [nonce, ts] of usedNonces.entries()) {
    if (ts < cutoff) usedNonces.delete(nonce)
  }
}, 60_000)

export default class OAuthSignatureMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    const clientId = request.header('x-api-key')
    const timestamp = request.header('x-timestamp')
    const nonce = request.header('x-nonce')
    const signature = request.header('x-signature')

    // ── Validate required headers ─────────────────────────────────
    if (!clientId || !timestamp || !nonce || !signature) {
      return response.unauthorized({
        error: 'missing_headers',
        error_description: 'Required: x-api-key, x-timestamp, x-nonce, x-signature',
      })
    }

    // ── Validate timestamp ────────────────────────────────────────
    const ts = Number.parseInt(timestamp, 10)
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      return response.unauthorized({
        error: 'invalid_timestamp',
        error_description: 'Timestamp outside 5-minute tolerance window',
      })
    }

    // ── Validate nonce (anti-replay) ──────────────────────────────
    if (usedNonces.has(nonce)) {
      return response.unauthorized({
        error: 'replayed_nonce',
        error_description: 'This nonce has already been used',
      })
    }

    // ── Look up client ────────────────────────────────────────────
    const client = await OAuthClient.query()
      .where('client_id', clientId)
      .where('active', true)
      .preload('user')
      .first()

    if (!client) {
      return response.unauthorized({
        error: 'invalid_client',
        error_description: 'Unknown or inactive API key',
      })
    }

    // ── Decrypt the stored client secret ──────────────────────────
    let clientSecret: string
    try {
      clientSecret = decrypt(client.clientSecretEncrypted)
    } catch {
      return response.internalServerError({
        error: 'server_error',
        error_description: 'Failed to verify credentials',
      })
    }

    // ── Build canonical string ────────────────────────────────────
    const rawBody = request.raw() ?? ''
    const bodyHash = createHash('sha256').update(rawBody).digest('hex')
    const path = request.url(false) // path without query string
    const canonical = [request.method(), path, timestamp, nonce, bodyHash].join('\n')

    // ── Compute expected signature ────────────────────────────────
    const expectedSig = createHmac('sha256', clientSecret).update(canonical).digest('hex')

    // ── Timing-safe comparison ────────────────────────────────────
    let sigValid = false
    try {
      const expectedBuf = Buffer.from(expectedSig, 'hex')
      const actualBuf = Buffer.from(signature, 'hex')
      sigValid = expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
    } catch {
      sigValid = false
    }

    if (!sigValid) {
      return response.unauthorized({
        error: 'invalid_signature',
        error_description: 'Request signature verification failed',
      })
    }

    // ── Mark nonce as used ────────────────────────────────────────
    usedNonces.set(nonce, Date.now())

    // ── Update last_used_at ───────────────────────────────────────
    client.lastUsedAt = DateTime.now()
    await client.save()

    // ── Inject user into auth context ─────────────────────────────
    // Makes HMAC-authenticated requests behave identically to session-authenticated
    // requests. All Bouncer policies see the client's owner as the current user.
    ctx.auth.getUserOrFail = () => client.user as any
    ;(ctx as any).hmacUser = client.user // set the hmac guard

    return next()
  }
}
