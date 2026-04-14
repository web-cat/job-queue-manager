// PURPOSE: Handles student code submission intake. Creates submission records,
// triggers job queue integration, and returns grading results.

// DESIGN: The store() method is the critical path — it creates a submission_result
// stub (required by FK), creates the submission record, creates a local
// enqueued_job record, and then calls job_queue_service to POST the job to the
// other team's API (currently stubbed). The webhook() method receives result
// callbacks from the other team when grading completes.

// DEPENDENCIES: submission.ts, submission_result.ts, job_queue_service.ts

// CONSUMERS: routes.ts, frontend submission form

// NEXT TEAM NOTES: [NEEDS INLINE DOCS] — Three critical TODOs in this file:

// 1. File upload handling (zip submission storage)
// 2. Uncomment job_queue_service.enqueue() call once other team confirms endpoint
// 3. Implement webhook() to process result callbacks and update submission_result
//    STATUS: stub [NEEDS INLINE DOCS — all three TODOs are blocking for production]

import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Submission from '#models/submission'
import SubmissionResult from '#models/submission_result'
import JobQueueService from '#services/job_queue_service'
import { uploadFileToObjectStorage } from '#services/object_storage_service'

// ── Validators ───────────────────────────────────────────────────────

const createSubmissionValidator = vine.compile(
  vine.object({
    workoutId: vine.number().positive(),
    assignmentOfferingId: vine.number().positive().optional(),
    isSubmissionForGrading: vine.boolean().optional(),
    // TODO: Add file field once storage strategy is confirmed
  })
)

// ── Controller ───────────────────────────────────────────────────────

export default class SubmissionsController {
  private jobQueueService = new JobQueueService()

  /**
   * GET /api/submissions
   * List submissions for the authenticated user
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { page = 1, limit = 20, assignmentOfferingId } = request.qs()

    const query = Submission.query()
      .where('user_id', user.id)
      .preload('assignmentOffering', (q) => q.preload('assignment'))
      .orderBy('created_at', 'desc')

    if (assignmentOfferingId) {
      query.where('assignment_offering_id', assignmentOfferingId)
    }

    const submissions = await query.paginate(page, limit)

    return response.ok(submissions)
  }

  /**
   * GET /api/submissions/:id
   * Get a single submission with its enqueued job
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const submission = await Submission.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('assignmentOffering', (q) => q.preload('assignment'))
      .preload('enqueuedJob')
      .firstOrFail()

    return response.ok(submission)
  }

  /**
   * POST /api/submissions
   * Create a new submission and send it to the job queue
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createSubmissionValidator)

    const submissionArchive = request.file('submission_zip', {
      size: '100mb',
      extnames: ['zip'],
    })
    
    if (!submissionArchive) {
      return response.badRequest({
        message: 'submission_zip is required',
      })
    }

    if (!submissionArchive.isValid) {
      return response.badRequest({
        message: 'Invalid submission zip',
        errors: submissionArchive.errors,
      })
    }
    


    // Create a stub submission_result (required by FK constraint)
    const submissionResult = await SubmissionResult.create({
      correctnessScore: 0,
    })

    // Create the submission record
    const submission = await Submission.create({
      userId: user.id,
      workoutId: data.workoutId,
      assignmentOfferingId: data.assignmentOfferingId ?? null,
      submissionResultId: submissionResult.correctnessScore,
      isSubmissionForGrading: data.isSubmissionForGrading ?? true,
      feedbackReady: false,
      partnerLink: false,
      submitTime: DateTime.now(),
    })

    const objectKey = `submissions/${submission.id}/input/${submissionArchive.clientName}`

    try {
    if (!submissionArchive.tmpPath) {
      return response.internalServerError({
        message: 'Uploaded file was not written to temp storage',
      })
    }

    await uploadFileToObjectStorage(
      process.env.S3_BUCKET!,
      objectKey,
      submissionArchive.tmpPath,
      submissionArchive.type || 'application/zip'
    )
    } catch (error) {
      await submission.delete()
      await submissionResult.delete()

      return response.internalServerError({
        message: 'Failed to upload submission archive',
        error: error instanceof Error ? error.message : 'Unknown upload error',
      })
    }
    // Create local enqueued_job record
    const enqueuedJob = await this.jobQueueService.createLocalRecord(submission)

    // TODO: Uncomment once other team confirms their endpoint
    // const { externalJobId, success } = await this.jobQueueService.enqueue(submission)
    // if (!success) {
    //   return response.serviceUnavailable({ message: 'Job queue unavailable' })
    // }

    return response.created({ submission, enqueuedJob, archivePath: objectKey })
  }

  /**
   * GET /api/submissions/:id/result
   * Get the grading result for a submission
   */
  async result({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const submission = await Submission.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    if (!submission.feedbackReady) {
      return response.ok({ ready: false, message: 'Grading is still in progress' })
    }

    // TODO: Load full submission_result once other team confirms result format
    return response.ok({
      ready: true,
      submissionId: submission.id,
      score: submission.score,
    })
  }

  /**
   * POST /api/submissions/webhook
   * Receives result callbacks from the other team.
   * Public — no auth but should be IP restricted in production.
   *
   * TODO: Implement once other team confirms webhook payload format
   */
  async webhook({ request, response }: HttpContext) {
    const payload = request.body()
    await this.jobQueueService.handleWebhook(payload)
    return response.ok({ received: true })
  }
}
