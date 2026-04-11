// PURPOSE: Links a user to a section with a specific role. The junction table
// for the student/instructor/TA relationship to a course section.

import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Section from './section.js'
import CourseRole from './course_role.js'

export default class CourseEnrollment extends BaseModel {
  static table = 'course_enrollment'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare courseOfferingId: number

  @column()
  declare courseRoleId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Section, { foreignKey: 'courseOfferingId' })
  declare section: BelongsTo<typeof Section>

  @belongsTo(() => CourseRole)
  declare courseRole: BelongsTo<typeof CourseRole>
}
