# VAPI AI Voice Integration - Next.js TypeScript

A modern Next.js TypeScript application for integrating with VAPI AI's voice API using the official Web SDK, featuring real-time voice calls, automatic local video recording, and server-side recording support.

## 🚀 Features

### 🎙️ Voice Calls & Video Capture
- Real-time voice calls via VAPI Web SDK (WebRTC)
- Automatic camera + microphone recording during calls (MediaRecorder)
- Local video preview and download (WebM)
- Server-side recording enabled via assistant overrides
- NEW: Chunked uploads of local camera+audio recording to GCP bucket

### 🤖 VAPI AI Integration
- Web SDK initialization with API key
- Start/stop calls with an Assistant ID
- Transcript messages and conversation UI
- Health checks and assistant validation via Next.js API routes

### 🔐 Security & CORS
- All HTTP calls to VAPI go through server-side Next.js API routes
- Voice calls use WebRTC and do not hit VAPI HTTP endpoints from browser
- Prefer private server-side VAPI key for API routes

## 📋 Prerequisites
- Node.js 18+
- A VAPI account, API key, and Assistant ID
- A GCP project with a storage bucket

## 🔧 Configuration

Create `.env.local` (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Add your values:

```env
NEXT_PUBLIC_VAPI_API_KEY=your_public_or_any_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id_here

# Prefer a server-only key to avoid 401s from the server routes
VAPI_SERVER_API_KEY=your_private_server_key_here

# GCP settings for chunk uploads
GCP_PROJECT_ID=your_gcp_project_id
GCP_BUCKET_NAME=vapi_video_recording
# One of the following must be provided:
# 1) Raw JSON of service account
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# or base64-encoded JSON
GCP_SERVICE_ACCOUNT_KEY_BASE64=eyJ0eXBlIjoi...
# or GOOGLE_APPLICATION_CREDENTIALS style JSON content
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

Notes:
- For local dev you can paste raw JSON or base64 JSON. In production, prefer a secrets manager.
- Bucket name defaults to `vapi_video_recording` if `GCP_BUCKET_NAME` is not set.

## 🧠 VAPI Server-Side Recording

To enable VAPI server-side recording (audio + video) for web calls, pass assistant overrides when starting the call:

```ts
vapi.start(assistantId, {
  assistantOverrides: {
    artifactPlan: {
      videoRecordingEnabled: true,
    },
    // optionally other overrides
  },
  recordingEnabled: true,
  videoRecordingEnabled: true,
})
```

This app config uses the Web SDK default start(assistantId). Ensure your assistant is configured to produce recording artifacts. Check logs for `recording-started`, `recording-stopped`, and `artifact` messages.

## ☁️ Chunked Uploads to GCP (Local Recording)

During a call, the app starts local camera+mic recording via MediaRecorder and uploads in chunks to GCP.

Flow:
- Generate a session ID (UUID) at recording start
- MediaRecorder emits chunks every 5s
- Each chunk is streamed to `/api/recording/chunk?sessionId=...&index=...`
- On stop, a manifest is written via `/api/recording/complete`

Server routes:
- `app/api/recording/chunk/route.ts` → saves `/{sessionId}/chunks/{index}.webm`
- `app/api/recording/complete/route.ts` → writes `/{sessionId}/manifest.json`

UI shows session ID and uploaded chunk count.

## 🏗️ Project Structure

```
vapi/
├── app/
│   ├── api/
│   │   ├── recording/
│   │   │   ├── chunk/route.ts
│   │   │   └── complete/route.ts
│   │   └── vapi/
│   │       ├── call/route.ts
│   │       └── health/route.ts
│   ├── globals.css
│   └── page.tsx
├── package.json
└── README.md
```

## 🧪 Verify End-to-End

1) Health check: Settings → Check (uses server key if provided)
2) Start a call: camera activates, chunks begin uploading
3) End call: recording stops, manifest is saved
4) Logs show chunk uploads and session ID
5) Confirm GCP objects in bucket `vapi_video_recording`

## ❗ Troubleshooting
- Missing `@google-cloud/storage`: install it: `npm i @google-cloud/storage`
- 401/403 from VAPI routes: set `VAPI_SERVER_API_KEY`
- GCP auth errors: ensure service account JSON is valid and has Storage Object Admin on the bucket
- Safari/WebM: use Chrome for best MediaRecorder support

## 📄 Privacy
Recordings may contain personal data. Obtain consent and follow local regulations.
