import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CodingPrompt from './coding_prompt.js'

export default class TestCase extends BaseModel {
  static table = 'test_cases'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare codingPromptId: number

  @column()
  declare input: string

  @column()
  declare expectedOutput: string

  @column()
  declare weight: number

  @column()
  declare description: string | null

  @column()
  declare negativeFeedback: string | null

  @column()
  declare static: boolean

  @column()
  declare screening: boolean

  @column()
  declare example: boolean

  @column()
  declare hidden: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => CodingPrompt)
  declare codingPrompt: BelongsTo<typeof CodingPrompt>
}
