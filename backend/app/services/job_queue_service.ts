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
import logger from '@adonisjs/core/services/logger'

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
      return ''
    }

    return baseUrl
  }

  private getApiKey(): string {
    return `${env.get('JOB_QUEUE_API_KEY') || ''}`
  }

  private getRequestHeaders(): Record<string, string> {
    return {
      'X-API-KEY': this.getApiKey(),
    }
  }

  async listImages(): Promise<any[] | null> {
    if (!this.baseUrl) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/images`, {
        headers: this.getRequestHeaders(),
      })

      if (!response.ok) {
        return null
      }

      const responseData = (await response.json().catch(() => null)) as { data?: unknown } | null

      return Array.isArray(responseData?.data) ? responseData.data : null
    } catch (error) {
      logger.error('[JobQueueService] Failed to fetch image configs', error)
      return null
    }
  }

  async updateImageConfig(imageId: number, payload: Record<string, unknown>): Promise<any | null> {
    if (!this.baseUrl) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          ...this.getRequestHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        return null
      }

      const responseData = (await response.json().catch(() => null)) as { data?: unknown } | null

      return responseData?.data ?? null
    } catch (error) {
      logger.error(`[JobQueueService] Failed to update image config ${imageId}`, error)
      return null
    }
  }

  async syncRuntimeEstimateForImageTag(
    imageTag: string,
    estimatedRuntimeSeconds: number
  ): Promise<boolean> {
    const images = await this.listImages()

    if (!images) {
      return false
    }

    const image = images.find((entry) => entry?.docker_image_tag === imageTag)

    if (!image?.id) {
      logger.warn(`[JobQueueService] No image config found for tag ${imageTag}`)
      return false
    }

    const updatedImage = await this.updateImageConfig(image.id, {
      default_estimated_runtime: estimatedRuntimeSeconds,
      avg_runtime_seconds: estimatedRuntimeSeconds,
    })

    return !!updatedImage
  }
  /**
   * Submit a job to the other team's REST API.
   * Called after a submission is created.
   */
  async enqueue(
    submissionId: number,
    fileBuffer: Buffer,
    imageTag: string,
    priority: number = 2
  ): Promise<{ success: boolean; jobId?: number }> {
    const formData = new FormData()

    // Append the standard text fields
    formData.append('submission_id', submissionId.toString())
    formData.append('priority', priority.toString())
    formData.append('callback_url', `${env.get('FRONTEND_URL')}/api/v1/submissions/webhook`)
    formData.append('docker_image_tag', imageTag.toString())

    try {
      // Read the file into memory and append it as a Blob.
      // The execution-service API documents the multipart file field as `files`.
      const fileBlob = new Blob([fileBuffer], { type: 'application/zip' })
      formData.append('files', fileBlob, `submission_${submissionId}.zip`)

      // Send the heavy request to the other team
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        // Note: Do NOT set the 'Content-Type' header manually when using FormData.
        // fetch will automatically set it to 'multipart/form-data' with the correct boundary.
        body: formData,
        headers: {
          'X-API-KEY': `${env.get('JOB_QUEUE_API_KEY')}`,
        },
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(
          `[JobQueueService] API rejected job. Status: ${response.status}. Body: ${errorBody}`
        )
        return { success: false }
      }

      const responseData = (await response.json()) as { data?: { job_id?: unknown } }
      const jobId = responseData.data?.job_id

      if (typeof jobId !== 'number' || !Number.isInteger(jobId)) {
        logger.error(
          `[JobQueueService] API response missing valid job_id for submission ${submissionId}`
        )
        return { success: false }
      }

      logger.info(
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
    console.info(`[JobQueueService] Checking status for job ${jobId} via execution API`)
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      return null
    }
  }

  /**
   * Get overall queue status (pending/processing counts, active workers, etc.)
   */
  async getQueueStatus(): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/queue/status`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      logger.error('[JobQueueService] Failed to fetch queue status', error)
      return null
    }
  }

  /**
   * Get HRRN position and metadata for a job in the remote queue
   */
  async getQueuePosition(jobId: number): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/queue/position/${jobId}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      logger.error(`[JobQueueService] Failed to fetch queue position for job ${jobId}`, error)
      return null
    }
  }

  /**
   * List active worker nodes / agents in the execution cluster
   */
  async listWorkers(): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/workers`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      logger.error('[JobQueueService] Failed to fetch worker list', error)
      return null
    }
  }

  /**
   * Downloads the artifact payload from the execution cluster.
   */
  async downloadPayload(payloadUrl: string): Promise<Buffer | null> {
    try {
      // Fetch the zip file from their cluster
      // Note: payloadUrl is likely a relative path like "/jobs/142/payload"
      const response = await fetch(`${this.baseUrl}${payloadUrl}`)

      if (!response.ok) {
        console.error(`[JobQueueService] Failed to download payload: ${response.statusText}`)
        return null
      }

      // Read the raw binary data into a Node.js Buffer
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error(`[JobQueueService] Error downloading payload:`, error)
      return null
    }
  }
}
