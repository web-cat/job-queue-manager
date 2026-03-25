import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Assignment from './assignment.js'
import AssignmentOffering from './assignment_offering.js'
import EnqueuedJob from './enqueued_job.js'

export default class Submission extends BaseModel {
  static table = 'submission'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare workoutId: number

  @column()
  declare assignmentOfferingId: number | null

  @column()
  declare score: number | null

  @column()
  declare feedbackReady: boolean

  @column()
  declare submitNumber: number | null

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

  @hasOne(() => EnqueuedJob)
  declare enqueuedJob: HasOne<typeof EnqueuedJob>
}
