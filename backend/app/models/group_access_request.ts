// PURPOSE: A request to join a user_group. Supports an approval workflow
// (pending → approved/denied).

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import UserGroup from './user_group.js'

export default class GroupAccessRequest extends BaseModel {
  static table = 'group_access_requests'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare userGroupId: number | null

  @column()
  declare pending: boolean

  @column()
  declare decision: boolean | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => UserGroup)
  declare userGroup: BelongsTo<typeof UserGroup>
}
