// PURPOSE: OAuth client credentials management and token exchange.
// Allows users to generate client_id/client_secret pairs for external tool access.
// External tools use these credentials to sign API requests via HMAC-SHA256.
//
// FLOW:
//   1. User creates client via POST /api/oauth/clients (from frontend)
//   2. Backend returns { client_id, client_secret } — secret shown ONCE
//   3. External tool uses client_id + raw secret to sign every API request
//   4. Backend middleware verifies signature on each request
//
// NOTE ON TOKEN EXCHANGE:
//   The /api/oauth/token endpoint is kept for compatibility but HMAC signing
//   is the primary mechanism described by Dr. Edwards. External tools should
//   prefer HMAC-signed requests over token exchange for stateless operation.

import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { randomUUID, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import OAuthClient from '#models/oauth_client'
import User from '#models/user'
import { encrypt, decrypt } from '#utils/oauth_encryption'

const TOKEN_EXPIRY = '1 hour'

const createClientValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
  })
)

const tokenValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim(),
    client_secret: vine.string().trim(),
    grant_type: vine.literal('client_credentials'),
  })
)

export default class OAuthController {
  /**
   * POST /api/oauth/token
   *
   * Exchange client_id + client_secret for a short-lived Bearer token.
   * Alternative to HMAC signing — useful for tools that prefer token-based auth.
   * PUBLIC — no existing auth required.
   */
  async token({ request, response }: HttpContext) {
    let data: { client_id: string; client_secret: string; grant_type: string }

    try {
      data = await request.validateUsing(tokenValidator)
    } catch {
      return response.badRequest({
        error: 'invalid_request',
        error_description: 'client_id, client_secret, and grant_type are required',
      })
    }

    const client = await OAuthClient.query()
      .where('client_id', data.client_id)
      .where('active', true)
      .preload('user')
      .first()

    if (!client) {
      return response.unauthorized({
        error: 'invalid_client',
        error_description: 'Unknown or inactive client',
      })
    }

    // Decrypt stored secret and compare to provided secret
    let storedSecret: string
    try {
      storedSecret = decrypt(client.clientSecretEncrypted)
    } catch {
      return response.internalServerError({
        error: 'server_error',
        error_description: 'Failed to verify credentials',
      })
    }

    // Simpler direct comparison — both are known values
    const secretMatches = storedSecret === data.client_secret

    if (!secretMatches) {
      return response.unauthorized({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      })
    }

    await client.merge({ lastUsedAt: DateTime.now() }).save()

    const token = await User.accessTokens.create(client.user, ['*'], {
      name: `oauth-client:${client.name}`,
      expiresIn: TOKEN_EXPIRY,
    })

    return response.ok({
      access_token: token.value!.release(),
      token_type: 'Bearer',
      expires_in: 3600,
    })
  }

  /**
   * POST /api/oauth/clients
   *
   * Create a new OAuth client credential pair.
   * The client_secret is shown ONCE — it cannot be retrieved again.
   * Protected — requires existing session token.
   */
  async createClient({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name } = await request.validateUsing(createClientValidator)

    const clientId = randomUUID()
    const clientSecret = randomBytes(32).toString('hex')
    const clientSecretEncrypted = encrypt(clientSecret)

    const client = await OAuthClient.create({
      userId: user.id,
      clientId,
      clientSecretEncrypted,
      name,
      active: true,
    })

    return response.created({
      id: client.id,
      client_id: client.clientId,
      client_secret: clientSecret, // shown ONCE — never retrievable again
      name: client.name,
      created_at: client.createdAt,
      warning: 'Save your client_secret now — it will not be shown again',
      usage: {
        hmac_signing: 'Sign each request with HMAC-SHA256. See API docs for header format.',
        token_exchange:
          'POST /api/oauth/token with client_id + client_secret to get a Bearer token',
      },
    })
  }

  /**
   * GET /api/oauth/clients
   *
   * List all OAuth clients for the authenticated user.
   * client_secret is never returned — only metadata.
   */
  async listClients({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const clients = await OAuthClient.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')

    return response.ok(clients)
  }

  /**
   * DELETE /api/oauth/clients/:id
   *
   * Revoke an OAuth client. Sets active=false.
   * Already-issued tokens remain valid until they expire (max 1 hour).
   * HMAC-signed requests with this client_id are immediately rejected.
   */
  async revokeClient({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const client = await OAuthClient.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await client.merge({ active: false }).save()

    return response.ok({
      message: `Client "${client.name}" has been revoked`,
      client_id: client.clientId,
    })
  }
}
