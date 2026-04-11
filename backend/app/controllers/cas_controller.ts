import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import User from '#models/user'
import Identity from '#models/identity'
import CasService from '#services/cas_service'

/**
 * CasController
 *
 * Handles the VT CAS SSO authentication flow.
 *
 * Routes:
 *   GET /api/auth/cas           → redirect to CAS login
 *   GET /api/auth/cas/callback  → validate ticket, issue token
 *   GET /api/auth/cas/logout    → redirect to CAS logout
 *
 * NOTE: These routes only work on the Discovery cluster.
 *       CAS will not authenticate localhost callback URLs.
 *       Deploy to test: https://webcatmaxxers.discovery.cs.vt.edu
 */
export default class CasController {
  private casService = new CasService()

  /**
   * GET /api/auth/cas
   *
   * Redirects the user to the VT CS CAS login page.
   * CAS will authenticate the user and redirect back to the callback URL.
   */
  async redirect({ response }: HttpContext) {
    const loginUrl = this.casService.getLoginUrl()
    return response.redirect(loginUrl)
  }

  /**
   * GET /api/auth/cas/callback
   *
   * Handles the CAS callback after successful authentication.
   * CAS sends a ?ticket=ST-xxx query parameter which we validate.
   *
   * On success:
   *   - Finds or creates a User record linked via Identity (provider='cas')
   *   - Issues an API access token
   *   - Redirects to frontend with token in query string
   *
   * On failure:
   *   - Redirects to frontend login page with error message
   */
  async callback({ request, response }: HttpContext) {
    const ticket = request.qs().ticket as string | undefined
    const frontendUrl = env.get('FRONTEND_URL')

    if (!ticket) {
      return response.redirect(`${frontendUrl}/login?error=no_ticket`)
    }

    // Validate ticket with CAS server
    const casUser = await this.casService.validateTicket(ticket)

    if (!casUser) {
      return response.redirect(`${frontendUrl}/login?error=invalid_ticket`)
    }

    try {
      // Look up existing identity for this CAS PID
      let identity = await Identity.query()
        .where('provider', 'cas')
        .where('uid', casUser.pid)
        .preload('user')
        .first()

      let user: User

      if (identity) {
        // Existing CAS user — use their linked account
        user = identity.user
      } else {
        // New CAS user — find by email or create a new account
        user = await User.firstOrCreate(
          { email: casUser.email },
          {
            email: casUser.email,
            encryptedPassword: '', // CAS users have no local password
            firstName: casUser.firstName,
            lastName: casUser.lastName,
            slug: casUser.pid,
            signInCount: 0,
            // globalRoleId must reference a seeded global_role record
            // Default to the lowest privilege role (id: 2 = student)
            // TODO: Seed global_role table with admin (id:1) and student (id:2)
            globalRoleId: 2,
          }
        )

        // Create identity record linking this user to CAS
        identity = await Identity.create({
          userId: user.id,
          provider: 'cas',
          uid: casUser.pid,
        })
      }

      // Update user info from CAS on each login
      await user
        .merge({
          firstName: casUser.firstName ?? user.firstName,
          lastName: casUser.lastName ?? user.lastName,
          signInCount: (user.signInCount ?? 0) + 1,
        })
        .save()

      // Issue an API access token
      const token = await User.accessTokens.create(user, ['*'], {
        name: `cas-session-${casUser.pid}`,
        expiresIn: '24 hours',
      })

      // Redirect to frontend with token
      // Frontend should store this token and use it for all API calls
      const tokenValue = token.value!.release()
      return response.redirect(
        `${frontendUrl}/auth/callback?token=${tokenValue}&pid=${casUser.pid}`
      )
    } catch (error) {
      console.error('[CasController] Error during CAS callback:', error)
      return response.redirect(`${frontendUrl}/login?error=server_error`)
    }
  }

  /**
   * GET /api/auth/cas/logout
   *
   * Logs the user out of both your application and the CAS session.
   * Revoking only the local token would leave the CAS session active,
   * allowing the user to re-authenticate without entering credentials.
   */
  async logout({ auth, response }: HttpContext) {
    try {
      // Revoke the local API token if user is authenticated
      const user = auth.user
      if (user) {
        const token = user.currentAccessToken
        if (token) {
          await User.accessTokens.delete(user, token.identifier)
        }
      }
    } catch {
      // Proceed to CAS logout even if local token revocation fails
    }

    // Redirect to CAS logout — ends the university-wide SSO session
    const logoutUrl = this.casService.getLogoutUrl()
    return response.redirect(logoutUrl)
  }
}
