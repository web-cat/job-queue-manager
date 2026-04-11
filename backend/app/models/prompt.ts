// PURPOSE: Base prompt record using polymorphic actable pattern. The actable_type
// and actable_id point to the specific prompt type (coding_prompt,
// multiple_choice_prompt, etc.).

// NEXT TEAM NOTES: [NEEDS INLINE DOCS] — The actable pattern requires checking
// actable_type before loading the related prompt data. This is the most complex
// relationship in the schema.

// STATUS: complete [NEEDS INLINE DOCS]

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import ExerciseVersion from './exercise_version.js'
import IrtData from './irt_data.js'
import PromptAnswer from './prompt_answer.js'

export default class Prompt extends BaseModel {
  static table = 'prompts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare exerciseVersionId: number

  @column()
  declare question: string

  @column()
  declare position: number

  @column()
  declare feedback: string | null

  @column()
  declare actableId: number | null

  @column()
  declare actableType: string | null

  @column()
  declare irtDataId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ExerciseVersion)
  declare exerciseVersion: BelongsTo<typeof ExerciseVersion>

  @belongsTo(() => IrtData)
  declare irtData: BelongsTo<typeof IrtData>

  @hasMany(() => PromptAnswer)
  declare promptAnswers: HasMany<typeof PromptAnswer>
}
