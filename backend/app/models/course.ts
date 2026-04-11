// PURPOSE: Represents an academic course (e.g. CS 3214 — Systems Software).
// Courses are abstract definitions that get offered as sections each term.

// DESIGN: organization_id links to the university/department offering the course.
// Courses can be hidden (is_hidden) to prevent student self-enrollment while
// still being accessible to instructors.

// DEPENDENCIES: organization, user (creator)

// CONSUMERS: section.ts, course_exercises.ts, courses_controller.ts

// STATUS: complete

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
