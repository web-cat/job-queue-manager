import Submission from '#models/submission'
import JobQueueService from '#services/job_queue_service'
import { DateTime } from 'luxon'

export default class JobRecoveryTask {
  private jobQueueService = new JobQueueService()

  async run() {
    // Find all jobs that have been pending for more than 10 minutes
    const tenMinutesAgo = DateTime.now().minus({ minutes: 10 }).toSQL()

    const stuckSubmissions = await Submission.query()
      .whereIn('status', ['pending', 'uploading'])
      .where('created_at', '<', tenMinutesAgo)

    for (const submission of stuckSubmissions) {
      // Call the GET endpoint to see what the other team says
      const payload = await this.jobQueueService.checkStatus(submission.externalJobId!)

      if (payload && payload.data.status === 'completed') {
        // If it's done, feed it directly into our webhook handler
        console.log(`[Recovery] Recovered lost grade for submission ${submission.id}`)
        await this.jobQueueService.handleWebhook(payload)
      }
    }
  }
}
