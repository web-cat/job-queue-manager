// PURPOSE: LTI 1.3 Tool Provider HTTP routes.
//
// DESIGN: Stub controller documenting the three required public endpoints
// for LTI 1.3 OIDC launch flow. All three must remain public — Canvas
// calls them directly without any existing session token.
//
// REQUIRED ROUTES (all public — add to routes.ts):
//   POST /api/lti/init    → OIDC login initiation
//   POST /api/lti/launch  → id_token receipt and verification
//   GET  /api/lti/jwks    → public JWK keyset for Canvas
//
// CANVAS CONFIGURATION:
//   When registering in Canvas Developer Keys (LTI 1.3 key type):
//     Target Link URI:            https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch
//     OpenID Connect Init URL:    https://webcatmaxxers.discovery.cs.vt.edu/api/lti/init
//     JWK Method → Public JWK URL: https://webcatmaxxers.discovery.cs.vt.edu/api/lti/jwks
//     Redirect URIs:              https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch
//
// STATUS: stub — see lti_service.ts for full implementation guide

import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import LtiService from '#services/lti_service'

export default class LtiController {
  private ltiService = new LtiService()

  /**
   * POST /api/lti/init
   *
   * Step 1 of LTI 1.3 OIDC launch — login initiation.
   * Canvas POSTs here when a student clicks an assignment link.
   *
   * Canvas sends:
   *   iss             → Canvas platform URL (e.g. https://canvas.vt.edu)
   *   login_hint      → opaque user identifier from Canvas
   *   target_link_uri → where to send the user after auth
   *   client_id       → your tool's client ID from Canvas Developer Keys
   *   lti_message_hint → Canvas assignment context
   *
   * Response: redirect to Canvas authorization endpoint with state + nonce
   *
   * TODO: Implement — see lti_service.ts handleOidcInitiation()
   */
  async init({ request, response }: HttpContext) {
    const frontendUrl = env.get('FRONTEND_URL', 'https://webcatmaxxers.discovery.cs.vt.edu')

    try {
      const params = request.body() as Record<string, string>
      const redirectUrl = await this.ltiService.handleOidcInitiation(params)
      return response.redirect(redirectUrl)
    } catch {
      console.warn('[LtiController] LTI 1.3 init not yet implemented')
      return response.redirect(`${frontendUrl}/login?error=lti_not_implemented`)
    }
  }

  /**
   * POST /api/lti/launch
   *
   * Step 2 of LTI 1.3 OIDC launch — authentication response.
   * Canvas POSTs the signed JWT id_token here after the student authenticates.
   *
   * Canvas sends:
   *   id_token  → signed JWT containing user info, roles, and LTI claims
   *   state     → must match the state sent in Step 1 (CSRF protection)
   *
   * Response: verify JWT, provision user, issue session token, redirect to frontend
   *
   * TODO: Implement — see lti_service.ts verifyIdToken() and findOrCreateUser()
   */
  async launch({ request, response }: HttpContext) {
    const frontendUrl = env.get('FRONTEND_URL', 'https://webcatmaxxers.discovery.cs.vt.edu')

    try {
      const { id_token: idToken } = request.body() as { id_token: string }

      if (!idToken) {
        return response.redirect(`${frontendUrl}/login?error=lti_missing_token`)
      }

      // TODO: Verify JWT, provision user, issue token, redirect to frontend
      // const claims = await this.ltiService.verifyIdToken(idToken)
      // const user = await this.ltiService.findOrCreateUser(claims)
      // const token = await User.accessTokens.create(user, ['*'], { expiresIn: '24 hours' })
      // return response.redirect(`${frontendUrl}/lti/launch?token=${token.value!.release()}`)

      console.warn('[LtiController] LTI 1.3 launch not yet implemented')
      return response.redirect(`${frontendUrl}/login?error=lti_not_implemented`)
    } catch {
      return response.redirect(`${frontendUrl}/login?error=lti_error`)
    }
  }

  /**
   * GET /api/lti/jwks
   *
   * Exposes the tool's public JWK keyset so Canvas can verify
   * JWT signatures from this tool during Deep Linking and AGS calls.
   *
   * Canvas fetches this URL during tool registration and caches it.
   * Must be publicly accessible with no auth required.
   *
   * TODO: Generate RSA key pair, store private key in LTI_PRIVATE_KEY env var,
   * expose public key here. See lti_service.ts getPublicJwks().
   */
  async jwks({ response }: HttpContext) {
    return response.ok(this.ltiService.getPublicJwks())
  }

  /**
   * POST /api/lti/grade
   *
   * Send a grade back to Canvas using LTI Advantage Assignment and Grade Services.
   * Protected by API token — called internally after grading completes.
   *
   * TODO: Implement AGS grade passback — see lti_service.ts sendGrade()
   * The lineitem URL comes from the JWT claims stored during launch.
   */
  async grade({ request, response }: HttpContext) {
    const { userId, assignmentOfferingId, score } = request.body()

    if (score < 0 || score > 1) {
      return response.badRequest({ message: 'Score must be between 0.0 and 1.0' })
    }

    try {
      // TODO: Look up stored lineitem URL for this user + assignment
      // const lineitemUrl = await LtiLaunch.query()
      //   .where('user_id', userId)
      //   .where('assignment_offering_id', assignmentOfferingId)
      //   .firstOrFail()
      //   .then(r => r.lineitemUrl)
      //
      // await this.ltiService.sendGrade(lineitemUrl, userId, score, 1.0)

      console.warn('[LtiController] LTI 1.3 grade passback not yet implemented')
      return response.ok({
        message: 'Grade passback not yet implemented',
        userId,
        assignmentOfferingId,
        score,
      })
    } catch {
      return response.internalServerError({ message: 'Grade passback failed' })
    }
  }
}
