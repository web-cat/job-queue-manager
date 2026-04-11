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
  // TODO: Add to .env once confirmed
  // private baseUrl = env.get('JOB_QUEUE_API_URL')
  // private apiKey = env.get('JOB_QUEUE_API_KEY')

  /**
   * Submit a job to the other team's REST API.
   * Called after a submission is created.
   */
  async enqueue(
    submission: Submission,
    _priority: number = 0
  ): Promise<{ externalJobId: string | null; success: boolean }> {
    // TODO: Replace this stub with actual API call once other team confirms endpoint
    //
    // const response = await fetch(`${this.baseUrl}/jobs`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.apiKey}`,
    //   },
    //   body: JSON.stringify({
    //     submissionId: submission.id,
    //     priority,
    //     workerTag: 'python3',   // TODO: derive from assignment/exercise type
    //     // filePath: submission.filePath,  // TODO: once file storage is decided
    //   }),
    // })
    //
    // const data = await response.json()
    // return { externalJobId: data.jobId, success: response.ok }

    console.warn(
      `[JobQueueService] enqueue() is a stub — submission ${submission.id} not actually sent`
    )
    return { externalJobId: null, success: false }
  }

  /**
   * Check the status of a job from the other team's API.
   * Used if results come back via polling rather than webhook.
   *
   * TODO: Implement once other team confirms their status endpoint
   */
  async checkStatus(externalJobId: string): Promise<{ status: string; result: unknown } | null> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${this.baseUrl}/jobs/${externalJobId}`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` },
    // })
    // return response.json()

    console.warn(`[JobQueueService] checkStatus() is a stub — job ${externalJobId} not checked`)
    return null
  }

  /**
   * Handle a webhook callback from the other team when a job completes.
   * Called from a dedicated webhook endpoint in routes.ts.
   *
   * TODO: Implement once other team confirms their webhook payload format
   */
  async handleWebhook(payload: Record<string, unknown>): Promise<void> {
    // TODO: Parse their webhook payload and update submission_result
    // const { submissionId, score, feedback, passed } = payload
    // await SubmissionResult.updateOrCreate(...)
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
