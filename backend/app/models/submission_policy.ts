// PURPOSE: Rules for how an assignment can be submitted — attempt limits, late
// penalties, early bonuses, partner submission settings, time banks.
// Very complex legacy object with many configuration options.

// NEXT TEAM NOTES: Most fields have sensible defaults. The submisison_method
// field (note: intentional typo from legacy schema) is a smallint enum — 0
// is the standard method. Do not fix the typo — it matches the DB column name.
// STATUS: complete [NEEDS INLINE DOCS — submisison_method typo explanation]

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SubmissionPolicy extends BaseModel {
  static table = 'submission_policy'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare availablePoints: number | null

  @column()
  declare availableTimeDelta: number | null

  @column()
  declare awardEarlyBonus: boolean

  @column()
  declare deadTimeDelta: number | null

  @column()
  declare deductLatePenalty: boolean

  @column()
  declare earlyBonusMaxPts: number | null

  @column()
  declare earlyBonusUnitPts: number | null

  @column()
  declare earlyBonusUnitTime: number | null

  @column()
  declare latePenaltyMaxPts: number | null

  @column()
  declare latePenaltyUnitPts: number | null

  @column()
  declare latePenaltyUnitTime: number | null

  @column()
  declare maxFileUploadSize: number | null

  @column()
  declare maxSubmits: number | null

  @column()
  declare scoreFormat: string | null

  @column()
  declare taPoints: number | null

  @column()
  declare toolPoints: number | null

  @column()
  declare userId: number | null

  @column()
  declare includedFilePatterns: string | null

  @column()
  declare excludedFilePatterns: string | null

  @column()
  declare requiredFilePatterns: string | null

  @column()
  declare submisisonMethod: number

  @column()
  declare allowPartners: boolean

  @column()
  declare deductExcessSubmissionPenalty: boolean

  @column()
  declare excessSubmissionsMaxPts: number | null

  @column()
  declare excessSubmissionsThreshold: number | null

  @column()
  declare excessSubmissionsUnitPts: number | null

  @column()
  declare excessSubmissionsUnitSize: number | null

  @column()
  declare autoAssignPartners: boolean

  @column()
  declare energyBarConfigId: number | null

  @column()
  declare forceLtiClickthrough: boolean

  @column()
  declare useTimeBankDays: boolean

  @column()
  declare timeBankName: string | null

  @column()
  declare timeBankSize: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
