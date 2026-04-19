// PURPOSE: Represents a student's submission of code for an assignment. The central
// entity in the grading workflow — everything flows through submission.

// DESIGN: Links a user to an assignment_offering (the specific instance of an
// assignment in a course section). The workoutId column is a legacy name for
// what is effectively assignmentId. feedbackReady is flipped to true by the
// other team's system when grading is complete. The hasOne relationship to
// enqueuedJob allows tracking job status from the submission.

// DEPENDENCIES: user, assignment (via workoutId FK), assignment_offering,
// submission_result, lti_workouts

// CONSUMERS: enqueued_job.ts, submissions_controller.ts, job_queue_service.ts

// NEXT TEAM NOTES: The workoutId column references assignment.id despite its
// confusing name — this is a legacy naming issue. When the other team completes
// grading, they update submission_result and set feedbackReady=true on this
// record. Poll feedbackReady to know when results are available.

// STATUS: complete [NEEDS INLINE DOCS — workoutId naming explanation]

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Assignment from './assignment.js'
import AssignmentOffering from './assignment_offering.js'

export default class Submission extends BaseModel {
  static table = 'submission'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare workoutId: number

  @column()
  declare externalJobId: number | null

  @column()
  declare status: string

  @column()
  declare assignmentOfferingId: number | null

  @column()
  declare score: number | null

  @column()
  declare filePath: string | null

  @column()
  declare feedbackReady: boolean

  @column()
  declare submitNumber: number | null

  @column()
  declare retryCount: number

  @column()
  declare isSubmissionForGrading: boolean

  @column()
  declare partnerLink: boolean

  @column()
  declare primarySubmissionId: number | null

  @column()
  declare submissionResultId: number

  @column()
  declare lisResultSourcedid: string | null

  @column()
  declare lisOutcomeServiceUrl: string | null

  @column()
  declare ltiWorkoutId: number | null

  @column()
  declare exercisesCompleted: number | null

  @column()
  declare exercisesRemaining: number | null

  @column.dateTime()
  declare submitTime: DateTime | null

  @column.dateTime()
  declare lastAttemptedAt: DateTime | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Assignment, { foreignKey: 'workoutId' })
  declare assignment: BelongsTo<typeof Assignment>

  @belongsTo(() => AssignmentOffering)
  declare assignmentOffering: BelongsTo<typeof AssignmentOffering>
}
