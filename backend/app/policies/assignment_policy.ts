import User from '#models/user'
import Assignment from '#models/assignment'
import AssignmentOffering from '#models/assignment_offering'
import CourseEnrollment from '#models/course_enrollment'
import { BasePolicy } from '@adonisjs/bouncer'

export default class AssignmentPolicy extends BasePolicy {
  async create(user: User) {
    return user.globalRoleId === 1 || user.globalRoleId === 2
  }

  async view(user: User, assignment: Assignment) {
    if (user.globalRoleId === 1) return true
    if (assignment.isPublic) return true
    if (assignment.userId === user.id) return true

    const offering = await AssignmentOffering.query()
      .where('assignment_id', assignment.id)
      .whereHas('section', (q) => {
        q.whereHas('enrollments', (eq) => {
          eq.where('user_id', user.id)
        })
      })
      .first()

    return !!offering
  }

  async update(user: User, assignment: Assignment) {
    if (user.globalRoleId === 1) return true
    return assignment.userId === user.id
  }

  async delete(user: User, assignment: Assignment) {
    return this.update(user, assignment)
  }

  async createOffering(user: User, courseOfferingId: number) {
    if (user.globalRoleId === 1) return true

    const enrollment = await CourseEnrollment.query()
      .where('user_id', user.id)
      .where('course_offering_id', courseOfferingId)
      .first()

    return enrollment?.courseRoleId === 1
  }
}
