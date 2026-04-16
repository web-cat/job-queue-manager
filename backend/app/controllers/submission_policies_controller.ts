import type { HttpContext } from '@adonisjs/core/http'
import SubmissionPolicy from '#models/submission_policy'

export default class SubmissionPoliciesController {
  /**
   * GET /api/submission-policies
   * List all submission policies
   */
  async index({ response }: HttpContext) {
    const policies = await SubmissionPolicy.query().orderBy('name', 'asc')
    return response.ok(policies)
  }
}
