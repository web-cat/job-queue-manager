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
  declare workerId: number | null

  @column()
  declare priority: number | null

  @column()
  declare discarded: boolean

  @column()
  declare suspended: boolean

  @column.dateTime()
  declare queueTime: DateTime | null

  @belongsTo(() => Submission)
  declare submission: BelongsTo<typeof Submission>
}
