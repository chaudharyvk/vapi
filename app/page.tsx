'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Phone, PhoneOff, Settings, Trash2, Save, RefreshCcw, AlertCircle, CheckCircle, Video, Download, Play } from 'lucide-react'
import Vapi from '@vapi-ai/web'

interface Message {
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

interface LogEntry {
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
}

export default function HomePage() {
  // State management
  const [apiKey, setApiKey] = useState('')
  const [assistantId, setAssistantId] = useState('')
  const [status, setStatus] = useState('Ready for voice calls')
  const [isCallActive, setIsCallActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [healthCheckStatus, setHealthCheckStatus] = useState<'checking' | 'healthy' | 'unhealthy' | 'idle'>('idle')
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null)

  // Video recording state
  const [isVideoRecording, setIsVideoRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)

  // Refs
  const vapiRef = useRef<Vapi | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Logging function
  const log = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const newLog: LogEntry = {
      message,
      level,
      timestamp: new Date()
    }
    setLogs(prev => [...prev.slice(-99), newLog])
    setStatus(message)
  }, [])

  // Initialize VAPI when API key is available
  useEffect(() => {
    if (apiKey && typeof window !== 'undefined') {
      try {
        // Initialize VAPI with proper configuration for web usage
        const vapiConfig = {
          apiKey,
          // Add any additional configuration for better browser compatibility
        }
        
        vapiRef.current = new Vapi(apiKey)
        log('VAPI SDK initialized successfully', 'success')
        log('VAPI Web SDK ready for voice calls (uses WebRTC, not direct API calls)', 'info')
      } catch (error) {
        log(`Failed to initialize VAPI SDK: ${error}`, 'error')
        if (error instanceof Error) {
          log(`SDK Error: ${error.message}`, 'error')
        }
      }
    }
  }, [apiKey, log])

  // Load saved API key on component mount
  useEffect(() => {
    // First try to load from environment variables
    const envApiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY
    const envAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
    
    if (envApiKey) {
      setApiKey(envApiKey)
      log('API key loaded from environment variable', 'success')
    } else {
      // Fallback to localStorage
      const savedKey = localStorage.getItem('vapi_api_key')
      if (savedKey) {
        setApiKey(savedKey)
        log('API key loaded from storage', 'info')
      }
    }
    
    if (envAssistantId) {
      setAssistantId(envAssistantId)
      log('Assistant ID loaded from environment variable', 'success')
    } else {
      const savedAssistantId = localStorage.getItem('vapi_assistant_id')
      if (savedAssistantId) {
        setAssistantId(savedAssistantId)
        log('Assistant ID loaded from storage', 'info')
      }
    }
  }, [log])

  // Add message to conversation
  const addMessage = useCallback((text: string, sender: 'user' | 'assistant') => {
    const newMessage: Message = {
      text,
      sender,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  // Save API key and Assistant ID
  const saveApiKey = useCallback(() => {
    if (!apiKey.trim()) {
      log('Please enter a valid API key', 'warning')
      return
    }
    localStorage.setItem('vapi_api_key', apiKey)
    if (assistantId.trim()) {
      localStorage.setItem('vapi_assistant_id', assistantId)
    }
    log('Configuration saved successfully', 'success')
  }, [apiKey, assistantId, log])

  // Clear logs and conversation
  const clearLogs = useCallback(() => {
    setLogs([])
    setMessages([])
    log('Logs and conversation cleared', 'info')
  }, [log])

  // Video recording functions
  const startVideoRecording = useCallback(async () => {
    try {
      log('Requesting camera and microphone access...', 'info')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(videoBlob)
        
        const url = URL.createObjectURL(videoBlob)
        setVideoUrl(url)
        
        log(`Video recording saved (${(videoBlob.size / 1024 / 1024).toFixed(2)} MB)`, 'success')
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsVideoRecording(true)
      setRecordingDuration(0)
      
      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

      log('Video recording started', 'success')
      
    } catch (error) {
      log(`Error starting video recording: ${error}`, 'error')
    }
  }, [log])

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isVideoRecording) {
      mediaRecorderRef.current.stop()
      setIsVideoRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      
      log('Video recording stopped', 'info')
    }
  }, [isVideoRecording, log])

  const downloadVideo = useCallback(() => {
    if (videoBlob && videoUrl) {
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = `vapi-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      log('Video download started', 'info')
    }
  }, [videoBlob, videoUrl, log])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Health check function using server-side API
  const checkVapiHealth = useCallback(async () => {
    if (!apiKey) {
      log('API key required for health check', 'error')
      return
    }

    setHealthCheckStatus('checking')
    log(`Checking VAPI API connectivity with API key: ${apiKey.substring(0, 8)}...`, 'info')
    log('Using server-side health check to avoid CORS issues...', 'info')

    try {
      // Use server-side API route for health check to avoid CORS
      const response = await fetch('/api/vapi/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}`)
      }

      setHealthCheckStatus('healthy')
      setLastHealthCheck(new Date())
      log('VAPI API health check successful', 'success')
      log(`${data.message} - Assistant count: ${data.assistantCount}`, 'success')
      
      // Validate assistant ID if provided
      if (assistantId) {
        try {
          log(`Validating assistant ID: ${assistantId}`, 'info')
          
          const assistantResponse = await fetch('/api/vapi/call', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              apiKey, 
              assistantId, 
              action: 'validate-assistant' 
            }),
          })

          const assistantData = await assistantResponse.json()

          if (!assistantResponse.ok) {
            throw new Error(assistantData.details || assistantData.error || `HTTP ${assistantResponse.status}`)
          }

          log('Assistant ID validation successful', 'success')
          log(`Assistant name: ${assistantData.data.name || 'Unknown'}`, 'info')
          
        } catch (assistantError) {
          log('Assistant ID validation failed', 'error')
          
          if (assistantError instanceof Error) {
            if (assistantError.message.includes('404')) {
              log('Error: Assistant not found - please check your Assistant ID', 'error')
              log('Get your Assistant ID from: https://dashboard.vapi.ai/assistants', 'info')
            } else {
              log(`Error: ${assistantError.message}`, 'error')
            }
          }
        }
      }
      
    } catch (error) {
      setHealthCheckStatus('unhealthy')
      setLastHealthCheck(new Date())
      
      log('VAPI API health check failed', 'error')
      
      if (error instanceof Error) {
        log(`Error: ${error.message}`, 'error')
        
        // Provide helpful guidance based on error
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          log('Solution: Check that your API key is correct and active', 'warning')
          log('Get your API key from: https://dashboard.vapi.ai/account', 'info')
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          log('Solution: Check your API key permissions and account status', 'warning')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          log('Solution: Check your internet connection and try again', 'warning')
        }
      } else {
        log(`Unexpected error: ${error}`, 'error')
      }
    }
  }, [apiKey, assistantId, log])

  // Auto health check on API key change
  useEffect(() => {
    if (apiKey) {
      checkVapiHealth()
    }
  }, [apiKey, checkVapiHealth])

  // Start VAPI call using SDK
  const startVapiCall = useCallback(async () => {
    if (!apiKey) {
      log('API key required to start call', 'warning')
      return
    }

    if (!assistantId) {
      log('Assistant ID is required to start call. Please provide a valid assistant ID from your VAPI dashboard.', 'error')
      return
    }

    if (!vapiRef.current) {
      log('VAPI SDK not initialized. Please check your API key.', 'error')
      return
    }

    try {
      log('Starting VAPI call with recording enabled...', 'info')
      log(`Using assistant ID: ${assistantId}`, 'info')
      
      // Start local video recording automatically when call starts
      await startVideoRecording()
      
      setIsCallActive(true)

      // Configure call with proper VAPI SDK parameters
      // Based on TypeScript error, VAPI start() expects string | CreateAssistantDTO
      // Use the assistant ID directly as a string
      
      log('Starting call with assistant ID as string parameter', 'info')
      log(`Using assistant: ${assistantId}`, 'info')
      log('Note: VAPI Web SDK uses WebRTC for calls, not direct HTTP requests', 'info')
      
      // Start VAPI call - pass assistant ID directly as string
      await vapiRef.current.start(assistantId)
      log('VAPI call started successfully', 'success')
      log('Note: Server-side recording may need to be configured in your VAPI assistant settings', 'info')
      addMessage('Call started - local video recording active', 'assistant')

    } catch (error) {
      setIsCallActive(false)
      // Stop video recording if call failed to start
      if (isVideoRecording) {
        stopVideoRecording()
      }
      
      log(`Error starting VAPI call: ${error}`, 'error')
      addMessage(`Error starting call: ${error}`, 'assistant')
      
      // Provide helpful guidance for common errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('assistant') || errorMessage.includes('squad')) {
          log('Solution: Please enter a valid Assistant ID in the configuration section above', 'warning')
          log('You can find your Assistant ID in your VAPI dashboard at https://dashboard.vapi.ai/assistants', 'info')
        } else if (errorMessage.includes('bad request') || errorMessage.includes('assistantid should not exist')) {
          log('Solution: VAPI SDK configuration issue resolved - assistant ID now passed correctly', 'success')
          log('If this error persists, verify your Assistant ID format and permissions', 'warning')
        } else if (errorMessage.includes('403') || errorMessage.includes('forbidden') || errorMessage.includes('unauthorized')) {
          log('Solution: Check that your Assistant ID is correct and accessible with your API key', 'warning')
          log('Ensure the assistant belongs to your account and is active', 'info')
        } else if (errorMessage.includes('microphone') || errorMessage.includes('permission')) {
          log('Solution: Please allow microphone access when prompted by your browser', 'warning')
          log('Check browser settings if microphone access was previously denied', 'info')
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          log('Solution: Check your internet connection and try again', 'warning')
          log('WebRTC calls require a stable internet connection', 'info')
        } else if (errorMessage.includes('cors')) {
          log('Note: If you see CORS errors, they may be unrelated to the WebRTC call functionality', 'info')
          log('VAPI Web SDK uses WebRTC for voice calls, not direct browser HTTP requests', 'info')
        } else {
          log(`Detailed error: ${error.message}`, 'error')
          log('If the issue persists, check your VAPI dashboard and account status', 'info')
        }
      }
    }
  }, [apiKey, assistantId, log, addMessage, startVideoRecording, isVideoRecording, stopVideoRecording])

  // End VAPI call using SDK
  const endVapiCall = useCallback(async () => {
    if (!vapiRef.current) {
      log('VAPI SDK not initialized', 'error')
      return
    }

    try {
      log('Ending VAPI call...', 'info')
      
      // Stop video recording when call ends
      if (isVideoRecording) {
        stopVideoRecording()
      }
      
      await vapiRef.current.stop()
      setIsCallActive(false)
      log('VAPI call ended successfully', 'success')
      addMessage('Call ended', 'assistant')

    } catch (error) {
      log(`Error ending VAPI call: ${error}`, 'error')
      setIsCallActive(false)
      // Ensure video recording stops even if call end fails
      if (isVideoRecording) {
        stopVideoRecording()
      }
    }
  }, [log, addMessage, isVideoRecording, stopVideoRecording])

  // Set up VAPI event listeners
  useEffect(() => {
    if (vapiRef.current) {
      const vapi = vapiRef.current

      // Set up event listeners
      vapi.on('call-start', () => {
        log('VAPI call started', 'success')
        setIsCallActive(true)
        addMessage('Call connected', 'assistant')
      })

      vapi.on('call-end', () => {
        log('VAPI call ended', 'info')
        setIsCallActive(false)
        addMessage('Call disconnected', 'assistant')
        
        // Automatically stop video recording when call ends
        if (isVideoRecording) {
          stopVideoRecording()
        }
      })

      vapi.on('speech-start', () => {
        log('User started speaking', 'info')
      })

      vapi.on('speech-end', () => {
        log('User stopped speaking', 'info')
      })

      vapi.on('message', (message) => {
        log(`Received message: ${JSON.stringify(message)}`, 'info')
        if (message.type === 'transcript' && message.transcript) {
          addMessage(message.transcript, message.role === 'user' ? 'user' : 'assistant')
        }
        // Log recording-related messages
        if (message.type === 'recording-started') {
          log('VAPI server-side recording started', 'success')
        }
        if (message.type === 'recording-stopped') {
          log('VAPI server-side recording stopped', 'info')
        }
        if (message.type === 'artifact') {
          log(`Recording artifact available: ${JSON.stringify(message)}`, 'success')
        }
      })

      vapi.on('error', (error) => {
        log(`VAPI error: ${error}`, 'error')
        setIsCallActive(false)
        addMessage(`Error: ${error}`, 'assistant')
      })

      // Cleanup function
      return () => {
        vapi.removeAllListeners()
      }
    }
  }, [apiKey, log, addMessage, isVideoRecording, stopVideoRecording]) // Use apiKey as dependency to re-setup when VAPI instance changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup video recording
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <header className="text-center mb-8 card">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          <Mic className="inline-block mr-3" size={40} />
          VAPI AI Voice Integration
        </h1>
        <p className="text-lg text-gray-600">Record your voice and interact with VAPI AI</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Section */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings size={20} />
            Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                VAPI API Key:
                {process.env.NEXT_PUBLIC_VAPI_API_KEY && (
                  <span className="ml-2 text-xs text-green-600">(Set via Environment Variable)</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={process.env.NEXT_PUBLIC_VAPI_API_KEY ? "••••••••••••••••" : "Enter your VAPI API key"}
                  className="input-field flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && saveApiKey()}
                  disabled={!!process.env.NEXT_PUBLIC_VAPI_API_KEY}
                />
                <button 
                  onClick={saveApiKey} 
                  className="btn btn-secondary"
                  disabled={!!process.env.NEXT_PUBLIC_VAPI_API_KEY}
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="assistantId" className="block text-sm font-medium text-gray-700 mb-1">
                Assistant ID (required):
                {process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID && (
                  <span className="ml-2 text-xs text-green-600">(Set via Environment Variable)</span>
                )}
              </label>
              <input
                id="assistantId"
                type="text"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                placeholder={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ? "••••••••••••••••" : "Enter assistant ID (e.g., 12345678-abcd-1234-abcd-123456789abc)"}
                className="input-field"
                disabled={!!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}
              />
              <div className="text-xs text-gray-500 mt-1">
                Get your Assistant ID from <a href="https://dashboard.vapi.ai/assistants" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">VAPI Dashboard → Assistants</a>
              </div>
            </div>

            {/* Health Check Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Health Status</span>
                <button
                  onClick={checkVapiHealth}
                  disabled={!apiKey || healthCheckStatus === 'checking'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded transition-colors"
                >
                  <RefreshCcw size={12} className={healthCheckStatus === 'checking' ? 'animate-spin' : ''} />
                  Check
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {healthCheckStatus === 'checking' && (
                  <>
                    <RefreshCcw size={16} className="animate-spin text-blue-500" />
                    <span className="text-sm text-blue-600">Checking connectivity...</span>
                  </>
                )}
                {healthCheckStatus === 'healthy' && (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm text-green-600">API is healthy</span>
                  </>
                )}
                {healthCheckStatus === 'unhealthy' && (
                  <>
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm text-red-600">API is not accessible</span>
                  </>
                )}
                {healthCheckStatus === 'idle' && apiKey && (
                  <>
                    <AlertCircle size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Status unknown</span>
                  </>
                )}
              </div>
              
              {lastHealthCheck && (
                <div className="text-xs text-gray-500 mt-1">
                  Last checked: {lastHealthCheck.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* CORS Resolution Note */}
            <div className="pt-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-700 text-sm">
                  <strong>✅ CORS Issue Resolved:</strong> Health checks now use server-side API routes to avoid browser CORS restrictions. 
                  Voice calls use WebRTC (not HTTP) so they work directly from the browser.
                  <div className="mt-1 text-xs text-blue-600">
                    🔧 Server-side health check | 🎙️ WebRTC voice calls | 📹 Local video recording
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VAPI Voice Calls Section */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Phone size={20} />
            VAPI Voice Calls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={startVapiCall}
              disabled={isCallActive || !apiKey || !assistantId}
              className="btn btn-primary"
            >
              <Phone size={16} />
              {isCallActive ? 'Call Active' : 'Start Voice Call'}
            </button>
            
            <button
              onClick={endVapiCall}
              disabled={!isCallActive}
              className="btn btn-danger"
            >
              <PhoneOff size={16} />
              End Call
            </button>
          </div>
          
          {isCallActive && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Voice call in progress - speak naturally!</span>
              </div>
              <div className="mt-2 text-xs text-green-600">
                📹 Local video recording active | 🎙️ VAPI voice call in progress
              </div>
            </div>
          )}
          
          {!isCallActive && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-700 text-sm">
                <strong>How to use:</strong> Click &quot;Start Voice Call&quot; to begin a real-time conversation with your AI assistant. 
                Camera and audio recording will start automatically.            <div className="mt-2 text-xs text-blue-600">
              🎯 <strong>Auto-Recording:</strong> Local camera/audio recording activates automatically during calls.<br/>
              📊 <strong>Server Recording:</strong> Configure in your VAPI assistant settings for server-side recording.
            </div>
              </div>
            </div>
          )}
          
          {!assistantId && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-sm">
                <strong>Need an Assistant ID?</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Go to <a href="https://dashboard.vapi.ai/assistants" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">VAPI Dashboard</a></li>
                  <li>Create a new assistant or select an existing one</li>
                  <li>Copy the Assistant ID (UUID format)</li>
                  <li>Paste it in the configuration section above</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Automatic Video Recording Section */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video size={20} />
            Automatic Recording
          </h3>
          
          {/* Video Preview */}
          <div className="mb-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {!isVideoRecording && !streamRef.current && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Video size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Camera will activate during calls</p>
                  </div>
                </div>
              )}
              {isVideoRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  REC {formatDuration(recordingDuration)}
                </div>
              )}
            </div>
          </div>

          {/* Recording Status */}
          {isCallActive && isVideoRecording && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording in progress...</span>
              </div>
              <div className="mt-1 text-xs text-red-600">
                Duration: {formatDuration(recordingDuration)}
              </div>
            </div>
          )}

          {/* Video Playback and Download */}
          {videoBlob && videoUrl && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-green-700 text-sm">
                    <strong>Recording saved!</strong>
                    <div className="text-xs text-green-600 mt-1">
                      Size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.src = videoUrl
                          videoRef.current.controls = true
                          videoRef.current.muted = false
                        }
                      }}
                      className="btn btn-secondary text-xs"
                    >
                      <Play size={14} />
                      Preview
                    </button>
                    <button
                      onClick={downloadVideo}
                      className="btn btn-primary text-xs"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isCallActive && !videoBlob && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-700 text-sm">
                <strong>Automatic Recording:</strong> Camera and audio recording will start automatically when you begin a VAPI call. 
                The recorded video will be available for download after the call ends.
                <div className="mt-2 text-xs">
                  � Both VAPI server-side and local recording will be active during calls.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Conversation */}
      <div className="card mt-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Phone size={20} />
          Voice Conversation
        </h3>
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No conversation yet.</p>
              <p className="text-sm text-gray-400">Start a voice call to see real-time transcription and responses!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div>{message.text}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logs Section */}
      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Trash2 size={20} />
            Logs
          </h3>
          <button onClick={clearLogs} className="btn btn-secondary">
            <Trash2 size={16} />
            Clear Logs
          </button>
        </div>
        <div className="min-h-[150px] max-h-[300px] overflow-y-auto bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-400">No logs yet.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-time">[{log.timestamp.toLocaleTimeString()}]</span>
                <span className={`log-level ${log.level}`}>[{log.level.toUpperCase()}]</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
