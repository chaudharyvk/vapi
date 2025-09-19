# VAPI AI Voice Integration - Next.js TypeScript

A modern Next.js TypeScript application for integrating with VAPI AI's voice API, featuring real-time voice recording, audio visualization, and seamless API communication.

## 🚀 Features

### 🎙️ Voice Recording
- High-quality audio recording with noise suppression and echo cancellation
- Real-time audio visualization with frequency analysis
- Recording timer and intuitive controls
- Audio playback functionality before sending

### 🤖 VAPI AI Integration
- Direct integration with VAPI AI Web SDK
- Real-time voice calls with assistants
- Message transcription and conversation logging
- Configurable assistant settings

### 🎨 Modern UI/UX
- Responsive design built with Tailwind CSS
- Beautiful gradient backgrounds and smooth animations
- Real-time status updates and comprehensive logging
- Mobile-first responsive design

### ⚡ Technical Features
- Next.js 14 with App Router
- TypeScript for type safety
- Client-side rendering for audio APIs
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
│   ├── globals.css          # Global styles with Tailwind CSS
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main application page
├── components/
│   └── VapiClient.tsx       # VAPI integration component
├── types/
│   └── vapi.d.ts           # TypeScript type definitions
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
└── postcss.config.js       # PostCSS configuration
```

## 🎯 Key Components

### Main Application (`app/page.tsx`)
- State management for recording and VAPI integration
- Audio recording with MediaRecorder API
- Real-time audio visualization using Web Audio API
- Recording timer and status management

### VAPI Client (`components/VapiClient.tsx`)
- VAPI Web SDK integration
- Event handling for call states
- Dynamic import to avoid SSR issues

### Type Definitions (`types/vapi.d.ts`)
- TypeScript interfaces for VAPI SDK
- State management types
- Message and log entry interfaces

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
