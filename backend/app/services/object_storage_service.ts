import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
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
  fileBuffer: Buffer,
  contentType?: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  )
}

export async function downloadFileFromObjectStorage(bucket: string, key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )

  if (!response.Body) {
    throw new Error('Object storage response body is empty')
  }

  return Buffer.from(await response.Body.transformToByteArray())
}
