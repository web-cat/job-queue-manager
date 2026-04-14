// PURPOSE: Handles student code submission intake. Creates submission records,
// triggers job queue integration, and returns grading results.

// DESIGN: The store() method is the critical path — it creates a submission_result
// stub (required by FK), creates the submission record with filePath, uploads
// the zip to MinIO, creates a local enqueued_job record, and then calls
// job_queue_service to POST the job to the other team's API (currently stubbed).
// The webhook() method receives result callbacks from the other team when
// grading completes.
//
// OPERATION ORDER in store():
//   1. Validate file presence and type
//   2. Create submission_result stub (FK required by submission)
//   3. Build objectKey from submission metadata
//   4. Create submission record with filePath set to objectKey
//   5. Upload file to MinIO
//   6. On upload failure: delete submission + submissionResult, return 500
//   7. Create enqueued_job record
//   8. Return created records
//
// DEPENDENCIES: submission.ts, submission_result.ts, job_queue_service.ts,
//   object_storage_service.ts

// CONSUMERS: routes.ts, frontend submission form

// NEXT TEAM NOTES:
// 1. Uncomment job_queue_service.enqueue() once other team confirms endpoint
// 2. Implement webhook() to process result callbacks and update submission_result
//    with actual scores from the grading system
// 3. The result() method returns submission.score — this is a column on the
//    submission table itself (not submission_result). Confirm with other team
//    whether they write scores to submission.score or submission_result.correctness_score
//    and update accordingly.
// 4. file_path on submission stores the MinIO object key, not a local path.
//    Format: submissions/{submissionId}/input/{originalFilename}

// STATUS: complete [job queue enqueue and webhook handling pending other team API]

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
  })
)

// ── Controller ───────────────────────────────────────────────────────

export default class SubmissionsController {
  private jobQueueService = new JobQueueService()

  /**
   * GET /api/submissions
   * List submissions for the authenticated user, paginated.
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
   * Get a single submission with its enqueued job and assignment info.
   * Only returns submissions belonging to the authenticated user.
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
   * Create a new submission and upload the zip file to MinIO.
   *
   * Expects multipart form data:
   *   workoutId             (number, required) — assignment ID
   *   assignmentOfferingId  (number, optional) — specific offering ID
   *   isSubmissionForGrading (boolean, optional, default true)
   *   submission_zip        (file, required) — zip archive, max 100mb
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createSubmissionValidator)

    // ── Step 1: Validate uploaded file ───────────────────────────
    const submissionArchive = request.file('submission_zip', {
      size: '100mb',
      extnames: ['zip'],
    })

    if (!submissionArchive) {
      return response.badRequest({ message: 'submission_zip is required' })
    }

    if (!submissionArchive.isValid) {
      return response.badRequest({
        message: 'Invalid submission zip',
        errors: submissionArchive.errors,
      })
    }

    if (!submissionArchive.tmpPath) {
      return response.internalServerError({
        message: 'Uploaded file was not written to temp storage',
      })
    }

    // ── Step 2: Create submission_result stub (FK required) ───────
    const submissionResult = await SubmissionResult.create({
      correctnessScore: 0,
    })

    // ── Step 3: Create submission record ─────────────────────────
    // filePath is set to a predictable key format — will be updated
    // to the final objectKey after we know the submission ID
    const submission = await Submission.create({
      userId: user.id,
      workoutId: data.workoutId,
      assignmentOfferingId: data.assignmentOfferingId ?? null,
      submissionResultId: submissionResult.id,
      isSubmissionForGrading: data.isSubmissionForGrading ?? true,
      feedbackReady: false,
      partnerLink: false,
      submitTime: DateTime.now(),
      filePath: null, // set after upload below
    })

    // ── Step 4: Build object key and upload to MinIO ──────────────
    const objectKey = `submissions/${submission.id}/input/${submissionArchive.clientName}`

    try {
      await uploadFileToObjectStorage(
        process.env.S3_BUCKET!,
        objectKey,
        submissionArchive.tmpPath,
        submissionArchive.type || 'application/zip'
      )
    } catch (error) {
      // Clean up DB records if upload fails
      await submission.delete()
      await submissionResult.delete()

      return response.internalServerError({
        message: 'Failed to upload submission archive',
        error: error instanceof Error ? error.message : 'Unknown upload error',
      })
    }

    // ── Step 5: Update submission with final file path ────────────
    await submission.merge({ filePath: objectKey }).save()

    // ── Step 6: Create local enqueued_job record ──────────────────
    const enqueuedJob = await this.jobQueueService.createLocalRecord(submission)

    // ── Step 7: Enqueue with other team (stubbed) ─────────────────
    // TODO: Uncomment once other team confirms their endpoint URL and payload format
    // const { externalJobId, success } = await this.jobQueueService.enqueue(submission)
    // if (!success) {
    //   return response.serviceUnavailable({ message: 'Job queue unavailable' })
    // }

    return response.created({
      submission,
      enqueuedJob,
      archivePath: objectKey,
    })
  }

  /**
   * GET /api/submissions/:id/result
   * Get the grading result for a submission.
   * Returns { ready: false } while grading is in progress.
   *
   * NOTE: score is read from submission.score — confirm with other team
   * whether they write to this column or to submission_result.correctness_score.
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

    return response.ok({
      ready: true,
      submissionId: submission.id,
      score: submission.score,
    })
  }

  /**
   * PUT/PATCH /api/submissions/:id
   * Update a submission (stub — not currently used by frontend).
   */
  async update({ params, request, response }: HttpContext) {
    const submission = await Submission.findOrFail(params.id)
    const data = request.only(['feedbackReady', 'score'])
    await submission.merge(data).save()
    return response.ok(submission)
  }

  /**
   * DELETE /api/submissions/:id
   * Delete a submission (stub — not currently used by frontend).
   */
  async destroy({ params, response }: HttpContext) {
    const submission = await Submission.findOrFail(params.id)
    await submission.delete()
    return response.noContent()
  }

  /**
   * POST /api/submissions/webhook
   * Receives result callbacks from the other team when grading completes.
   * Public route — no auth token required.
   *
   * TODO: Implement once other team confirms webhook payload format.
   * Expected payload (unconfirmed):
   *   { submissionId, score, feedbackReady, testResults: [...] }
   * On receipt: update submission.score, submission.feedbackReady = true,
   *   update submission_result.correctnessScore with actual score.
   *
   * SECURITY: Should be IP restricted to other team's cluster IPs in production.
   */
  async webhook({ request, response }: HttpContext) {
    const payload = request.body()
    await this.jobQueueService.handleWebhook(payload)
    return response.ok({ received: true })
  }
}
