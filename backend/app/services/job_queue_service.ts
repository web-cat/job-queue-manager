// PURPOSE: The integration boundary between this system and the other team's
// Kubernetes job execution backend. All communication with their REST API
// goes through this service — no other file should make direct HTTP calls
// to their system.

// DESIGN: Deliberately isolated as a service (not a controller) so it can be
// called from submissions_controller without coupling the HTTP layer to the
// integration layer. All methods that require the other team's API are stubbed
// with detailed TODO comments explaining exactly what needs to be implemented.
// createLocalRecord() is the only fully implemented method — it creates the
// enqueued_job record on your side regardless of the other team's API status.

// DEPENDENCIES: enqueued_job.ts, submission.ts

// CONSUMERS: submissions_controller.ts

// NEXT TEAM NOTES: THIS IS THE PRIMARY FILE TO WORK ON ONCE THE OTHER TEAM
// CONFIRMS THEIR API CONTRACT. The four questions to answer:

// 1. Their API base URL → JOB_QUEUE_API_URL env var
// 2. Their API auth mechanism → JOB_QUEUE_API_KEY env var
// 3. Their job payload format → enqueue() method body
// 4. How results come back → handleWebhook() or checkStatus() depending
//    Once answered, fill in the TODO stubs. The interface is designed so that
//    no other files need to change when this is implemented.
//    STATUS: stub [CRITICAL — must be implemented before production deployment]

import EnqueuedJob from '#models/enqueued_job'
import Submission from '#models/submission'
import SubmissionResult from '#models/submission_result'
import env from '#start/env'
import { DateTime } from 'luxon'

/**
 * JobQueueService
 *
 * Handles all communication with the other team's REST API.
 * This is the integration boundary between your system and theirs.
 *
 * TODO: Confirm with other team:
 *   1. What is their API base URL?
 *   2. What fields do they need in the job payload?
 *   3. What do they return when a job is accepted?
 *   4. How do results come back — webhook, polling, or shared DB?
 */
export default class JobQueueService {
  private baseUrl = env.get('JOB_QUEUE_API_URL')

  /**
   * Submit a job to the other team's REST API.
   * Called after a submission is created.
   */
  async enqueue(
    submissionId: number,
    storageUri: string,
    imageTag: string,
    timeoutSeconds: number = 120,
    priority: number = 2
  ): Promise<{ success: boolean }> {
    const payload = {
      submission_id: submissionId,
      job_priority: priority,
      storage_uri: storageUri,
      environment: {
        image_tag: imageTag,
        timeout_seconds: timeoutSeconds,
      },
      callback_url: `${env.get('INTERNAL_APP_URL')}/api/submissions/webhook`,
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.error(`[JobQueueService] API rejected job. Status: ${response.status}`)
        return { success: false }
      }

      console.warn(
        `[JobQueueService] enqueue() is a stub — submission ${submissionId} not actually sent`
      )

      return { success: true }
    } catch (error) {
      console.error(`[JobQueueService] Failed to reach execution API:`, error)
      return { success: false }
    }
  }

  /**
   * Check the status of a job.
   * Used if results come back via polling rather than webhook.
   */
  async checkStatus(submissionId: number): Promise<any | null> {
    console.warn(`[JobQueueService] checkStatus() is a stub — job ${submissionId} not checked`)
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/jobs/${submissionId}/results`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      return null
    }
  }

  /**
   * Handle a webhook callback from the other team when a job completes.
   * Called from a dedicated webhook endpoint in routes.ts.
   */
  async handleWebhook(payload: any): Promise<void> {
    // Extract the nested data object based on their specific contract
    const jobData = payload.data
    if (!jobData || !jobData.submission_id) {
      console.error('[JobQueueService] Invalid webhook payload received:', payload)
      return
    }

    const {
      submission_id,
      status, // e.g., "completed"
      started_at,
      completed_at,
      result,
    } = jobData

    // Update the parent Submission record
    const submission = await Submission.findOrFail(submission_id)

    // Map their lowercase status to the system's uppercase format
    await submission
      .merge({
        status: status.toUpperCase(),
      })
      .save()

    // Defensively handle the raw text logs
    let safeOutput = null
    if (result && result.test_output) {
      // TRUNCATE to 10,000 characters to prevent database crashes from infinite loops
      safeOutput =
        result.test_output.length > 10000
          ? result.test_output.substring(0, 10000) + '\n...[TRUNCATED BY SYSTEM]'
          : result.test_output
    }

    // Update the SubmissionResult telemetry and grade
    const submissionResult = await SubmissionResult.findByOrFail(
      'submission_result_id',
      submission.submissionResultId
    )

    await submissionResult
      .merge({
        correctnessScore: result?.correctness_score ?? 0,
        toolScore: result?.tool_score ?? 0,
        comments: result?.comments ?? null,
        testOutput: safeOutput, // Save the truncated text locally since they aren't using URIs
        startedAt: started_at ? DateTime.fromISO(started_at) : null,
        completedAt: completed_at ? DateTime.fromISO(completed_at) : null,
      })
      .save()

    console.warn('[JobQueueService] handleWebhook() is a stub — payload not processed', payload)
  }

  /**
   * Store a local enqueued_job record for tracking.
   * The other team manages this table but we create the initial record.
   */
  async createLocalRecord(submission: Submission, priority: number = 0): Promise<EnqueuedJob> {
    return EnqueuedJob.create({
      submissionId: submission.id,
      priority,
      status: 'pending',
      retryCount: 0,
      queueTime: DateTime.now(),
    })
  }
}
