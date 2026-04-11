// PURPOSE: Defines system-wide permission levels for users. Controls what users
// can do across the entire system (not just within a course).
// DESIGN: Uses boolean flags rather than a string enum to allow fine-grained
// permission combinations. The builtin flag marks roles that ship with the
// system and should not be deleted. Examples: super admin, regular user.

// DEPENDENCIES: None

// CONSUMERS: user.ts (belongsTo), admin_middleware.ts (checks canManageAllCourses)

// NEXT TEAM NOTES: When seeding the database, create at least two global roles:
// one with canManageAllCourses=true (admin) and one with all false (student).
// The admin_middleware checks canManageAllCourses for route protection.

// STATUS: complete

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
