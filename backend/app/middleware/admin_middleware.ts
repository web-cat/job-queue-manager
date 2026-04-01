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
    await user.load('globalRole')

    if (!user.globalRole?.canManageAllCourses) {
      return response.forbidden({ message: 'Admin access required' })
    }

    return next()
  }
}
