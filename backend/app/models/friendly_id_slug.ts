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
