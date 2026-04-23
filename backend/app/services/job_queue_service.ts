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

import env from '#start/env'

export interface ExternalJobPayload {
  data: {
    job_id: number
    submission_id: number
    status: string
    docker_image_tag: string
    priority: number
    submitted_at: string
    started_at: string | null
    completed_at: string | null
    result?: {
      correctness_score: number
      tool_score: number
      comments: string
      test_output: string
      exit_code: number
      runtime_ms: number
    }
  }
}

/**
 * JobQueueService
 *
 * Handles all communication with the other team's REST API.
 * This is the integration boundary between our system and theirs.
 *
 */
export default class JobQueueService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = this.getRequiredBaseUrl()
  }

  private getRequiredBaseUrl(): string {
    const baseUrl = env.get('JOB_QUEUE_API_URL')

    if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
      throw new Error(
        'Missing required JOB_QUEUE_API_URL configuration for JobQueueService'
      )
    }

    return baseUrl
  }
  /**
   * Submit a job to the other team's REST API.
   * Called after a submission is created.
   */
  async enqueue(
    submissionId: number,
    fileBuffer: Buffer,
    imageTag: string,
    timeoutSeconds: number = 120,
    priority: number = 2
  ): Promise<{ success: boolean; jobId?: number }> {
    const formData = new FormData()

    // Append the standard text fields
    formData.append('submission_id', submissionId.toString())
    formData.append('job_priority', priority.toString())
    formData.append('callback_url', `${env.get('INTERNAL_APP_URL')}/api/submissions/webhook`)
    formData.append('docker_image_tag', imageTag.toString())
    formData.append('timeout_seconds', timeoutSeconds.toString())

    try {
      // Read the file into memory and append it as a Blob
      const fileBlob = new Blob([fileBuffer], { type: 'application/zip' })
      formData.append('submission_zip', fileBlob, `submission_${submissionId}.zip`)

      // Send the heavy request to the other team
      const response = await fetch(`${this.baseUrl}/api/v1/jobs`, {
        method: 'POST',
        // Note: Do NOT set the 'Content-Type' header manually when using FormData.
        // fetch will automatically set it to 'multipart/form-data' with the correct boundary.
        body: formData,
      })

      const responseData = (await response.json()) as { data: { job_id: number } }
      const jobId = responseData.data.job_id

      if (!response.ok) {
        console.error(`[JobQueueService] API rejected job. Status: ${response.status}`)
        return { success: false }
      }

      console.info(
        `[JobQueueService] Submitted submission ${submissionId} to execution API as job ${jobId}`
      )

      return { success: true, jobId }
    } catch (error) {
      console.error(`[JobQueueService] Failed to reach execution API:`, error)
      return { success: false }
    }
  }

  /**
   * Check the status of a job.
   * Used if results come back via polling rather than webhook.
   */
  async checkStatus(jobId: number): Promise<any | null> {
    console.warn(`[JobQueueService] checkStatus() is a stub — job ${jobId} not checked`)
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      return null
    }
  }

  /**
   * Downloads the artifact payload from the execution cluster.
   */
  async downloadPayload(payloadUrl: string): Promise<Buffer | null> {
    try {
      // 1. Fetch the zip file from their cluster
      // Note: payloadUrl is likely a relative path like "/api/v1/jobs/142/payload"
      const response = await fetch(`${this.baseUrl}${payloadUrl}`)

      if (!response.ok) {
        console.error(`[JobQueueService] Failed to download payload: ${response.statusText}`)
        return null
      }

      // 2. Read the raw binary data into a Node.js Buffer
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error(`[JobQueueService] Error downloading payload:`, error)
      return null
    }
  }
}
