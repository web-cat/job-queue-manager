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
import JobQueueService from '#services/job_queue_service'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import CourseEnrollment from '#models/course_enrollment'
import AssignmentPolicy from '#policies/assignment_policy'
import db from '@adonisjs/lucid/services/db'

// ── Validators ───────────────────────────────────────────────────────

const createAssignmentValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    dockerImageTag: vine.string().optional(),
    estimatedRuntimeSeconds: vine.number().positive().optional(),
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
    estimatedRuntimeSeconds: vine.number().positive().optional(),
    description: vine.string().optional(),
    isPublic: vine.boolean().optional(),
    scrambled: vine.boolean().optional(),
    pointsMultiplier: vine.number().optional(),
    submissionPolicyId: vine.number().positive().optional(),
  })
)

const updateOfferingValidator = vine.compile(
  vine.object({
    availableFrom: vine.string().optional(),
    dueAt: vine.string().optional(),
    acceptUntil: vine.string().optional(),
    published: vine.boolean().optional(),
    timeLimit: vine.number().positive().optional(),
    attemptLimit: vine.number().positive().optional(),
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
  private readonly jobQueueService = new JobQueueService()

  private async syncRuntimeEstimate(assignment: Assignment) {
    if (!assignment.dockerImageTag || assignment.estimatedRuntimeSeconds === null) {
      return
    }

    const synced = await this.jobQueueService.syncRuntimeEstimateForImageTag(
      assignment.dockerImageTag,
      assignment.estimatedRuntimeSeconds
    )

    if (!synced) {
      logger.warn(
        `[AssignmentsController] Unable to sync runtime estimate for image ${assignment.dockerImageTag}`
      )
    }
  }

  /**
   * GET /api/assignments
   * List all public assignments or those owned by the user
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { page = 1, limit = 20, isPublic, sectionId } = request.qs()

    // Determine if the user can see unpublished offerings:
    // global admin (1), global instructor (2), OR course-level instructor in any section
    const hasCourseInstructorRole = !!(await CourseEnrollment.query()
      .where('user_id', user.id)
      .where('course_role_id', 1)
      .first())
    const isPrivileged = user.globalRoleId <= 2 || hasCourseInstructorRole

    const query = Assignment.query()
      .where((q) => {
        if (isPrivileged) {
          // Admins and instructors — show public OR enrolled, regardless of published
          q.where('is_public', true).orWhereHas('assignmentOfferings', (offeringQuery) => {
            offeringQuery.whereExists((subq) => {
              subq
                .select('id')
                .from('course_enrollment')
                .whereColumn(
                  'course_enrollment.course_offering_id',
                  'assignment_offering.course_offering_id'
                )
                .where('course_enrollment.user_id', user.id)
            })
          })
        } else {
          // Students — must have a published offering to see it
          q
            .where((sq) => {
              // Public assignments: only if at least one offering is published
              sq
                .where('is_public', true)
                .whereHas('assignmentOfferings', (oq) => oq.where('published', true))
            })
            .orWhereHas('assignmentOfferings', (offeringQuery) => {
              // Enrolled sections: only published offerings
              offeringQuery
                .where('published', true)
                .whereExists((subq) => {
                  subq
                    .select('id')
                    .from('course_enrollment')
                    .whereColumn(
                      'course_enrollment.course_offering_id',
                      'assignment_offering.course_offering_id'
                    )
                    .where('course_enrollment.user_id', user.id)
                })
            })
        }
      })
      .preload('submissionPolicy')
      .orderBy('created_at', 'desc')

    if (isPublic !== undefined) {
      query.where('is_public', isPublic === 'true')
    }

    if (sectionId) {
      query
        .whereHas('assignmentOfferings', (q) => {
          q.where('course_offering_id', sectionId)
          // Only privileged users (admins, global instructors, course instructors) see unpublished
          if (!isPrivileged) {
            q.where('published', true)
          }
        })
        .preload('assignmentOfferings', (q) => {
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
  async show({ bouncer, params, response }: HttpContext) {
    const assignment = await Assignment.query()
      .where('id', params.id)
      .preload('submissionPolicy')
      .preload('assignmentOfferings', (q) => {
        q.preload('section', (sq) => sq.preload('course'))
      })
      .firstOrFail()

    await bouncer.with(AssignmentPolicy).authorize('view', assignment)

    return response.ok(assignment)
  }

  /**
   * POST /api/assignments
   * Create a new assignment
   */
  async store({ auth, bouncer, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await bouncer.with(AssignmentPolicy).authorize('create')
    const data = await request.validateUsing(createAssignmentValidator)

    const assignment = await Assignment.create({
      ...data,
      estimatedRuntimeSeconds: data.estimatedRuntimeSeconds ?? 120,
      userId: user.id,
    })

    await this.syncRuntimeEstimate(assignment)

    return response.created(assignment)
  }

  /**
   * PATCH /api/assignments/:id
   * Update an assignment
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    const assignment = await Assignment.query().where('id', params.id).firstOrFail()

    await bouncer.with(AssignmentPolicy).authorize('update', assignment)

    const data = await request.validateUsing(updateAssignmentValidator)
    assignment.merge(data)
    await assignment.save()

    await this.syncRuntimeEstimate(assignment)

    return response.ok(assignment)
  }

  /**
   * DELETE /api/assignments/:id
   * Delete an assignment
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const assignment = await Assignment.query().where('id', params.id).firstOrFail()

    await bouncer.with(AssignmentPolicy).authorize('delete', assignment)

    await assignment.delete()

    return response.ok({ message: 'Assignment deleted successfully' })
  }

  /**
   * GET /api/assignments/:id/offerings
   * List all offerings for an assignment
   */
  async offerings({ bouncer, params, response }: HttpContext) {
    const assignment = await Assignment.findOrFail(params.id)
    await bouncer.with(AssignmentPolicy).authorize('view', assignment)

    const offerings = await AssignmentOffering.query()
      .where('assignment_id', assignment.id)
      .preload('section', (q) => q.preload('course').preload('term'))
      .orderBy('due_at', 'asc')

    return response.ok(offerings)
  }

  /**
   * PATCH /api/assignments/:id/offerings/:offeringId
   * Update an existing offering's dates, limits, and published state
   */
  async updateOffering({ bouncer, params, request, response }: HttpContext) {
    const assignment = await Assignment.findOrFail(params.id)
    await bouncer.with(AssignmentPolicy).authorize('update', assignment)

    const offering = await AssignmentOffering.query()
      .where('id', params.offeringId)
      .where('assignment_id', params.id)
      .firstOrFail()

    const data = await request.validateUsing(updateOfferingValidator)

    offering.merge({
      availableFrom: data.availableFrom ? DateTime.fromISO(data.availableFrom) : offering.availableFrom,
      dueAt: data.dueAt ? DateTime.fromISO(data.dueAt) : offering.dueAt,
      acceptUntil: data.acceptUntil ? DateTime.fromISO(data.acceptUntil) : offering.acceptUntil,
      published: data.published ?? offering.published,
      timeLimit: data.timeLimit ?? offering.timeLimit,
      attemptLimit: data.attemptLimit ?? offering.attemptLimit,
    })
    await offering.save()

    return response.ok(offering)
  }

  /**
   * POST /api/assignments/:id/offerings
   * Create a new offering for an assignment in a course section
   */
  async createOffering({ bouncer, params, request, response }: HttpContext) {
    const assignment = await Assignment.findOrFail(params.id)
    const data = await request.validateUsing(createOfferingValidator)

    await bouncer.with(AssignmentPolicy).authorize('createOffering', data.courseOfferingId)

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

  /**
   * GET /api/assignments/:id/wait-time
   * Returns estimated wait time based on exponential moving average
   * of recent execution times for this assignment.
   */
  async waitTime({ params, response }: HttpContext) {
    const assignmentId = params.id

    // Get last 20 completed submissions with runtime data
    const results = await db
      .from('submission_result as sr')
      .join('submission as s', 's.submission_result_id', 'sr.id')
      .where('s.workout_id', assignmentId)
      .where('s.status', 'completed')
      .whereNotNull('sr.runtime_ms')
      .orderBy('sr.completed_at', 'desc')
      .limit(20)
      .select('sr.runtime_ms')

    if (results.length === 0) {
      return response.ok({ estimatedWaitMs: null, sampleSize: 0 })
    }

    // Compute EMA — alpha=0.3 gives more weight to recent runs
    const alpha = 0.3
    let ema = results[results.length - 1].runtime_ms // start from oldest
    for (let i = results.length - 2; i >= 0; i--) {
      ema = alpha * results[i].runtime_ms + (1 - alpha) * ema
    }

    return response.ok({
      estimatedWaitMs: Math.round(ema),
      estimatedWaitSeconds: Math.round(ema / 1000),
      sampleSize: results.length,
    })
  }
}
