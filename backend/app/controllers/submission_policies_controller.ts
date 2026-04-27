import type { HttpContext } from '@adonisjs/core/http'
import SubmissionPolicy from '#models/submission_policy'
import CourseEnrollment from '#models/course_enrollment'

export default class SubmissionPoliciesController {
  /**
   * GET /api/submission-policies
   * List all submission policies.
   * Accessible to: global admins (1), global instructors (2),
   * and users who are course-level instructors (courseRoleId=1) in any section.
   * Students with no instructor role anywhere are denied.
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Global admin or global instructor — allow immediately
    if (user.globalRoleId === 1 || user.globalRoleId === 2) {
      const policies = await SubmissionPolicy.query().orderBy('name', 'asc')
      return response.ok(policies)
    }

    // Check for course-level instructor role in any section (additive rule)
    const courseInstructorEnrollment = await CourseEnrollment.query()
      .where('user_id', user.id)
      .where('course_role_id', 1)
      .first()

    if (!courseInstructorEnrollment) {
      return response.forbidden({ message: 'Access denied' })
    }

    const policies = await SubmissionPolicy.query().orderBy('name', 'asc')
    return response.ok(policies)
  }
}
