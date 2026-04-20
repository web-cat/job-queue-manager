// PURPOSE: LTI 1.3 Tool Provider integration with Canvas/LMS platforms.
//
// DESIGN: This is a documented stub for the next team to implement.
// LTI 1.3 uses OpenID Connect (OIDC) for authentication rather than
// OAuth 1.0 HMAC-SHA1 signatures used in LTI 1.1.
//
// LTI 1.3 FLOW (3-step OIDC launch):
//   Step 1 — Initiation:
//     Canvas POSTs to your login_initiation_url with:
//       iss, login_hint, target_link_uri, lti_message_hint, client_id
//     You redirect back to Canvas's auth endpoint with:
//       scope, response_type, client_id, redirect_uri, state, nonce
//
//   Step 2 — Authentication Response:
//     Canvas POSTs a signed JWT id_token to your redirect_uri
//     You verify the JWT signature using Canvas's public JWKS keys
//     You validate: nonce, iss, aud, exp, iat, deployment_id
//
//   Step 3 — Access:
//     Extract user info, roles, and resource context from the verified JWT
//     Issue your own session token and redirect to the frontend
//
// RECOMMENDED IMPLEMENTATION:
//   Option A — Use ltijs (already installed, v5.9.9)
//     ltijs runs as its own Express server. Requires ltijs-sequelize package
//     to use PostgreSQL instead of MongoDB.
//     npm install ltijs-sequelize
//     See: https://cvmcosta.github.io/ltijs
//
//   Option B — Manual JWT implementation (simpler, no Express conflict)
//     npm install jwks-rsa jsonwebtoken @types/jsonwebtoken
//     Fetch Canvas JWKS from: https://canvas.vt.edu/api/lti/security/jwks
//     Verify id_token JWT, extract claims, provision user.
//
// CANVAS TOOL REGISTRATION (LTI 1.3):
//   Register your tool in Canvas Developer Keys with:
//     Title: Job Queue Manager
//     Target Link URI: https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch
//     OpenID Connect Initiation URL: https://webcatmaxxers.discovery.cs.vt.edu/api/lti/init
//     Redirect URIs: https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch
//     JWK Method: Public JWK URL → https://webcatmaxxers.discovery.cs.vt.edu/api/lti/jwks
//     Scopes: Enable grade passback (Assignment and Grade Services)
//   Canvas will generate a Client ID — store in LTI_CLIENT_ID env var
//
// REQUIRED NEW ENV VARS:
//   LTI_CLIENT_ID        → Client ID from Canvas Developer Keys
//   LTI_PLATFORM_URL     → https://canvas.vt.edu
//   LTI_AUTH_ENDPOINT    → https://canvas.vt.edu/api/lti/authorize_redirect
//   LTI_JWKS_ENDPOINT    → https://canvas.vt.edu/api/lti/security/jwks
//   LTI_ACCESS_TOKEN_URL → https://canvas.vt.edu/login/oauth2/token
//   LTI_PRIVATE_KEY      → RSA private key (PEM) for signing JWTs
//
// REQUIRED NEW ROUTES (add to routes.ts):
//   POST /api/lti/init    → OIDC login initiation (public)
//   POST /api/lti/launch  → OIDC authentication response / id_token receipt (public)
//   GET  /api/lti/jwks    → Expose your public JWK keyset to Canvas (public)
//
// REQUIRED NEW TABLES:
//   lti_nonce — store used nonces to prevent replay attacks
//     id, nonce, expires_at, created_at
//   lti_platform — store registered Canvas platform details
//     id, platform_url, client_id, auth_endpoint, jwks_endpoint, created_at
//
// GRADE PASSBACK (LTI Advantage — Assignment and Grade Services):
//   LTI 1.3 grade passback uses REST API calls with Bearer tokens
//   instead of the XML-based LIS Outcomes Service used in LTI 1.1.
//   The lineitem URL is provided in the JWT claims under:
//     https://purl.imsglobal.org/spec/lti-ags/claim/endpoint
//
// DEPENDENCIES (to install):
//   ltijs-sequelize (if using ltijs approach)
//   OR jwks-rsa + jsonwebtoken (if using manual approach)
//
// REFERENCES:
//   LTI 1.3 spec: https://www.imsglobal.org/spec/lti/v1p3/
//   ltijs docs: https://cvmcosta.github.io/ltijs
//   Canvas LTI 1.3: https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html
//   VT Canvas: https://canvas.vt.edu
//
// STATUS: stub — awaiting next team implementation
//   The LTI 1.1 implementation (ims-lti, lti_service.ts) has been
//   superseded by this 1.3 stub. Do not implement 1.1 further.

export default class LtiService {
  /**
   * Step 1: Handle OIDC login initiation from Canvas.
   * Canvas POSTs here first with login_hint and target_link_uri.
   * Respond by redirecting to Canvas's authorization endpoint.
   *
   * TODO: Implement OIDC initiation redirect
   */
  async handleOidcInitiation(_params: Record<string, string>): Promise<string> {
    throw new Error(
      '[LtiService] LTI 1.3 not yet implemented. See service comments for implementation guide.'
    )
  }

  /**
   * Step 2: Verify the id_token JWT from Canvas.
   * Canvas POSTs the signed JWT after the student authenticates.
   * Verify signature using Canvas JWKS, validate claims, extract user info.
   *
   * TODO: Implement JWT verification via Canvas JWKS endpoint
   */
  async verifyIdToken(_idToken: string): Promise<Record<string, unknown>> {
    throw new Error(
      '[LtiService] LTI 1.3 not yet implemented. See service comments for implementation guide.'
    )
  }

  /**
   * Find or create a user from verified LTI 1.3 JWT claims.
   * Claims include: sub (user ID), email, name, roles, deployment_id
   *
   * TODO: Implement user provisioning from 1.3 JWT claims
   */
  async findOrCreateUser(_claims: Record<string, unknown>): Promise<never> {
    throw new Error(
      '[LtiService] LTI 1.3 not yet implemented. See service comments for implementation guide.'
    )
  }

  /**
   * Send a grade back to Canvas using LTI Advantage Assignment and Grade Services.
   * This replaces the LTI 1.1 LIS Outcomes XML approach with a REST API call.
   *
   * TODO: Implement AGS grade passback
   * Endpoint is in JWT claims: https://purl.imsglobal.org/spec/lti-ags/claim/endpoint
   */
  async sendGrade(
    _lineitemUrl: string,
    _userId: string,
    _score: number,
    _maxScore: number
  ): Promise<boolean> {
    throw new Error(
      '[LtiService] LTI 1.3 grade passback not yet implemented. See service comments.'
    )
  }

  /**
   * Return the tool's public JWK keyset for Canvas to verify our JWT signatures.
   * Canvas fetches this from GET /api/lti/jwks during tool registration.
   *
   * TODO: Generate RSA key pair, store private key in LTI_PRIVATE_KEY env var,
   * expose public key here in JWK format.
   */
  getPublicJwks(): Record<string, unknown> {
    return {
      keys: [],
      _note: 'LTI 1.3 JWKS not yet implemented — generate RSA key pair and expose public key here',
    }
  }
}
