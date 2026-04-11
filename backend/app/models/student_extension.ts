// PURPOSE: Per-student deadline extensions for assignment offerings. Overrides
// the default dates in assignment_offering for specific students.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import AssignmentOffering from './assignment_offering.js'

export default class StudentExtension extends BaseModel {
  static table = 'student_extensions'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare workoutOfferingId: number | null

  @column()
  declare timeLimit: number | null

  @column.dateTime()
  declare softDeadline: DateTime | null

  @column.dateTime()
  declare hardDeadline: DateTime | null

  @column.dateTime()
  declare openingDate: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => AssignmentOffering, { foreignKey: 'workoutOfferingId' })
  declare assignmentOffering: BelongsTo<typeof AssignmentOffering>
}
