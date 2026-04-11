// PURPOSE: Academic term (Fall 2024, Spring 2025). Season is an integer enum.
// All sections belong to a term.

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Section from './section.js'

export default class Term extends BaseModel {
  static table = 'term'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare season: number

  @column()
  declare year: number

  @column()
  declare slug: string

  @column.date()
  declare startsOn: DateTime

  @column.date()
  declare endsOn: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Section)
  declare sections: HasMany<typeof Section>
}
