import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Job from './job.js'

export type JobEvent =
  | 'queued'
  | 'claimed'
  | 'completed'
  | 'failed'
  | 'retried'
  | 'suspended'
  | 'discarded'

export default class JobLog extends BaseModel {
  static table = 'job_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare jobId: number

  @column()
  declare event: JobEvent

  @column()
  declare message: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // ── Relationships ────────────────────────────────────────────────

  @belongsTo(() => Job)
  declare job: BelongsTo<typeof Job>
}
