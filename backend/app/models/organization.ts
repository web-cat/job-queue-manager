import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Course from './course.js'

export default class Organization extends BaseModel {
  static table = 'organization'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare abbreviation: string | null

  @column()
  declare slug: string

  @column()
  declare isHidden: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Course)
  declare courses: HasMany<typeof Course>
}
