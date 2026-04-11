// PURPOSE: A curated collection of exercises that can be shared across courses
// and organizations.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import UserGroup from './user_group.js'

export default class ExerciseCollection extends BaseModel {
  static table = 'exercise_collections'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column()
  declare userGroupId: number | null

  @column()
  declare licenseId: number | null

  @column()
  declare userId: number | null

  @column()
  declare courseOfferingId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => UserGroup)
  declare userGroup: BelongsTo<typeof UserGroup>
}
