// PURPOSE: Groups related exercises together (e.g. all versions of a problem set).

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ExerciseVersion from './exercise_version.js'

export default class ExerciseFamily extends BaseModel {
  static table = 'exercise_families'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => ExerciseVersion)
  declare exerciseVersions: HasMany<typeof ExerciseVersion>
}
