// PURPOSE: An assignment is a collection of exercises given to students. In the
// legacy schema, assignments are called "workouts" — this naming is preserved
// in many FK column names (workout_id, workout_policy_id).

// DESIGN: submission_policy defines the rules for how this assignment can be
// submitted (attempts, deadlines, partners, late penalties). An assignment
// can be offered in multiple course sections via assignment_offering.

// DEPENDENCIES: user, submission_policy

// CONSUMERS: assignment_offering, exercise_workouts, workout_owners,
// assignments_controller.ts

// NEXT TEAM NOTES: The "workout" terminology throughout the codebase refers to
// assignments. This is a legacy naming artifact. When building the frontend,
// display "Assignment" to users while using workout_id in API calls.

// STATUS: complete

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import SubmissionPolicy from './submission_policy.js'
import AssignmentOffering from './assignment_offering.js'

export default class Assignment extends BaseModel {
  static table = 'assignment'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare dockerImageTag: string | null

  @column()
  declare description: string | null

  @column()
  declare scrambled: boolean

  @column()
  declare pointsMultiplier: number | null

  @column()
  declare userId: number | null

  @column()
  declare externalId: string | null

  @column()
  declare isPublic: boolean | null

  @column()
  declare submissionPolicyId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SubmissionPolicy)
  declare submissionPolicy: BelongsTo<typeof SubmissionPolicy>

  @hasMany(() => AssignmentOffering)
  declare assignmentOfferings: HasMany<typeof AssignmentOffering>
}
