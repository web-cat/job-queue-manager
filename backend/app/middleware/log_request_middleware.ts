import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

export default class LogRequestMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const method = request.method()
    const url = request.url()

    logger.info(`--> [INCOMING] ${method} ${url}`)

    try {
      await next()
      logger.info(`<-- [COMPLETED] [${response.getStatus()}] ${method} ${url}`)
    } catch (error: any) {
      logger.error(`<-- [FAILED] [${error.status || 500}] ${method} ${url} - ${error.message}`)
      throw error
    }
  }
}
