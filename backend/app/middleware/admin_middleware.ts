// PURPOSE: Restricts access to admin-only routes. Must be used after auth
// middleware since it depends on auth.user being populated.
// DESIGN: Checks the user's globalRole relationship for canManageAllCourses
// permission rather than a simple role string. This is because the legacy
// schema uses a relational role system rather than a role enum on the user.
// The relationship must be explicitly loaded (user.load('globalRole')) since
// Lucid relationships are lazy by default.

// DEPENDENCIES: auth_middleware (must run first), global_role.ts, user.ts

// CONSUMERS: routes.ts (applied to admin-only route groups)

// NEXT TEAM NOTES: To protect a route with admin access, chain both middlewares:
// .use([middleware.auth({ guards: ['api'] }), middleware.admin()])
// Consider adding a canManageAssignments check for instructor-level routes
// that don't require full admin access.

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * AdminMiddleware
 *
 * Protects routes that require admin role.
 * Must be used AFTER the auth middleware.
 *
 * Usage in routes.ts:
 *   .use(middleware.admin())
 */
export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()

    // Check admin via globalRole relationship
    if (!(user as any).$loaded('globalRole')) {
      await user.load((loader) => loader.load('globalRole'))
    }

    if (!user.globalRole?.canManageAllCourses) {
      return response.forbidden({ message: 'Admin access required' })
    }

    return next()
  }
}
