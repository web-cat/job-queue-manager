import Submission from '#models/submission'
import JobQueueService from '#services/job_queue_service'
import SubmissionService from '#services/submission_service'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import { downloadFileFromObjectStorage } from '#services/object_storage_service'
import env from '#start/env'

@inject()
export default class JobRecoveryTask {
  constructor(
    private jobQueueService: JobQueueService,
    private submissionService: SubmissionService
  ) {}

  async run() {
    // Find all jobs that have been pending for more than 10 minutes
    const tenMinutesAgo = DateTime.now().minus({ minutes: 10 }).toSQL()

    const stuckSubmissions = await Submission.query()
      .whereIn('status', ['pending', 'uploading'])
      .whereNotNull('external_job_id')
      .where('created_at', '<', tenMinutesAgo)

    for (const submission of stuckSubmissions) {
      if (!submission.externalJobId) {
        logger.warn(
          `[Recovery] Skipping submission ${submission.id} because it has no external job ID`
        )
        continue
      }

      // Call the GET endpoint to see what the other team says
      const payload = await this.jobQueueService.checkStatus(submission.externalJobId)

      if (payload && payload.data.status === 'completed') {
        // If it's done, feed it directly into our webhook handler
        logger.info(`[Recovery] Recovered lost grade for submission ${submission.id}`)
        await this.submissionService.handleWebhook(payload)
      }
    }

    const fortyEightHoursAgo = DateTime.now().minus({ hours: 48 }).toSQL()

    // Terminate jobs that failed to queue for more than 48 hours
    const failedHopelessSubmissions = await Submission.query()
      .where('status', 'pending_queue')
      .where('created_at', '<', fortyEightHoursAgo)

    for (const submission of failedHopelessSubmissions) {
      logger.warn(
        `[Recovery] Submission ${submission.id} failed to queue after 48 hours. Marking as failed.`
      )
      await submission.merge({ status: 'failed' }).save()
    }

    // Retry submissions that failed to queue (only within the last 48 hours to avoid infinite loops)
    const queuedSubmissions = await Submission.query()
      .where('status', 'pending_queue')
      .where('created_at', '>=', fortyEightHoursAgo)
      .preload('assignmentOffering', (q) => q.preload('assignment'))

    for (const submission of queuedSubmissions) {
      logger.info(`[Recovery] Retrying enqueue for submission ${submission.id}`)

      if (!submission.filePath) {
        logger.error(`[Recovery] Submission ${submission.id} has no file path to retry`)
        continue
      }

      await submission.load('assignmentOffering', (q) => q.preload('assignment'))
      // if no offering, we fall back to finding assignment directly
      const assignment =
        submission.assignmentOffering?.assignment ??
        (await import('#models/assignment').then((m) => m.default.findOrFail(submission.workoutId)))

      const imageTag = assignment.dockerImageTag || 'vt-cs/default-grader:latest'
      const timeoutSeconds = submission.assignmentOffering?.timeLimit ?? 120

      try {
        const fileBuffer = await downloadFileFromObjectStorage(
          env.get('S3_BUCKET')!,
          submission.filePath
        )

        const { success, jobId } = await this.jobQueueService.enqueue(
          submission.id,
          fileBuffer,
          imageTag,
          timeoutSeconds,
          2
        )

        if (success) {
          await submission.merge({ status: 'pending', externalJobId: jobId }).save()
          logger.info(`[Recovery] Successfully queued submission ${submission.id}`)
        } else {
          logger.warn(`[Recovery] Still unable to queue submission ${submission.id}`)
        }
      } catch (error) {
        logger.error(
          { err: error },
          `[Recovery] Error retrying enqueue for submission ${submission.id}`
        )
      }
    }
  }
}
