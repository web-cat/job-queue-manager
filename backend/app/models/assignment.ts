import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import SubmissionPolicy from './submission_policy.js'
import AssignmentOffering from './assignment_offering.js'

export default class Assignment extends BaseModel {
  static table = 'assignment'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare scrambled: boolean

  @column()
  declare pointsMultiplier: number | null

  @column()
  declare userId: number | null

  @column()
  declare externalId: string | null

  @column()
  declare isPublic: boolean | null

  @column()
  declare submissionPolicyId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SubmissionPolicy)
  declare submissionPolicy: BelongsTo<typeof SubmissionPolicy>

  @hasMany(() => AssignmentOffering)
  declare assignmentOfferings: HasMany<typeof AssignmentOffering>
}
