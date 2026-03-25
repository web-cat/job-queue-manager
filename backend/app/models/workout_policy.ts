import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class WorkoutPolicy extends BaseModel {
  static table = 'workout_policies'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column()
  declare hideThumbnailsBeforeStart: boolean | null

  @column()
  declare hideFeedbackBeforeFinish: boolean | null

  @column()
  declare hideCompilationFeedbackBeforeFinish: boolean | null

  @column()
  declare noReviewBeforeClose: boolean | null

  @column()
  declare hideFeedbackInReviewBeforeClose: boolean | null

  @column()
  declare hideThumbnailsInReviewBeforeClose: boolean | null

  @column()
  declare noHints: boolean | null

  @column()
  declare noFaq: boolean | null

  @column()
  declare invisibleBeforeReview: boolean | null

  @column()
  declare hideScoreBeforeFinish: boolean | null

  @column()
  declare hideScoreInReviewBeforeClose: boolean | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
