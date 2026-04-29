import type { HttpContext } from '@adonisjs/core/http'
import JobQueueService from '#services/job_queue_service'

export default class ExecutionServiceController {
  private service = new JobQueueService()

  /**
   * GET /api/administration/execution/queue/status
   */
  async queueStatus({ response }: HttpContext) {
    const data = await this.service.getQueueStatus()
    if (!data)
      return response
        .status(503)
        .send({ error: { code: 'service_unavailable', message: 'Unable to fetch queue status' } })
    return response.ok(data)
  }

  /**
   * GET /api/administration/execution/queue/position/:jobId
   */
  async queuePosition({ params, response }: HttpContext) {
    const jobId = Number(params.jobId)
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return response
        .status(400)
        .send({ error: { code: 'invalid_job_id', message: 'jobId must be a positive integer' } })
    }

    const data = await this.service.getQueuePosition(jobId)
    if (!data)
      return response
        .status(404)
        .send({ error: { code: 'not_found', message: 'Job not found in remote queue' } })
    return response.ok(data)
  }

  /**
   * GET /api/administration/execution/workers
   */
  async workers({ response }: HttpContext) {
    const data = await this.service.listWorkers()
    if (!data)
      return response
        .status(503)
        .send({ error: { code: 'service_unavailable', message: 'Unable to fetch worker list' } })
    return response.ok(data)
  }
}
