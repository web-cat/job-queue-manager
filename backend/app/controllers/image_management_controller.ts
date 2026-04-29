import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

/**
 * ImageManagementController
 *
 * Proxies image configuration requests to the execution service.
 * The execution service is the system of record for image configurations.
 * Each image tag has a singular configuration stored remotely.
 */
export default class ImageManagementController {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = this.getBaseUrl()
  }

  private getBaseUrl(): string {
    const baseUrl = env.get('JOB_QUEUE_API_URL')
    if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
      logger.warn('JOB_QUEUE_API_URL not configured for image management endpoints')
      return ''
    }
    return baseUrl
  }

  private async proxyRequest(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<{ ok: boolean; status: number; data: unknown; error?: unknown }> {
    if (!this.baseUrl) {
      return {
        ok: false,
        status: 503,
        data: null,
        error: {
          code: 'service_unavailable',
          message: 'Execution service not configured',
        },
      }
    }

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': env.get('JOB_QUEUE_API_KEY') || '',
        },
      }

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${this.baseUrl}${path}`, options)

      if (!response.ok) {
        let errorData: unknown
        try {
          errorData = await response.json()
        } catch {
          errorData = {}
        }
        const error = errorData as Record<string, unknown>
        return {
          ok: false,
          status: response.status,
          data: null,
          error: error.error || { code: 'remote_error', message: 'Execution service error' },
        }
      }

      let responseData: unknown
      try {
        responseData = await response.json()
      } catch {
        responseData = {}
      }
      const data = responseData as Record<string, unknown>
      return {
        ok: true,
        status: response.status,
        data: data.data || data,
      }
    } catch (error) {
      logger.error('[ImageManagementController] Failed to reach execution service:', error)
      return {
        ok: false,
        status: 503,
        data: null,
        error: {
          code: 'service_unavailable',
          message: 'Unable to reach execution service',
        },
      }
    }
  }

  /**
   * GET /api/administration/images
   * List all configured docker images from execution service
   */
  async index({ response }: HttpContext) {
    const result = await this.proxyRequest('GET', '/images')

    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }

    return response.ok({ data: result.data })
  }

  /**
   * GET /api/administration/images/{imageId}
   * Get a single image configuration from execution service
   */
  async show({ params, response }: HttpContext) {
    const result = await this.proxyRequest('GET', `/images/${params.imageId}`)

    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }

    return response.ok({ data: result.data })
  }

  /**
   * POST /api/administration/images
   * Register a new docker image configuration with execution service
   */
  async store({ request, response }: HttpContext) {
    const data = request.all()

    // Validate required fields
    if (!data.dockerImageTag || !data.displayName) {
      return response.status(400).send({
        error: {
          code: 'validation_error',
          message: 'dockerImageTag and displayName are required',
        },
      })
    }

    const result = await this.proxyRequest('POST', '/images', data)

    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }

    return response.created({ data: result.data })
  }

  /**
   * PUT /api/administration/images/{imageId}
   * Update an image configuration on execution service
   */
  async update({ params, request, response }: HttpContext) {
    const data = request.all()
    const result = await this.proxyRequest('PUT', `/images/${params.imageId}`, data)

    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }

    return response.ok({ data: result.data })
  }

  /**
   * DELETE /api/administration/images/{imageId}
   * Soft delete image configuration on execution service
   */
  async destroy({ params, response }: HttpContext) {
    const result = await this.proxyRequest('DELETE', `/images/${params.imageId}`)

    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }

    return response.ok({ data: result.data })
  }
}
