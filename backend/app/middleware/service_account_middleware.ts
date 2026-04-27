import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ServiceAccountMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()

    // Assuming 4 is the ID for the 'Service Account' role
    if (user.globalRoleId !== 4) {
      return response.forbidden({ 
        message: 'Only registered service accounts can access this endpoint.' 
      })
    }

    // Pass request to next middleware or controller
    await next()
  }
}
