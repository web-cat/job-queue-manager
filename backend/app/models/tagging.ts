import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tag from './tag.js'

export default class Tagging extends BaseModel {
  static table = 'taggings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tagId: number | null

  @column()
  declare taggableId: number | null

  @column()
  declare taggableType: string | null

  @column()
  declare taggerId: number | null

  @column()
  declare taggerType: string | null

  @column()
  declare context: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Tag)
  declare tag: BelongsTo<typeof Tag>
}
