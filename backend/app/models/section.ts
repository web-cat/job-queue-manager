// PURPOSE: A specific offering of a course in a given term. This is what students
// enroll in and what assignments are attached to.

// DESIGN: Named section but represents course_offering in the domain model.
// The lms_instance_id supports LTI integration — when students access via
// Canvas, the section is associated with a Canvas course instance.

// DEPENDENCIES: course, term, lms_instance

// CONSUMERS: course_enrollment, assignment_offering, courses_controller.ts

// NEXT TEAM NOTES: In many places course_offering_id actually means section.id.
// This naming inconsistency exists throughout the codebase as a legacy artifact.

// STATUS: completePURPOSE: A specific offering of a course in a given term. This is what students
// enroll in and what assignments are attached to.

// DESIGN: Named section but represents course_offering in the domain model.
// The lms_instance_id supports LTI integration — when students access via
// Canvas, the section is associated with a Canvas course instance.

// DEPENDENCIES: course, term, lms_instance

// CONSUMERS: course_enrollment, assignment_offering, courses_controller.ts

// NEXT TEAM NOTES: In many places course_offering_id actually means section.id.
// This naming inconsistency exists throughout the codebase as a legacy artifact.

// STATUS: complete

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Course from './course.js'
import Term from './term.js'
import CourseEnrollment from './course_enrollment.js'
import AssignmentOffering from './assignment_offering.js'

export default class Section extends BaseModel {
  static table = 'section'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare courseId: number

  @column()
  declare termId: number

  @column()
  declare label: string

  @column()
  declare url: string | null

  @column()
  declare selfEnrollmentAllowed: boolean | null

  @column()
  declare lmsInstanceId: number | null

  @column.date()
  declare cutoffDate: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Course)
  declare course: BelongsTo<typeof Course>

  @belongsTo(() => Term)
  declare term: BelongsTo<typeof Term>

  @hasMany(() => CourseEnrollment, { foreignKey: 'courseOfferingId' })
  declare enrollments: HasMany<typeof CourseEnrollment>

  @hasMany(() => AssignmentOffering, { foreignKey: 'courseOfferingId' })
  declare assignmentOfferings: HasMany<typeof AssignmentOffering>
}
