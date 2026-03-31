import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import MultipleChoicePrompt from './multiple_choice_prompt.js'

export default class Choice extends BaseModel {
  static table = 'choices'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare multipleChoicePromptId: number

  @column()
  declare position: number

  @column()
  declare answer: string

  @column()
  declare feedback: string | null

  @column()
  declare value: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MultipleChoicePrompt)
  declare multipleChoicePrompt: BelongsTo<typeof MultipleChoicePrompt>
}
