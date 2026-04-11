// PURPOSE: The base unit of academic content. An exercise is a single question or
// coding problem that can appear in multiple assignments.

// DESIGN: question_type is an integer enum defining the exercise type (coding,
// multiple choice, etc.). current_version_id points to the active version —
// exercises are versioned so historical submissions reference the version that
// was active when submitted. exercise_collection_id groups exercises into
// shareable collections.

// DEPENDENCIES: irt_data, exercise_family, exercise_collection

// CONSUMERS: exercise_version, exercise_workouts, course_exercises

// NEXT TEAM NOTES: Always work with exercise_versions, not exercises directly,
// when associating with submissions. The exercise is the parent; the version
// is what students actually see and submit against.

// STATUS: complete

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
