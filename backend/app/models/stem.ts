// PURPOSE: The preamble/question text that appears before the prompts in an
// exercise version. Shared across prompt types.

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Stem extends BaseModel {
  static table = 'stems'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare preamble: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
