# VAPI AI Voice Integration - Next.js TypeScript

A modern Next.js TypeScript application for integrating with VAPI AI's voice API, featuring real-time voice recording, audio visualization, and seamless API communication.

## 🚀 Features

### 🎙️ Voice Recording & Video Capture
- High-quality audio recording with noise suppression and echo cancellation
- Video recording with camera preview and real-time feedback
- Recording timer and intuitive controls for both audio and video
- Download recorded videos in WebM format
- Audio playback and video preview functionality

### 🤖 VAPI AI Integration
- Direct integration with VAPI AI Web SDK
- Real-time voice calls with assistants
- Message transcription and conversation logging
- Configurable assistant settings

### 🎨 Modern UI/UX
- Responsive design built with Tailwind CSS
- Beautiful gradient backgrounds and smooth animations
- Real-time status updates and comprehensive logging
- Mobile-first responsive design with 3-column layout

### ⚡ Technical Features
- Next.js 14 with App Router
- TypeScript for type safety
- Client-side rendering for audio/video APIs
- Local storage for API key management
- Error handling and comprehensive logging

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18.0.0 or higher
- npm or yarn package manager
- A VAPI AI account and API key
- Modern web browser with WebRTC support

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### 1. Environment Variables (Recommended)
Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_VAPI_API_KEY=your_actual_vapi_api_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id_here
```

### 2. Manual Configuration (Alternative)
If you don't use environment variables:
1. Open the application in your browser
2. Enter your VAPI API key in the configuration section
3. (Optional) Enter an Assistant ID if you have a specific assistant configured
4. Click "Save" to store your credentials locally

### 3. Get Your VAPI Credentials

#### API Key:
1. Sign up at [VAPI AI](https://vapi.ai/)
2. Navigate to your [dashboard](https://dashboard.vapi.ai/)
3. Go to the "API Keys" section
4. Copy your API key

#### Assistant ID:
1. In your VAPI dashboard, go to "Assistants"
2. Either create a new assistant or select an existing one
3. Copy the Assistant ID (should be a UUID format like: `01234567-89ab-cdef-0123-456789abcdef`)
4. Make sure the assistant is properly configured with:
   - A voice model
   - An AI model (like GPT-3.5 or GPT-4)
   - Appropriate prompts and settings

**Important**: The Assistant ID must be valid and accessible with your API key, otherwise you'll get a 403 Forbidden error.

### 4. Grant Microphone Permissions
- When prompted, allow microphone access for voice calls
- Ensure your browser supports WebRTC (Chrome, Firefox, Safari, Edge)

## 📱 Usage Guide

### Voice Calls with VAPI SDK
1. **Configure**: Enter your API key and Assistant ID in the settings
2. **Health Check**: Use the "Check VAPI Health" button to verify your configuration
3. **Start Call**: Click the "Start Call" button to begin a voice conversation
4. **Speak**: Talk naturally with the AI assistant
5. **End Call**: Click "End Call" when finished
6. **Review**: Check the conversation history and logs for details

### Video Recording
1. **Start Recording**: Click "Start Recording" to begin capturing video and audio
2. **Camera Preview**: See your camera feed in real-time during recording
3. **Recording Indicator**: A red "REC" indicator shows recording status and duration
4. **Stop Recording**: Click "Stop Recording" to finish and save the video
5. **Preview & Download**: Preview the recorded video and download it as a WebM file
6. **Concurrent Use**: Record video while having VAPI voice calls for complete session capture

### VAPI Integration
1. **API Health Check**: The application automatically checks VAPI API connectivity when you enter your API key
2. **Start Call**: Use "Start Call" button to initiate a voice call with your configured assistant
3. **End Call**: Click "End Call" to terminate the active voice conversation
4. **View Messages**: All conversation messages are displayed in the chat interface
5. **Check Logs**: Monitor all activities and API responses in the logs section

### Health Check Feature
- **Automatic Check**: The app automatically verifies API connectivity when you enter your API key
- **Manual Check**: Click the "Check" button next to the health status to manually verify connectivity
- **Status Indicators**: 
  - 🟢 Green: API is healthy and accessible
  - 🔴 Red: API is not accessible (check your API key or network)
  - 🔵 Blue: Currently checking connectivity
  - ⚪ Gray: Status unknown (enter API key to check)
- **Detailed Errors**: Check the logs section for detailed error messages if health check fails

### Conversation & Logs
- View conversation history in the dedicated section
- Monitor system logs for debugging and activity tracking
- Clear logs and conversation as needed

## 🏗️ Project Structure

```
vapi/
├── app/
│   ├── api/                 # Server-side API routes
│   │   └── vapi/           # VAPI-related endpoints
│   │       ├── health/     # Health check endpoint
│   │       │   └── route.ts
│   │       └── call/       # Call management endpoint
│   │           └── route.ts
│   ├── globals.css          # Global styles with Tailwind CSS
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main application page
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
└── postcss.config.js       # PostCSS configuration
```

## 🏛️ Architecture & CORS Solution

### Hybrid Architecture for CORS Resolution

This application uses a hybrid architecture to resolve CORS issues while maintaining optimal performance:

#### 🖥️ Server-Side Components
- **Health Checks**: `/api/vapi/health` - Server-side API validation to avoid CORS
- **Assistant Validation**: `/api/vapi/call` - Server-side assistant verification  
- **API Key Testing**: Server-side VAPI API calls for configuration validation

#### 🌐 Client-Side Components  
- **Voice Calls**: Direct WebRTC connection via VAPI Web SDK (no CORS issues)
- **Video Recording**: Local MediaRecorder API for camera and audio capture
- **UI Management**: React state management for real-time updates

#### 🔄 Data Flow
1. **Configuration**: API keys validated server-side through Next.js API routes
2. **Health Checks**: Server-side calls to VAPI API with proper authentication headers
3. **Voice Calls**: Client-side WebRTC through VAPI SDK (bypasses CORS entirely)
4. **Recording**: Local browser APIs for video/audio capture and processing

This architecture ensures:
- ✅ No CORS issues for health checks (server-side)
- ✅ No CORS issues for voice calls (WebRTC)
- ✅ Proper error handling with detailed feedback
- ✅ Secure API key handling

## 🎯 Key Components

### Main Application (`app/page.tsx`)
- React state management for voice calls and video recording  
- VAPI Web SDK integration with WebRTC for voice calls
- Automatic video recording synchronized with voice calls
- Real-time UI updates and comprehensive logging system
- Client-side audio/video capture using MediaRecorder API

### API Routes (`app/api/vapi/`)
- **Health Check Route** (`health/route.ts`): Server-side VAPI API validation
- **Call Management Route** (`call/route.ts`): Server-side assistant validation and call management
- Eliminates CORS issues by handling API calls server-side
- Secure API key handling without exposing keys in browser

### CORS-Free Architecture
- **Voice Calls**: WebRTC through VAPI SDK (no HTTP requests to VAPI API)
- **Health Checks**: Server-side Next.js API routes with proper CORS headers
- **Video Recording**: Local browser MediaRecorder API (no external requests)
- **Configuration**: Environment variables and localStorage for secure key management

## 🚀 Building for Production

1. **Build the application:**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Start the production server:**
   ```bash
   npm start
   # or
   yarn start
   ```

3. **Deploy:**
   Deploy to your preferred platform (Vercel, Netlify, etc.)

## 🔍 Browser Compatibility

### Supported Browsers
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### Required Features
- WebRTC support for voice calls
- Microphone access permissions
- ES2017+ JavaScript support
- Local Storage API

## 🔧 Troubleshooting

### Common Issues

#### ✅ CORS (Cross-Origin Resource Sharing) Errors - RESOLVED
**Previous Issue:** You might see CORS errors like "Response {data: null, error: {...}, type: 'cors'}" in the browser console.

**✅ Solution Implemented:**
This application now handles CORS issues through several mechanisms:

1. **Server-Side Health Checks**: API connectivity checks are now performed server-side using Next.js API routes (`/api/vapi/health`) to avoid browser CORS restrictions.

2. **WebRTC for Voice Calls**: VAPI voice calls use WebRTC technology, which doesn't require direct HTTP calls from the browser to `api.vapi.ai`, eliminating CORS issues for the core functionality.

3. **Hybrid Architecture**: 
   - ✅ Health checks and validation: Server-side API routes
   - ✅ Voice calls: WebRTC (no CORS issues)  
   - ✅ Video recording: Local MediaRecorder API

**What This Means:**
- The CORS error you see may be related to health checks, but won't affect voice calls
- Voice calls work directly through WebRTC without HTTP requests
- Health status is now checked server-side to provide accurate API validation
- The application functions fully despite any residual CORS messages

**Verification:**
- Look for the "✅ CORS Issue Resolved" notice in the configuration section
- Health checks should complete successfully
- Voice calls should work without CORS-related failures

#### 403 Forbidden Error: "Key doesn't allow assistantId"
**Solution:**
1. Verify your Assistant ID is correct in your VAPI dashboard
2. Ensure the assistant exists and is properly configured
3. Check that your API key has permission to use that assistant
4. Make sure the Assistant ID is a valid UUID format
5. Try creating a new assistant and using its ID

#### Microphone Access Denied
**Solution:**
1. Grant microphone permissions in your browser
2. Check browser settings for microphone access
3. Ensure you're using HTTPS (required for microphone access)
4. Try refreshing the page and allowing permissions again

#### VAPI SDK Initialization Failed
**Solution:**
1. Verify your API key is correct
2. Check your internet connection
3. Ensure you're using a supported browser
4. Check the browser console for detailed error messages

#### Call Not Starting
**Solution:**
1. Run the health check to verify your configuration
2. Check that your assistant has a voice model configured
3. Ensure your assistant has an AI model (GPT-3.5, GPT-4, etc.)
4. Verify the assistant's prompts and settings are complete

### Getting Help
- Check the [VAPI Documentation](https://docs.vapi.ai/)
- Visit the [VAPI Discord](https://discord.gg/vapi) for community support
- Review the browser console for detailed error messages

## 📄 License

This project is provided as-is for educational and development purposes. Please ensure compliance with VAPI AI's terms of service and your local privacy regulations when using voice recording features.
