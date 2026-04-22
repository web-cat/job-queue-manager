import app from '@adonisjs/core/services/app'
import JobRecoveryTask from '#services/job_recovery_task'

app.ready(async () => {
  // Only start the timer if the main web server is running
  if (app.getEnvironment() === 'web') {
    const recoveryTask = await app.container.make(JobRecoveryTask)

    // Run every 5 minutes (300,000 milliseconds)
    setInterval(
      () => {
        console.log('[Scheduler] Running Job Recovery Task...')
        recoveryTask.run().catch((error) => {
          console.error('[Scheduler] Job Recovery Failed:', error)
        })
      },
      5 * 60 * 1000
    )
  }
})
