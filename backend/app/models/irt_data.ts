// PURPOSE: Item Response Theory psychometric data — difficulty, discrimination,
// and attempt statistics used for adaptive testing and exercise quality metrics.

import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class IrtData extends BaseModel {
  static table = 'irt_data'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare attemptCount: number

  @column()
  declare sumOfScores: number

  @column()
  declare difficulty: number

  @column()
  declare discrimination: number
}
