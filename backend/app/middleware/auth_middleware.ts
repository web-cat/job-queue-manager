// PURPOSE: Protects routes from unauthenticated access. Verifies the API token
// in the Authorization header and populates auth.user for downstream use.

// DESIGN: Provided by the AdonisJS starter kit. Uses authenticateUsing() which
// tries each specified guard in order. The redirectTo URL is used for web
// sessions — for API routes this is ignored as 401 is returned directly.

// DEPENDENCIES: AdonisJS auth package, auth_access_tokens table

// CONSUMERS: kernel.ts (registered as named middleware), routes.ts

// STATUS: complete (starter kit file — do not modify)

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    return next()
  }
}
