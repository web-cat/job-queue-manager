import type { HttpContext } from '@adonisjs/core/http'
import SubmissionPolicy from '#models/submission_policy'

export default class SubmissionPoliciesController {
  /**
   * GET /api/submission-policies
   * List all submission policies
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    // Restrict to Admins (1) and Instructors (2). Students (3) should get 403.
    if (user.globalRoleId === 3) {
      return response.forbidden({ message: 'Access denied' })
    }

    const policies = await SubmissionPolicy.query().orderBy('name', 'asc')
    return response.ok(policies)
  }
}
