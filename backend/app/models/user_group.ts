import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Membership from './membership.js'

export default class UserGroup extends BaseModel {
  static table = 'user_groups'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Membership)
  declare memberships: HasMany<typeof Membership>
}
