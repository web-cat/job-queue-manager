#!/usr/bin/env node
// PURPOSE: Main entry point for the JQM CLI.
// Interactive menu-driven interface for the Job Queue Manager backend.
// Authenticates via OAuth client credentials (HMAC-SHA256 signing) against /api/v1.
//
// USAGE:
//   First time: jqm setup
//   Then:       jqm
//
// INSTALL:
//   cd packages/cli && npm install && npm run build
//   npm link   (makes 'jqm' available globally)
//
// DEVELOPMENT:
//   cd packages/cli && npm run dev

import { select } from '@inquirer/prompts'
import chalk from 'chalk'
import { getCredentials } from './config.js'
import { assignmentsMenu } from './menus/assignments.js'
import { submissionsMenu } from './menus/submissions.js'
import { coursesMenu } from './menus/courses.js'
import { queueMenu } from './menus/queue.js'
import { setupMenu, showCurrentUser } from './menus/setup.js'

function printBanner() {
  console.log('')
  console.log(chalk.bold.blue('  ╔══════════════════════════════════╗'))
  console.log(chalk.bold.blue('  ║   Job Queue Manager CLI  v1.0    ║'))
  console.log(chalk.bold.blue('  ║   VT CS Department               ║'))
  console.log(chalk.bold.blue('  ╚══════════════════════════════════╝'))
  console.log('')
}

async function mainMenu(): Promise<void> {
  const creds = getCredentials()

  if (!creds) {
    printBanner()
    console.log(chalk.yellow('  ⚠  Not configured. Starting setup...\n'))
    await setupMenu()
    return mainMenu()
  }

  await showCurrentUser()

  const action = await select({
    message: chalk.bold('Main Menu'),
    choices: [
      { name: '📝  Assignments', value: 'assignments' },
      { name: '📤  Submissions', value: 'submissions' },
      { name: '🎓  Courses & Enrollment', value: 'courses' },
      { name: '📊  Queue & Scheduler Status', value: 'queue' },
      { name: '⚙️   Setup / Change credentials', value: 'setup' },
      { name: '🚪  Exit', value: 'exit' },
    ],
  })

  switch (action) {
    case 'assignments':
      await assignmentsMenu()
      break
    case 'submissions':
      await submissionsMenu()
      break
    case 'courses':
      await coursesMenu()
      break
    case 'queue':
      await queueMenu()
      break
    case 'setup':
      await setupMenu()
      break
    case 'exit':
      console.log(chalk.gray('\n  Goodbye!\n'))
      process.exit(0)
  }

  // Return to main menu after any action
  return mainMenu()
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.gray('\n\n  Goodbye!\n'))
  process.exit(0)
})

printBanner()
mainMenu().catch((error) => {
  if (error?.message?.includes('User force closed')) {
    console.log(chalk.gray('\n  Goodbye!\n'))
    process.exit(0)
  }
  console.error(chalk.red('\nError:'), error)
  process.exit(1)
})
