// PURPOSE: Links an LMS assignment to a system assignment for LTI integration.
// When a student clicks an assignment link in Canvas, this record maps it to
// the correct assignment in the system.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LmsInstance from './lms_instance.js'
import Assignment from './assignment.js'

export default class LtiWorkout extends BaseModel {
  static table = 'lti_workouts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare workoutId: number | null

  @column()
  declare lmsAssignmentId: string

  @column()
  declare lmsInstanceId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => LmsInstance)
  declare lmsInstance: BelongsTo<typeof LmsInstance>

  @belongsTo(() => Assignment, { foreignKey: 'workoutId' })
  declare assignment: BelongsTo<typeof Assignment>
}
