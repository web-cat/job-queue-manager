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
    priority: number = 0
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
      discarded: false,
      suspended: false,
      queueTime: DateTime.now(),
    })
  }
}
