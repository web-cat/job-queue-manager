import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ResourceFile from './resource_file.js'
import ExerciseVersion from './exercise_version.js'

export default class Ownership extends BaseModel {
  static table = 'ownerships'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare filename: string | null

  @column()
  declare resourceFileId: number | null

  @column()
  declare exerciseVersionId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ResourceFile)
  declare resourceFile: BelongsTo<typeof ResourceFile>

  @belongsTo(() => ExerciseVersion)
  declare exerciseVersion: BelongsTo<typeof ExerciseVersion>
}
