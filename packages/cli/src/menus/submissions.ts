import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import ora from 'ora'
import { createReadStream, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { api } from '../api.js'
import { getCredentials } from '../config.js'
import { createHmac, createHash, randomUUID } from 'node:crypto'

// Submissions require multipart file upload — can't use the standard JSON api client
async function submitFile(workoutId: string, filePath: string): Promise<any> {
  const creds = getCredentials()!
  const method = 'POST'
  const path = '/api/v1/submissions'
  const timestamp = Date.now().toString()
  const nonce = randomUUID()
  const bodyHash = createHash('sha256').update('').digest('hex') // multipart body hash is empty string
  const canonical = [method, path, timestamp, nonce, bodyHash].join('\n')
  const signature = createHmac('sha256', creds.clientSecret).update(canonical).digest('hex')

  const form = new FormData()
  form.append('workoutId', workoutId)
  form.append('isSubmissionForGrading', 'true')

  const fileBuffer = await import('node:fs/promises').then((fs) => fs.readFile(filePath))
  const blob = new Blob([fileBuffer], { type: 'application/zip' })
  form.append('submission_zip', blob, basename(filePath))

  const response = await fetch(`${creds.serverUrl}${path}`, {
    method,
    headers: {
      'x-api-key': creds.clientId,
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    },
    body: form,
  })

  return { ok: response.ok, status: response.status, data: await response.json() }
}

export async function submissionsMenu(): Promise<void> {
  const action = await select({
    message: chalk.cyan('Submissions'),
    choices: [
      { name: 'Submit a zip file', value: 'submit' },
      { name: 'List my submissions', value: 'list' },
      { name: 'Check submission status', value: 'status' },
      { name: 'View grading result', value: 'result' },
      { name: '← Back', value: 'back' },
    ],
  })

  if (action === 'back') return

  if (action === 'submit') {
    const workoutId = await input({ message: 'Assignment ID:' })
    const filePath = await input({ message: 'Path to zip file:' })

    if (!existsSync(filePath)) {
      console.log(chalk.red(`File not found: ${filePath}`))
      return
    }

    if (!filePath.endsWith('.zip')) {
      console.log(chalk.red('File must be a .zip archive'))
      return
    }

    const spinner = ora('Uploading submission...').start()
    const res = await submitFile(workoutId, filePath)
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Submission failed: ${JSON.stringify(res.data)}`))
      return
    }

    const sub = res.data.submission
    console.log(chalk.green(`✔ Submitted successfully`))
    console.log(`  Submission ID: ${chalk.bold(sub.id)}`)
    console.log(`  Status:        ${sub.status}`)
    console.log(`  File path:     ${res.data.archivePath}`)
    console.log('')
    console.log(chalk.gray(`  Check status: jqm → Submissions → Check submission status`))
  }

  if (action === 'list') {
    const spinner = ora('Fetching submissions...').start()
    const res = await api.get<{ data: any[] }>('/submissions')
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    const submissions = res.data?.data ?? []
    if (submissions.length === 0) {
      console.log(chalk.yellow('No submissions found.'))
      return
    }

    console.log('')
    console.log(chalk.bold('  ID    Status           Assignment                         Submitted'))
    submissions.slice(0, 20).forEach((s: any) => {
      const status = s.status === 'completed'
        ? chalk.green(s.status)
        : s.status === 'failed'
          ? chalk.red(s.status)
          : chalk.yellow(s.status)
      const date = new Date(s.createdAt).toLocaleString()
      console.log(
        `  ${s.id.toString().padEnd(6)}${s.status.padEnd(17)}${(s.assignmentOffering?.assignment?.name ?? '—').padEnd(35)} ${date}`
      )
    })
    console.log('')
  }

  if (action === 'status') {
    const id = await input({ message: 'Submission ID:' })
    const spinner = ora('Checking status...').start()
    const res = await api.get<any>(`/submissions/${id}`)
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    const s = res.data
    console.log('')
    console.log(`  Status:     ${chalk.bold(s.status)}`)
    console.log(`  Submitted:  ${new Date(s.createdAt).toLocaleString()}`)
    console.log(`  File:       ${s.filePath ?? '—'}`)
    if (s.externalJobId) console.log(`  Job ID:     ${s.externalJobId}`)
    if (s.retryCount > 0) console.log(`  Retries:    ${s.retryCount}`)
    console.log('')
  }

  if (action === 'result') {
    const id = await input({ message: 'Submission ID:' })
    const spinner = ora('Fetching result...').start()
    const res = await api.get<any>(`/submissions/${id}/result`)
    spinner.stop()

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`))
      return
    }

    if (!res.data.ready) {
      console.log(chalk.yellow('⏳ Grading is still in progress. Check back later.'))
      return
    }

    console.log('')
    console.log(chalk.bold('  Grading Result'))
    console.log(`  Score:       ${chalk.bold(res.data.score ?? '—')}`)
    console.log('')
  }
}
