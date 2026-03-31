import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import ExerciseVersion from './exercise_version.js'
import Submission from './submission.js'

export default class Attempt extends BaseModel {
  static table = 'attempts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare exerciseVersionId: number

  @column()
  declare submitNum: number

  @column()
  declare score: number

  @column()
  declare experienceEarned: number | null

  @column()
  declare workoutScoreId: number | null

  @column()
  declare activeScoreId: number | null

  @column()
  declare feedbackReady: boolean | null

  @column()
  declare timeTaken: number | null

  @column()
  declare feedbackTimeout: number | null

  @column()
  declare workerTime: number | null

  @column.dateTime()
  declare submitTime: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ExerciseVersion)
  declare exerciseVersion: BelongsTo<typeof ExerciseVersion>

  @belongsTo(() => Submission, { foreignKey: 'workoutScoreId' })
  declare workoutScore: BelongsTo<typeof Submission>

  @belongsTo(() => Submission, { foreignKey: 'activeScoreId' })
  declare activeScore: BelongsTo<typeof Submission>
}
