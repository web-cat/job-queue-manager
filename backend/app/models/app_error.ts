import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AppError extends BaseModel {
  static table = 'error'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare usableType: string | null

  @column()
  declare usableId: number | null

  @column()
  declare className: string | null

  @column()
  declare message: string | null

  @column()
  declare trace: string | null

  @column()
  declare targetUrl: string | null

  @column()
  declare refererUrl: string | null

  @column()
  declare params: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
