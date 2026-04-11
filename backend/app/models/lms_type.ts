// PURPOSE: The type of LMS (Canvas, Blackboard, Moodle). Used to configure
// LMS-specific behavior in lms_instance records.

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import LmsInstance from './lms_instance.js'

export default class LmsType extends BaseModel {
  static table = 'lms_type'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => LmsInstance)
  declare lmsInstances: HasMany<typeof LmsInstance>
}
