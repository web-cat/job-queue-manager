import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class GlobalRole extends BaseModel {
  static table = 'global_role'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare canManageAllCourses: boolean

  @column()
  declare canEditSystemConfiguration: boolean

  @column()
  declare builtin: boolean

  @hasMany(() => User)
  declare users: HasMany<typeof User>
}
