import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Exercise from './exercise.js'
import Stem from './stem.js'
import IrtData from './irt_data.js'
import User from './user.js'
import Prompt from './prompt.js'

export default class ExerciseVersion extends BaseModel {
  static table = 'exercise_versions'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare exerciseId: number

  @column()
  declare version: number

  @column()
  declare stemId: number | null

  @column()
  declare creatorId: number | null

  @column()
  declare irtDataId: number | null

  @column()
  declare textRepresentation: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Exercise)
  declare exercise: BelongsTo<typeof Exercise>

  @belongsTo(() => Stem)
  declare stem: BelongsTo<typeof Stem>

  @belongsTo(() => IrtData)
  declare irtData: BelongsTo<typeof IrtData>

  @belongsTo(() => User, { foreignKey: 'creatorId' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Prompt)
  declare prompts: HasMany<typeof Prompt>
}
