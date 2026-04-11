// PURPOSE: Files attached to exercise versions (images, datasets, starter files).
// Token provides a public URL-safe identifier for file access.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class ResourceFile extends BaseModel {
  static table = 'resource_files'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare filename: string | null

  @column()
  declare token: string

  @column()
  declare userId: number

  @column()
  declare public: boolean

  @column()
  declare hashval: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
