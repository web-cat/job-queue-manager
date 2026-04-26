import User from '#models/user'
import Course from '#models/course'
import Section from '#models/section'
import CourseEnrollment from '#models/course_enrollment'
import { BasePolicy } from '@adonisjs/bouncer'

export default class CoursePolicy extends BasePolicy {
  async create(user: User) {
    return user.globalRoleId === 1 || user.globalRoleId === 2
  }

  async view(user: User, course: Course) {
    if (user.globalRoleId === 1) return true
    if (!course.isHidden) return true

    const enrollment = await CourseEnrollment.query()
      .where('user_id', user.id)
      .whereHas('section', (q) => {
        q.where('course_id', course.id)
      })
      .first()

    return !!enrollment
  }

  async createSection(user: User) {
    return user.globalRoleId === 1 || user.globalRoleId === 2
  }

  async manageEnrollments(user: User, section: Section) {
    if (user.globalRoleId === 1) return true

    const enrollment = await CourseEnrollment.query()
      .where('user_id', user.id)
      .where('course_offering_id', section.id)
      .first()

    return enrollment?.courseRoleId === 1
  }
}
