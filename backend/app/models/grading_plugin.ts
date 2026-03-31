import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Step from './step.js'

export default class GradingPlugin extends BaseModel {
  static table = 'grading_plugin'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare languageId: number | null

  @column()
  declare name: string | null

  @column()
  declare mainFileName: string | null

  @column()
  declare subdirName: string | null

  @column()
  declare uploadedFileName: string | null

  @column()
  declare isConfigFile: boolean

  @column()
  declare isPublished: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Step)
  declare steps: HasMany<typeof Step>
}
