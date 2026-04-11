// PURPOSE: Stores the grading result for a submission. Written by the other
// team's Kubernetes workers after executing student code.

// DESIGN: Uses correctness_score as its primary key — this is unusual and is a
// legacy design preserved for FK compatibility. toolScore is the automated
// test score, taScore is a manual TA override, correctnessScore is the final
// combined score. commentFormat is a smallint enum for the format of the
// comments field (plain text, markdown, HTML).

// DEPENDENCIES: None (other tables reference this via correctness_score PK)

// CONSUMERS: submission.ts (FK on submission_result_id)

// NEXT TEAM NOTES: The primary key on correctness_score is a legacy quirk —
// do not attempt to change it as it would break all submission FKs. When the
// other team writes results back, they create/update records in this table.
// Confirm the exact write-back mechanism with them.

// STATUS: complete [NEEDS INLINE DOCS — unusual PK design explanation]

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
