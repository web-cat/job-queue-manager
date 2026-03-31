import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SubmissionResult extends BaseModel {
  static table = 'submission_result'

  // Note: primary key is correctness_score per the schema
  @column({ isPrimary: true })
  declare correctnessScore: number

  @column()
  declare toolScore: number | null

  @column()
  declare taScore: number | null

  @column()
  declare comments: string | null

  @column()
  declare commentFormat: number | null

  @column.dateTime()
  declare lastUpdated: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
