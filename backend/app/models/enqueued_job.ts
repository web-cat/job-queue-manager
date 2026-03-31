import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Submission from './submission.js'

export default class EnqueuedJob extends BaseModel {
  static table = 'enqueued_job'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare submissionId: number

  @column()
  declare podName: string | null

  @column()
  declare priority: number | null

  @column()
  declare containerImage: string | null

  @column()
  declare envVars: Record<string, unknown> | null

  @column()
  declare status: string

  @column()
  declare retryCount: number

  @column()
  declare result: Record<string, unknown> | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare queueTime: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  @belongsTo(() => Submission)
  declare submission: BelongsTo<typeof Submission>
}
