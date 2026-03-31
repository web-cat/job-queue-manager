import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Prompt from './prompt.js'
import Attempt from './attempt.js'

export default class PromptAnswer extends BaseModel {
  static table = 'prompt_answers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare attemptId: number | null

  @column()
  declare promptId: number | null

  @column()
  declare actableId: number | null

  @column()
  declare actableType: string | null

  @belongsTo(() => Prompt)
  declare prompt: BelongsTo<typeof Prompt>

  @belongsTo(() => Attempt)
  declare attempt: BelongsTo<typeof Attempt>
}
