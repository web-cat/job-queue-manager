// PURPOSE: Handles user authentication — registration, login, logout, and API
// token management. The entry point for all auth flows including local
// password auth, and (when implemented) CAS SSO and LTI.

// DESIGN: Uses vine validators for all request inputs to ensure type safety and
// provide clear error messages. Tokens are created via AdonisJS
// DbAccessTokensProvider and stored in auth_access_tokens. The createToken
// method allows admins to generate named tokens for worker pods and service
// integrations.

// DEPENDENCIES: user.ts model, vine validators

// CONSUMERS: routes.ts, frontend auth pages

// NEXT TEAM NOTES: CAS login will add a cas() and casCallback() method to this
// controller. OAuth will add similar methods. The existing local auth methods
// should not need to change when adding new providers. When CAS is implemented,
// look up or create the user via their identity record (provider='cas',
// uid=<PID>).

// STATUS: complete [NEEDS INLINE DOCS — token creation flow]

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import vine from '@vinejs/vine'

// ── Validators ───────────────────────────────────────────────────────

const registerValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1),
    lastName: vine.string().trim().minLength(1),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
  })
)

const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(1),
  })
)

const createTokenValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    expiresIn: vine.string().optional(),
  })
)

// ── Controller ───────────────────────────────────────────────────────

export default class AuthController {
  /**
   * POST /api/auth/register
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existing = await User.findBy('email', data.email)
    if (existing) {
      return response.conflict({ message: 'A user with this email already exists' })
    }

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      encryptedPassword: data.password,
      globalRoleId: 3,
      signInCount: 0,
      slug: data.email.split('@')[0],
    })
    const token = await User.accessTokens.create(user)

    return response.created({ token })
  }

  /**
   * POST /api/auth/login
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    try {
      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user)
      return response.ok({ token })
    } catch {
      return response.unauthorized({ message: 'Invalid email or password.' })
    }
  }

  /**
   * DELETE /api/auth/logout
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    // Get the current token from the auth guard's internal state
    const token = (auth.user as any)?.currentAccessToken
    if (token) {
      await User.accessTokens.delete(user, token.identifier)
    }

    return response.ok({ message: 'Logged out successfully' })
  }

  /**
   * GET /api/auth/me
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    return response.ok({
      id: user.id,
      email: user.email,
      slug: user.slug,
      firstName: user.firstName,
      lastName: user.lastName,
      signInCount: user.signInCount,
      globalRoleId: user.globalRoleId,
    })
  }

  /**
   * POST /api/auth/tokens
   * Creates named API tokens — useful for worker pods or integrations
   */
  async createToken({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, expiresIn } = await request.validateUsing(createTokenValidator)

    const token = await User.accessTokens.create(user, ['*'], {
      name,
      expiresIn: expiresIn ?? '30 days',
    })

    return response.created({
      name: token.name,
      token: token.value!.release(),
      expiresAt: token.expiresAt,
    })
  }

  /**
   * GET /api/auth/tokens
   */
  async listTokens({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const tokens = await User.accessTokens.all(user)

    return response.ok(
      tokens.map((t) => ({
        id: t.identifier,
        name: t.name,
        lastUsedAt: t.lastUsedAt,
        expiresAt: t.expiresAt,
        createdAt: t.createdAt,
      }))
    )
  }

  /**
   * DELETE /api/auth/tokens/:id
   */
  async revokeToken({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, params.id)

    return response.ok({ message: 'Token revoked successfully' })
  }
}
