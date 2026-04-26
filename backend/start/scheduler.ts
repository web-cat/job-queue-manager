import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'

app.ready(async () => {
  if (app.getEnvironment() === 'test') {
    return
  }

  // Only start the timer if the main web server is running
  if (app.getEnvironment() === 'web') {
    // Dynamically import the task ONLY when in the web environment
    const { default: JobRecoveryTask } = await import('#services/job_recovery_task')
    const recoveryTask = await app.container.make(JobRecoveryTask)

    // Run every 5 minutes (300,000 milliseconds)
    const interval = setInterval(
      () => {
        logger.info('[Scheduler] Running Job Recovery Task...')
        recoveryTask.run().catch((error) => {
          logger.error({ err: error }, '[Scheduler] Job Recovery Failed')
        })
      },
      5 * 60 * 1000
    )

    interval.unref()
  }
})
