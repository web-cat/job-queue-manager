// PURPOSE: CRUD operations for courses, sections, and enrollments. Used by
// administrators and instructors to set up the course structure that students
// will enroll in.

// DESIGN: Follows the same vine validator pattern as assignments_controller.
// Enrollment validation prevents duplicate enrollments with a conflict response.
// The unenroll endpoint takes userId as a URL parameter to allow admins to
// remove specific users.

// DEPENDENCIES: course.ts, section.ts, course_enrollment.ts

// CONSUMERS: routes.ts, frontend course management pages

// NEXT TEAM NOTES: LTI course creation (when a student launches from Canvas for
// the first time) should auto-create section and course_enrollment records.
// This will require a dedicated LTI launch handler that calls course/section
// creation logic.

import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Course from '#models/course'
import Section from '#models/section'
import CourseEnrollment from '#models/course_enrollment'

// ── Validators ───────────────────────────────────────────────────────

const createCourseValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    number: vine.string().trim().minLength(1),
    organizationId: vine.number().positive(),
    slug: vine.string().trim().minLength(1),
    isHidden: vine.boolean().optional(),
  })
)

const createSectionValidator = vine.compile(
  vine.object({
    termId: vine.number().positive(),
    label: vine.string().trim().minLength(1),
    url: vine.string().optional(),
    selfEnrollmentAllowed: vine.boolean().optional(),
    lmsInstanceId: vine.number().positive().optional(),
  })
)

const enrollValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    courseRoleId: vine.number().positive(),
  })
)

// ── Controller ───────────────────────────────────────────────────────

export default class CoursesController {
  /**
   * GET /api/courses
   * List all visible courses that the user is enrolled in
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { page = 1, limit = 20 } = request.qs()

    const courses = await Course.query()
      .where('is_hidden', false)
      .whereHas('sections', (sectionsQuery) => {
        sectionsQuery.whereHas('enrollments', (enrollmentsQuery) => {
          enrollmentsQuery.where('user_id', user.id)
        })
      })
      .preload('organization')
      .preload('sections', (sectionsQuery) => {
        sectionsQuery.whereHas('enrollments', (enrollmentsQuery) => {
          enrollmentsQuery.where('user_id', user.id)
        })
      })
      .orderBy('name', 'asc')
      .paginate(page, limit)

    return response.ok(courses)
  }

  /**
   * GET /api/courses/:id
   * Get a single course with its sections
   */
  async show({ params, response }: HttpContext) {
    const course = await Course.query()
      .where('id', params.id)
      .preload('organization')
      .preload('sections', (q) => q.preload('term'))
      .firstOrFail()

    return response.ok(course)
  }

  /**
   * POST /api/courses
   * Create a new course
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createCourseValidator)

    const course = await Course.create({
      ...data,
      creatorId: user.id,
    })

    return response.created(course)
  }

  /**
   * GET /api/courses/:id/sections
   * List all sections for a course
   */
  async sections({ params, response }: HttpContext) {
    const course = await Course.findOrFail(params.id)

    const sections = await Section.query()
      .where('course_id', course.id)
      .preload('term')
      .preload('enrollments', (q) => q.preload('user').preload('courseRole'))
      .orderBy('created_at', 'desc')

    return response.ok(sections)
  }

  /**
   * POST /api/courses/:id/sections
   * Create a new section for a course
   */
  async createSection({ params, request, response }: HttpContext) {
    const course = await Course.findOrFail(params.id)
    const data = await request.validateUsing(createSectionValidator)

    const section = await Section.create({
      courseId: course.id,
      ...data,
    })

    return response.created(section)
  }

  /**
   * GET /api/courses/:id/sections/:sectionId/enrollments
   * List all enrollments for a section
   */
  async enrollments({ params, response }: HttpContext) {
    const enrollments = await CourseEnrollment.query()
      .where('course_offering_id', params.sectionId)
      .preload('user')
      .preload('courseRole')

    return response.ok(enrollments)
  }

  /**
   * POST /api/courses/:id/sections/:sectionId/enroll
   * Enroll a user in a section
   */
  async enroll({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(enrollValidator)

    const existing = await CourseEnrollment.query()
      .where('user_id', data.userId)
      .where('course_offering_id', params.sectionId)
      .first()

    if (existing) {
      return response.conflict({ message: 'User is already enrolled in this section' })
    }

    const enrollment = await CourseEnrollment.create({
      userId: data.userId,
      courseOfferingId: params.sectionId,
      courseRoleId: data.courseRoleId,
    })

    return response.created(enrollment)
  }

  /**
   * DELETE /api/courses/:id/sections/:sectionId/enroll/:userId
   * Remove a user from a section
   */
  async unenroll({ params, response }: HttpContext) {
    const enrollment = await CourseEnrollment.query()
      .where('user_id', params.userId)
      .where('course_offering_id', params.sectionId)
      .firstOrFail()

    await enrollment.delete()

    return response.ok({ message: 'User unenrolled successfully' })
  }
}
