// PURPOSE: Tracks a user's experience points and completed exercises within
// a specific tag category. Used for gamification and progress tracking.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class TagUserScore extends BaseModel {
  static table = 'tag_user_scores'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare experience: number

  @column()
  declare completedExercises: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
