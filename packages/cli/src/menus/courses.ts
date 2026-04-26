import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { api } from '../api.js'

export async function coursesMenu(): Promise<void> {
  const action = await select({
    message: chalk.cyan('Courses'),
    choices: [
      { name: 'List courses', value: 'list' },
      { name: 'View course sections', value: 'sections' },
      { name: 'View section enrollments', value: 'enrollments' },
      { name: 'Enroll a student', value: 'enroll' },
      { name: 'Remove a student', value: 'unenroll' },
      { name: 'Create a course', value: 'create' },
      { name: '← Back', value: 'back' },
    ],
  })

  if (action === 'back') return

  if (action === 'list') {
    const spinner = ora('Fetching courses...').start()
    const res = await api.get<{ data: any[] }>('/courses')
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    const courses = res.data?.data ?? []
    if (courses.length === 0) {
      console.log(chalk.yellow('No courses found.'))
      return
    }

    console.log('')
    courses.forEach((c: any) => {
      console.log(`  ${c.id.toString().padEnd(4)} ${c.number.padEnd(10)} ${c.name}`)
    })
    console.log('')
  }

  if (action === 'sections') {
    const courseId = await input({ message: 'Course ID:' })
    const spinner = ora('Fetching sections...').start()
    const res = await api.get<any[]>(`/courses/${courseId}/sections`)
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    const sections = Array.isArray(res.data) ? res.data : []
    if (sections.length === 0) {
      console.log(chalk.yellow('No sections found.'))
      return
    }

    console.log('')
    sections.forEach((s: any) => {
      console.log(`  Section ID: ${s.id}  Label: ${s.label}`)
    })
    console.log('')
  }

  if (action === 'enrollments') {
    const courseId = await input({ message: 'Course ID:' })
    const sectionId = await input({ message: 'Section ID:' })
    const spinner = ora('Fetching enrollments...').start()
    const res = await api.get<any[]>(`/courses/${courseId}/sections/${sectionId}/enrollments`)
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    const enrollments = Array.isArray(res.data) ? res.data : []
    if (enrollments.length === 0) {
      console.log(chalk.yellow('No enrollments found.'))
      return
    }

    console.log('')
    console.log(chalk.bold('  User ID   Name                          Role'))
    enrollments.forEach((e: any) => {
      const name = `${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim()
      const role = e.courseRole?.name ?? '—'
      console.log(`  ${e.userId.toString().padEnd(10)}${name.padEnd(30)} ${role}`)
    })
    console.log('')
  }

  if (action === 'enroll') {
    const courseId = await input({ message: 'Course ID:' })
    const sectionId = await input({ message: 'Section ID:' })
    const userId = await input({ message: 'User ID to enroll:' })
    const roleId = await input({
      message: 'Course role ID (1=Instructor, 2=TA, 3=Student, 4=Observer):',
      default: '3',
    })

    const spinner = ora('Enrolling user...').start()
    const res = await api.post(`/courses/${courseId}/sections/${sectionId}/enroll`, {
      userId: parseInt(userId),
      courseRoleId: parseInt(roleId),
    })
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    console.log(chalk.green(`✔ User ${userId} enrolled in section ${sectionId}`))
  }

  if (action === 'unenroll') {
    const courseId = await input({ message: 'Course ID:' })
    const sectionId = await input({ message: 'Section ID:' })
    const userId = await input({ message: 'User ID to remove:' })

    const spinner = ora('Removing user...').start()
    const res = await api.delete(
      `/courses/${courseId}/sections/${sectionId}/enroll/${userId}`
    )
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    console.log(chalk.green(`✔ User ${userId} removed from section ${sectionId}`))
  }

  if (action === 'create') {
    const name = await input({ message: 'Course name:' })
    const number = await input({ message: 'Course number (e.g. CS2114):' })
    const slug = await input({
      message: 'Slug (e.g. cs2114-spring-2026):',
      default: number.toLowerCase().replace(/\s+/g, '-'),
    })

    const spinner = ora('Creating course...').start()
    const res = await api.post<any>('/courses', {
      name,
      number,
      slug,
      organizationId: 1,
    })
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    console.log(chalk.green(`✔ Created course: ${res.data.name} (ID: ${res.data.id})`))
  }
}
