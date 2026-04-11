// PURPOSE: The result of running a specific test case against a student's
// coding_prompt_answer — pass/fail and execution feedback.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import TestCase from './test_case.js'
import User from './user.js'
import CodingPromptAnswer from './coding_prompt_answer.js'

export default class TestCaseResult extends BaseModel {
  static table = 'test_case_results'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare testCaseId: number

  @column()
  declare userId: number

  @column()
  declare codingPromptAnswerId: number | null

  @column()
  declare pass: boolean

  @column()
  declare executionFeedback: string | null

  @column()
  declare feedbackLineNo: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => TestCase)
  declare testCase: BelongsTo<typeof TestCase>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => CodingPromptAnswer)
  declare codingPromptAnswer: BelongsTo<typeof CodingPromptAnswer>
}
