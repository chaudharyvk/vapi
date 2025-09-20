import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export const runtime = 'nodejs'

function resolveBucketName() {
  return process.env.GOOGLE_CLOUD_BUCKET_NAME || process.env.GCP_BUCKET_NAME || 'vapi_video_recording'
}

function getBucket() {
  const bucketName = resolveBucketName()

  // Prefer explicit service account JSON or components from env
  const saJsonRaw =
    process.env.GCP_SERVICE_ACCOUNT_KEY ||
    process.env.GCP_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64 ||
    undefined

  const gcProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID
  const gcClientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
  const gcPrivateKeyMaybe = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PRIVATE_KEY

  let storage: Storage

  if (saJsonRaw) {
    let jsonStr = saJsonRaw
    // If base64, decode
    if (!saJsonRaw.trim().startsWith('{')) {
      try {
        jsonStr = Buffer.from(saJsonRaw, 'base64').toString('utf8')
      } catch {
        // ignore, will try to parse as-is
      }
    }
    const key = JSON.parse(jsonStr)
    const projectId = gcProjectId || key.project_id
    storage = new Storage({
      projectId,
      credentials: {
        client_email: key.client_email,
        private_key: (key.private_key as string)?.replace(/\\n/g, '\n')
      }
    })
  } else if (gcProjectId && gcClientEmail && gcPrivateKeyMaybe) {
    // Handle case where separate vars are provided; gcPrivateKeyMaybe can be PEM or base64 JSON
    if (gcPrivateKeyMaybe.trim().startsWith('{')) {
      // Provided JSON
      const key = JSON.parse(gcPrivateKeyMaybe)
      const projectId = gcProjectId || key.project_id
      storage = new Storage({
        projectId,
        credentials: {
          client_email: key.client_email || gcClientEmail,
          private_key: ((key.private_key as string) || '').replace(/\\n/g, '\n')
        }
      })
    } else if (gcPrivateKeyMaybe.includes('BEGIN PRIVATE KEY')) {
      // Provided PEM private key
      storage = new Storage({
        projectId: gcProjectId,
        credentials: {
          client_email: gcClientEmail,
          private_key: gcPrivateKeyMaybe.replace(/\\n/g, '\n')
        }
      })
    } else {
      // Try base64 decode as JSON
      try {
        const jsonStr = Buffer.from(gcPrivateKeyMaybe, 'base64').toString('utf8')
        const key = JSON.parse(jsonStr)
        const projectId = gcProjectId || key.project_id
        storage = new Storage({
          projectId,
          credentials: {
            client_email: key.client_email || gcClientEmail,
            private_key: ((key.private_key as string) || '').replace(/\\n/g, '\n')
          }
        })
      } catch {
        // Fallback to ADC
        storage = new Storage()
      }
    }
  } else {
    // Fallback to ADC (e.g., workload identity, env var path config)
    storage = new Storage()
  }

  const bucket = storage.bucket(bucketName)
  return bucket
}

function publicBaseUrl() {
  return process.env.GOOGLE_CLOUD_STORAGE_BASE_URL || 'https://storage.googleapis.com'
}

function isValidSessionId(id: string) {
  // basic validation: uuid or simple safe string
  return /^[a-zA-Z0-9-_]{6,}$/.test(id)
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId') || ''
    const indexStr = url.searchParams.get('index') || ''
    const mimeType = url.searchParams.get('mimeType') || 'application/octet-stream'

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 })
    }
    const index = Number(indexStr)
    if (!Number.isFinite(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid chunk index' }, { status: 400 })
    }

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const paddedIndex = String(index).padStart(6, '0')
    const ext = mimeType.includes('webm') ? 'webm' : 'bin'
    const objectPath = `${sessionId}/chunks/${paddedIndex}.${ext}`

    const bucket = getBucket()
    const file = bucket.file(objectPath)
    await file.save(buffer, {
      contentType: mimeType,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          sessionId,
          index: String(index),
          uploadedAt: new Date().toISOString(),
        }
      }
    })

    // Optionally make object public for anonymous access
    try {
      if (process.env.GOOGLE_CLOUD_PUBLIC_READ === 'true') {
        await file.makePublic()
      }
    } catch (e) {
      // Ignore ACL errors (e.g., if Uniform Bucket-Level Access is enabled)
      console.warn('makePublic failed or skipped:', e)
    }

    const base = publicBaseUrl()
    const bucketName = resolveBucketName()
    const urlPublic = `${base}/${bucketName}/${objectPath}`
    return NextResponse.json({ ok: true, path: objectPath, url: urlPublic })
  } catch (error) {
    console.error('Chunk upload error', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
