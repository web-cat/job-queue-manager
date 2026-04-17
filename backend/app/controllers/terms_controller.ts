import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Term from '#models/term'
import { DateTime } from 'luxon'

const createTermValidator = vine.compile(
  vine.object({
    season: vine.number(),
    year: vine.number(),
    slug: vine.string().trim().minLength(1),
    startsOn: vine.string(), // ISO string from frontend
    endsOn: vine.string(),   // ISO string from frontend
  })
)

export default class TermsController {
  /**
   * GET /api/terms
   * List all terms
   */
  async index({ response }: HttpContext) {
    const terms = await Term.query().orderBy('starts_on', 'desc')
    return response.ok(terms)
  }

  /**
   * POST /api/terms
   * Create a new term
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createTermValidator)

    const term = await Term.create({
      season: payload.season,
      year: payload.year,
      slug: payload.slug,
      startsOn: DateTime.fromISO(payload.startsOn),
      endsOn: DateTime.fromISO(payload.endsOn),
    })

    return response.created(term)
  }
}
