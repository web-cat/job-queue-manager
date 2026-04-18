import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream } from 'node:fs'
import env from '#start/env'

const s3 = new S3Client({
  region: env.get('AWS_REGION', 'us-east-1'),
  endpoint: env.get('S3_ENDPOINT'),
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
  },
})

export async function uploadFileToObjectStorage(
  bucket: string,
  key: string,
  filePath: string,
  contentType?: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    })
  )
}
