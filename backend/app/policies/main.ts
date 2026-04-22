export const policies = {
  CoursePolicy: () => import('#policies/course_policy'),
  AssignmentPolicy: () => import('#policies/assignment_policy'),
  SubmissionPolicy: () => import('#policies/submission_policy')
}