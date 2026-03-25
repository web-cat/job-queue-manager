import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import IrtData from './irt_data.js'
import ExerciseFamily from './exercise_family.js'
import ExerciseVersion from './exercise_version.js'

export default class Exercise extends BaseModel {
  static table = 'exercises'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare questionType: number

  @column()
  declare currentVersionId: number | null

  @column()
  declare versions: number | null

  @column()
  declare exerciseFamilyId: number | null

  @column()
  declare name: string | null

  @column()
  declare isPublic: boolean

  @column()
  declare experience: number

  @column()
  declare irtDataId: number | null

  @column()
  declare externalId: string | null

  @column()
  declare exerciseCollectionId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => IrtData)
  declare irtData: BelongsTo<typeof IrtData>

  @belongsTo(() => ExerciseFamily)
  declare exerciseFamily: BelongsTo<typeof ExerciseFamily>

  @hasMany(() => ExerciseVersion)
  declare exerciseVersions: HasMany<typeof ExerciseVersion>
}
