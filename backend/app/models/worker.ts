import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Job from './job.js'

export type WorkerStatus = 'idle' | 'busy' | 'offline'

export default class Worker extends BaseModel {
  static table = 'workers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare podName: string

  @column()
  declare status: WorkerStatus

  @column.dateTime()
  declare lastHeartbeat: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // ── Relationships ────────────────────────────────────────────────

  @hasMany(() => Job)
  declare jobs: HasMany<typeof Job>
}
