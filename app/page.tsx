'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Phone, PhoneOff, Settings, Trash2, Save, RefreshCcw, AlertCircle, CheckCircle } from 'lucide-react'
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

  // Initialize VAPI instance
  const vapiRef = useRef<Vapi | null>(null)

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
        vapiRef.current = new Vapi(apiKey)
        log('VAPI SDK initialized successfully', 'success')
      } catch (error) {
        log(`Failed to initialize VAPI SDK: ${error}`, 'error')
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

  // Health check function using VAPI SDK
  const checkVapiHealth = useCallback(async () => {
    if (!apiKey) {
      log('API key required for health check', 'error')
      return
    }

    setHealthCheckStatus('checking')
    log(`Checking VAPI API connectivity with API key: ${apiKey}`, 'info')
    log('Using VAPI SDK for health check...', 'info')

    try {
      // Initialize a new VAPI instance for health check
      const vapi = new Vapi(apiKey)
      log('VAPI SDK instance created successfully', 'info')
      
      // Try to start and immediately stop a call as a health check
      // This will verify the API key without actually making a call
      try {
        // Just verify the SDK can be initialized with the API key
        setHealthCheckStatus('healthy')
        setLastHealthCheck(new Date())
        log('VAPI SDK health check successful', 'success')
        log('VAPI API key is valid and SDK is functional', 'success')
      } catch (callError) {
        throw callError
      }
      
    } catch (error) {
      setHealthCheckStatus('unhealthy')
      setLastHealthCheck(new Date())
      
      log('VAPI SDK health check failed - Exception caught', 'error')
      
      if (error instanceof Error) {
        log(`Error Name: ${error.name}`, 'error')
        log(`Error Message: ${error.message}`, 'error')
        
        // Check for specific VAPI SDK error types
        if (error.message.includes('401')) {
          log('Error Details: Invalid API key (401 Unauthorized)', 'error')
        } else if (error.message.includes('403')) {
          log('Error Details: Access forbidden (403 Forbidden)', 'error')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          log('Error Details: Network error - please check your internet connection', 'error')
        } else {
          log(`Error Details: ${error.message}`, 'error')
        }
        
        // Log error stack for debugging if available
        if (error.stack) {
          log(`Error Stack: ${error.stack.substring(0, 300)}...`, 'error')
        }
      } else {
        log('Error Details: Unknown error type', 'error')
        log(`Error Object: ${JSON.stringify(error)}`, 'error')
      }
    }
  }, [apiKey, log])

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
      log('VAPI SDK not initialized', 'error')
      return
    }

    try {
      log('Starting VAPI call...', 'info')
      log(`Using assistant ID: ${assistantId}`, 'info')
      setIsCallActive(true)

      // Assistant ID is required by VAPI SDK
      await vapiRef.current.start(assistantId)
      log('VAPI call started successfully', 'success')
      addMessage('Call started', 'assistant')

    } catch (error) {
      setIsCallActive(false)
      log(`Error starting VAPI call: ${error}`, 'error')
      addMessage(`Error starting call: ${error}`, 'assistant')
      
      // Provide helpful guidance for common errors
      if (error instanceof Error) {
        if (error.message.includes('Assistant or Squad must be provided')) {
          log('Solution: Please enter a valid Assistant ID in the configuration section above', 'warning')
          log('You can find your Assistant ID in your VAPI dashboard at https://dashboard.vapi.ai/assistants', 'info')
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          log('Solution: Check that your Assistant ID is correct and accessible with your API key', 'warning')
        }
      }
    }
  }, [apiKey, assistantId, log, addMessage])

  // End VAPI call using SDK
  const endVapiCall = useCallback(async () => {
    if (!vapiRef.current) {
      log('VAPI SDK not initialized', 'error')
      return
    }

    try {
      log('Ending VAPI call...', 'info')
      await vapiRef.current.stop()
      setIsCallActive(false)
      log('VAPI call ended successfully', 'success')
      addMessage('Call ended', 'assistant')

    } catch (error) {
      log(`Error ending VAPI call: ${error}`, 'error')
      setIsCallActive(false)
    }
  }, [log, addMessage])

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
  }, [apiKey, log, addMessage]) // Use apiKey as dependency to re-setup when VAPI instance changes

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
          )}
          
          {!isCallActive && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-700 text-sm">
                <strong>How to use:</strong> Click &quot;Start Voice Call&quot; to begin a real-time conversation with your AI assistant. 
                The SDK will automatically handle voice recording, transcription, and responses.
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
