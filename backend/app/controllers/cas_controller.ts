// PURPOSE: Handles the three CAS SSO HTTP routes — redirect, callback, logout.
// Orchestrates the full CAS flow by calling CasService and managing the
// user creation/lookup in the identity table.
// DESIGN: On callback, the controller first checks for an existing identity
// record (provider='cas', uid=<PID>). If found, it loads the linked user.
// If not, it uses User.firstOrCreate to find by email or create a new account.
// A new identity record is always created when a new CAS user logs in for the
// first time. The token is passed to the frontend via redirect query string
// rather than a JSON response because the CAS callback is a browser redirect,
// not an AJAX request.
// globalRoleId is hardcoded to 2 (Student) for new CAS users — assumes the
// global_role table has been seeded with Admin (id=1) and Student (id=2).
// DEPENDENCIES: cas_service.ts, user.ts, identity.ts
// CONSUMERS: routes.ts
// NEXT TEAM NOTES: The frontend must handle the /auth/callback?token=xxx&pid=yyy
// redirect by extracting the token from the query string and storing it
// (localStorage or cookie) for use in subsequent API requests.
// If firstName/lastName are null after CAS login (VT CS CAS doesn't always
// return these), you can optionally query VT's LDAP directory for the user's
// full name using their PID.
// The TODO in this file: seed global_role before CAS users can log in.
// Run in Adminer:
// INSERT INTO global_role (name, can_manage_all_courses,
// can_edit_system_configuration, builtin)
// VALUES ('Admin', true, true, true), ('Student', false, false, true);
// STATUS: complete [NEEDS INLINE DOCS — user creation flow]

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
            // globalRoleId: 1 = Admin, 2 = Instructor, 3 = Student
            globalRoleId: 3, // All CAS logins default to Student
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
        const token = (user as any).currentAccessToken
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
