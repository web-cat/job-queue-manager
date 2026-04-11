// PURPOSE: Tracks when students view exercise visualizations (e.g. algorithm
// animations). Used for learning analytics.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Exercise from './exercise.js'
import Assignment from './assignment.js'
import AssignmentOffering from './assignment_offering.js'

export default class VisualizationLogging extends BaseModel {
  static table = 'visualization_loggings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare exerciseId: number | null

  @column()
  declare workoutId: number | null

  @column()
  declare workoutOfferingId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Exercise)
  declare exercise: BelongsTo<typeof Exercise>

  @belongsTo(() => Assignment, { foreignKey: 'workoutId' })
  declare assignment: BelongsTo<typeof Assignment>

  @belongsTo(() => AssignmentOffering, { foreignKey: 'workoutOfferingId' })
  declare assignmentOffering: BelongsTo<typeof AssignmentOffering>
}
