// PURPOSE: A tag that can be applied to exercises for categorization and search.
// taggings_count is a cached counter for performance.

import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Tagging from './tagging.js'

export default class Tag extends BaseModel {
  static table = 'tags'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare taggingsCount: number

  @hasMany(() => Tagging)
  declare taggings: HasMany<typeof Tagging>
}
