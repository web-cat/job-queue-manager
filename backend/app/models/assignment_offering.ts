// PURPOSE: Links an assignment to a specific course section with dates and
// policies. A single assignment can be offered in many sections with different
// due dates and configurations.

// DESIGN: course_offering_id references section.id — the naming mismatch is a
// legacy issue. availableFrom/dueAt/acceptUntil provide a three-stage deadline
// system. student_extensions can override these dates per student.

// DEPENDENCIES: assignment, section (via courseOfferingId), workout_policies

// CONSUMERS: submission.ts, course_enrollment, student_extension.ts,
// assignments_controller.ts

// NEXT TEAM NOTES: When checking if a student can submit, check both
// assignment_offering dates and student_extensions for that student. The
// acceptUntil date is the hard cutoff — after this, no submissions are accepted
// regardless of extensions.

// STATUS: complete

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Assignment from './assignment.js'
import Section from './section.js'
import Submission from './submission.js'

export default class AssignmentOffering extends BaseModel {
  static table = 'assignment_offering'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare assignmentId: number

  @column()
  declare courseOfferingId: number

  @column()
  declare workoutPolicyId: number | null

  @column()
  declare continueFromWorkoutId: number | null

  @column()
  declare lmsAssignmentId: string | null

  @column()
  declare lmsAssignmentUrl: string | null

  @column()
  declare lisOutcomeServiceUrl: string | null

  @column()
  declare published: boolean

  @column()
  declare mostRecent: boolean

  @column()
  declare timeLimit: number | null

  @column()
  declare attemptLimit: number | null

  @column.dateTime()
  declare availableFrom: DateTime | null

  @column.dateTime()
  declare dueAt: DateTime | null

  @column.dateTime()
  declare acceptUntil: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Assignment)
  declare assignment: BelongsTo<typeof Assignment>

  @belongsTo(() => Section, { foreignKey: 'courseOfferingId' })
  declare section: BelongsTo<typeof Section>

  @hasMany(() => Submission)
  declare submissions: HasMany<typeof Submission>
}
