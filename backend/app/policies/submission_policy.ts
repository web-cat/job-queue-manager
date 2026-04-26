import User from '#models/user'
import Submission from '#models/submission'
import AssignmentOffering from '#models/assignment_offering'
import CourseEnrollment from '#models/course_enrollment'
import { BasePolicy } from '@adonisjs/bouncer'

export default class SubmissionPolicy extends BasePolicy {
  async create(user: User, workoutId: number, assignmentOfferingId?: number) {
    if (user.globalRoleId === 1) return true

    if (assignmentOfferingId) {
      const enrollment = await CourseEnrollment.query()
        .where('user_id', user.id)
        .where('course_offering_id', assignmentOfferingId)
        .first()
      return !!enrollment
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
      const enrollment = await CourseEnrollment.query()
        .where('user_id', user.id)
        .where('course_offering_id', submission.assignmentOfferingId)
        .first()

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
