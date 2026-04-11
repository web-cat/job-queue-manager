// PURPOSE: Represents a job in the queue waiting to be executed by the other
// team's Kubernetes workers. Created by your system, managed by theirs.

// DESIGN: Intentionally minimal — only contains fields confirmed from the legacy
// schema. The workerId references the other team's worker pod registry.
// priority is a smallint (0-32767) — higher values = higher priority.
// discarded and suspended are boolean flags for job lifecycle management.

// DEPENDENCIES: submission.ts

// CONSUMERS: job_queue_service.ts (creates records), other team's K8s backend

// NEXT TEAM NOTES: This model will need new columns added once the other team
// confirms their requirements (worker_tag, status, result). Add these via a
// new migration — do not modify the existing migration file.

// STATUS: stub [NEEDS INLINE DOCS — coordination with other team required]

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
