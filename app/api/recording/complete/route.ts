import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export const runtime = 'nodejs'

function resolveBucketName() {
  return process.env.GOOGLE_CLOUD_BUCKET_NAME || process.env.GCP_BUCKET_NAME || 'vapi_video_recording'
}

function publicBaseUrl() {
  return process.env.GOOGLE_CLOUD_STORAGE_BASE_URL || 'https://storage.googleapis.com'
}

function getBucket() {
  const defaultBucket = resolveBucketName()

  // Prefer explicit service account JSON in env
  const saJsonRaw = process.env.GCP_SERVICE_ACCOUNT_KEY || process.env.GCP_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64
  let storage: Storage

  if (saJsonRaw) {
    let jsonStr = saJsonRaw
    // If base64, decode
    if (!saJsonRaw.trim().startsWith('{')) {
      try {
        jsonStr = Buffer.from(saJsonRaw, 'base64').toString('utf8')
      } catch {
        // ignore
      }
    }
    const key = JSON.parse(jsonStr)
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || key.project_id
    storage = new Storage({
      projectId,
      credentials: {
        client_email: key.client_email,
        private_key: (key.private_key as string)?.replace(/\\n/g, '\n')
      }
    })
  } else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_CLIENT_EMAIL && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Support separate GOOGLE_CLOUD_* envs and PEM private key
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_APPLICATION_CREDENTIALS as string).replace(/\\n/g, '\n')
      }
    })
  } else {
    // Fallback to ADC
    storage = new Storage()
  }

  return storage.bucket(defaultBucket)
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, totalChunks, mimeType, startedAt, endedAt } = await request.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const manifest = {
      sessionId,
      totalChunks: Number(totalChunks) || 0,
      mimeType: mimeType || 'video/webm',
      startedAt: Number(startedAt) || Date.now(),
      endedAt: Number(endedAt) || Date.now(),
      uploadedAt: new Date().toISOString(),
      bucket: resolveBucketName(),
      version: 1
    }

    const bucket = getBucket()
    const manifestPath = `${sessionId}/manifest.json`
    const file = bucket.file(manifestPath)
    await file.save(Buffer.from(JSON.stringify(manifest, null, 2)), {
      contentType: 'application/json',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=60'
      }
    })

    try {
      if (process.env.GOOGLE_CLOUD_PUBLIC_READ === 'true') {
        await file.makePublic()
      }
    } catch (e) {
      console.warn('makePublic failed or skipped:', e)
    }

    const url = `${publicBaseUrl()}/${resolveBucketName()}/${manifestPath}`
    return NextResponse.json({ ok: true, manifestPath, url })
  } catch (error) {
    console.error('Finalize error', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
