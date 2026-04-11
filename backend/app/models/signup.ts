// PURPOSE: Stores interest signups from users who want to be notified when
// the system opens for registration. Legacy table.

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Signup extends BaseModel {
  static table = 'signups'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string | null

  @column()
  declare lastNameName: string | null

  @column()
  declare email: string | null

  @column()
  declare institution: string | null

  @column()
  declare comments: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
