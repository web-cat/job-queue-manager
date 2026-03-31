import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from './organization.js'
import Section from './section.js'
import User from './user.js'

export default class Course extends BaseModel {
  static table = 'course'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare number: string

  @column()
  declare organizationId: number

  @column()
  declare creatorId: number | null

  @column()
  declare slug: string

  @column()
  declare userGroupId: number | null

  @column()
  declare isHidden: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'creatorId' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Section)
  declare sections: HasMany<typeof Section>
}
