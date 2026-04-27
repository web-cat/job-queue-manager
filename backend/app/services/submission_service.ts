import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import Submission from '#models/submission'
import SubmissionResult from '#models/submission_result'
import Assignment from '#models/assignment'
import JobQueueService from '#services/job_queue_service'
import fs from 'node:fs/promises'
import {
  downloadFileFromObjectStorage,
  uploadFileToObjectStorage,
} from '#services/object_storage_service'
import env from '#start/env'
import { DateTime } from 'luxon'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

@inject()
export default class SubmissionService {
  constructor(private jobQueueService: JobQueueService) {}

  async getSubmissionDownload(submissionId: number) {
    const submission = await Submission.findOrFail(submissionId)

    if (!submission.filePath) {
      throw new Error('No file associated with this submission')
    }

    const fileBuffer = await downloadFileFromObjectStorage(
      env.get('S3_BUCKET')!,
      submission.filePath
    )
    const filename = submission.filePath.split('/').pop() || 'submission.zip'

    return { fileBuffer, filename }
  }

  async processSubmission(userId: number, data: any, archive: MultipartFile) {
    // 1. Start a database transaction
    const trx = await db.transaction()
    let submission: Submission
    let objectKey: string
    let fileBuffer: Buffer
    let imageTag: string

    try {
      // 2. Create records using the transaction client
      const submissionResult = await SubmissionResult.create(
        { correctnessScore: 0 },
        { client: trx }
      )

      submission = await Submission.create(
        {
          userId: userId,
          workoutId: data.workoutId,
          status: 'uploading',
          assignmentOfferingId: data.assignmentOfferingId ?? null,
          submissionResultId: submissionResult.id,
          retryCount: 0,
          isSubmissionForGrading: data.isSubmissionForGrading ?? true,
          feedbackReady: false,
          partnerLink: false,
          submitTime: DateTime.now(),
          filePath: null,
        },
        { client: trx }
      )

      // 3. Upload to S3
      objectKey = `submissions/${submission.id}/input/${archive.clientName}`
      fileBuffer = await fs.readFile(archive.tmpPath!)

      await uploadFileToObjectStorage(
        env.get('S3_BUCKET')!,
        objectKey,
        fileBuffer,
        archive.type || 'application/zip'
      )

      // 4. Update file path
      await submission.merge({ filePath: objectKey }).useTransaction(trx).save()

      // 5. Gather assignment data for queueing
      const assignment = await Assignment.findOrFail(data.workoutId, { client: trx })
      imageTag = assignment.dockerImageTag || 'vt-cs/default-grader:latest'

      // Commit before network call so the external system/jobQueueService can find the submission
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw new Error(
        `Failed to save submission and upload archive: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    // Network call outside of DB transaction
    const { success, jobId } = await this.jobQueueService.enqueue(
      submission.id,
      fileBuffer,
      imageTag,
      2
    )

    // Reload submission since we committed it
    submission = await Submission.findOrFail(submission.id)

    if (!success) {
      await submission.merge({ status: 'pending_queue' }).save()
      console.warn(
        `[SubmissionService] Submission ${submission.id} saved, but grading cluster is down. Queued for retry.`
      )
    } else {
      await submission.merge({ status: 'pending', externalJobId: jobId }).save()
    }

    return { submission, archivePath: objectKey }
  }

  async handleWebhook(payload: any): Promise<void> {
    const {
      submission_id: submissionId,
      status,
      submitted_at: queuedAt,
      started_at: startedAt,
      completed_at: completedAt,
      retry_count: retryCount,
      result,
    } = payload.data

    // Find and update the parent submission
    const submission = await Submission.findOrFail(submissionId)
    await submission.merge({ status, retryCount }).save()

    // If the job finished and has a result block, update the results table
    if (result) {
      const submissionResult = await SubmissionResult.findByOrFail(
        'id',
        submission.submissionResultId
      )

      await submissionResult
        .merge({
          correctnessScore: result.correctness_score,
          toolScore: result.tool_score,
          comments: result.comments,
          commentFormat: result.comment_format ?? result.commentFormat,
          runtimeMs: result.runtime_ms,
          exitCode: result.exit_code,
          testOutput: result.test_output,
          queuedAt: queuedAt ? DateTime.fromISO(queuedAt) : null,
          startedAt: startedAt ? DateTime.fromISO(startedAt) : null,
          completedAt: completedAt ? DateTime.fromISO(completedAt) : null,
        })
        .save()

      const assignment = await Assignment.findOrFail(submission.workoutId)
      const runtimeSeconds = typeof result.runtime_ms === 'number' ? result.runtime_ms / 1000 : null

      if (runtimeSeconds !== null) {
        const currentEstimateSeconds = assignment.estimatedRuntimeSeconds ?? runtimeSeconds
        const updatedEstimateSeconds = Math.max(
          1,
          Math.round((currentEstimateSeconds + runtimeSeconds) / 2)
        )

        assignment.estimatedRuntimeSeconds = updatedEstimateSeconds
        await assignment.save()

        if (assignment.dockerImageTag) {
          await this.jobQueueService.syncRuntimeEstimateForImageTag(
            assignment.dockerImageTag,
            updatedEstimateSeconds
          )
        }
      }

      if (result.has_payload && result.payload_url) {
        const fileBuffer = await this.jobQueueService.downloadPayload(result.payload_url)

        if (fileBuffer) {
          const objectKey = `submissions/${submissionId}/output/results_payload.zip`
          await uploadFileToObjectStorage(
            env.get('S3_BUCKET')!,
            objectKey,
            fileBuffer,
            'application/zip'
          )
          submissionResult.artifactFilePath = objectKey
          await submissionResult.save()
        }
      }

      // Update submission to show feedback is ready for the student UI
      await submission.merge({ feedbackReady: true }).save()
    }

    console.info('[SubmissionService] handleWebhook() processed', {
      submissionId,
      status,
      retryCount,
      hasResult: !!result,
      feedbackReady: submission.feedbackReady,
    })
  }
}
