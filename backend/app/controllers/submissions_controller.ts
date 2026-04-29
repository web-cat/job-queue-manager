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
//   3. Create submission record with filePath set to objectKey
//   4. Build objectKey from submission metadata and upload file to MinIO
//   5. Update submission with final file path
//   6. Enqueue with other team
//   7. Update submission status to pending
//
// DEPENDENCIES: submission.ts, submission_result.ts, job_queue_service.ts,
//   object_storage_service.ts

// CONSUMERS: routes.ts, frontend submission form

// NEXT TEAM NOTES:
// 1. Uncomment job_queue_service.enqueue() once other team confirms endpoint
// 2. Implement webhook() to process result callbacks and update submission_result
//    with actual scores from the grading system
// 3. The result() method now reads the nested submission_result row.
//    Keep the response shape aligned with frontend score displays.
// 4. file_path on submission stores the MinIO object key, not a local path.
//    Format: submissions/{submissionId}/input/{originalFilename}

// STATUS: complete [job queue enqueue and webhook handling pending other team API]

import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import router from '@adonisjs/core/services/router'
import vine from '@vinejs/vine'
import Submission from '#models/submission'
import SubmissionService from '#services/submission_service'
import SubmissionPolicy from '#policies/submission_policy'

// ── Validators ───────────────────────────────────────────────────────

const createSubmissionValidator = vine.compile(
  vine.object({
    workoutId: vine.number().positive(),
    assignmentOfferingId: vine.number().positive().optional(),
    isSubmissionForGrading: vine.boolean().optional(),
  })
)

const webhookPayloadValidator = vine.compile(
  vine.object({
    data: vine.object({
      submission_id: vine.number().positive(),
      status: vine.string(),
      submitted_at: vine.string().optional(),
      started_at: vine.string().optional(),
      completed_at: vine.string().optional(),
      retry_count: vine.number().optional(),
      result: vine.object({
        correctness_score: vine.number().optional(),
        tool_score: vine.number().optional(),
        comments: vine.string().optional(),
        comment_format: vine.number().optional(),
        commentFormat: vine.number().optional(),
        runtime_ms: vine.number().optional(),
        exit_code: vine.number().optional(),
        test_output: vine.string().optional(),
        has_payload: vine.boolean().optional(),
        payload_url: vine.string().optional(),
      }),
    }),
  })
)

// ── Controller ───────────────────────────────────────────────────────

@inject()
export default class SubmissionsController {
  constructor(private submissionService: SubmissionService) {}

  /**
   * GET /api/submissions
   * List submissions visible to the authenticated user, paginated.
   * Admins see all submissions, instructors see their courses' submissions,
   * students see only their own submissions.
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { page = 1, limit = 20, assignmentOfferingId, workoutId } = request.qs()

    // Query submissions scoped to the user — admins see all, everyone else sees only their own
    const query = Submission.query()
      .preload('assignmentOffering', (q) => q.preload('assignment'))
      .preload('submissionResult')
      .orderBy('created_at', 'desc')

    if (user.globalRoleId !== 1) {
      query.where('user_id', user.id)
    }

    if (assignmentOfferingId) {
      query.where('assignment_offering_id', assignmentOfferingId)
    }

    if (workoutId) {
      query.where('workout_id', workoutId)
    }

    const submissions = await query.paginate(page, limit)

    return response.ok(submissions)
  }

  /**
   * GET /api/submissions/:id
   * Get a single submission with its enqueued job and assignment info.
   */
  async show({ bouncer, params, response }: HttpContext) {
    const submission = await Submission.query()
      .where('id', params.id)
      .preload('assignmentOffering', (q) => q.preload('assignment'))
      .preload('submissionResult')
      .firstOrFail()

    await bouncer.with(SubmissionPolicy).authorize('view', submission)

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
  async store({ auth, bouncer, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createSubmissionValidator)

    await bouncer
      .with(SubmissionPolicy)
      .authorize('create', data.workoutId, data.assignmentOfferingId)

    // Validate uploaded file
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

    try {
      // Delegate all business logic to the service
      const { submission, archivePath } = await this.submissionService.processSubmission(
        user.id,
        data,
        submissionArchive
      )

      return response.created({
        submission,
        archivePath,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to process submission',
        error: error instanceof Error ? error.message : 'Unknown upload error',
      })
    }
  }

  // GET /api/submissions/:id/result
  // Get the grading result for a submission.
  // Returns { ready: false } while grading is in progress.
  // Grading details are read from submission_result.
  async result({ bouncer, params, response }: HttpContext) {
    const submission = await Submission.query()
      .where('id', params.id)
      .preload('submissionResult')
      .firstOrFail()

    await bouncer.with(SubmissionPolicy).authorize('view', submission)

    if (!submission.feedbackReady) {
      return response.ok({ ready: false, message: 'Grading is still in progress' })
    }

    return response.ok({
      ready: true,
      submissionId: submission.id,
      submissionResult: submission.submissionResult,
    })
  }

  /**
   * PUT/PATCH /api/submissions/:id
   * Update a submission
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(SubmissionPolicy).authorize('update')
    const submission = await Submission.findOrFail(params.id)
    const data = request.only(['feedbackReady'])
    await submission.merge(data).save()
    return response.ok(submission)
  }

  /**
   * DELETE /api/submissions/:id
   * Delete a submission
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(SubmissionPolicy).authorize('delete')
    const submission = await Submission.findOrFail(params.id)
    await submission.delete()
    return response.noContent()
  }

  /**
   * POST /api/v1/submissions/webhook
   * Receives result callbacks from the other team when grading completes.
   * Protected route — HMAC authentication required.
   */
  async webhook({ request, response }: HttpContext) {
    const payload = await request.validateUsing(webhookPayloadValidator)
    await this.submissionService.handleWebhook(payload)
    return response.ok({ received: true })
  }

  /**
   * GET /api/submissions/:id/download-url
   * Generates a signed, short-lived URL for downloading the submission.
   */
  async downloadUrl({ bouncer, params, response }: HttpContext) {
    const submission = await Submission.query().where('id', params.id).firstOrFail()

    await bouncer.with(SubmissionPolicy).authorize('view', submission)

    if (!submission.filePath) {
      return response.notFound({ message: 'No file associated with this submission' })
    }

    const url = router
      .builder()
      .params({ id: submission.id })
      .makeSigned('submissions.download', { expiresIn: '5m' })

    return response.ok({ url })
  }

  /**
   * GET /api/submissions/:id/download
   * Supports two access modes:
   * 1) Signed URL access (public, short-lived)
   * 2) Authenticated access (api/hmac guard + bouncer policy)
   */
  async download({ auth, bouncer, request, params, response }: HttpContext) {
    const submissionId = Number(params.id)
    let authorized = request.hasValidSignature()

    if (!authorized) {
      try {
        await auth.authenticateUsing(['api'])
        const submission = await Submission.query().where('id', submissionId).firstOrFail()
        await bouncer.with(SubmissionPolicy).authorize('view', submission)
        authorized = true
      } catch {
        return response.unauthorized({ message: 'Invalid/expired link or unauthorized request' })
      }
    }

    if (!authorized) {
      return response.unauthorized({ message: 'Invalid/expired link or unauthorized request' })
    }

    try {
      const { fileBuffer, filename } =
        await this.submissionService.getSubmissionDownload(submissionId)

      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Type', 'application/zip')

      return response.send(fileBuffer)
    } catch (error) {
      if (error instanceof Error && error.message === 'No file associated with this submission') {
        return response.notFound({ message: error.message })
      }

      return response.internalServerError({ message: 'Failed to download file' })
    }
  }
}
