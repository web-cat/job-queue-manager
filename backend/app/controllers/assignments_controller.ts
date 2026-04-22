// PURPOSE: CRUD operations for assignments and their section-specific offerings.
// Used by instructors to create and manage assignments, and by students to
// view available assignments.

// DESIGN: Date fields use vine.string() with DateTime.fromISO() conversion rather
// than vine.date() because vine.date() returns JS Date objects which are
// incompatible with Lucid's DateTime columns. Index queries filter by
// user ownership or public visibility.

// DEPENDENCIES: assignment.ts, assignment_offering.ts

// CONSUMERS: routes.ts, frontend assignment management pages

// NEXT TEAM NOTES: The offerings sub-resource (/assignments/:id/offerings) handles
// the association between an assignment and a specific course section. When
// building the frontend assignment creation flow, always create an assignment
// first then create offerings for each section it should appear in.

import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Assignment from '#models/assignment'
import AssignmentOffering from '#models/assignment_offering'
import { DateTime } from 'luxon'

// ── Validators ───────────────────────────────────────────────────────

const createAssignmentValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    description: vine.string().optional(),
    submissionPolicyId: vine.number().positive(),
    isPublic: vine.boolean().optional(),
    scrambled: vine.boolean().optional(),
    pointsMultiplier: vine.number().optional(),
    externalId: vine.string().optional(),
  })
)

const updateAssignmentValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    description: vine.string().optional(),
    isPublic: vine.boolean().optional(),
    scrambled: vine.boolean().optional(),
    pointsMultiplier: vine.number().optional(),
  })
)

const createOfferingValidator = vine.compile(
  vine.object({
    courseOfferingId: vine.number().positive(),
    availableFrom: vine.string().optional(), // ISO string — converted to DateTime below
    dueAt: vine.string().optional(),
    acceptUntil: vine.string().optional(),
    published: vine.boolean().optional(),
    timeLimit: vine.number().positive().optional(),
    attemptLimit: vine.number().positive().optional(),
  })
)

// ── Controller ───────────────────────────────────────────────────────

export default class AssignmentsController {
  /**
   * GET /api/assignments
   * List all public assignments or those owned by the user
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { page = 1, limit = 20, isPublic, sectionId } = request.qs()

    const query = Assignment.query()
      .where((q) => {
        q.where('is_public', true).orWhereHas('assignmentOfferings', (offeringQuery) => {
          // Only show private assignments if the user is explicitly enrolled in the course section offering it
          offeringQuery.whereExists((subq) => {
            subq
              .select('id')
              .from('course_enrollment')
              .whereColumn('course_enrollment.course_offering_id', 'assignment_offering.course_offering_id')
              .where('course_enrollment.user_id', user.id)
          })
        })
      })
      .preload('submissionPolicy')
      .orderBy('created_at', 'desc')

    if (isPublic !== undefined) {
      query.where('is_public', isPublic === 'true')
    }

    if (sectionId) {
      query.whereHas('assignmentOfferings', (q) => {
        q.where('course_offering_id', sectionId)
      })
    }

    const assignments = await query.paginate(page, limit)

    return response.ok(assignments)
  }

  /**
   * GET /api/assignments/:id
   * Get a single assignment with its offerings
   */
  async show({ params, response }: HttpContext) {
    const assignment = await Assignment.query()
      .where('id', params.id)
      .preload('submissionPolicy')
      .preload('assignmentOfferings', (q) => {
        q.preload('section', (sq) => sq.preload('course'))
      })
      .firstOrFail()

    return response.ok(assignment)
  }

  /**
   * POST /api/assignments
   * Create a new assignment
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createAssignmentValidator)

    const assignment = await Assignment.create({
      ...data,
      userId: user.id,
    })

    return response.created(assignment)
  }

  /**
   * PATCH /api/assignments/:id
   * Update an assignment
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const assignment = await Assignment.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    const data = await request.validateUsing(updateAssignmentValidator)
    assignment.merge(data)
    await assignment.save()

    return response.ok(assignment)
  }

  /**
   * DELETE /api/assignments/:id
   * Delete an assignment
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const assignment = await Assignment.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await assignment.delete()

    return response.ok({ message: 'Assignment deleted successfully' })
  }

  /**
   * GET /api/assignments/:id/offerings
   * List all offerings for an assignment
   */
  async offerings({ params, response }: HttpContext) {
    const assignment = await Assignment.findOrFail(params.id)

    const offerings = await AssignmentOffering.query()
      .where('assignment_id', assignment.id)
      .preload('section', (q) => q.preload('course').preload('term'))
      .orderBy('due_at', 'asc')

    return response.ok(offerings)
  }

  /**
   * POST /api/assignments/:id/offerings
   * Create a new offering for an assignment in a course section
   */
  async createOffering({ params, request, response }: HttpContext) {
    const assignment = await Assignment.findOrFail(params.id)
    const data = await request.validateUsing(createOfferingValidator)

    const offering = await AssignmentOffering.create({
      assignmentId: assignment.id,
      courseOfferingId: data.courseOfferingId,
      availableFrom: data.availableFrom ? DateTime.fromISO(data.availableFrom) : null,
      dueAt: data.dueAt ? DateTime.fromISO(data.dueAt) : null,
      acceptUntil: data.acceptUntil ? DateTime.fromISO(data.acceptUntil) : null,
      timeLimit: data.timeLimit ?? null,
      attemptLimit: data.attemptLimit ?? null,
      published: data.published ?? false,
      mostRecent: true,
    })

    return response.created(offering)
  }
}
