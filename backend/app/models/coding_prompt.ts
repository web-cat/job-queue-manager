import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import TestCase from './test_case.js'

export default class CodingPrompt extends BaseModel {
  static table = 'coding_prompts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare className: string | null

  @column()
  declare wrapperCode: string

  @column()
  declare testScript: string

  @column()
  declare methodName: string | null

  @column()
  declare starterCode: string | null

  @column()
  declare hideExamples: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => TestCase)
  declare testCases: HasMany<typeof TestCase>
}
