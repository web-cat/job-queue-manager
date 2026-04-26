import { select } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { getCredentials } from '../config.js'

// Queue status hits the partner team's API directly, not /api/v1
async function fetchQueueData(path: string): Promise<any> {
  const creds = getCredentials()
  if (!creds) return null

  // The partner team's API base URL — separate from our backend
  const partnerApiUrl = process.env.JOB_QUEUE_API_URL ?? 'http://localhost:9999'

  try {
    const response = await fetch(`${partnerApiUrl}${path}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function queueMenu(): Promise<void> {
  const action = await select({
    message: chalk.cyan('Queue & Scheduler'),
    choices: [
      { name: 'View queue health', value: 'status' },
      { name: 'View active jobs', value: 'jobs' },
      { name: '← Back', value: 'back' },
    ],
  })

  if (action === 'back') return

  if (action === 'status') {
    const spinner = ora('Fetching queue status...').start()
    const data = await fetchQueueData('/api/v1/queue/status')
    spinner.stop()

    if (!data) {
      console.log(chalk.yellow('⚠  Queue API not reachable'))
      console.log(chalk.gray('   Set JOB_QUEUE_API_URL environment variable to the scheduler URL'))
      return
    }

    const q = data.data
    console.log('')
    console.log(chalk.bold('  Queue Health'))
    console.log(`  Pending jobs:      ${chalk.yellow(q.pending_count)}`)
    console.log(`  Processing jobs:   ${chalk.blue(q.processing_count)}`)
    console.log(`  Completed today:   ${chalk.green(q.completed_today)}`)
    console.log(`  Failed today:      ${chalk.red(q.failed_today)}`)
    console.log(`  Active workers:    ${q.active_workers}`)
    console.log(`  Avg wait:          ${q.avg_wait_seconds?.toFixed(1)}s`)
    console.log(`  Est. drain time:   ${q.estimated_drain_time_seconds?.toFixed(0)}s`)
    console.log('')
  }

  if (action === 'jobs') {
    const spinner = ora('Fetching jobs...').start()
    const data = await fetchQueueData('/api/v1/jobs?limit=10')
    spinner.stop()

    if (!data) {
      console.log(chalk.yellow('⚠  Queue API not reachable'))
      return
    }

    const jobs = data.data?.jobs ?? []
    if (jobs.length === 0) {
      console.log(chalk.yellow('No active jobs.'))
      return
    }

    console.log('')
    console.log(chalk.bold('  Job ID   Sub ID   Status        Docker Image'))
    jobs.forEach((j: any) => {
      const status =
        j.status === 'completed'
          ? chalk.green(j.status)
          : j.status === 'failed'
            ? chalk.red(j.status)
            : chalk.yellow(j.status)
      console.log(
        `  ${j.job_id.toString().padEnd(9)}${j.submission_id.toString().padEnd(9)}${j.status.padEnd(14)} ${j.docker_image_tag}`
      )
    })
    console.log('')
  }
}
