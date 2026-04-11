// PURPOSE: A specific version of an exercise. Allows exercise content to be
// updated without invalidating historical submissions that reference the
// previous version.

// DESIGN: Each version has its own stem (question preamble) and set of prompts.
// text_representation stores a serialized version for search/display purposes.
// irt_data tracks psychometric properties per version.

// DEPENDENCIES: exercise, stem, irt_data, user (creator)

// CONSUMERS: attempt, prompt, resource_files (via exercise_versions_resource_files)

// NEXT TEAM NOTES: When the other team executes grading, they reference
// exercise_version_id on the attempt record. The grading_plugin associated
// with the assignment step defines how that version's code gets executed.

// STATUS: complete

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
