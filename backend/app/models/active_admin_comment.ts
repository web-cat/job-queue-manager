// PURPOSE: Legacy Rails ActiveAdmin comment system. Stores admin notes attached
// to any resource. Likely not actively used in this implementation but
// preserved for schema compatibility.

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ActiveAdminComment extends BaseModel {
  static table = 'active_admin_comments'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare namespace: string | null

  @column()
  declare body: string | null

  @column()
  declare resourceId: string

  @column()
  declare resourceType: string

  @column()
  declare authorId: number | null

  @column()
  declare authorType: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
