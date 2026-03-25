import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Assignment from './assignment.js'

export default class WorkoutOwner extends BaseModel {
  static table = 'workout_owners'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare workoutId: number

  @column()
  declare ownerId: number

  @belongsTo(() => Assignment, { foreignKey: 'workoutId' })
  declare assignment: BelongsTo<typeof Assignment>

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>
}
