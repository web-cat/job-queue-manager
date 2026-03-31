import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Choice from './choice.js'

export default class MultipleChoicePrompt extends BaseModel {
  static table = 'multiple_choice_prompts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare allowMultiple: boolean

  @column()
  declare isScrambled: boolean

  @hasMany(() => Choice)
  declare choices: HasMany<typeof Choice>
}
