import User from '#models/user'
import Submission from '#models/submission'
import AssignmentOffering from '#models/assignment_offering'
import { BasePolicy } from '@adonisjs/bouncer'

export default class SubmissionPolicy extends BasePolicy {
  async create(user: User, workoutId: number, assignmentOfferingId?: number) {
    if (user.globalRoleId === 1) return true

    if (assignmentOfferingId) {
      const offering = await AssignmentOffering.query()
        .where('id', assignmentOfferingId)
        .preload('section', (q) => {
          q.preload('enrollments', (eq) => {
            eq.where('user_id', user.id)
          })
        })
        .first()

      return !!offering?.section?.enrollments?.length
    }

    const offering = await AssignmentOffering.query()
      .where('assignment_id', workoutId)
      .whereHas('section', (q) => {
        q.whereHas('enrollments', (eq) => {
          eq.where('user_id', user.id)
        })
      })
      .first()

    return !!offering
  }

  async view(user: User, submission: Submission) {
    if (user.globalRoleId === 1) return true
    if (submission.userId === user.id) return true

    if (submission.assignmentOfferingId) {
      const offering = await AssignmentOffering.query()
        .where('id', submission.assignmentOfferingId)
        .preload('section', (q) => {
          q.preload('enrollments', (eq) => {
            eq.where('user_id', user.id)
          })
        })
        .first()

      const enrollment = offering?.section?.enrollments?.[0]
      return enrollment?.courseRoleId === 1 || enrollment?.courseRoleId === 2
    }

    return false
  }

  async update(user: User) {
    return user.globalRoleId === 1
  }

  async delete(user: User) {
    return user.globalRoleId === 1
  }
}
