// PURPOSE: A student's answer to a coding prompt — their submitted code and
// any compilation errors.

import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CodingPromptAnswer extends BaseModel {
  static table = 'coding_prompt_answers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare answer: string | null

  @column()
  declare error: string | null

  @column()
  declare errorLineNo: number | null
}
