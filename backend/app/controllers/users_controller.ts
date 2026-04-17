import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'

const updateRoleValidator = vine.compile(
  vine.object({
    globalRoleId: vine.number().positive(),
  })
)

export default class UsersController {
  /**
   * GET /api/users
   * List all users
   */
  async index({ request, response }: HttpContext) {
    const { page = 1, limit = 50 } = request.qs()

    const users = await User.query()
      .preload('globalRole')
      .orderBy('last_name', 'asc')
      .paginate(page, limit)

    return response.ok(users)
  }

  /**
   * PATCH /api/users/:id/role
   * Update a user's global role
   */
  async updateRole({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(updateRoleValidator)

    const user = await User.findOrFail(params.id)
    user.globalRoleId = data.globalRoleId
    await user.save()

    // Reload relationships
    await user.load('globalRole')

    return response.ok(user)
  }
}
