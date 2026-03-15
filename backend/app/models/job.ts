import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Worker from './worker.js'
import JobLog from './job_log.js'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'discarded' | 'suspended'

export default class Job extends BaseModel {
  static table = 'jobs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare status: JobStatus

  @column()
  declare priority: number

  @column()
  declare suspended: boolean

  @column()
  declare metadata: Record<string, unknown> | null

  @column()
  declare workerId: number | null

  @column.dateTime()
  declare queueTime: DateTime | null

  @column.dateTime()
  declare startTime: DateTime | null

  @column.dateTime()
  declare endTime: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // ── Relationships ────────────────────────────────────────────────

  @belongsTo(() => Worker)
  declare worker: BelongsTo<typeof Worker>

  @hasMany(() => JobLog)
  declare logs: HasMany<typeof JobLog>
}
