// PURPOSE: Stores human-readable URL slugs for courses and other resources.
// Maps /courses/cs3214-fall-2024 to the correct database record.

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class FriendlyIdSlug extends BaseModel {
  static table = 'friendly_id_slugs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare sluggableId: number

  @column()
  declare sluggableType: string | null

  @column()
  declare scope: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
